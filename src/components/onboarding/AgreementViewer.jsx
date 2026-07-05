import React, { useState, useRef, useEffect } from "react";

export default function AgreementViewer({ agreement, onSign, alreadySigned }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 4) setScrolledToBottom(true);
  }, [agreement?.key]);

  if (!agreement) {
    return (
      <div className="border border-border p-6 font-mono text-xs text-muted-foreground">
        Agreement could not be loaded. Please refresh the page.
      </div>
    );
  }

  // Replace {{EFFECTIVE_DATE}} with the signed date if already signed, else today for preview
  const effectiveDate = alreadySigned?.effective_date || alreadySigned?.signed_date || "";
  const content = agreement.content || "";
  const displayContent = agreement.hasEffectiveDate
    ? content.replace("{{EFFECTIVE_DATE}}", effectiveDate || "[DATE — set upon signing]")
    : content;

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) setScrolledToBottom(true);
  };

  return (
    <div className="flex flex-col">
      <div className="border-b border-border pb-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-1">
              Version {agreement.version} · Required
            </p>
            <h3 className="font-heading text-2xl text-foreground">{agreement.title}</h3>
          </div>

        </div>
        {agreement.file_url && (
          <a
            href={agreement.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            ↓ Download official document (DOCX)
          </a>
        )}
        {alreadySigned && (
          <div className="mt-3 flex items-center gap-2">
            <span className="font-mono text-[10px] text-green-400">✓ Signed</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {alreadySigned.effective_date || alreadySigned.signed_date || alreadySigned.signed_at}
            </span>
          </div>
        )}
      </div>

      <div
        ref={contentRef}
        onScroll={handleScroll}
        className="overflow-y-auto border border-border bg-secondary/20 p-6 font-mono text-[11px] leading-7 text-muted-foreground whitespace-pre-wrap"
        style={{ height: "340px" }}
      >
        {displayContent}
      </div>

      {!scrolledToBottom && !alreadySigned && (
        <div className="mt-3 border border-border/50 bg-secondary/20 px-5 py-3 flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            You must read the document in full before signing
          </p>
          <span className="font-mono text-[10px] text-muted-foreground/50 flex-shrink-0 animate-pulse">↓ Scroll to continue</span>
        </div>
      )}

      {scrolledToBottom && !alreadySigned && (
        <div className="mt-5 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer border border-border p-4">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 border border-border bg-background accent-foreground cursor-pointer flex-shrink-0"
            />
            <span className="font-mono text-[10px] leading-6 text-muted-foreground">
              I confirm that I have read and understood this agreement in full.
            </span>
          </label>

          <button
            disabled={!confirmed}
            onClick={() => setShowSignModal(true)}
            className="w-full border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-8 py-3.5 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Sign &amp; Accept
          </button>
        </div>
      )}

      {alreadySigned && (
        <div className="mt-4 border border-green-400/20 bg-green-400/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-sm text-green-400">✓</span>
            <p className="font-mono text-[10px] text-green-400">Signed and accepted</p>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {alreadySigned.full_legal_name && (
              <p className="font-mono text-[10px] text-muted-foreground">
                <span className="text-muted-foreground/50">Name: </span>{alreadySigned.full_legal_name}
              </p>
            )}
            <p className="font-mono text-[10px] text-muted-foreground">
              <span className="text-muted-foreground/50">Date/time (UTC): </span>{alreadySigned.signed_at_utc || alreadySigned.signed_at}
            </p>
            {alreadySigned.ip_address && alreadySigned.ip_address !== "recorded" && (
              <p className="font-mono text-[10px] text-muted-foreground">
                <span className="text-muted-foreground/50">IP address: </span>{alreadySigned.ip_address}
              </p>
            )}
            <p className="font-mono text-[10px] text-muted-foreground">
              <span className="text-muted-foreground/50">Terms version: </span>{alreadySigned.version}
            </p>
            {alreadySigned.signature_value && (
              <div className="mt-2">
                <p className="font-mono text-[10px] text-muted-foreground/50 mb-1">Signature (PNG):</p>
                <img src={alreadySigned.signature_value} alt="Signature" className="border border-green-400/20 bg-background max-w-[200px]" />
              </div>
            )}
            {alreadySigned.document_url && (
              <a
                href={alreadySigned.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] text-green-400/80 hover:text-green-400 transition-colors"
              >
                ↓ Download signed document (PDF)
              </a>
            )}
          </div>
        </div>
      )}

      {showSignModal && (
        <SignatureModal
          agreement={agreement}
          onSign={(sigData) => { setShowSignModal(false); onSign(sigData); }}
          onClose={() => setShowSignModal(false)}
        />
      )}
    </div>
  );
}

