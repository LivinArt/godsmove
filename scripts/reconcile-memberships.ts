import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function main() {
  const { prisma } = await import('../src/lib/prisma');

  console.log('=== STARTING SAFE PRE-BOOKING MEMBERSHIP RECONCILIATION ===');

  // Find all confirmed & paid pre-booking orders
  const confirmedPreBookings = await prisma.order.findMany({
    where: {
      OR: [
        { isPreBooking: true },
        { orderType: 'PRE_BOOKING' },
      ],
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
    },
    orderBy: { createdAt: 'asc' }, // Earliest first
    include: {
      items: true,
    },
  });

  console.log(`Found ${confirmedPreBookings.length} confirmed & paid Pre-Booking orders.`);

  let activatedCount = 0;

  for (const order of confirmedPreBookings) {
    let profileId = order.profileId;

    if (!profileId && order.email) {
      const prof = await prisma.profile.findFirst({
        where: { email: { equals: order.email, mode: 'insensitive' } },
        select: { id: true },
      });
      if (prof) profileId = prof.id;
    }

    if (!profileId) {
      console.log(`⚠️ Order #${order.orderNumber} has no profileId and no matching profile for email "${order.email}". Skipping.`);
      continue;
    }

    // Check if user already has a membership
    const existingMembership = await prisma.membership.findUnique({
      where: { profileId },
    });

    if (existingMembership) {
      console.log(`✓ Profile ${profileId} (${order.email}) already has active membership ID: ${existingMembership.id}`);
      if (!order.membershipActivated) {
        await prisma.order.update({
          where: { id: order.id },
          data: { membershipActivated: true, profileId },
        });
      }
      continue;
    }

    // Activate membership idempotently
    const created = await prisma.membership.create({
      data: {
        profileId,
        status: 'ACTIVE',
        source: 'PRE_BOOKING',
        sourceOrderId: order.id,
        tier: 'VIP',
        activatedAt: order.paidAt || order.createdAt || new Date(),
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { membershipActivated: true, profileId },
    });

    activatedCount++;
    console.log(`✅ Activated Membership for ${order.email} (Order #${order.orderNumber}, Membership ID: ${created.id})`);
  }

  console.log(`=== RECONCILIATION COMPLETE. Activated ${activatedCount} new memberships. ===`);
}

main()
  .catch(console.error);
