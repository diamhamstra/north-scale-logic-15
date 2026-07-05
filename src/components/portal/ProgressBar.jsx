import React from "react";

export default function ProgressBar({ currentStep, totalSteps }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-0">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isComplete = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          return (
            <React.Fragment key={stepNum}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 flex items-center justify-center border font-mono text-xs transition-colors ${
                    isComplete
                      ? "border-foreground bg-foreground text-background"
                      : isActive
                      ? "border-foreground text-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {isComplete ? "✓" : stepNum}
                </div>
                <span
                  className={`mt-2 font-mono text-[9px] lowercase tracking-[0.2em] hidden sm:block ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  step {stepNum}
                </span>
              </div>
              {i < totalSteps - 1 && (
                <div
                  className={`flex-1 h-px mx-2 mb-4 sm:mb-4 transition-colors ${
                    stepNum < currentStep ? "bg-foreground" : "bg-border"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}