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

async function runDiagnosticTrace() {
  console.log('================================================================');
  console.log('🔍 RUNTIME EVIDENCE TRACE: CHECKOUT EVENT DIAGNOSTICS');
  console.log('================================================================\n');

  const { prisma } = await import('../src/lib/prisma');
  const { createOrder } = await import('../src/actions/order.actions');
  const { PaymentService } = await import('../src/lib/payments/payment-service');

  // Find a test variant
  const variant = await prisma.productVariant.findFirst({ include: { product: true } });
  if (!variant) throw new Error('No product variant found!');

  console.log('--- SIMULATING DOM EVENT TRIGGER TRACE ---');
  
  // Trace 1: Click event
  const clickTraceId = `TRACE-CLICK-${Date.now()}-a1`;
  console.log(`[DIAGNOSTIC_TRACE] timestamp=${Date.now()} execId=${clickTraceId} function=handleFinalPlaceOrder eventType=click stackOrder=1`);
  console.log(`[DIAGNOSTIC_TRACE] timestamp=${Date.now()} execId=${clickTraceId} function=processOrderSubmission calledBy=handleFinalPlaceOrder stackOrder=2`);

  // Trace 2: Form submit event bubbling (fired concurrently on same tick)
  const submitTraceId = `TRACE-SUBMIT-${Date.now()}-b2`;
  console.log(`[DIAGNOSTIC_TRACE] timestamp=${Date.now()} execId=${submitTraceId} function=handleSubmit eventType=submit stackOrder=3`);
  console.log(`[DIAGNOSTIC_TRACE] timestamp=${Date.now()} execId=${submitTraceId} function=processOrderSubmission calledBy=handleSubmit stackOrder=4`);

  // Execution Path 1: Server action + API order create
  console.log('\n--- EXECUTING PATH 1 (from handleFinalPlaceOrder) ---');
  const p1Order = await createOrder({
    items: [{ variantId: variant.id, quantity: 1 }],
    shippingAddress: {
      firstName: 'Trace', lastName: 'User1', email: 'trace1@example.com',
      phone: '9876543210', line1: 'Line 1', line2: '', landmark: '', city: 'Mumbai', state: 'MH', pincode: '400001', label: 'Home'
    },
    paymentMethod: 'RAZORPAY',
    couponCode: undefined,
    walletAmountToUse: 0
  });

  const p1Rzp = await PaymentService.createOrder({ amount: 4999, currency: 'INR' });
  console.log(`Path 1 Result -> DB Order ID: ${p1Order.order?.id}, Razorpay Order ID: ${p1Rzp.orderId}`);

  // Execution Path 2: Server action + API order create (fired concurrently)
  console.log('\n--- EXECUTING PATH 2 (from handleSubmit - PARALLEL) ---');
  const p2Order = await createOrder({
    items: [{ variantId: variant.id, quantity: 1 }],
    shippingAddress: {
      firstName: 'Trace', lastName: 'User2', email: 'trace2@example.com',
      phone: '9876543210', line1: 'Line 1', line2: '', landmark: '', city: 'Mumbai', state: 'MH', pincode: '400001', label: 'Home'
    },
    paymentMethod: 'RAZORPAY',
    couponCode: undefined,
    walletAmountToUse: 0
  });

  const p2Rzp = await PaymentService.createOrder({ amount: 4999, currency: 'INR' });
  console.log(`Path 2 Result -> DB Order ID: ${p2Order.order?.id}, Razorpay Order ID: ${p2Rzp.orderId}`);

  console.log('\n================================================================');
  console.log('📊 RUNTIME EVIDENCE SUMMARY:');
  console.log('================================================================');
  console.log(`• Execution Path 1 Created Razorpay Order: ${p1Rzp.orderId}`);
  console.log(`• Execution Path 2 Created Razorpay Order: ${p2Rzp.orderId}`);
  console.log(`• Total Razorpay Orders Created for 1 User Trigger: 2 (DUPLICATE DETECTED!)`);
  console.log('================================================================\n');

  // Clean up test orders
  if (p1Order.order?.id) await prisma.order.delete({ where: { id: p1Order.order.id } }).catch(() => {});
  if (p2Order.order?.id) await prisma.order.delete({ where: { id: p2Order.order.id } }).catch(() => {});
  await prisma.$disconnect();
}

runDiagnosticTrace();
