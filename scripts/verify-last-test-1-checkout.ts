import { prisma } from '../src/lib/prisma';
import { PricingEngine } from '../src/lib/pricing-engine';

async function verifyLastTest1Checkout() {
  console.log('\n============================================================');
  console.log('REAL PRODUCT VERIFICATION FOR "last test 1"');
  console.log('============================================================\n');

  const product = await prisma.product.findFirst({
    where: { name: { contains: 'last test 1', mode: 'insensitive' } },
    include: { variants: true }
  });

  if (!product) {
    throw new Error('Product "last test 1" not found in database');
  }

  const variant = product.variants[0];
  const unitPrice = Number(variant ? variant.price : product.mrp);

  console.log(`Product Name:            ${product.name}`);
  console.log(`Product Price:           ₹${unitPrice}`);
  console.log(`hasMemberDiscount:       ${product.hasMemberDiscount}`);
  console.log(`memberDiscountType:      ${product.memberDiscountType}`);
  console.log(`memberDiscountValue:     ${product.memberDiscountValue}%`);
  console.log(`isPreBooking:            ${product.isPreBooking}`);
  console.log(`launchDateTime:          ${product.launchDateTime ? product.launchDateTime.toISOString() : 'None'}`);

  // Simulate Member Checkout
  const memberPricing = PricingEngine.calculate({
    items: [
      {
        price: unitPrice,
        quantity: 1,
        productName: product.name,
        hasMemberDiscount: product.hasMemberDiscount,
        memberDiscountType: product.memberDiscountType,
        memberDiscountValue: product.memberDiscountValue,
        isPreBooking: product.isPreBooking,
        launchDateTime: product.launchDateTime,
      }
    ],
    hasActiveMembership: true,
  });

  console.log('\n--- Member Checkout Pricing Calculation ---');
  console.log(`Subtotal:                ₹${memberPricing.subtotal}`);
  console.log(`Member Discount:         ₹${memberPricing.memberDiscount}`);
  console.log(`Discount Lines Count:    ${memberPricing.discountLines.length}`);
  if (memberPricing.discountLines.length > 0) {
    console.log(`Line 1 Label:            ${memberPricing.discountLines[0].label}`);
    console.log(`Line 1 Amount:           ₹${memberPricing.discountLines[0].amount}`);
  }
  console.log(`Net Selling Price:       ₹${memberPricing.netSellingPrice}`);
  console.log(`Grand Total:             ₹${memberPricing.grandTotal}`);

  const roundedMemberDiscount = Math.round(memberPricing.memberDiscount);
  const expectedGrandTotal = Math.round(unitPrice - memberPricing.memberDiscount);

  if (roundedMemberDiscount !== 300) {
    throw new Error(`Member discount mismatch: expected ₹300, got ₹${roundedMemberDiscount}`);
  }
  if (memberPricing.grandTotal !== expectedGrandTotal) {
    throw new Error(`Grand total mismatch: expected ₹${expectedGrandTotal}, got ₹${memberPricing.grandTotal}`);
  }

  console.log('\n============================================================');
  console.log('✅ VERIFICATION SUCCESSFUL: "last test 1" MEMBER DISCOUNT IS 100% PROPERLY CALCULATED AND APPLIED!');
  console.log(`Expected ₹${unitPrice} - ₹${roundedMemberDiscount} (10%) = ₹${expectedGrandTotal}`);
  console.log('============================================================\n');
}

verifyLastTest1Checkout().catch(console.error).finally(() => prisma.$disconnect());
