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

function nudgeEmailHtml(first_name) {
  return `<!DOCTYPE html><html><body style="font-family:monospace;background:#0a0f1e;color:#e2e8f0;margin:0;padding:40px 20px;">
  <div style="max-width:600px;margin:0 auto;border:1px solid #1e2a4a;padding:40px;">
    <p style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#64748b;margin:0 0 8px;">North Scale Investor Portal</p>
    <h1 style="font-size:24px;margin:0 0 24px;color:#e2e8f0;">Complete your onboarding</h1>
    <p style="font-size:12px;line-height:1.8;color:#94a3b8;margin:0 0 16px;">Hello ${first_name},</p>
    <p style="font-size:12px;line-height:1.8;color:#94a3b8;margin:0 0 16px;">We noticed you haven't completed your onboarding yet.</p>
    <p style="font-size:12px;line-height:1.8;color:#94a3b8;margin:0 0 16px;">To activate your Investor Portal and begin the account setup process, please complete the remaining steps:</p>
    <ul style="font-size:12px;line-height:2;color:#94a3b8;margin:0 0 24px;padding-left:20px;">
      <li>Investor Profile — Tax residency, net worth, investment details</li>
      <li>Legal Agreements — Liability Waiver, Terms of Use, Risk Disclosure</li>
      <li>Identity Verification — Passport or government-issued ID</li>
    </ul>
    <p style="font-size:12px;line-height:1.8;color:#94a3b8;margin:0 0 32px;">Once completed, you'll gain access to portfolio performance, document downloads, and account management.</p>
    <a href="https://northscale.capital/complete-profile" style="display:inline-block;background:#e2e8f0;color:#0a0f1e;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:14px 28px;text-decoration:none;margin-top:8px;">Continue Onboarding →</a>
    <hr style="border:none;border-top:1px solid #1e2a4a;margin:32px 0 16px;"/>
    <p style="font-size:10px;color:#1e2a4a;margin:0;">northscale.capital · Automated reminder</p>
  </div></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const threshold = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago

    // Fetch profiles stuck in onboarding > 48 hours
    const allProfiles = await base44.asServiceRole.entities.InvestorProfile.list("-created_date", 500);
    const stuckProfiles = allProfiles.filter(p => {
      if (p.onboarding_stage === "complete" || p.onboarding_stage === "passport") return false;
      const created = new Date(p.created_date);
      return created < threshold;
    });

    let nudgedCount = 0;
    let emailErrors = [];

    for (const profile of stuckProfiles) {
      try {
        const first_name = (profile.full_name || profile.email || "there").split(" ")[0];

        // Send email reminder
        await sendPostmarkEmail({
          to: profile.email,
          subject: "Complete your North Scale onboarding",
          htmlBody: nudgeEmailHtml(first_name),
          textBody: `Hello ${first_name},\n\nWe noticed you haven't completed your onboarding yet.\n\nTo activate your Investor Portal, please complete:\n- Investor Profile\n- Legal Agreements\n- Identity Verification\n\nContinue here: https://northscale.capital/complete-profile\n\nKind regards,\nNorth Scale`,
        });

        // Create in-app notification
        await base44.asServiceRole.entities.Notification.create({
          user_id: profile.user_id,
          category: "Account",
          title: "Onboarding Incomplete",
          message: "Complete your profile, agreements, and identity verification to activate your Investor Portal.",
          action_label: "Continue Onboarding",
          action_url: "/complete-profile",
          is_action_required: true,
          sent_by_admin: false,
        });

        // Audit log
        await base44.asServiceRole.entities.AuditLog.create({
          action: "ONBOARDING_REMINDER_SENT",
          object_type: "InvestorProfile",
          object_id: profile.id,
          object_label: `${profile.full_name || profile.email} — ${profile.onboarding_stage || "profile"}`,
          user_id: profile.user_id,
          actor_id: "system",
        });

        nudgedCount++;
      } catch (e) {
        console.error(`Nudge failed for ${profile.email}:`, e.message);
        emailErrors.push({ email: profile.email, error: e.message });
      }
    }

    return Response.json({
      success: true,
      nudged_count: nudgedCount,
      total_stuck: stuckProfiles.length,
      errors: emailErrors,
    });
  } catch (error) {
    console.error("Handler error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});