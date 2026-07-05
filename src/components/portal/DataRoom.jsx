import React from "react";
import { Link } from "react-router-dom";
import { AGREEMENTS } from "@/lib/agreements";
import {
  DATA_ROOM_NOTICE,
  DOCUMENT_PURPOSES,
  LAWFUL_BASIS,
  RETENTION_PERIODS,
  PROCESSORS_NOTE,
} from "@/lib/privacy";
import { openDocumentWithAudit, downloadWithAudit } from "@/lib/documentAccess";
import { invokeFunction } from "@/lib/invokeFunction";

function downloadSignedReceipt(doc, profileId) {
  const content = [
    `north scale — SIGNED AGREEMENT RECEIPT`,
    ``,
    `Document:   ${doc.title}`,
    `Version:    ${doc.record.version}`,
    `Signed:     ${new Date(doc.record.signed_at).toLocaleString()}`,
    ``,
    `This document was electronically signed via the north scale Investor Portal.`,
    `This is a read-only record.`,
  ].join("\n");

  invokeFunction("logDocumentAccess", {
    action: "download",
    document_type: "receipt",
    document_key: doc.key,
    profile_id: profileId,
  }).catch(() => {});

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `northscale_${doc.key}_signed_v${doc.record.version}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function DocMeta({ purpose, basis, retention }) {
  return (
    <div className="mt-2 space-y-1">
      <p className="font-mono text-[9px] leading-5 text-muted-foreground/70">{purpose}</p>
      <p className="font-mono text-[9px] text-muted-foreground/50">
        Lawful basis: {basis} · Retention: {retention}
      </p>
    </div>
  );
}

export default function DataRoom({ profile }) {
  const signed = profile?.agreements_signed || {};

  const signedDocs = AGREEMENTS.map(a => {
    const record = signed[a.key];
    if (!record) return null;
    const parsed = typeof record === "string" ? JSON.parse(record) : record;
    if (!parsed.signed_at) return null;
    return { ...a, record: parsed };
  }).filter(Boolean);

  const passportDoc = profile?.passport_url ? {
    url: profile.passport_url,
    status: profile.passport_status || "approved",
    uploaded_at: profile.updated_date,
  } : null;

  const passportStatus = {
    not_uploaded: { text: "Not Uploaded", color: "text-muted-foreground" },
    pending_review: { text: "Pending Review", color: "text-yellow-400" },
    approved: { text: "Approved", color: "text-green-400" },
    rejected: { text: "Rejected", color: "text-red-400" },
  };

  return (
    <div>
      {/* Privacy notice */}
      <div className="border border-border bg-secondary/20 p-5 mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-2">privacy notice</p>
        <p className="font-mono text-[10px] leading-6 text-muted-foreground">{DATA_ROOM_NOTICE}</p>
        <p className="font-mono text-[10px] leading-6 text-muted-foreground/60 mt-2">{PROCESSORS_NOTE}</p>
        <p className="font-mono text-[10px] mt-3">
          <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            read full privacy policy →
          </Link>
          {" · "}
          <Link to="/portal?m=settings&s=privacy" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            exercise your data rights →
          </Link>
        </p>
      </div>

      <div className="space-y-3">
        {signedDocs.length > 0 && signedDocs.map(doc => {
          const hasFile = doc.key === "liability_waiver" && profile?.waiver_url;
          return (
            <div key={doc.key} className="border border-border p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-xs text-foreground">{doc.title.toLowerCase()}</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1">
                  version {doc.record.version} · signed {new Date(doc.record.signed_at).toLocaleDateString()}
                  {doc.record.full_legal_name && ` · ${doc.record.full_legal_name}`}
                </p>
                {doc.record.effective_date && (
                  <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">
                    Effective date: {doc.record.effective_date}
                  </p>
                )}
                <DocMeta
                  purpose={doc.key === "liability_waiver" ? DOCUMENT_PURPOSES.waiver : DOCUMENT_PURPOSES.agreements}
                  basis={doc.key === "liability_waiver" ? LAWFUL_BASIS.waiver : LAWFUL_BASIS.agreements}
                  retention={doc.key === "liability_waiver" ? RETENTION_PERIODS.waiver : RETENTION_PERIODS.agreements}
                />
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 pt-1">
                {hasFile ? (
                  <button
                    type="button"
                    onClick={() => downloadWithAudit({
                      url: profile.waiver_url,
                      filename: "liability_waiver.pdf",
                      documentType: "waiver",
                      documentKey: doc.key,
                      profileId: profile.id,
                    })}
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ↓ Download
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => downloadSignedReceipt(doc, profile.id)}
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ↓ Download
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {passportDoc && (
          <div className="border border-border p-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-xs text-foreground">passport / government id</p>
              <p className="font-mono text-[10px] text-muted-foreground mt-1">
                uploaded {new Date(passportDoc.uploaded_at).toLocaleDateString()}
              </p>
              <DocMeta
                purpose={DOCUMENT_PURPOSES.passport}
                basis={LAWFUL_BASIS.passport}
                retention={RETENTION_PERIODS.passport}
              />
              <p className="font-mono text-[9px] text-muted-foreground/50 mt-2">
                View-only access · downloads restricted · all access logged
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 pt-1">
              <span className={`font-mono text-[9px] uppercase tracking-[0.16em] ${passportStatus[passportDoc.status]?.color || "text-muted-foreground"}`}>
                {passportStatus[passportDoc.status]?.text || passportDoc.status}
              </span>
              <button
                type="button"
                onClick={() => openDocumentWithAudit({
                  url: passportDoc.url,
                  action: "view",
                  documentType: "passport",
                  documentKey: "passport_id",
                  profileId: profile.id,
                })}
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
              >
                View →
              </button>
            </div>
          </div>
        )}

        {signedDocs.length === 0 && !passportDoc && (
          <div className="border border-border p-8">
            <p className="font-mono text-xs text-muted-foreground">No documents available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
