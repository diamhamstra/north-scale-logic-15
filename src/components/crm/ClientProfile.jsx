import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AGREEMENTS } from "@/lib/agreements";
import { openDocumentWithAudit } from "@/lib/documentAccess";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

function generateClientId(id) {
  if (!id) return "—";
  const num = parseInt(id.replace(/-/g, "").slice(0, 8), 16) % 900000 + 100000;
  return `NS-${num}`;
}

const ENGINE_LABELS = { commodities: "Commodities Engine", digital: "Digital Assets Engine", equities: "Equity Indices Engine" };
const MONTHLY_LABELS = { "50k_100k": "$50k–$100k", "100k_250k": "$100k–$250k", "250k_500k": "$250k–$500k", "500k_1m": "$500k–$1M", "1m_plus": "$1M+" };

const ONBOARDING_STEPS = [
  { key: "access_approved", label: "Account Approved", check: (p) => p.access_status === "approved" },
  { key: "profile_complete", label: "Profile Completed", check: (p) => !!p.profile_complete },
  { key: "agreements_signed", label: "Agreements Signed", check: (p) => p.onboarding_stage === "complete" || p.onboarding_stage === "passport" },
  { key: "passport_uploaded", label: "Passport Uploaded", check: (p) => !!p.passport_url },
  { key: "engine_selected", label: "Engine Selected", check: (p) => !!p.selected_engine },
  { key: "broker_connected", label: "Broker Connected", check: (p) => !!(p.onboarding_step >= 2) },
  { key: "metacopier_connected", label: "MetaCopier Connected", check: (p) => !!(p.commodities_metacopier_id || p.digital_metacopier_id) },
];

const TASK_TEMPLATES = ["Review Passport", "Schedule Intro Call", "Await Deposit", "Activate Engine", "Follow Up", "KYC Review", "Send Agreement", "Verify MetaCopier"];

const NOTE_CATEGORIES = ["general", "compliance", "onboarding", "investment", "support", "call"];

