import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const SUPER_ADMIN_EMAIL = 'livinarttech@gmail.com';

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.trim().toLowerCase();
}

/**
 * Checks if current user is an authenticated Super Administrator.
 */
export async function hasAdminBypass(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user && isSuperAdminEmail(user.email);
  } catch {
    return false;
  }
}

/**
 * Verifies authentic Supabase session, Super Admin email, and Prisma ADMIN role.
 * Throws an Error if unauthorized.
 */
export async function requireAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('UNAUTHORIZED: No active user session');
  }

  if (!isSuperAdminEmail(user.email)) {
    throw new Error(`FORBIDDEN: Email '${user.email}' is not authorized to access GODSMOVE Admin`);
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true, email: true, firstName: true, lastName: true },
  });

  const adminRoles = ['ADMIN', 'CONTENT_EDITOR', 'OPERATIONS', 'SUPPORT', 'MARKETING'];
  if (!profile || !adminRoles.includes(profile.role)) {
    throw new Error(`FORBIDDEN: Role '${profile?.role || 'NONE'}' is not an authorized Admin role`);
  }

  return { user, profile };
}
