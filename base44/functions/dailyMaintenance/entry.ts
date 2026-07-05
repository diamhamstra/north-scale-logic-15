/**
 * Daily Maintenance Job — North Scale Platform
 * Runs daily at 03:00 UTC (10:00 Bangkok).
 * Tasks:
 *   1. Clean up expired notifications
 *   2. Verify agreement version compliance for all active clients
 *   3. Sync CRM statuses from InvestorProfile
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const results = { expired_notifications: 0, agreement_flags: 0, crm_synced: 0 };

    // 1. Delete expired notifications
    const now = new Date().toISOString();
    const allNotifs = await base44.asServiceRole.entities.Notification.list("-created_date", 1000);
    const expired = allNotifs.filter(n => n.expires_at && n.expires_at < now);
    await Promise.all(expired.map(n => base44.asServiceRole.entities.Notification.delete(n.id)));
    results.expired_notifications = expired.length;

    // 2. Check agreement versions — flag anyone who signed old versions
    const CURRENT_VERSIONS = { liability_waiver: "1.0", terms_of_use: "1.0", privacy_policy: "1.0", risk_disclosure: "1.0" };
    const profiles = await base44.asServiceRole.entities.InvestorProfile.filter({ access_status: "approved" });

    for (const profile of profiles) {
      if (!profile.agreements_signed) continue;
      const signed = profile.agreements_signed;
      let needsResign = false;
      for (const [key, currentVersion] of Object.entries(CURRENT_VERSIONS)) {
        const record = signed[key];
        if (!record) { needsResign = true; break; }
        const parsed = typeof record === "string" ? JSON.parse(record) : record;
        if (parsed.version !== currentVersion) { needsResign = true; break; }
      }
      if (needsResign && profile.onboarding_stage === "complete") {
        // Flag for re-signing — update stage back to agreements
        await base44.asServiceRole.entities.InvestorProfile.update(profile.id, { onboarding_stage: "agreements" });
        // Send notification
        await base44.asServiceRole.entities.Notification.create({
          user_id: profile.user_id,
          category: "Documents",
          title: "New Agreement Requires Your Signature",
          message: "A new version of one or more legal agreements requires your signature before you can continue using the portal.",
          is_read: false,
          is_action_required: true,
          action_label: "Sign Now",
          action_url: "/complete-profile",
        });
        results.agreement_flags++;
      }
    }

    // 3. Sync CRM statuses from InvestorProfile
    for (const profile of profiles) {
      const crm = await base44.asServiceRole.entities.CRMRecord.filter({ user_id: profile.user_id });
      const engineComplete = profile.onboarding_step >= 6 && profile.selected_engine;
      const status = engineComplete ? "active" : profile.onboarding_stage === "complete" ? "approved" : "pending";
      if (crm.length > 0 && crm[0].client_status !== status) {
        await base44.asServiceRole.entities.CRMRecord.update(crm[0].id, { client_status: status, engine: profile.selected_engine || crm[0].engine });
        results.crm_synced++;
      }
    }

    // Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      user_id: "system",
      actor_id: "system",
      action: "DAILY_MAINTENANCE_RUN",
      object_label: `expired=${results.expired_notifications} flags=${results.agreement_flags} crm=${results.crm_synced}`,
      metadata_json: JSON.stringify(results),
      ip_address: "system",
    });

    return Response.json({ success: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});