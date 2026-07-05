import React from "react";
import { Link } from "react-router-dom";

import { openNewsletterModal } from "../../lib/newsletter";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Top row */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-heading text-2xl tracking-[0.14em] text-foreground">
              north scale
            </p>
            <p className="mt-3 max-w-xs font-mono text-xs leading-7 text-muted-foreground/80">
              Systematic investment strategies across global liquid markets.
            </p>

          </div>
          <div className="lg:col-span-2 lg:col-start-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground/50 mb-5 border-b border-border pb-2.5">
              site
            </p>
            <ul className="space-y-0 font-mono text-xs">
              <li className="border-b border-border/40">
                <Link to="/" className="block py-1.5 text-muted-foreground tracking-[0.14em] transition-colors duration-200 hover:text-foreground">
                  home
                </Link>
              </li>
              <li className="border-b border-border/40">
                <Link to="/start" className="block py-1.5 text-muted-foreground tracking-[0.14em] transition-colors duration-200 hover:text-foreground">
                  client login
                </Link>
              </li>
              <li className="border-b border-border/40">
                <Link to="/contact" className="block py-1.5 text-muted-foreground tracking-[0.14em] transition-colors duration-200 hover:text-foreground">
                  contact
                </Link>
              </li>
              <li className="border-b border-border/40">
                <button
                  type="button"
                  onClick={openNewsletterModal}
                  className="block w-full py-1.5 text-left text-muted-foreground tracking-[0.14em] transition-colors duration-200 hover:text-foreground"
                >
                  newsletter
                </button>
              </li>
              <li>
                <Link to="/careers" className="block py-1.5 text-muted-foreground tracking-[0.14em] transition-colors duration-200 hover:text-foreground">
                  careers
                </Link>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-2 lg:col-start-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground/50 mb-5 border-b border-border pb-2.5">
              legal
            </p>
            <ul className="space-y-0 font-mono text-xs">
              <li className="border-b border-border/40">
                <Link to="/privacy-policy" className="block py-1.5 text-muted-foreground tracking-[0.14em] transition-colors duration-200 hover:text-foreground">
                  privacy policy
                </Link>
              </li>
              <li className="border-b border-border/40">
                <Link to="/terms-of-use" className="block py-1.5 text-muted-foreground tracking-[0.14em] transition-colors duration-200 hover:text-foreground">
                  terms of use
                </Link>
              </li>
              <li className="border-b border-border/40">
                <Link to="/disclaimer" className="block py-1.5 text-muted-foreground tracking-[0.14em] transition-colors duration-200 hover:text-foreground">
                  disclaimer
                </Link>
              </li>
              <li className="border-b border-border/40">
                <Link to="/gdpr-notice" className="block py-1.5 text-muted-foreground tracking-[0.14em] transition-colors duration-200 hover:text-foreground">
                  gdpr notice
                </Link>
              </li>
              <li>
                <Link to="/unsubscribe" className="block py-1.5 text-muted-foreground tracking-[0.14em] transition-colors duration-200 hover:text-foreground">
                  unsubscribe
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-border py-6">
          <p className="font-mono text-[10px] leading-6 text-muted-foreground/70 max-w-3xl">
            This website is for informational purposes only and does not constitute an offer or solicitation to invest. Past performance is not indicative of future results. Quantitative strategies detailed herein are intended solely for qualified institutional investors and allocators. Investments involve significant risk, including the possible loss of principal. Access to these materials may be restricted by law in certain jurisdictions.
          </p>
          <p className="mt-3 font-mono text-[10px] text-muted-foreground/60">
            © {new Date().getFullYear()} north scale. all rights reserved.
          </p>

        </div>
      </div>
    </footer>
  );
}