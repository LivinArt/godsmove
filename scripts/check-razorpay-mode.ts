import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function checkRazorpayEnv() {
  const pubKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';
  const secretKey = process.env.RAZORPAY_KEY_SECRET || '';

  console.log('====================================================================');
  console.log('💳 RAZORPAY ENVIRONMENT MODE AUDIT');
  console.log('====================================================================\n');

  if (pubKey.startsWith('rzp_live_')) {
    console.log('Razorpay Public Key Prefix: rzp_live_ 🟢 LIVE PRODUCTION MODE ACTIVE');
  } else if (pubKey.startsWith('rzp_test_')) {
    console.log('Razorpay Public Key Prefix: rzp_test_ 🟡 TEST MODE ACTIVE');
  } else {
    console.log('Razorpay Public Key Prefix: UNKNOWN / NOT CONFIGURED');
  }

  if (secretKey.length > 0) {
    console.log('Razorpay Key Secret: Present 🟢');
  } else {
    console.log('Razorpay Key Secret: Missing 🔴');
  }
}

checkRazorpayEnv().catch(console.error);
