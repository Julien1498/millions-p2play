import React from "react";
import { MILLIONAIRE_LADDER } from "../../core/ladder";
import type { QuestionLevel } from "../../core/types";

export interface MoneyTreeProps {
  currentLevel: QuestionLevel;
}

export function MoneyTree({ currentLevel }: MoneyTreeProps) {
  // Render ladder upside down (Level 15 at top, Level 1 at bottom)
  const steps = [...MILLIONAIRE_LADDER].reverse();

  return (
    <div className="bg-[#070e24]/90 border border-amber-500/20 rounded-2xl p-3 md:p-4 space-y-1 shadow-inner max-w-xs w-full">
      <div className="text-center font-bold text-xs uppercase tracking-widest text-amber-400 pb-2 border-b border-slate-800">
        Pyramide des Gains
      </div>
      <div className="space-y-0.5 pt-1">
        {steps.map((step) => {
          const isCurrent = step.level === currentLevel;
          const isPassed = step.level < currentLevel;

          return (
            <div
              key={step.level}
              className={`flex items-center justify-between px-3 py-1 rounded-lg text-xs md:text-sm transition-all ${
                isCurrent
                  ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-extrabold shadow-md shadow-amber-500/30 scale-[1.02]"
                  : isPassed
                  ? "text-slate-500 font-medium line-through opacity-70"
                  : step.isSafetyThreshold
                  ? "text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30"
                  : "text-slate-300 font-medium"
              }`}
            >
              <span className="w-6 text-left font-mono font-bold">
                {step.level < 10 ? `0${step.level}` : step.level}
              </span>
              <span className="tracking-wide">{step.formattedAmount}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
