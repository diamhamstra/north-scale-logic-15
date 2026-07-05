import React, { useEffect, useState, useRef } from "react";
import { ArrowDown, Download } from "lucide-react";

// Market sessions with accurate open/close in local exchange time
const MARKETS = [
{ city: "Tokyo", tz: "Asia/Tokyo", open: 9, close: 15.5 },
{ city: "Singapore", tz: "Asia/Singapore", open: 9, close: 17 },
{ city: "Abu Dhabi", tz: "Asia/Dubai", open: 10, close: 14 },
{ city: "London", tz: "Europe/London", open: 8, close: 16.5 },
{ city: "Amsterdam", tz: "Europe/Amsterdam", open: 9, close: 17.5 },
{ city: "New York", tz: "America/New_York", open: 9.5, close: 16 },
];


function getMarketStatus(tz, open, close) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "numeric", minute: "numeric",
    weekday: "short", hour12: false
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const weekday = get("weekday");
  const h = parseInt(get("hour") || "0", 10);
  const m = parseInt(get("minute") || "0", 10);
  const decimal = h + m / 60;
  const isWeekend = weekday === "Sat" || weekday === "Sun";
  return !isWeekend && decimal >= open && decimal < close;
}

function getCityTime(tz) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).format(new Date());
}

export default function HeroSection() {
  const [tick, setTick] = useState(0);
  const rafRef = useRef(null);
  const lastSecRef = useRef(-1);

  // Tick exactly on each wall-clock second using rAF for precision
  useEffect(() => {
    const loop = () => {
      const s = new Date().getSeconds();
      if (s !== lastSecRef.current) {
        lastSecRef.current = s;
        setTick((t) => t + 1);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden border-b border-border bg-background pt-40">
      <div className="technical-grid absolute inset-0 opacity-45" aria-hidden="true" />

      {/* Real mountain photograph — full background on mobile, right half on desktop */}
      <div className="pointer-events-none absolute inset-0 lg:inset-auto lg:top-0 lg:bottom-0 lg:right-0 lg:w-[62%]" aria-hidden="true">
        <img
          src={"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80&fit=crop"}
          alt=""
          className="h-full w-full object-cover object-center"
          style={{ maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 25%, rgba(0,0,0,0.8) 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 25%, rgba(0,0,0,0.8) 100%)" }} />
        
        <div className="absolute inset-0 bg-background/50" />
      </div>

      {/* Download buttons */}
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
        <a
          href="/north-scale-logo.svg"
          download="north-scale-logo.svg"
          className="flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
          
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Download logo</span>
        </a>
      </div>

      {/* REMOVE OLD SVG */}
      <svg style={{ display: "none" }}
      className="pointer-events-none absolute bottom-0 right-0 h-[90%] w-auto max-w-[65%] opacity-[0.055]"
      viewBox="0 0 700 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true">
        
        {/* Mountain range */}
        <polyline
          points="0,600 80,380 160,480 280,180 340,280 420,80 500,260 560,180 640,320 700,240 700,600"
          stroke="#F8FAFC"
          strokeWidth="1.5"
          fill="none" />
        
        {/* Secondary ridge */}
        <polyline
          points="0,600 60,440 140,520 240,320 300,420 420,80 500,260 700,240 700,600"
          stroke="#F8FAFC"
          strokeWidth="0.75"
          strokeDasharray="4 6"
          fill="none" />
        
        {/* Snow cap left peak */}
        <polyline points="260,220 280,180 300,220" stroke="#F8FAFC" strokeWidth="1" fill="none" />
        {/* Snow cap main peak */}
        <polyline points="400,112 420,80 440,112" stroke="#F8FAFC" strokeWidth="1.2" fill="none" />

        {/* Compass rose — centered top-left of mountain */}
        <g transform="translate(100, 160)">
          {/* Outer ring */}
          <circle cx="0" cy="0" r="52" stroke="#F8FAFC" strokeWidth="0.8" fill="none" />
          <circle cx="0" cy="0" r="44" stroke="#F8FAFC" strokeWidth="0.4" fill="none" />
          {/* Cardinal tick marks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = deg * Math.PI / 180;
            const inner = deg % 90 === 0 ? 44 : 47;
            return (
              <line
                key={deg}
                x1={Math.sin(rad) * inner}
                y1={-Math.cos(rad) * inner}
                x2={Math.sin(rad) * 52}
                y2={-Math.cos(rad) * 52}
                stroke="#F8FAFC"
                strokeWidth={deg % 90 === 0 ? "1" : "0.6"} />);


          })}
          {/* North arrow */}
          <polygon points="0,-38 -5,-12 5,-12" fill="#F8FAFC" />
          {/* South arrow */}
          <polygon points="0,38 -4,14 4,14" fill="none" stroke="#F8FAFC" strokeWidth="0.8" />
          {/* East / West lines */}
          <line x1="-38" y1="0" x2="-14" y2="0" stroke="#F8FAFC" strokeWidth="0.8" />
          <line x1="14" y1="0" x2="38" y2="0" stroke="#F8FAFC" strokeWidth="0.8" />
          {/* Centre dot */}
          <circle cx="0" cy="0" r="3" fill="#F8FAFC" />
          {/* N label */}
          <text x="-4" y="-56" fill="#F8FAFC" fontSize="9" fontFamily="IBM Plex Mono" letterSpacing="2">N</text>
        </g>

        {/* Altitude contour lines */}
        <ellipse cx="420" cy="120" rx="30" ry="12" stroke="#F8FAFC" strokeWidth="0.5" fill="none" strokeDasharray="3 5" />
        <ellipse cx="420" cy="120" rx="60" ry="28" stroke="#F8FAFC" strokeWidth="0.4" fill="none" strokeDasharray="3 6" />
        <ellipse cx="280" cy="200" rx="22" ry="9" stroke="#F8FAFC" strokeWidth="0.4" fill="none" strokeDasharray="3 5" />
      </svg>

      <div className="absolute bottom-0 left-1/2 top-20 hidden w-px bg-border lg:block" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl grid-cols-1 px-5 sm:px-8 lg:grid-cols-12">
        <div className="flex flex-col justify-center border-border py-10 lg:col-span-6 lg:border-r lg:-ml-12 lg:pr-10 lg:pt-8 lg:-mt-24">
          <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground">
            multi strategy investment firm
          </p>
          <h1 className="font-heading leading-[1.1] tracking-tight text-foreground text-8xl sm:text-8xl lg:text-8xl">systematic.
          <br />
          at scale.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">Systematic strategies across commodities, equity indices, and digital assets.

          </p>
        </div>
        <aside className="flex flex-col gap-6 border-t border-border py-10 lg:col-span-6 lg:justify-between lg:border-t-0 lg:pl-8 lg:pt-24">
          {/* Market Clocks — premium systematic terminal */}
          <div style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
            {/* Header row */}
            <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
              <span className="font-mono text-[9px] uppercase tracking-[0.32em] font-bold" style={{ color: "rgba(255,255,255,1)" }}>market hours</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] font-bold" style={{ color: "rgba(255,255,255,1)" }}>UTC {new Intl.DateTimeFormat("en-US", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date())}</span>
            </div>
            {MARKETS.map((m, i) => {
              const open = getMarketStatus(m.tz, m.open, m.close);
              const isLast = i === MARKETS.length - 1;
              return (
                <div key={m.city} className="flex items-center justify-between px-3 py-2.5"
                style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.07)" }}>
                  {/* City name — sans-serif feel via tracking */}
                  <span className="font-mono text-[11px] tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.45)", minWidth: 90 }}>{m.city}</span>
                  {/* Status dot */}
                  <div className="flex items-center gap-2.5 ml-auto">
                    {open ?
                    <span className="relative flex h-[7px] w-[7px]">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-emerald-400" />
                      </span> :

                    <span className="inline-flex rounded-full h-[7px] w-[7px]" style={{ background: "rgba(255,255,255,0.15)" }} />
                    }
                    {/* Live ticking time — monospace prevents layout shift */}
                    <span className="font-mono text-[13px] tabular-nums" style={{ color: open ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.45)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em", minWidth: 72 }}>
                      {getCityTime(m.tz)}
                    </span>
                  </div>
                </div>);


            })}
          </div>
          {/* Asset Class Links - hidden on mobile, shown on lg */}
          <div className="hidden lg:block mt-1 space-y-5 border-l border-border pl-6 font-mono text-xs uppercase tracking-[0.2em]">
            <a href="#commodities" className="block text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer">Commodities</a>
            <a href="#digital-assets" className="block text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer">Digital Assets</a>
            <a href="#equity-indices" className="block text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer">Equity Indices</a>
            <a href="#fx" className="block text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer">FX</a>
          </div>
          
        </aside>
      </div>
    </section>);

}