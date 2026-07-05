import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function getPostmarkConfig() {
  return {
    apiKey: Deno.env.get('POSTMARK_API_KEY') || '',
    fromEmail: Deno.env.get('POSTMARK_FROM_EMAIL') || 'portal@northscale.capital',
    fromName: Deno.env.get('POSTMARK_FROM_NAME') || 'North Scale',
  };
}

async function sendPostmarkEmail(opts) {
  const { to, subject, textBody, htmlBody } = opts;
  const { apiKey, fromEmail, fromName } = getPostmarkConfig();
  if (!apiKey) throw new Error('POSTMARK_API_KEY not configured');
  if (!to || !subject) throw new Error('to and subject are required');
  const payload = { From: `${fromName} <${fromEmail}>`, To: to, Subject: subject };
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
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) throw new Error(data.Message || data.message || 'Postmark error');
  return data;
}

function renderBrandedEmail({ preheader = '', eyebrow, heading, intro, code = '', ctaLabel = '', ctaUrl = '', note = '' }) {
  const codeBlock = code
    ? `<tr><td style="padding:4px 40px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border:1px solid #26324d;background-color:#070b14;padding:24px 16px;text-align:center;"><div style="font-family:'Courier New',Courier,monospace;font-size:34px;line-height:1;letter-spacing:14px;color:#f2f5fa;font-weight:700;padding-left:14px;">${code}</div></td></tr></table></td></tr>`
    : '';
  const ctaBlock = ctaLabel && ctaUrl
    ? `<tr><td style="padding:6px 40px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background-color:#f2f5fa;"><a href="${ctaUrl}" style="display:block;text-align:center;color:#05070d;text-decoration:none;font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:3px;padding:16px 12px;">${ctaLabel}</a></td></tr></table></td></tr>`
    : '';
  const noteBlock = note
    ? `<tr><td style="padding:8px 40px 0;"><p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;line-height:20px;color:#6f7d94;">${note}</p></td></tr>`
    : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="x-apple-disable-message-reformatting"><title>North Scale</title></head><body style="margin:0;padding:0;background-color:#05070d;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#05070d;">${preheader}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#05070d;"><tr><td align="center" style="padding:44px 16px;"><table role="presentation" cellpadding="0" cellspacing="0" width="520" style="width:520px;max-width:520px;background-color:#0a0f1a;border:1px solid #1c2740;"><tr><td align="center" style="padding:30px 40px 26px;border-bottom:1px solid #1c2740;"><span style="font-family:'Courier New',Courier,monospace;font-size:20px;color:#5c6b85;">/</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:6px;color:#f2f5fa;padding:0 12px;">scale</span><span style="font-family:'Courier New',Courier,monospace;font-size:20px;color:#5c6b85;">/</span></td></tr><tr><td style="padding:34px 40px 8px;"><p style="margin:0 0 14px;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#6f7d94;">${eyebrow}</p><h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.1;font-weight:400;color:#f2f5fa;">${heading}</h1><p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:13px;line-height:24px;color:#aeb9cc;">${intro}</p></td></tr>${codeBlock}${ctaBlock}${noteBlock}<tr><td style="padding:30px 40px 34px;"><p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;line-height:22px;color:#8a97ac;">north scale</p></td></tr><tr><td style="padding:22px 40px 26px;border-top:1px solid #1c2740;background-color:#070b14;"><p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;line-height:18px;color:#5c6b85;">this is an automated security message. if you did not initiate this request, no action is required and you may disregard this email.</p><p style="margin:12px 0 0;font-family:'Courier New',Courier,monospace;font-size:10px;line-height:18px;color:#465266;">© ${new Date().getFullYear()} north scale · systematic investment strategies</p></td></tr></table></td></tr></table></body></html>`;
}

const APP_BASE_URL =
  Deno.env.get('APP_BASE_URL') ||
  Deno.env.get('PUBLIC_APP_URL') ||
  'https://northscale.capital';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    console.log('Looking up user for:', normalizedEmail);
    let users = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });
    if (users.length === 0) {
      const recentUsers = await base44.asServiceRole.entities.User.list('-created_date', 200);
      const match = recentUsers.find(
        (u) => typeof u.email === 'string' && u.email.toLowerCase().trim() === normalizedEmail,
      );
      if (match) users = [match];
    }
    console.log('Users found:', users.length);
    if (users.length === 0) {
      console.log('No user found for', normalizedEmail);
      return Response.json({ success: true });
    }

    // Create our custom token for the reset link
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Clean old tokens
    try {
      const old = await base44.asServiceRole.entities.PasswordResetToken.filter({ email: normalizedEmail, used: false });
      await Promise.all(old.map(t => base44.asServiceRole.entities.PasswordResetToken.delete(t.id)));
    } catch (_) {}

    await base44.asServiceRole.entities.PasswordResetToken.create({
      email: normalizedEmail,
      token,
      expires_at: expiresAt,
      used: false,
    });

    const resetLink = `${APP_BASE_URL}/reset-password?token=${token}`;

    // Send via Postmark
    await sendPostmarkEmail({
      to: normalizedEmail,
      subject: 'Reset your North Scale password',
      textBody: `A password reset was requested for your North Scale account.\n\nClick the link below to set a new password. This link expires in 1 hour.\n\n${resetLink}\n\nIf you did not request this, you can safely ignore this email.\n\nNorth Scale`,
      htmlBody: renderBrandedEmail({
        preheader: 'Reset your north scale password — this link expires in 1 hour.',
        eyebrow: 'ACCOUNT SECURITY',
        heading: 'reset your password',
        intro: 'a password reset was requested for your north scale account. use the button below to set a new password. this link expires in 1 hour.',
        ctaLabel: 'set a new password',
        ctaUrl: resetLink,
        note: 'if you did not request this, you can safely ignore this email — your password will remain unchanged.',
      }),
    });

    console.log('Password reset email sent via Postmark to', normalizedEmail);
    return Response.json({ success: true });
  } catch (error) {
    console.error('sendPasswordReset error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});