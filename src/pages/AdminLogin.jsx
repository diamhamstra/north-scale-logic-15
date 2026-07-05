import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { AUTH_2FA_PENDING_KEY, setLoginSurface, storeCustomAuthSession } from "@/lib/authSync";
import { prepareForNewSession } from "@/lib/customAuth";

const Logo = () => (
  <Link to="/" className="flex items-center">
    <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
    <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-3">north</span>
    <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
  </Link>
);

const Footer = () => (
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
);

export default function AdminLogin() {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await base44.functions.invoke("customLogin", {
        email: email.toLowerCase().trim(),
        password,
      });
      const data = result.data;

      if (data?.requires_2fa) {
        sessionStorage.setItem(AUTH_2FA_PENDING_KEY, JSON.stringify({
          challenge_token: data.challenge_token,
          email: data.email,
        }));
        setView("2fa");
        setLoading(false);
        return;
      }

      if (data?.token) {
        if (!data.user || data.user.role !== "admin") {
          setError("Access denied. This portal is restricted to authorised administrators.");
          setLoading(false);
          return;
        }
        await prepareForNewSession();
        setLoginSurface("admin");
        storeCustomAuthSession(data.token, data.user);
        window.location.href = "/admin-portal";
        return;
      }

      setError(data?.error || "Invalid credentials. Please try again.");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
    setLoading(false);
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const pending = sessionStorage.getItem(AUTH_2FA_PENDING_KEY);
      if (!pending) {
        setError("2FA session expired. Please login again.");
        setView("login");
        setLoading(false);
        return;
      }
      const { challenge_token } = JSON.parse(pending);
      const result = await base44.functions.invoke("verify2FA", {
        challenge_token,
        code: otpCode,
      });
      const data = result.data;

      if (data?.success && data?.token) {
        if (!data.user || data.user.role !== "admin") {
          setError("Access denied. Admins only.");
          setLoading(false);
          return;
        }
        await prepareForNewSession();
        setLoginSurface("admin");
        storeCustomAuthSession(data.token, data.user);
        sessionStorage.removeItem(AUTH_2FA_PENDING_KEY);
        window.location.href = "/admin-portal";
        return;
      }

      setError(data?.error || "Invalid verification code.");
    } catch (err) {
      setError("Invalid verification code.");
    }
    setLoading(false);
  };

  if (view === "2fa") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-5 sm:px-8 h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
          <Logo />

        </header>
        <main className="flex-1 flex items-center justify-center px-5 py-20">
          <div className="w-full max-w-lg">
            <button
              onClick={() => { setView("login"); setError(""); setOtpCode(""); }}
              className="font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
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
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors tracking-[0.5em] text-center"
                  placeholder="000000"
                />
              </div>
              {error && <p className="font-mono text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
              >
                {loading ? "verifying..." : "verify"}
              </button>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-5 sm:px-8 h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Logo />
        <Link to="/contact" className="font-mono text-xs lowercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors">
          support
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-5 py-20">
        <div className="w-full max-w-lg">
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-6">administration</p>
          <h2 className="font-heading text-5xl text-foreground mb-10">admin portal</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                placeholder="admin@northscale.capital"
              />
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="font-mono text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
            >
              {loading ? "signing in..." : "sign in"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}