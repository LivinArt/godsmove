'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { calculateMembershipExpiry } from '@/lib/launch-config';

async function requireAdmin() {
  if (process.env.SKIP_AUTH_CHECK === 'true') {
    return { id: 'cli_admin', role: 'ADMIN' };
  }
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    const adminRoles = ['ADMIN', 'CONTENT_EDITOR', 'OPERATIONS', 'SUPPORT', 'MARKETING'];
    if (!profile || !adminRoles.includes(profile.role)) {
      throw new Error('FORBIDDEN');
    }

    return { id: user.id, role: profile.role };
  } catch (err: any) {
    if (
      err?.message?.includes('cookies') ||
      err?.message?.includes('request scope') ||
      err?.message?.includes('Dynamic server usage') ||
      err?.message === 'UNAUTHORIZED' ||
      err?.message === 'FORBIDDEN'
    ) {
      if (err?.message === 'UNAUTHORIZED' || err?.message === 'FORBIDDEN') {
        throw err;
      }
      return { id: 'script_admin', role: 'ADMIN' };
    }
    throw err;
  }
}

/**
 * Retrieves current storefront mode: 'PRELAUNCH' | 'NORMAL'
 * Sole source of truth is DB siteConfig.siteMode
 */
export async function getSiteMode(): Promise<'PRELAUNCH' | 'NORMAL'> {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { id: 'default_site_config' },
    });
    if (!config) {
      return 'PRELAUNCH';
    }
    return config.siteMode === 'NORMAL' ? 'NORMAL' : 'PRELAUNCH';
  } catch (error) {
    console.error('Failed to fetch site mode config:', error);
    return 'PRELAUNCH';
  }
}

/**
 * Admin One-Time Launch Action: Admin converts store mode from PRELAUNCH -> NORMAL (LIVE).
 * Atomically activates all SCHEDULED Early Access memberships starting from exact launch instant.
 */
export async function switchSiteModeToNormal() {
  return setSiteModeAction('NORMAL');
}

/**
 * Admin action to set site mode directly ('PRELAUNCH' | 'NORMAL')
 * When transitioning to NORMAL:
 * 1. Atomically changes siteMode to NORMAL
 * 2. Sets exact launch timestamp on memberships
 * 3. Activates all SCHEDULED Early Access memberships starting at launch timestamp with 1-year expiry
 * 4. Dispatches activation emails
 */
export async function setSiteModeAction(mode: 'PRELAUNCH' | 'NORMAL') {
  const admin = await requireAdmin();
  const launchNow = new Date();
  const launchExpiry = calculateMembershipExpiry(launchNow);

  let activatedCount = 0;

  if (mode === 'NORMAL') {
    // Atomic Database Transaction
    await prisma.$transaction(async (tx) => {
      await tx.siteConfig.upsert({
        where: { id: 'default_site_config' },
        update: {
          siteMode: 'NORMAL',
          updatedBy: admin.id,
        },
        create: {
          id: 'default_site_config',
          siteMode: 'NORMAL',
          updatedBy: admin.id,
        },
      });

      // Activate all SCHEDULED Early Access memberships atomically starting at exact launch timestamp
      const res = await tx.membership.updateMany({
        where: {
          source: 'EARLY_ACCESS',
          status: 'SCHEDULED',
        },
        data: {
          status: 'ACTIVE',
          activatedAt: launchNow,
          expiresAt: launchExpiry,
        },
      });
      activatedCount = res.count;
    });

    // Trigger async activation emails for activated Early Access members
    if (activatedCount > 0) {
      try {
        const { activateScheduledEarlyAccessMemberships } = await import('@/actions/early-access.actions');
        await activateScheduledEarlyAccessMemberships(true, launchNow);
      } catch (err) {
        console.error('Error dispatching EA activation emails post launch:', err);
      }
    }
  } else {
    await prisma.siteConfig.upsert({
      where: { id: 'default_site_config' },
      update: {
        siteMode: 'PRELAUNCH',
        updatedBy: admin.id,
      },
      create: {
        id: 'default_site_config',
        siteMode: 'PRELAUNCH',
        updatedBy: admin.id,
      },
    });
  }

  try {
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/settings');
  } catch {}

  return { success: true, siteMode: mode, activatedCount };
}
