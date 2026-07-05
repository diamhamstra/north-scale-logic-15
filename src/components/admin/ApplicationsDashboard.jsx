import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Download, MessageSquare, Calendar, Archive, X } from "lucide-react";

const STATUS_OPTIONS = ["Applied", "Under Review", "Interview", "Assessment", "Offer", "Rejected", "Hired"];
const POSITION_FILTERS = ["all", "Quantitative Trader", "Financial Accountant"];

const STATUS_COLORS = {
  Applied: "text-blue-400 border-blue-400/30 bg-blue-400/5",
  "Under Review": "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  Interview: "text-purple-400 border-purple-400/30 bg-purple-400/5",
  Assessment: "text-orange-400 border-orange-400/30 bg-orange-400/5",
  Offer: "text-green-400 border-green-400/30 bg-green-400/5",
  Rejected: "text-red-400 border-red-400/30 bg-red-400/5",
  Hired: "text-green-400 border-green-400/30 bg-green-400/5",
};

export default function ApplicationsDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    loadApplications();
    const unsubscribe = base44.entities.JobApplication.subscribe(() => loadApplications());
    return () => unsubscribe();
  }, []);

  const loadApplications = async () => {
    try {
      const apps = await base44.entities.JobApplication.list("-submitted_at");
      setApplications(apps);
    } catch (e) {
      console.error("Failed to load applications:", e);
    }
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    await base44.entities.JobApplication.update(id, { status: newStatus });
    loadApplications();
    setSelectedApp(null);
  };

  const saveNotes = async () => {
    if (!selectedApp) return;
    setSavingNotes(true);
    await base44.entities.JobApplication.update(selectedApp.id, { admin_notes: notes });
    setSavingNotes(false);
    setSelectedApp({ ...selectedApp, admin_notes: notes });
  };

  useEffect(() => {
    if (selectedApp) {
      setNotes(selectedApp.admin_notes || "");
    }
  }, [selectedApp]);

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === "Applied").length,
    underReview: applications.filter(a => a.status === "Under Review").length,
    interview: applications.filter(a => a.status === "Interview").length,
    hired: applications.filter(a => a.status === "Hired").length,
  };

  const filteredApplications = filter === "all" 
    ? applications 
    : applications.filter(a => a.position === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total },
          { label: "Applied", value: stats.applied },
          { label: "Under Review", value: stats.underReview },
          { label: "Interview", value: stats.interview },
          { label: "Hired", value: stats.hired },
        ].map(stat => (
          <div key={stat.label} className="border border-border p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-1">{stat.label}</p>
            <p className="font-heading text-2xl text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-0 border-b border-border mb-6">
        {POSITION_FILTERS.map(pos => (
          <button
            key={pos}
            onClick={() => setFilter(pos)}
            className={`px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] border-b-2 -mb-px transition-colors ${
              filter === pos
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {pos === "all" ? "All Positions" : pos}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-2">
        {filteredApplications.length === 0 ? (
          <div className="border border-border p-12 text-center">
            <p className="font-mono text-xs text-muted-foreground">No applications yet.</p>
          </div>
        ) : (
          filteredApplications.map(app => (
            <div
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className="border border-border p-5 cursor-pointer hover:bg-secondary/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`font-mono text-[9px] uppercase tracking-[0.22em] px-2 py-0.5 border ${STATUS_COLORS[app.status]}`}>
                      {app.status}
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground/60">#{app.application_id}</span>
                  </div>
                  <p className="font-mono text-sm text-foreground">{app.first_name} {app.last_name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground/70 mt-0.5">{app.position} · {app.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[9px] text-muted-foreground/50">
                    {new Date(app.submitted_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  {app.admin_notes && (
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <MessageSquare className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-[9px] text-muted-foreground">Note</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedApp(null)} />
          <div className="relative w-full max-w-lg bg-background border-l border-border h-full overflow-y-auto p-6 sm:p-8">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-6 right-6 font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-4">
              Application Details
            </p>
            <h2 className="font-heading text-2xl text-foreground mb-6">
              {selectedApp.first_name} {selectedApp.last_name}
            </h2>

            {/* Status Update */}
            <div className="mb-6">
              <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
                Application Status
              </label>
              <select
                value={selectedApp.status}
                onChange={(e) => updateStatus(selectedApp.id, e.target.value)}
                className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Info */}
            <div className="space-y-4 mb-6 pb-6 border-b border-border">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-1">Position</p>
                <p className="font-mono text-xs text-foreground">{selectedApp.position}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-1">Email</p>
                <p className="font-mono text-xs text-foreground">{selectedApp.email}</p>
              </div>
              {selectedApp.phone && (
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-1">Phone</p>
                  <p className="font-mono text-xs text-foreground">{selectedApp.phone}</p>
                </div>
              )}
              {selectedApp.location && (
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-1">Location</p>
                  <p className="font-mono text-xs text-foreground">{selectedApp.location}</p>
                </div>
              )}
              {selectedApp.linkedin_url && (
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-1">LinkedIn</p>
                  <a href={selectedApp.linkedin_url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-foreground hover:text-muted-foreground underline underline-offset-2">
                    View Profile
                  </a>
                </div>
              )}
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-1">Submitted</p>
                <p className="font-mono text-xs text-foreground">
                  {new Date(selectedApp.submitted_at).toLocaleString("en-GB")}
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-1">CV</p>
                <a href={selectedApp.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-mono text-xs text-foreground hover:text-muted-foreground">
                  <Download className="w-3.5 h-3.5" />
                  Download CV
                </a>
              </div>
            </div>

            {/* Cover Letter */}
            {selectedApp.cover_letter && (
              <div className="mb-6 pb-6 border-b border-border">
                <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-3">Cover Letter</p>
                <p className="font-mono text-xs leading-6 text-muted-foreground whitespace-pre-wrap">{selectedApp.cover_letter}</p>
              </div>
            )}

            {/* Additional Info */}
            {selectedApp.additional_info && (
              <div className="mb-6 pb-6 border-b border-border">
                <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-3">Additional Information</p>
                <p className="font-mono text-xs leading-6 text-muted-foreground whitespace-pre-wrap">{selectedApp.additional_info}</p>
              </div>
            )}

            {/* Admin Notes */}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-3">Admin Notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground resize-none mb-3"
                placeholder="Add internal notes..."
              />
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="w-full border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-6 py-3 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}