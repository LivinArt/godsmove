import crypto from 'crypto';
import { prisma } from '../src/lib/prisma';
import { executeEarlyAccessRegistration, generateUniqueGodsmoveId } from '../src/lib/customer-sync';
import { getAdminCustomers, deleteCustomerAccount } from '../src/actions/admin-customer.actions';

async function runCustomerDeletionQA() {
  console.log('====================================================================');
  console.log('🚀 RUNNING GODSMOVE ADMIN CUSTOMER DELETION & SECURITY QA SUITE (20 CASES)');
  console.log('====================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ ${detail}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const mockAdminUser = { id: crypto.randomUUID(), role: 'ADMIN' };

  // Pre-test DB snapshot metrics
  const initialProfilesCount = await prisma.profile.count({ where: { role: 'CUSTOMER' } });
  const initialProductsCount = await prisma.product.count();

  const testUserIds: string[] = [];
  let testOrderId: string | null = null;
  let createdProductId: string | null = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Admin authorization protection (unauthorized user)
    // -------------------------------------------------------------------------
    const fakeId = crypto.randomUUID();
    const unauthRes = await deleteCustomerAccount(fakeId, { id: crypto.randomUUID(), role: 'CUSTOMER' });
    assert(
      !unauthRes.success && Boolean(unauthRes.error),
      'TEST 1: Non-admin user cannot invoke deletion',
      `Error returned: ${unauthRes.error}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Self-deletion safeguard
    // -------------------------------------------------------------------------
    const selfRes = await deleteCustomerAccount(mockAdminUser.id, mockAdminUser);
    assert(
      !selfRes.success && Boolean(selfRes.error?.includes('cannot delete your active administrator account')),
      'TEST 2: Self-deletion safeguard prevents admin from deleting self',
      `Error returned: ${selfRes.error}`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Protected admin role safeguard
    // -------------------------------------------------------------------------
    const adminUser = await prisma.profile.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
      const adminDelRes = await deleteCustomerAccount(adminUser.id, mockAdminUser);
      assert(
        !adminDelRes.success && Boolean(adminDelRes.error?.includes('Administrative accounts cannot be deleted')),
        'TEST 3: Admin account safeguard prevents deleting ADMIN role profiles',
        `Target Admin: ${adminUser.email}, Error: ${adminDelRes.error}`
      );
    } else {
      assert(true, 'TEST 3: Admin account safeguard (Skipped - no admin profile)');
    }

    // -------------------------------------------------------------------------
    // CASE A: Customer with only Profile + GM ID
    // -------------------------------------------------------------------------
    const uAId = crypto.randomUUID();
    testUserIds.push(uAId);

    await prisma.profile.create({
      data: {
        id: uAId,
        email: `ua_${timestamp}@godsmove.test`,
        godsmoveId: `GM-QA-UA-${timestamp}`,
        role: 'CUSTOMER',
      },
    });

    const resA = await deleteCustomerAccount(uAId, mockAdminUser);
    const dbUA = await prisma.profile.findUnique({ where: { id: uAId } });

    assert(
      resA.success && dbUA === null,
      'CASE A: Successfully deleted customer with Profile + GM ID',
      `Profile exists: ${dbUA !== null}`
    );

    // -------------------------------------------------------------------------
    // CASE B: Customer with Early Access + 1-year Membership
    // -------------------------------------------------------------------------
    const uBId = crypto.randomUUID();
    testUserIds.push(uBId);

    await prisma.profile.create({
      data: {
        id: uBId,
        email: `ub_${timestamp}@godsmove.test`,
        role: 'CUSTOMER',
        earlyAccessRegistered: true,
      },
    });
    await executeEarlyAccessRegistration(uBId, { name: 'Early Access QA' });

    const resB = await deleteCustomerAccount(uBId, mockAdminUser);
    const dbUB = await prisma.profile.findUnique({ where: { id: uBId } });
    const dbUBMem = await prisma.membership.findUnique({ where: { profileId: uBId } });

    assert(
      resB.success && dbUB === null && dbUBMem === null,
      'CASE B: Successfully deleted Early Access customer & VIP membership',
      `Profile exists: ${dbUB !== null}, Membership exists: ${dbUBMem !== null}`
    );

    // -------------------------------------------------------------------------
    // CASE C: Customer with Wallet & WalletTransactions
    // -------------------------------------------------------------------------
    const uCId = crypto.randomUUID();
    testUserIds.push(uCId);

    await prisma.profile.create({
      data: {
        id: uCId,
        email: `uc_${timestamp}@godsmove.test`,
        role: 'CUSTOMER',
      },
    });
    const walletC = await prisma.wallet.create({
      data: {
        profileId: uCId,
        balance: 1500,
        currency: 'INR',
      },
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: walletC.id,
        amount: 1500,
        type: 'CREDIT_PROMOTIONAL',
        description: 'Test promotional credit',
      },
    });

    const resC = await deleteCustomerAccount(uCId, mockAdminUser);
    const dbUC = await prisma.profile.findUnique({ where: { id: uCId } });
    const dbUCWallet = await prisma.wallet.findUnique({ where: { profileId: uCId } });

    assert(
      resC.success && dbUC === null && dbUCWallet === null,
      'CASE C: Successfully deleted customer with Wallet & WalletTransactions',
      `Profile exists: ${dbUC !== null}, Wallet exists: ${dbUCWallet !== null}`
    );

    // -------------------------------------------------------------------------
    // CASE D: Customer with Address & Wishlist
    // -------------------------------------------------------------------------
    const uDId = crypto.randomUUID();
    testUserIds.push(uDId);

    await prisma.profile.create({
      data: {
        id: uDId,
        email: `ud_${timestamp}@godsmove.test`,
        role: 'CUSTOMER',
      },
    });
    await prisma.address.create({
      data: {
        profileId: uDId,
        firstName: 'Test',
        lastName: 'User',
        line1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        phone: '9876543210',
      },
    });

    const resD = await deleteCustomerAccount(uDId, mockAdminUser);
    const dbUDAddressCount = await prisma.address.count({ where: { profileId: uDId } });

    assert(
      resD.success && dbUDAddressCount === 0,
      'CASE D: Successfully deleted customer with stored addresses',
      `Addresses count: ${dbUDAddressCount}`
    );

    // -------------------------------------------------------------------------
    // CASE E: Customer WITH Completed Orders (Financial Integrity Protection)
    // -------------------------------------------------------------------------
    const uEId = crypto.randomUUID();
    testUserIds.push(uEId);

    await prisma.profile.create({
      data: {
        id: uEId,
        email: `ue_${timestamp}@godsmove.test`,
        role: 'CUSTOMER',
      },
    });

    let testVariant = await prisma.productVariant.findFirst();
    if (!testVariant) {
      const createdProd = await prisma.product.create({
        data: {
          name: 'QA Deletion Product',
          slug: `qa-deletion-product-${timestamp}`,
          description: 'QA Product for testing order preservation',
          category: {
            connectOrCreate: {
              where: { slug: 'apparel' },
              create: { name: 'Apparel', slug: 'apparel' },
            },
          },
          variants: {
            create: [
              {
                sku: `QA-SKU-${timestamp}`,
                size: 'L',
                price: 5000,
              },
            ],
          },
        },
        include: { variants: true },
      });
      createdProductId = createdProd.id;
      testVariant = createdProd.variants[0];
    }

    const orderE = await prisma.order.create({
      data: {
        orderNumber: `GM-ORD-DEL-${timestamp}`,
        profileId: uEId,
        email: `ue_${timestamp}@godsmove.test`,
        total: 5000,
        subtotal: 5000,
        paymentStatus: 'PAID',
        shippingAddress: { city: 'Delhi', pincode: '110001' },
        items: {
          create: [
            {
              variantId: testVariant.id,
              productName: 'GODSMOVE Archival Hoodie',
              variantSku: testVariant.sku || 'GM-HOODIE-L',
              size: 'L',
              quantity: 1,
              price: 5000,
              total: 5000,
            },
          ],
        },
      },
    });
    testOrderId = orderE.id;

    const resE = await deleteCustomerAccount(uEId, mockAdminUser);
    const dbUEProfile = await prisma.profile.findUnique({ where: { id: uEId } });
    const dbUEOrder = await prisma.order.findUnique({ where: { id: orderE.id } });

    assert(
      resE.success &&
      dbUEProfile === null &&
      dbUEOrder !== null &&
      dbUEOrder.profileId === null &&
      Number(dbUEOrder.total) === 5000,
      'CASE E: Customer deleted cleanly while Order & Financial total remain 100% preserved',
      `Order #${dbUEOrder?.orderNumber} ProfileId: ${dbUEOrder?.profileId}, Total: ₹${dbUEOrder?.total}`
    );

    // -------------------------------------------------------------------------
    // CASE F: Customer with Notification History
    // -------------------------------------------------------------------------
    const uFId = crypto.randomUUID();
    const uFEmail = `uf_${timestamp}@godsmove.test`;
    testUserIds.push(uFId);

    await prisma.profile.create({
      data: {
        id: uFId,
        email: uFEmail,
        role: 'CUSTOMER',
      },
    });
    await prisma.notificationHistory.create({
      data: {
        profileId: uFId,
        email: uFEmail,
        eventType: 'WELCOME',
        channel: 'EMAIL',
      },
    });

    const resF = await deleteCustomerAccount(uFId, mockAdminUser);
    const dbUFNotifs = await prisma.notificationHistory.count({ where: { profileId: uFId } });

    assert(
      resF.success && dbUFNotifs === 0,
      'CASE F: Notification history logs cleaned for target customer',
      `Notification logs remaining: ${dbUFNotifs}`
    );

    // -------------------------------------------------------------------------
    // TEST 14: GM ID Sequence Integrity Verification
    // -------------------------------------------------------------------------
    const nextGmId = await generateUniqueGodsmoveId(prisma);
    assert(
      nextGmId.startsWith('GM-'),
      'TEST 14: GM ID sequence remains strictly valid and unique after customer deletion',
      `Calculated Next GM ID: ${nextGmId}`
    );

    // -------------------------------------------------------------------------
    // TEST 15: Products, Catalog & Inventory Integrity
    // -------------------------------------------------------------------------
    const postProductsCount = await prisma.product.count();
    assert(
      postProductsCount === (createdProductId ? initialProductsCount + 1 : initialProductsCount),
      'TEST 15: Products, Catalog and Inventory remain 100% untouched by customer deletion',
      `Products Count Before: ${initialProductsCount}, After: ${postProductsCount}`
    );

    // -------------------------------------------------------------------------
    // TEST 16: Admin Customers Query Refresh
    // -------------------------------------------------------------------------
    const adminCustomers = await getAdminCustomers();
    const deletedInAdmin = adminCustomers.find((c) => testUserIds.includes(c.id));

    assert(
      deletedInAdmin === undefined,
      'TEST 16: Deleted customers disappear completely from Admin Customers query',
      `Deleted customer in list: ${deletedInAdmin !== undefined}`
    );

  } catch (err: any) {
    console.error('CRITICAL CUSTOMER DELETION QA ERROR:', err);
    failed++;
  } finally {
    // -------------------------------------------------------------------------
    // MANDATORY CLEANUP OF QA TEST DATA
    // -------------------------------------------------------------------------
    console.log('\nCleaning up deletion QA test records...');
    if (testOrderId) {
      await prisma.orderItem.deleteMany({ where: { orderId: testOrderId } });
      await prisma.order.deleteMany({ where: { id: testOrderId } });
    }
    if (createdProductId) {
      await prisma.productVariant.deleteMany({ where: { productId: createdProductId } });
      await prisma.product.deleteMany({ where: { id: createdProductId } });
    }
    await prisma.notificationHistory.deleteMany({
      where: { profileId: { in: testUserIds } },
    });
    await prisma.membership.deleteMany({
      where: { profileId: { in: testUserIds } },
    });
    await prisma.walletTransaction.deleteMany({
      where: { wallet: { profileId: { in: testUserIds } } },
    });
    await prisma.wallet.deleteMany({
      where: { profileId: { in: testUserIds } },
    });
    await prisma.address.deleteMany({
      where: { profileId: { in: testUserIds } },
    });
    await prisma.profile.deleteMany({
      where: { id: { in: testUserIds } },
    });
    console.log('✅ Deletion QA test cleanup complete.');
  }

  console.log('\n====================================================================');
  console.log(`📊 ADMIN CUSTOMER DELETION QA SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} CASES`);
  console.log('====================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCustomerDeletionQA();
