import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function getPostmarkConfig() {
  return {
    apiKey: Deno.env.get('POSTMARK_API_KEY') || '',
  };
}

async function addPostmarkSuppression(email: string) {
  const { apiKey } = getPostmarkConfig();
  if (!apiKey) return;
  const streamId = Deno.env.get('POSTMARK_BROADCAST_STREAM') || 'broadcast';
  try {
    const res = await fetch(`https://api.postmarkapp.com/message-streams/${streamId}/suppressions`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': apiKey,
      },
      body: JSON.stringify({ Suppressions: [{ EmailAddress: email }] }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('Postmark suppression failed:', data.Message || res.status);
    }
  } catch (e) {
    console.error('Postmark suppression error:', e.message);
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function findSubscriber(base44, email?: string, token?: string) {
  if (token) {
    const byToken = await base44.asServiceRole.entities.NewsletterSubscriber.filter({
      unsubscribe_token: token,
    });
    if (byToken.length > 0) return byToken[0];
  }

  if (email) {
    const normalized = email.toLowerCase().trim();
    let records = await base44.asServiceRole.entities.NewsletterSubscriber.filter({
      email: normalized,
    });
    if (records.length === 0) {
      const all = await base44.asServiceRole.entities.NewsletterSubscriber.list('-created_date', 500);
      const match = all.find(
        (s) => typeof s.email === 'string' && s.email.toLowerCase().trim() === normalized,
      );
      if (match) records = [match];
    }
    if (records.length > 0) return records[0];
  }

  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { email, token } = body;

    if (!email && !token) {
      return Response.json({ error: 'Email or token is required' }, { status: 400 });
    }

    if (email && !isValidEmail(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const normalizedEmail = email ? email.toLowerCase().trim() : undefined;
    const record = await findSubscriber(base44, normalizedEmail, token);

    if (!record) {
      return Response.json({ success: true });
    }

    if (record.status === 'unsubscribed') {
      return Response.json({ success: true, already_unsubscribed: true });
    }

    const now = new Date().toISOString();
    await base44.asServiceRole.entities.NewsletterSubscriber.update(record.id, {
      status: 'unsubscribed',
      unsubscribed_at: now,
    });

    await addPostmarkSuppression(record.email.toLowerCase().trim());

    return Response.json({ success: true });
  } catch (error) {
    console.error('unsubscribeNewsletter error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
