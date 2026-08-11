import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runAuthOnboardingMatrixTests() {
  const { prisma } = await import('../src/lib/prisma');
  const { isProfileComplete } = await import('../src/lib/profile-utils');

  console.log('====================================================');
  console.log('GODSMOVE — AUTHENTICATION & ONBOARDING REGRESSION MATRIX');
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

  // TEST 1: COMPLETE PROFILE CHECK
  const completeProfile = {
    id: 'test-user-complete',
    email: 'complete.user@example.com',
    firstName: 'Rishi',
    lastName: 'Malviya',
    phone: '+919876543210',
    dob: new Date('1995-05-15'),
    gender: 'Male',
  };
  assert(isProfileComplete(completeProfile) === true, 'TEST 1: Existing Complete User Profile Recognition');

  // TEST 2: BRAND NEW / NULL PROFILE CHECK
  const newProfile = {
    id: 'test-user-new',
    email: 'new.user@example.com',
    firstName: 'new.user',
    lastName: '',
    phone: null,
    dob: null,
    gender: null,
  };
  assert(isProfileComplete(newProfile) === false, 'TEST 2: Brand New User Triggers Onboarding (Missing Phone/DOB/Gender)');

  // TEST 3: PARTIAL PROFILE CHECK (Name + Phone present, DOB + Gender missing)
  const partialProfile = {
    id: 'test-user-partial',
    email: 'partial.user@example.com',
    firstName: 'Rishi',
    phone: '+919876543210',
    dob: null,
    gender: null,
  };
  assert(isProfileComplete(partialProfile) === false, 'TEST 3: Partial Profile Triggers Onboarding (Missing DOB/Gender)');

  // TEST 4: ONBOARDING VALIDATION RULES
  const validatePhone = (p: string) => {
    const clean = p.replace(/\D/g, '');
    const mobileDigits = clean.length === 12 && clean.startsWith('91') ? clean.slice(2) : clean;
    return /^[6-9]\d{9}$/.test(mobileDigits);
  };
  assert(validatePhone('9876543210') === true, 'TEST 4a: Valid 10-digit Indian Mobile Accepted');
  assert(validatePhone('+919876543210') === true, 'TEST 4b: Valid +91 10-digit Indian Mobile Accepted');
  assert(validatePhone('1234567890') === false, 'TEST 4c: Invalid Prefix Mobile Rejected');
  assert(validatePhone('98765') === false, 'TEST 4d: Short Mobile Number Rejected');

  // TEST 5: DATABASE ATOMIC PROFILE CREATION & UPDATE (TEST USER RECONCILIATION)
  const testEmail = 'onboarding.test.qa@godsmove.com';
  try {
    // Cleanup if exists from prior test
    await prisma.profile.deleteMany({ where: { email: testEmail } });

    // Simulate Auth Callback (Initial minimal profile)
    const created = await prisma.profile.create({
      data: {
        id: 'test-qa-onboarding-uuid-101',
        email: testEmail,
        firstName: 'onboarding.test.qa',
        role: 'CUSTOMER',
      },
    });

    assert(isProfileComplete(created) === false, 'TEST 5a: Database Initial OAuth Profile Incomplete');

    // Simulate First-Time Profile Onboarding Save
    const updated = await prisma.profile.update({
      where: { id: created.id },
      data: {
        firstName: 'Rishi Malviya',
        phone: '+919876543210',
        dob: new Date('1998-08-20'),
        gender: 'Male',
      },
    });

    assert(isProfileComplete(updated) === true, 'TEST 5b: Profile Updated to Complete Status');
    assert(updated.email === testEmail, 'TEST 5c: Google Email Remains Authoritative Account Identity');
    assert(updated.gender === 'Male', 'TEST 5d: Gender Successfully Saved to Database Profile');

    // Cleanup
    await prisma.profile.delete({ where: { id: created.id } });
  } catch (err: any) {
    assert(false, 'TEST 5: Database Profile Lifecycle Exception', err.message);
  }

  // TEST 6: ADMIN & CHECKOUT QUERY SYNCHRONIZATION
  try {
    const fields = Object.keys(prisma.profile.fields);
    assert(fields.includes('gender'), 'TEST 6a: schema.prisma Profile contains gender');
    assert(fields.includes('dob'), 'TEST 6b: schema.prisma Profile contains dob');
    assert(fields.includes('phone'), 'TEST 6c: schema.prisma Profile contains phone');
    assert(fields.includes('email'), 'TEST 6d: schema.prisma Profile contains email');
  } catch (err: any) {
    assert(false, 'TEST 6: Field Verification Error', err.message);
  }

  console.log('\n====================================================');
  console.log(`MATRIX VERIFICATION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthOnboardingMatrixTests();
