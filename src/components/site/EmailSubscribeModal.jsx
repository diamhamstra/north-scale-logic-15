import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { NEWSLETTER_OPEN_EVENT } from "@/lib/newsletter";

const DISMISSED_KEY = "ns_newsletter_dismissed";
const SUBSCRIBED_KEY = "ns_newsletter_subscribed";
const SHOW_DELAY_MS = 4000;

const EXCLUDED_PREFIXES = [
  "/portal",
  "/admin-portal",
  "/admin/",
  "/start",
  "/forgot-password",
  "/reset-password",
  "/complete-profile",
  "/account-settings",
  "/admin-login",
  "/operations",
  "/unsubscribe",
];

function isPublicPage(pathname) {
  return !EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

export default function EmailSubscribeModal() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleOpen = () => {
      if (!isPublicPage(pathname)) return;
      if (localStorage.getItem(SUBSCRIBED_KEY)) {
        setSubmitted(true);
      }
      setVisible(true);
    };

    window.addEventListener(NEWSLETTER_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(NEWSLETTER_OPEN_EVENT, handleOpen);
  }, [pathname]);

  useEffect(() => {
    if (!isPublicPage(pathname)) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    const subscribed = localStorage.getItem(SUBSCRIBED_KEY);
    if (dismissed || subscribed) return;

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.functions.invoke("subscribeNewsletter", {
        email: email.trim().toLowerCase(),
        source: "website_modal",
      });
      localStorage.setItem(SUBSCRIBED_KEY, "true");
      setSubmitted(true);
      setTimeout(() => setVisible(false), 2500);
    } catch {
      setError("Unable to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible || !isPublicPage(pathname)) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div
        className="absolute inset-0 bg-background/55"
        onClick={dismiss}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="newsletter-title"
        className="relative w-full max-w-[480px] border border-border/50 bg-card/90 backdrop-blur-xl shadow-[0_12px_48px_rgba(0,0,0,0.5)]"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4 p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>

        <div className="px-10 pt-10 pb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground/50 mb-4">
            newsletter
          </p>
          <h2
            id="newsletter-title"
            className="font-heading text-[3rem] leading-[0.90] tracking-[-0.02em] text-foreground pr-8 mb-5"
          >
            north reports
          </h2>

          {submitted ? (
            <p className="mt-6 font-mono text-xs leading-7 text-muted-foreground">
              you're in. check your inbox to confirm your subscription.
            </p>
          ) : (
            <>
              <p className="font-mono text-xs leading-7 text-muted-foreground mb-7">
                weekly north scale developments and market analysis — delivered to your inbox.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-border/70 bg-background/60 px-4 py-4 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/50 transition-colors"
                  placeholder="enter your email"
                />

                {error && (
                  <p className="font-mono text-[10px] text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full border border-foreground bg-foreground text-background font-mono text-xs lowercase px-6 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {loading ? "subscribing…" : "sign up"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}