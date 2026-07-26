import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('⚠️ [RESEND SERVICE] RESEND_API_KEY is not defined in process.env. Email sending will run in simulation mode.');
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const DEFAULT_SENDER = 'GODSMOVE <support@godsmove.in>';
export const DEFAULT_REPLY_TO = 'support@godsmove.in';

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResponse {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Low-level Resend Client Dispatcher
 */
export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResponse> {
  const from = payload.from || DEFAULT_SENDER;
  const replyTo = payload.replyTo || DEFAULT_REPLY_TO;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ [CRITICAL DEPLOYMENT ERROR]: RESEND_API_KEY environment variable is missing in production!');
      return {
        success: false,
        error: 'CRITICAL: RESEND_API_KEY environment variable is missing in production.',
      };
    }
    console.log('--- [RESEND SIMULATION MODE] ---');
    console.log(`From: ${from}`);
    console.log(`To: ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log('Payload React Component rendered successfully.');
    console.log('--------------------------------');
    return { success: true, id: `sim_${Date.now()}` };
  }

  const client = resend || new Resend(apiKey);

  try {
    const { data, error } = await client.emails.send({
      from,
      to: payload.to,
      replyTo,
      subject: payload.subject,
      react: payload.react,
    });

    if (error) {
      console.error('❌ [RESEND API ERROR]:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('❌ [RESEND UNCAUGHT ERROR]:', err);
    return { success: false, error: err?.message || 'Failed to dispatch email via Resend' };
  }
}
