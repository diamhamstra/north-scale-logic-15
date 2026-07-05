/**
 * uploadToOneDrive — North Scale Platform
 *
 * Uploads a signed agreement file to:
 *   Investors/{investorEmail}/agreements/{fileName}
 *
 * Falls back to root Investors folder if no email provided.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const INVESTORS_FOLDER_ID = '0155HEFGFZUDKZ5XMETJAYMMLSX3KOP5NA';

function extractSessionToken(body) {
  const token = body?.session_token ?? body?.token;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

async function resolveUser(base44, sessionToken) {
  if (sessionToken) {
    const sessions = await base44.asServiceRole.entities.UserSession.filter({ token: sessionToken, is_active: true });
    if (sessions.length > 0) {
      const session = sessions[0];
      if (new Date(session.expires_at) >= new Date()) {
        const users = await base44.asServiceRole.entities.User.filter({ id: session.user_id });
        if (users.length > 0) return users[0];
      }
    }
  }
  try {
    const user = await base44.auth.me();
    if (user?.id) return user;
  } catch (_) {}
  return null;
}

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const sessionToken = extractSessionToken(body);
    const user = await resolveUser(base44, sessionToken);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { fileName, fileBase64, investorEmail } = body;
    if (!fileName || !fileBase64) {
      return Response.json({ error: 'fileName and fileBase64 are required' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('one_drive');

    // Path: Investors/{email}/agreements/
    const safeEmail = (investorEmail || user.email || 'unknown').replace(/[^a-zA-Z0-9._@-]/g, '_');
    const investorFolderId = await ensureSubfolder(accessToken, INVESTORS_FOLDER_ID, safeEmail);
    const agreementsFolderId = await ensureSubfolder(accessToken, investorFolderId, 'agreements');

    const binaryStr = atob(fileBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    const uploadRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${agreementsFolderId}:/${fileName}:/content`,
      {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/pdf' },
        body: bytes,
      }
    );

    if (!uploadRes.ok) {
      return Response.json({ error: `OneDrive upload failed: ${await uploadRes.text()}` }, { status: 500 });
    }

    const uploaded = await uploadRes.json();
    return Response.json({
      success: true,
      onedrive_id: uploaded.id,
      onedrive_url: uploaded.webUrl,
      name: uploaded.name,
      path: `Investors/${safeEmail}/agreements/${fileName}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});