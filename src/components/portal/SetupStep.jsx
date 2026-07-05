import React, { useState } from "react";

function BackButton({ onBack }) {
  if (!onBack) return null;
  return (
    <button onClick={onBack}
      className="mb-6 font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
      ← back
    </button>
  );
}

// Generic step renderer for Digital/Equities engines
function GenericStep({ step, onComplete, onBack }) {
  const [checked, setChecked] = useState(false);
  const isLast = step.buttonLabel === "Finish Setup";

  return (
    <div className="border border-border bg-card p-6 sm:p-8">
      <BackButton onBack={onBack} />
      <p className="font-mono text-[10px] lowercase tracking-[0.36em] text-muted-foreground mb-4">
        step {step.number}
      </p>
      <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-4 lowercase">{step.title}</h2>
      <p className="font-mono text-xs leading-7 text-muted-foreground mb-8 max-w-xl lowercase">{step.description}</p>

      <div className="space-y-4 mb-8">
        {step.providerName && (
          <div className="border border-border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-1">platform</p>
              <p className="font-heading text-xl text-foreground lowercase">{step.providerName}</p>
            </div>
            {step.providerUrl && step.providerUrl !== "#" && (
              <a href={step.providerUrl} target="_blank" rel="noopener noreferrer"
                className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-6 py-3 hover:bg-border transition-colors text-center shrink-0">
                open provider →
              </a>
            )}
          </div>
        )}
        {step.brokerName && (
          <div className="border border-border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-1">broker</p>
              <p className="font-heading text-xl text-foreground lowercase">{step.brokerName}</p>
            </div>
            {step.brokerUrl && step.brokerUrl !== "#" && (
              <a href={step.brokerUrl} target="_blank" rel="noopener noreferrer"
                className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-6 py-3 hover:bg-border transition-colors text-center shrink-0">
                open broker →
              </a>
            )}
          </div>
        )}
        {step.strategyCode && (
          <StrategyCode code={step.strategyCode} instructions={step.searchInstructions} />
        )}
        {step.minimumAllocation && (
          <div className="space-y-4">
            <div className="border border-border p-5">
              <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-1">minimum suggested allocation</p>
              <p className="font-heading text-2xl text-foreground">{step.minimumAllocation}</p>
            </div>
            {step.fundingInstructions?.map((ins, i) => (
              <div key={i} className="bg-secondary/40 border border-border p-4">
                <p className="font-mono text-xs leading-6 text-muted-foreground lowercase">{ins}</p>
              </div>
            ))}
          </div>
        )}
        {step.connectionInstructions && (
          <div className="space-y-4">
            <div className="bg-secondary/40 border border-border p-4">
              <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-2">connection instructions</p>
              <p className="font-mono text-xs leading-6 text-muted-foreground lowercase">{step.connectionInstructions}</p>
            </div>
            {step.integrationGuide && (
              <div className="bg-secondary/40 border border-border p-4">
                <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-2">integration guide</p>
                <p className="font-mono text-xs leading-6 text-muted-foreground lowercase">{step.integrationGuide}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <SingleCheckbox checked={checked} onChange={setChecked} label={step.checkboxLabel} />
      <button onClick={onComplete} disabled={!checked}
        className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        {step.buttonLabel || (isLast ? "finish setup" : "continue →")}
      </button>
    </div>
  );
}

function StrategyCode({ code, instructions }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-4">
      <div className="border border-border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-1">strategy code</p>
          <p className="font-mono text-2xl tracking-[0.18em] text-foreground">{code}</p>
        </div>
        <button onClick={handleCopy}
          className="border border-border font-mono text-xs lowercase tracking-[0.24em] px-6 py-3 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors shrink-0">
          {copied ? "copied ✓" : "copy code"}
        </button>
      </div>
      {instructions && (
        <div className="bg-secondary/40 border border-border p-4">
          <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-2">instructions</p>
          <p className="font-mono text-xs leading-6 text-muted-foreground lowercase">{instructions}</p>
        </div>
      )}
    </div>
  );
}

function SingleCheckbox({ checked, onChange, label }) {
  return (
    <label className="flex items-start gap-4 cursor-pointer mb-6 group">
      <div onClick={() => onChange(!checked)}
        className={`mt-0.5 w-5 h-5 border shrink-0 flex items-center justify-center transition-colors ${checked ? "border-foreground bg-foreground" : "border-border group-hover:border-muted-foreground"}`}>
        {checked && <span className="text-background text-xs">✓</span>}
      </div>
      <span className="font-mono text-xs leading-6 text-muted-foreground lowercase">{label}</span>
    </label>
  );
}

// --- Commodities Step 1: Account Creation ---
function StepAccountCreation({ step, onComplete, onBack }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="border border-border bg-card p-6 sm:p-8">
      <BackButton onBack={onBack} />
      <p className="font-mono text-[10px] lowercase tracking-[0.36em] text-muted-foreground mb-4">step {step.number} of 5</p>
      <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-4 lowercase">{step.title}</h2>
      <p className="font-mono text-xs leading-7 text-muted-foreground mb-8 max-w-xl lowercase">{step.description}</p>
      <div className="mb-6">
        <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-4">requirements</p>
        <div className="space-y-3">
          {step.requirements.map((req, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-4 h-4 border border-border shrink-0" />
              <span className="font-mono text-xs text-muted-foreground lowercase">{req}</span>
            </div>
          ))}
        </div>
      </div>
      <SingleCheckbox checked={checked} onChange={setChecked} label={step.checkboxLabel} />
      <button onClick={onComplete} disabled={!checked}
        className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        {step.buttonLabel}
      </button>
    </div>
  );
}

// --- Commodities Step 2: Broker Account ---
function StepBrokerAccount({ step, onComplete, onBack }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="border border-border bg-card p-6 sm:p-8">
      <BackButton onBack={onBack} />
      <p className="font-mono text-[10px] lowercase tracking-[0.36em] text-muted-foreground mb-4">step {step.number} of 5</p>
      <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-4 lowercase">{step.title}</h2>
      <p className="font-mono text-xs leading-7 text-muted-foreground mb-6 max-w-xl lowercase">{step.description}</p>

      {/* Broker + referral link */}
      <div className="border border-border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-1">broker</p>
          <p className="font-heading text-xl text-foreground lowercase">{step.brokerName}</p>
        </div>
        <a href={step.brokerUrl} target="_blank" rel="noopener noreferrer"
          className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-6 py-3 hover:bg-border transition-colors text-center shrink-0">
          open your broker account →
        </a>
      </div>

      {/* Instructions */}
      <div className="bg-secondary/40 border border-border p-4 mb-5">
        <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-2">instructions</p>
        <ol className="space-y-2">
          {step.brokerInstructions.map((ins, i) => (
            <li key={i} className="font-mono text-xs leading-6 text-muted-foreground flex gap-2 lowercase">
              <span className="text-muted-foreground/50 shrink-0">{i + 1}.</span>
              <span className="lowercase">{ins}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Account settings */}
      <div className="grid grid-cols-3 border border-border mb-6">
        {step.brokerSettings.map((s, i) => (
          <div key={i} className={`p-4 ${i < step.brokerSettings.length - 1 ? "border-r border-border" : ""}`}>
            <p className="font-mono text-[10px] lowercase tracking-[0.22em] text-muted-foreground mb-1">{s.label}</p>
            <p className="font-mono text-xs text-foreground lowercase">{s.value}</p>
          </div>
        ))}
      </div>

      <SingleCheckbox checked={checked} onChange={setChecked} label={step.checkboxLabel} />
      <button onClick={onComplete} disabled={!checked}
        className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        {step.buttonLabel}
      </button>
    </div>
  );
}

// --- Commodities Step 3: Submit Details ---
function StepSubmitDetails({ step, onComplete, onBack }) {
  const [checked, setChecked] = useState(false);
  const [formData, setFormData] = useState({});

  const requiredFilled = step.fields
    .filter(f => f.required && f.type !== "file")
    .every(f => formData[f.key]?.trim());

  return (
    <div className="border border-border bg-card p-6 sm:p-8">
      <BackButton onBack={onBack} />
      <p className="font-mono text-[10px] lowercase tracking-[0.36em] text-muted-foreground mb-4">step {step.number} of 5</p>
      <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-4 lowercase">{step.title}</h2>
      <p className="font-mono text-xs leading-7 text-muted-foreground mb-6 max-w-xl lowercase">{step.description}</p>
      <div className="space-y-4 mb-6">
        {step.fields.map((field) => (
          <div key={field.key}>
            <label className="block font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-2">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            {field.type === "file" ? (
              <input type="file" accept="image/*,.pdf"
                className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-muted-foreground focus:outline-none focus:border-foreground transition-colors file:mr-4 file:border-0 file:bg-secondary file:text-foreground file:font-mono file:text-xs file:px-3 file:py-1" />
            ) : (
              <input type={field.type} placeholder={field.placeholder}
                value={formData[field.key] || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors" />
            )}
          </div>
        ))}
      </div>
      <SingleCheckbox checked={checked} onChange={setChecked} label={step.checkboxLabel} />
      <button onClick={onComplete} disabled={!checked || !requiredFilled}
        className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        {step.buttonLabel}
      </button>
    </div>
  );
}

// --- Commodities Step 4: Fund Account ---
function StepFundAccount({ step, onComplete, onBack }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="border border-border bg-card p-6 sm:p-8">
      <BackButton onBack={onBack} />
      <p className="font-mono text-[10px] lowercase tracking-[0.36em] text-muted-foreground mb-4">step {step.number} of 5</p>
      <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-4 lowercase">{step.title}</h2>
      <p className="font-mono text-xs leading-7 text-muted-foreground mb-6 max-w-xl lowercase">{step.description}</p>
      <div className="bg-secondary/40 border border-border p-4 mb-6">
        <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-3">instructions</p>
        <ol className="space-y-2">
          {step.fundingInstructions.map((ins, i) => (
            <li key={i} className="font-mono text-xs leading-6 text-muted-foreground lowercase flex gap-2">
              <span className="text-muted-foreground/50 shrink-0">{i + 1}.</span>
              <span>{ins}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="border border-border p-5 mb-6">
        <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-1">minimum recommended allocation</p>
        <p className="font-mono text-sm text-foreground">{step.minimumAllocation}</p>
      </div>
      <SingleCheckbox checked={checked} onChange={setChecked} label={step.checkboxLabel} />
      <button onClick={onComplete} disabled={!checked}
        className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        {step.buttonLabel}
      </button>
    </div>
  );
}

// --- Commodities Step 5: MetaCopier Account ---
function StepMetaCopierAccount({ step, onComplete, onBack }) {
  const [checked, setChecked] = useState(false);
  const [formData, setFormData] = useState({});

  const requiredFilled = step.fields
    .filter(f => f.required)
    .every(f => formData[f.key]?.trim());

  return (
    <div className="border border-border bg-card p-6 sm:p-8">
      <BackButton onBack={onBack} />
      <p className="font-mono text-[10px] lowercase tracking-[0.36em] text-muted-foreground mb-4">step {step.number} of 5</p>
      <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-4 lowercase">{step.title}</h2>
      <p className="font-mono text-xs leading-7 text-muted-foreground mb-6 max-w-xl lowercase">{step.description}</p>

      <div className="border border-border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-1">platform</p>
          <p className="font-heading text-xl text-foreground lowercase">{step.platformName}</p>
        </div>
        <a href={step.platformUrl} target="_blank" rel="noopener noreferrer"
          className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-6 py-3 hover:bg-border transition-colors text-center shrink-0">
          visit metacopier →
        </a>
      </div>

      {/* Pricing notice */}
      <div className="border border-border/60 bg-secondary/20 p-5 mb-6 flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">platform subscription</p>
          <p className="font-mono text-xs leading-6 text-muted-foreground">
            MetaCopier charges a third-party subscription fee of{" "}
            <span className="text-foreground font-medium">$8.00 / month</span>, billed directly by MetaCopier.
            This fee is separate from North Scale and covers the copy-trading infrastructure required to connect your broker account to the research engine.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/50">billed by</p>
          <p className="font-mono text-xs text-foreground">MetaCopier</p>
          <p className="font-heading text-lg text-foreground">$8<span className="font-mono text-[10px] text-muted-foreground">/mo</span></p>
        </div>
      </div>

      <div className="bg-secondary/40 border border-border p-4 mb-6">
        <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-3">instructions</p>
        <ol className="space-y-2">
          {step.metacopierInstructions.map((ins, i) => (
            <li key={i} className="font-mono text-xs leading-6 text-muted-foreground lowercase flex gap-2">
              <span className="text-muted-foreground/50 shrink-0">{i + 1}.</span>
              <span>{ins}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-4 mb-6">
        {step.fields.map((field) => (
          <div key={field.key}>
            <label className="block font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-2">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <input type={field.type} placeholder={field.placeholder}
              value={formData[field.key] || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
              className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors" />
          </div>
        ))}
      </div>

      <SingleCheckbox checked={checked} onChange={setChecked} label={step.checkboxLabel} />
      <button onClick={() => onComplete(formData)} disabled={!checked || !requiredFilled}
        className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        {step.buttonLabel}
      </button>
    </div>
  );
}

// --- Commodities Step 6: MetaCopier Setup ---
function StepMetaCopierSetup({ step, onComplete, onBack }) {
  const [checkboxes, setCheckboxes] = useState({});
  const allChecked = step.checkboxes.every(cb => checkboxes[cb.key]);

  return (
    <div className="border border-border bg-card p-6 sm:p-8">
      <BackButton onBack={onBack} />
      <p className="font-mono text-[10px] lowercase tracking-[0.36em] text-muted-foreground mb-4">step {step.number} of 5</p>
      <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-4 lowercase">{step.title}</h2>
      <p className="font-mono text-xs leading-7 text-muted-foreground mb-6 max-w-xl lowercase">{step.description}</p>

      <div className="bg-secondary/40 border border-border p-4 mb-6">
        <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground mb-3">instructions</p>
        <ol className="space-y-3">
          {step.metacopierSetupInstructions.map((item, i) => (
            <li key={i} className="font-mono text-xs leading-6 text-muted-foreground lowercase flex gap-2">
              <span className="text-muted-foreground/50 shrink-0">{i + 1}.</span>
              <span>
                {item.step}
                {item.highlight && (
                  <span className="ml-2 inline-block border border-border px-3 py-0.5 text-foreground tracking-[0.12em] lowercase">
                    {item.highlight}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-4 mb-6">
        <p className="font-mono text-[10px] lowercase tracking-[0.28em] text-muted-foreground">required confirmations</p>
        {step.checkboxes.map((cb) => (
          <label key={cb.key} className="flex items-start gap-4 cursor-pointer group">
            <div onClick={() => setCheckboxes(prev => ({ ...prev, [cb.key]: !prev[cb.key] }))}
              className={`mt-0.5 w-5 h-5 border shrink-0 flex items-center justify-center transition-colors ${checkboxes[cb.key] ? "border-foreground bg-foreground" : "border-border group-hover:border-muted-foreground"}`}>
              {checkboxes[cb.key] && <span className="text-background text-xs">✓</span>}
            </div>
            <span className="font-mono text-xs leading-6 text-muted-foreground lowercase">{cb.label}</span>
          </label>
        ))}
      </div>

      <button onClick={onComplete} disabled={!allChecked}
        className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        {step.buttonLabel}
      </button>
    </div>
  );
}

// Main dispatcher
export default function SetupStep({ step, onComplete, onBack, totalSteps }) {
  if (!step) return null;

  if (step.type === "account_creation") return <StepAccountCreation step={step} onComplete={onComplete} onBack={onBack} />;
  if (step.type === "broker_account") return <StepBrokerAccount step={step} onComplete={onComplete} onBack={onBack} />;
  if (step.type === "submit_details") return <StepSubmitDetails step={step} onComplete={onComplete} onBack={onBack} />;
  if (step.type === "fund_account") return <StepFundAccount step={step} onComplete={onComplete} onBack={onBack} />;
  if (step.type === "metacopier_account") return <StepMetaCopierAccount step={step} onComplete={onComplete} onBack={onBack} />;
  if (step.type === "metacopier_setup") return <StepMetaCopierSetup step={step} onComplete={onComplete} onBack={onBack} />;

  // Fallback: generic
  return <GenericStep step={step} onComplete={onComplete} onBack={onBack} />;
}