import React, { useState } from "react";
import { Link } from "react-router-dom";
import { invokeFunction } from "@/lib/invokeFunction";
import { PRIVACY_CONTACT, PRIVACY_REQUEST_TYPES } from "@/lib/privacy";

export default function PrivacyDataRights({ user, profile }) {
  const [activeType, setActiveType] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (type) => {
    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const res = await invokeFunction("submitPrivacyRequest", {
        request_type: type,
        message: message.trim() || undefined,
      });
      setResult({ type, ticketId: res.ticket_id });
      setMessage("");
      setActiveType(null);
    } catch (err) {
      setError(err?.message || "Could not submit request. Please email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-8">
      <div className="border border-border bg-secondary/20 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-2">your data rights</p>
        <p className="font-mono text-[10px] leading-6 text-muted-foreground">
          Under applicable data-protection law (including GDPR), you may request access to, correction of, or deletion of your personal data.
          We respond within one calendar month. Some data may be retained where required by law (e.g. AML record-keeping).
        </p>
        <p className="font-mono text-[10px] mt-3">
          <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            privacy policy →
          </Link>
          {" · "}
          <Link to="/cookie-policy" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            cookie policy →
          </Link>
        </p>
      </div>

      {result && (
        <div className="border border-green-400/30 bg-green-400/5 p-5">
          <p className="font-mono text-xs text-green-400 mb-1">✓ request submitted</p>
          <p className="font-mono text-[10px] text-muted-foreground leading-6">
            Your {PRIVACY_REQUEST_TYPES[result.type]?.label.toLowerCase()} has been logged as ticket {result.ticketId}.
            Our team will respond within one calendar month.
          </p>
        </div>
      )}

      {error && (
        <p className="font-mono text-[10px] text-red-400">{error}</p>
      )}

      <div className="space-y-3">
        {Object.entries(PRIVACY_REQUEST_TYPES).map(([key, cfg]) => (
          <div key={key} className="border border-border p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-foreground lowercase mb-1">{cfg.label}</p>
                <p className="font-mono text-[10px] text-muted-foreground/70 leading-6">{cfg.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveType(activeType === key ? null : key)}
                className="font-mono text-[10px] lowercase tracking-[0.18em] border border-border px-4 py-2 flex-shrink-0 hover:bg-border transition-colors"
              >
                {activeType === key ? "cancel" : "request"}
              </button>
            </div>

            {activeType === key && (
              <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Optional: provide additional details for your request..."
                  rows={3}
                  className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors resize-none"
                />
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit(key)}
                  className="border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.22em] px-6 py-3 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {submitting ? "submitting..." : "submit request"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border border-border/50 p-5 space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">withdraw consent</p>
        <p className="font-mono text-[10px] leading-6 text-muted-foreground/70">
          Where processing is based on consent (e.g. marketing emails), you may withdraw at any time via notification preferences or by contacting us.
          Withdrawal does not affect processing already carried out. Some processing is required by law and cannot be withdrawn while your account is active.
        </p>
        <Link
          to="/portal?m=settings&s=notifications"
          className="inline-block font-mono text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          manage notification preferences →
        </Link>
      </div>

      <div className="border border-border/50 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-2">direct contact</p>
        <p className="font-mono text-[10px] text-muted-foreground/70 leading-6 mb-2">
          For urgent privacy matters or to lodge a complaint, contact our data protection team directly:
        </p>
        <a href={`mailto:${PRIVACY_CONTACT}?subject=Privacy%20Enquiry`} className="font-mono text-xs text-foreground hover:text-muted-foreground transition-colors lowercase">
          {PRIVACY_CONTACT}
        </a>
        {profile?.id && (
          <p className="font-mono text-[9px] text-muted-foreground/40 mt-3">
            Reference: client profile {profile.id.slice(0, 8)}… · {user?.email}
          </p>
        )}
      </div>
    </div>
  );
}
