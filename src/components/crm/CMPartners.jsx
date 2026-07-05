import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";

const PARTNER_TYPES = ["broker", "technology", "legal", "compliance", "marketing", "other"];
const PARTNER_STATUSES = ["active", "inactive", "prospect", "former"];
const TYPE_LABELS = { broker: "Broker", technology: "Technology", legal: "Legal", compliance: "Compliance", marketing: "Marketing", other: "Other" };
const STATUS_COLORS = { active: "text-green-400", inactive: "text-muted-foreground/50", prospect: "text-yellow-400", former: "text-muted-foreground/30" };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const EMPTY_FORM = { name: "", partner_type: "broker", status: "prospect", primary_contact_name: "", primary_contact_email: "", primary_contact_phone: "", website: "", jurisdiction: "", referral_link: "", commission_agreement: "", notes: "" };

export default function CMPartners({ partners, globalSearch, refetchPartners }) {
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState(globalSearch || "");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return partners.filter(p => {
      if (filterType !== "all" && p.partner_type !== filterType) return false;
      if (q && !p.name?.toLowerCase().includes(q) && !p.primary_contact_name?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [partners, search, filterType]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    if (selected) {
      await base44.entities.Partner.update(selected.id, form);
    } else {
      await base44.entities.Partner.create(form);
    }
    await refetchPartners();
    setShowForm(false);
    setSelected(null);
    setForm(EMPTY_FORM);
    setSaving(false);
  };

  const openEdit = (p) => {
    setSelected(p);
    setForm({ name: p.name || "", partner_type: p.partner_type || "broker", status: p.status || "prospect", primary_contact_name: p.primary_contact_name || "", primary_contact_email: p.primary_contact_email || "", primary_contact_phone: p.primary_contact_phone || "", website: p.website || "", jurisdiction: p.jurisdiction || "", referral_link: p.referral_link || "", commission_agreement: p.commission_agreement || "", notes: p.notes || "" });
    setShowForm(true);
  };

  const inputClass = "w-full border border-border bg-background px-3 py-2.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors";

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-2">Client Management</p>
          <h1 className="font-heading text-4xl text-foreground">Partners</h1>
        </div>
        <button onClick={() => { setSelected(null); setForm(EMPTY_FORM); setShowForm(true); }}
          className="border border-foreground bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.22em] px-5 py-2.5 hover:bg-transparent hover:text-foreground transition-colors">
          + Add Partner
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border border-border mb-8">
        {[
          { label: "Total", value: partners.length },
          { label: "Active", value: partners.filter(p => p.status === "active").length, color: "text-green-400" },
          { label: "Prospects", value: partners.filter(p => p.status === "prospect").length, color: "text-yellow-400" },
          { label: "Brokers", value: partners.filter(p => p.partner_type === "broker").length },
        ].map((s, i) => (
          <div key={s.label} className={`p-5 ${i < 3 ? "border-r border-border" : ""}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-2">{s.label}</p>
            <p className={`font-heading text-3xl ${s.color || "text-foreground"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search partners..."
          className="border border-border bg-background px-4 py-2.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground flex-1 max-w-xs" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-border bg-background px-3 py-2.5 font-mono text-xs text-foreground focus:outline-none focus:border-foreground">
          <option value="all">All Types</option>
          {PARTNER_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="border border-border overflow-x-auto">
        <table className="w-full font-mono text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-secondary">
              {["Name", "Type", "Status", "Primary Contact", "Email", "Website", "Added", ""].map(h => (
                <th key={h} className="px-4 py-4 text-left uppercase tracking-[0.16em] text-muted-foreground font-normal whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">No partners found. Add your first partner.</td></tr>}
            {filtered.map((p, i) => (
              <tr key={p.id} className={`hover:bg-secondary/20 transition-colors ${i < filtered.length - 1 ? "border-b border-border/50" : ""}`}>
                <td className="px-4 py-4 text-foreground font-semibold whitespace-nowrap">{p.name}</td>
                <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{TYPE_LABELS[p.partner_type] || "—"}</td>
                <td className={`px-4 py-4 whitespace-nowrap uppercase tracking-[0.14em] text-[10px] ${STATUS_COLORS[p.status] || "text-muted-foreground"}`}>{p.status}</td>
                <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{p.primary_contact_name || "—"}</td>
                <td className="px-4 py-4 text-muted-foreground">{p.primary_contact_email ? <a href={`mailto:${p.primary_contact_email}`} className="hover:text-foreground">{p.primary_contact_email}</a> : "—"}</td>
                <td className="px-4 py-4 text-muted-foreground">{p.website ? <a href={p.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">→</a> : "—"}</td>
                <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{fmtDate(p.created_date)}</td>
                <td className="px-4 py-4"><button onClick={() => openEdit(p)} className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Form Panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-background/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="w-full max-w-lg bg-background border-l border-border overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl text-foreground">{selected ? "Edit Partner" : "Add Partner"}</h2>
              <button onClick={() => setShowForm(false)} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">✕</button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div><label className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">Name *</label><input type="text" value={form.name} onChange={e => set("name", e.target.value)} required className={inputClass} placeholder="Company or individual name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">Type</label>
                  <select value={form.partner_type} onChange={e => set("partner_type", e.target.value)} className={inputClass}>
                    {PARTNER_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div><label className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">Status</label>
                  <select value={form.status} onChange={e => set("status", e.target.value)} className={inputClass}>
                    {PARTNER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">Primary Contact</label><input type="text" value={form.primary_contact_name} onChange={e => set("primary_contact_name", e.target.value)} className={inputClass} placeholder="Contact full name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">Email</label><input type="email" value={form.primary_contact_email} onChange={e => set("primary_contact_email", e.target.value)} className={inputClass} /></div>
                <div><label className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">Phone</label><input type="text" value={form.primary_contact_phone} onChange={e => set("primary_contact_phone", e.target.value)} className={inputClass} /></div>
              </div>
              <div><label className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">Website</label><input type="text" value={form.website} onChange={e => set("website", e.target.value)} className={inputClass} placeholder="https://" /></div>
              <div><label className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">Referral Link</label><input type="text" value={form.referral_link} onChange={e => set("referral_link", e.target.value)} className={inputClass} /></div>
              <div><label className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">Commission Agreement</label><input type="text" value={form.commission_agreement} onChange={e => set("commission_agreement", e.target.value)} className={inputClass} placeholder="e.g. 2% AUM fee" /></div>
              <div><label className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">Notes</label>
                <textarea rows={4} value={form.notes} onChange={e => set("notes", e.target.value)} className={`${inputClass} resize-none`} placeholder="Internal notes..." />
              </div>
              <button type="submit" disabled={saving || !form.name.trim()}
                className="w-full border border-foreground bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.22em] py-3 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-40">
                {saving ? "Saving..." : selected ? "Update Partner" : "Add Partner"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}