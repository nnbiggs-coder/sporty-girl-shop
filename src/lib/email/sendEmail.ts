import { Resend } from "resend";
import { emailConfig, appConfig } from "@/lib/config";
import type { NotificationType } from "@/types";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!emailConfig.apiKey) return null;
  if (!resend) resend = new Resend(emailConfig.apiKey);
  return resend;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.log("[email] No RESEND_API_KEY — would send:", params.subject, "to", params.to);
    return false;
  }

  try {
    await client.emails.send({
      from: emailConfig.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}

export async function sendNotificationEmail(
  type: NotificationType,
  to: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const templates: Record<NotificationType, { subject: string; body: string }> = {
    price_drop: {
      subject: `Price drop on a watchlisted item — ${appConfig.name}`,
      body: `<p>Good news! An item on your watchlist dropped in price.</p>
        <p><strong>${payload.title}</strong> is now $${payload.new_price} (was $${payload.old_price}).</p>
        <p><a href="${payload.listing_url}">View listing</a></p>`,
    },
    new_match: {
      subject: `New listing matches your saved search — ${appConfig.name}`,
      body: `<p>A new listing matches your saved search "${payload.search_name}".</p>
        <p><strong>${payload.title}</strong> — $${payload.price}</p>
        <p><a href="${payload.listing_url}">View listing</a></p>`,
    },
    sold: {
      subject: `Your item sold! — ${appConfig.name}`,
      body: `<p>Congratulations! Your listing <strong>${payload.title}</strong> has sold for $${payload.sale_price}.</p>
        <p>Your estimated payout: $${payload.payout_amount}</p>
        <p><a href="${payload.dashboard_url}">View in dashboard</a></p>`,
    },
    restock: {
      subject: `Similar item available — ${appConfig.name}`,
      body: `<p>A similar item to one you were interested in is now available.</p>
        <p><a href="${payload.listing_url}">View listing</a></p>`,
    },
  };

  const template = templates[type];
  return sendEmail({
    to,
    subject: template.subject,
    html: wrapEmailHtml(template.body),
  });
}

function wrapEmailHtml(body: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Inter, sans-serif; color: #111827; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px;">
          <strong>${appConfig.name}</strong>
        </div>
        ${body}
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>You received this email because of activity on your ${appConfig.name} account.</p>
        </div>
      </body>
    </html>
  `;
}
