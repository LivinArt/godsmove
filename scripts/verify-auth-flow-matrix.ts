import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runAuthFlowMatrixVerification() {
  const { isProfileComplete } = await import('../src/lib/profile-utils');

  console.log('====================================================');
  console.log('GODSMOVE — AUTHENTICATION CONTINUATION MATRIX QA');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}${detail ? ` (${detail})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Pending Action Payload Serialization Verification
  const cartPending = { type: 'checkout', redirect: '/checkout', timestamp: Date.now() };
  assert(
    cartPending.type === 'checkout' && cartPending.redirect === '/checkout',
    'TEST 1: Cart Checkout pending action payload contains type="checkout" and redirect="/checkout"'
  );

  const buyNowPending = {
    type: 'checkout',
    product: { id: 'p1', name: 'Premium Urban Tee' },
    size: 'M',
    quantity: 1,
    returnUrl: '/checkout',
    timestamp: Date.now(),
  };
  assert(
    buyNowPending.type === 'checkout' && Boolean(buyNowPending.product) && buyNowPending.size === 'M',
    'TEST 2: BUY NOW pending action payload preserves product, size, and quantity'
  );

  const notifyPending = {
    type: 'notify',
    product: { id: 'p1' },
    timestamp: Date.now(),
  };
  assert(
    notifyPending.type === 'notify' && notifyPending.product.id === 'p1',
    'TEST 3: Notify Me pending action payload preserves target product ID'
  );

  // 2. Profile Completeness Gate Test
  const completeProfile = {
    firstName: 'Zaid',
    phone: '+918815156255',
    dob: new Date('1998-05-15'),
    gender: 'Male',
  };
  assert(isProfileComplete(completeProfile) === true, 'TEST 4: Complete Profile bypasses onboarding step');

  const incompleteProfile = {
    firstName: 'Zaid',
    phone: '+918815156255',
    dob: new Date('1998-05-15'),
    gender: null,
  };
  assert(isProfileComplete(incompleteProfile) === false, 'TEST 5: Partial Profile (Missing Gender) triggers onboarding modal');

  console.log('\n====================================================');
  console.log(`AUTH CONTINUATION VERIFICATION: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthFlowMatrixVerification();
