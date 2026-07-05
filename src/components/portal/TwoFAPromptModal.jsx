import React, { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function TwoFAPromptModal({ profile, onClose }) {
  const [enabling, setEnabling] = useState(false);
  const [done, setDone] = useState(false);

  const handleEnable = async () => {
    setEnabling(true);
    await base44.entities.InvestorProfile.update(profile.id, { two_fa_enabled: true });
    setDone(true);
    setEnabling(false);
  };

  const handleSkip = () => {
    // Mark as dismissed so we don't show again this session
    sessionStorage.setItem('ns_2fa_prompt_dismissed', '1');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-5">
      <div className="w-full max-w-md border border-border bg-background p-8">
        {done ? (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-green-400 mb-4">Security</p>
            <h2 className="font-heading text-3xl text-foreground mb-4">Two-Factor Authentication Enabled</h2>
            <p className="font-mono text-xs leading-7 text-muted-foreground mb-8">
              Your account is now protected with 2FA. Each login will require a verification code sent to your email address.
            </p>
            <button
              onClick={() => { sessionStorage.setItem('ns_2fa_prompt_dismissed', '1'); onClose(); }}
              className="w-full border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors"
            >
              Continue to Platform →
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 border border-border flex items-center justify-center">
                <span className="text-foreground text-sm">⚿</span>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground">Account Security</p>
            </div>
            <h2 className="font-heading text-3xl text-foreground mb-4">Enable Two-Factor Authentication?</h2>
            <p className="font-mono text-xs leading-7 text-muted-foreground mb-3">
              We recommend enabling 2FA to add an extra layer of security to your Scale account.
            </p>
            <p className="font-mono text-xs leading-6 text-muted-foreground/60 mb-8">
              When enabled, each login will require a 6-digit code sent to your email. You can disable this at any time in Account Settings → Security.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleEnable}
                disabled={enabling}
                className="w-full border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
              >
                {enabling ? "Enabling..." : "Enable 2FA — Recommended"}
              </button>
              <button
                onClick={handleSkip}
                className="w-full border border-border font-mono text-xs uppercase tracking-[0.24em] px-8 py-4 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                Skip for Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}