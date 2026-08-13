import { prisma } from '../src/lib/prisma';
import { isPreBookingActive, getProductLaunchState } from '../src/lib/launch-engine-core';

async function main() {
  const products = await prisma.product.findMany({
    where: {
      name: { contains: 'last test 1', mode: 'insensitive' }
    },
    include: {
      variants: true,
      discounts: true,
    }
  });

  console.log(`Found ${products.length} products matching "last test 1":\n`);

  for (const p of products) {
    console.log(`ID:                     ${p.id}`);
    console.log(`Name:                   ${p.name}`);
    console.log(`Status:                 ${p.status}`);
    console.log(`MRP / Selling Price:    ₹${p.mrp}`);
    console.log(`Compare Price:          ${(p as any).comparePrice ? `₹${(p as any).comparePrice}` : 'None'}`);
    console.log(`hasMemberDiscount:      ${p.hasMemberDiscount}`);
    console.log(`memberDiscountType:     ${p.memberDiscountType}`);
    console.log(`memberDiscountValue:    ${p.memberDiscountValue}`);
    console.log(`isPreBooking:           ${p.isPreBooking}`);
    console.log(`launchDateTime:         ${p.launchDateTime ? p.launchDateTime.toISOString() : 'Null'}`);
    console.log(`preBookingOpenDateTime: ${p.preBookingOpenDateTime ? p.preBookingOpenDateTime.toISOString() : 'Null'}`);
    console.log(`preBookingOfferType:    ${p.preBookingOfferType}`);
    console.log(`preBookingOfferValue:   ${p.preBookingOfferValue}`);
    console.log(`Launch State:           ${getProductLaunchState(p)}`);
    console.log(`isPreBookingActive:     ${isPreBookingActive(p)}`);
    console.log(`Variants Count:         ${p.variants.length}`);
    if (p.variants.length > 0) {
      console.log(`Variant 1 Price:        ₹${p.variants[0].price}`);
    }
    console.log('--------------------------------------------------');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
