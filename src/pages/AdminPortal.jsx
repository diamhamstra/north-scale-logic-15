import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { invokeFunction } from "@/lib/invokeFunction";
import { clearCustomAuthStorage, getStoredAuthToken, AUTH_2FA_PENDING_KEY } from "@/lib/authSync";
import { clearNativeAuthSession } from "@/lib/customAuth";
import { engines } from "@/lib/engineConfig";
import InvestorDrawer from "@/components/admin/InvestorDrawer";
import MissionControl from "@/components/admin/MissionControl";
import SendNotification from "@/components/admin/SendNotification";
import CMDashboard from "@/components/crm/CMDashboard";
import CMClients from "@/components/crm/CMClients";
import CMLeads from "@/components/crm/CMLeads";
import CMReferrals from "@/components/crm/CMReferrals";
import CMPartners from "@/components/crm/CMPartners";
import OpsHome from "@/components/ops/OpsHome";
import OpsApprovals from "@/components/ops/OpsApprovals";
import OpsTasks from "@/components/ops/OpsTasks";
import OpsAnalytics from "@/components/ops/OpsAnalytics";
import OpsTeam from "@/components/ops/OpsTeam";
import SupportPanel from "@/components/admin/SupportPanel";
import ApplicationsDashboard from "@/components/admin/ApplicationsDashboard";
import NotificationBell from "@/components/portal/NotificationBell";

// ── helpers ───────────────────────────────────────────────────────────────────
const DOCUMENT_AUDIT_ACTIONS = new Set([
  "DOCUMENT_VIEWED", "DOCUMENT_DOWNLOADED", "PASSPORT_UPLOADED", "PASSPORT_APPROVED", "AGREEMENT_SIGNED",
]);
const PRIVACY_AUDIT_ACTIONS = new Set(["GDPR_REQUEST_SUBMITTED"]);
const statusColor = (s) => ({ pending: "text-yellow-400", approved: "text-green-400", rejected: "text-red-400" }[s] || "text-muted-foreground");
const statusLabel = (s) => ({ pending: "Pending", approved: "Approved", rejected: "Rejected" }[s] || "—");
const INQUIRY_LABELS = { prospective_investor: "Prospective Investor", family_office: "Family Office", institutional_investor: "Institutional Investor", investment_consultant: "Investment Consultant", quant_trader: "Quant Trader", portfolio_manager: "Portfolio Manager", broker_partnership: "Broker / Exchange", technology_partnership: "Technology Partnership", liquidity_provider: "Liquidity Provider", media: "Media", general: "General", other: "Other" };
const PRIORITY_COLORS = { high_priority_investor: "text-green-400", institutional: "text-blue-400", family_office: "text-purple-400", trader_candidate: "text-yellow-400", broker_partner: "text-orange-400", technology_partner: "text-cyan-400", general: "text-muted-foreground" };
const PRIORITY_LABELS = { high_priority_investor: "High Priority", institutional: "Institutional", family_office: "Family Office", trader_candidate: "Trader Candidate", broker_partner: "Broker Partner", technology_partner: "Tech Partner", general: "General" };

