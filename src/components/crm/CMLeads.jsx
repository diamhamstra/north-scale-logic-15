import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "lost"];
const STATUS_COLORS = { new: "text-blue-400", contacted: "text-yellow-400", qualified: "text-green-400", converted: "text-foreground", lost: "text-muted-foreground/50" };

const SOURCE_LABELS = { website_inquiry: "Website Inquiry", portal_registration: "Portal Registration", direct: "Direct", referral: "Referral", other: "Other" };

const INQUIRY_TYPE_LABELS = {
  prospective_investor: "Prospective Investor", family_office: "Family Office",
  institutional_investor: "Institutional", investment_consultant: "Consultant",
  quant_trader: "Quant Trader", portfolio_manager: "Portfolio Manager",
  broker_partnership: "Broker", technology_partnership: "Technology",
  liquidity_provider: "Liquidity", media: "Media", general: "General", other: "Other",
};

export default function CMLeads({ crmRecords, inquiries, allUsers, user, globalSearch, refetchCRM, refetchInquiries }) {
  const [search, setSearch] = useState(globalSearch || "");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [selected, setSelected] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);

  // Leads = CRM records with status lead/pending, plus inquiries not yet in CRM
  const leads = useMemo(() => {
    const crmLeads = crmRecords.filter(r => r.client_status === "lead" || r.client_status === "pending");
    return crmLeads;
  }, [crmRecords]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l => {
      if (filterStatus !== "all") {
        // Map CRM status to lead status
        const s = l.client_status === "pending" ? "new" : l.client_status;
        if (s !== filterStatus) return false;
      }
      if (filterSource !== "all" && l.lead_source !== filterSource) return false;
      if (q && !l.full_name?.toLowerCase().includes(q) && !l.email?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [leads, search, filterStatus, filterSource]);

  const updateLeadStatus = async (id, newStatus) => {
    // Map lead status back to crm status
    const crmStatus = newStatus === "converted" ? "approved" : newStatus === "new" ? "pending" : newStatus === "lost" ? "rejected" : "lead";
    setSavingStatus(true);
    await base44.entities.CRMRecord.update(id, { client_status: crmStatus });
    await refetchCRM();
    if (selected?.id === id) setSelected(prev => ({ ...prev, client_status: crmStatus }));
    setSavingStatus(false);
  };

  const getLeadStatus = (r) => {
    if (r.client_status === "pending") return "new";
    if (r.client_status === "rejected") return "lost";
    if (r.client_status === "approved" || r.client_status === "active") return "converted";
    return r.client_status;
  };

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.client_status === "pending" || l.client_status === "lead").length,
    contacted: leads.filter(l => l.client_status === "contacted").length,
    converted: crmRecords.filter(r => r.client_status === "approved" || r.client_status === "active").length,
  };

  // Also show raw inquiries that don't have a CRM entry
  const inqWithoutCRM = inquiries.filter(inq => !crmRecords.find(c => c.inquiry_id === inq.id));

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-2">Client Management</p>
        <h1 className="font-heading text-4xl text-foreground">Leads</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border border-border mb-8">
        {[
          { label: "Total Leads", value: stats.total },
          { label: "New", value: stats.new, color: "text-blue-400" },
          { label: "In Progress", value: stats.contacted, color: "text-yellow-400" },
          { label: "Converted", value: stats.converted, color: "text-green-400" },
        ].map((s, i) => (
          <div key={s.label} className={`p-5 ${i < 3 ? "border-r border-border" : ""}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-2">{s.label}</p>
            <p className={`font-heading text-3xl ${s.color || "text-foreground"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email..."
          className="border border-border bg-background px-4 py-2.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-border bg-background px-3 py-2.5 font-mono text-xs text-foreground focus:outline-none focus:border-foreground">
          <option value="all">All Statuses</option>
          {LEAD_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
          className="border border-border bg-background px-3 py-2.5 font-mono text-xs text-foreground focus:outline-none focus:border-foreground">
          <option value="all">All Sources</option>
          {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* CRM Leads Table */}
      <div className="border border-border overflow-x-auto mb-8">
        <table className="w-full font-mono text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-secondary">
              {["Name", "Email", "Source", "Status", "Referred By", "Engine", "Registration", "Actions"].map(h => (
                <th key={h} className="px-4 py-4 text-left uppercase tracking-[0.16em] text-muted-foreground font-normal whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">No leads found.</td></tr>}
            {filtered.map((l, i) => {
              const status = getLeadStatus(l);
              return (
                <tr key={l.id} className={`hover:bg-secondary/20 transition-colors ${i < filtered.length - 1 ? "border-b border-border/50" : ""}`}>
                  <td className="px-4 py-4 text-foreground whitespace-nowrap">{l.full_name || "—"}</td>
                  <td className="px-4 py-4 text-muted-foreground">{l.email}</td>
                  <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{SOURCE_LABELS[l.lead_source] || "—"}</td>
                  <td className={`px-4 py-4 whitespace-nowrap uppercase tracking-[0.14em] text-[10px] ${STATUS_COLORS[status] || "text-muted-foreground"}`}>{status}</td>
                  <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{l.referred_by || "—"}</td>
                  <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{l.engine || "—"}</td>
                  <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{fmtDate(l.registration_date)}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {status === "new" && <button onClick={() => updateLeadStatus(l.id, "contacted")} className="font-mono text-[9px] uppercase tracking-[0.14em] border border-yellow-400/30 px-2 py-1 text-yellow-400 hover:bg-yellow-400/10 transition-colors whitespace-nowrap">Contact</button>}
                      {status !== "converted" && status !== "lost" && <button onClick={() => updateLeadStatus(l.id, "converted")} className="font-mono text-[9px] uppercase tracking-[0.14em] border border-green-400/30 px-2 py-1 text-green-400 hover:bg-green-400/10 transition-colors whitespace-nowrap">Convert</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Website Inquiries without CRM record */}
      {inqWithoutCRM.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-4">Website Inquiries (Not Yet in CRM)</p>
          <div className="border border-border overflow-x-auto">
            <table className="w-full font-mono text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  {["Name", "Email", "Country", "Type", "Date", "Actions"].map(h => (
                    <th key={h} className="px-4 py-4 text-left uppercase tracking-[0.16em] text-muted-foreground font-normal whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inqWithoutCRM.slice(0, 20).map((inq, i) => (
                  <tr key={inq.id} className={`hover:bg-secondary/20 transition-colors ${i < inqWithoutCRM.length - 1 ? "border-b border-border/50" : ""}`}>
                    <td className="px-4 py-4 text-foreground whitespace-nowrap">{inq.full_name || "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground">{inq.email}</td>
                    <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{inq.country || "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{INQUIRY_TYPE_LABELS[inq.inquiry_type] || "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{fmtDate(inq.created_date)}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={async () => {
                          await base44.entities.CRMRecord.create({
                            email: inq.email, full_name: inq.full_name,
                            lead_source: "website_inquiry", client_status: "lead",
                            inquiry_id: inq.id, registration_date: new Date().toISOString().split("T")[0],
                          });
                          await refetchCRM();
                          await refetchInquiries();
                        }}
                        className="font-mono text-[9px] uppercase tracking-[0.14em] border border-border px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors whitespace-nowrap"
                      >
                        Add to CRM
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}