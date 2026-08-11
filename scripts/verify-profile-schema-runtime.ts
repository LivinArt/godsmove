import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runRuntimeProfileSchemaVerification() {
  const { prisma } = await import('../src/lib/prisma');
  const { updateMyProfileOnboarding } = await import('../src/actions/profile.actions');
  const { VALID_GENDERS, isProfileComplete } = await import('../src/lib/profile-utils');

  console.log('====================================================');
  console.log('GODSMOVE — RUNTIME PRISMA PROFILE SCHEMA QA');
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

  // 1. Verify Prisma Client Profile Model Fields Metadata
  try {
    const fields = Object.keys(prisma.profile.fields);
    assert(fields.includes('gender'), 'U1: Runtime Prisma Client includes "gender" field on Profile model');
  } catch (err: any) {
    assert(false, 'U1: Prisma Client Reflection Error', err.message);
  }

  // 2. Controlled DB Mutation & Retrieval
  const testUserId = 'test-qa-runtime-schema-uuid-2026';
  const testEmail = 'runtime.schema.qa@godsmove.com';

  try {
    // Cleanup prior run
    await prisma.profile.deleteMany({ where: { email: testEmail } });

    // Create Initial Profile
    const initial = await prisma.profile.create({
      data: {
        id: testUserId,
        email: testEmail,
        firstName: 'Runtime Tester',
        role: 'CUSTOMER',
      },
    });

    assert(initial.id === testUserId, 'U2a: Initial Profile created in PostgreSQL');

    // Test Male Update
    const maleProfile = await prisma.profile.update({
      where: { id: testUserId },
      data: {
        firstName: 'Runtime Tester',
        phone: '+919876543210',
        dob: new Date('1997-04-22'),
        gender: 'Male',
      },
    });
    assert(maleProfile.gender === 'Male', 'U2b: Runtime Prisma update accepts gender="Male" without error');

    // Read back Male from DB
    const fetchedMale = await prisma.profile.findUnique({ where: { id: testUserId } });
    assert(fetchedMale?.gender === 'Male', 'U2c: Runtime Prisma query returns gender="Male" from database');

    // Test Female Update
    const femaleProfile = await prisma.profile.update({
      where: { id: testUserId },
      data: { gender: 'Female' },
    });
    assert(femaleProfile.gender === 'Female', 'U2d: Runtime Prisma update accepts gender="Female"');

    // Test Prefer not to say Update
    const preferProfile = await prisma.profile.update({
      where: { id: testUserId },
      data: { gender: 'Prefer not to say' },
    });
    assert(preferProfile.gender === 'Prefer not to say', 'U2e: Runtime Prisma update accepts gender="Prefer not to say"');

    // Test Null Update
    const nullProfile = await prisma.profile.update({
      where: { id: testUserId },
      data: { gender: null },
    });
    assert(nullProfile.gender === null, 'U2f: Runtime Prisma update accepts gender=null safely');

    // Cleanup
    await prisma.profile.delete({ where: { id: testUserId } });
  } catch (err: any) {
    assert(false, 'U2: Controlled DB Mutation Exception', err.message);
  }

  // 3. Application Validation Rules (Canonical Gender List)
  assert(VALID_GENDERS.includes('Male'), 'U3a: Canonical genders includes "Male"');
  assert(VALID_GENDERS.includes('Female'), 'U3b: Canonical genders includes "Female"');
  assert(VALID_GENDERS.includes('Prefer not to say'), 'U3c: Canonical genders includes "Prefer not to say"');
  assert(VALID_GENDERS.length === 3, 'U3d: Exactly 3 canonical gender options supported');

  console.log('\n====================================================');
  console.log(`RUNTIME PRISMA VERIFICATION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRuntimeProfileSchemaVerification();
