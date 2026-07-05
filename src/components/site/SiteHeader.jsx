import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `font-mono text-xs lowercase tracking-[0.28em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
      isActive ? "text-foreground" : "text-muted-foreground/80 hover:text-foreground"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          to="/"
          className="flex items-center gap-1 font-mono text-[18px] font-normal text-[#888888] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary -ml-2.5"
          aria-label="north scale home"
        >
          <span>/</span>
          <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-2">north scale</span>
          <span>/</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-6 sm:gap-8 -mr-2.5" aria-label="Main navigation">
          <NavLink to="/" className={navLinkClass}>
            HOME
          </NavLink>
          <NavLink to="/careers" className={navLinkClass}>
            CAREERS
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            CONTACT
          </NavLink>
          <Link
            to="/start?view=login"
            className="font-mono text-[10px] lowercase tracking-[0.24em] font-medium bg-foreground text-background border border-foreground px-5 py-2.5 hover:bg-transparent hover:text-foreground transition-colors duration-200"
          >
            client portal
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="sm:hidden p-2 text-foreground hover:bg-secondary/50 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <nav className="mx-auto max-w-7xl px-5 sm:px-8 py-6 flex flex-col gap-4" aria-label="Mobile navigation">
            <NavLink
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="font-mono text-xs lowercase tracking-[0.28em] py-2 text-muted-foreground/80 hover:text-foreground transition-colors"
            >
              home
            </NavLink>
            <NavLink
              to="/careers"
              onClick={() => setMobileMenuOpen(false)}
              className="font-mono text-xs lowercase tracking-[0.28em] py-2 text-muted-foreground/80 hover:text-foreground transition-colors"
            >
              careers
            </NavLink>
            <NavLink
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="font-mono text-xs lowercase tracking-[0.28em] py-2 text-muted-foreground/80 hover:text-foreground transition-colors"
            >
              contact
            </NavLink>
            <Link
              to="/start?view=login"
              onClick={() => setMobileMenuOpen(false)}
              className="font-mono text-[10px] lowercase tracking-[0.24em] font-medium bg-foreground text-background border border-foreground px-5 py-3 text-center"
            >
              client portal
            </Link>
          </nav>
        </div>
      )}


    </header>
  );
}