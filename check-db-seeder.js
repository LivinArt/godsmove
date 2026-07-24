require('dotenv').config({ path: '.env.local' });
const { prisma } = require('./src/lib/prisma');

async function main() {
  console.log('🌱 Seeding mock orders and return requests...');

  // 1. Get test profile
  const profile = await prisma.profile.findFirst({
    where: { email: 'rishi.malviya@gmail.com' }
  }) || await prisma.profile.findFirst();

  if (!profile) {
    console.error('❌ No profile found to link orders to. Please sign in or seed profiles first.');
    return;
  }
  console.log(`Using profile: ${profile.firstName} ${profile.lastName} (${profile.email})`);

  // 2. Find product variants
  const variants = await prisma.productVariant.findMany({
    take: 3,
    include: { product: true }
  });

  if (variants.length === 0) {
    console.error('❌ No product variants found. Run npm run seed or prisma db seed first.');
    return;
  }

  // 3. Create mock orders
  await prisma.returnItem.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();

  const shippingAddress = {
    firstName: profile.firstName || 'Rishi',
    lastName: profile.lastName || 'Malviya',
    line1: '456 Cyber Hub',
    line2: 'DLF Phase 3',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    phone: '9876543210'
  };

  // Order 1: Completed Order (for returns test)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'GM-ORD-2026-0001',
      profileId: profile.id,
      email: profile.email,
      subtotal: 5998.00,
      discountAmount: 0.00,
      shippingCost: 250.00,
      walletCredit: 0.00,
      total: 6248.00,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      paymentMethod: 'RAZORPAY',
      shippingAddress,
      items: {
        create: [
          {
            variantId: variants[0].id,
            variantSku: variants[0].sku,
            productName: variants[0].product.name,
            size: variants[0].size,
            quantity: 2,
            price: 2999.00,
            total: 5998.00
          }
        ]
      }
    },
    include: { items: true }
  });

  // Order 2: Pending Order (for fulfillment flow test)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'GM-ORD-2026-0002',
      profileId: profile.id,
      email: profile.email,
      subtotal: 2999.00,
      discountAmount: 0.00,
      shippingCost: 0.00,
      walletCredit: 500.00,
      total: 2499.00,
      status: 'PENDING',
      paymentStatus: 'PAID',
      paymentMethod: 'MIXED',
      shippingAddress,
      items: {
        create: [
          {
            variantId: variants[1]?.id || variants[0].id,
            variantSku: variants[1]?.sku || variants[0].sku,
            productName: variants[1]?.product.name || variants[0].product.name,
            size: variants[1]?.size || variants[0].size,
            quantity: 1,
            price: 2999.00,
            total: 2999.00
          }
        ]
      }
    }
  });

  console.log('✅ Created mock orders:', [order1.orderNumber, order2.orderNumber]);

  // 4. Create return request
  const returnRequest = await prisma.returnRequest.create({
    data: {
      orderId: order1.id,
      profileId: profile.id,
      type: 'RETURN_FOR_CREDIT',
      status: 'PENDING',
      reason: 'Fit is too tight around the shoulders. Image uploaded.',
      evidenceUrls: ['/images/sample-evidence.jpg'],
      items: {
        create: [
          {
            orderItemId: order1.items[0].id,
            quantity: 1
          }
        ]
      }
    }
  });

  console.log('✅ Created return request ID:', returnRequest.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
