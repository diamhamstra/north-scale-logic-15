import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";
const PRIORITIES = { high: { color: "text-red-400", dot: "bg-red-400" }, normal: { color: "text-yellow-400", dot: "bg-yellow-400" }, low: { color: "text-muted-foreground/50", dot: "bg-muted-foreground/30" } };
const STATUS_COLORS = { open: "text-yellow-400", in_progress: "text-blue-400", waiting: "text-muted-foreground", completed: "text-green-400" };
const TASK_TEMPLATES = ["Review Passport", "Approve Client", "Follow Up", "Schedule Meeting", "Upload Monthly Report", "KYC Review", "Send Agreement", "Verify MetaCopier", "Await Deposit", "Activate Engine", "Call Client", "Compliance Review"];

const EMPTY = { title: "", description: "", priority: "normal", status: "open", due_date: "" };

export default function OpsTasks({ tasks, setTasks, user, allUsers }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter(t => {
      if (filter !== "all" && t.status !== filter) return false;
      if (q && !t.title?.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => {
      const po = { high: 0, normal: 1, low: 2 };
      return (po[a.priority] || 1) - (po[b.priority] || 1);
    });
  }, [tasks, filter, search]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const t = await base44.entities.ClientTask.create({
      client_id: "ops",
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || undefined,
      assigned_to: user?.id,
      assigned_name: user?.full_name || user?.email,
    });
    setTasks(prev => [t, ...prev]);
    setForm(EMPTY);
    setShowForm(false);
    setSaving(false);
  };

  const update = async (id, updates) => {
    await base44.entities.ClientTask.update(id, updates);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const counts = {
    open: tasks.filter(t => t.status === "open").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    waiting: tasks.filter(t => t.status === "waiting").length,
    completed: tasks.filter(t => t.status === "completed").length,
  };

  return (
    <div className="px-6 sm:px-8 py-8">
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground mb-1">Operations</p>
          <h1 className="font-heading text-3xl text-foreground">Task Board</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="border border-foreground bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 hover:bg-transparent hover:text-foreground transition-colors">
          + New Task
        </button>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-4 border border-border mb-6">
        {[
          { key: "open", label: "Open" },
          { key: "in_progress", label: "In Progress" },
          { key: "waiting", label: "Waiting" },
          { key: "completed", label: "Completed" },
        ].map((s, i) => (
          <button key={s.key} onClick={() => setFilter(filter === s.key ? "all" : s.key)}
            className={`p-4 text-left transition-colors ${i < 3 ? "border-r border-border" : ""} ${filter === s.key ? "bg-secondary/50" : "hover:bg-secondary/20"}`}>
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground mb-1">{s.label}</p>
            <p className={`font-heading text-2xl ${STATUS_COLORS[s.key]}`}>{counts[s.key]}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
        className="border border-border bg-background px-4 py-2.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground w-full max-w-xs mb-5" />

      {/* Task list */}
      <div className="border border-border">
        {filtered.length === 0 && <p className="px-5 py-10 text-center font-mono text-xs text-muted-foreground">No tasks match the current filter.</p>}
        {filtered.map((t, i) => {
          const pri = PRIORITIES[t.priority] || PRIORITIES.normal;
          return (
            <div key={t.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors ${i < filtered.length - 1 ? "border-b border-border/50" : ""}`}>
              {/* Priority dot */}
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${pri.dot}`} />
              <div className="flex-1 min-w-0">
                <p className={`font-mono text-xs ${t.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.title}</p>
                {t.description && <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5 truncate">{t.description}</p>}
                <div className="flex items-center gap-3 mt-1.5">
                  {t.assigned_name && <span className="font-mono text-[9px] text-muted-foreground/50">{t.assigned_name}</span>}
                  {t.due_date && <span className="font-mono text-[9px] text-muted-foreground/50">Due {fmtDate(t.due_date)}</span>}
                  {t.client_id !== "ops" && t.client_id && <span className="font-mono text-[9px] text-muted-foreground/40">Client task</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`font-mono text-[9px] uppercase tracking-[0.14em] ${STATUS_COLORS[t.status] || "text-muted-foreground"}`}>
                  {t.status.replace("_", " ")}
                </span>
                {t.status === "open" && <button onClick={() => update(t.id, { status: "in_progress" })} className="font-mono text-[9px] border border-blue-400/30 px-2 py-1 text-blue-400 hover:bg-blue-400/10 transition-colors">Start</button>}
                {t.status === "in_progress" && <button onClick={() => update(t.id, { status: "waiting" })} className="font-mono text-[9px] border border-border px-2 py-1 text-muted-foreground hover:text-foreground transition-colors">Wait</button>}
                {t.status !== "completed" && <button onClick={() => update(t.id, { status: "completed" })} className="font-mono text-[9px] border border-green-400/30 px-2 py-1 text-green-400 hover:bg-green-400/10 transition-colors">Done</button>}
              </div>
            </div>
          );
        })}
      </div>

      {/* New task form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-background border border-border p-8 w-full max-w-md">
            <h3 className="font-heading text-xl text-foreground mb-5">New Task</h3>
            {/* Templates */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {TASK_TEMPLATES.map(t => (
                <button key={t} type="button" onClick={() => set("title", t)}
                  className="font-mono text-[9px] border border-border px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                  {t}
                </button>
              ))}
            </div>
            <form onSubmit={save} className="space-y-3">
              <input type="text" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Task title..." required
                className="w-full border border-border bg-background px-4 py-2.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground" />
              <textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Optional description..."
                className="w-full border border-border bg-background px-4 py-2.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.priority} onChange={e => set("priority", e.target.value)}
                  className="border border-border bg-background px-3 py-2.5 font-mono text-xs text-foreground focus:outline-none focus:border-foreground">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
                <input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)}
                  className="border border-border bg-background px-3 py-2.5 font-mono text-xs text-foreground focus:outline-none focus:border-foreground" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving || !form.title.trim()}
                  className="flex-1 border border-foreground bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.2em] py-3 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-40">
                  {saving ? "..." : "Create Task"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="border border-border px-5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}