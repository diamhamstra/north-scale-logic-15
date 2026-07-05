/**
 * Automation Engine — North Scale Platform
 *
 * Central function for event-driven automation.
 * Called from entity automations and directly from other backend functions.
 *
 * Actions handled:
 *   ACCOUNT_APPROVED, PROFILE_COMPLETED, AGREEMENT_SIGNED, PASSPORT_UPLOADED,
 *   PASSPORT_APPROVED, ENGINE_ACTIVATED, METACOPIER_CONNECTED, ENGINE_COMPLETED,
 *   NEW_REGISTRATION, INQUIRY_SUBMITTED, ADMIN_APPROVAL_NEEDED, AGREEMENT_VERSION_BUMP
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function getPostmarkConfig() {
  return {
    apiKey: Deno.env.get("POSTMARK_API_KEY") || "",
    fromEmail: Deno.env.get("POSTMARK_FROM_EMAIL") || "portal@northscale.capital",
    fromName: Deno.env.get("POSTMARK_FROM_NAME") || "North Scale",
  };
}

async function sendPostmarkEmail(opts) {
  const { to, subject, textBody, htmlBody } = opts;
  const { apiKey, fromEmail, fromName } = getPostmarkConfig();
  if (!apiKey) throw new Error("POSTMARK_API_KEY not configured");
  if (!to || !subject) throw new Error("to and subject are required");
  const payload = { From: `${fromName} <${fromEmail}>`, To: to, Subject: subject };
  if (textBody) payload.TextBody = textBody;
  if (htmlBody) payload.HtmlBody = htmlBody;
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": apiKey,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) throw new Error(data.Message || data.message || "Postmark error");
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
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="x-apple-disable-message-reformatting"><title>North Scale</title></head><body style="margin:0;padding:0;background-color:#05070d;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#05070d;">${preheader}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#05070d;"><tr><td align="center" style="padding:44px 16px;"><table role="presentation" cellpadding="0" cellspacing="0" width="520" style="width:520px;max-width:520px;background-color:#0a0f1a;border:1px solid #1c2740;"><tr><td align="center" style="padding:30px 40px 26px;border-bottom:1px solid #1c2740;"><span style="font-family:'Courier New',Courier,monospace;font-size:20px;color:#5c6b85;">/</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:6px;color:#f2f5fa;padding:0 12px;">north scale</span><span style="font-family:'Courier New',Courier,monospace;font-size:20px;color:#5c6b85;">/</span></td></tr><tr><td style="padding:34px 40px 8px;"><p style="margin:0 0 14px;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#6f7d94;">${eyebrow}</p><h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.1;font-weight:400;color:#f2f5fa;">${heading}</h1><p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:13px;line-height:24px;color:#aeb9cc;">${intro}</p></td></tr>${codeBlock}${ctaBlock}${noteBlock}<tr><td style="padding:22px 40px 26px;border-top:1px solid #1c2740;background-color:#070b14;"><p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;line-height:18px;color:#5c6b85;">this is an automated message from north scale. if you did not expect this email, you may disregard it.</p><p style="margin:12px 0 0;font-family:'Courier New',Courier,monospace;font-size:10px;line-height:18px;color:#465266;">© ${new Date().getFullYear()} north scale</p></td></tr></table></td></tr></table></body></html>`;
}

async function sendEmail(to, subject, textBody, htmlBody = '') {
  if (!to) {
    console.warn("sendEmail: no recipient address, skipping");
    return;
  }
  try {
    console.log("Sending email to", to, "subject:", subject);
    await sendPostmarkEmail({ to, subject, textBody, htmlBody: htmlBody || undefined });
    console.log("Email sent successfully to", to);
  } catch (e) {
    console.error("Postmark send error for", to, ":", e.message);
  }
}

async function sendNotification(base44, userId, category, title, message, opts = {}) {
  return base44.asServiceRole.entities.Notification.create({
    user_id: userId,
    category,
    title,
    message,
    is_read: false,
    sent_by_admin: false,
    is_action_required: opts.is_action_required || false,
    action_label: opts.action_label || undefined,
    action_url: opts.action_url || undefined,
  });
}

async function writeAuditLog(base44, entry) {
  return base44.asServiceRole.entities.AuditLog.create({
    user_id: entry.user_id || "system",
    actor_id: entry.actor_id || "system",
    action: entry.action,
    object_type: entry.object_type || "",
    object_id: entry.object_id || "",
    object_label: entry.object_label || "",
    metadata_json: entry.metadata ? JSON.stringify(entry.metadata) : "{}",
    ip_address: entry.ip_address || "system",
  });
}

async function notifyAdmins(base44, category, title, message, opts = {}) {
  const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
  return Promise.all(admins.map(a =>
    base44.asServiceRole.entities.Notification.create({
      user_id: a.id,
      category,
      title,
      message,
      is_read: false,
      sent_by_admin: false,
      is_action_required: opts.is_action_required || false,
      action_label: opts.action_label,
      action_url: opts.action_url,
    })
  ));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow service-role calls (from automations) — no user auth required for internal events
    const body = await req.json();
    const { event, data } = body;

    if (!event) return Response.json({ error: "Missing event" }, { status: 400 });

    switch (event) {

      // ── CLIENT IS APPROVED ───────────────────────────────────────────────────
      case "ACCOUNT_APPROVED": {
        const { profile_id, user_id, email, full_name, organization, referred_by, actor_id } = data;

        let resolvedUserId = user_id;
        let resolvedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

        if (!resolvedUserId && resolvedEmail) {
          const users = await base44.asServiceRole.entities.User.filter({ email: resolvedEmail });
          resolvedUserId = users[0]?.id || null;
        }

        if (!resolvedEmail && resolvedUserId) {
          try {
            const user = await base44.asServiceRole.entities.User.get(resolvedUserId);
            resolvedEmail = typeof user?.email === 'string' ? user.email.toLowerCase().trim() : '';
          } catch {
            // Continue without email lookup
          }
        }

        if (!resolvedEmail && profile_id) {
          try {
            const profile = await base44.asServiceRole.entities.InvestorProfile.get(profile_id);
            resolvedEmail = typeof profile?.email === 'string' ? profile.email.toLowerCase().trim() : '';
            resolvedUserId = resolvedUserId || profile?.user_id || null;
          } catch {
            // Continue
          }
        }

        base44.functions.invoke("syncInvestorToOneDrive", { profile_id }).catch(e => console.warn("OneDrive sync failed:", e.message));

        let magicUrl = 'https://northscale.capital/complete-profile';
        if (resolvedUserId && resolvedEmail) {
          try {
            const magicToken = crypto.randomUUID();
            await base44.asServiceRole.entities.MagicLinkToken.create({
              user_id: resolvedUserId,
              email: resolvedEmail,
              token: magicToken,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              used: false,
            });
            magicUrl = `https://northscale.capital/auth/callback?token=${magicToken}`;
          } catch (linkErr) {
            console.error("Magic link generation failed:", linkErr.message);
          }
        } else {
          console.warn("ACCOUNT_APPROVED: missing user_id or email — magic link skipped", {
            profile_id,
            user_id: resolvedUserId,
            email: resolvedEmail,
          });
        }

        if (resolvedEmail) {
          const firstName = (full_name || 'Investor').split(' ')[0].toLowerCase();
          await sendEmail(
            resolvedEmail,
            "Your North Scale account has been approved",
            `Dear ${full_name || 'Investor'},\n\nYour allocation profile has been verified by the North Scale team. Your private operating environment is now active.\n\nEnter your environment: ${magicUrl}\n\nThis secure link is single-use and expires in 24 hours.\n\nKind regards,\nNorth Scale Capital`,
            renderBrandedEmail({
              preheader: 'your allocation profile has been verified — your environment is now active.',
              eyebrow: 'ACCOUNT ACCESS',
              heading: `welcome, ${firstName}.`,
              intro: 'your profile has been verified by the north scale team. your private operating environment is now active. use the secure link below to enter — no password required.',
              ctaLabel: 'ENTER YOUR ENVIRONMENT',
              ctaUrl: magicUrl,
              note: 'this secure link is single-use and expires in 24 hours. if you did not apply for a north scale account, please disregard this email.',
            })
          );
        } else {
          console.warn("ACCOUNT_APPROVED: no email address — approval email skipped", { profile_id, user_id: resolvedUserId });
        }
        await Promise.all([
          resolvedUserId ? sendNotification(base44, resolvedUserId, "Account",
            "Account Approved",
            "Your North Scale Capital account has been approved. Use the secure link in your email to enter your environment.",
            { action_label: "Complete Onboarding", action_url: "/complete-profile" }
          ) : Promise.resolve(),
          notifyAdmins(base44, "Account", "Client Approved", `Client account ${resolvedEmail || resolvedUserId || profile_id} has been approved.`),
          writeAuditLog(base44, {
            user_id: resolvedUserId || user_id, actor_id: actor_id || "admin",
            action: "ACCOUNT_APPROVED",
            object_type: "InvestorProfile", object_id: profile_id,
            object_label: resolvedEmail || resolvedUserId || profile_id,
          }),
          // Create CRM record as "approved" client
          (async () => {
            const existing = await base44.asServiceRole.entities.CRMRecord.filter({ profile_id });
            if (existing.length === 0) {
              await base44.asServiceRole.entities.CRMRecord.create({
                user_id: resolvedUserId || user_id,
                email: resolvedEmail || "",
                full_name: full_name || "",
                organization: organization || "",
                referred_by: referred_by || "",
                lead_source: "portal_registration",
                client_status: "approved",
                profile_id,
                registration_date: new Date().toISOString().split("T")[0],
                approval_date: new Date().toISOString().split("T")[0],
              });
            } else {
              await base44.asServiceRole.entities.CRMRecord.update(existing[0].id, {
                client_status: "approved",
                approval_date: new Date().toISOString().split("T")[0],
              });
            }
          })(),
        ]);
        break;
      }

      // ── PROFILE COMPLETED ────────────────────────────────────────────────────
      case "PROFILE_COMPLETED": {
        const { user_id, profile_id } = data;
        base44.functions.invoke("syncInvestorToOneDrive", { profile_id }).catch(e => console.warn("OneDrive sync failed:", e.message));
        await Promise.all([
          sendNotification(base44, user_id, "Account",
            "Profile Completed",
            "Your investor profile has been completed successfully.",
            { action_label: "View Portal", action_url: "/portal" }
          ),
          notifyAdmins(base44, "Account", "Client Profile Completed", `Client ${data.email || user_id} has completed their investor profile.`,
            { action_label: "View Investors", action_url: "/admin-portal" }
          ),
          writeAuditLog(base44, {
            user_id, action: "PROFILE_COMPLETED",
            object_type: "InvestorProfile", object_id: profile_id,
          }),
        ]);
        break;
      }

      // ── AGREEMENT SIGNED ─────────────────────────────────────────────────────
      case "AGREEMENT_SIGNED": {
        const { user_id, agreement_key, agreement_title, version } = data;
        await Promise.all([
          sendNotification(base44, user_id, "Documents",
            "Agreement Signed",
            `Your ${agreement_title} (v${version}) has been successfully signed and archived in your Data Room.`,
            { action_label: "Open Data Room", action_url: "/portal" }
          ),
          writeAuditLog(base44, {
            user_id, action: "AGREEMENT_SIGNED",
            object_type: "Agreement", object_id: agreement_key,
            object_label: `${agreement_title} v${version}`,
          }),
        ]);
        break;
      }

      // ── PASSPORT UPLOADED ────────────────────────────────────────────────────
      case "PASSPORT_UPLOADED": {
        const { user_id, profile_id } = data;
        base44.functions.invoke("syncInvestorToOneDrive", { profile_id }).catch(e => console.warn("OneDrive sync failed:", e.message));
        await Promise.all([
          sendNotification(base44, user_id, "Documents",
            "Passport Uploaded",
            "Your identification document has been uploaded and verified. It is available in your Data Room.",
            { action_label: "Open Data Room", action_url: "/portal" }
          ),
          notifyAdmins(base44, "Documents", "Passport Uploaded",
            `Client ${data.email || user_id} has uploaded an identification document.`,
            { action_label: "View in Admin Portal", action_url: "/admin-portal" }
          ),
          writeAuditLog(base44, {
            user_id, action: "PASSPORT_UPLOADED",
            object_type: "InvestorProfile", object_id: profile_id,
            metadata: {
              id_consent: data.id_consent || false,
              id_consent_at: data.id_consent_at || null,
            },
          }),
        ]);
        break;
      }

      // ── PASSPORT APPROVED ────────────────────────────────────────────────────
      case "PASSPORT_APPROVED": {
        const { user_id, profile_id } = data;
        await Promise.all([
          sendNotification(base44, user_id, "Documents",
            "Identity Verified",
            "Your identification document has been reviewed and approved.",
            { action_label: "Open Portal", action_url: "/portal" }
          ),
          writeAuditLog(base44, {
            user_id, action: "PASSPORT_APPROVED",
            object_type: "InvestorProfile", object_id: profile_id,
          }),
        ]);
        break;
      }

      // ── METACOPIER CONNECTED ─────────────────────────────────────────────────
      case "METACOPIER_CONNECTED": {
        const { user_id, engine, metacopier_id } = data;
        const engineLabel = engine === "commodities" ? "Commodities Engine" : engine === "digital" ? "Digital Assets Engine" : engine;
        await Promise.all([
          sendNotification(base44, user_id, "Research Engines",
            "MetaCopier Account Connected",
            `Your trading account has been successfully connected to the ${engineLabel}.`,
            { action_label: "View Performance", action_url: "/portal" }
          ),
          notifyAdmins(base44, "Research Engines", "MetaCopier Connected",
            `Client ${data.email || user_id} connected MetaCopier ID ${metacopier_id} to the ${engineLabel}.`,
          ),
          writeAuditLog(base44, {
            user_id, action: "METACOPIER_CONNECTED",
            object_type: "Engine", object_id: engine,
            object_label: `${engineLabel} — ID: ${metacopier_id}`,
          }),
        ]);
        break;
      }

      // ── ENGINE ACTIVATED (onboarding complete) ───────────────────────────────
      case "ENGINE_ACTIVATED": {
        const { user_id, engine, profile_id } = data;
        const engineLabel = engine === "commodities" ? "Commodities Engine" : engine === "digital" ? "Digital Assets Engine" : engine;
        await Promise.all([
          sendNotification(base44, user_id, "Research Engines",
            "Engine Activated",
            `Your ${engineLabel} setup is complete. Performance data will appear in your portal once synchronised.`,
            { action_label: "View Performance", action_url: "/portal" }
          ),
          notifyAdmins(base44, "Research Engines", "Engine Setup Completed",
            `Client ${data.email || user_id} completed all onboarding steps for the ${engineLabel}.`,
          ),
          writeAuditLog(base44, {
            user_id, action: "ENGINE_ACTIVATED",
            object_type: "Engine", object_id: engine,
            object_label: engineLabel,
          }),
          // Update CRM
          (async () => {
            const crm = await base44.asServiceRole.entities.CRMRecord.filter({ user_id });
            if (crm.length > 0) {
              await base44.asServiceRole.entities.CRMRecord.update(crm[0].id, {
                client_status: "active", engine,
              });
            }
          })(),
        ]);
        break;
      }

      // ── NEW PORTAL REGISTRATION ───────────────────────────────────────────────
      case "NEW_REGISTRATION": {
        const { user_id, profile_id, email, full_name, referred_by } = data;
        if (email) {
          const firstName = (full_name || 'Investor').split(' ')[0].toLowerCase();
          await sendEmail(
            email,
            "Your North Scale access request has been received",
            `Dear ${full_name || 'Investor'},\n\nThank you for submitting your access request to North Scale Capital. Our team will review your application within 3-6 hours and notify you once a decision has been made.\n\nKind regards,\nNorth Scale Capital`,
            renderBrandedEmail({
              preheader: 'your north scale access request has been received and is under review.',
              eyebrow: 'ACCESS REQUEST',
              heading: `thank you, ${firstName}.`,
              intro: 'your access request has been received. our team will review your application within 3-6 hours and notify you by email once a decision has been made.',
              note: 'if you did not submit this request, please disregard this email.',
            })
          );
        }
        await Promise.all([
          notifyAdmins(base44, "Account", "New Portal Registration",
            `${full_name || email} has submitted a portal access request.`,
            { is_action_required: true, action_label: "Review Application", action_url: "/admin-portal" }
          ),
          writeAuditLog(base44, {
            user_id, action: "NEW_REGISTRATION",
            object_type: "InvestorProfile", object_id: profile_id,
            object_label: email,
          }),
          // Create CRM lead
          (async () => {
            const existing = await base44.asServiceRole.entities.CRMRecord.filter({ user_id });
            if (existing.length === 0) {
              await base44.asServiceRole.entities.CRMRecord.create({
                user_id, email: email || "",
                full_name: full_name || "",
                referred_by: referred_by || "",
                lead_source: "portal_registration",
                client_status: "pending",
                profile_id,
                registration_date: new Date().toISOString().split("T")[0],
              });
            }
          })(),
          // Mirror to OneDrive
          base44.functions.invoke("syncInvestorToOneDrive", { profile_id }).catch(e => console.warn("OneDrive sync failed:", e.message)),
        ]);
        break;
      }

      // ── INQUIRY SUBMITTED ─────────────────────────────────────────────────────
      case "INQUIRY_SUBMITTED": {
        const { inquiry_id, email, full_name, inquiry_type } = data;
        await Promise.all([
          notifyAdmins(base44, "Account", "New Website Inquiry",
            `${full_name || email} submitted a ${inquiry_type?.replace(/_/g, " ") || "general"} inquiry.`,
            { action_label: "Review Inquiries", action_url: "/admin-portal" }
          ),
          writeAuditLog(base44, {
            action: "INQUIRY_SUBMITTED",
            object_type: "Inquiry", object_id: inquiry_id,
            object_label: `${full_name} — ${inquiry_type}`,
          }),
          // Create CRM lead
          base44.asServiceRole.entities.CRMRecord.create({
            email: email || "",
            full_name: full_name || "",
            lead_source: "website_inquiry",
            client_status: "lead",
            inquiry_id,
            registration_date: new Date().toISOString().split("T")[0],
          }),
        ]);
        break;
      }

      // ── PERFORMANCE SYNCED ────────────────────────────────────────────────────
      case "PERFORMANCE_SYNCED": {
        const { user_id, engine, snapshot_id } = data;
        const engineLabel = engine === "commodities" ? "Commodities Engine" : "Digital Assets Engine";
        await Promise.all([
          sendNotification(base44, user_id, "Performance",
            "Performance Synchronized",
            `Your ${engineLabel} performance data has been updated.`,
            { action_label: "View Performance", action_url: "/portal" }
          ),
          writeAuditLog(base44, {
            user_id, action: "PERFORMANCE_SYNCED",
            object_type: "PerformanceSnapshot", object_id: snapshot_id || engine,
            object_label: engineLabel,
          }),
        ]);
        break;
      }

      default:
        return Response.json({ error: `Unknown event: ${event}` }, { status: 400 });
    }

    return Response.json({ success: true, event });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});