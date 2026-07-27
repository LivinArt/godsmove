import { Resend } from 'resend';
import { render } from '@react-email/render';

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const DEFAULT_SENDER = 'GODSMOVE <support@godsmove.in>';
export const DEFAULT_REPLY_TO = 'support@godsmove.in';

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
}

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  react?: React.ReactElement;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
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
    console.error('❌ [RESEND API ERROR]: RESEND_API_KEY environment variable is missing!');
    return {
      success: false,
      error: 'CRITICAL: RESEND_API_KEY environment variable is missing.',
    };
  }

  const client = resend || new Resend(apiKey);

  try {
    let htmlString = payload.html || '';

    if (!htmlString && payload.react) {
      try {
        htmlString = await render(payload.react);
      } catch (renderErr: any) {
        console.error('❌ [@REACT-EMAIL/RENDER ERROR]:', renderErr);
        htmlString = `<div><h1>${payload.subject}</h1><p>GODSMOVE Archival Dispatch</p></div>`;
      }
    }

    console.log(`✉️ [RESEND DISPATCHING] To: ${payload.to} | Subject: "${payload.subject}" | From: ${from}`);

    const dispatchParams: any = {
      from,
      to: payload.to,
      replyTo,
      subject: payload.subject,
      html: htmlString,
    };

    if (payload.attachments && payload.attachments.length > 0) {
      dispatchParams.attachments = payload.attachments;
    }

    const { data, error } = await client.emails.send(dispatchParams);

    if (error) {
      console.error('❌ [RESEND API REJECTION]:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ [RESEND DISPATCH SUCCESS] Provider Message ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('❌ [RESEND UNCAUGHT DISPATCH ERROR]:', err);
    return { success: false, error: err?.message || 'Failed to dispatch email via Resend' };
  }
}
