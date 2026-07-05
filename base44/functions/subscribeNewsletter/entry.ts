import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function getPostmarkConfig() {
  return {
    apiKey: Deno.env.get('POSTMARK_API_KEY') || '',
    fromEmail: Deno.env.get('POSTMARK_FROM_EMAIL') || 'portal@northscale.capital',
    fromName: Deno.env.get('POSTMARK_FROM_NAME') || 'North Scale',
  };
}

async function sendPostmarkEmail(opts: { to: string; subject: string; textBody?: string; htmlBody?: string }) {
  const { to, subject, textBody, htmlBody } = opts;
  const { apiKey, fromEmail, fromName } = getPostmarkConfig();
  if (!apiKey) throw new Error('POSTMARK_API_KEY not configured');
  if (!to || !subject) throw new Error('to and subject are required');
  const payload: Record<string, string> = {
    From: `${fromName} <${fromEmail}>`,
    To: to,
    Subject: subject,
  };
  if (textBody) payload.TextBody = textBody;
  if (htmlBody) payload.HtmlBody = htmlBody;
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': apiKey,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.Message || data.message || 'Postmark error');
  return data;
}

async function removePostmarkSuppression(email: string) {
  const { apiKey } = getPostmarkConfig();
  if (!apiKey) return;
  const streamId = Deno.env.get('POSTMARK_BROADCAST_STREAM') || 'broadcast';
  try {
    await fetch(`https://api.postmarkapp.com/message-streams/${streamId}/suppressions/delete`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': apiKey,
      },
      body: JSON.stringify({ Suppressions: [{ EmailAddress: email }] }),
    });
  } catch (e) {
    console.error('Postmark suppression removal failed:', e.message);
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const APP_BASE_URL =
  Deno.env.get('APP_BASE_URL') ||
  Deno.env.get('PUBLIC_APP_URL') ||
  'https://northscale.capital';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { email, source = 'website_modal' } = body;

    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const now = new Date().toISOString();
    let token = generateToken();
    let existing = await base44.asServiceRole.entities.NewsletterSubscriber.filter({
      email: normalizedEmail,
    });

    if (existing.length === 0) {
      const all = await base44.asServiceRole.entities.NewsletterSubscriber.list('-created_date', 500);
      const match = all.find(
        (s) => typeof s.email === 'string' && s.email.toLowerCase().trim() === normalizedEmail,
      );
      if (match) existing = [match];
    }

    if (existing.length > 0) {
      const record = existing[0];
      if (record.status === 'subscribed') {
        return Response.json({ success: true, already_subscribed: true });
      }
      token = record.unsubscribe_token || token;
      await base44.asServiceRole.entities.NewsletterSubscriber.update(record.id, {
        status: 'subscribed',
        subscribed_at: now,
        unsubscribed_at: null,
        unsubscribe_token: token,
        source,
      });
      await removePostmarkSuppression(normalizedEmail);
    } else {
      await base44.asServiceRole.entities.NewsletterSubscriber.create({
        email: normalizedEmail,
        status: 'subscribed',
        source,
        subscribed_at: now,
        unsubscribe_token: token,
      });
    }

    const unsubscribeLink = `${APP_BASE_URL}/unsubscribe?token=${token}`;

    try {
      await sendPostmarkEmail({
        to: normalizedEmail,
        subject: 'Investor Updates — Subscription Confirmed',
        textBody: `Thank you for subscribing to North Scale investor updates.\n\nYou will receive periodic market intelligence, fund commentary, and institutional research briefings.\n\nTo unsubscribe at any time, visit:\n${unsubscribeLink}\n\nNorth Scale\nThis communication is intended for qualified investors and allocators.`,
        htmlBody: `<p>Thank you for subscribing to North Scale investor updates.</p><p>You will receive periodic market intelligence, fund commentary, and institutional research briefings.</p><p><a href="${unsubscribeLink}">Unsubscribe from investor updates</a></p><p>North Scale<br><small>This communication is intended for qualified investors and allocators.</small></p>`,
      });
    } catch (e) {
      console.error('Confirmation email failed:', e.message);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('subscribeNewsletter error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
