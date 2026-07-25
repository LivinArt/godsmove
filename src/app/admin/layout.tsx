import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
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

  if (!user) {
    redirect('/login?redirectTo=/admin');
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true, firstName: true, lastName: true, email: true },
  });

  const adminRoles = ['ADMIN', 'CONTENT_EDITOR', 'OPERATIONS', 'SUPPORT', 'MARKETING'];
  if (!profile || !adminRoles.includes(profile.role)) {
    redirect('/');
  }

  const adminUser = {
    name: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email || 'Admin',
    role: profile.role as any,
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
