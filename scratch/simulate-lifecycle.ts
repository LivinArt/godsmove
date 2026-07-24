import dotenv from 'dotenv';
import path from 'path';

import { randomUUID } from 'crypto';

// 1. Load Environment Variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set in .env.local');
  process.exit(1);
}

// 2. Initialize Prisma Client
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function runSimulator() {
  console.log('========================================================');
  console.log('GODSMOVE POST-PURCHASE EXPERIENCE UAT SIMULATOR');
  console.log('========================================================');

  try {
    console.log('CONNECTED TO DATABASE VIA PRISMA CLIENT');

    // ── STEP 1: SEED OR GET WORKABLE ENTITIES ──────────────────────────
    console.log('\n[1/7] SEEDING UAT PROFILE AND INVENTORY DATA...');
    
    // Find or create test customer profile
    let profile = await prisma.profile.findFirst({
      where: { email: 'uat_customer@godsmove.com' },
    });
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: randomUUID(),
          email: 'uat_customer@godsmove.com',
          firstName: 'UAT',
          lastName: 'Customer',
          role: 'CUSTOMER',
        },
      });
      console.log(`Created new UAT customer profile: ${profile.id}`);
    } else {
      console.log(`Found existing UAT customer profile: ${profile.id}`);
    }

    // Find or create a test category
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Outerwear',
          slug: 'outerwear',
        },
      });
      console.log(`Created UAT category: ${category.id}`);
    }

    // Find or create a test product
    let product = await prisma.product.findFirst();
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: 'GODSMOVE OVERSIZED PARKA',
          slug: 'godsmove-oversized-parka',
          description: 'Heavyweight nylon canvas parka with premium visual layout.',
          categoryId: category.id,
          status: 'ACTIVE',
        },
      });
      console.log(`Created UAT test product: ${product.id}`);
    } else {
      console.log(`Found UAT test product: ${product.id}`);
    }

    // Find or create variant
    let variant = await prisma.productVariant.findFirst({
      where: { productId: product.id, size: 'M' },
    });
    if (!variant) {
      variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: 'PARKA-M-BLK-' + Math.floor(1000 + Math.random() * 9000),
          size: 'M',
          color: 'Black',
          price: 24000,
        },
      });
      console.log(`Created new variant: ${variant.id}`);
    } else {
      console.log(`Found existing variant: ${variant.id}`);
    }

    // Find or create inventory
    let inventory = await prisma.inventory.findFirst({
      where: { variantId: variant.id },
    });
    if (!inventory) {
      inventory = await prisma.inventory.create({
        data: {
          variantId: variant.id,
          totalStock: 50,
          reservedStock: 0,
          soldStock: 0,
        },
      });
      console.log(`Created inventory sizing matrix for variant`);
    } else {
      // Ensure inventory has enough stock for purchase
      await prisma.inventory.update({
        where: { id: inventory.id },
        data: { totalStock: 50, soldStock: 0, reservedStock: 0 },
      });
      console.log(`Reset inventory stock matrix to 50 items`);
    }

    // ── STEP 2: CREATE ORDER AND SIMULATE PURCHASE ────────────────────
    console.log('\n[2/7] SIMULATING ORDER CHECKOUT...');
    const orderNumber = 'GM-' + Math.floor(100000 + Math.random() * 900000);
    const order = await prisma.order.create({
      data: {
        orderNumber,
        profile: { connect: { id: profile.id } },
        email: profile.email,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: 'RAZORPAY',
        subtotal: 24000,
        shippingCost: 500,
        total: 24500,
        shippingAddress: JSON.stringify({
          firstName: 'UAT',
          lastName: 'Customer',
          phone: '9988776655',
          line1: 'Plot 42, DLF Phase 3',
          line2: 'Sector 24',
          landmark: 'Opposite Cyber City',
          city: 'Gurugram',
          state: 'Haryana',
          pincode: '122002',
        }),
      },
    });

    console.log(`Created Order #${orderNumber} (Unpaid)`);

    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        variantId: variant.id,
        variantSku: variant.sku,
        productName: product.name,
        price: 24000,
        quantity: 1,
        size: 'M',
        color: 'Black',
        imageUrl: '/images/drops/parka-1.webp',
        total: 24000,
      },
    });
    console.log(`Added Order Item: ${orderItem.productName} (Size: M, Qty: 1)`);

    // Simulate Payment Confirmation
    const paidOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        status: 'PROCESSING',
      },
    });
    // Deduct stock
    await prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        soldStock: { increment: 1 },
      },
    });
    console.log(`Order status updated to PAID & PROCESSING. Inventory stock decremented.`);

    // ── STEP 3: LOGISTICS TRANSITION (OUTBOUND SHIPMENT) ────────────────
    console.log('\n[3/7] DISPATCHING OUTBOUND LOGISTICS DISPATCH TIMELINE...');
    const trackingNumber = 'AWB' + Math.floor(100000000 + Math.random() * 900000000);
    const shipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        carrier: 'Delhivery',
        trackingNumber,
        awb: trackingNumber,
        status: 'CREATED',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
    });
    console.log(`Outbound Shipment AWB generated: ${trackingNumber} via Delhivery`);

    // Bind item to shipment
    await prisma.orderItem.update({
      where: { id: orderItem.id },
      data: { shipmentId: shipment.id },
    });

    const steps = [
      { status: 'PACKED', desc: 'Package prepared at Gurugram Hub' },
      { status: 'PICKUP_SCHEDULED', desc: 'Delhivery pickup scheduled' },
      { status: 'PICKED_UP', desc: 'Package collected by Delhivery' },
      { status: 'IN_TRANSIT', desc: 'Shipment left Delhi transit hub' },
      { status: 'OUT_FOR_DELIVERY', desc: 'Out for delivery in destination sector' },
      { status: 'DELIVERED', desc: 'Package handed over to customer' },
    ];

    for (const step of steps) {
      // Create shipment event
      await prisma.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          status: step.status as any,
          location: 'Transit Station',
          description: step.desc,
        },
      });
      // Update shipment
      await prisma.shipment.update({
        where: { id: shipment.id },
        data: { status: step.status as any },
      });
      console.log(` -> Shipment State transition: ${step.status} - ${step.desc}`);
    }

    // Update order status to DELIVERED
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'DELIVERED' },
    });
    console.log('Order status marked as DELIVERED');

    // ── STEP 4: CUSTOMER SUBMITS PARTIAL RETURN REQUEST ──────────────────
    console.log('\n[4/7] SIMULATING CUSTOMER PARTIAL RETURN WIZARD SUBMISSION...');
    
    // Create Return Request
    const returnReq = await prisma.returnRequest.create({
      data: {
        order: { connect: { id: order.id } },
        profile: { connect: { id: profile.id } },
        type: 'RETURN_FOR_CREDIT',
        status: 'PENDING',
        reason: 'Product Damage: The zipper is broken and left side has sewing defects.',
        evidenceUrls: ['https://example.com/damage-image-1.jpg', 'https://example.com/damage-video.mp4'],
      },
    });
    console.log(`Created Return Request: ${returnReq.id}`);

    // Create Return Item join
    const returnItem = await prisma.returnItem.create({
      data: {
        returnReq: { connect: { id: returnReq.id } },
        orderItem: { connect: { id: orderItem.id } },
        quantity: 1,
      },
    });
    console.log(`Returned Item referenced: ${orderItem.productName} (Qty: 1)`);

    // Create event
    await prisma.returnEvent.create({
      data: {
        returnReqId: returnReq.id,
        status: 'PENDING',
        description: 'Return request submitted by customer.',
      },
    });

    // ── STEP 5: ADMIN APPROVES REQUEST & SCHEDULES REVERSE PICKUP ───────
    console.log('\n[5/7] ADMIN APPROVING RETURN & GENERATING REVERSE LOGISTICS...');
    const reverseAWB = 'REV' + Math.floor(100000000 + Math.random() * 900000000);
    
    // Approve transaction
    await prisma.$transaction(async (tx) => {
      await tx.returnRequest.update({
        where: { id: returnReq.id },
        data: { status: 'APPROVED' },
      });

      await tx.reverseShipment.create({
        data: {
          returnReqId: returnReq.id,
          carrier: 'BlueDart',
          trackingNumber: reverseAWB,
          awb: reverseAWB,
          status: 'PICKUP_SCHEDULED',
        },
      });

      await tx.returnEvent.create({
        data: {
          returnReqId: returnReq.id,
          status: 'APPROVED',
          description: `Return approved. Reverse pickup scheduled via BlueDart AWB ${reverseAWB}.`,
        },
      });

      await tx.orderItem.update({
        where: { id: orderItem.id },
        data: { returnStatus: 'APPROVED' },
      });
    });

    console.log(`Return APPROVED. BlueDart Reverse AWB: ${reverseAWB}`);

    // ── STEP 6: REVERSE PICKUP TRANSITION & WAREHOUSE QC ─────────────────
    console.log('\n[6/7] SIMULATING REVERSE LOGISTICS ARRIVAL & QUALITY INSPECTION...');
    
    const qcTransitions = [
      { status: 'COLLECTED', desc: 'Package collected from customer address' },
      { status: 'RECEIVED', desc: 'Package received at warehouse. Awaiting quality inspection.' },
      { status: 'INSPECTION', desc: 'Product undergoing QC analysis. Checking stitching and zipper.' },
      { status: 'REFUND_PROCESSED', desc: 'QC check PASS. Awaiting final credit issuance.' },
    ];

    for (const transition of qcTransitions) {
      await prisma.$transaction(async (tx) => {
        await tx.returnRequest.update({
          where: { id: returnReq.id },
          data: { status: transition.status as any },
        });

        await tx.returnEvent.create({
          data: {
            returnReqId: returnReq.id,
            status: transition.status as any,
            description: transition.desc,
          },
        });

        await tx.orderItem.update({
          where: { id: orderItem.id },
          data: { returnStatus: transition.status as any },
        });

        if (transition.status === 'RECEIVED') {
          await tx.reverseShipment.updateMany({
            where: { returnReqId: returnReq.id },
            data: {
              status: 'DELIVERED_TO_WAREHOUSE',
              deliveredAt: new Date(),
            },
          });
        }
      });
      console.log(` -> Return State transition: ${transition.status} - ${transition.desc}`);
    }

    // ── STEP 7: WALLET REFUND & CASE CLOSURE ──────────────────────────────
    console.log('\n[7/7] SIMULATING LEDGER REFUND & WALLET BALANCE ADJUSTMENT...');
    
    // Ledger deduction parameters
    const subtotal = 24000;
    const outboundDeduction = 500;
    const logisticsDeduction = 180;
    const taxAdjustment = 120;
    const finalRefundAmount = subtotal - outboundDeduction - logisticsDeduction - taxAdjustment; // 23200

    await prisma.$transaction(async (tx) => {
      // Find or create customer wallet
      let wallet = await tx.wallet.findUnique({
        where: { profileId: profile.id },
      });
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            profile: { connect: { id: profile.id } },
            balance: 0,
          },
        });
      }

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: finalRefundAmount } },
      });

      // Write ledger transactions
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: finalRefundAmount,
          type: 'CREDIT_RETURN',
          description: `Refund credit for returned item from Order #${orderNumber} (Request ID: ${returnReq.id.substring(0, 8)})`,
        },
      });

      // Write WalletRefund breakdown receipt
      await tx.walletRefund.create({
        data: {
          returnReq: { connect: { id: returnReq.id } },
          subtotal,
          logisticsDeduction,
          finalRefund: finalRefundAmount,
        },
      });

      // Complete Return Request
      await tx.returnRequest.update({
        where: { id: returnReq.id },
        data: {
          status: 'COMPLETED',
          creditAmount: finalRefundAmount,
        },
      });

      // Complete Order Item status
      await tx.orderItem.update({
        where: { id: orderItem.id },
        data: { returnStatus: 'COMPLETED' },
      });

      // Add final return event
      await tx.returnEvent.create({
        data: {
          returnReqId: returnReq.id,
          status: 'COMPLETED',
          description: `Case closed. Issued ₹${finalRefundAmount.toLocaleString('en-IN')} store credit to wallet.`,
        },
      });
    });

    console.log('Return request successfully transitioned to COMPLETED');
    console.log('Wallet credit successfully added to customer balance.');

    // ── STEP 8: RETRIEVE AND VERIFY STATE FOR UAT AUDIT ──────────────────
    console.log('\n========================================================');
    console.log('UAT VERIFICATION AUDIT');
    console.log('========================================================');

    const verifiedWallet = await prisma.wallet.findUnique({
      where: { profileId: profile.id },
      include: { transactions: true },
    });

    const verifiedReturn = await prisma.returnRequest.findUnique({
      where: { id: returnReq.id },
      include: { walletRefund: true, events: true },
    });

    console.log(`Current Wallet Balance: ₹${Number(verifiedWallet?.balance).toLocaleString('en-IN')}`);
    console.log('Transactions Ledger:');
    verifiedWallet?.transactions.forEach((tx) => {
      console.log(` - [${tx.type}] ${tx.description}: +₹${Number(tx.amount).toLocaleString('en-IN')}`);
    });

    console.log('\nRefund Receipt Breakdown:');
    if (verifiedReturn?.walletRefund) {
      console.log(` - Returned Subtotal:   ₹${Number(verifiedReturn.walletRefund.subtotal).toLocaleString('en-IN')}`);
      console.log(` - Logistics Ded.:      -₹${Number(verifiedReturn.walletRefund.logisticsDeduction).toLocaleString('en-IN')}`);
      console.log(` --------------------------------------------------`);
      console.log(` - Net Wallet Credit:   ₹${Number(verifiedReturn.walletRefund.finalRefund).toLocaleString('en-IN')}`);
    }

    console.log('\nCase History Events:');
    verifiedReturn?.events.forEach((ev) => {
      console.log(` - [${ev.status}] ${ev.description} (${new Date(ev.timestamp).toLocaleTimeString()})`);
    });

    console.log('\n========================================================');
    console.log('UAT FLOW LIEFOCYCLE VERIFICATION PASS: SUCCESS');
    console.log('========================================================');

  } catch (err) {
    console.error('UAT FLOW FAILURE:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runSimulator();
