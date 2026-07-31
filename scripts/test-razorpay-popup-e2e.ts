import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Bypass server-only check for standalone CLI test environment
require.cache[require.resolve('server-only')] = {
  id: require.resolve('server-only'),
  filename: require.resolve('server-only'),
  loaded: true,
  exports: {},
} as any;

async function runRazorpayE2ETest() {
  console.log('================================================================');
  console.log('🚀 GODSMOVE — RAZORPAY INTEGRATION & PAYMENT E2E TEST');
  console.log('================================================================\n');

  const { prisma } = await import('../src/lib/prisma');
  const { PaymentService } = await import('../src/lib/payments/payment-service');
  const { confirmOrder } = await import('../src/actions/order.actions');

  let testOrderId: string | null = null;

  try {
    // ----------------------------------------------------------------
    // STEP 1: Create Payment Gateway Order via PaymentService
    // ----------------------------------------------------------------
    console.log('--- STEP 1: Creating Razorpay Order via PaymentService ---');
    const testAmount = 4999;
    const razorpayOrder = await PaymentService.createOrder({
      amount: testAmount,
      currency: 'INR',
    });

    console.log('✅ Razorpay Order Created:');
    console.log(`   - Razorpay Order ID: ${razorpayOrder.orderId}`);
    console.log(`   - Amount (Subunits/Paise): ${razorpayOrder.amount} (₹${testAmount})`);
    console.log(`   - Currency: ${razorpayOrder.currency}`);
    console.log(`   - Key ID: ${razorpayOrder.key}`);

    if (!razorpayOrder.orderId.startsWith('order_')) {
      throw new Error(`Invalid Razorpay Order ID format: ${razorpayOrder.orderId}`);
    }

    // ----------------------------------------------------------------
    // STEP 2: Create Internal E-Commerce Order in Database
    // ----------------------------------------------------------------
    console.log('\n--- STEP 2: Creating Internal DB Order ---');
    
    // Find or create product variant
    let variant = await prisma.productVariant.findFirst({
      include: { product: true }
    });

    if (!variant) {
      throw new Error('No product variants found in DB to attach test order item!');
    }

    const orderNumber = `GM-ORD-TEST-${Date.now()}`;
    const dbOrder = await prisma.order.create({
      data: {
        orderNumber,
        email: 'test.customer@godsmove.com',
        shippingAddress: {
          firstName: 'Vikram',
          lastName: 'Mehta',
          line1: '42 Marine Drive',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400020',
          phone: '9876543210'
        },
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: 'RAZORPAY',
        subtotal: testAmount,
        shippingCost: 0,
        codFee: 0,
        discountAmount: 0,
        total: testAmount,
        notes: 'Razorpay E2E Test Order',
        items: {
          create: [
            {
              variantId: variant.id,
              productName: variant.product.name,
              variantSku: variant.sku,
              size: variant.size,
              color: variant.color || 'Black',
              price: testAmount,
              quantity: 1,
              total: testAmount,
            }
          ]
        }
      }
    });

    testOrderId = dbOrder.id;
    console.log(`✅ DB Order Created: ID ${dbOrder.id}, Order Number ${dbOrder.orderNumber}`);

    // ----------------------------------------------------------------
    // STEP 3: Simulate Successful Razorpay Checkout Payment Confirmation
    // ----------------------------------------------------------------
    console.log('\n--- STEP 3: Simulating Razorpay Checkout Callback & Payment Confirmation ---');
    const mockPaymentId = `pay_rzp_test_${Date.now()}`;
    
    const confirmResult = await confirmOrder(
      dbOrder.id,
      mockPaymentId,
      razorpayOrder.orderId
    );

    if (!confirmResult.success) {
      throw new Error(`Order confirmation failed: ${confirmResult.error}`);
    }

    console.log(`✅ Order Confirmation Action Executed Successfully.`);

    // ----------------------------------------------------------------
    // STEP 4: Verify Order Ledger & Payment Status in DB
    // ----------------------------------------------------------------
    console.log('\n--- STEP 4: Verifying Final Order Ledger in DB ---');
    const verifiedOrder = await prisma.order.findUnique({
      where: { id: dbOrder.id },
      include: { items: true }
    });

    if (!verifiedOrder) throw new Error('Failed to retrieve verified order from DB!');

    console.log(`   - Order Status: ${verifiedOrder.status} (Expected: CONFIRMED)`);
    console.log(`   - Payment Status: ${verifiedOrder.paymentStatus} (Expected: PAID)`);
    console.log(`   - Razorpay Payment ID: ${verifiedOrder.razorpayPaymentId}`);
    console.log(`   - Razorpay Order ID: ${verifiedOrder.razorpayOrderId}`);
    console.log(`   - Paid At: ${verifiedOrder.paidAt}`);

    if (verifiedOrder.status !== 'CONFIRMED' || verifiedOrder.paymentStatus !== 'PAID') {
      throw new Error(`Database verification failed! Status: ${verifiedOrder.status}, PaymentStatus: ${verifiedOrder.paymentStatus}`);
    }

    if (verifiedOrder.razorpayPaymentId !== mockPaymentId || verifiedOrder.razorpayOrderId !== razorpayOrder.orderId) {
      throw new Error('Razorpay transaction IDs mismatch in database!');
    }

    console.log('\n================================================================');
    console.log('🎉 FIRST RAZORPAY TEST PAYMENT & INTEGRATION COMPLETED 100% SUCCESSFULLY!');
    console.log('================================================================\n');

  } catch (err: any) {
    console.error('❌ RAZORPAY E2E TEST FAILED:', err);
    process.exit(1);
  } finally {
    if (testOrderId) {
      await prisma.order.delete({ where: { id: testOrderId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runRazorpayE2ETest();
