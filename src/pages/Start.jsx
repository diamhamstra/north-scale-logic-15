import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { performCustomLogin, store2FAPending, completeCustom2FA, signOut, getLoginRedirect, clearAuthStorage, prepareForNewSession } from "@/lib/customAuth";
import { profileIndicatesApprovedAccess, resolveLoginAccessStatus, accessDecisionIndicatesApproved } from "@/lib/investorProfile";
import { AUTH_2FA_PENDING_KEY, getLoginSurface, getStoredAuthToken, getStoredLoginAccess } from "@/lib/authSync";
import { getSessionUser } from "@/lib/sessionUser";

export default function Start() {
  useEffect(() => { document.title = "Login | North Scale"; }, []);
  const [searchParams] = useSearchParams();
  const [view, setView] = useState("landing");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    organization: "",
    referred_by: "",
    monthly_investment: ""
  });
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [approvalGranted, setApprovalGranted] = useState(false);

  useEffect(() => {
    const requestedView = searchParams.get('view');

    // Preserve 2FA challenge state across reload
    if (requestedView === '2fa' && sessionStorage.getItem(AUTH_2FA_PENDING_KEY)) {
      setView('2fa');
      return;
    }

    // Only clear session when explicitly opening login — avoids wiping other tabs during registration
    if (requestedView === 'login') {
      clearAuthStorage();
      setView('login');
      return;
    }

    // Heal stale sessions: if already signed in, re-resolve access and redirect when approved
    let cancelled = false;
    const healStaleSession = async () => {
      if (!getStoredAuthToken()) return;

      try {
        const sessionUser = await getSessionUser();
        if (!sessionUser || cancelled) return;

        if (sessionUser.role === 'admin' && getLoginSurface() === 'admin') {
          window.location.href = '/admin-portal';
          return;
        }

        const resolved = await resolveLoginAccessStatus(base44, sessionUser, null, null);
        if (cancelled) return;

        redirectAfterLogin(
          sessionUser,
          resolved.access_status,
          sessionUser.email || '',
          resolved.onboarding_stage
        );
      } catch (err) {
        console.warn('[Start] session heal skipped', err?.message || err);
      }
    };

    healStaleSession();
    return () => {cancelled = true;};
  }, [searchParams]);

  const redirectAfterLogin = (user, accessStatus, email, onboardingStage) => {
    if (user.role === 'admin' && getLoginSurface() === 'admin') {
      window.location.href = '/admin-portal';
      return;
    }

    const normalizedStatus = typeof accessStatus === 'string' ? accessStatus.toLowerCase().trim() : accessStatus;
    const storedAccess = getStoredLoginAccess();
    const effectivelyApproved =
    normalizedStatus === 'approved' ||
    onboardingStage === 'complete' ||
    profileIndicatesApprovedAccess({ access_status: accessStatus, onboarding_stage: onboardingStage }) ||
    accessDecisionIndicatesApproved(storedAccess);

    if (normalizedStatus === 'pending' && !effectivelyApproved) {
      console.warn('[Start] pending screen', {
        email,
        accessStatus,
        onboardingStage,
        userId: user?.id
      });
      setRegisteredEmail(email);
      setView('pending');
      setLoading(false);
      return;
    }
    if (!normalizedStatus && !effectivelyApproved) {
      // Unknown access — send to portal; server-side resolve will heal duplicates.
      window.location.href = '/portal';
      return;
    }
    if (normalizedStatus === 'rejected' && !effectivelyApproved) {
      setError('Your access request has been rejected. Please contact support.');
      setLoading(false);
      return;
    }
    const dest = getLoginRedirect(
      user,
      effectivelyApproved ? 'approved' : accessStatus,
      onboardingStage
    );
    window.location.href = dest || '/portal';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await performCustomLogin(loginData.email, loginData.password);

      if (result.requires2FA) {
        store2FAPending({
          challenge_token: result.challenge_token,
          email: result.email,
          redirect: '/portal',
          password: loginData.password
        });
        window.location.href = '/start?view=2fa';
        return;
      }

      if (result.success) {
        redirectAfterLogin(result.user, result.access_status, loginData.email.trim(), result.onboarding_stage);
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("Invalid email or password.");
    }
    setLoading(false);
  };

  const buildRegistrationPayload = () => ({
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
    full_name: formData.full_name,
    organization: formData.organization || "",
    referred_by: formData.referred_by,
    monthly_investment: formData.monthly_investment
  });

  const invokeRegisterWithOtp = async (payload, retriesLeft = 1) => {
    const result = await base44.functions.invoke("registerWithOtp", payload);
    if (
    !result.data?.success &&
    retriesLeft > 0 &&
    String(result.data?.error || "").includes("user not found"))
    {
      await new Promise((r) => setTimeout(r, 1500));
      return invokeRegisterWithOtp(payload, retriesLeft - 1);
    }
    return result;
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setError("");

    const errors = {};
    if (!formData.full_name.trim()) errors.full_name = "Full name is required.";
    if (!formData.email.trim()) errors.email = "Email address is required.";
    if (!formData.password || formData.password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (formData.password !== formData.confirm_password) errors.confirm_password = "Passwords do not match.";
    if (!formData.referred_by.trim()) errors.referred_by = "Referred by is required.";
    if (!formData.monthly_investment) errors.monthly_investment = "Intended monthly investment is required.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await prepareForNewSession();
      const payload = buildRegistrationPayload();
      const result = await invokeRegisterWithOtp(payload);
      if (!result.data?.success) {
        throw new Error(result.data?.error || "Registration failed.");
      }
      setRegisteredEmail(payload.email);
      setView("otp");
    } catch (registerErr) {
      setError(registerErr?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const email = registeredEmail.trim().toLowerCase();
      const verifyResult = await base44.functions.invoke("verifyRegistrationOtp", { email, code: otpCode });
      if (!verifyResult.data?.success) {
        throw new Error(verifyResult.data?.error || "Invalid verification code.");
      }
      const regResult = await base44.functions.invoke("registerWithOtp", {
        ...buildRegistrationPayload(),
        email,
        complete_registration: true
      });
      if (!regResult.data?.success) {
        throw new Error(regResult.data?.error || "Failed to complete registration.");
      }
      const result = await performCustomLogin(email, formData.password);
      if (result.requires2FA) {
        store2FAPending({
          challenge_token: result.challenge_token,
          email: result.email,
          redirect: '/portal',
          password: formData.password
        });
        window.location.href = '/start?view=2fa';
        return;
      }
      redirectAfterLogin(result.user, result.access_status, email, result.onboarding_stage);
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    try {
      const result = await base44.functions.invoke("sendRegistrationOtp", { email: registeredEmail });
      if (!result.data?.success) {
        setError("Failed to resend code. Please try again.");
      }
    } catch {
      setError("Failed to resend code.");
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await completeCustom2FA(otpCode);
      redirectAfterLogin(
        result.user,
        result.access_status,
        result.user?.email || "",
        result.onboarding_stage
      );
    } catch (err) {
      console.error('2FA verification error:', err);
      setError(err?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Watch for approval in real-time via entity subscription + fallback poll
  useEffect(() => {
    if (view !== "pending" || !!approvalGranted) return;

    let cancelled = false;
    let sessionUser = null;
    let unsubscribe = null;

    const checkApproval = async (profiles) => {
      const approved = profiles?.find(p =>
        (p.access_status || "").toLowerCase().trim() === "approved"
      );
      if (approved && !cancelled) {
        setApprovalGranted({ access_status: "approved", onboarding_stage: approved.onboarding_stage, user: sessionUser });
      }
    };

    const init = async () => {
      try {
        const token = getStoredAuthToken();
        if (!token) return;
        sessionUser = await getSessionUser();
        if (!sessionUser || cancelled) return;

        // Initial check
        const profiles = await base44.entities.InvestorProfile.filter({ user_id: sessionUser.id });
        await checkApproval(profiles);
        if (cancelled) return;

        // Real-time subscription on InvestorProfile changes
        unsubscribe = base44.entities.InvestorProfile.subscribe(async (event) => {
          if (cancelled) return;
          if (event.type === "update" && event.data?.user_id === sessionUser.id) {
            if ((event.data?.access_status || "").toLowerCase().trim() === "approved") {
              setApprovalGranted({ access_status: "approved", onboarding_stage: event.data?.onboarding_stage, user: sessionUser });
            }
          }
        });
      } catch { /* silent */ }
    };

    init();

    // Fallback poll every 10s in case subscription misses an event
    const poll = setInterval(async () => {
      if (cancelled || !sessionUser) return;
      try {
        const profiles = await base44.entities.InvestorProfile.filter({ user_id: sessionUser.id });
        await checkApproval(profiles);
      } catch { /* silent */ }
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      if (unsubscribe) unsubscribe();
    };
  }, [view, approvalGranted]);

  if (view === "pending") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-5 sm:px-8 h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
          <Link to="/" className="flex items-center">
            <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
            <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-3">scale</span>
            <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-5 py-20">
          <div className="w-full max-w-lg" style={{ transition: "all 0.6s ease" }}>
            <p
              className="font-mono text-xs lowercase tracking-[0.36em] mb-4 transition-colors duration-700"
              style={{ color: approvalGranted ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
              {approvalGranted ? "access granted" : "access pending"}
            </p>
            <h1
              className="font-heading text-4xl mb-6 transition-all duration-700"
              style={{ color: "hsl(var(--foreground))" }}>
              {approvalGranted ? "welcome to scale." : "awaiting approval"}
            </h1>
            <p
              className="font-mono text-xs leading-7 mb-8 lowercase transition-all duration-700"
              style={{ color: "hsl(var(--muted-foreground))" }}>
              {approvalGranted
                ? "your access has been approved. you may now enter the platform."
                : "verification in progress. our compliance desk is securely reviewing your allocation credentials. typical review window: 1-3 hours."}
            </p>

            {!approvalGranted && (
              <div className="border border-border bg-secondary px-4 py-3 mb-6">
                <p className="font-mono text-xs text-muted-foreground mb-2">registered email:</p>
                <p className="font-mono text-sm text-foreground">{registeredEmail}</p>
              </div>
            )}

            <div className="flex flex-col gap-3" style={{ transition: "all 0.6s ease" }}>
              {approvalGranted && (
                <button
                  onClick={() => {
                    const grant = approvalGranted;
                    const dest = grant?.user
                      ? getLoginRedirect(grant.user, grant.access_status, grant.onboarding_stage)
                      : '/complete-profile';
                    window.location.href = dest || '/complete-profile';
                  }}
                  className="w-full border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors text-center"
                  style={{ animation: "fadeIn 0.7s ease" }}>
                  enter scale →
                </button>
              )}
              <button
                onClick={() => signOut('/start')}
                className="w-full border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors">
                sign out
              </button>
            </div>
          </div>
        </main>
        <footer className="border-t border-border px-5 sm:px-8 py-6 max-w-7xl mx-auto w-full mt-auto">
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="font-mono text-[9px] lowercase tracking-[0.28em] text-muted-foreground/50 mb-1">a platform by</p>
              <p className="font-heading text-lg text-foreground">north scale</p>
            </div>
            <div className="max-w-xl text-right">
              <p className="font-mono text-[10px] leading-5 text-muted-foreground/40 lowercase">
                past performance is not indicative of future results. the quantitative strategies detailed herein are intended solely for institutional and qualified investors. access to these materials may be restricted by law in certain jurisdictions.
              </p>
            </div>
          </div>
        </footer>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>);
  }

  if (view === "2fa") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-5 sm:px-8 h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
          <Link to="/" className="flex items-center">
            <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
            <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-3">scale</span>
            <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-5 py-20">
          <div className="w-full max-w-lg">
            <button onClick={() => setView("login")} className="font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground hover:text-foreground transition-colors mb-8">
              ← back
            </button>
            <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-4">TWO-FACTOR AUTHENTIFICATION</p>
            <h2 className="font-heading text-3xl text-foreground mb-3">verification code</h2>
            <p className="font-mono text-xs leading-7 text-muted-foreground mb-10 lowercase">
              A 6-digit code has been sent to your email. check your inbox and spam folder.
            </p>
            <form onSubmit={handleVerify2FA} className="space-y-5">
              <div>
                <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors tracking-[0.5em] text-center"
                  placeholder="000000" />
                
              </div>
              {error && <p className="font-mono text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50">
                
                {loading ? "verifying..." : "verify"}
              </button>
            </form>
          </div>
        </main>
        <footer className="border-t border-border px-5 sm:px-8 py-6 max-w-7xl mx-auto w-full mt-auto">
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="font-mono text-[9px] lowercase tracking-[0.28em] text-muted-foreground/50 mb-1">a platform by</p>
              <p className="font-heading text-lg text-foreground">north scale</p>
            </div>
            <div className="max-w-xl text-right">
              <p className="font-mono text-[10px] leading-5 text-muted-foreground/40 lowercase">
                past performance is not indicative of future results. the quantitative strategies detailed herein are intended solely for institutional and qualified investors. access to these materials may be restricted by law in certain jurisdictions.
              </p>
            </div>
          </div>
        </footer>
      </div>);

  }

  if (view === "otp") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-5 sm:px-8 h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
          <Link to="/" className="flex items-center">
            <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
            <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-3">scale</span>
            <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-5 py-20">
          <div className="w-full max-w-lg">
            <button onClick={() => setView("landing")} className="font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground hover:text-foreground transition-colors mb-8">
              ← back
            </button>
            <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-4">VERIFY EMAIL</p>
            <h2 className="font-heading text-3xl text-foreground mb-3">verification code</h2>
            <p className="font-mono text-xs leading-7 text-muted-foreground mb-10 lowercase">
              a 6-digit code has been sent to {registeredEmail}. check your inbox and spam folder.
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(val);
                    if (val.length === 6 && !loading) {
                      setTimeout(() => e.target.form?.requestSubmit(), 0);
                    }
                  }}
                  className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors tracking-[0.5em] text-center"
                  placeholder="000000" />
                
              </div>
              {error && <p className="font-mono text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50">
                
                {loading ? "verifying..." : "verify"}
              </button>
            </form>
            <div className="mt-6 text-center">
              <button onClick={handleResendOtp} className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors">
                resend code
              </button>
            </div>
          </div>
        </main>
        <footer className="border-t border-border px-5 sm:px-8 py-6 max-w-7xl mx-auto w-full mt-auto">
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="font-mono text-[9px] lowercase tracking-[0.28em] text-muted-foreground/50 mb-1">a platform by</p>
              <p className="font-heading text-lg text-foreground">north scale</p>
            </div>
            <div className="max-w-xl text-right">
              <p className="font-mono text-[10px] leading-5 text-muted-foreground/40 lowercase">
                past performance is not indicative of future results. the quantitative strategies detailed herein are intended solely for institutional and qualified investors. access to these materials may be restricted by law in certain jurisdictions.
              </p>
            </div>
          </div>
        </footer>
      </div>);

  }

  if (view === "login") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-5 sm:px-8 h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
          <Link to="/" className="flex items-center">
            <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
            <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-3">scale</span>
            <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
          </Link>
          <Link to="/contact" className="font-mono text-xs lowercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors">
            support
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-5 py-20">
          <div className="w-full max-w-lg">
            <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-6">login</p>
            <h2 className="font-heading text-5xl text-foreground mb-10">scale</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">email</label>
                <input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                  placeholder="your@email.com" />
                
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground">password</label>
                  <Link to="/forgot-password" className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors">
                    forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                  placeholder="••••••••" />
                
              </div>
              {error && <p className="font-mono text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50">
                
                {loading ? "signing in..." : "sign in"}
              </button>
            </form>
            <div className="mt-8">
              <button onClick={() => setView("landing")} className="font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground hover:text-foreground transition-colors">
                ← back
              </button>
            </div>
          </div>
        </main>
        <footer className="border-t border-border px-5 sm:px-8 py-6 max-w-7xl mx-auto w-full mt-auto">
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="font-mono text-[9px] lowercase tracking-[0.28em] text-muted-foreground/50 mb-1">a platform by</p>
              <p className="font-heading text-lg text-foreground">north scale</p>
            </div>
            <div className="max-w-xl text-right">
              <p className="font-mono text-[10px] leading-5 text-muted-foreground/40 lowercase">
                past performance is not indicative of future results. the quantitative strategies detailed herein are intended solely for institutional and qualified investors. access to these materials may be restricted by law in certain jurisdictions.
              </p>
            </div>
          </div>
        </footer>
      </div>);

  }

  if (view === "request") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-5 sm:px-8 h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
          <Link to="/" className="flex items-center">
            <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
            <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-3">scale</span>
            <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
          </Link>
          <Link to="/contact" className="font-mono text-xs lowercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors">
            support
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-5 py-20">
          <div className="w-full max-w-lg">
            <button onClick={() => setView("landing")} className="font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground hover:text-foreground transition-colors mb-8">
              ← back
            </button>
            <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-4">request access</p>
            <h2 className="font-heading text-3xl text-foreground mb-3">investor application</h2>
            <p className="font-mono text-xs leading-7 text-muted-foreground mb-10 lowercase">
              Complete the form to request access.
            </p>
            <form onSubmit={handleRequestAccess} className="space-y-5">
              <div>
                <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">full name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className={`w-full border ${fieldErrors.full_name ? "border-red-400" : "border-border"} bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors`}
                  placeholder="john doe" />
                
                {fieldErrors.full_name && <p className="font-mono text-[10px] text-red-400 mt-1">{fieldErrors.full_name}</p>}
              </div>
              <div>
                <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">email <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full border ${fieldErrors.email ? "border-red-400" : "border-border"} bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors`}
                  placeholder="your@email.com" />
                
                {fieldErrors.email && <p className="font-mono text-[10px] text-red-400 mt-1">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">password <span className="text-red-400">*</span></label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full border ${fieldErrors.password ? "border-red-400" : "border-border"} bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors`}
                  placeholder="••••••••" />
                
                {fieldErrors.password && <p className="font-mono text-[10px] text-red-400 mt-1">{fieldErrors.password}</p>}
              </div>
              <div>
                <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">confirm password <span className="text-red-400">*</span></label>
                <input
                  type="password"
                  required
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className={`w-full border ${fieldErrors.confirm_password ? "border-red-400" : "border-border"} bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors`}
                  placeholder="••••••••" />
                
                {fieldErrors.confirm_password && <p className="font-mono text-[10px] text-red-400 mt-1">{fieldErrors.confirm_password}</p>}
              </div>
              <div>
                <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">organization</label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                  placeholder="company (optional)" />
                
              </div>
              <div>
                <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">referred by <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.referred_by}
                  onChange={(e) => setFormData({ ...formData, referred_by: e.target.value })}
                  className={`w-full border ${fieldErrors.referred_by ? "border-red-400" : "border-border"} bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors`}
                  placeholder="referrer" />
                
                {fieldErrors.referred_by && <p className="font-mono text-[10px] text-red-400 mt-1">{fieldErrors.referred_by}</p>}
              </div>
              <div>
                <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">initial investment <span className="text-red-400">*</span></label>
                <select
                  required
                  value={formData.monthly_investment}
                  onChange={(e) => setFormData({ ...formData, monthly_investment: e.target.value })}
                  className={`w-full border ${fieldErrors.monthly_investment ? "border-red-400" : "border-border"} bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors`}>
                  
                  <option value="">Select</option>
                  <option value="25k_50k">$25,000 - $50,000</option>
                  <option value="50k_100k">$50,000 - $100,000</option>
                  <option value="100k_250k">$100,000 - $250,000</option>
                  <option value="250k_500k">$250,000 - $500,000</option>
                  <option value="500k_plus">$500,000+</option>
                </select>
                {fieldErrors.monthly_investment && <p className="font-mono text-[10px] text-red-400 mt-1">{fieldErrors.monthly_investment}</p>}
              </div>
              {error && <p className="font-mono text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50">
                
                {loading ? "submitting..." : "request access"}
              </button>
            </form>
          </div>
        </main>
        <footer className="border-t border-border px-5 sm:px-8 py-6 max-w-7xl mx-auto w-full mt-auto">
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="font-mono text-[9px] lowercase tracking-[0.28em] text-muted-foreground/50 mb-1">a platform by</p>
              <p className="font-heading text-lg text-foreground">north scale</p>
            </div>
            <div className="max-w-xl text-right">
              <p className="font-mono text-[10px] leading-5 text-muted-foreground/40 lowercase">
                past performance is not indicative of future results.
              </p>
            </div>
          </div>
        </footer>
      </div>);

  }

  // Landing view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-5 sm:px-8 h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center">
          <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
          <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-3">scale</span>
          <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
        </Link>
        <Link to="/contact" className="font-mono text-xs lowercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors">
          support
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-5">private access</p>
          <h1 className="font-heading text-[64px] sm:text-[72px] leading-[1] text-foreground mb-6">scale</h1>
          <p className="font-mono text-xs leading-7 text-muted-foreground mb-10">
            The proprietary platform for qualified north scale allocators.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setView("login")} className="flex-1 border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors">
              login
            </button>
            <button onClick={() => setView("request")} className="flex-1 border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors">
              request access
            </button>
          </div>
        </div>
      </main>
      <footer className="border-t border-border px-5 sm:px-8 py-6 max-w-7xl mx-auto w-full mt-auto">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="font-mono text-[9px] lowercase tracking-[0.28em] text-muted-foreground/50 mb-1">a platform by</p>
            <p className="font-heading text-lg text-foreground">north scale</p>
          </div>
          <div className="max-w-xl text-right">
            <p className="font-mono text-[10px] leading-5 text-muted-foreground/40 lowercase">
              past performance is not indicative of future results.
            </p>
          </div>
        </div>
      </footer>
    </div>);

}