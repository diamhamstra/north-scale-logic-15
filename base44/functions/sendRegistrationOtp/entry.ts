import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const POSTMARK_API_KEY = Deno.env.get('POSTMARK_API_KEY');
const FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL');
const FROM_NAME = Deno.env.get('POSTMARK_FROM_NAME');

function generateOtpCode() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const num = (bytes[0] << 16 | bytes[1] << 8 | bytes[2]) % 900000;
  return String(num + 100000);
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

async function sendOtpEmail(to, code) {
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': POSTMARK_API_KEY,
    },
    body: JSON.stringify({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: to,
      Subject: 'Your North Scale verification code',
      TextBody: `Your verification code is:\n\n${code}\n\nThis code expires in 10 minutes.\n\nNorth Scale`,
      HtmlBody: renderBrandedEmail({
        preheader: `Your north scale verification code is ${code}`,
        eyebrow: 'VERIFY EMAIL',
        heading: 'verification code',
        intro: 'use the code below to verify your email and continue your north scale registration. this code expires in 10 minutes.',
        code,
        note: 'for your security, never share this code with anyone — including north scale staff.',
      }),
    }),
  });
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.Message || 'Failed to send email');
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ success: false, error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const users = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });
    if (users.length === 0) {
      return Response.json({ success: false, error: 'User not found' });
    }
    const user = users[0];

    const oldOtps = await base44.asServiceRole.entities.OtpCode.filter({
      user_id: user.id,
      purpose: 'registration',
      used: false,
    });
    for (const otp of oldOtps) {
      await base44.asServiceRole.entities.OtpCode.update(otp.id, { used: true });
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await base44.asServiceRole.entities.OtpCode.create({
      user_id: user.id,
      email: normalizedEmail,
      code,
      purpose: 'registration',
      expires_at: expiresAt,
      used: false,
    });

    await sendOtpEmail(normalizedEmail, code);

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('sendRegistrationOtp error:', error.message);
    return Response.json({ success: false, error: error.message });
  }
});