function SignatureModal({ agreement, onSign, onClose }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPos = useRef(null);
  const [fullLegalName, setFullLegalName] = useState("");
  const [signedDate, setSignedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [nameError, setNameError] = useState("");
  const [dateError, setDateError] = useState("");

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    lastPos.current = getPos(e, canvas);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "hsl(210 40% 98%)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasDrawn(true);
  };

  const endDraw = (e) => {
    if (e) e.preventDefault();
    setDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSign = async () => {
    let valid = true;
    if (!fullLegalName.trim()) { setNameError("Full legal name is required."); valid = false; }
    if (!signedDate) { setDateError("Date is required."); valid = false; }
    if (!valid) return;

    const [year, month, day] = signedDate.split("-");
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const formattedDate = `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;

    const signedAtUtc = new Date().toISOString();
    let ipAddress = "unknown";
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      ipAddress = ipData.ip || "unknown";
    } catch (_) {}

    const signatureDataUrl = canvasRef.current.toDataURL("image/png");

    onSign({
      type: "drawn",
      value: signatureDataUrl,
      full_legal_name: fullLegalName.trim(),
      signed_date: signedDate,
      effective_date: formattedDate,
      signed_at_utc: signedAtUtc,
      ip_address: ipAddress,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl border border-border bg-background p-8 my-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-1">
              Electronic Signature
            </p>
            <h4 className="font-heading text-xl text-foreground">{agreement.title}</h4>
          </div>
          <button onClick={onClose} className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors ml-4">
            ✕ Cancel
          </button>
        </div>

        <div className="mb-5">
          <label className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
            Full Legal Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={fullLegalName}
            onChange={e => { setFullLegalName(e.target.value); setNameError(""); }}
            placeholder="As it appears on your passport"
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
          />
          {nameError && <p className="mt-1.5 font-mono text-[10px] text-red-400">{nameError}</p>}
        </div>

        <div className="mb-5">
          <label className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
            Date of Signing <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={signedDate}
            onChange={e => { setSignedDate(e.target.value); setDateError(""); }}
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
          />
          {dateError && <p className="mt-1.5 font-mono text-[10px] text-red-400">{dateError}</p>}
          {agreement.hasEffectiveDate && (
            <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/50">
              This date will appear as the Effective Date on the document.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Draw your signature
            </label>
            <button
              onClick={clearCanvas}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1"
            >
              Clear
            </button>
          </div>

          <div className="relative border border-border bg-secondary/20">
            <div className="absolute bottom-10 left-6 right-6 border-b border-border/40 pointer-events-none" />
            {!hasDrawn && (
              <p className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-muted-foreground/30 pointer-events-none select-none">
                Sign here using your mouse or finger
              </p>
            )}
            <canvas
              ref={canvasRef}
              width={700}
              height={200}
              className="w-full cursor-crosshair block"
              style={{ touchAction: "none" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground/50">
            Use your mouse or touchscreen to draw your signature above.
          </p>
        </div>

        <div className="mt-6 border-t border-border pt-5 space-y-4">
          <p className="font-mono text-[10px] leading-6 text-muted-foreground/60">
            By clicking Sign &amp; Accept, you confirm your drawn signature is legally binding and constitutes your acceptance of the {agreement.title}.
          </p>
          <button
            disabled={!hasDrawn}
            onClick={handleSign}
            className="w-full border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Sign &amp; Accept
          </button>
        </div>
      </div>
    </div>
  );
}