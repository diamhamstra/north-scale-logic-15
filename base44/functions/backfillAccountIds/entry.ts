import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function generateAccountId(profileId) {
  if (!profileId) return null;
  const hex = String(profileId).replace(/-/g, '').slice(-6).toUpperCase();
  return `NS-${String(parseInt(hex, 16) % 1000000).padStart(6, '0')}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized — admin access required' }, { status: 403 });
    }

    let updated = 0;
    let skipped = 0;
    let cursor = null;

    while (true) {
      const profiles = await base44.asServiceRole.entities.InvestorProfile.list('-created_date', 200);
      for (const profile of profiles) {
        if (profile.account_id) {
          skipped++;
          continue;
        }
        const accountId = generateAccountId(profile.id);
        if (accountId) {
          await base44.asServiceRole.entities.InvestorProfile.update(profile.id, { account_id: accountId });
          updated++;
        }
      }
      if (profiles.length < 200) break;
    }

    return Response.json({
      success: true,
      message: `Backfill complete — ${updated} profiles updated, ${skipped} already had account_id`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});