import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import bcrypt from 'npm:bcryptjs@2.4.3';

const ACCESS_STATUS_RANK = {
  approved: 0,
  pending: 1,
  rejected: 2,
};

function profileTimestamp(profile, field) {
  const value = profile[field];
  return value ? new Date(value).getTime() : 0;
}

function generateAccountId(profileId) {
  if (!profileId) return null;
  const hex = String(profileId).replace(/-/g, '').slice(-6).toUpperCase();
  return `NS-${String(parseInt(hex, 16) % 1000000).padStart(6, '0')}`;
}

function pickPrimaryInvestorProfile(profiles) {
  if (!profiles || profiles.length === 0) return null;
  if (profiles.length === 1) return profiles[0];
  return [...profiles].sort((a, b) => {
    const rankA = ACCESS_STATUS_RANK[a.access_status || 'pending'] ?? 1;
    const rankB = ACCESS_STATUS_RANK[b.access_status || 'pending'] ?? 1;
    if (rankA !== rankB) return rankA - rankB;
    const createdDiff = profileTimestamp(a, 'created_date') - profileTimestamp(b, 'created_date');
    if (createdDiff !== 0) return createdDiff;
    return profileTimestamp(a, 'updated_date') - profileTimestamp(b, 'updated_date');
  })[0];
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.toLowerCase().trim() : '';
}

async function findUsersByEmail(base44, normalizedEmail) {
  const seen = new Set();
  const users = [];
  const byFilter = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });
  for (const user of byFilter) {
    if (!user?.id || seen.has(user.id)) continue;
    seen.add(user.id);
    users.push(user);
  }
  const recentUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);
  for (const user of recentUsers) {
    if (typeof user.email !== 'string') continue;
    if (normalizeEmail(user.email) !== normalizedEmail) continue;
    if (!user.id || seen.has(user.id)) continue;
    seen.add(user.id);
    users.push(user);
  }
  return users;
}

async function findUserByEmail(base44, normalizedEmail) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const users = await findUsersByEmail(base44, normalizedEmail);
    if (users.length > 0) return users[0];
    if (attempt < 5) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  return null;
}

function mergeProfilesById(primary, additional) {
  const seen = new Set(primary.map((profile) => profile.id));
  const merged = [...primary];
  for (const profile of additional) {
    if (!profile?.id || seen.has(profile.id)) continue;
    merged.push(profile);
    seen.add(profile.id);
  }
  return merged;
}

async function loadProfilesByEmail(base44, normalizedEmail) {
  const byEmail = await base44.asServiceRole.entities.InvestorProfile.filter({ email: normalizedEmail });
  let emailMatches = byEmail.filter((profile) => normalizeEmail(profile.email) === normalizedEmail);
  if (emailMatches.length === 0) {
    const recent = await base44.asServiceRole.entities.InvestorProfile.list('-created_date', 2000);
    emailMatches = recent.filter((profile) => normalizeEmail(profile.email) === normalizedEmail);
  }
  const approvedRows = await base44.asServiceRole.entities.InvestorProfile.filter({ access_status: 'approved' });
  emailMatches = mergeProfilesById(
    emailMatches,
    approvedRows.filter((profile) => normalizeEmail(profile.email) === normalizedEmail),
  );
  return emailMatches;
}

async function loadExistingProfilesForRegistration(base44, normalizedEmail, userId) {
  let profiles = [];
  if (userId) {
    const byUser = await base44.asServiceRole.entities.InvestorProfile.filter({ user_id: userId });
    profiles = mergeProfilesById(profiles, byUser);
  }
  const users = await findUsersByEmail(base44, normalizedEmail);
  for (const user of users) {
    const byUser = await base44.asServiceRole.entities.InvestorProfile.filter({ user_id: user.id });
    profiles = mergeProfilesById(profiles, byUser);
  }
  profiles = mergeProfilesById(profiles, await loadProfilesByEmail(base44, normalizedEmail));
  return profiles;
}

