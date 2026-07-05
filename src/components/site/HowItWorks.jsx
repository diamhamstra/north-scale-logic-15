import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Step 01", title: "open your broker account" },
  { id: 2, label: "Step 02", title: "connect algorithm" },
  { id: 3, label: "Step 03", title: "strategy activates" },
  { id: 4, label: "Step 04", title: "track performance" },
];

const ALLOC_OPTIONS = [
  { label: "$1,000", value: 1000 },
  { label: "$5,000", value: 5000 },
  { label: "$10,000", value: 10000 },
  { label: "$25,000", value: 25000 },
  { label: "$100,000", value: 100000 },
];

const ENGINES = [
  { key: "commodities", name: "Commodities", tag: "Algorithm I", returns: "28–44% est.", low: 0.28, high: 0.44 },
  { key: "fx", name: "FX — AUD/NZD", tag: "Algorithm II", returns: "18–32% est.", low: 0.18, high: 0.32 },
  { key: "digital", name: "Digital Assets", tag: "Algorithm III", returns: "35–60% est.", low: 0.35, high: 0.60 },
];

function ProgressChart({ running }) {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let v = 100;
    pointsRef.current = [];
    for (let i = 0; i < 40; i++) {
      v += (Math.random() - 0.42) * 1.4;
      pointsRef.current.push(Math.max(97, v));
    }
    function draw() {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
      const pts = pointsRef.current;
      if (!pts.length) return;
      const mn = Math.min(...pts) - 0.5;
      const mx = Math.max(...pts) + 0.5;
      const py = (val) => H - ((val - mn) / (mx - mn)) * (H - 16) - 8;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 0.5;
      [0.25, 0.5, 0.75].forEach((t) => {
        const y = H - t * (H - 16) - 8;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      });
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      pts.forEach((val, i) => {
        const x = (i / (pts.length - 1)) * W;
        i === 0 ? ctx.moveTo(x, py(val)) : ctx.lineTo(x, py(val));
      });
      ctx.stroke();
    }
    draw();
    intervalRef.current = setInterval(() => {
      v += (Math.random() - 0.42) * 1.4;
      pointsRef.current.push(Math.max(97, v));
      if (pointsRef.current.length > 80) pointsRef.current.shift();
      draw();
    }, 500);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

export default function HowItWorks() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [vtId, setVtId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectMsg, setConnectMsg] = useState("");
  const [allocIdx, setAllocIdx] = useState(0);
  const [selEngine, setSelEngine] = useState(null);
  const [activating, setActivating] = useState(false);
  const [activateMsg, setActivateMsg] = useState("");
  const [activatePct, setActivatePct] = useState(0);
  const [mtd, setMtd] = useState("+0.00%");
  const [mtdPositive, setMtdPositive] = useState(true);
  const [positions, setPositions] = useState(0);

  function handleConnect() {
    setConnecting(true);
    const msgs = ["verifying account...", "checking referral status...", "confirming mt5 raw ecn settings...", "syncing with north scale...", "✓ account verified."];
    let i = 0;
    setConnectMsg(msgs[0]);
    const iv = setInterval(() => {
      i++;
      if (i < msgs.length - 1) { setConnectMsg(msgs[i]); }
      else { clearInterval(iv); setConnectMsg(msgs[msgs.length - 1]); setTimeout(() => setStep(2), 700); }
    }, 650);
  }

  function handleActivate() {
    setActivating(true);
    const steps = [
      ["initializing quant model...", 18], ["loading historical data...", 38],
      ["calibrating risk parameters...", 58], ["connecting to metacopier...", 76],
      ["linking broker account...", 92], ["strategy activated.", 100],
    ];
    let i = 0;
    function next() {
      if (i >= steps.length) { setTimeout(() => setStep(4), 500); return; }
      setActivateMsg(steps[i][0]); setActivatePct(steps[i][1]); i++;
      setTimeout(next, 580);
    }
    next();
  }

  useEffect(() => {
    if (step !== 4) return;
    let v = 100;
    const iv = setInterval(() => {
      v += (Math.random() - 0.42) * 1.4;
      const diff = (v - 100).toFixed(2);
      setMtdPositive(parseFloat(diff) >= 0);
      setMtd((parseFloat(diff) >= 0 ? "+" : "") + diff + "%");
      setPositions(Math.floor(Math.random() * 4) + 2);
    }, 500);
    return () => clearInterval(iv);
  }, [step]);

  const stepDone = (n) => step > n;
  const stepActive = (n) => step === n;

  return (
    <section className="border-b border-border bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-16 max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground">how it works</p>
          <h2 className="mt-4 font-heading text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">experience the north scale investment process.</h2>
          <p className="mt-5 max-w-xl font-mono text-xs leading-7 text-muted-foreground">four steps from setup to live strategy execution across global markets.</p>
        </div>

        <div className="mb-12 flex gap-0 border-b border-border">
          {STEPS.map((s) => (
            <button key={s.id} onClick={() => step >= s.id && setStep(s.id)}
              className={["mr-8 border-b-[1.5px] pb-3 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors duration-200",
                stepActive(s.id) ? "-mb-px border-foreground text-foreground" : stepDone(s.id) ? "border-transparent text-green-500 cursor-pointer" : "border-transparent text-muted-foreground cursor-default"].join(" ")}>
              {stepDone(s.id) ? <span className="flex items-center gap-1.5"><Check className="h-3 w-3" />{s.label}</span> : s.label}
            </button>
          ))}
        </div>

        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">

            {step === 1 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-8">step 1 of 4 — open your broker account</p>
                <div className="border border-border p-8 mb-8">
                  <div className="mb-8">
                    <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Broker / Exchange</p>
                    <p className="font-heading text-3xl text-foreground">VT Markets</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => setStep(2)}
                      className="inline-flex min-h-[44px] items-center justify-center gap-3 border border-foreground bg-foreground px-6 py-3 font-mono text-xs uppercase tracking-[0.24em] text-background transition-colors hover:bg-transparent hover:text-foreground">
                      create demo account <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="font-mono text-[9px] text-muted-foreground/50 leading-5">
                  North Scale operates exclusively through VT Markets as our regulated broker partner. Account creation takes approximately 10 minutes.
                </p>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-6">step 2 of 4 — set your allocation & strategy</p>
                <div className="border border-border p-6 mb-6">
                  <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-3">Monthly Allocation</p>
                  <p className="font-heading text-3xl text-foreground mb-1">{ALLOC_OPTIONS[allocIdx].label}</p>
                  {selEngine ? (() => {
                    const eng = ENGINES.find(e => e.key === selEngine);
                    const val = ALLOC_OPTIONS[allocIdx].value;
                    const lo = Math.round(val * eng.low).toLocaleString();
                    const hi = Math.round(val * eng.high).toLocaleString();
                    return <p className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] mb-4">est. annual return: ${lo} – ${hi}</p>;
                  })() : <p className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] mb-4">select a strategy to see est. return</p>}
                  <input type="range" min="0" max="4" step="1" value={allocIdx} onChange={(e) => setAllocIdx(Number(e.target.value))} className="w-full accent-foreground" />
                  <div className="flex justify-between mt-1">
                    {ALLOC_OPTIONS.map((o) => <span key={o.label} className="font-mono text-[8px] text-muted-foreground/60">{o.label}</span>)}
                  </div>
                </div>
                <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-3">Select Strategy</p>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {ENGINES.map((e) => (
                    <button key={e.key} onClick={() => setSelEngine(e.key)}
                      className={["border p-4 text-left transition-colors", selEngine === e.key ? "border-foreground" : "border-border hover:border-muted-foreground"].join(" ")}>
                      <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-muted-foreground mb-1">{e.tag}</p>
                      <p className="font-mono text-xs text-foreground mb-2">{e.name}</p>
                      <p className="font-mono text-[9px] text-green-500">↑ {e.returns}</p>
                      {selEngine === e.key && <Check className="h-3 w-3 text-green-500 mt-2" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="inline-flex min-h-[44px] items-center border border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground hover:border-foreground hover:text-foreground transition-colors">← back</button>
                  <button disabled={!selEngine} onClick={() => { setActivating(false); setActivatePct(0); setActivateMsg(""); setStep(3); }}
                    className="inline-flex min-h-[44px] items-center gap-4 border border-border px-6 py-3 font-mono text-xs uppercase tracking-[0.24em] text-foreground hover:border-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    confirm <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-6">step 3 of 4 — activate your strategy</p>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { l: "Strategy", v: ENGINES.find((e) => e.key === selEngine)?.name },
                    { l: "Allocation", v: ALLOC_OPTIONS[allocIdx].label },
                    { l: "Broker", v: "VT Markets · MT5" },
                  ].map((item) => (
                    <div key={item.l} className="border border-border p-4">
                      <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-2">{item.l}</p>
                      <p className="font-mono text-xs text-foreground">{item.v}</p>
                    </div>
                  ))}
                </div>
                {activating && (
                  <div className="mb-6">
                    <div className="h-px bg-border overflow-hidden mb-2">
                      <div className="h-full bg-foreground transition-all duration-500" style={{ width: `${activatePct}%` }} />
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground tracking-[0.1em]">{activateMsg}</p>
                  </div>
                )}
                <div className="flex gap-4">
                  <button onClick={() => setStep(2)} className="inline-flex min-h-[44px] items-center border border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground hover:border-foreground hover:text-foreground transition-colors">← back</button>
                  <button disabled={activating} onClick={handleActivate}
                    className="inline-flex min-h-[44px] items-center gap-4 border border-border px-6 py-3 font-mono text-xs uppercase tracking-[0.24em] text-foreground hover:border-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    {activating ? "activating..." : <><span>activate strategy</span><ArrowRight className="h-4 w-4" /></>}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-6">step 4 of 4 — your strategy is live</p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="border border-border p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Status</p>
                    <p className="font-mono text-xs text-foreground flex items-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />live</p>
                  </div>
                  <div className="border border-border p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-2">MTD Return</p>
                    <p className={`font-mono text-xs ${mtdPositive ? "text-green-500" : "text-red-400"}`}>{mtd}</p>
                  </div>
                  <div className="border border-border p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Open Positions</p>
                    <p className="font-mono text-xs text-foreground">{positions}</p>
                  </div>
                </div>
                <div className="border border-border p-4 mb-6">
                  <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-3">Performance — live simulation</p>
                  <div style={{ height: "140px" }}><ProgressChart running={true} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: "Engine", v: ENGINES.find((e) => e.key === selEngine)?.name },
                    { l: "Allocation", v: ALLOC_OPTIONS[allocIdx].label },
                    { l: "Next Report", v: "1 Aug 2026" },
                  ].map((item) => (
                    <div key={item.l} className="border border-border p-4">
                      <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-2">{item.l}</p>
                      <p className="font-mono text-xs text-foreground">{item.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <div className="divide-y divide-border border border-border">
              {STEPS.map((s) => (
                <div key={s.id} className="p-6">
                  <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1">{s.label}</p>
                  <p className={["font-heading text-lg leading-snug", stepActive(s.id) ? "text-foreground" : "text-muted-foreground/40"].join(" ")}>{s.title}</p>
                  {stepDone(s.id) && <div className="mt-2 flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /><span className="font-mono text-[9px] text-green-500">complete</span></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}