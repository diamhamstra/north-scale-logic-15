import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import NotificationBell from "@/components/portal/NotificationBell";

// Legacy PortalHeader — used by EngineSetup, CompleteProfile, etc.
// Main portal navigation is now handled by Portal.jsx directly.

export default function PortalHeader({ user, adminBadge }) {
  const handleLogout = () => base44.auth.logout("/start");

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="mx-auto max-w-7xl w-full px-5 sm:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-heading text-xl tracking-[0.22em] text-foreground">
            north scale_
          </Link>
          <span className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground/50">
            / Scale
          </span>
          {adminBadge && (
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-yellow-400/80 border border-yellow-400/20 px-2 py-0.5">
              Admin
            </span>
          )}
        </div>
        <div className="flex items-center gap-6">
          <NotificationBell userId={user?.id} />
          <span className="hidden sm:block font-mono text-[10px] text-muted-foreground">{user?.full_name?.split(" ")[0]}</span>
          <button
            onClick={handleLogout}
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}