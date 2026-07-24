import { cookies } from 'next/headers';

export async function hasAdminBypass() {
  const cookieStore = await cookies();
  const bypassCookie = cookieStore.get('admin_bypass')?.value;
  return bypassCookie === process.env.ADMIN_SECRET;
}
