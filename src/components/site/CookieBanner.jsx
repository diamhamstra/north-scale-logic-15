import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const COOKIE_KEY = "ns_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs leading-6 text-muted-foreground max-w-2xl lowercase">
          we use cookies to improve website functionality and analyze traffic. see our{" "}
          <Link to="/privacy-policy" className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors">
            privacy policy
          </Link>
          {" "}and{" "}
          <Link to="/cookie-policy" className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors">
            cookie policy
          </Link>
          . non-essential cookies are placed only with your consent.
        </p>
        <div className="flex gap-0 border border-border font-mono text-xs lowercase tracking-[0.2em] flex-shrink-0">
          <button
            onClick={decline}
            className="px-5 py-3 text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
          >
            decline
          </button>
          <button
            onClick={accept}
            className="border-l border-border px-5 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
          >
            accept
          </button>
        </div>
      </div>
    </div>
  );
}