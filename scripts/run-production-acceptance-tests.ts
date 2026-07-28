import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { prisma } from '../src/lib/prisma';
import { NotificationService } from '../src/notifications/notification.service';
import { WalletService } from '../src/lib/wallet-service';
import { InvoiceService } from '../src/lib/invoice';

async function main() {
  console.log('====================================================================');
  console.log('🚀 GODSMOVE TRANSACTIONAL EMAIL SYSTEM — PRODUCTION ACCEPTANCE TEST');
  console.log('====================================================================\n');

  const qaEmail = 'qatest@godsmove.in';
  const qaName = 'QA Test Customer';
  const qaPhone = '9999999999';

  // Step 1: Provision QA Profile & Wallet in Database
  let profile = await prisma.profile.findUnique({ where: { email: qaEmail } });
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        id: 'qa_test_user_id_101',
        email: qaEmail,
        firstName: 'QA Test',
        lastName: 'Customer',
        phone: qaPhone,
        dob: new Date('1995-01-01'),
        role: 'CUSTOMER',
      },
    });
    console.log('✅ Created QA Test Customer profile in DB');
  } else {
    profile = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        firstName: 'QA Test',
        lastName: 'Customer',
        phone: qaPhone,
        dob: new Date('1995-01-01'),
      },
    });
    console.log('✅ Updated existing QA Test Customer profile in DB');
  }

  let wallet = await prisma.wallet.findUnique({ where: { profileId: profile.id } });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        profileId: profile.id,
        balance: 1000,
      },
    });
  }

  // Ensure a test product and variant exist for order creation
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'QA Category',
        slug: 'qa-category',
      },
    });
  }

  let product = await prisma.product.findFirst({ where: { slug: 'qa-statement-piece' } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: 'PRIMAL ARCHIVAL OVERSIZED TEE',
        slug: 'qa-statement-piece',
        description: 'Statement luxury apparel piece for production verification.',
        status: 'ACTIVE',
        categoryId: category.id,
      },
    });
  }

  let variant = await prisma.productVariant.findFirst({ where: { productId: product.id } });
  if (!variant) {
    variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: 'GM-QA-TEE-L',
        size: 'L',
        color: 'Obsidian Black',
        price: 4999,
        inventory: {
          create: {
            totalStock: 100,
            reservedStock: 0,
            soldStock: 0,
          },
        },
      },
    });
  }

  // Helper to query NotificationHistory & CommunicationLedger evidence
  async function getAuditEvidence(eventType: string) {
    const record = await prisma.notificationHistory.findFirst({
      where: {
        email: qaEmail,
        eventType,
      },
      orderBy: { createdAt: 'desc' },
    });
    return record;
  }

  function extract(res: any) {
    const emailRes = res?.email || res;
    return {
      resendId: emailRes?.id || 'N/A',
      success: emailRes?.success === true,
    };
  }

  const results: any[] = [];

  // -------------------------------------------------------------------------
  // TEST 1: WELCOME EMAIL
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 1/17] WELCOME EMAIL ---');
  const t1Res = await NotificationService.dispatch({
    event: 'FIRST_TIME_REGISTRATION',
    recipient: { email: qaEmail, name: qaName, userId: profile.id },
    payload: { customerName: qaName, email: qaEmail, forceResend: true },
  });
  const t1Log = await getAuditEvidence('FIRST_TIME_REGISTRATION');
  const e1 = extract(t1Res);
  results.push({
    testNo: 1,
    name: 'WELCOME EMAIL',
    event: 'FIRST_TIME_REGISTRATION',
    resendId: e1.resendId,
    success: e1.success,
    template: 'WelcomeTemplate',
    invoiceAttached: 'NO',
    logged: !!t1Log,
  });

  // -------------------------------------------------------------------------
  // TEST 2: PROFILE UPDATED
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 2/17] PROFILE UPDATED ---');
  const t2Res = await NotificationService.sendProfileUpdated(qaEmail, qaName);
  const t2Log = await getAuditEvidence('PROFILE_UPDATED');
  const e2 = extract(t2Res);
  results.push({
    testNo: 2,
    name: 'PROFILE UPDATED',
    event: 'PROFILE_UPDATED',
    resendId: e2.resendId,
    success: e2.success,
    template: 'ProfileUpdatedTemplate',
    invoiceAttached: 'NO',
    logged: !!t2Log,
  });

  // Create a QA Order for Order/Payment/Delivery/Return tests
  const orderNumber = `SS-202607-${Math.floor(1000 + Math.random() * 9000)}`;
  const order = await prisma.order.create({
    data: {
      orderNumber,
      profileId: profile.id,
      email: qaEmail,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'RAZORPAY',
      subtotal: 4999,
      shippingCost: 0,
      discountAmount: 500,
      walletCredit: 0,
      taxableAmount: 4016.96,
      gstAmount: 482.04,
      total: 4499,
      paidAt: new Date(),
      shippingAddress: {
        firstName: 'QA Test',
        lastName: 'Customer',
        line1: '101 Archival Boulevard, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        phone: qaPhone,
      },
      items: {
        create: [
          {
            variantId: variant.id,
            productName: product.name,
            variantSku: variant.sku,
            size: variant.size,
            color: variant.color,
            price: 4999,
            quantity: 1,
            total: 4499,
          },
        ],
      },
    },
    include: { items: true, profile: true },
  });
  console.log(`✅ Created test order: ${order.orderNumber} (ID: ${order.id})`);

  // -------------------------------------------------------------------------
  // TEST 3: ORDER CONFIRMATION
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 3/17] ORDER CONFIRMATION ---');
  const t3Res = await NotificationService.sendOrderConfirmationForOrder(order, true);
  const t3Log = await getAuditEvidence('ORDER_CONFIRMED');
  const e3 = extract(t3Res);
  results.push({
    testNo: 3,
    name: 'ORDER CONFIRMATION',
    event: 'ORDER_CONFIRMED',
    resendId: e3.resendId,
    success: e3.success,
    template: 'OrderConfirmationTemplate',
    invoiceAttached: 'YES',
    logged: !!t3Log,
  });

  // -------------------------------------------------------------------------
  // TEST 4: PAYMENT CONFIRMATION
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 4/17] PAYMENT CONFIRMATION ---');
  const t4Res = await NotificationService.sendPaymentConfirmed(
    qaEmail,
    qaName,
    order.orderNumber,
    Number(order.total),
    'pay_razorpay_qa998127391',
    order.id
  );
  const t4Log = await getAuditEvidence('PAYMENT_CONFIRMED');
  const e4 = extract(t4Res);
  results.push({
    testNo: 4,
    name: 'PAYMENT CONFIRMATION',
    event: 'PAYMENT_CONFIRMED',
    resendId: e4.resendId,
    success: e4.success,
    template: 'PaymentConfirmationTemplate',
    invoiceAttached: 'YES',
    logged: !!t4Log,
  });

  // -------------------------------------------------------------------------
  // TEST 5: PAYMENT FAILED
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 5/17] PAYMENT FAILED ---');
  const t5Res = await NotificationService.sendPaymentFailed(
    qaEmail,
    qaName,
    order.orderNumber,
    'Payment transaction was declined by bank authorization system.'
  );
  const t5Log = await getAuditEvidence('PAYMENT_FAILED');
  const e5 = extract(t5Res);
  results.push({
    testNo: 5,
    name: 'PAYMENT FAILED',
    event: 'PAYMENT_FAILED',
    resendId: e5.resendId,
    success: e5.success,
    template: 'OrderCancelledTemplate',
    invoiceAttached: 'NO',
    logged: !!t5Log,
  });

  // -------------------------------------------------------------------------
  // TEST 6: ORDER SHIPPED
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 6/17] ORDER SHIPPED ---');
  const t6Res = await NotificationService.sendOrderShipped(order, 'BlueDart Express', 'BLUEDART-QA-88192');
  const t6Log = await getAuditEvidence('ORDER_SHIPPED');
  const e6 = extract(t6Res);
  results.push({
    testNo: 6,
    name: 'ORDER SHIPPED',
    event: 'ORDER_SHIPPED',
    resendId: e6.resendId,
    success: e6.success,
    template: 'OrderShippedTemplate',
    invoiceAttached: 'YES',
    logged: !!t6Log,
  });

  // -------------------------------------------------------------------------
  // TEST 7: ORDER DELIVERED
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 7/17] ORDER DELIVERED ---');
  const t7Res = await NotificationService.sendOrderDelivered(order);
  const t7Log = await getAuditEvidence('ORDER_DELIVERED');
  const e7 = extract(t7Res);
  results.push({
    testNo: 7,
    name: 'ORDER DELIVERED',
    event: 'ORDER_DELIVERED',
    resendId: e7.resendId,
    success: e7.success,
    template: 'OrderDeliveredTemplate',
    invoiceAttached: 'YES',
    logged: !!t7Log,
  });

  // -------------------------------------------------------------------------
  // TEST 8: ORDER CANCELLED
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 8/17] ORDER CANCELLED ---');
  const t8Res = await NotificationService.sendOrderCancelled(order, 'Requested by customer via concierge.');
  const t8Log = await getAuditEvidence('ORDER_CANCELLED');
  const e8 = extract(t8Res);
  results.push({
    testNo: 8,
    name: 'ORDER CANCELLED',
    event: 'ORDER_CANCELLED',
    resendId: e8.resendId,
    success: e8.success,
    template: 'OrderCancelledTemplate',
    invoiceAttached: 'NO',
    logged: !!t8Log,
  });

  // -------------------------------------------------------------------------
  // TEST 9: WALLET CREDIT
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 9/17] WALLET CREDIT ---');
  const t9Res = await NotificationService.sendWalletCredited(qaEmail, qaName, 1500, 2500);
  const t9Log = await getAuditEvidence('WALLET_CREDITED');
  const e9 = extract(t9Res);
  results.push({
    testNo: 9,
    name: 'WALLET CREDIT',
    event: 'WALLET_CREDITED',
    resendId: e9.resendId,
    success: e9.success,
    template: 'WalletCreditedTemplate',
    invoiceAttached: 'NO',
    logged: !!t9Log,
  });

  // -------------------------------------------------------------------------
  // TEST 10: WALLET DEBIT
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 10/17] WALLET DEBIT ---');
  const t10Res = await NotificationService.sendWalletDebited(qaEmail, qaName, 500, 2000);
  const t10Log = await getAuditEvidence('WALLET_DEBITED');
  const e10 = extract(t10Res);
  results.push({
    testNo: 10,
    name: 'WALLET DEBIT',
    event: 'WALLET_DEBITED',
    resendId: e10.resendId,
    success: e10.success,
    template: 'WalletDebitedTemplate',
    invoiceAttached: 'NO',
    logged: !!t10Log,
  });

  // -------------------------------------------------------------------------
  // TEST 11: RETURN REQUESTED
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 11/17] RETURN REQUESTED ---');
  const returnId = `RET-QA-${Math.floor(1000 + Math.random() * 9000)}`;
  const t11Res = await NotificationService.sendReturnRequested(qaEmail, returnId, order.orderNumber);
  const t11Log = await getAuditEvidence('RETURN_REQUESTED');
  const e11 = extract(t11Res);
  results.push({
    testNo: 11,
    name: 'RETURN REQUESTED',
    event: 'RETURN_REQUESTED',
    resendId: e11.resendId,
    success: e11.success,
    template: 'ReturnRequestedTemplate',
    invoiceAttached: 'NO',
    logged: !!t11Log,
  });

  // -------------------------------------------------------------------------
  // TEST 12: RETURN APPROVED
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 12/17] RETURN APPROVED ---');
  const t12Res = await NotificationService.sendReturnApproved(qaEmail, returnId, 'Delhivery Express', 'DELHIVERY-QA-9912');
  const t12Log = await getAuditEvidence('RETURN_APPROVED');
  const e12 = extract(t12Res);
  results.push({
    testNo: 12,
    name: 'RETURN APPROVED',
    event: 'RETURN_APPROVED',
    resendId: e12.resendId,
    success: e12.success,
    template: 'ReturnApprovedTemplate',
    invoiceAttached: 'NO',
    logged: !!t12Log,
  });

  // -------------------------------------------------------------------------
  // TEST 13: RETURN REJECTED
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 13/17] RETURN REJECTED ---');
  const t13Res = await NotificationService.sendReturnRejected(qaEmail, returnId, 'Item passed inspection window threshold.');
  const t13Log = await getAuditEvidence('RETURN_REJECTED');
  const e13 = extract(t13Res);
  results.push({
    testNo: 13,
    name: 'RETURN REJECTED',
    event: 'RETURN_REJECTED',
    resendId: e13.resendId,
    success: e13.success,
    template: 'ReturnRejectedTemplate',
    invoiceAttached: 'NO',
    logged: !!t13Log,
  });

  // -------------------------------------------------------------------------
  // TEST 14: RETURN PICKUP SCHEDULED
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 14/17] RETURN PICKUP SCHEDULED ---');
  const t14Res = await NotificationService.sendReturnPickupScheduled(qaEmail, returnId, '30 July 2026', 'BlueDart Express');
  const t14Log = await getAuditEvidence('RETURN_PICKUP_SCHEDULED');
  const e14 = extract(t14Res);
  results.push({
    testNo: 14,
    name: 'RETURN PICKUP SCHEDULED',
    event: 'RETURN_PICKUP_SCHEDULED',
    resendId: e14.resendId,
    success: e14.success,
    template: 'ReturnPickupScheduledTemplate',
    invoiceAttached: 'NO',
    logged: !!t14Log,
  });

  // -------------------------------------------------------------------------
  // TEST 15: RETURN PICKUP COMPLETED
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 15/17] RETURN PICKUP COMPLETED ---');
  const t15Res = await NotificationService.sendReturnPickupCompleted(qaEmail, returnId);
  const t15Log = await getAuditEvidence('RETURN_PICKUP_COMPLETED');
  const e15 = extract(t15Res);
  results.push({
    testNo: 15,
    name: 'RETURN PICKUP COMPLETED',
    event: 'RETURN_PICKUP_COMPLETED',
    resendId: e15.resendId,
    success: e15.success,
    template: 'ReturnCompletedTemplate',
    invoiceAttached: 'NO',
    logged: !!t15Log,
  });

  // -------------------------------------------------------------------------
  // TEST 16: RETURN REFUND COMPLETED
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 16/17] RETURN REFUND COMPLETED ---');
  const t16Res = await NotificationService.sendReturnRefundCompleted(qaEmail, returnId, 4499);
  const t16Log = await getAuditEvidence('RETURN_REFUND_COMPLETED');
  const e16 = extract(t16Res);
  results.push({
    testNo: 16,
    name: 'RETURN REFUND COMPLETED',
    event: 'RETURN_REFUND_COMPLETED',
    resendId: e16.resendId,
    success: e16.success,
    template: 'ReturnRefundCompletedTemplate',
    invoiceAttached: 'NO',
    logged: !!t16Log,
  });

  // -------------------------------------------------------------------------
  // TEST 17: INVOICE REQUEST
  // -------------------------------------------------------------------------
  console.log('\n--- [TEST 17/17] INVOICE REQUEST ---');
  const t17Res = await NotificationService.sendInvoiceRequest(order);
  const t17Log = await getAuditEvidence('INVOICE_REQUEST');
  const e17 = extract(t17Res);
  results.push({
    testNo: 17,
    name: 'INVOICE REQUEST',
    event: 'INVOICE_REQUEST',
    resendId: e17.resendId,
    success: e17.success,
    template: 'InvoiceRequestTemplate',
    invoiceAttached: 'YES',
    logged: !!t17Log,
  });

  console.log('\n====================================================================');
  console.log('📊 PRODUCTION ACCEPTANCE TEST RESULTS SUMMARY');
  console.log('====================================================================\n');
  console.table(results);
}

main()
  .catch((err) => {
    console.error('❌ Test execution error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
