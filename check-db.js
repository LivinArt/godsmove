require('dotenv').config({ path: '.env.local' });
const { prisma } = require('./src/lib/prisma');

async function main() {
  const [profiles, orders, returns, inventory, wallet, wt] = await Promise.all([
    prisma.profile.count(),
    prisma.order.count(),
    prisma.returnRequest.count(),
    prisma.inventory.count(),
    prisma.wallet.count(),
    prisma.walletTransaction.count(),
  ]);

  console.log('--- Row Counts ---', {
    profiles,
    orders,
    returns,
    inventory,
    wallet,
    walletTransactions: wt,
  });

  const sampleOrder = await prisma.order.findFirst();
  console.log('Sample Order:', sampleOrder);

  const sampleReturn = await prisma.returnRequest.findFirst();
  console.log('Sample Return:', sampleReturn);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
