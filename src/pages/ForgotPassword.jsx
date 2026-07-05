import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.functions.invoke("sendPasswordReset", { email: email.trim().toLowerCase() });
    } catch {
      // Always show success — do not reveal whether the email exists
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

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
        <div className="w-full max-w-md">
          {!sent ? (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.36em] text-muted-foreground mb-4">
                account access
              </p>
              <h1 className="font-heading text-4xl text-foreground mb-3">reset password</h1>
              <p className="font-mono text-xs leading-6 text-muted-foreground mb-10 normal-case">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">
                    email address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {loading ? "sending..." : "send reset link"}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-border">
                <Link
                  to="/start?view=login"
                  className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← back to login
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="font-mono text-xs lowercase tracking-[0.36em] text-muted-foreground mb-4">
                email sent
              </p>
              <h1 className="font-heading text-4xl text-foreground mb-6">check your inbox.</h1>
              <p className="font-mono text-xs leading-7 text-muted-foreground mb-10 lowercase">
                if an account exists with that email address, you will receive a password reset link shortly. please check your spam folder if it doesn't arrive within a few minutes.
              </p>
              <Link
                to="/start?view=login"
                className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors"
              >
                ← return to login
              </Link>
            </>
          )}
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
    </div>
  );
}