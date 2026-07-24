import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Helper to ensure the development profiles and wallets exist in the DB
async function ensureDevUsersExist() {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') return;
  try {
    const devId = '00000000-0000-0000-0000-000000000000';
    await prisma.profile.upsert({
      where: { id: devId },
      update: { role: 'ADMIN' },
      create: {
        id: devId,
        email: 'dev@godsmove.com',
        firstName: 'Dev',
        lastName: 'User',
        phone: '9876543210',
        role: 'ADMIN',
        tier: 'STANDARD',
        marketingEmails: true,
        orderUpdateEmails: true,
      },
    });

    await prisma.wallet.upsert({
      where: { profileId: devId },
      update: {},
      create: {
        profileId: devId,
        balance: 100000, // ₹1,00,000 for local testing
      },
    });

    const customerId = '11111111-1111-1111-1111-111111111111';
    await prisma.profile.upsert({
      where: { id: customerId },
      update: {},
      create: {
        id: customerId,
        email: 'customer@godsmove.com',
        firstName: 'Customer',
        lastName: 'User',
        phone: '9999999999',
        role: 'CUSTOMER',
        tier: 'STANDARD',
        marketingEmails: true,
        orderUpdateEmails: true,
      },
    });

    await prisma.wallet.upsert({
      where: { profileId: customerId },
      update: {},
      create: {
        profileId: customerId,
        balance: 5000, // ₹5,000 for customer testing
      },
    });
  } catch (err) {
    console.error('Failed to ensure dev users exist in database:', err);
  }
}

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

const mockAdminUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'dev@godsmove.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
};

const mockCustomerUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'customer@godsmove.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
};

function wrapWithMockAuth(client: any, cookieStore: any) {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') return client;

  const originalGetUser = client.auth.getUser.bind(client.auth);
  const originalGetSession = client.auth.getSession.bind(client.auth);

  const getActiveMockUser = () => {
    const role = cookieStore.get('gm_dev_role')?.value;
    return role === 'USER' ? mockCustomerUser : mockAdminUser;
  };

  client.auth.getUser = async (...args: any[]) => {
    const res = await originalGetUser(...args);
    if (res.data?.user) return res;

    const isLoggedOut = cookieStore.get('gm_logged_out')?.value === 'true';
    if (isLoggedOut) {
      return { data: { user: null }, error: null };
    }
    return { data: { user: getActiveMockUser() as any }, error: null };
  };

  client.auth.getSession = async (...args: any[]) => {
    const res = await originalGetSession(...args);
    if (res.data?.session) return res;

    const isLoggedOut = cookieStore.get('gm_logged_out')?.value === 'true';
    if (isLoggedOut) {
      return { data: { session: null }, error: null };
    }
    const user = getActiveMockUser();
    return { data: { session: { user } as any }, error: null };
  };

  return client;
}

/**
 * Server-side Supabase client — for Server Components, Server Actions, Route Handlers.
 * Uses cookie-based session management via @supabase/ssr.
 */
export async function createClient() {
  await ensureDevUsersExist();
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
            // setAll called from a Server Component — can be safely ignored
            // Middleware handles cookie refresh
          }
        },
      },
    }
  );

  const wrapped = wrapWithMockAuth(client, cookieStore);

  const originalGetUser = wrapped.auth.getUser.bind(wrapped.auth);
  wrapped.auth.getUser = async (...args: any[]) => {
    const res = await originalGetUser(...args);
    if (res.data?.user) {
      const user = res.data.user;
      if (user.id !== '00000000-0000-0000-0000-000000000000' && user.id !== '11111111-1111-1111-1111-111111111111') {
        await ensureProfileSynced(user.id, user.email || '');
      }
    }
    return res;
  };

  return wrapped;
}

/**
 * Admin Supabase client — uses service role key to bypass RLS.
 * ONLY use in trusted server-side contexts (Server Actions verified as ADMIN).
 * NEVER expose to browser.
 */
export async function createAdminClient() {
  await ensureDevUsersExist();
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

  const wrapped = wrapWithMockAuth(client, cookieStore);

  const originalGetUser = wrapped.auth.getUser.bind(wrapped.auth);
  wrapped.auth.getUser = async (...args: any[]) => {
    const res = await originalGetUser(...args);
    if (res.data?.user) {
      const user = res.data.user;
      if (user.id !== '00000000-0000-0000-0000-000000000000' && user.id !== '11111111-1111-1111-1111-111111111111') {
        await ensureProfileSynced(user.id, user.email || '');
      }
    }
    return res;
  };

  return wrapped;
}
