import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const NOTICE = "These controls are internal governance and security controls. Framework mapping is for internal tracking only and does not constitute ISO 27001 certification, SOC 2 Type II attestation, PCI DSS certification, DORA compliance, NIS2 compliance, audit approval, or regulatory endorsement.";

const FRAMEWORKS = ["ISO27001", "SOC2_TYPE_II", "PCI_DSS", "DORA", "NIS2"];
const CATEGORIES = [
  "AUTHENTICATION",
  "ACCESS_CONTROL",
  "DATA_PROTECTION",
  "AUDIT_AND_ACCOUNTABILITY",
  "APPLICATION_SECURITY",
  "OPERATIONAL_RESILIENCE",
  "THIRD_PARTY_VENDOR_RISK",
];
const STATUSES = ["planned", "implemented", "needs_review", "verified"];

const statusBadge = (status) => {
  const map = {
    planned: "border border-border text-muted-foreground",
    implemented: "border border-green-400/30 text-green-400",
    needs_review: "border border-yellow-400/30 text-yellow-400",
    verified: "border border-blue-400/30 text-blue-400",
  };
  const labels = {
    planned: "Planned",
    implemented: "Implemented",
    needs_review: "Needs Review",
    verified: "Verified",
  };
  return (
    <span className={`inline-block font-mono text-[9px] uppercase tracking-[0.18em] px-2 py-0.5 ${map[status] || map.planned}`}>
      {labels[status] || status}
    </span>
  );
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—");

export default function AdminCompliance() {
  const [user, setUser] = useState(null);
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Filters
  const [filterFramework, setFilterFramework] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [search, setSearch] = useState("");

  // Detail panel
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me || me.role !== "admin") {
          window.location.href = "/admin-login";
          return;
        }
        setUser(me);
        setAuthChecked(true);
      } catch {
        window.location.href = "/admin-login";
      }
    })();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    (async () => {
      setLoading(true);
      const list = await base44.entities.ComplianceControls.list("category", 200);
      setControls(list);
      setLoading(false);
    })();
  }, [authChecked]);

  // Derive unique owners
  const owners = [...new Set(controls.map((c) => c.owner).filter(Boolean))].sort();

  const filtered = controls.filter((c) => {
    if (filterFramework && (!c.mapped_frameworks || !c.mapped_frameworks.includes(filterFramework))) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterCategory && c.category !== filterCategory) return false;
    if (filterOwner && c.owner !== filterOwner) return false;
    if (search && !c.title?.toLowerCase().includes(search.toLowerCase()) && !c.control_key?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Counts
  const counts = {
    total: controls.length,
    implemented: controls.filter((c) => c.status === "implemented").length,
    needs_review: controls.filter((c) => c.status === "needs_review").length,
    verified: controls.filter((c) => c.status === "verified").length,
    planned: controls.filter((c) => c.status === "planned").length,
    evidenceMissing: controls.filter((c) => c.evidence_required && !c.evidence_url && !c.evidence_note).length,
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl w-full px-5 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-heading text-xl tracking-[0.22em] text-foreground">
              north scale_
            </Link>
            <span className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground/50">
              / Admin / Compliance
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-yellow-400/80 border border-yellow-400/20 px-2 py-0.5">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/admin-portal" className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <button
              onClick={() => base44.auth.logout("/admin-login")}
              className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl w-full px-5 sm:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          <Link to="/admin-portal" className="hover:text-foreground transition-colors">Admin</Link>
          <span>/</span>
          <span className="text-foreground">Compliance Controls</span>
        </div>

        {/* Page title */}
        <div className="mb-2">
          <p className="font-mono text-xs uppercase tracking-[0.36em] text-muted-foreground mb-3">
            Security &amp; Compliance
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl text-foreground">Control Alignment</h1>
        </div>

        {/* Permanent notice */}
        <div className="mt-6 mb-10 border border-yellow-400/20 bg-yellow-400/5 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-yellow-400/70 mb-2">Important</p>
          <p className="font-mono text-[10px] leading-6 text-muted-foreground">{NOTICE}</p>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {[
            { label: "Total Controls", value: counts.total },
            { label: "Implemented", value: counts.implemented, color: "text-green-400" },
            { label: "Needs Review", value: counts.needs_review, color: "text-yellow-400" },
            { label: "Verified", value: counts.verified, color: "text-blue-400" },
            { label: "Planned", value: counts.planned, color: "text-muted-foreground" },
            { label: "Evidence Missing", value: counts.evidenceMissing, color: "text-red-400" },
          ].map((card) => (
            <div key={card.label} className="border border-border p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">{card.label}</p>
              <p className={`font-mono text-xl ${card.color || "text-foreground"}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground focus:outline-none focus:border-foreground"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground focus:outline-none focus:border-foreground"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <select
            value={filterFramework}
            onChange={(e) => setFilterFramework(e.target.value)}
            className="border border-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground focus:outline-none focus:border-foreground"
          >
            <option value="">All Frameworks</option>
            {FRAMEWORKS.map((f) => (
              <option key={f} value={f}>{f.replace(/_/g, " ")}</option>
            ))}
          </select>
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="border border-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground focus:outline-none focus:border-foreground"
          >
            <option value="">All Owners</option>
            {owners.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-border bg-background px-3 py-2 font-mono text-[10px] text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground"
          />
        </div>

        {/* Controls table */}
        <div className="border border-border overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse font-mono text-xs" aria-label="Compliance controls">
            <thead>
              <tr className="bg-secondary text-left uppercase tracking-[0.16em] text-muted-foreground">
                <th className="border-b border-r border-border p-4 font-normal w-12">#</th>
                <th className="border-b border-r border-border p-4 font-normal">Control</th>
                <th className="border-b border-r border-border p-4 font-normal">Category</th>
                <th className="border-b border-r border-border p-4 font-normal">Status</th>
                <th className="border-b border-r border-border p-4 font-normal">Frameworks</th>
                <th className="border-b border-r border-border p-4 font-normal">Owner</th>
                <th className="border-b border-r border-border p-4 font-normal">Last Reviewed</th>
                <th className="border-b border-border p-4 font-normal">Next Review</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">No controls match the current filters.</td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(selected?.id === c.id ? null : c)}
                    className={`transition-colors hover:bg-secondary/40 cursor-pointer ${selected?.id === c.id ? "bg-secondary/60" : ""}`}
                  >
                    <td className="border-b border-r border-border p-4 text-muted-foreground">{i + 1}</td>
                    <td className="border-b border-r border-border p-4">
                      <p className="text-foreground">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">{c.control_key}</p>
                    </td>
                    <td className="border-b border-r border-border p-4">
                      <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {c.category?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="border-b border-r border-border p-4">{statusBadge(c.status)}</td>
                    <td className="border-b border-r border-border p-4">
                      <div className="flex flex-wrap gap-1">
                        {c.mapped_frameworks?.map((f) => (
                          <span key={f} className="font-mono text-[8px] uppercase tracking-[0.12em] px-1.5 py-0.5 border border-border text-muted-foreground/70">
                            {f.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="border-b border-r border-border p-4 text-muted-foreground">{c.owner || "—"}</td>
                    <td className="border-b border-r border-border p-4 text-muted-foreground">{formatDate(c.last_reviewed_at)}</td>
                    <td className="border-b border-border p-4 text-muted-foreground">{formatDate(c.next_review_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-2 font-mono text-[10px] text-muted-foreground/50">
          Showing {filtered.length} of {controls.length} controls
        </p>

        {/* Detail drawer */}
        {selected && (
          <div className="mt-6 border border-border p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-1">{selected.control_key}</p>
                <h3 className="font-heading text-2xl text-foreground">{selected.title}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Close ✕
              </button>
            </div>

            {selected.description && (
              <p className="font-mono text-xs leading-6 text-muted-foreground mb-6">{selected.description}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="border border-border p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Status</p>
                {statusBadge(selected.status)}
              </div>
              <div className="border border-border p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Category</p>
                <p className="font-mono text-xs text-foreground">{selected.category?.replace(/_/g, " ")}</p>
              </div>
              <div className="border border-border p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Owner</p>
                <p className="font-mono text-xs text-foreground">{selected.owner || "—"}</p>
              </div>
              <div className="border border-border p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Evidence Required</p>
                <p className={`font-mono text-xs ${selected.evidence_required ? "text-yellow-400" : "text-muted-foreground"}`}>
                  {selected.evidence_required ? "Yes" : "No"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="border border-border p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Last Reviewed</p>
                <p className="font-mono text-xs text-foreground">{formatDate(selected.last_reviewed_at)}</p>
              </div>
              <div className="border border-border p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Next Review</p>
                <p className="font-mono text-xs text-foreground">{formatDate(selected.next_review_at)}</p>
              </div>
            </div>

            {selected.mapped_frameworks?.length > 0 && (
              <div className="mb-6">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Control Alignment</p>
                <div className="flex flex-wrap gap-2">
                  {selected.mapped_frameworks.map((f) => (
                    <span key={f} className="font-mono text-[10px] uppercase tracking-[0.16em] px-3 py-1.5 border border-border text-muted-foreground">
                      {f.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(selected.evidence_url || selected.evidence_note) && (
              <div className="border border-border p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Evidence</p>
                {selected.evidence_note && (
                  <p className="font-mono text-xs leading-6 text-muted-foreground mb-2">{selected.evidence_note}</p>
                )}
                {selected.evidence_url && (
                  <a href={selected.evidence_url} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-blue-400 hover:underline">
                    View Evidence →
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom notice */}
        <div className="mt-12 border-t border-border pt-6">
          <p className="font-mono text-[10px] leading-6 text-muted-foreground/40">{NOTICE}</p>
        </div>
      </main>
    </div>
  );
}