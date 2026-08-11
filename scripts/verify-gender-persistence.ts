import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runGenderPersistenceVerification() {
  const { prisma } = await import('../src/lib/prisma');
  const { isProfileComplete } = await import('../src/lib/profile-utils');

  console.log('====================================================');
  console.log('GODSMOVE — GENDER PERSISTENCE & DATABASE INTEGRITY QA');
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

  // TEST 1: PRISMA MODEL & CLIENT SPECIFICATION
  try {
    const fields = Object.keys(prisma.profile.fields);
    assert(fields.includes('gender'), 'TEST 1: Generated Prisma Client Profile model includes gender field');
  } catch (err: any) {
    assert(false, 'TEST 1: Prisma Client Reflection Error', err.message);
  }

  // TEST 2: PHYSICAL SUPABASE POSTGRESQL TABLE COLUMN AUDIT
  try {
    const rawCols: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'profiles' AND column_name = 'gender'
    `;
    assert(
      Array.isArray(rawCols) && rawCols.length > 0 && rawCols[0].column_name === 'gender',
      'TEST 2: Physical PostgreSQL "profiles" table contains "gender" column in Supabase DB'
    );
  } catch (err: any) {
    assert(false, 'TEST 2: PostgreSQL Schema Query Error', err.message);
  }

  // TEST 3 - 6: GENDER VALUES PERSISTENCE VIA PRISMA CLIENT DB WRITES & READS
  const testUserId = 'test-qa-gender-uuid-2026';
  const testEmail = 'gender.qa.test@godsmove.com';

  try {
    // Cleanup prior run
    await prisma.profile.deleteMany({ where: { email: testEmail } });

    // Initial Profile Create
    await prisma.profile.create({
      data: {
        id: testUserId,
        email: testEmail,
        firstName: 'QA Tester',
        role: 'CUSTOMER',
      },
    });

    // 3. Test Male Persistence
    const maleRes = await prisma.profile.update({
      where: { id: testUserId },
      data: {
        firstName: 'QA Tester',
        phone: '+919876543210',
        dob: new Date('1996-06-12'),
        gender: 'Male',
      },
    });
    const verifyMale = await prisma.profile.findUnique({ where: { id: testUserId } });
    assert(verifyMale?.gender === 'Male', 'TEST 3: Gender "Male" successfully persisted and queried from DB');

    // 4. Test Female Persistence
    await prisma.profile.update({
      where: { id: testUserId },
      data: { gender: 'Female' },
    });
    const verifyFemale = await prisma.profile.findUnique({ where: { id: testUserId } });
    assert(verifyFemale?.gender === 'Female', 'TEST 4: Gender "Female" successfully persisted and queried from DB');

    // 5. Test "Prefer not to say" Persistence
    await prisma.profile.update({
      where: { id: testUserId },
      data: { gender: 'Prefer not to say' },
    });
    const verifyPrefer = await prisma.profile.findUnique({ where: { id: testUserId } });
    assert(verifyPrefer?.gender === 'Prefer not to say', 'TEST 5: Gender "Prefer not to say" successfully persisted and queried from DB');

    // 6. Test Nullable Gender Safety
    await prisma.profile.update({
      where: { id: testUserId },
      data: { gender: null },
    });
    const verifyNull = await prisma.profile.findUnique({ where: { id: testUserId } });
    assert(verifyNull?.gender === null, 'TEST 6: Nullable gender=null handled safely without DB or runtime errors');

    // Cleanup
    await prisma.profile.delete({ where: { id: testUserId } });
  } catch (err: any) {
    assert(false, 'TEST 3-6: Database Persistence Execution Exception', err.message);
  }

  // TEST 7: COMPLETE PROFILE DETERMINATION
  const completeProf = {
    firstName: 'Rishi',
    phone: '+919876543210',
    dob: new Date('1998-01-01'),
    gender: 'Male',
  };
  assert(isProfileComplete(completeProf) === true, 'TEST 7: Complete Profile correctly evaluates to TRUE');

  // TEST 8: PARTIAL PROFILE DETERMINATION (Missing Gender)
  const partialProf = {
    firstName: 'Rishi',
    phone: '+919876543210',
    dob: new Date('1998-01-01'),
    gender: null,
  };
  assert(isProfileComplete(partialProf) === false, 'TEST 8: Partial Profile (Missing Gender) evaluates to FALSE (triggers onboarding)');

  console.log('\n====================================================');
  console.log(`GENDER PERSISTENCE VERIFICATION: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runGenderPersistenceVerification();
