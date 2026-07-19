import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('=== Profiles in public.profiles ===');
  const profiles = await prisma.profile.findMany();
  profiles.forEach(p => {
    console.log(`- ID: ${p.id} | Email: ${p.email} | GM ID: ${p.godsmoveId} | Role: ${p.role}`);
  });

  console.log('\n=== Users in auth.users ===');
  try {
    const authUsers: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, email, created_at, last_sign_in_at FROM auth.users
    `);
    authUsers.forEach(u => {
      console.log(`- ID: ${u.id} | Email: ${u.email} | Created: ${u.created_at} | Last Sign In: ${u.last_sign_in_at}`);
    });
  } catch (err: any) {
    console.error('Failed to query auth.users:', err.message);
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  });
  console.log('\n=== Orders in Database ===');
  orders.forEach(o => {
    console.log(`- ID: ${o.id} | Order #: ${o.orderNumber} | ProfileID: ${o.profileId} | Email: ${o.email} | Status: ${o.status} | Payment: ${o.paymentStatus}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
