import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const POSTMARK_API_KEY = Deno.env.get('POSTMARK_API_KEY');
const FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL');
const FROM_NAME = Deno.env.get('POSTMARK_FROM_NAME');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = {
      secrets_present: {
        POSTMARK_API_KEY: !!POSTMARK_API_KEY,
        POSTMARK_FROM_EMAIL: FROM_EMAIL || null,
        POSTMARK_FROM_NAME: FROM_NAME || null,
      },
    };

    // 1. Validate the server token
    const serverRes = await fetch('https://api.postmarkapp.com/server', {
      headers: { 'Accept': 'application/json', 'X-Postmark-Server-Token': POSTMARK_API_KEY },
    });
    const serverData = await serverRes.json();
    result.token_valid = serverRes.ok;
    result.server_name = serverRes.ok ? serverData.Name : null;
    result.token_error = serverRes.ok ? null : serverData.Message;

    // 2. Check sender signatures via account-level (may need account token) — fall back gracefully
    // Send a real test email to the admin to confirm end-to-end delivery
    const sendRes = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': POSTMARK_API_KEY,
      },
      body: JSON.stringify({
        From: `${FROM_NAME} <${FROM_EMAIL}>`,
        To: user.email,
        Subject: 'North Scale — Postmark configuration test',
        TextBody: `This is a test email confirming your Postmark configuration is working.\n\nFrom: ${FROM_NAME} <${FROM_EMAIL}>\n\nNorth Scale`,
      }),
    });
    const sendData = await sendRes.json();
    result.test_email_sent = sendRes.ok;
    result.test_email_to = user.email;
    result.send_error = sendRes.ok ? null : sendData.Message;
    result.send_error_code = sendRes.ok ? null : sendData.ErrorCode;

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});