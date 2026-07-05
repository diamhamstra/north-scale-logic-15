import React, { useRef } from "react";

const FORMATS = [
  { label: "YouTube Profile Photo", width: 800, height: 800, desc: "800 × 800 px · square" },
  { label: "YouTube Channel Art", width: 2560, height: 1440, desc: "2560 × 1440 px · 16:9" },
  { label: "Logo Landscape", width: 1200, height: 400, desc: "1200 × 400 px · landscape" },
];

function downloadSVGasPNG(svgString, width, height, filename) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const img = new Image();
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  img.src = url;
}

function buildSVG(width, height) {
  const bg = "#0a1120";
  const fg = "#f4f1ea";
  const slashColor = "#888888";

  // Scale logo to fit nicely
  const logoW = Math.min(width * 0.6, 600);
  const logoH = logoW * (40 / 280);
  const x = (width - logoW) / 2;
  const y = (height - logoH) / 2;

  const scale = logoW / 280;
  const fontSize = 18 * scale;
  const slashSize = 28 * scale;
  const textY = y + 26 * scale;
  const slashY = y + 28 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <text x="${x}" y="${slashY}" fill="${slashColor}" font-size="${slashSize}" font-family="monospace" font-weight="300">/</text>
  <text x="${x + 24 * scale}" y="${textY}" fill="${fg}" font-size="${fontSize}" font-family="Georgia, serif" letter-spacing="${4.5 * scale}"
    style="letter-spacing:${4.5 * scale}px">north scale</text>
  <text x="${x + 268 * scale}" y="${slashY}" fill="${slashColor}" font-size="${slashSize}" font-family="monospace" font-weight="300">/</text>
</svg>`;
}

export default function LogoDownload() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-20">
      <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-4">brand assets</p>
      <h1 className="font-heading text-4xl sm:text-5xl lowercase text-foreground mb-16 text-center">
        logo download
      </h1>

      {/* Live preview */}
      <div
        className="mb-16 flex items-center justify-center border border-border"
        style={{ background: "#0a1120", width: "100%", maxWidth: 560, height: 180 }}
      >
        <div className="flex items-center gap-1">
          <span className="font-mono text-2xl font-light text-[#888888]">/</span>
          <span className="font-heading text-2xl tracking-[0.28em] text-[#f4f1ea] px-2">north scale</span>
          <span className="font-mono text-2xl font-light text-[#888888]">/</span>
        </div>
      </div>

      {/* Format cards */}
      <div className="grid gap-4 w-full max-w-2xl">
        {FORMATS.map((f) => (
          <div
            key={f.label}
            className="border border-border bg-card flex items-center justify-between px-6 py-5"
          >
            <div>
              <p className="font-mono text-xs text-foreground mb-1">{f.label}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{f.desc}</p>
            </div>
            <button
              onClick={() => downloadSVGasPNG(buildSVG(f.width, f.height), f.width, f.height, `northscale-logo-${f.label.toLowerCase().replace(/\s+/g, "-")}.png`)}
              className="font-mono text-[10px] uppercase tracking-[0.28em] border border-border text-foreground px-5 py-2.5 hover:bg-secondary/40 transition-colors"
            >
              download
            </button>
          </div>
        ))}
      </div>

      <p className="mt-10 font-mono text-[10px] text-muted-foreground text-center">
        all exports use dark navy background (#0a1120) with off-white brand mark (#f4f1ea)
      </p>
    </div>
  );
}