Deno.serve(async (req) => {
  let step = 'parse_body';
  try {
    const base44 = createClientFromRequest(req);
    const { email, password, full_name, organization, referred_by, monthly_investment, complete_registration } =
      await req.json();

    if (!email || !password) {
      return Response.json({ success: false, error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const completingOtp = complete_registration === true;

    step = 'check_existing';
    const existingUsers = await findUsersByEmail(base44, normalizedEmail);
    let user = existingUsers.length > 0 ? existingUsers[0] : null;

    if (existingUsers.length > 0 && !completingOtp) {
      return Response.json({
        success: false,
        error: 'An account with this email already exists. Please sign in with your password or Google.',
      });
    }

    if (!user && completingOtp) {
      return Response.json({
        success: false,
        error: 'Registration session expired. Please request access again.',
      });
    }

    if (!user) {
      step = 'auth_register';
      try {
        await base44.auth.register({ email: normalizedEmail, password });
      } catch (registerErr) {
        const msg = String(registerErr.message || registerErr).toLowerCase();
        if (msg.includes('409') || msg.includes('conflict') || msg.includes('already') || msg.includes('exists')) {
          return Response.json({
            success: false,
            error: 'An account with this email already exists. Please sign in with your password or Google.',
          });
        }
        return Response.json({ success: false, error: `register failed: ${registerErr.message}` });
      }

      step = 'fetch_user';
      user = await findUserByEmail(base44, normalizedEmail);

      if (!user) {
        return Response.json({
          success: false,
          error: `step:${step} — user not found after auth.register(). Try again in a moment.`,
        });
      }

      step = 'send_otp';
      // Send our own branded, trackable verification code — this is the code
      // verifyRegistrationOtp checks, and the same one the "resend" button re-sends.
      // Relying on the platform's native auth.register() email here caused a mismatch:
      // that email carries a different code than what verification (and any resend) checks.
      const otpResult = await base44.functions.invoke('sendRegistrationOtp', { email: normalizedEmail });
      if (!otpResult.data?.success) {
        return Response.json({
          success: false,
          error: otpResult.data?.error || 'Could not send verification code. Please try again.',
        });
      }
    }

    step = 'sync_password';
    const hashed = await bcrypt.hash(password, 10);
    await base44.asServiceRole.entities.User.update(user.id, { password: hashed });

    step = 'check_profile';
    const profiles = await loadExistingProfilesForRegistration(base44, normalizedEmail, user.id);
    const existingProfile = pickPrimaryInvestorProfile(profiles);

    if (existingProfile?.id && existingProfile.user_id !== user.id) {
      const accountId = generateAccountId(existingProfile.id) || '';
      await base44.asServiceRole.entities.InvestorProfile.update(existingProfile.id, {
        user_id: user.id,
        email: normalizedEmail,
        account_id: existingProfile.account_id || accountId,
      });
    }
    let profileId = existingProfile?.id;
    if (!existingProfile) {
      step = 'create_profile';
      const newProfile = await base44.asServiceRole.entities.InvestorProfile.create({
        user_id: user.id,
        full_name: full_name || '',
        email: normalizedEmail,
        organization: organization || '',
        referred_by: referred_by || '',
        monthly_investment: monthly_investment || '',
        access_status: 'pending',
        onboarding_stage: 'profile',
        profile_complete: false,
        account_id: '',
      });
      profileId = newProfile.id;
      const accountId = generateAccountId(profileId);
      if (accountId) {
        await base44.asServiceRole.entities.InvestorProfile.update(profileId, { account_id: accountId });
      }

      base44.functions.invoke('syncInvestorToOneDrive', { profile_id: newProfile.id }).catch(function (e) {
        console.warn('OneDrive sync on registration failed:', e.message);
      });

      base44.functions.invoke('automationEngine', {
        event: 'NEW_REGISTRATION',
        data: {
          user_id: user.id,
          profile_id: newProfile.id,
          email: normalizedEmail,
          full_name: full_name || '',
          referred_by: referred_by || '',
        },
      }).catch(function () {});
    } else {
      step = 'update_profile';
      const existing = existingProfile;
      profileId = existing.id;
      const patch = {
        full_name: full_name || existing.full_name || '',
        email: normalizedEmail,
        organization: organization || existing.organization || '',
        referred_by: referred_by || existing.referred_by || '',
        monthly_investment: monthly_investment || existing.monthly_investment || '',
      };
      if (!patch.account_id) {
        patch.account_id = generateAccountId(existing.id) || '';
      }
      const changed =
        patch.full_name !== (existing.full_name || '') ||
        patch.email !== (existing.email || '') ||
        patch.organization !== (existing.organization || '') ||
        patch.referred_by !== (existing.referred_by || '') ||
        patch.monthly_investment !== (existing.monthly_investment || '');
      if (changed) {
        await base44.asServiceRole.entities.InvestorProfile.update(existing.id, patch);
      }
    }

    return Response.json({
      success: true,
      email: normalizedEmail,
      profile_id: profileId,
    });
  } catch (error) {
    const msg = `step:${step} — ${error.message}`;
    console.error('[registerWithOtp]', msg);
    return Response.json({ success: false, error: msg });
  }
});