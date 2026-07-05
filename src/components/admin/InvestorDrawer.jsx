import React, { useEffect, useRef, useState } from "react";
import { engines } from "@/lib/engineConfig";
import { AGREEMENTS } from "@/lib/agreements";
import { base44 } from "@/api/base44Client";
import { invokeFunction } from "@/lib/invokeFunction";

const netWorthLabel = (v) => ({
  "under_100k": "Under $100,000",
  "100k_500k": "$100,000 – $500,000",
  "500k_1m": "$500,000 – $1,000,000",
  "1m_5m": "$1,000,000 – $5,000,000",
  "5m_plus": "$5,000,000+",
}[v] || "—");

const monthlyInvestmentLabel = (v) => ({
  "under_1k": "Under $1,000",
  "1k_5k": "$1,000 – $5,000",
  "5k_10k": "$5,000 – $10,000",
  "10k_50k": "$10,000 – $50,000",
  "50k_plus": "$50,000+",
}[v] || "—");

const statusColor = (s) => ({ pending: "text-yellow-400", approved: "text-green-400", rejected: "text-red-400" }[s] || "text-muted-foreground");
const statusLabel = (s) => ({ pending: "Pending", approved: "Approved", rejected: "Rejected" }[s] || "—");

function Field({ label, value, className = "" }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">{label}</p>
      <p className={`font-mono text-xs text-foreground leading-5 ${className}`}>{value || "—"}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border-t border-border pt-6 mt-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-5">{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default function InvestorDrawer({ profile, onClose, onStatusChange, onDeleted }) {
  const [notes, setNotes] = useState(profile.access_notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const drawerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const saveNotes = async () => {
    setSavingNotes(true);
    await invokeFunction('adminUpdateProfile', { profile_id: profile.id, updates: { access_notes: notes } });
    setSavingNotes(false);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleDeleteUser = async () => {
    if (!confirm(`Are you sure you want to delete ${profile.full_name || profile.email}? This will remove all their data and they can register again with the same email.`)) {
      return;
    }
    setDeleting(true);
    try {
      const result = await invokeFunction('deleteUser', { profile_id: profile.id });
      if (result.data?.success) {
        onClose();
        if (onDeleted) onDeleted(profile.id);
      } else {
        alert('Failed to delete user: ' + (result.data?.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const engine = profile.selected_engine ? engines[profile.selected_engine] : null;
  const totalSteps = engine?.totalSteps || 5;
  const steps = engine?.steps || [];

  const stepStatus = (stepIndex) => {
    const stepNum = stepIndex + 1;
    if (!profile.selected_engine) return "inactive";
    if (profile[`step_${stepNum}_complete`]) return "complete";
    if (profile.onboarding_step === stepNum) return "active";
    return "pending";
  };

  const createdDate = profile.created_date
    ? new Date(profile.created_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={drawerRef}
        className="relative w-full max-w-xl bg-background border-l border-border flex flex-col h-full overflow-y-auto"
      >
        {/* Drawer Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-8 py-6 flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-1">Investor Profile</p>
            <h2 className="font-heading text-2xl text-foreground">{profile.full_name || "Unknown"}</h2>
            <p className="font-mono text-xs text-muted-foreground mt-1">{profile.email}</p>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <button
              onClick={handleDeleteUser}
              disabled={deleting}
              className="font-mono text-[10px] uppercase tracking-[0.28em] text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete User"}
            </button>
            <button onClick={onClose} className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors">
              ✕ Close
            </button>
          </div>
        </div>

        <div className="px-8 py-8 flex-1">
          {/* Status + Actions */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`font-mono text-xs uppercase tracking-[0.2em] ${statusColor(profile.access_status)}`}>
              ● {statusLabel(profile.access_status)}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/50">Applied {createdDate}</span>
          </div>

          <div className="flex gap-3 mt-4">
            {profile.access_status !== "approved" && (
              <button
                onClick={() => onStatusChange(profile.id, "approved")}
                className="border border-green-400/30 px-4 py-2 text-green-400 hover:bg-green-400/10 transition-colors font-mono text-[10px] uppercase tracking-[0.2em]"
              >
                Approve
              </button>
            )}
            {profile.access_status !== "rejected" && (
              <button
                onClick={() => onStatusChange(profile.id, "rejected")}
                className="border border-red-400/30 px-4 py-2 text-red-400 hover:bg-red-400/10 transition-colors font-mono text-[10px] uppercase tracking-[0.2em]"
              >
                Reject
              </button>
            )}
            {profile.access_status !== "pending" && (
              <button
                onClick={() => onStatusChange(profile.id, "pending")}
                className="border border-yellow-400/30 px-4 py-2 text-yellow-400 hover:bg-yellow-400/10 transition-colors font-mono text-[10px] uppercase tracking-[0.2em]"
              >
                Reset to Pending
              </button>
            )}
          </div>

          {/* Basic Info */}
          <Section title="Application Details">
            <div className="grid grid-cols-2 gap-4">
              <Field label="North Scale Account ID" value={profile.account_id || "—"} />
              <Field label="Full Name" value={profile.full_name} />
              <Field label="Organization" value={profile.organization} />
              <Field label="Email" value={profile.email} />
              <Field label="Referred By" value={profile.referred_by} />
              <Field label="Monthly Investment" value={monthlyInvestmentLabel(profile.monthly_investment)} />
              <Field label="Applied" value={createdDate} />
            </div>
          </Section>

          {/* Compliance Profile */}
          <Section title="Compliance & Profile">
            <div className="flex items-center gap-4 flex-wrap mb-3">
              <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${profile.profile_complete ? "text-green-400" : "text-yellow-400"}`}>
                ● Portal {profile.profile_complete ? "Active" : "Incomplete"}
              </span>
              <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
                profile.onboarding_stage === "complete" ? "text-green-400" :
                profile.onboarding_stage === "passport" ? "text-blue-400" :
                profile.onboarding_stage === "agreements" ? "text-yellow-400" : "text-muted-foreground"
              }`}>
                Stage: {profile.onboarding_stage || "profile"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" value={profile.phone} />
              <Field label="Nationality" value={profile.nationality} />
              <Field label="Tax Residence" value={profile.income_tax_country} />
              <Field label="Net Worth" value={netWorthLabel(profile.net_worth)} />
              <Field label="Investment Experience" value={profile.investment_experience?.replace(/_/g, " ") || "—"} />
            </div>

            {/* Passport status */}
            <div className="mt-4 border border-border p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Passport / Government ID</p>
              <div className="flex items-center justify-between">
                <span className={`font-mono text-xs ${
                  profile.passport_status === "approved" ? "text-green-400" :
                  profile.passport_status === "pending_review" ? "text-yellow-400" : "text-muted-foreground"
                }`}>
                  ● {profile.passport_status === "approved" ? "Approved" : profile.passport_status === "pending_review" ? "Pending Review" : "Not Uploaded"}
                </span>
                {profile.passport_url && (
                  <a href={profile.passport_url} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">View →</a>
                )}
              </div>
            </div>

            {/* Agreements status */}
            <div className="mt-4 border border-border p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground mb-3">Legal Agreements</p>
              <div className="space-y-3">
                {AGREEMENTS.map(a => {
                  const rec = profile.agreements_signed?.[a.key];
                  const parsed = rec ? (typeof rec === "string" ? JSON.parse(rec) : rec) : null;
                  const isWaiver = a.key === "liability_waiver";
                  return (
                    <div key={a.key}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted-foreground">{a.title}</span>
                        {parsed?.signed_at ? (
                          <span className="font-mono text-[9px] text-green-400">✓ Signed v{parsed.version}</span>
                        ) : (
                          <span className="font-mono text-[9px] text-muted-foreground/40">Not signed</span>
                        )}
                      </div>
                      {parsed?.signed_at && isWaiver && (
                        <div className="mt-1 pl-0 space-y-0.5">
                          {parsed.full_legal_name && (
                            <p className="font-mono text-[9px] text-muted-foreground/60">Name: {parsed.full_legal_name}</p>
                          )}
                          {parsed.effective_date && (
                            <p className="font-mono text-[9px] text-muted-foreground/60">Effective: {parsed.effective_date}</p>
                          )}
                          {profile.waiver_url && (
                            <a
                              href={profile.waiver_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-[9px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                            >
                              ↓ Download Signed Waiver
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* Onboarding Progress */}
          <Section title="Onboarding Progress">
            {!engine ? (
              <p className="font-mono text-xs text-muted-foreground">No engine selected yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Field label="Selected Engine" value={engine.label} />
                  <Field label="Algorithm" value={engine.algorithm} />
                  <Field
                    label="Overall Status"
                    value={
                      profile.onboarding_step > totalSteps ? "Complete" :
                      profile.onboarding_step > 0 ? `Step ${profile.onboarding_step} of ${totalSteps}` : "Not started"
                    }
                    className={profile.onboarding_step > totalSteps ? "text-green-400" : "text-foreground"}
                  />
                </div>

                {/* Step progress */}
                <div className="space-y-2">
                  {Array.from({ length: totalSteps }).map((_, i) => {
                    const status = stepStatus(i);
                    const stepData = steps[i];
                    return (
                      <div key={i} className={`flex items-center gap-4 px-4 py-3 border ${
                        status === "complete" ? "border-green-400/20 bg-green-400/5" :
                        status === "active" ? "border-foreground/20 bg-secondary/30" :
                        "border-border"
                      }`}>
                        <span className={`font-mono text-[10px] w-4 text-center ${
                          status === "complete" ? "text-green-400" :
                          status === "active" ? "text-foreground" : "text-muted-foreground/40"
                        }`}>
                          {status === "complete" ? "✓" : i + 1}
                        </span>
                        <div className="flex-1">
                          <p className={`font-mono text-xs ${status === "complete" ? "text-foreground" : status === "active" ? "text-foreground" : "text-muted-foreground"}`}>
                            {stepData?.title || `Step ${i + 1}`}
                          </p>
                        </div>
                        <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
                          status === "complete" ? "text-green-400" :
                          status === "active" ? "text-yellow-400" : "text-muted-foreground/40"
                        }`}>
                          {status === "complete" ? "Done" : status === "active" ? "In Progress" : "Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Section>

          {/* Admin Notes */}
          <Section title="Admin Notes">
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
              rows={4}
              placeholder="Add internal notes about this investor..."
              className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors resize-none"
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="border border-border font-mono text-[10px] uppercase tracking-[0.24em] px-5 py-2.5 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-50"
            >
              {savingNotes ? "Saving..." : notesSaved ? "✓ Saved" : "Save Notes"}
            </button>
          </Section>
        </div>
      </div>
    </div>
  );
}