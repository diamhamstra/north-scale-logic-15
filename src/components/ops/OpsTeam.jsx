import React, { useState } from "react";
import { base44 } from "@/api/base44Client";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function OpsTeam({ allUsers, user }) {
  const [users, setUsers] = useState(allUsers);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteMsg, setPromoteMsg] = useState("");

  const handlePromote = async (e) => {
    e.preventDefault();
    setPromoteLoading(true);
    setPromoteMsg("");
    const target = users.find(u => u.email?.toLowerCase() === promoteEmail.toLowerCase());
    if (!target) { setPromoteMsg("No user found with that email."); setPromoteLoading(false); return; }
    await base44.entities.User.update(target.id, { role: "admin" });
    setUsers(prev => prev.map(u => u.id === target.id ? { ...u, role: "admin" } : u));
    setPromoteMsg(`${target.full_name || target.email} promoted to admin.`);
    setPromoteEmail("");
    setPromoteLoading(false);
  };

  const handleDemote = async (userId) => {
    await base44.entities.User.update(userId, { role: "user" });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: "user" } : u));
  };

  const admins = users.filter(u => u.role === "admin");
  const regularUsers = users.filter(u => u.role !== "admin");

  return (
    <div className="px-6 sm:px-8 py-8">
      <div className="mb-8"></div>

      {/* Stats */}
      <div className="grid grid-cols-3 border border-border mb-8">
        {[
          { label: "Total Users", value: users.length },
          { label: "Administrators", value: admins.length, color: "text-yellow-400" },
          { label: "Investors", value: regularUsers.length },
        ].map((s, i) => (
          <div key={s.label} className={`p-5 ${i < 2 ? "border-r border-border" : ""}`}>
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1">{s.label}</p>
            <p className={`font-heading text-3xl ${s.color || "text-foreground"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Grant admin */}
      <div className="border border-border p-6 mb-8 max-w-lg">
        <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground mb-3">Grant Admin Access</p>
        <p className="font-mono text-[10px] leading-6 text-muted-foreground mb-4">
          Promote an existing user to administrator. They can then log in via <span className="text-foreground">/admin-login</span>.
        </p>
        <form onSubmit={handlePromote} className="flex gap-3">
          <input type="email" required value={promoteEmail} onChange={e => setPromoteEmail(e.target.value)} placeholder="user@email.com"
            className="flex-1 border border-border bg-background px-4 py-2.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground" />
          <button type="submit" disabled={promoteLoading}
            className="border border-foreground bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50 whitespace-nowrap">
            {promoteLoading ? "..." : "Promote"}
          </button>
        </form>
        {promoteMsg && <p className={`mt-3 font-mono text-[10px] ${promoteMsg.includes("No user") ? "text-red-400" : "text-green-400"}`}>{promoteMsg}</p>}
      </div>

      {/* Admin table */}
      <div className="border border-border mb-6">
        <div className="px-5 py-4 border-b border-border bg-secondary">
          <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground">Administrators</p>
        </div>
        {admins.length === 0 && <p className="px-5 py-8 font-mono text-xs text-muted-foreground">No administrators.</p>}
        {admins.map((u, i) => (
          <div key={u.id} className={`flex items-center justify-between px-5 py-4 ${i < admins.length - 1 ? "border-b border-border/50" : ""}`}>
            <div>
              <p className="font-mono text-xs text-foreground">{u.full_name || "—"}</p>
              <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">{u.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-yellow-400 border border-yellow-400/20 px-2 py-0.5">Admin</span>
              {u.id === user?.id
                ? <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-[0.14em]">You</span>
                : <button onClick={() => handleDemote(u.id)} className="border border-red-400/20 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-red-400 hover:bg-red-400/10 transition-colors">Revoke</button>
              }
            </div>
          </div>
        ))}
      </div>

      {/* All users table */}
      <div className="border border-border overflow-x-auto">
        <div className="px-5 py-4 border-b border-border bg-secondary">
          <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground">All Platform Users</p>
        </div>
        <table className="w-full font-mono text-xs min-w-[500px]">
          <thead>
            <tr className="border-b border-border/60">
              {["Name", "Email", "Role", "Joined"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={`hover:bg-secondary/20 transition-colors ${i < users.length - 1 ? "border-b border-border/40" : ""}`}>
                <td className="px-5 py-3 text-foreground">{u.full_name || "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`font-mono text-[9px] uppercase tracking-[0.14em] ${u.role === "admin" ? "text-yellow-400" : "text-muted-foreground"}`}>
                    {u.role || "user"}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(u.created_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}