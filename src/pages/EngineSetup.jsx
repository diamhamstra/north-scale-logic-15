import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { engines, legalDisclaimer } from "@/lib/engineConfig";
import SetupStep from "@/components/portal/SetupStep";
import ProgressBar from "@/components/portal/ProgressBar";
import NotificationBell from "@/components/portal/NotificationBell";
import { useCurrentUser, useInvestorProfile } from "@/hooks/useCurrentUser";

function generateClientId(id) {
  if (!id) return "—";
  const hex = id.replace(/-/g, "").slice(-6).toUpperCase();
  return `NS-${String(parseInt(hex, 16) % 1000000).padStart(6, "0")}`;
}

export default function EngineSetup() {
  const { engine: engineKey } = useParams();
  const engine = engines[engineKey];

  const [localProfile, setLocalProfile] = useState(null);
  const setProfile = setLocalProfile;
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [engineSwitching, setEngineSwitching] = useState(false);

  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();
  const { data: fetchedProfile, isLoading: profileLoading } = useInvestorProfile(user?.id, user?.email);

  // Use local profile for mutations, fall back to fetched
  const profile = localProfile || fetchedProfile;

  useEffect(() => {
    if (!userLoading && userError) { window.location.href = "/start"; }
  }, [userLoading, userError]);

  useEffect(() => {
    if (!fetchedProfile || engineSwitching) return;
    // Prefer the local snapshot (set right after our own writes) over a
    // possibly-stale fetchedProfile reference from an in-flight/late refetch,
    // so this effect never rewinds progress we just saved.
    const p = localProfile || fetchedProfile;
    const totalSteps = engines[engineKey]?.totalSteps || 5;
    if (p.selected_engine === engineKey && p.onboarding_step > totalSteps) {
      setCompleted(true);
    } else if (p.selected_engine === engineKey && p.onboarding_step > 0) {
      setCurrentStep(p.onboarding_step);
    }
    // Switch engine if different
    if (p.selected_engine !== engineKey) {
      setEngineSwitching(true);
      base44.entities.InvestorProfile.update(p.id, {
        selected_engine: engineKey,
        onboarding_step: 1,
        step_1_complete: false,
        step_2_complete: false,
        step_3_complete: false,
        step_4_complete: false,
        step_5_complete: false,
      }).then(updated => {
        setLocalProfile(updated);
        setCurrentStep(1);
        setEngineSwitching(false);
      });
    }
  }, [fetchedProfile, engineKey, engineSwitching, localProfile]);

  const handleStepBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleStepComplete = async (stepNumber, formData) => {
    const totalSteps = engine.totalSteps || 5;
    const nextStep = stepNumber + 1;
    const isLast = stepNumber === totalSteps;
    const completedStep = Math.min(stepNumber, 5);
    const updates = {
      selected_engine: engineKey,
      onboarding_step: isLast ? totalSteps + 1 : nextStep,
      [`step_${completedStep}_complete`]: true,
    };
    // Step 4 is metacopier_account — save email and ID keyed by engine
    if (stepNumber === 4 && formData) {
      if (formData.metacopier_email) updates[`${engineKey}_metacopier_email`] = formData.metacopier_email;
      if (formData.metacopier_id) updates[`${engineKey}_metacopier_id`] = formData.metacopier_id;
    }
    const updated = await base44.entities.InvestorProfile.update(profile.id, updates);
    setProfile(updated);

    // Fire automation events
    if (stepNumber === 4 && formData?.metacopier_id) {
      base44.functions.invoke("automationEngine", {
        event: "METACOPIER_CONNECTED",
        data: { user_id: user?.id, engine: engineKey, metacopier_id: formData.metacopier_id, email: user?.email },
      }).catch(() => {});
    }
    if (isLast) {
      base44.functions.invoke("automationEngine", {
        event: "ENGINE_ACTIVATED",
        data: { user_id: user?.id, engine: engineKey, profile_id: profile.id, email: user?.email },
      }).catch(() => {});
      setCompleted(true);
    } else {
      setCurrentStep(nextStep);
    }
  };

  if (userLoading || profileLoading || engineSwitching || !engine) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const step = engine.steps[currentStep - 1];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── HEADER ── */}
      <header className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl w-full px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link to="/portal" className="flex items-center">
              <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
              <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-3">scale</span>
              <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
            </Link>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden sm:block text-right">
              <span className="block font-mono text-xs text-muted-foreground">{(() => { const n = user?.full_name?.trim(); if (!n) return ""; const parts = n.split(" "); if (parts.length === 1) return parts[0]; return `${parts[0][0]}. ${parts[parts.length - 1]}`; })()}</span>
              <span className="block font-mono text-[10px] text-muted-foreground/50">{generateClientId(profile?.id)}</span>
            </div>
            <NotificationBell userId={user?.id} />
            <button onClick={() => base44.auth.logout("/start")} className="font-mono text-[10px] lowercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors">sign out</button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl w-full px-5 sm:px-8 py-12">

        {completed ? (
          /* Completion screen */
          engineKey === "commodities" || engineKey === "digital" ? (
            <div className="max-w-lg">
              <p className="font-mono text-xs lowercase tracking-[0.36em] text-muted-foreground mb-4">
                setup complete
              </p>
              <h2 className="font-heading text-4xl text-foreground mb-4 lowercase">{engine.label} setup complete</h2>
              <p className="font-mono text-xs leading-7 text-muted-foreground mb-8 lowercase">
                your onboarding process has been completed successfully. the north scale team will review your configuration and activate access to the {engine.label} once verification is complete.
              </p>
              <div className="border border-yellow-400/30 p-5 mb-8">
                <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-yellow-400 mb-3">status</p>
                <p className="font-mono text-xs text-yellow-400 lowercase">● pending final approval</p>
              </div>
              <div className="border border-border p-6 mb-8 space-y-3">
                {[
                  "account created",
                  "broker verified",
                  "funding confirmed",
                  "metacopier connected",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-green-400">✓</span>
                    <span className="font-mono text-xs text-muted-foreground lowercase">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/portal"
                className="inline-block border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors">
                return to scale
              </Link>
            </div>
          ) : (
          <div className="py-12 text-center max-w-lg mx-auto">
            <div className="mb-8 inline-flex items-center justify-center w-16 h-16 border border-green-400/30">
              <span className="font-mono text-xl text-green-400">✓</span>
            </div>
            <p className="font-mono text-xs lowercase tracking-[0.36em] text-muted-foreground mb-4">
              onboarding complete
            </p>
            <h2 className="font-heading text-4xl text-foreground mb-6 lowercase">setup complete</h2>
            <p className="font-mono text-xs leading-7 text-muted-foreground mb-10 lowercase">
              your account has completed the onboarding process for the{" "}
              <strong className="text-foreground">{engine.label}</strong>. a member of our team may contact you if additional information is required.
            </p>
            <Link to="/portal"
              className="inline-block border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors">
              return to scale
            </Link>
          </div>
          )
        ) : (
          <>
            {/* Engine header */}
            <div className="mb-8 border-b border-border pb-6">
              <p className="font-mono text-[10px] lowercase tracking-[0.36em] text-muted-foreground mb-3">
                {engine.algorithm}
              </p>
              <h1 className="font-heading text-3xl sm:text-4xl text-foreground lowercase">{engine.label}</h1>
            </div>

            {/* Progress */}
            <ProgressBar currentStep={currentStep} totalSteps={engine.totalSteps || 5} />

            {/* Step content */}
            <SetupStep step={step} onComplete={(formData) => handleStepComplete(currentStep, formData)} onBack={currentStep > 1 ? handleStepBack : null} totalSteps={engine.totalSteps || 5} />
          </>
        )}
      </main>

      <footer className="border-t border-border px-5 sm:px-8 py-6 max-w-3xl mx-auto w-full mt-auto">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="font-mono text-[9px] lowercase tracking-[0.28em] text-muted-foreground/50 mb-1">a platform by</p>
            <a href="/" className="font-heading text-lg text-foreground lowercase hover:text-muted-foreground transition-colors">north scale</a>
          </div>
          <div className="max-w-xl text-right">
            <p className="font-mono text-[10px] leading-5 text-muted-foreground/40 lowercase">
              past performance is not indicative of future results. the quantitative strategies detailed herein are intended solely for institutional and qualified investors. access to these materials may be restricted by law in certain jurisdictions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}