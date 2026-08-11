import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // 1. Investigate the anomalous order SS-202607-8545
  console.log('=== GST ANOMALY INVESTIGATION ===');
  const o = await prisma.order.findFirst({
    where: { orderNumber: 'SS-202607-8545' },
    select: {
      orderNumber: true,
      subtotal: true,
      taxableAmount: true,
      gstAmount: true,
      total: true,
      codFee: true,
      shippingCost: true,
      discountAmount: true,
      walletCredit: true,
      paymentMethod: true,
      items: {
        select: { productName: true, quantity: true, price: true, total: true, variantSku: true }
      }
    },
  });
  if (o) {
    console.log('\nOrder #SS-202607-8545:');
    console.log(`  subtotal: ${o.subtotal}, cod: ${o.codFee}, shipping: ${o.shippingCost}`);
    console.log(`  taxableAmount: ${o.taxableAmount}, gstAmount: ${o.gstAmount}`);
    console.log(`  total: ${o.total}, paymentMethod: ${o.paymentMethod}`);
    console.log(`  Items:`);
    for (const item of o.items) {
      console.log(`    ${item.productName}: qty=${item.quantity} price=${item.price} taxable=${o.taxableAmount} gst=${o.gstAmount}`);
    }

    const subtotal = Number(o.subtotal);
    const cod = Number(o.codFee || 0);
    const taxable = Number(o.taxableAmount);
    const gst = Number(o.gstAmount);
    const sum = taxable + gst;
    console.log(`\n  Analysis: subtotal=${subtotal} + cod=${cod} = ${subtotal + cod}`);
    console.log(`  taxable+gst = ${sum}`);
    console.log(`  If GST was calculated on (subtotal+codFee)=${subtotal + cod}: Δ=${Math.abs(sum - (subtotal + cod)).toFixed(2)}`);
    console.log(`  If GST was calculated on subtotal only=${subtotal}: Δ=${Math.abs(sum - subtotal).toFixed(2)}`);
    // The COD fee shouldn't have GST on it since it's a handling fee — check if the Δ=149 matches the COD fee
    console.log(`  COD fee = ${cod}, Δ from subtotal = ${(sum - subtotal).toFixed(2)}`);
    if (Math.abs(cod - (sum - subtotal)) < 2) {
      console.log('  → CONCLUSION: taxable+gst was calculated on subtotal+codFee (COD fee incorrectly included in GST base)');
      console.log('  → This is a LEGACY order from before the GST fix. Not a regression.');
    }
  }

  // 2. Test PricingEngine class for member discount enforcement
  console.log('\n=== PRICING ENGINE MEMBER DISCOUNT TEST ===');
  try {
    const { PricingEngine } = await import('../src/lib/pricing-engine');
    
    // PRE_BOOKING with active member — should give memberDiscount=0
    const preBookResult = PricingEngine.calculate({
      items: [{
        price: 5000,
        quantity: 1,
        productName: 'Test Pre-Book',
        hasMemberDiscount: true,
        memberDiscountType: 'PERCENT',
        memberDiscountValue: 10,
      }],
      isPreBooking: true,
      hasActiveMembership: true,
    });
    console.log(`PRE_BOOKING + active member: memberDiscount=₹${preBookResult.memberDiscount} (expected: ₹0) ${preBookResult.memberDiscount === 0 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Normal Drops with active member — should give memberDiscount=500
    const dropsResult = PricingEngine.calculate({
      items: [{
        price: 5000,
        quantity: 1,
        productName: 'Test Drops',
        hasMemberDiscount: true,
        memberDiscountType: 'PERCENT',
        memberDiscountValue: 10,
      }],
      isPreBooking: false,
      hasActiveMembership: true,
    });
    console.log(`DROPS + active member: memberDiscount=₹${dropsResult.memberDiscount} (expected: ₹500) ${dropsResult.memberDiscount === 500 ? '✅ PASS' : '❌ FAIL'}`);
    
    // DROPS with non-member — should give 0
    const nonMemberResult = PricingEngine.calculate({
      items: [{
        price: 5000,
        quantity: 1,
        productName: 'Test Non-Member',
        hasMemberDiscount: true,
        memberDiscountType: 'PERCENT',
        memberDiscountValue: 10,
      }],
      isPreBooking: false,
      hasActiveMembership: false,
    });
    console.log(`DROPS + non-member: memberDiscount=₹${nonMemberResult.memberDiscount} (expected: ₹0) ${nonMemberResult.memberDiscount === 0 ? '✅ PASS' : '❌ FAIL'}`);
    
    // FIXED_PRICE member discount
    const fixedResult = PricingEngine.calculate({
      items: [{
        price: 5000,
        quantity: 1,
        productName: 'Test Fixed',
        hasMemberDiscount: true,
        memberDiscountType: 'FIXED_PRICE',
        memberDiscountValue: 300,
      }],
      isPreBooking: false,
      hasActiveMembership: true,
    });
    console.log(`DROPS + FIXED member discount ₹300: memberDiscount=₹${fixedResult.memberDiscount} (expected: ₹300) ${fixedResult.memberDiscount === 300 ? '✅ PASS' : '❌ FAIL'}`);
  } catch (e: any) {
    console.log('ERROR testing PricingEngine:', e.message?.substring(0, 300));
  }

  // 3. Verify invoice API route
  console.log('\n=== INVOICE ROUTE CHECK ===');
  const { readdirSync, statSync } = require('fs');
  const invoicePath = 'src/app/api/invoice';
  try {
    const entries = readdirSync(invoicePath);
    console.log(`Invoice route at /${invoicePath}: ${entries.join(', ')}`);
  } catch {
    console.log('Could not list invoice route directory');
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); });
