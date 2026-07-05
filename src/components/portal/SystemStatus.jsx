import React, { useState, useEffect } from "react";
import { Activity } from "lucide-react";

const SERVICES = [
  { name: "Portal", key: "portal" },
  { name: "Investor Dashboard", key: "dashboard" },
  { name: "Research Engine Performance Feed", key: "performance" },
  { name: "Email Delivery", key: "email" },
  { name: "Authentication", key: "auth" },
  { name: "Document Storage", key: "documents" },
];

const STATUS_COLORS = {
  Operational: "text-green-400",
  Investigating: "text-yellow-400",
  Maintenance: "text-blue-400",
  "Partial Outage": "text-orange-400",
  Resolved: "text-green-400",
};

export default function SystemStatus() {
  const [status, setStatus] = useState(
    SERVICES.map(s => ({ ...s, status: "Operational", lastUpdated: new Date().toISOString() }))
  );

  const allOperational = status.every(s => s.status === "Operational");

  return (
    <div>
      {/* Status Overview */}
      <div className={`border p-6 mb-8 ${allOperational ? "border-green-400/30 bg-green-400/5" : "border-yellow-400/30 bg-yellow-400/5"}`}>
        <div className="flex items-center gap-3 mb-2">
          <Activity className={`w-5 h-5 ${allOperational ? "text-green-400" : "text-yellow-400"}`} />
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
            System Status
          </p>
        </div>
        <p className={`font-heading text-2xl ${allOperational ? "text-green-400" : "text-yellow-400"}`}>
          {allOperational ? "All Systems Operational" : "Some Services Experiencing Issues"}
        </p>
        <p className="font-mono text-xs text-muted-foreground mt-2">
          Last updated: {new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Services List */}
      <div className="space-y-2">
        {status.map(service => (
          <div key={service.key} className="border border-border p-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-xs text-foreground">{service.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-[9px] uppercase tracking-[0.22em] ${STATUS_COLORS[service.status]}`}>
                {service.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}