// ── shared nav component ──────────────────────────────────────────────────────
function LocalNav({ items, active, onChange }) {
  return (
    <div className="flex gap-0 border-b border-border mb-8 overflow-x-auto">
      {items.map(item => (
        <button key={item.key} onClick={() => onChange(item.key)}
          className={`px-5 py-3 font-mono text-[10px] lowercase tracking-[0.22em] whitespace-nowrap border-b-2 -mb-px transition-colors ${active === item.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          {item.label.toLowerCase()}
        </button>
      ))}
    </div>
  );
}

function WorkspaceHeader({ eyebrow, title }) {
  return (
    <div className="mb-8 border-b border-border pb-6">
      <p className="font-mono text-[10px] lowercase tracking-[0.36em] text-muted-foreground mb-2">{eyebrow.toLowerCase()}</p>
      <h1 className="font-heading text-4xl text-foreground lowercase">{title.toLowerCase()}</h1>
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────────────────
export default function AdminPortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const module = searchParams.get("m") || "dashboard";
  const sub = searchParams.get("s") || "";
  const setModule = (m, s = "") => setSearchParams(s ? { m, s } : { m });
  const setSub = (s) => setSearchParams({ m: module, s });

  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [crmRecords, setCrmRecords] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [partners, setPartners] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [auditFilter, setAuditFilter] = useState("all");

  // Client drawer + inquiry drawer
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const result = await invokeFunction('getAdminData', {});
      const data = result.data;
      if (data?.error || !Array.isArray(data?.profiles)) {
        throw new Error(data?.error || 'Failed to load admin data');
      }
      setLoadError("");
      setProfiles(data.profiles || []);
      setCrmRecords(data.crmRecords || []);
      setInquiries(data.inquiries || []);
      setPartners(data.partners || []);
      setAuditLogs(data.auditLogs || []);
      setNotifications(data.notifications || []);
      setTasks(data.tasks || []);
      setAllUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setLoadError(err?.message || 'Failed to load admin data. Try signing out and back in.');
      setProfiles([]); setCrmRecords([]); setInquiries([]); setPartners([]);
      setAuditLogs([]); setNotifications([]); setTasks([]); setAllUsers([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = getStoredAuthToken();
        if (!token) {
          window.location.href = "/admin-login";
          return;
        }
        const r = await base44.functions.invoke('validateSession', { token });
        const me = r.data?.valid && r.data?.user?.role === 'admin' ? r.data.user : null;
        if (!me) {
          window.location.href = "/admin-login";
          return;
        }
        setUser(me);
        await loadData();
      } catch (e) {
        window.location.href = "/admin-login";
        return;
      }
      setLoading(false);
      invokeFunction("systemHealth", {}).then(r => setHealth(r.data)).catch(() => {});
    })();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const unsub = base44.entities.InvestorProfile.subscribe((e) => {
      if (e.type === "create") setProfiles(prev => [e.data, ...prev]);
      if (e.type === "update") setProfiles(prev => prev.map(p => p.id === e.data.id ? e.data : p));
    });
    return unsub;
  }, []);
  useEffect(() => {
    const unsub = base44.entities.AuditLog.subscribe((e) => {
      if (e.type === "create") setAuditLogs(prev => [e.data, ...prev.slice(0, 99)]);
    });
    return unsub;
  }, []);
  useEffect(() => {
    const unsub = base44.entities.ClientTask.subscribe((e) => {
      if (e.type === "create") setTasks(prev => [e.data, ...prev]);
      if (e.type === "update") setTasks(prev => prev.map(t => t.id === e.data.id ? e.data : t));
    });
    return unsub;
  }, []);

  const refetch = useCallback(async () => { await loadData(); }, [loadData]);
  const refetchCRM = async () => { 
    try {
      const result = await invokeFunction('getAdminData', {});
      setCrmRecords(result.data?.crmRecords || []);
    } catch (err) { console.error('Failed to refetch CRM:', err); }
  };
  const refetchPartners = async () => { 
    try {
      const result = await invokeFunction('getAdminData', {});
      setPartners(result.data?.partners || []);
    } catch (err) { console.error('Failed to refetch partners:', err); }
  };
  const refetchInquiries = async () => { 
    try {
      const result = await invokeFunction('getAdminData', {});
      setInquiries(result.data?.inquiries || []);
    } catch (err) { console.error('Failed to refetch inquiries:', err); }
  };

  const updateStatus = async (id, access_status) => {
    await invokeFunction('updateInvestorStatus', { profile_id: id, access_status });
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, access_status } : p));
    if (selectedProfile?.id === id) setSelectedProfile(prev => ({ ...prev, access_status }));
    await refetch();
  };

  const updateInquiryStatus = async (id, status) => {
    await base44.entities.Inquiry.update(id, { status });
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    if (selectedInquiry?.id === id) setSelectedInquiry(prev => ({ ...prev, status }));
  };

  const stats = {
    total: profiles.length,
    pending: profiles.filter(p => p.access_status === "pending").length,
    approved: profiles.filter(p => p.access_status === "approved").length,
    profileComplete: profiles.filter(p => p.profile_complete).length,
    setupComplete: profiles.filter(p => (p.onboarding_step || 0) >= 6).length,
  };

  const TOP_NAV = [
    { key: "dashboard", label: "Dashboard" },
    { key: "clients", label: `Clients${stats.pending > 0 ? ` (${stats.pending})` : ""}` },
    { key: "operations", label: "Operations" },
    { key: "support", label: "Support" },
    { key: "compliance", label: "Compliance" },
    { key: "accounts", label: "Duplicate Accounts" },
    { key: "reports", label: "Reports" },
    { key: "system", label: "System" },
    { key: "settings", label: "Settings" },
  ];

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
    </div>
  );

  const sharedCRM = { profiles, crmRecords, inquiries, partners, allUsers, user, refetchCRM, refetchPartners, refetchInquiries };
  const sharedOps = { profiles, crmRecords, inquiries, auditLogs, notifications, tasks, allUsers, user, health, updateStatus, refetch, setTasks };

  // clients sub-derived
  const pendingProfiles = profiles.filter(p => p.access_status === "pending");
  const approvedProfiles = profiles.filter(p => p.access_status === "approved");
  const rejectedProfiles = profiles.filter(p => p.access_status === "rejected");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── HEADER ── */}
      <header className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-[1400px] w-full px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <span className="font-mono text-[20px] font-light text-muted-foreground/50">/</span>
              <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-3">north</span>
              <span className="font-mono text-[20px] font-light text-muted-foreground/50">/</span>
            </Link>
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-foreground/60 border border-border px-2 py-0.5">management</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center border border-border bg-secondary">
              <span className="px-3 text-muted-foreground/40 font-mono text-xs">⌕</span>
              <input type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)}
                placeholder="Search clients, leads..." className="bg-transparent px-1 py-1.5 font-mono text-xs text-foreground placeholder-muted-foreground/40 focus:outline-none w-44" />
              {globalSearch && <button onClick={() => setGlobalSearch("")} className="px-3 text-muted-foreground font-mono text-xs">✕</button>}
            </div>
            <NotificationBell userId={user?.id} />
            <span className="hidden sm:block font-mono text-xs text-muted-foreground">{(() => { const n = user?.full_name?.trim(); if (!n) return ""; const parts = n.split(" "); if (parts.length === 1) return parts[0]; return `${parts[0][0]}. ${parts[parts.length - 1]}`; })()}</span>
            <button onClick={async () => {
              const token = getStoredAuthToken();
              if (token) { try { await base44.functions.invoke('customLogout', { token }); } catch {} }
              clearCustomAuthStorage();
              sessionStorage.removeItem(AUTH_2FA_PENDING_KEY);
              await clearNativeAuthSession();
              window.location.href = "/admin-login";
            }} className="font-mono text-[10px] lowercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors">sign out</button>
          </div>
        </div>

        {/* ── LEVEL 1 MODULE NAV ── */}
        <div className="border-t border-border">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 flex gap-0 overflow-x-auto">
            {TOP_NAV.map(item => (
              <button key={item.key} onClick={() => setModule(item.key)}
                className={`px-5 py-3 font-mono text-[10px] lowercase tracking-[0.22em] whitespace-nowrap border-b-2 -mb-px transition-colors ${module === item.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {item.label.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-[1400px] w-full px-5 sm:px-8 py-16">

        {loadError && (
          <div className="mb-6 border border-red-400/30 bg-red-400/10 px-4 py-3 flex items-center justify-between gap-4">
            <p className="font-mono text-xs text-red-400">{loadError}</p>
            <button
              onClick={() => loadData()}
              className="font-mono text-[10px] lowercase tracking-[0.24em] text-red-400 hover:text-red-300 whitespace-nowrap"
            >
              retry
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════
            DASHBOARD
        ════════════════════════════════════════ */}
        {module === "dashboard" && (
          <MissionControl
            profiles={profiles}
            auditLogs={auditLogs}
            tasks={tasks}
            inquiries={inquiries}
            health={health}
            onNavigate={(m, s) => setModule(m, s)}
            onSelectProfile={setSelectedProfile}
          />
        )}

        {/* ════════════════════════════════════════
            CLIENTS
        ════════════════════════════════════════ */}
        {module === "clients" && (
          <div>
            <WorkspaceHeader eyebrow="Clients" title="Client Management" />
            <LocalNav
              items={[
                { key: "overview", label: "Overview" },
                { key: "applicants", label: `Applicants (${profiles.length})` },
                { key: "active", label: `Active (${approvedProfiles.length})` },
                { key: "leads", label: "Leads" },
                { key: "referrals", label: "Referrals" },
                { key: "partners", label: "Partners" },
                { key: "jobs", label: "Careers" },
              ]}
              active={sub || "overview"}
              onChange={setSub}
            />

            {/* Overview */}
            {(!sub || sub === "overview") && (
              <CMDashboard {...sharedCRM} globalSearch={globalSearch} onNavigate={setSub} />
            )}

            {/* Applicants — full investor table */}
            {sub === "applicants" && (
              <div>
                <LocalNav
                  items={[{ key: "applicants", label: `All (${profiles.length})` }, { key: "applicants-pending", label: `Pending (${pendingProfiles.length})` }, { key: "applicants-approved", label: `Approved (${approvedProfiles.length})` }, { key: "applicants-rejected", label: `Rejected (${rejectedProfiles.length})` }]}
                  active="applicants"
                  onChange={(k) => { if (k === "applicants-pending") setSub("pending-only"); else if (k === "applicants-approved") setSub("approved-only"); else if (k === "applicants-rejected") setSub("rejected-only"); }}
                />
                <ApplicantsTable profiles={profiles} onSelect={setSelectedProfile} onStatusChange={updateStatus} />
              </div>
            )}
            {sub === "pending-only" && (
              <div>
                <button onClick={() => setSub("applicants")} className="font-mono text-[10px] text-muted-foreground hover:text-foreground mb-4 transition-colors">← All Applicants</button>
                <ApplicantsTable profiles={pendingProfiles} onSelect={setSelectedProfile} onStatusChange={updateStatus} />
              </div>
            )}
            {sub === "approved-only" && (
              <div>
                <button onClick={() => setSub("applicants")} className="font-mono text-[10px] text-muted-foreground hover:text-foreground mb-4 transition-colors">← All Applicants</button>
                <ApplicantsTable profiles={approvedProfiles} onSelect={setSelectedProfile} onStatusChange={updateStatus} />
              </div>
            )}
            {sub === "rejected-only" && (
              <div>
                <button onClick={() => setSub("applicants")} className="font-mono text-[10px] text-muted-foreground hover:text-foreground mb-4 transition-colors">← All Applicants</button>
                <ApplicantsTable profiles={rejectedProfiles} onSelect={setSelectedProfile} onStatusChange={updateStatus} />
              </div>
            )}

            {/* Active clients — CMClients CRM view */}
            {sub === "active" && <CMClients {...sharedCRM} globalSearch={globalSearch} />}

            {/* Leads */}
            {sub === "leads" && <CMLeads {...sharedCRM} globalSearch={globalSearch} />}

            {/* Referrals */}
            {sub === "referrals" && <CMReferrals {...sharedCRM} globalSearch={globalSearch} />}

            {/* Partners */}
            {sub === "partners" && <CMPartners {...sharedCRM} globalSearch={globalSearch} />}

            {/* Jobs / Careers */}
            {sub === "jobs" && <ApplicationsDashboard />}
          </div>
        )}

        {/* ════════════════════════════════════════
            OPERATIONS
        ════════════════════════════════════════ */}
        {module === "operations" && (
          <div>
            <WorkspaceHeader eyebrow="Operations" title="Operations Center" />
            <LocalNav
              items={[
                { key: "home", label: "Overview" },
                { key: "tasks", label: `Tasks (${tasks.filter(t => t.status === "open" || t.status === "in_progress").length})` },
                { key: "approvals", label: `Approvals (${stats.pending})` },
                { key: "notifications", label: "Notifications" },
                { key: "reports", label: "Analytics" },
                { key: "team", label: "Team" },
              ]}
              active={sub || "home"}
              onChange={setSub}
            />
            {(!sub || sub === "home") && <OpsHome {...sharedOps} globalSearch={globalSearch} onNavigate={setSub} />}
            {sub === "tasks" && <OpsTasks {...sharedOps} />}
            {sub === "approvals" && <OpsApprovals {...sharedOps} />}
            {sub === "notifications" && <OpsNotifications profiles={profiles} allUsers={allUsers} />}
            {sub === "reports" && <OpsAnalytics {...sharedOps} />}
            {sub === "team" && <OpsTeam {...sharedOps} />}
          </div>
        )}

        {/* ════════════════════════════════════════
            SUPPORT
        ════════════════════════════════════════ */}
        {module === "support" && (
          <div>
            <WorkspaceHeader eyebrow="Support" title="Support Center" />
            <SupportPanel user={user} />
          </div>
        )}

        {/* ════════════════════════════════════════
            COMPLIANCE
        ════════════════════════════════════════ */}
        {module === "compliance" && (
          <div>
            <WorkspaceHeader eyebrow="Compliance" title="Compliance" />
            <LocalNav
              items={[
                { key: "passports", label: `Passports (${profiles.filter(p => p.passport_url).length})` },
                { key: "agreements", label: "Agreements" },
                { key: "audit", label: "Audit Log" },
                { key: "accounts", label: "Duplicate Accounts" },
                { key: "controls", label: "Controls" },
              ]}
              active={sub || "passports"}
              onChange={setSub}
            />

            {/* Passports */}
            {(!sub || sub === "passports") && (
              <div>
                <div className="border border-border">
                  <div className="px-5 py-4 border-b border-border bg-secondary flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Passport / ID Documents</p>
                    <span className="font-mono text-[10px] text-muted-foreground">{profiles.filter(p => p.passport_url).length} uploaded</span>
                  </div>
                  {profiles.filter(p => p.passport_url).length === 0 && <p className="px-5 py-8 font-mono text-xs text-muted-foreground">No passport uploads yet.</p>}
                  {profiles.filter(p => p.passport_url).map((p, i, arr) => (
                    <div key={p.id} className={`flex items-center justify-between px-5 py-4 ${i < arr.length - 1 ? "border-b border-border/40" : ""}`}>
                      <div>
                        <p className="font-mono text-xs text-foreground">{p.full_name || p.email}</p>
                        <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">{p.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${p.passport_status === "approved" ? "text-green-400" : p.passport_status === "pending_review" ? "text-yellow-400" : "text-muted-foreground"}`}>
                          {p.passport_status === "approved" ? "Approved" : p.passport_status === "pending_review" ? "Pending Review" : "Uploaded"}
                        </span>
                        <button
                          type="button"
                          onClick={() => invokeFunction("logDocumentAccess", {
                            action: "view",
                            document_type: "passport",
                            document_key: "passport_id",
                            profile_id: p.id,
                            target_user_id: p.user_id,
                          }).then(() => window.open(p.passport_url, "_blank", "noopener,noreferrer")).catch(() => window.open(p.passport_url, "_blank", "noopener,noreferrer"))}
                          className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agreements */}
            {sub === "agreements" && (
              <div className="border border-border">
                <div className="px-5 py-4 border-b border-border bg-secondary">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Clients with Incomplete Agreements</p>
                </div>
                {profiles.filter(p => p.access_status === "approved" && p.onboarding_stage !== "complete").slice(0, 20).map((p, i, arr) => (
                  <div key={p.id} className={`flex items-center justify-between px-5 py-4 ${i < arr.length - 1 ? "border-b border-border/40" : ""}`}>
                    <div>
                      <p className="font-mono text-xs text-foreground">{p.full_name || p.email}</p>
                      <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">Stage: {p.onboarding_stage || "profile"} · {p.created_date ? new Date(p.created_date).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                    </div>
                    <span className="font-mono text-[10px] text-yellow-400 uppercase tracking-[0.14em]">Pending</span>
                  </div>
                ))}
                {profiles.filter(p => p.access_status === "approved" && p.onboarding_stage !== "complete").length === 0 && (
                  <p className="px-5 py-8 font-mono text-xs text-muted-foreground">All approved clients have completed agreements.</p>
                )}
              </div>
            )}

            {/* Audit Log */}
            {sub === "audit" && (
              <div>
                <div className="flex gap-0 border border-border border-b-0 mb-0 overflow-x-auto">
                  {[
                    { key: "all", label: "All Events" },
                    { key: "documents", label: "Document Access" },
                    { key: "privacy", label: "Privacy Requests" },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setAuditFilter(f.key)}
                      className={`px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] whitespace-nowrap border-r border-border last:border-r-0 transition-colors ${(auditFilter || "all") === f.key ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              <div className="border border-border overflow-x-auto">
                <table className="w-full font-mono text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-secondary">
                      {["Timestamp", "Action", "Object", "User"].map(h => (
                        <th key={h} className="px-4 py-4 text-left uppercase tracking-[0.18em] text-muted-foreground font-normal whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filtered = auditLogs.filter(log => {
                        if (auditFilter === "documents") return DOCUMENT_AUDIT_ACTIONS.has(log.action);
                        if (auditFilter === "privacy") return PRIVACY_AUDIT_ACTIONS.has(log.action);
                        return true;
                      });
                      if (filtered.length === 0) {
                        return <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">No audit events recorded.</td></tr>;
                      }
                      return filtered.map(log => (
                        <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(log.created_date).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="px-4 py-3 text-foreground whitespace-nowrap"><span className="font-mono text-[10px] uppercase tracking-[0.12em] border border-border px-2 py-0.5">{log.action?.replace(/_/g, " ")}</span></td>
                          <td className="px-4 py-3 text-muted-foreground">{log.object_type && <span className="text-muted-foreground/50">{log.object_type} · </span>}{log.object_label || log.object_id || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{log.user_id === "system" ? <span className="text-muted-foreground/40">system</span> : log.actor_id && log.actor_id !== log.user_id ? <span title={log.actor_id}>{log.user_id?.slice(0, 8)}… <span className="text-muted-foreground/40">by admin</span></span> : log.user_id?.slice(0, 8) + "..."}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
              </div>
            )}

            {sub === "accounts" && (
              <DuplicateAccountsPanel onMerged={refetch} />
            )}

            {/* Controls — link to dedicated page */}
            {sub === "controls" && (
              <div>
                <p className="font-mono text-xs leading-7 text-muted-foreground mb-6 max-w-lg">Manage ISO 27001, SOC 2, PCI DSS, DORA and NIS2 control alignment in the dedicated compliance workspace.</p>
                <Link to="/portal/admin/compliance" className="inline-block border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors">
                  Open Compliance Controls →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            DUPLICATE ACCOUNTS
        ════════════════════════════════════════ */}
        {module === "accounts" && (
          <div>
            <WorkspaceHeader eyebrow="Account Integrity" title="Duplicate Accounts" />
            <DuplicateAccountsPanel onMerged={refetch} />
          </div>
        )}

        {/* ════════════════════════════════════════
            REPORTS
        ════════════════════════════════════════ */}
        {module === "reports" && (
          <div>
            <WorkspaceHeader eyebrow="Reports" title="Reports" />
            <LocalNav
              items={[
                { key: "monthly", label: "Monthly" },
                { key: "quarterly", label: "Quarterly" },
                { key: "annual", label: "Annual" },
                { key: "investor", label: "Investor Reports" },
              ]}
              active={sub || "monthly"}
              onChange={setSub}
            />
            <div className="border border-border p-8 max-w-xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Report Generation</p>
              <p className="font-mono text-xs leading-7 text-muted-foreground">Automated report generation is in development. Platform analytics are available in the Operations workspace under Analytics.</p>
              <button onClick={() => setModule("operations", "reports")} className="mt-5 border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-6 py-3 hover:bg-transparent hover:text-foreground transition-colors">
                View Analytics →
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            SYSTEM
        ════════════════════════════════════════ */}
        {module === "system" && (
          <div>
            <WorkspaceHeader eyebrow="System" title="System" />
            <LocalNav
              items={[
                { key: "health", label: "System Health" },
                { key: "automation", label: "Automation" },
                { key: "jobs", label: "Background Jobs" },
                { key: "api", label: "API Status" },
              ]}
              active={sub || "health"}
              onChange={setSub}
            />

            {(!sub || sub === "health") && (
              <div>
                {health ? (
                  <>
                    <div className={`border p-6 mb-6 flex items-center justify-between ${health.overall === "healthy" ? "border-green-400/20" : "border-yellow-400/20"}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${health.overall === "healthy" ? "bg-green-400" : health.overall === "offline" ? "bg-red-400" : "bg-yellow-400"}`} />
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-0.5">Overall Status</p>
                          <p className={`font-mono text-lg ${health.overall === "healthy" ? "text-green-400" : "text-yellow-400"}`}>{health.overall === "healthy" ? "Healthy" : health.overall === "offline" ? "Offline" : "Warning"}</p>
                        </div>
                      </div>
                      {health.checked_at && <p className="font-mono text-[10px] text-muted-foreground/50">Last checked: {new Date(health.checked_at).toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>}
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(health.services || {}).map(([key, svc]) => {
                        const labels = { database: "Database", auth: "Authentication", email: "Email Service", metacopier: "MetaCopier API", background_jobs: "Background Jobs", notifications: "Notification Service" };
                        return (
                          <div key={key} className={`border p-5 ${svc.status === "healthy" ? "border-green-400/20" : svc.status === "offline" ? "border-red-400/20" : "border-yellow-400/20"}`}>
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{labels[key] || key}</p>
                              <span className={`font-mono text-[10px] uppercase ${svc.status === "healthy" ? "text-green-400" : svc.status === "offline" ? "text-red-400" : "text-yellow-400"}`}>● {svc.status}</span>
                            </div>
                            {svc.latency_ms !== undefined && <p className="font-mono text-[10px] text-muted-foreground/60">Latency: {svc.latency_ms}ms</p>}
                            {svc.reason && <p className="font-mono text-[10px] text-yellow-400/70 mt-1">{svc.reason}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="border border-border p-8 max-w-md">
                    <p className="font-mono text-xs text-muted-foreground mb-4">Run a health check to view service status.</p>
                    <Link to="/portal/admin/system" className="inline-block border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-6 py-3 hover:bg-transparent hover:text-foreground transition-colors">Open System Health →</Link>
                  </div>
                )}
              </div>
            )}

            {sub === "automation" && (
              <div className="border border-border p-8 max-w-xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Automation Engine</p>
                <p className="font-mono text-xs leading-7 text-muted-foreground">Background automations run on schedule. Monitor runs and history in System Health.</p>
                <Link to="/portal/admin/system" className="mt-5 inline-block border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-6 py-3 hover:bg-transparent hover:text-foreground transition-colors">Open System Health →</Link>
              </div>
            )}

            {(sub === "jobs" || sub === "api") && (
              <div className="border border-border p-8 max-w-xl">
                <p className="font-mono text-xs leading-7 text-muted-foreground">Full background job monitoring and API status is available in System Health.</p>
                <Link to="/portal/admin/system" className="mt-5 inline-block border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-6 py-3 hover:bg-transparent hover:text-foreground transition-colors">Open System Health →</Link>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            SETTINGS
        ════════════════════════════════════════ */}
        {module === "settings" && (
          <div>
            <WorkspaceHeader eyebrow="Settings" title="Admin Settings" />
            <LocalNav
              items={[{ key: "team", label: "Team & Access" }, { key: "security", label: "Security" }, { key: "notifications", label: "Notifications" }]}
              active={sub || "team"}
              onChange={setSub}
            />

            {(!sub || sub === "team") && (
              <div className="space-y-10">
                <InviteUserPanel onInvited={refetch} />
                <OpsTeam allUsers={allUsers} user={user} />
              </div>
            )}
            {sub === "security" && (
              <AdminSecuritySettings user={user} />
            )}
            {sub === "notifications" && (
              <SendNotification profiles={profiles} allUsers={allUsers} />
            )}
          </div>
        )}
      </main>

      {/* ── Investor Drawer ── */}
      {selectedProfile && (
        <InvestorDrawer profile={selectedProfile} onClose={() => setSelectedProfile(null)} onStatusChange={updateStatus} onDeleted={refetch} />
      )}

      {/* ── Inquiry Detail Drawer ── */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedInquiry(null)} />
          <div className="w-full max-w-xl bg-background border-l border-border overflow-y-auto p-8 space-y-5">
            <div className="flex items-start justify-between">
              <div><p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-1">Inquiry Detail</p><h2 className="font-heading text-2xl text-foreground">{selectedInquiry.full_name}</h2></div>
              <button onClick={() => setSelectedInquiry(null)} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">✕</button>
            </div>
            {[["Email", selectedInquiry.email], ["Organization", selectedInquiry.organization], ["Country", selectedInquiry.country], ["Type", INQUIRY_LABELS[selectedInquiry.inquiry_type]], ["Priority", PRIORITY_LABELS[selectedInquiry.priority_tag]], ["Status", selectedInquiry.status?.replace("_", " ")], ["Allocation", selectedInquiry.allocation_size], ["Message", selectedInquiry.message]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="border-b border-border/40 pb-4"><p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">{k}</p><p className="font-mono text-xs text-foreground leading-6">{v}</p></div>
            ))}
            <div className="flex gap-3 pt-2">
              {selectedInquiry.status !== "contacted" && <button onClick={() => updateInquiryStatus(selectedInquiry.id, "contacted")} className="border border-green-400/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-green-400 hover:bg-green-400/10 transition-colors">Mark Contacted</button>}
              {selectedInquiry.status !== "closed" && <button onClick={() => updateInquiryStatus(selectedInquiry.id, "closed")} className="border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">Close</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Applicants table (extracted) ──────────────────────────────────────────────
function ApplicantsTable({ profiles, onSelect, onStatusChange }) {
  const monthlyLabel = (v) => ({ "50k_100k": "$50k–$100k", "100k_250k": "$100k–$250k", "250k_500k": "$250k–$500k", "500k_1m": "$500k–$1M", "1m_plus": "$1M+" }[v] || "—");
  return (
    <div className="border border-border overflow-x-auto">
      <table className="w-full font-mono text-xs">
        <thead>
          <tr className="border-b border-border bg-secondary">
            {["Name", "Email", "Organization", "Referred By", "Monthly Inv.", "Engine", "Progress", "Status", "Actions"].map(h => (
              <th key={h} className="px-4 py-4 text-left uppercase tracking-[0.2em] text-muted-foreground font-normal whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {profiles.length === 0 && <tr><td colSpan={9} className="px-5 py-10 text-center text-muted-foreground">No records found.</td></tr>}
          {profiles.map(p => {
            const eng = p.selected_engine ? engines[p.selected_engine] : null;
            const totalSteps = eng?.totalSteps || 5;
            const stepLabel = !p.selected_engine ? "Not started" : (p.onboarding_step || 0) > totalSteps ? "Complete" : (p.onboarding_step || 0) > 0 ? `Step ${p.onboarding_step} / ${totalSteps}` : "Not started";
            return (
              <tr key={p.id} onClick={() => onSelect(p)} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer">
                <td className="px-4 py-4 text-foreground whitespace-nowrap">{p.full_name || "—"}</td>
                <td className="px-4 py-4 text-muted-foreground"><a href={`mailto:${p.email}`} onClick={e => e.stopPropagation()} className="hover:text-foreground">{p.email}</a></td>
                <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{p.organization || "—"}</td>
                <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{p.referred_by || "—"}</td>
                <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{monthlyLabel(p.monthly_investment)}</td>
                <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{eng?.label || "—"}</td>
                <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{stepLabel}</td>
                <td className={`px-4 py-4 whitespace-nowrap ${statusColor(p.access_status)}`}>{statusLabel(p.access_status)}</td>
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-2">
                    {p.access_status !== "approved" && <button onClick={() => onStatusChange(p.id, "approved")} className="border border-green-400/30 px-2 py-1 text-green-400 hover:bg-green-400/10 transition-colors uppercase tracking-[0.14em] text-[10px]">Approve</button>}
                    {p.access_status !== "rejected" && <button onClick={() => onStatusChange(p.id, "rejected")} className="border border-red-400/30 px-2 py-1 text-red-400 hover:bg-red-400/10 transition-colors uppercase tracking-[0.14em] text-[10px]">Reject</button>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Operations Notifications panel ───────────────────────────────────────────
function OpsNotifications({ profiles, allUsers }) {
  return (
    <div className="max-w-xl">
      <p className="font-mono text-xs leading-6 text-muted-foreground mb-6">Send platform notifications to individual clients or all approved investors.</p>
      <SendNotification profiles={profiles} allUsers={allUsers} />
    </div>
  );
}

// ── Duplicate Accounts ────────────────────────────────────────────────────────
function DuplicateAccountsPanel({ onMerged }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const runDedupe = async (payload) => {
    const response = await invokeFunction("dedupeDuplicateUsers", payload);
    const data = response.data;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleForceApprove = async () => {
    setError("");
    setResult(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Enter the investor's email address.");
      return;
    }
    setApproveLoading(true);
    try {
      const response = await invokeFunction("forceSyncAccessByEmail", {
        email: trimmed,
        force_approved: true,
      });
      const data = response.data;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      await onMerged?.();
    } catch (err) {
      setError(err?.message || "Force approve failed.");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleMerge = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Enter the investor's email address.");
      return;
    }
    setLoading(true);
    try {
      const data = await runDedupe({ email: trimmed });
      setResult(data);
      if (data.processed > 0) await onMerged?.();
    } catch (err) {
      setError(err?.message || "Merge failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleScanAll = async () => {
    setError("");
    setResult(null);
    setScanLoading(true);
    try {
      const data = await runDedupe({});
      setResult(data);
      if (data.processed > 0) await onMerged?.();
    } catch (err) {
      setError(err?.message || "Scan failed.");
    } finally {
      setScanLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-3">Duplicate accounts</p>
        <p className="font-mono text-xs leading-7 text-muted-foreground">
          If someone signed up with email and password and also used Google or Apple, they may have two separate accounts.
          Enter their email below and click <span className="text-foreground">Merge accounts</span> to combine everything into one profile.
        </p>
      </div>

      <form onSubmit={handleMerge} className="border border-border p-5 space-y-4">
        <div>
          <label htmlFor="merge-email" className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
            Investor email
          </label>
          <input
            id="merge-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="investor@example.com"
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading || scanLoading || approveLoading}
            className="border border-foreground bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.22em] px-5 py-2.5 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
          >
            {loading ? "Merging..." : "Merge accounts"}
          </button>
          <button
            type="button"
            onClick={handleForceApprove}
            disabled={loading || scanLoading || approveLoading}
            className="border border-green-400/40 text-green-400 font-mono text-[10px] uppercase tracking-[0.22em] px-5 py-2.5 hover:bg-green-400/10 transition-colors disabled:opacity-50"
          >
            {approveLoading ? "Approving..." : "Force approve all"}
          </button>
          <button
            type="button"
            onClick={handleScanAll}
            disabled={loading || scanLoading || approveLoading}
            className="border border-border text-foreground font-mono text-[10px] uppercase tracking-[0.22em] px-5 py-2.5 hover:bg-border transition-colors disabled:opacity-50"
          >
            {scanLoading ? "Scanning..." : "Scan all duplicates"}
          </button>
        </div>
      </form>

      {error && (
        <div className="border border-red-400/30 bg-red-400/5 px-4 py-3">
          <p className="font-mono text-xs text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="border border-border px-4 py-4 space-y-3">
          {result.processed === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">
              {result.message || "No duplicate accounts found."}
            </p>
          ) : (
            <>
              <p className="font-mono text-xs text-green-400">
                Merged {result.processed} duplicate group{result.processed === 1 ? "" : "s"}.
              </p>
              <ul className="space-y-2">
                {(result.results || []).map((item) => (
                  <li key={item.email} className="font-mono text-xs text-muted-foreground border border-border/50 px-3 py-2">
                    <span className="text-foreground">{item.email}</span>
                    {" — "}
                    {item.merged_count} account{item.merged_count === 1 ? "" : "s"} merged into{" "}
                    <span className="text-foreground">{item.canonical_user_id?.slice(0, 8)}…</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Invite User Panel ─────────────────────────────────────────────────────────
function InviteUserPanel({ onInvited }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleInvite = async (e) => {
    e.preventDefault();
    setError(""); setResult(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError("Enter an email address."); return; }
    setLoading(true);
    try {
      const token = getStoredAuthToken();
      const res = await invokeFunction("inviteUser", { email: trimmed, role: "user", session_token: token });
      if (res.data?.error) throw new Error(res.data.error);
      setResult(`Invite sent to ${trimmed}. They will receive an email to set their password.`);
      setEmail("");
      onInvited?.();
    } catch (err) {
      setError(err?.message || "Failed to send invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-3">invite user</p>
      <p className="font-mono text-xs leading-7 text-muted-foreground mb-5">
        Use this to invite deleted users back — bypasses the "email already exists" block and creates a clean new account.
      </p>
      <form onSubmit={handleInvite} className="border border-border p-5 space-y-4">
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="investor@example.com"
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="border border-foreground bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.22em] px-5 py-2.5 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Invite"}
        </button>
        {error && <p className="font-mono text-xs text-red-400">{error}</p>}
        {result && <p className="font-mono text-xs text-green-400">{result}</p>}
      </form>
    </div>
  );
}

// ── Admin Security Settings ───────────────────────────────────────────────────
function AdminSecuritySettings({ user }) {
  const [saving, setSaving] = useState(false);
  const [twoFaEnabled, setTwoFaEnabled] = useState(!!user?.two_fa_enabled);
  const [saved, setSaved] = useState(false);

  const toggle = async () => {
    setSaving(true);
    const newVal = !twoFaEnabled;
    await base44.entities.User.update(user.id, { two_fa_enabled: newVal });
    setTwoFaEnabled(newVal);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4 max-w-md">
      <div className="border border-border p-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">Two-Factor Authentication</p>
          <p className="font-mono text-xs text-muted-foreground/60 mb-1">
            {twoFaEnabled ? "Enabled — a 6-digit code is sent to your email on each login." : "Not enabled — your admin account is protected by password only."}
          </p>
          {twoFaEnabled && <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-green-400">● Active</span>}
          {saved && <span className="ml-3 font-mono text-[9px] text-green-400">✓ Saved</span>}
        </div>
        <button
          disabled={saving}
          onClick={toggle}
          className={`font-mono text-[10px] uppercase tracking-[0.22em] border px-4 py-2.5 flex-shrink-0 transition-colors disabled:opacity-50 ${twoFaEnabled ? "border-red-400/30 text-red-400 hover:bg-red-400/10" : "border-foreground text-foreground hover:bg-foreground hover:text-background"}`}
        >
          {saving ? "..." : twoFaEnabled ? "Disable 2FA" : "Enable 2FA"}
        </button>
      </div>
      <p className="font-mono text-[10px] leading-6 text-muted-foreground/50 max-w-md">
        When enabled, sign-in via email + password will require a verification code sent to your registered email address. Google sign-in is unaffected.
      </p>
    </div>
  );
}