import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import { hasAdminBypass } from '@/lib/admin-auth';
import './admin.css';

export const metadata: Metadata = {
  title: 'Admin · GODSMOVE',
  robots: 'noindex, nofollow',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const bypass = await hasAdminBypass();

  console.log('[Admin Layout Check] Initial Session Check:', {
    userId: user?.id,
    userEmail: user?.email,
    bypassActive: bypass
  });

  if (!user && !bypass) {
    console.log('[Admin Layout Check] REDIRECT REASON: No session and no admin bypass cookie.');
    redirect('/login?redirectTo=/admin');
  }

  let profile = null;
  if (user) {
    profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true, firstName: true, lastName: true, email: true },
    });
    console.log('[Admin Layout Check] Database Profile Lookup:', profile);
  }

  const adminRoles = ['ADMIN', 'CONTENT_EDITOR', 'OPERATIONS', 'SUPPORT', 'MARKETING'];
  if (!bypass && (!profile || !adminRoles.includes(profile.role))) {
    console.log('[Admin Layout Check] REDIRECT REASON: Profile is missing or lacks authorization role.', {
      role: profile?.role,
      expectedRoles: adminRoles
    });
    redirect('/');
  }

  const adminUser = bypass
    ? { name: 'Admin (Bypass)', role: 'ADMIN' as const }
    : {
        name: [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || profile?.email || 'Admin',
        role: profile?.role ?? 'ADMIN',
      };

  return (
    <div className="admin-shell">
      <AdminSidebar role={adminUser.role} />
      <div className="admin-main">
        <AdminHeader user={adminUser} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
