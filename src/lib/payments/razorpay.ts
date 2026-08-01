if (typeof window !== 'undefined') {
  throw new Error('Razorpay module can only be executed on the server.');
}
import Razorpay from 'razorpay';

/**
 * Validates and retrieves Razorpay API credentials from environment variables.
 * Key ID is public (safe for client response), Key Secret MUST remain private server-side.
 */
export function getRazorpayCredentials() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY;

  if (!keyId || !keyId.trim()) {
    throw new Error(
      'Razorpay Key ID is missing from environment configuration (NEXT_PUBLIC_RAZORPAY_KEY_ID or RAZORPAY_KEY_ID).'
    );
  }

  if (!keySecret || !keySecret.trim()) {
    throw new Error(
      'Razorpay Key Secret is missing from environment configuration (RAZORPAY_KEY_SECRET or RAZORPAY_SECRET_KEY).'
    );
  }

  return { keyId: keyId.trim(), keySecret: keySecret.trim() };
}

let razorpayInstance: Razorpay | null = null;

/**
 * Singleton factory function to retrieve the initialized Razorpay SDK client.
 */
export function getRazorpayClient(): Razorpay {
  if (!razorpayInstance) {
    const { keyId, keySecret } = getRazorpayCredentials();
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}
