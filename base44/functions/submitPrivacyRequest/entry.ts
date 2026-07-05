import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function extractSessionToken(body) {
  if (!body) return null;
  const token = body.session_token != null ? body.session_token : body.token;
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

async function resolveUser(base44, sessionToken) {
  if (sessionToken) {
    const fromToken = await resolveUserFromSession(base44, sessionToken);
    if (fromToken) return fromToken;
  }

  try {
    const user = await base44.auth.me();
    if (user && user.id) {
      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'user',
      };
    }
  } catch {
    // Fall through
  }

  return null;
}

async function requireUser(base44, sessionToken) {
  const user = await resolveUser(base44, sessionToken);
  if (!user) {
    return { user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, error: null };
}

const VALID_TYPES = new Set(['export', 'deletion', 'rectification']);

const SUBJECTS: Record<string, string> = {
  export: 'Data Export Request (GDPR Art. 15 / 20)',
  deletion: 'Account Deletion Request (GDPR Art. 17)',
  rectification: 'Data Rectification Request (GDPR Art. 16)',
};

function generateTicketId() {
  const n = Math.floor(Math.random() * 900000) + 100000;
  return `NS-${n}`;
}

async function notifyAdmins(base44, title: string, message: string) {
  const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
  await Promise.all(
    admins.map((a) =>
      base44.asServiceRole.entities.Notification.create({
        user_id: a.id,
        category: 'Compliance',
        title,
        message,
        is_read: false,
        sent_by_admin: false,
        is_action_required: true,
        action_label: 'Review Request',
        action_url: '/admin-portal?m=support',
      })
    )
  );
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { user, error } = await requireUser(base44, extractSessionToken(body));
    if (error) return error;

    const { request_type, message: userMessage } = body;

    if (!request_type || !VALID_TYPES.has(request_type)) {
      return Response.json({ error: 'Invalid request_type' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.InvestorProfile.filter({ user_id: user.id });
    const profile = profiles[0];

    const subject = SUBJECTS[request_type];
    const ticketMessage = [
      `Privacy request type: ${request_type}`,
      `Submitted by: ${user.full_name || user.email} (${user.email})`,
      userMessage ? `\nAdditional details:\n${userMessage}` : '',
      '\n---',
      'This ticket was auto-created from the investor portal Privacy & Data Rights section.',
      'Respond within one calendar month as required under GDPR Art. 12(3).',
    ].join('\n');

    const ticket = await base44.asServiceRole.entities.SupportTicket.create({
      ticket_id: generateTicketId(),
      user_id: user.id,
      investor_name: user.full_name || profile?.full_name || '',
      investor_email: user.email,
      subject,
      category: 'Account Access',
      priority: request_type === 'deletion' ? 'High' : 'Medium',
      status: 'OPEN',
      message: ticketMessage,
      last_message_at: new Date().toISOString(),
    });

    await base44.asServiceRole.entities.AuditLog.create({
      user_id: user.id,
      actor_id: user.id,
      action: 'GDPR_REQUEST_SUBMITTED',
      object_type: 'SupportTicket',
      object_id: ticket.id,
      object_label: subject,
      metadata_json: JSON.stringify({ request_type }),
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
    });

    await notifyAdmins(
      base44,
      `Privacy Request: ${request_type}`,
      `${user.email} submitted a ${request_type} request. Ticket ${ticket.ticket_id}.`
    );

    return Response.json({ success: true, ticket_id: ticket.ticket_id });
  } catch (err) {
    console.error('submitPrivacyRequest error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
