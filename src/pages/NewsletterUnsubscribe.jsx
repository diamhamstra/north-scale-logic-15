import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SiteFooter from "@/components/site/SiteFooter";

export default function NewsletterUnsubscribe() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [email, setEmail] = useState(emailParam || "");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [autoProcessed, setAutoProcessed] = useState(false);

  useEffect(() => {
    if (!tokenParam || autoProcessed) return;

    setAutoProcessed(true);
    setLoading(true);
    base44.functions
      .invoke("unsubscribeNewsletter", { token: tokenParam })
      .then(() => setDone(true))
      .catch(() => setDone(true))
      .finally(() => setLoading(false));
  }, [tokenParam, autoProcessed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.functions.invoke("unsubscribeNewsletter", {
        email: email.trim().toLowerCase(),
      });
    } catch {
      // Always show success — do not reveal whether the email exists
    } finally {
      setLoading(false);
      setDone(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-5 sm:px-8 h-20 flex items-center max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center">
          <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
          <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-3">
            scale
          </span>
          <span className="font-mono text-[20px] font-light text-[#888888]">/</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-20">
        <div className="w-full max-w-md">
          {loading && tokenParam ? (
            <>
              <p className="font-mono text-xs lowercase tracking-[0.36em] text-muted-foreground mb-4">
                processing
              </p>
              <h1 className="font-heading text-4xl text-foreground mb-6">
                one moment.
              </h1>
            </>
          ) : done ? (
            <>
              <p className="font-mono text-xs lowercase tracking-[0.36em] text-muted-foreground mb-4">
                unsubscribed
              </p>
              <h1 className="font-heading text-4xl text-foreground mb-6">
                preferences updated.
              </h1>
              <p className="font-mono text-xs leading-7 text-muted-foreground mb-10 lowercase">
                you will no longer receive investor updates from north scale. this
                may take up to 48 hours to process across all systems.
              </p>
              <Link
                to="/"
                className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors"
              >
                ← return to home
              </Link>
            </>
          ) : (
            <>
              <p className="font-mono text-xs lowercase tracking-[0.36em] text-muted-foreground mb-4">
                investor updates
              </p>
              <h1 className="font-heading text-4xl text-foreground mb-3">
                unsubscribe
              </h1>
              <p className="font-mono text-xs leading-6 text-muted-foreground mb-10 lowercase">
                enter your email address to stop receiving market intelligence and
                fund updates from north scale.
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
                  {loading ? "processing..." : "unsubscribe"}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-border">
                <Link
                  to="/"
                  className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← return to home
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
