import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { clearAuthStorage } from "@/lib/customAuth";

function ScaleHeader() {
  return (
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
  );
}

function ScaleFooter() {
  return (
    <footer className="border-t border-border px-5 sm:px-8 py-6 max-w-7xl mx-auto w-full">
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
}

function extractInvokeError(err, fallback) {
  return err?.response?.data?.error || err?.data?.error || fallback;
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) clearAuthStorage();
  }, [done]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke("validateResetToken", { token, newPassword });
      if (result.data?.success) {
        setDone(true);
      } else {
        setError(result.data?.error || "invalid or expired reset link.");
      }
    } catch (err) {
      setError(extractInvokeError(err, "something went wrong. please request a new reset link."));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ScaleHeader />
        <main className="flex-1 flex items-center justify-center px-5 py-20">
          <div className="w-full max-w-md">
            <p className="font-mono text-xs lowercase tracking-[0.36em] text-muted-foreground mb-4">error</p>
            <h1 className="font-heading text-4xl text-foreground mb-6">invalid link.</h1>
            <p className="font-mono text-xs leading-7 text-muted-foreground mb-8 lowercase">
              this password reset link is missing or invalid. please request a new one.
            </p>
            <Link to="/forgot-password" className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors">
              ← request new link
            </Link>
          </div>
        </main>
        <ScaleFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ScaleHeader />

      <main className="flex-1 flex items-center justify-center px-5 py-20">
        <div className="w-full max-w-md">
          {done ? (
            <>
              <p className="font-mono text-xs lowercase tracking-[0.36em] text-muted-foreground mb-4">success</p>
              <h1 className="font-heading text-4xl text-foreground mb-6">password updated.</h1>
              <p className="font-mono text-xs leading-7 text-muted-foreground mb-8 lowercase">
                your password has been successfully reset. sign in with your new password to continue.
              </p>
              <Link to="/start?view=login" className="inline-block border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors">
                sign in →
              </Link>
            </>
          ) : (
            <>
              <p className="font-mono text-xs lowercase tracking-[0.36em] text-muted-foreground mb-4">account access</p>
              <h1 className="font-heading text-4xl text-foreground mb-3">set new password</h1>
              <p className="font-mono text-xs leading-6 text-muted-foreground mb-10 lowercase">
                enter a new password for your scale account.
              </p>

              {error && (
                <div className="border border-red-400/30 bg-red-400/10 px-4 py-3 mb-6">
                  <p className="font-mono text-xs text-red-400 lowercase">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">new password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                    placeholder="minimum 8 characters"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground mb-2">confirm password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                    placeholder="repeat new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {loading ? "updating..." : "update password"}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-border">
                <Link to="/forgot-password" className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors">
                  ← request new link
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <ScaleFooter />
    </div>
  );
}