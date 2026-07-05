import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  ensureProfileLinkedForSession,
  sessionMayCompleteOnboarding,
  updateInvestorProfileSecure,
} from "@/lib/investorProfile";
import { getStoredAuthToken } from "@/lib/authSync";
import { signOut } from "@/lib/customAuth";
import AgreementViewer from "@/components/onboarding/AgreementViewer";
import {
  AGREEMENTS,
  allAgreementsSigned,
  normalizeAgreementsSigned,
  serializeAgreementsSigned,
} from "@/lib/agreements";

const NET_WORTH_OPTIONS = [
  { value: "under_100k", label: "Under $100,000" },
  { value: "100k_500k", label: "$100,000 – $500,000" },
  { value: "500k_1m", label: "$500,000 – $1,000,000" },
  { value: "1m_5m", label: "$1,000,000 – $5,000,000" },
  { value: "5m_plus", label: "$5,000,000+" },
];

const EXPERIENCE_OPTIONS = [
  { value: "none", label: "No prior experience" },
  { value: "1_3_years", label: "1 – 3 years" },
  { value: "3_5_years", label: "3 – 5 years" },
  { value: "5_10_years", label: "5 – 10 years" },
  { value: "10_plus_years", label: "10+ years" },
];

const STEPS = [
  { id: "profile", step: 1, label: "Investor Profile" },
  { id: "agreements", step: 2, label: "Legal Agreements" },
  { id: "passport", step: 3, label: "Identity Verification" },
];

function stageToStep(stage) {
  const map = { profile: 1, agreements: 2, passport: 3, complete: 4 };
  return map[stage] || 1;
}

