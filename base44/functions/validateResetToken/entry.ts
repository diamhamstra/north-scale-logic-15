import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return Response.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Validate our custom token
    const tokens = await base44.asServiceRole.entities.PasswordResetToken.filter({ token, used: false });
    if (tokens.length === 0) {
      return Response.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
    }

    const resetToken = tokens[0];

    // Check expiry
    if (new Date(resetToken.expires_at) < new Date()) {
      await base44.asServiceRole.entities.PasswordResetToken.update(resetToken.id, { used: true });
      return Response.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 });
    }

    // Find user
    const users = await base44.asServiceRole.entities.User.filter({ email: resetToken.email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found.' }, { status: 404 });
    }

    const user = users[0];

    // Hash and update the password field used by customLogin
    const hashed = await bcrypt.hash(newPassword, 10);
    await base44.asServiceRole.entities.User.update(user.id, { password: hashed });

    // Invalidate all existing sessions after password change
    try {
      const sessions = await base44.asServiceRole.entities.UserSession.filter({ user_id: user.id });
      await Promise.all(
        sessions.map((s) => base44.asServiceRole.entities.UserSession.update(s.id, { is_active: false }))
      );
    } catch (sessionErr) {
      console.warn('Session invalidation skipped:', sessionErr.message);
    }

    // Mark token as used
    await base44.asServiceRole.entities.PasswordResetToken.update(resetToken.id, { used: true });

    console.log('Password reset completed for', resetToken.email);
    return Response.json({ success: true });
  } catch (error) {
    console.error('validateResetToken error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});