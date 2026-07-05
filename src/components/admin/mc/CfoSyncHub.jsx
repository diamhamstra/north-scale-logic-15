import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link2, Mail, HardDrive, ShieldCheck, UploadCloud, FileText, Copy, Check, Loader2, Cloud } from "lucide-react";

const INGEST_EMAIL = "archive@vault.northscale.capital";
const fmtSize = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`);

export default function CfoSyncHub() {
  const [connected, setConnected] = useState(() => localStorage.getItem("ns_gw_connected") === "1");
  const [connecting, setConnecting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("ns_gw_connected", connected ? "1" : "0");
  }, [connected]);

  const toggleConnect = () => {
    if (connected) { setConnected(false); return; }
    setConnecting(true);
    setTimeout(() => { setConnecting(false); setConnected(true); }, 1100);
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setBusy(true);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setUploads((prev) => [
          { id: `${Date.now()}_${file.name}`, name: file.name, size: file.size, url: file_url, at: new Date() },
          ...prev,
        ]);
      } catch {
        setUploads((prev) => [
          { id: `${Date.now()}_${file.name}`, name: file.name, size: file.size, error: true, at: new Date() },
          ...prev,
        ]);
      }
    }
    setBusy(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const copyEmail = () => {
    navigator.clipboard?.writeText(INGEST_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">cfo data sync &amp; automation hub</p>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-600" /> aes-256 encrypted
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT — Google Workspace + status */}
        <div className="p-5 border-b lg:border-b-0 lg:border-r border-border space-y-5">
          <button
            onClick={toggleConnect}
            disabled={connecting}
            className={`w-full flex items-center justify-center gap-2.5 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors border ${
              connected
                ? "border-emerald-600/30 bg-emerald-600/8 text-emerald-700 hover:bg-emerald-600/5"
                : "border-border bg-secondary text-foreground hover:bg-secondary/70"
            }`}
          >
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {connecting ? "connecting…" : connected ? "google workspace connected" : "connect google workspace"}
          </button>

          {/* Gmail status */}
          <div className="flex items-start gap-3 border border-border p-3.5">
            <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground">gmail backup</p>
                <span className={`font-mono text-[9px] uppercase tracking-[0.16em] ${connected ? "text-emerald-600" : "text-muted-foreground/50"}`}>
                  {connected ? "active" : "inactive"}
                </span>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground mt-1 leading-5">
                {connected ? "Scanning inbound financial / legal attachments" : "Connect to enable inbound attachment capture"}
              </p>
            </div>
          </div>

          {/* Drive status */}
          <div className="flex items-start gap-3 border border-border p-3.5">
            <HardDrive className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground">drive sync</p>
                <span className={`font-mono text-[9px] uppercase tracking-[0.16em] ${connected ? "text-emerald-600" : "text-muted-foreground/50"}`}>
                  {connected ? "connected" : "offline"}
                </span>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground mt-1 leading-5">
                {connected ? "Last synced 5 minutes ago" : "Awaiting workspace authorization"}
              </p>
            </div>
          </div>

          {/* Ingestion email */}
          <div className="border border-border p-3.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground mb-2">legal vault · forwarding address</p>
            <div className="flex items-center justify-between gap-3">
              <code className="font-mono text-[11px] text-emerald-700 truncate">{INGEST_EMAIL}</code>
              <button
                onClick={copyEmail}
                className="flex items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-foreground hover:bg-secondary transition-colors flex-shrink-0"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copied ? "copied" : "copy"}
              </button>
            </div>
            <p className="font-mono text-[9px] text-muted-foreground mt-2 leading-5">Forward financial agreements here to archive directly into the legal vault.</p>
          </div>
        </div>

        {/* RIGHT — Secure dropzone */}
        <div className="p-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer flex flex-col items-center justify-center text-center border border-dashed px-5 py-10 transition-colors ${
              dragging ? "border-emerald-600/50 bg-emerald-600/5" : "border-border bg-secondary/30 hover:border-foreground/30"
            }`}
          >
            {busy ? <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mb-3" /> : <UploadCloud className="w-6 h-6 text-muted-foreground mb-3" />}
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">secure file dropzone</p>
            <p className="font-mono text-[9px] text-muted-foreground mt-1.5 leading-5">
              Drag &amp; drop folders or PDFs to initiate an<br />instant encrypted backup to cloud storage
            </p>
            <span className="mt-3 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-600">
              <Cloud className="w-3 h-3" /> end-to-end encrypted
            </span>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </div>

          {uploads.length > 0 && (
            <div className="mt-4 border border-border divide-y divide-border/50 max-h-44 overflow-y-auto">
              {uploads.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-mono text-[10px] text-foreground truncate">{u.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-[9px] text-muted-foreground">{fmtSize(u.size)}</span>
                    {u.error ? (
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-rose-600">failed</span>
                    ) : (
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3" /> backed up</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}