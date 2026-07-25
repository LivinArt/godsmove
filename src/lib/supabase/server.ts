import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Helper to ensure any logged-in user has an active profile and wallet
async function ensureProfileSynced(userId: string, email: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({ where: { id: userId } });
      if (!profile) {
        // If this is the first user, default to ADMIN; otherwise default to CUSTOMER
        const count = await tx.profile.count();
        const role = count === 0 ? 'ADMIN' : 'CUSTOMER';
        await tx.profile.create({
          data: {
            id: userId,
            email,
            firstName: email.split('@')[0] || 'User',
            lastName: '',
            role,
            tier: 'STANDARD',
          },
        });
      }

      const wallet = await tx.wallet.findUnique({ where: { profileId: userId } });
      if (!wallet) {
        await tx.wallet.create({
          data: {
            profileId: userId,
            balance: 0,
          },
        });
      }
    });
  } catch (err) {
    console.error('Failed to sync profile on server client getUser query:', err);
  }
}

/**
 * Server-side Supabase client — for Server Components, Server Actions, Route Handlers.
 * Uses cookie-based session management via @supabase/ssr.
 * Zero mock sessions or dev overrides.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — handled by middleware
          }
        },
      },
    }
  );

  const originalGetUser = client.auth.getUser.bind(client.auth);
  client.auth.getUser = async (...args: any[]) => {
    const res = await originalGetUser(...args);
    if (res.data?.user) {
      const user = res.data.user;
      await ensureProfileSynced(user.id, user.email || '');
    }
    return res;
  };

  return client;
}

/**
 * Admin Supabase client — uses service role key to bypass RLS.
 * ONLY use in trusted server-side contexts (Server Actions verified as ADMIN).
 * NEVER expose to browser.
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // intentionally ignored in Server Components
          }
        },
      },
    }
  );

  const originalGetUser = client.auth.getUser.bind(client.auth);
  client.auth.getUser = async (...args: any[]) => {
    const res = await originalGetUser(...args);
    if (res.data?.user) {
      const user = res.data.user;
      await ensureProfileSynced(user.id, user.email || '');
    }
    return res;
  };

  return client;
}
