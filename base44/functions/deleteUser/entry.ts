import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
function extractSessionToken(body) {
  if (!body) return null;
  const token = body.session_token ?? body.token;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

async function resolveUserFromSession(base44, sessionToken) {
  const sessions = await base44.asServiceRole.entities.UserSession.filter({
    token: sessionToken,
    is_active: true,
  });

  if (sessions.length === 0) return null;

  const session = sessions[0];
  if (new Date(session.expires_at) < new Date()) {
    await base44.asServiceRole.entities.UserSession.update(session.id, { is_active: false });
    return null;
  }

  const users = await base44.asServiceRole.entities.User.filter({ id: session.user_id });
  if (users.length === 0) return null;

  const u = users[0];
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role || 'user',
  };
}

async function resolveAdminUser(base44, sessionToken) {
  if (sessionToken) {
    const fromToken = await resolveUserFromSession(base44, sessionToken);
    if (fromToken?.role === 'admin') return fromToken;
  }

  try {
    const user = await base44.auth.me();
    if (user?.id && (user.role || 'user') === 'admin') {
      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'admin',
      };
    }
  } catch {
    // Fall through
  }

  return null;
}

async function requireAdmin(base44, sessionToken) {
  const user = await resolveAdminUser(base44, sessionToken);
  if (!user) {
    return { user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, error: null };
}


Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { user, error } = await requireAdmin(base44, extractSessionToken(body));
    if (error) return error;

    const { profile_id } = body;
    if (!profile_id) {
      return Response.json({ error: 'profile_id is required' }, { status: 400 });
    }

    // Get the profile to find user_id
    const profiles = await base44.asServiceRole.entities.InvestorProfile.filter({ id: profile_id });
    if (profiles.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }
    const profile = profiles[0];
    const userId = profile.user_id;

    // Delete related data first
    // 1. Delete SupportMessages
    await base44.asServiceRole.entities.SupportMessage.deleteMany({ 
      sender_id: userId 
    });

    // 2. Delete SupportTickets
    await base44.asServiceRole.entities.SupportTicket.deleteMany({ 
      user_id: userId 
    });

    // 3. Delete Notifications
    await base44.asServiceRole.entities.Notification.deleteMany({ 
      user_id: userId 
    });

    // 4. Delete AuditLogs
    await base44.asServiceRole.entities.AuditLog.deleteMany({ 
      user_id: userId 
    });

    // 5. Delete PerformanceSnapshots
    await base44.asServiceRole.entities.PerformanceSnapshot.deleteMany({ 
      user_id: userId 
    });

    // 6. Delete ClientNotes
    await base44.asServiceRole.entities.ClientNote.deleteMany({ 
      user_id: userId 
    });

    // 7. Delete ClientTasks
    await base44.asServiceRole.entities.ClientTask.deleteMany({ 
      user_id: userId 
    });

    // 8. Delete OtpCodes
    await base44.asServiceRole.entities.OtpCode.deleteMany({ 
      user_id: userId 
    });

    // 9. Delete UserSessions
    await base44.asServiceRole.entities.UserSession.deleteMany({ 
      user_id: userId 
    });

    // 10. Delete InvestorProfile
    await base44.asServiceRole.entities.InvestorProfile.delete(profile_id);

    // 11. Delete User from User entity
    await base44.asServiceRole.entities.User.delete(userId);

    // Note: Base44 auth user cannot be deleted via API - they would need to re-register
    // The User entity record is deleted, so they can register again with same email

    return Response.json({ success: true, message: 'User and all related data deleted' });
  } catch (error) {
    console.error('deleteUser error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});