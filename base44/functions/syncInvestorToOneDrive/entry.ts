/**
 * syncInvestorToOneDrive — North Scale Platform
 *
 * Flow:
 *   North Scale/North Scale Client Info & Docs/
 *     └── Investors/
 *           └── {investor_email}/
 *                 ├── profile.json
 *                 ├── agreements/        ← signed docs (ToS, Privacy, Waiver, etc.)
 *                 └── documents/         ← passport / ID
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const INVESTORS_FOLDER_ID = '0155HEFGFZUDKZ5XMETJAYMMLSX3KOP5NA';

async function ensureSubfolder(accessToken, parentId, folderName) {
  const createRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${parentId}/children`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: folderName, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' }),
  });
  if (createRes.ok) return (await createRes.json()).id;
  if (createRes.status === 409) {
    const listRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${parentId}/children?$filter=name eq '${encodeURIComponent(folderName)}'`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const list = await listRes.json();
    if (list.value?.length > 0) return list.value[0].id;
  }
  throw new Error(`Failed to ensure subfolder "${folderName}": ${createRes.status}`);
}

async function uploadJson(accessToken, folderId, fileName, data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data, null, 2));
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${fileName}:/content`,
    { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: bytes }
  );
  if (!res.ok) throw new Error(`JSON upload failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function mirrorFile(accessToken, sourceUrl, folderId, fileName) {
  const fileRes = await fetch(sourceUrl);
  if (!fileRes.ok) throw new Error(`Fetch source failed: ${fileRes.status}`);
  const buffer = await fileRes.arrayBuffer();
  const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${fileName}:/content`,
    { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': contentType }, body: buffer }
  );
  if (!res.ok) throw new Error(`File upload failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { profile_id } = await req.json();
    if (!profile_id) return Response.json({ error: 'profile_id is required' }, { status: 400 });

    const profile = await base44.asServiceRole.entities.InvestorProfile.get(profile_id);
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    let userInfo = {};
    if (profile.user_id) {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: profile.user_id });
        if (users.length > 0) userInfo = users[0];
      } catch (_) {}
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('one_drive');

    // Create investor folder structure
    const safeEmail = (profile.email || profile.user_id || 'unknown').replace(/[^a-zA-Z0-9._@-]/g, '_');
    const investorFolderId = await ensureSubfolder(accessToken, INVESTORS_FOLDER_ID, safeEmail);
    const agreementsFolderId = await ensureSubfolder(accessToken, investorFolderId, 'agreements');
    const documentsFolderId = await ensureSubfolder(accessToken, investorFolderId, 'documents');

    // Build and upload profile snapshot
    const snapshot = {
      generated_at: new Date().toISOString(),
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        organization: profile.organization,
        referred_by: profile.referred_by,
        phone: profile.phone,
        nationality: profile.nationality,
        income_tax_country: profile.income_tax_country,
        net_worth: profile.net_worth,
        monthly_investment: profile.monthly_investment,
        investment_experience: profile.investment_experience,
        access_status: profile.access_status,
        profile_complete: profile.profile_complete,
        onboarding_stage: profile.onboarding_stage,
        selected_engine: profile.selected_engine,
        passport_status: profile.passport_status,
        two_fa_enabled: profile.two_fa_enabled,
        created_date: profile.created_date,
        updated_date: profile.updated_date,
      },
      user: {
        id: userInfo.id,
        email: userInfo.email,
        full_name: userInfo.full_name,
        role: userInfo.role,
        created_date: userInfo.created_date,
      },
    };
    await uploadJson(accessToken, investorFolderId, 'profile.json', snapshot);

    // Mirror only signed agreement PDFs (those with a document_url) into agreements/
    const agreementUploads = [];
    const agreementsMeta = {};
    if (profile.agreements_signed) {
      for (const [key, val] of Object.entries(profile.agreements_signed)) {
        let record;
        try { record = typeof val === 'string' ? JSON.parse(val) : val; }
        catch (_) { record = val; }

        // Only include agreements that have a signed PDF attached
        const docUrl = record?.document_url;
        if (!docUrl || !docUrl.startsWith('http')) continue;

        agreementsMeta[key] = record;
        try {
          await mirrorFile(accessToken, docUrl, agreementsFolderId, `NorthScale_${key}_signed.pdf`);
          agreementUploads.push(`NorthScale_${key}_signed.pdf`);
        } catch (e) { console.warn(`Agreement "${key}" mirror failed:`, e.message); }
      }
      if (Object.keys(agreementsMeta).length > 0) {
        await uploadJson(accessToken, agreementsFolderId, 'signed_agreements.json', agreementsMeta);
        agreementUploads.push('signed_agreements.json');
      }
    }

    // Mirror passport into documents/
    if (profile.passport_url && profile.passport_url.startsWith('http')) {
      try {
        await mirrorFile(accessToken, profile.passport_url, documentsFolderId, 'passport_id.pdf');
      } catch (e) { console.warn('Passport mirror failed:', e.message); }
    }

    return Response.json({
      success: true,
      investor_folder: safeEmail,
      agreements_uploaded: agreementUploads,
      path: `North Scale/North Scale Client Info & Docs/Investors/${safeEmail}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});