export default function ClientProfile({ profile, crm, allUsers, currentUser, onBack, refetchCRM }) {
  const [tab, setTab] = useState("overview");
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Note form
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState("general");
  const [savingNote, setSavingNote] = useState(false);

  // Task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState("normal");
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [n, t, logs] = await Promise.all([
        base44.entities.ClientNote.filter({ client_id: profile.id }),
        base44.entities.ClientTask.filter({ client_id: profile.id }),
        base44.entities.AuditLog.filter({ user_id: profile.user_id }),
      ]);
      setNotes(n.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setTasks(t.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setAuditLogs(logs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setLoading(false);
    })();
  }, [profile.id]);

  const saveNote = async () => {
    if (!noteContent.trim()) return;
    setSavingNote(true);
    const n = await base44.entities.ClientNote.create({
      client_id: profile.id,
      user_id: profile.user_id,
      author_id: currentUser.id,
      author_name: currentUser.full_name || currentUser.email,
      category: noteCategory,
      content: noteContent,
    });
    setNotes(prev => [n, ...prev]);
    setNoteContent("");
    setSavingNote(false);
  };

  const saveTask = async () => {
    if (!taskTitle.trim()) return;
    setSavingTask(true);
    const t = await base44.entities.ClientTask.create({
      client_id: profile.id,
      user_id: profile.user_id,
      title: taskTitle,
      description: taskDesc,
      priority: taskPriority,
      due_date: taskDue || undefined,
      status: "open",
      assigned_to: currentUser.id,
      assigned_name: currentUser.full_name || currentUser.email,
    });
    setTasks(prev => [t, ...prev]);
    setTaskTitle(""); setTaskDesc(""); setTaskDue(""); setTaskPriority("normal");
    setSavingTask(false);
  };

  const updateTask = async (id, updates) => {
    await base44.entities.ClientTask.update(id, updates);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const doneSteps = ONBOARDING_STEPS.filter(s => s.check(profile)).length;
  const pct = Math.round((doneSteps / ONBOARDING_STEPS.length) * 100);

  // Build timeline from audit logs
  const timelineEvents = auditLogs.map(log => ({
    date: log.created_date,
    label: log.action?.replace(/_/g, " "),
    detail: log.object_label || "",
  })).slice(0, 20);

  const agrSigned = profile.agreements_signed || {};

  const TABS = ["overview", "investment", "onboarding", "timeline", "dataroom", "notes", "tasks"];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Back + header */}
      <div className="mb-8">
        <button onClick={onBack} className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors mb-5 flex items-center gap-2">
          ← Back to Clients
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <span className="font-mono text-[10px] border border-border px-3 py-1 text-muted-foreground">{profile.account_id || generateClientId(profile.id)}</span>
              <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${profile.access_status === "approved" ? "text-green-400" : profile.access_status === "rejected" ? "text-red-400" : "text-yellow-400"}`}>
                ● {profile.access_status}
              </span>
            </div>
            <h1 className="font-heading text-4xl text-foreground">{profile.full_name || "Unknown"}</h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">{profile.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {profile.phone && <a href={`tel:${profile.phone}`} className="font-mono text-[10px] border border-border px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">{profile.phone}</a>}
            <a href={`mailto:${profile.email}`} className="font-mono text-[10px] border border-foreground bg-foreground text-background px-4 py-2 hover:bg-transparent hover:text-foreground transition-colors">Send Email →</a>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-0 border border-border font-mono text-[10px] uppercase tracking-[0.18em] mb-8 w-fit">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 transition-colors ${i > 0 ? "border-l border-border" : ""} ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "dataroom" ? "Data Room" : t}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            ["North Scale Account ID", profile.account_id || generateClientId(profile.id)],
            ["Full Name", profile.full_name || "—"],
            ["Email", profile.email],
            ["Phone", profile.phone || "—"],
            ["Nationality", profile.nationality || "—"],
            ["Tax Residency", profile.income_tax_country || "—"],
            ["Organization", profile.organization || "—"],
            ["Referred By", profile.referred_by || "—"],
            ["Investor Since", fmtDate(profile.created_date)],
            ["Access Status", profile.access_status],
            ["Onboarding Stage", profile.onboarding_stage || "—"],
            ["Net Worth", profile.net_worth?.replace(/_/g, "–").replace(/k/g, "K") || "—"],
          ].map(([label, value]) => (
            <div key={label} className="border border-border p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground mb-1">{label}</p>
              <p className="font-mono text-xs text-foreground">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── INVESTMENT ── */}
      {tab === "investment" && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              ["Monthly Investment", MONTHLY_LABELS[profile.monthly_investment] || "—"],
              ["Selected Engine", ENGINE_LABELS[profile.selected_engine] || "Not selected"],
              ["MetaCopier (Commodities)", profile.commodities_metacopier_id || "Not connected"],
              ["MetaCopier (Digital)", profile.digital_metacopier_id || "Not connected"],
              ["Commodities Email", profile.commodities_metacopier_email || "—"],
              ["Digital Email", profile.digital_metacopier_email || "—"],
            ].map(([label, value]) => (
              <div key={label} className="border border-border p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground mb-1">{label}</p>
                <p className="font-mono text-xs text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="border border-border">
            <div className="px-5 py-4 border-b border-border bg-secondary">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Engine Status</p>
            </div>
            {["commodities", "digital", "equities"].map(eng => {
              const isSelected = profile.selected_engine === eng;
              const mcId = profile[`${eng}_metacopier_id`];
              const stepComplete = profile.selected_engine === eng && (profile.onboarding_step || 0) > 5;
              return (
                <div key={eng} className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                  <div>
                    <p className="font-mono text-xs text-foreground">{ENGINE_LABELS[eng]}</p>
                    {mcId && <p className="font-mono text-[10px] text-muted-foreground mt-0.5">ID: {mcId}</p>}
                  </div>
                  <span className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
                    stepComplete ? "text-green-400" : isSelected ? "text-yellow-400" : "text-muted-foreground/40"
                  }`}>
                    {stepComplete ? "● Active" : isSelected ? "● In Progress" : "○ Not Started"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ONBOARDING ── */}
      {tab === "onboarding" && (
        <div className="max-w-lg">
          <div className="flex items-center justify-between mb-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Overall Progress</p>
            <span className={`font-mono text-lg ${pct === 100 ? "text-green-400" : "text-foreground"}`}>{pct}%</span>
          </div>
          <div className="w-full h-px bg-border relative overflow-hidden mb-8">
            <div className={`absolute left-0 top-0 h-px transition-all ${pct === 100 ? "bg-green-400" : "bg-foreground"}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="space-y-3">
            {ONBOARDING_STEPS.map(step => {
              const done = step.check(profile);
              return (
                <div key={step.key} className={`border p-4 flex items-center gap-4 ${done ? "border-green-400/20" : "border-border"}`}>
                  <span className={`w-6 h-6 border flex-shrink-0 flex items-center justify-center font-mono text-[10px] ${done ? "border-green-400/40 text-green-400" : "border-border text-muted-foreground/40"}`}>
                    {done ? "✓" : "○"}
                  </span>
                  <span className={`font-mono text-xs ${done ? "text-muted-foreground" : "text-muted-foreground/50"}`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TIMELINE ── */}
      {tab === "timeline" && (
        <div className="max-w-lg">
          {timelineEvents.length === 0 && <p className="font-mono text-xs text-muted-foreground">No timeline events recorded.</p>}
          <div className="space-y-0">
            {timelineEvents.map((e, i) => (
              <div key={i} className="flex gap-5 pb-6">
                <div className="flex flex-col items-center">
                  <span className="w-2 h-2 rounded-full bg-border flex-shrink-0 mt-1" />
                  {i < timelineEvents.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                </div>
                <div className="pb-2">
                  <p className="font-mono text-[10px] text-muted-foreground/60 mb-0.5">{fmtDate(e.date)}</p>
                  <p className="font-mono text-xs text-foreground uppercase tracking-[0.12em]">{e.label}</p>
                  {e.detail && <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{e.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DATA ROOM ── */}
      {tab === "dataroom" && (
        <div className="space-y-6">
          <div className="border border-border">
            <div className="px-5 py-4 border-b border-border bg-secondary">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Signed Agreements</p>
            </div>
            {AGREEMENTS.map(agr => {
              const record = agrSigned[agr.key];
              const parsed = record ? (typeof record === "string" ? JSON.parse(record) : record) : null;
              return (
                <div key={agr.key} className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                  <div>
                    <p className="font-mono text-xs text-foreground">{agr.title}</p>
                    {parsed && <p className="font-mono text-[10px] text-muted-foreground mt-0.5">v{parsed.version} · {fmtDateTime(parsed.signed_at)}</p>}
                  </div>
                  <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${parsed ? "text-green-400" : "text-muted-foreground/40"}`}>
                    {parsed ? "Signed" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border border-border">
            <div className="px-5 py-4 border-b border-border bg-secondary">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Identity Document</p>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-mono text-xs text-foreground">Passport / Government ID</p>
                {profile.passport_url && <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Status: {profile.passport_status?.replace(/_/g, " ")}</p>}
              </div>
              {profile.passport_url
                ? (
                  <button
                    type="button"
                    onClick={() => openDocumentWithAudit({
                      url: profile.passport_url,
                      action: "view",
                      documentType: "passport",
                      documentKey: "passport_id",
                      profileId: profile.id,
                      targetUserId: profile.user_id,
                    })}
                    className="font-mono text-[10px] text-blue-400 hover:underline"
                  >
                    View →
                  </button>
                )
                : <span className="font-mono text-[10px] text-muted-foreground/40">Not uploaded</span>}
            </div>
          </div>
        </div>
      )}

      {/* ── NOTES ── */}
      {tab === "notes" && (
        <div className="space-y-6">
          <div className="border border-border p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-4">Add Note</p>
            <div className="flex gap-3 mb-3">
              <select value={noteCategory} onChange={e => setNoteCategory(e.target.value)}
                className="border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-foreground">
                {NOTE_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <textarea
              rows={4}
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              placeholder="Write a private note visible only to administrators..."
              className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors resize-none mb-3"
            />
            <button onClick={saveNote} disabled={savingNote || !noteContent.trim()}
              className="border border-foreground bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.22em] px-5 py-2.5 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-40">
              {savingNote ? "Saving..." : "Save Note"}
            </button>
          </div>

          {notes.length === 0 && <p className="font-mono text-xs text-muted-foreground">No notes yet.</p>}
          {notes.map(n => (
            <div key={n.id} className="border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] border border-border px-2 py-0.5 text-muted-foreground">{n.category}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{n.author_name}</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground/50">{fmtDateTime(n.created_date)}</span>
              </div>
              <p className="font-mono text-xs text-foreground leading-6">{n.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── TASKS ── */}
      {tab === "tasks" && (
        <div className="space-y-6">
          <div className="border border-border p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-4">Create Task</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {TASK_TEMPLATES.map(t => (
                <button key={t} onClick={() => setTaskTitle(t)}
                  className="font-mono text-[10px] border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                  {t}
                </button>
              ))}
            </div>
            <input type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task title..."
              className="w-full border border-border bg-background px-4 py-2.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors mb-3" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}
                className="border border-border bg-background px-3 py-2.5 font-mono text-xs text-foreground focus:outline-none focus:border-foreground">
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)}
                className="border border-border bg-background px-3 py-2.5 font-mono text-xs text-foreground focus:outline-none focus:border-foreground" />
            </div>
            <button onClick={saveTask} disabled={savingTask || !taskTitle.trim()}
              className="border border-foreground bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.22em] px-5 py-2.5 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-40">
              {savingTask ? "Saving..." : "Create Task"}
            </button>
          </div>

          {tasks.length === 0 && <p className="font-mono text-xs text-muted-foreground">No tasks yet.</p>}
          {["open", "in_progress", "completed"].map(status => {
            const group = tasks.filter(t => t.status === status);
            if (group.length === 0) return null;
            const statusColors = { open: "text-yellow-400", in_progress: "text-blue-400", completed: "text-muted-foreground" };
            return (
              <div key={status} className="border border-border">
                <div className="px-5 py-3 border-b border-border bg-secondary flex items-center gap-3">
                  <span className={`font-mono text-[10px] uppercase tracking-[0.22em] ${statusColors[status]}`}>{status.replace("_", " ")}</span>
                  <span className="font-mono text-[10px] text-muted-foreground/40">{group.length}</span>
                </div>
                {group.map((t, i) => (
                  <div key={t.id} className={`flex items-start justify-between px-5 py-4 gap-4 ${i < group.length - 1 ? "border-b border-border/50" : ""}`}>
                    <div className="flex-1">
                      <p className={`font-mono text-xs ${status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.title}</p>
                      {t.due_date && <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">Due: {fmtDate(t.due_date)}</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {t.status !== "in_progress" && t.status !== "completed" && (
                        <button onClick={() => updateTask(t.id, { status: "in_progress" })} className="font-mono text-[9px] uppercase tracking-[0.14em] border border-blue-400/30 px-2 py-1 text-blue-400 hover:bg-blue-400/10 transition-colors">Start</button>
                      )}
                      {t.status !== "completed" && (
                        <button onClick={() => updateTask(t.id, { status: "completed" })} className="font-mono text-[9px] uppercase tracking-[0.14em] border border-green-400/30 px-2 py-1 text-green-400 hover:bg-green-400/10 transition-colors">Done</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}