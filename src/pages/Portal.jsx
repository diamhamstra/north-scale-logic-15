import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { engines, legalDisclaimer } from "@/lib/engineConfig";
import { AGREEMENTS } from "@/lib/agreements";
import PerformanceDashboard from "@/components/portal/PerformanceDashboard";
import DataRoom from "@/components/portal/DataRoom";
import FinancialNewsTicker from "@/components/portal/FinancialNewsTicker";
import NotificationBell from "@/components/portal/NotificationBell";
import SupportCenter from "@/components/portal/SupportCenter";


import { useCurrentUser, useInvestorProfile } from "@/hooks/useCurrentUser";
import { loadInvestorProfileForUser, loadAllInvestorProfilesForUser, profileIndicatesApprovedAccess, accessDecisionIndicatesApproved } from "@/lib/investorProfile";
import { useAuth } from "@/lib/AuthContext";
import { useSessionUserGuard } from "@/hooks/useAuthStorageSync";
import { getLoginSurface, getStoredAuthToken, getStoredAuthUser, isWithinLoginGracePeriod, getStoredLoginAccess, storeLoginAccess } from "@/lib/authSync";
import { invokeFunction } from "@/lib/invokeFunction";
import TwoFAPromptModal from "@/components/portal/TwoFAPromptModal";
import PrivacyDataRights from "@/components/portal/PrivacyDataRights";

