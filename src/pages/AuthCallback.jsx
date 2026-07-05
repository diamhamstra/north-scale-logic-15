import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { performMagicLinkLogin, getLoginRedirect } from "@/lib/customAuth";
import { profileIndicatesApprovedAccess, accessDecisionIndicatesApproved } from "@/lib/investorProfile";
import { getStoredLoginAccess } from "@/lib/authSync";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Signing in | North Scale";
    const token = searchParams.get("token");
    if (!token) {
      setError("This login link is missing its token.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await performMagicLinkLogin(token);
        if (cancelled) return;

        const normalizedStatus =
          typeof result.access_status === "string" ? result.access_status.toLowerCase().trim() : result.access_status;
        const effectivelyApproved =
          normalizedStatus === "approved" ||
          result.onboarding_stage === "complete" ||
          profileIndicatesApprovedAccess({
            access_status: result.access_status,
            onboarding_stage: result.onboarding_stage,
          }) ||
          accessDecisionIndicatesApproved(getStoredLoginAccess());

        if ((normalizedStatus === "rejected" || normalizedStatus === "pending") && !effectivelyApproved) {
          // Let Start.jsx's session-heal flow re-resolve access and show the correct pending/rejected screen.
          window.location.href = "/start";
          return;
        }

        const dest = getLoginRedirect(result.user, result.access_status, result.onboarding_stage) || "/portal";
        window.location.href = dest;
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "This login link is invalid or has expired.");
      }
    })();

    return () => { cancelled = true; };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-5 sm:px-8 h-20 flex items-center max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center">
          <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
          <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-3">scale</span>
          <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-5 py-20">
        <div className="w-full max-w-lg text-center">
          {!error ? (
            <>
              <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin mx-auto mb-8" />
              <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-4">verifying link</p>
              <h1 className="font-heading text-3xl text-foreground mb-3">activating your environment</h1>
              <p className="font-mono text-xs leading-7 text-muted-foreground lowercase">
                please hold while we securely sign you in.
              </p>
            </>
          ) : (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-4">link error</p>
              <h1 className="font-heading text-3xl text-foreground mb-3">unable to sign you in</h1>
              <p className="font-mono text-xs leading-7 text-muted-foreground mb-8 lowercase">{error}</p>
              <Link
                to="/start?view=login"
                className="inline-block border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors">
                go to login
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}