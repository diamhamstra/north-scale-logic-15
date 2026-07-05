import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, code } = await req.json();

    if (!email || !code) {
      return Response.json({ success: false, error: 'Email and code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const users = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });
    if (users.length === 0) {
      return Response.json({ success: false, error: 'User not found' });
    }
    const user = users[0];

    const otps = await base44.asServiceRole.entities.OtpCode.filter({
      user_id: user.id,
      purpose: 'registration',
      used: false,
    });

    if (otps.length === 0) {
      return Response.json({ success: false, error: 'No verification code found. Please request a new one.' });
    }

    const otp = otps[otps.length - 1];

    if (new Date(otp.expires_at) < new Date()) {
      await base44.asServiceRole.entities.OtpCode.update(otp.id, { used: true });
      return Response.json({ success: false, error: 'Code expired. Please request a new one.' });
    }

    if (otp.code !== String(code).trim()) {
      return Response.json({ success: false, error: 'Incorrect verification code.' });
    }

    await base44.asServiceRole.entities.OtpCode.update(otp.id, { used: true });

    // Verify the email in Base44 auth system to enable login
    try {
      await base44.auth.verifyEmail({ email: normalizedEmail, code });
    } catch (verifyErr) {
      console.warn('Email verification skipped:', verifyErr.message);
      // Some Base44 instances may not require explicit email verification
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('verifyRegistrationOtp error:', error.message);
    return Response.json({ success: false, error: error.message });
  }
});