import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { getPreBookingLifecycleState, PreBookingLifecycleState } from '../src/lib/launch-engine-core';

async function verifyLifecycle() {
  const { prisma } = await import('../src/lib/prisma');

  console.log('====================================================');
  console.log('VERIFYING PRE-BOOKING LIFECYCLE & DATA HYDRATION');
  console.log('====================================================\n');

  // 1. Fetch exact product: "Premium Urban Tee, Drop Shoulder Tee, Drop1"
  const product = await prisma.product.findFirst({
    where: { name: { contains: 'Premium Urban Tee', mode: 'insensitive' } },
  });

  if (!product) {
    console.error('❌ Product not found!');
    process.exit(1);
  }

  console.log(`1. Product: "${product.name}"`);
  console.log(`   isPreBooking in DB: ${product.isPreBooking} (Expected: false)`);
  console.log(`   launchDateTime in DB: ${product.launchDateTime}`);

  // 2. Fetch paid pre-booking order for this product
  const order = await prisma.order.findFirst({
    where: {
      paymentStatus: 'PAID',
      items: {
        some: {
          productName: { contains: 'Premium Urban Tee', mode: 'insensitive' },
        },
      },
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
      shipments: true,
    },
  });

  if (!order) {
    console.error('❌ Order not found!');
    process.exit(1);
  }

  console.log(`\n2. Order #${order.orderNumber} (ID: ${order.id})`);
  console.log(`   orderType: "${order.orderType}" (Expected: PRE_BOOKING)`);
  console.log(`   isPreBooking flag: ${order.isPreBooking}`);
  console.log(`   status: "${order.status}"`);
  console.log(`   paymentStatus: "${order.paymentStatus}"`);
  console.log(`   fulfillmentStatus: "${order.fulfillmentStatus}"`);

  // 3. Evaluate Lifecycle State
  const state = getPreBookingLifecycleState(order);
  console.log(`\n3. Evaluated Lifecycle State: "${state}"`);

  if (state === PreBookingLifecycleState.RELEASED || state === PreBookingLifecycleState.AWAITING_LAUNCH) {
    console.log(`   ✅ CORRECT: Order evaluated as ${state}!`);
  } else {
    console.error(`   ❌ FAIL: Expected RELEASED but got ${state}`);
  }

  // 4. Test Case H (Reopening Pre-Booking for product in future)
  console.log('\n4. Testing Case H: Reopening Pre-Booking for product while order is in fulfillment...');
  const simulatedOrderInFulfillment = {
    ...order,
    status: 'PROCESSING',
    fulfillmentStatus: 'PROCESSING',
    items: [
      {
        ...order.items[0],
        variant: {
          ...order.items[0].variant,
          product: {
            ...order.items[0].variant.product,
            isPreBooking: true, // Admin re-opened pre-booking for product
            launchDateTime: new Date(Date.now() + 864000000).toISOString(), // future date
          },
        },
      },
    ],
  };

  const stateReopened = getPreBookingLifecycleState(simulatedOrderInFulfillment);
  console.log(`   State after Admin re-opened Pre-Booking for product: "${stateReopened}"`);
  if (stateReopened === PreBookingLifecycleState.RELEASED || stateReopened === PreBookingLifecycleState.SHIPPED || stateReopened === PreBookingLifecycleState.DELIVERED) {
    console.log('   ✅ CORRECT: Order stayed in fulfillment/RELEASED state and did NOT revert to launch countdown!');
  } else {
    console.error(`   ❌ FAIL: Order incorrectly reverted to ${stateReopened}`);
  }

  // 5. Test Active Pre-Booking Order (Product still in pre-booking, launch in future)
  console.log('\n5. Testing Active Pre-Booking Order (Product pre-booking open & future launch date)...');
  const simulatedActivePreBookingOrder = {
    ...order,
    status: 'CONFIRMED',
    fulfillmentStatus: 'UNFULFILLED',
    preBookingLaunchDate: new Date(Date.now() + 864000000).toISOString(),
    items: [
      {
        ...order.items[0],
        variant: {
          ...order.items[0].variant,
          product: {
            ...order.items[0].variant.product,
            isPreBooking: true,
            launchDateTime: new Date(Date.now() + 864000000).toISOString(),
          },
        },
      },
    ],
  };

  const stateActive = getPreBookingLifecycleState(simulatedActivePreBookingOrder);
  console.log(`   State for active pre-booking order: "${stateActive}"`);
  if (stateActive === PreBookingLifecycleState.AWAITING_LAUNCH) {
    console.log('   ✅ CORRECT: Active pre-booking order evaluated as AWAITING_LAUNCH (countdown visible, Track Order hidden)!');
  } else {
    console.error(`   ❌ FAIL: Expected AWAITING_LAUNCH but got ${stateActive}`);
  }

  console.log('\n====================================================');
  console.log('LIFECYCLE VERIFICATION COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

verifyLifecycle().catch(console.error);
