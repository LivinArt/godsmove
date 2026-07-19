'use client';

import { createBrowserClient } from '@supabase/ssr';

const mockAdminUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'admin@godsmove.com',
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

/**
 * Browser-side Supabase client — for Client Components only.
 * Uses the public anon key (safe for browser).
 */
export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    const originalGetUser = client.auth.getUser.bind(client.auth);
    const originalGetSession = client.auth.getSession.bind(client.auth);
    const originalOnAuthStateChange = client.auth.onAuthStateChange.bind(client.auth);
    const originalSignInWithPassword = client.auth.signInWithPassword.bind(client.auth);
    const originalSignOut = client.auth.signOut.bind(client.auth);

    const getActiveMockUser = () => {
      const isUser = typeof document !== 'undefined' && document.cookie.includes('gm_dev_role=USER');
      return isUser ? mockCustomerUser : mockAdminUser;
    };

    client.auth.getUser = async (...args) => {
      const res = await originalGetUser(...args);
      if (res.data?.user) return res;
      
      const isLoggedOut = typeof document !== 'undefined' && document.cookie.includes('gm_logged_out=true');
      if (isLoggedOut) {
        return { data: { user: null }, error: null };
      }
      return { data: { user: getActiveMockUser() as any }, error: null };
    };

    client.auth.getSession = async (...args) => {
      const res = await originalGetSession(...args);
      if (res.data?.session) return res;

      const isLoggedOut = typeof document !== 'undefined' && document.cookie.includes('gm_logged_out=true');
      if (isLoggedOut) {
        return { data: { session: null }, error: null };
      }
      const user = getActiveMockUser();
      return { data: { session: { user } as any }, error: null };
    };

    client.auth.signInWithPassword = async (credentials: any) => {
      const email = credentials.email;
      if (typeof document !== 'undefined') {
        if (email === 'admin@godsmove.com' || email === 'dev@godsmove.com') {
          document.cookie = 'gm_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
          document.cookie = 'gm_dev_role=ADMIN; path=/; max-age=604800;';
          return { data: { user: mockAdminUser, session: { user: mockAdminUser } as any }, error: null };
        } else {
          document.cookie = 'gm_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
          document.cookie = 'gm_dev_role=USER; path=/; max-age=604800;';
          return { data: { user: mockCustomerUser, session: { user: mockCustomerUser } as any }, error: null };
        }
      }
      return originalSignInWithPassword(credentials);
    };

    client.auth.signOut = async (...args) => {
      if (typeof document !== 'undefined') {
        document.cookie = 'gm_logged_out=true; path=/; max-age=3600';
        document.cookie = 'gm_dev_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      }
      try {
        await originalSignOut(...args);
      } catch {}
      return { error: null };
    };

    client.auth.onAuthStateChange = (callback: any) => {
      const { data: { subscription } } = originalOnAuthStateChange((event, session) => {
        if (session) {
          if (typeof document !== 'undefined') {
            document.cookie = 'gm_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
          callback(event, session);
        } else {
          const isLoggedOut = typeof document !== 'undefined' && document.cookie.includes('gm_logged_out=true');
          if (isLoggedOut) {
            callback('SIGNED_OUT', null);
          } else {
            callback('SIGNED_IN', { user: getActiveMockUser() as any });
          }
        }
      });
      return { data: { subscription } } as any;
    };
  }

  return client;
}