export default function CompleteProfile() {
  useEffect(() => { document.title = "Complete Profile | North Scale"; }, []);

  const { data: user, isLoading: userLoading } = useCurrentUser();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeAgreementIdx, setActiveAgreementIdx] = useState(0);

  const [form, setForm] = useState({
    income_tax_country: "",
    net_worth: "",
    investment_experience: "",
    nationality: "",
    phone: "",
  });
  const [idConsent, setIdConsent] = useState(false);
  const [uploadingPassport, setUploadingPassport] = useState(false);

  const loadProfile = async () => {
    if (!user) return;
    setLoadingProfile(true);
    setError("");
    try {
      const { profile: linked } = await ensureProfileLinkedForSession(base44, user);
      if (!linked) {
        setError("We could not load your investor profile. Please refresh or contact support.");
        setProfile(null);
        return;
      }
      if (!sessionMayCompleteOnboarding(user, linked)) {
        window.location.href = "/start";
        return;
      }
      if (linked.onboarding_stage === "complete" && linked.profile_complete) {
        window.location.href = "/portal";
        return;
      }
      setProfile(linked);
      setForm({
        income_tax_country: linked.income_tax_country || "",
        net_worth: linked.net_worth || "",
        investment_experience: linked.investment_experience || "",
        nationality: linked.nationality || "",
        phone: linked.phone || "",
      });
    } catch (err) {
      setError(err?.message || "Unable to load your profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      if (!getStoredAuthToken()) window.location.href = "/start";
      return;
    }
    loadProfile();
  }, [user, userLoading]);

  const currentStage = profile?.onboarding_stage || "profile";
  const currentStep = stageToStep(currentStage);
  const signedAgreements = useMemo(
    () => normalizeAgreementsSigned(profile?.agreements_signed),
    [profile?.agreements_signed],
  );

  const saveProfile = async (updates) => {
    if (!profile?.id) throw new Error("Profile not loaded.");
    const updated = await updateInvestorProfileSecure(base44, profile.id, updates);
    setProfile(updated);
    return updated;
  };

  const handleSaveProfileStep = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.income_tax_country.trim()) {
      setError("Tax residency is required.");
      return;
    }
    if (!form.net_worth) {
      setError("Net worth range is required.");
      return;
    }
    if (!form.investment_experience) {
      setError("Investment experience is required.");
      return;
    }
    setSaving(true);
    try {
      const updated = await saveProfile({
        income_tax_country: form.income_tax_country.trim(),
        net_worth: form.net_worth,
        investment_experience: form.investment_experience,
        nationality: form.nationality.trim() || undefined,
        phone: form.phone.trim() || undefined,
        onboarding_stage: "agreements",
      });
      base44.functions.invoke("automationEngine", {
        event: "PROFILE_COMPLETED",
        data: {
          user_id: user.id,
          profile_id: updated.id,
          email: user.email,
        },
      }).catch(() => {});
    } catch (err) {
      setError(err?.message || "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignAgreement = async (agreement, sigData) => {
    setError("");
    setSaving(true);
    try {
      const nextSigned = {
        ...signedAgreements,
        [agreement.key]: {
          ...sigData,
          version: agreement.version,
          signed_at: sigData.signed_at_utc || new Date().toISOString(),
          signature_value: sigData.value,
        },
      };
      const updates = { agreements_signed: serializeAgreementsSigned(nextSigned) };
      if (allAgreementsSigned(updates.agreements_signed)) {
        updates.onboarding_stage = "passport";
      }
      const updated = await saveProfile(updates);
      base44.functions.invoke("automationEngine", {
        event: "AGREEMENT_SIGNED",
        data: {
          user_id: user.id,
          agreement_key: agreement.key,
          agreement_title: agreement.title,
          version: agreement.version,
        },
      }).catch(() => {});
      if (updated.onboarding_stage === "passport") {
        setActiveAgreementIdx(0);
      } else {
        const nextIdx = AGREEMENTS.findIndex((a) => !normalizeAgreementsSigned(updated.agreements_signed)[a.key]);
        if (nextIdx >= 0) setActiveAgreementIdx(nextIdx);
      }
    } catch (err) {
      setError(err?.message || "Could not save agreement. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePassportUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    if (!idConsent) {
      setError("Please confirm consent to store your identification document.");
      return;
    }
    setError("");
    setUploadingPassport(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const upload = await base44.integrations.Core.UploadFile({ file: dataUrl });
      if (!upload?.file_url) throw new Error("Upload failed.");
      const updated = await saveProfile({
        passport_url: upload.file_url,
        passport_status: "pending_review",
        onboarding_stage: "complete",
        profile_complete: true,
      });
      base44.functions.invoke("automationEngine", {
        event: "PASSPORT_UPLOADED",
        data: {
          user_id: user.id,
          profile_id: updated.id,
          email: user.email,
          id_consent: true,
          id_consent_at: new Date().toISOString(),
        },
      }).catch(() => {});
      window.location.href = "/portal";
    } catch (err) {
      setError(err?.message || "Could not upload document. Please try again.");
    } finally {
      setUploadingPassport(false);
      e.target.value = "";
    }
  };

  if (userLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const activeAgreement = AGREEMENTS[activeAgreementIdx] || AGREEMENTS[0];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-3xl w-full px-5 sm:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
            <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-3">scale</span>
            <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
          </Link>
          <button
            type="button"
            onClick={() => signOut("/start")}
            className="font-mono text-[10px] lowercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors"
          >
            sign out
          </button>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl w-full px-5 sm:px-8 py-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-3">Onboarding</p>
        <h1 className="font-heading text-4xl text-foreground mb-8">Complete your profile</h1>

        <div className="flex gap-0 border-b border-border mb-10 overflow-x-auto">
          {STEPS.map((item) => {
            const done = item.step < currentStep;
            const active = item.step === currentStep;
            return (
              <div
                key={item.id}
                className={`px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] whitespace-nowrap border-b-2 -mb-px ${
                  active ? "border-foreground text-foreground" : done ? "border-green-400/40 text-green-400" : "border-transparent text-muted-foreground"
                }`}
              >
                {done ? "✓ " : `${item.step}. `}{item.label}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 border border-red-400/30 bg-red-400/5 px-4 py-3">
            <p className="font-mono text-xs text-red-400">{error}</p>
          </div>
        )}

        {currentStage === "profile" && (
          <form onSubmit={handleSaveProfileStep} className="space-y-5 max-w-xl">
            <p className="font-mono text-xs leading-6 text-muted-foreground mb-2">
              Provide your investor details for compliance and account setup.
            </p>
            <div>
              <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">
                tax residency country <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.income_tax_country}
                onChange={(e) => setForm({ ...form, income_tax_country: e.target.value })}
                className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                placeholder="e.g. United Arab Emirates"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">
                net worth <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={form.net_worth}
                onChange={(e) => setForm({ ...form, net_worth: e.target.value })}
                className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
              >
                <option value="">Select range</option>
                {NET_WORTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">
                investment experience <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={form.investment_experience}
                onChange={(e) => setForm({ ...form, investment_experience: e.target.value })}
                className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
              >
                <option value="">Select experience</option>
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">nationality</label>
              <input
                type="text"
                value={form.nationality}
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                placeholder="optional"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                placeholder="optional"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
            >
              {saving ? "saving..." : "Continue to Agreements →"}
            </button>
          </form>
        )}

        {currentStage === "agreements" && (
          <div>
            <div className="flex gap-2 mb-6 flex-wrap">
              {AGREEMENTS.map((a, idx) => {
                const signed = signedAgreements[a.key];
                const isCurrent = idx === activeAgreementIdx;
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setActiveAgreementIdx(idx)}
                    className={`font-mono text-[9px] uppercase tracking-[0.16em] px-3 py-1.5 border ${
                      signed ? "border-green-400/30 text-green-400" : isCurrent ? "border-foreground text-foreground" : "border-border text-muted-foreground"
                    }`}
                  >
                    {signed ? "✓ " : ""}{a.title}
                  </button>
                );
              })}
            </div>
            <AgreementViewer
              agreement={activeAgreement}
              alreadySigned={signedAgreements[activeAgreement.key]}
              onSign={(sigData) => handleSignAgreement(activeAgreement, sigData)}
            />
            {saving && (
              <p className="mt-4 font-mono text-[10px] text-muted-foreground animate-pulse">Saving agreement...</p>
            )}
          </div>
        )}

        {currentStage === "passport" && (
          <div className="max-w-xl">
            <p className="font-mono text-xs leading-6 text-muted-foreground mb-6">
              Upload a clear photo or scan of your passport or government-issued ID. Our compliance team will review it shortly.
            </p>
            <label className="flex items-start gap-3 cursor-pointer border border-border p-4 mb-6">
              <input
                type="checkbox"
                checked={idConsent}
                onChange={(e) => setIdConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 border border-border bg-background accent-foreground cursor-pointer flex-shrink-0"
              />
              <span className="font-mono text-[10px] leading-6 text-muted-foreground">
                I consent to North Scale storing my identification document for KYC/AML compliance purposes.
              </span>
            </label>
            <label className={`block border border-dashed border-border p-10 text-center cursor-pointer hover:border-foreground transition-colors ${!idConsent ? "opacity-50 pointer-events-none" : ""}`}>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                disabled={uploadingPassport || !idConsent}
                onChange={handlePassportUpload}
              />
              <p className="font-mono text-xs text-foreground mb-2">
                {uploadingPassport ? "Uploading..." : "Click to upload passport or ID"}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">PDF, JPG, or PNG — max 10MB</p>
            </label>
            {profile?.passport_url && (
              <p className="mt-4 font-mono text-[10px] text-green-400">Document already on file — upload again to replace.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
