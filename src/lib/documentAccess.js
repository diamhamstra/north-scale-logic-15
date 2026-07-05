import { invokeFunction } from "@/lib/invokeFunction";

/**
 * Log document view/download via server-side audit trail, then open the URL.
 * Failures to log do not block access — the user can still open the document.
 */
export async function openDocumentWithAudit({
  url,
  action = "view",
  documentType,
  documentKey,
  profileId,
  targetUserId,
}) {
  if (!url) return;

  invokeFunction("logDocumentAccess", {
    action,
    document_type: documentType,
    document_key: documentKey,
    profile_id: profileId,
    target_user_id: targetUserId,
  }).catch(() => {});

  window.open(url, "_blank", "noopener,noreferrer");
}

export async function downloadWithAudit({
  url,
  filename,
  documentType,
  documentKey,
  profileId,
}) {
  invokeFunction("logDocumentAccess", {
    action: "download",
    document_type: documentType,
    document_key: documentKey,
    profile_id: profileId,
  }).catch(() => {});

  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "";
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.click();
}
