import React from "react";

export default function JobCard({ position, onApply }) {
  return (
    <div className="border border-border p-6 sm:p-8 flex flex-col">
      <div className="flex-1">
        <h3 className="font-heading text-2xl text-foreground mb-4">
          {position.title}
        </h3>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-0.5">
              Location
            </p>
            <p className="font-mono text-xs text-foreground">
              {position.location}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-0.5">
              Employment
            </p>
            <p className="font-mono text-xs text-foreground">
              {position.employment}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-3">
            Requirements
          </p>
          <ul className="space-y-2">
            {position.requirements.map((req, idx) => (
              <li key={idx} className="font-mono text-[10px] leading-5 text-muted-foreground/80">
                • {req}
              </li>
            ))}
          </ul>
        </div>

        {position.preferred && position.preferred.length > 0 && (
          <div className="mb-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-3">
              Preferred
            </p>
            <ul className="space-y-2">
              {position.preferred.map((item, idx) => (
                <li key={idx} className="font-mono text-[10px] leading-5 text-muted-foreground/80">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={onApply}
        className="mt-6 border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-6 py-3 hover:bg-transparent hover:text-foreground transition-colors duration-200 w-full sm:w-auto"
      >
        Apply Now
      </button>
    </div>
  );
}