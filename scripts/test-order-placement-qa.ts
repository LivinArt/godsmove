import { prisma } from '../src/lib/prisma';
import { createOrder } from '../src/actions/order.actions';
import { getCodSettings, updateCodSettings } from '../src/actions/cod.actions';
import { PricingEngine } from '../src/lib/pricing-engine';
import { resolveOrderItemImageUrl } from '../src/lib/image-resolver';

async function runOrderPlacementQA() {
  console.log('\n====================================================================');
  console.log('🧪 RUNNING GODSMOVE ORDER PLACEMENT, COD SYNC & PERF QA SUITE');
  console.log('====================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
      failedTests++;
    }
  }

  try {
    // 1. Fetch active test variant
    const variant = await prisma.productVariant.findFirst({
      where: {
        product: { status: 'ACTIVE', isPreBooking: false },
        price: { gt: 0 },
      },
      include: {
        product: true,
        inventory: true,
      },
    });

    if (!variant) {
      console.error('❌ [ERROR] No active test variant found in database.');
      process.exit(1);
    }

    console.log(`📍 Test Variant: ${variant.product.name} (${variant.size}) — Price: ₹${variant.price}`);

    // 2. Test COD Config Dynamic Synchronization
    console.log('\n--- 1. Testing Dynamic COD Handling Fee Synchronization ---');
    
    // Set COD fee to ₹149 dynamically
    await updateCodSettings({
      isEnabled: true,
      chargeType: 'FIXED',
      chargeValue: 149,
      displayLabel: 'Cash on Delivery Handling Fee',
    });

    const codConfig = await getCodSettings();
    assert(codConfig.chargeValue === 149, 'Admin COD Fee configuration set to ₹149');

    // Create a COD Order and measure timing
    const startTime = performance.now();
    const orderRes = await createOrder({
      items: [{ variantId: variant.id, quantity: 1 }],
      shippingAddress: {
        firstName: 'QA',
        lastName: 'Tester',
        email: 'qa.test@godsmove.in',
        phone: '9999999999',
        line1: '123 Test Street',
        line2: '',
        landmark: '',
        city: 'Gurugram',
        state: 'Haryana',
        pincode: '122001',
        label: 'Home',
      },
      paymentMethod: 'COD',
      couponCode: undefined,
      walletAmountToUse: 0,
    });
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    assert(orderRes.success && !!orderRes.order, 'COD Order Placement Succeeded');
    console.log(`⏱️  Order Placement Execution Duration: ${duration} ms`);
    assert(duration < 5000, `Order Placement Latency is Fast (<5000ms, actual: ${duration}ms)`);

    const order = orderRes.order;
    if (order) {
      assert(Number(order.codFee) === 149, 'Order record has correct dynamic COD Fee (₹149)');

      // Verify item image snapshot
      const firstItem = order.items && order.items[0];
      assert(!!firstItem, 'Order contains item snapshot');
      
      const resolvedImg = resolveOrderItemImageUrl(firstItem);
      assert(typeof resolvedImg === 'string' && resolvedImg.length > 0 && !resolvedImg.includes('undefined'), 'Order Item image URL resolved successfully', resolvedImg);

      // Clean up test order
      await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
    }

    // 3. Test PricingEngine canonical calculation consistency
    console.log('\n--- 2. Testing Canonical Pricing Engine Synchronization ---');
    const pricingCalc = PricingEngine.calculate({
      items: [{ price: 5999, quantity: 1, productName: 'Test Piece' }],
      codFee: 149,
      shippingState: 'Haryana',
    });

    assert(pricingCalc.subtotal === 5999, 'PricingEngine Subtotal matches ₹5,999');
    assert(pricingCalc.codFee === 149, 'PricingEngine COD Fee matches ₹149');
    assert(pricingCalc.grandTotal === (5999 + pricingCalc.shippingCost + 149), 'PricingEngine Grand Total equals Subtotal + Shipping + COD Fee');

    // 4. Test Zero-Payable / Wallet calculation
    console.log('\n--- 3. Testing Wallet Zero-Payable Order Calculation ---');
    const walletPricing = PricingEngine.calculate({
      items: [{ price: 2000, quantity: 1, productName: 'Test Piece' }],
      walletAmountToUse: 2000,
      shippingState: 'Haryana',
    });
    assert(walletPricing.walletCredit === 2000, 'Wallet credit covers total subtotal');
    assert(walletPricing.finalPayable === 0, 'Final payable is zero');

    console.log('\n====================================================================');
    console.log(`📊 QA RESULT SUMMARY: ${passedTests} PASSED / ${failedTests} FAILED`);
    console.log('====================================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ QA Execution Error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runOrderPlacementQA();