// ── helpers ──────────────────────────────────────────────────────────────────
function isPortalUnlocked(profile, user) {
  if (!profile) return false;
  const surface = getLoginSurface();
  if (surface === "admin" && user?.role === "admin") return true;
  return profile.onboarding_stage === "complete" && profile.profile_complete === true;
}
function generateClientId(id) {
  if (!id) return "—";
  const hex = id.replace(/-/g, "").slice(-6).toUpperCase();
  return `NS-${String(parseInt(hex, 16) % 1000000).padStart(6, "0")}`;
}
const NET_WORTH_LABELS = { under_100k: "Under $100,000", "100k_500k": "$100,000 – $500,000", "500k_1m": "$500,000 – $1,000,000", "1m_5m": "$1,000,000 – $5,000,000", "5m_plus": "$5,000,000+" };
const MONTHLY_LABELS = { under_1k: "Under $1,000", "1k_5k": "$1,000 – $5,000", "5k_10k": "$5,000 – $10,000", "10k_50k": "$10,000 – $50,000", "50k_plus": "$50,000+" };
const EXPERIENCE_LABELS = { none: "No prior experience", "1_3_years": "1 – 3 years", "3_5_years": "3 – 5 years", "5_10_years": "5 – 10 years", "10_plus_years": "10+ years" };

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={onChange}
      className={`w-10 h-5 border relative transition-colors flex-shrink-0 ${checked ? "bg-foreground border-foreground" : "bg-transparent border-border"}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-background transition-all ${checked ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

function LocalNav({ items, active, onChange }) {
  return (
    <div className="flex gap-0 border-b border-border mb-8 overflow-x-auto">
      {items.map(item => (
        <button key={item.key} onClick={() => onChange(item.key)}
          className={`px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] whitespace-nowrap border-b-2 -mb-px transition-colors ${active === item.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function Portal() {
  useEffect(() => { document.title = "Portal | North Scale"; }, []);
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const module = searchParams.get("m") || "dashboard";
  const sub = searchParams.get("s") || "";
  const setModule = (m, s = "") => setSearchParams(s ? { m, s } : { m });
  const setSub = (s) => setSearchParams({ m: module, s });

  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useInvestorProfile(user?.id, user?.email);

  useSessionUserGuard(user?.id);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [savedContact, setSavedContact] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ portal_notifications: true, email_notifications: true, monthly_reports: true, new_legal_documents: true, security_alerts: true });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState(false);
  const [twoFaSaving, setTwoFaSaving] = useState(false);
  const [show2FAPrompt, setShow2FAPrompt] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [serverAccess, setServerAccess] = useState(() => getStoredLoginAccess());
  const ensureProfileRunning = useRef(false);

  // Auth is handled by AuthContext - no need for manual redirect here

  useEffect(() => {
    if (!user || user.role === 'admin') return;

    const syncServerAccess = async () => {
      const token = getStoredAuthToken();
      if (!token) return;

      let nativeUserId = null;
      try {
        const nativeUser = await base44.auth.me();
        nativeUserId = nativeUser?.id || null;
      } catch {
        // Native auth may lag behind custom session
      }

      try {
        const resolved = await base44.functions.invoke('resolveLoginAccess', {
          token,
          ...(nativeUserId ? { native_user_id: nativeUserId } : {}),
        });
        const data = resolved.data;
        if (!data) return;

        if (
          data.access_status === 'approved' ||
          profileIndicatesApprovedAccess({
            access_status: data.access_status,
            onboarding_stage: data.onboarding_stage,
          })
        ) {
          const stored = {
            access_status: data.access_status ?? 'approved',
            onboarding_stage: data.onboarding_stage ?? null,
            profile_id: data.profile_id ?? null,
            source: 'portal_heal',
            resolved_at: Date.now(),
          };
          storeLoginAccess(stored);
          setServerAccess(stored);
        }

        if (
          data.access_status === 'approved' ||
          profileIndicatesApprovedAccess({
            access_status: data.access_status,
            onboarding_stage: data.onboarding_stage,
          }) ||
          data.profile_id ||
          (data.profiles_found ?? 0) > 0
        ) {
          refetchProfile();
        }
      } catch {
        // Client profile load remains fallback
      }
    };

    if (!profile || !profileIndicatesApprovedAccess(profile)) {
      syncServerAccess();
    }
  }, [user, profile, refetchProfile]);

  useEffect(() => {
    if (!user || profileLoading || profile !== null || ensureProfileRunning.current) return;

    const ensureProfile = async () => {
      const token = getStoredAuthToken();
      let nativeUserId = null;
      try {
        const nativeUser = await base44.auth.me();
        nativeUserId = nativeUser?.id || null;
      } catch {
        // Continue without native auth id
      }

      if (token) {
        try {
          const resolved = await base44.functions.invoke('resolveLoginAccess', {
            token,
            ...(nativeUserId ? { native_user_id: nativeUserId } : {}),
          });
          const status = resolved.data?.access_status;
          if (
            status === 'approved' ||
            profileIndicatesApprovedAccess({
              access_status: status,
              onboarding_stage: resolved.data?.onboarding_stage,
            })
          ) {
            storeLoginAccess({
              access_status: status ?? 'approved',
              onboarding_stage: resolved.data?.onboarding_stage ?? null,
              profile_id: resolved.data?.profile_id ?? null,
              source: 'portal_ensure',
            });
            setServerAccess(getStoredLoginAccess());
            refetchProfile();
            return;
          }
          if (
            resolved.data?.profile_id ||
            (resolved.data?.profiles_found ?? 0) > 0
          ) {
            refetchProfile();
            return;
          }
        } catch {
          // Fall through to client-side profile load
        }
      }

      const linkUserId = nativeUserId || user.id;
      const allExisting = await loadAllInvestorProfilesForUser(base44, user.id, user.email);
      if (allExisting.length > 0) {
        await Promise.all(
          allExisting.map(async (p) => {
            if (!p.user_id) {
              await base44.entities.InvestorProfile.update(p.id, {
                user_id: linkUserId,
                email: user.email?.toLowerCase().trim() || p.email,
              });
            }
          }),
        );
        refetchProfile();
        return;
      }

      const existing = await loadInvestorProfileForUser(base44, linkUserId, user.email);
      if (existing) {
        if (!existing.user_id) {
          await base44.entities.InvestorProfile.update(existing.id, { user_id: linkUserId });
        }
        refetchProfile();
        return;
      }

      // Never create a shadow pending profile when server already has rows for this account.
      if (accessDecisionIndicatesApproved(getStoredLoginAccess())) {
        refetchProfile();
        return;
      }

      if (token) {
        try {
          const resolved = await base44.functions.invoke('resolveLoginAccess', {
            token,
            ...(nativeUserId ? { native_user_id: nativeUserId } : {}),
          });
          if ((resolved.data?.profiles_found ?? 0) > 0) {
            refetchProfile();
            return;
          }
        } catch {
          // Continue only when no profiles exist anywhere for this account
        }
      }

      await base44.entities.InvestorProfile.create({
        user_id: linkUserId,
        full_name: user.full_name || "",
        email: user.email,
        access_status: "pending",
        onboarding_stage: "profile",
        profile_complete: false,
      });
      refetchProfile();
    };

    ensureProfileRunning.current = true;
    ensureProfile().finally(() => { ensureProfileRunning.current = false; });
  }, [user, profile, profileLoading, refetchProfile]);

  useEffect(() => {
    if (!user || user.role === "admin" || !profile) return;
    if (profile.profile_complete && !profile.onboarding_stage) {
      base44.entities.InvestorProfile.update(profile.id, { onboarding_stage: "agreements" }).then(() => refetchProfile());
    }
  }, [user, profile]);

  // If the client-side profile doesn't show onboarding complete but the server
  // may have the updated profile (e.g. magic-link sessions with RLS mismatch),
  // fetch via service role and trigger a refetch if the server profile is complete.
  useEffect(() => {
    if (!user || user.role === "admin" || profileLoading) return;
    // Only run when profile is loaded but not complete
    if (profile?.onboarding_stage === "complete" && profile?.profile_complete) return;
    // Only run when we believe this user is approved
    const approved =
      profileIndicatesApprovedAccess(profile) ||
      accessDecisionIndicatesApproved(serverAccess) ||
      accessDecisionIndicatesApproved(getStoredLoginAccess());
    if (!approved) return;

    const token = getStoredAuthToken();
    if (!token) return;

    base44.functions.invoke("getProfileBySession", { token })
      .then((res) => {
        const p = res?.data?.profile;
        if (p && (p.onboarding_stage === "complete" || p.profile_complete === true)) {
          refetchProfile();
        }
      })
      .catch(() => {});
  }, [user?.id, profile?.onboarding_stage, profile?.profile_complete, profileLoading]);

  // Intentionally removed: do NOT redirect complete users back to onboarding.

  // Show 2FA prompt on first portal visit after onboarding completes
  useEffect(() => {
    if (!profile || !user || user.role === "admin") return;
    if (profile.onboarding_stage !== "complete") return;
    if (profile.two_fa_enabled) return;
    if (profile.two_fa_prompt_shown) return;
    if (sessionStorage.getItem('ns_2fa_prompt_dismissed')) return;
    // Small delay to let portal render first
    const t = setTimeout(() => setShow2FAPrompt(true), 1000);
    return () => clearTimeout(t);
  }, [profile, user]);

  useEffect(() => {
    if (user) setEmail(user.email || "");
    if (profile) {
      setPhone(profile.phone || "");
      if (profile.notification_prefs) { try { setNotifPrefs(p => ({ ...p, ...JSON.parse(profile.notification_prefs) })); } catch {} }
    }
  }, [user, profile]);

  const hasPendingSession = !user && !!getStoredAuthToken() && isWithinLoginGracePeriod() && !getStoredAuthUser?.();
  const loading = userLoading || profileLoading || hasPendingSession;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (!getStoredAuthToken() || !isWithinLoginGracePeriod()) {
        window.location.href = '/start';
      }
    }
  }, [loading, user]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
    </div>
  );

  const isApproved =
    profileIndicatesApprovedAccess(profile) ||
    accessDecisionIndicatesApproved(serverAccess) ||
    accessDecisionIndicatesApproved(getStoredLoginAccess()) ||
    (getLoginSurface() === "admin" && user?.role === "admin");
  const portalUnlocked = isPortalUnlocked(profile, user);

  const TOP_NAV = [
    { key: "dashboard", label: "dashboard" },
    { key: "performance", label: "performance" },
    { key: "data-room", label: "data room" },
    { key: "notifications", label: "notifications" },
    { key: "support", label: "support" },
    { key: "settings", label: "settings" },
  ];

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setSavingContact(true);
    if (profile) await base44.entities.InvestorProfile.update(profile.id, { phone });
    setSavingContact(false); setSavedContact(true);
    setTimeout(() => setSavedContact(false), 3000);
  };
  const handleSavePrefs = async () => {
    if (!profile) return;
    setSavingPrefs(true);
    await base44.entities.InvestorProfile.update(profile.id, { notification_prefs: JSON.stringify(notifPrefs) });
    setSavingPrefs(false); setSavedPrefs(true);
    setTimeout(() => setSavedPrefs(false), 3000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError("password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      const result = await invokeFunction("changePassword", {
        currentPassword,
        newPassword,
      });
      if (result.data?.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordSaved(true);
        setTimeout(() => setPasswordSaved(false), 3000);
      } else {
        setPasswordError(result.data?.error || "failed to update password.");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.data?.error;
      setPasswordError(msg || "failed to update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── HEADER ── */}
      <header className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl w-full px-5 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link to="/" className="flex items-center">
              <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
              <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-3">scale</span>
              <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
            </Link>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden sm:block text-right">
              <span className="block font-mono text-xs text-muted-foreground">{(() => { const n = user?.full_name?.trim(); if (!n) return ""; const parts = n.split(" "); if (parts.length === 1) return parts[0]; return `${parts[0][0]}. ${parts[parts.length - 1]}`; })()}</span>
              <span className="block font-mono text-[9px] text-muted-foreground/40 mt-0.5">{new Date().toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}</span>
            </div>
            <NotificationBell userId={user?.id} />
            <button onClick={() => logout()} className="font-mono text-[10px] lowercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors">sign out</button>
          </div>
        </div>

        {/* ── LEVEL 1 MODULE NAV — only when portal unlocked ── */}
        {isApproved && portalUnlocked && (
          <div className="border-t border-border">
            <div className="mx-auto max-w-7xl px-5 sm:px-8 flex gap-0 overflow-x-auto">
              {TOP_NAV.map(item => (
                <button key={item.key} onClick={() => setModule(item.key)}
                  className={`px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] whitespace-nowrap border-b-2 -mb-px transition-colors ${module === item.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {item.label}
                </button>
              ))}
            </div>


          </div>
        )}
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full px-5 sm:px-8 py-16">

        {/* ── NOT APPROVED ── */}
        {!isApproved && (
          <ApprovalPoller onApproved={() => { refetchProfile(); }} user={user} />
        )}

        {/* ── ONBOARDING INCOMPLETE ── */}
        {isApproved && !portalUnlocked && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-3">Scale</p>
            <h1 className="font-heading text-4xl text-foreground mb-8">{user?.full_name ? `Welcome, ${user.full_name.split(" ")[0]}.` : "Welcome."}</h1>
            <div className="mb-8 border border-yellow-400/20 bg-yellow-400/5 p-6 max-w-xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-yellow-400 mb-2">Onboarding Required</p>
              <p className="font-mono text-xs leading-6 text-muted-foreground">Complete the remaining onboarding steps to activate your Scale account.</p>
            </div>
            <div className="space-y-3 mb-8 max-w-xl">
              {[
                { step: 1, id: "profile", label: "Investor Profile", desc: "Tax residency, net worth, investment details" },
                { step: 2, id: "agreements", label: "Legal Agreements", desc: "Liability Waiver, Terms of Use, Privacy Policy, Risk Disclosure" },
                { step: 3, id: "passport", label: "Identity Verification", desc: "Passport or government-issued ID" },
              ].map(item => {
                const currentStageNum = { profile: 1, agreements: 2, passport: 3, complete: 4 }[profile?.onboarding_stage || "profile"];
                const isDone = item.step < currentStageNum;
                const isActive = item.step === currentStageNum;
                return (
                  <div key={item.id} className={`border p-5 flex items-start gap-4 ${isDone ? "border-green-400/20" : isActive ? "border-foreground" : "border-border"}`}>
                    <div className={`w-7 h-7 border flex items-center justify-center font-mono text-[10px] flex-shrink-0 mt-0.5 ${isDone ? "border-green-400/40 text-green-400" : isActive ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
                      {isDone ? "✓" : item.step}
                    </div>
                    <div className="flex-1">
                      <p className={`font-mono text-xs ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.label}</p>
                      <p className="font-mono text-[10px] leading-5 text-muted-foreground/60 mt-0.5">{item.desc}</p>
                    </div>
                    {isActive && <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-yellow-400 border border-yellow-400/20 px-2 py-0.5 flex-shrink-0">Current</span>}
                  </div>
                );
              })}
            </div>
            <Link to="/complete-profile" className="inline-block border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors">
              Continue Onboarding →
            </Link>
          </div>
        )}

        {/* ── PORTAL UNLOCKED ── */}
        {isApproved && portalUnlocked && (
          <>
            {/* ════ DASHBOARD ════ */}
            {module === "dashboard" && (
              <div>
                <div className="mb-12 border-b border-border pb-8">
                  <h1 className="font-heading text-4xl text-foreground">
                    {user?.full_name?.trim().split(/\s+/)[0]
                      ? `welcome, ${user.full_name.trim().split(/\s+/)[0][0].toUpperCase()}${user.full_name.trim().split(/\s+/)[0].slice(1)}.`
                      : "welcome."}
                  </h1>
                </div>

                {/* North One — hybrid allocation model */}
                <div className="mb-10">
                  <div className="mb-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-1">quantitative strategies</p>
                    <p className="font-mono text-xs leading-6 text-muted-foreground max-w-xl">Initiate capital allocation to the North One hybrid model.</p>
                  </div>

                  <div className="border border-border bg-secondary/10 p-8 max-w-2xl">
                    <div className="flex items-start justify-between mb-6">
                      <p className="font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground">hybrid allocation model · 11 active sleeves</p>
                      <div className="text-right">
                        <span className="flex items-center gap-1.5 font-mono text-[10px] lowercase tracking-[0.22em] text-green-400">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                          available
                        </span>
                        <span className="block font-mono text-[10px] lowercase tracking-[0.22em] text-muted-foreground/50 mt-0.5">● kyc required</span>
                      </div>
                    </div>

                    <h3 className="font-heading text-4xl lowercase text-foreground mb-6">north one.</h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5 mb-8">
                      <div><p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">MARKETS</p><p className="font-mono text-xs lowercase leading-6 text-muted-foreground">FX, gold, multi-asset</p></div>
                      <div><p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">RISK PROFILE</p><p className="font-mono text-xs lowercase leading-6 text-muted-foreground">moderate</p></div>
                      <div><p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">ANNUALISED RETURN</p><p className="font-mono text-xs text-foreground">+190.0%</p></div>
                      <div><p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">SHARPE RATIO</p><p className="font-mono text-xs text-foreground">9.9</p></div>
                      <div><p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">MAX DRAWDOWN</p><p className="font-mono text-xs text-foreground">−10.6%</p></div>
                      <div><p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">MINIMUM</p><p className="font-mono text-xs text-foreground">$10,000</p></div>
                    </div>

                    <p className="font-mono text-[10px] leading-6 text-muted-foreground/60 mb-6 max-w-lg">
                      Eleven quantitative models running in parallel under one unified allocation. Capital stays in your account at all times. No management or performance fees.
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-yellow-400 mb-6">Illustrative Data — Not Audited, Not a Guarantee of Future Results</p>

                    {(() => {
                      const isActive = profile?.selected_engine === "commodities";
                      const step = isActive ? (profile?.onboarding_step || 0) : 0;
                      const complete = isActive && step >= 6;
                      if (complete) {
                        return <div className="border border-green-400/30 px-5 py-3 text-center max-w-xs"><span className="font-mono text-xs lowercase tracking-[0.22em] text-green-400">allocation active</span></div>;
                      }
                      return (
                        <Link to="/portal/setup/commodities" className="inline-block border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-8 py-3 hover:bg-transparent hover:text-foreground transition-colors">
                          {isActive && step > 0 ? `continue — step ${step}` : "initiate allocation"}
                        </Link>
                      );
                    })()}
                  </div>
                </div>

              </div>
            )}

            {/* ════ PERFORMANCE ════ */}
            {module === "performance" && (
              <div>
                <div className="mb-12 border-b border-border pb-8">
                  <h1 className="font-heading text-4xl text-foreground lowercase">portfolio performance</h1>
                </div>
                <LocalNav
                  items={[
                    { key: "overview", label: "overview" },
                    { key: "tax-reports", label: "tax reports" },
                  ]}
                  active={sub || "overview"}
                  onChange={setSub}
                />
                {(!sub || sub === "overview") && <PerformanceDashboard profile={profile} engineFilter="overview" />}
                {sub === "tax-reports" && <TaxReportsPanel />}
              </div>
            )}

            {/* ════ DATA ROOM ════ */}
            {module === "data-room" && (
              <div>
                <div className="mb-12 border-b border-border pb-8">
                  <h1 className="font-heading text-4xl text-foreground lowercase">documents & reports</h1>
                </div>
                <DataRoom profile={profile} />
              </div>
            )}

            {/* ════ SUPPORT ════ */}
            {module === "support" && (
              <div>
                <SupportCenter userId={user?.id} userRole={user?.role} />
              </div>
            )}

            {/* ════ NOTIFICATIONS ════ */}
            {module === "notifications" && (
              <div>
                <div className="mb-12 border-b border-border pb-8">
                  <h1 className="font-heading text-4xl text-foreground lowercase">messages & alerts</h1>
                </div>
                <NotificationsPanel userId={user?.id} />
              </div>
            )}

            {/* ════ SETTINGS ════ */}
            {module === "settings" && (
              <div>
                <div className="mb-12 border-b border-border pb-8">
                  <h1 className="font-heading text-4xl text-foreground lowercase">account settings</h1>
                </div>
                <LocalNav
                  items={[
                    { key: "profile", label: "profile" },
                    { key: "security", label: "security" },
                    { key: "notifications", label: "notifications" },
                    { key: "privacy", label: "privacy & data" },
                    { key: "support", label: "support" },
                  ]}
                  active={sub || "profile"}
                  onChange={setSub}
                />

                {/* Client ID */}
                <div className="border border-border bg-secondary/20 p-4 mb-8 max-w-sm flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground/60 mb-1">North Scale Account ID</p>
                    <p className="font-heading text-2xl text-foreground tracking-[0.12em]">{generateClientId(profile?.id)}</p>
                  </div>
                  <span className="font-mono text-[9px] lowercase tracking-[0.2em] border border-border px-2 py-1 text-muted-foreground/50">verified</span>
                </div>

                {/* Profile */}
                {(!sub || sub === "profile") && (
                  <div>
                    <form onSubmit={handleSaveContact} className="space-y-5 max-w-md mb-10">
                      <div><label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">email address</label>
                        <input type="email" readOnly value={email} className="w-full border border-border bg-secondary/20 px-4 py-3 font-mono text-xs text-muted-foreground cursor-not-allowed" />
                        <p className="font-mono text-[9px] text-muted-foreground/50 mt-1.5 lowercase">contact support to change your login email.</p>
                      </div>
                      <div><label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">phone number</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors" />
                      </div>
                      <button type="submit" disabled={savingContact} className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors disabled:opacity-50">
                        {savingContact ? "saving..." : savedContact ? "✓ saved" : "save changes"}
                      </button>
                    </form>
                    <div className="border-t border-border pt-8 max-w-xl">
                      <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-5">investor information</p>
                      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                        {[
                          ["full legal name", user?.full_name],
                          ["nationality", profile?.nationality],
                          ["country of residence", profile?.income_tax_country],
                          ["tax residency", profile?.income_tax_country],
                          ["net worth range", NET_WORTH_LABELS[profile?.net_worth]],
                          ["expected allocation", MONTHLY_LABELS[profile?.monthly_investment]],
                          ["investment experience", EXPERIENCE_LABELS[profile?.investment_experience]],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground/60 mb-1.5">{label}</p>
                            <p className="font-mono text-xs text-muted-foreground">{value || "—"}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-8 font-mono text-[10px] leading-6 text-muted-foreground/40 border-t border-border/50 pt-5">
                        To update regulated investor information, contact <a href="mailto:info@northscale.capital" className="text-muted-foreground hover:text-foreground">info@northscale.capital</a>
                      </p>
                    </div>
                  </div>
                )}

                {/* Security */}
                {sub === "security" && (
                  <div className="space-y-8 max-w-md">
                    <form onSubmit={handleChangePassword} className="space-y-5 border border-border p-5">
                      <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-1">change password</p>
                      <div>
                        <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">current password</label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">new password</label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                          placeholder="minimum 8 characters"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">confirm new password</label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                          placeholder="repeat new password"
                        />
                      </div>
                      {passwordError && <p className="font-mono text-xs text-red-400 lowercase">{passwordError}</p>}
                      <button
                        type="submit"
                        disabled={passwordSaving}
                        className="border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-8 py-3 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        {passwordSaving ? "updating..." : passwordSaved ? "✓ password updated" : "update password"}
                      </button>
                    </form>
                    <p className="font-mono text-[10px] text-muted-foreground/60 lowercase">
                      forgot your current password?{" "}
                      <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground transition-colors">request a reset link</Link>
                    </p>
                    <div className="border border-border p-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-1.5">two-factor authentication</p>
                        <p className="font-mono text-xs text-muted-foreground/60 mb-1 lowercase">
                          {profile?.two_fa_enabled ? "enabled — a verification code is sent to your email on each login." : "not enabled — your account is protected by password only."}
                        </p>
                        {profile?.two_fa_enabled && <span className="font-mono text-[9px] lowercase tracking-[0.18em] text-green-400">● active</span>}
                      </div>
                      <button
                        disabled={twoFaSaving}
                        onClick={async () => {
                          if (!profile) return;
                          setTwoFaSaving(true);
                          const newVal = !profile.two_fa_enabled;
                          await base44.entities.InvestorProfile.update(profile.id, { two_fa_enabled: newVal, two_fa_prompt_shown: true });
                          await refetchProfile();
                          setTwoFaSaving(false);
                        }}
                        className={`font-mono text-[10px] lowercase tracking-[0.22em] border px-4 py-2.5 flex-shrink-0 transition-colors disabled:opacity-50 ${profile?.two_fa_enabled ? "border-red-400/30 text-red-400 hover:bg-red-400/10" : "border-foreground text-foreground hover:bg-foreground hover:text-background"}`}
                      >
                        {twoFaSaving ? "..." : profile?.two_fa_enabled ? "disable 2fa" : "enable 2fa"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Notifications */}
                {sub === "notifications" && (
                  <div>
                    <div className="space-y-3 max-w-md mb-6">
                      {[
                        { key: "portal_notifications", label: "platform notifications", desc: "in-portal alerts and updates" },
                        { key: "email_notifications", label: "email notifications", desc: "important updates delivered to your inbox" },
                        { key: "monthly_reports", label: "monthly performance reports", desc: "monthly summary of engine performance" },
                        { key: "new_legal_documents", label: "new legal documents", desc: "alerts when new agreements require your signature" },
                        { key: "security_alerts", label: "security alerts", desc: "login activity and account security notices" },
                      ].map(pref => (
                        <div key={pref.key} className="border border-border p-5 flex items-center justify-between gap-4">
                          <div><p className="font-mono text-xs text-foreground mb-0.5 lowercase">{pref.label}</p><p className="font-mono text-[10px] text-muted-foreground/60 lowercase">{pref.desc}</p></div>
                          <Toggle checked={notifPrefs[pref.key]} onChange={() => setNotifPrefs(p => ({ ...p, [pref.key]: !p[pref.key] }))} />
                        </div>
                      ))}
                    </div>
                    <button onClick={handleSavePrefs} disabled={savingPrefs} className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors disabled:opacity-50">
                      {savingPrefs ? "saving..." : savedPrefs ? "✓ saved" : "save preferences"}
                    </button>
                  </div>
                )}

                {/* Privacy & Data Rights */}
                {sub === "privacy" && (
                  <PrivacyDataRights user={user} profile={profile} />
                )}

                {/* Support */}
                {sub === "support" && (
                  <div className="space-y-4 max-w-md">
                    <div className="border border-border p-5">
                      <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground/60 mb-1.5">general enquiries</p>
                      <a href="mailto:info@northscale.capital" className="font-mono text-xs text-foreground hover:text-muted-foreground transition-colors lowercase">info@northscale.capital</a>
                    </div>
                    <div className="border border-border/50 bg-secondary/10 p-5">
                      <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground/60 mb-1.5">response time</p>
                      <p className="font-mono text-xs text-muted-foreground lowercase">within one business day.</p>
                    </div>
                    <a href="mailto:info@northscale.capital?subject=Support%20Request" className="inline-block border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors">
                      contact support
                    </a>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Live Financial News Feed */}
      <div className="border-t border-border">
        <FinancialNewsTicker />
      </div>

      <footer className="border-t border-border px-5 sm:px-8 py-6 max-w-7xl mx-auto w-full mt-auto">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="font-mono text-[9px] lowercase tracking-[0.28em] text-muted-foreground/50 mb-1">a platform by</p>
            <p className="font-heading text-lg text-foreground lowercase">north scale</p>
          </div>
          <div className="max-w-xl text-right">
            <p className="font-mono text-[10px] leading-5 text-muted-foreground/40 lowercase">
              past performance is not indicative of future results. the quantitative strategies detailed herein are intended solely for institutional and qualified investors. access to these materials may be restricted by law in certain jurisdictions.
            </p>
          </div>
        </div>
      </footer>

      {/* 2FA first-login prompt */}
      {show2FAPrompt && profile && (
        <TwoFAPromptModal
          profile={profile}
          onClose={async () => {
            setShow2FAPrompt(false);
            // Mark prompt as shown so it never appears again
            await base44.entities.InvestorProfile.update(profile.id, { two_fa_prompt_shown: true });
            refetchProfile();
          }}
        />
      )}
    </div>
  );
}

// ── Approval Poller ───────────────────────────────────────────────────────────
function ApprovalPoller({ onApproved, user }) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const dotTimer = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 600);
    return () => clearInterval(dotTimer);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to real-time InvestorProfile changes for instant approval detection
    const unsubscribe = base44.entities.InvestorProfile.subscribe((event) => {
      const data = event.data;
      if (!data) return;
      if (data.user_id !== user.id) return;
      if (
        data.access_status === 'approved' ||
        profileIndicatesApprovedAccess({ access_status: data.access_status, onboarding_stage: data.onboarding_stage })
      ) {
        storeLoginAccess({
          access_status: data.access_status ?? 'approved',
          onboarding_stage: data.onboarding_stage ?? null,
          profile_id: data.id ?? null,
          source: 'realtime',
          resolved_at: Date.now(),
        });
        onApproved();
      }
    });

    // Also do an immediate poll as fallback
    const token = getStoredAuthToken();
    if (token) {
      base44.functions.invoke('resolveLoginAccess', { token }).then(resolved => {
        const data = resolved.data;
        if (!data) return;
        if (
          data.access_status === 'approved' ||
          profileIndicatesApprovedAccess({ access_status: data.access_status, onboarding_stage: data.onboarding_stage })
        ) {
          storeLoginAccess({
            access_status: data.access_status ?? 'approved',
            onboarding_stage: data.onboarding_stage ?? null,
            profile_id: data.profile_id ?? null,
            source: 'approval_poll',
            resolved_at: Date.now(),
          });
          onApproved();
        }
      }).catch(() => {});
    }

    return () => unsubscribe();
  }, [onApproved, user?.id]);

  return (
    <div>
      <p className="font-mono text-[10px] lowercase tracking-[0.36em] text-muted-foreground mb-3">scale</p>
      <h1 className="font-heading text-4xl text-foreground mb-6">{user?.full_name ? `welcome, ${user.full_name.split(" ")[0]}.` : "welcome."}</h1>
      <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-foreground mb-1">ACCESS PENDING</p>
      <span className="font-mono text-xs text-yellow-400">● awaiting approval{dots}</span>
      <div className="mt-10 max-w-lg">
        <p className="font-mono text-xs leading-7 text-muted-foreground">
          your scale access request is under review. approval typically takes <span className="text-foreground">3–6 hours</span>. a member of the north scale team will contact you once a decision has been made. contact us at{" "}
          <a href="mailto:info@northscale.capital" className="text-foreground hover:underline">info@northscale.capital</a>.
        </p>
        <p className="font-mono text-[10px] text-muted-foreground/40 mt-6 lowercase">this page checks for updates automatically.</p>
      </div>
    </div>
  );
}

// ── Tax Reports panel ─────────────────────────────────────────────────────────
function TaxReportsPanel() {
  const taxReports = [
    { label: "Annual Tax Report 2025", period: "FY 2025", status: "coming soon" },
    { label: "Annual Tax Report 2026", period: "FY 2026", status: "coming soon" },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <p className="font-mono text-[10px] leading-6 text-muted-foreground/60">
        Annual tax reports will be made available here for download as PDF. Documents are typically issued in Q1 of the following tax year.
      </p>
      <div className="divide-y divide-border border border-border">
        {taxReports.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-6 py-5 gap-4">
            <div>
              <p className="font-mono text-xs text-foreground">{r.label}</p>
              <p className="font-mono text-[10px] text-muted-foreground/50 mt-0.5">{r.period}</p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/40 border border-border/40 px-3 py-1.5 flex-shrink-0">
              {r.status}
            </span>
          </div>
        ))}
      </div>
      <p className="font-mono text-[10px] text-muted-foreground/40 leading-6">
        For questions regarding your tax documents, contact <a href="mailto:finance@northscale.capital" className="text-muted-foreground hover:text-foreground transition-colors">finance@northscale.capital</a>
      </p>
    </div>
  );
}

// ── Notifications panel ───────────────────────────────────────────────────────
function NotificationsPanel({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    base44.entities.Notification.filter({ user_id: userId }).then(n => {
      setNotifications(n.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setLoading(false);
    });
  }, [userId]);

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };
  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  if (loading) return <div className="flex items-center justify-center h-32"><div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;

  const unreadCount = notifications.filter(n => !n.is_read).length;
  return (
    <div className="max-w-2xl">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between mb-5">
          <span className="font-mono text-xs text-muted-foreground">{unreadCount} unread</span>
          <button onClick={markAllRead} className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors">Mark all read</button>
        </div>
      )}
      {notifications.length === 0 && <p className="font-mono text-xs text-muted-foreground">No notifications.</p>}
      <div className="space-y-2">
        {notifications.map(n => (
          <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
            className={`border p-5 transition-colors cursor-pointer ${n.is_read ? "border-border/50 opacity-60" : "border-border hover:bg-secondary/20"}`}>
            <div className="flex items-start justify-between gap-4 mb-1">
              <p className={`font-mono text-xs ${n.is_read ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
              <span className="font-mono text-[9px] text-muted-foreground/50 whitespace-nowrap flex-shrink-0">{fmtDate(n.created_date)}</span>
            </div>
            <p className="font-mono text-[10px] leading-5 text-muted-foreground/70">{n.message}</p>
            {!n.is_read && <span className="inline-block mt-2 w-1.5 h-1.5 rounded-full bg-blue-400" />}
          </div>
        ))}
      </div>
    </div>
  );
}