import React from "react";
import { HelpCircle, PhoneCall, Users, RefreshCw } from "lucide-react";
import type { JokerType, JokersState } from "../../core/types";

export interface JokersPanelProps {
  jokers: JokersState;
  onTriggerJoker: (type: JokerType) => void;
  disabled?: boolean;
}

export function JokersPanel({ jokers, onTriggerJoker, disabled }: JokersPanelProps) {
  const jokerList: { type: JokerType; label: string; icon: React.ReactNode }[] = [
    { type: "50_50", label: "50:50", icon: <HelpCircle className="w-5 h-5" /> },
    { type: "PHONE", label: "Ami", icon: <PhoneCall className="w-5 h-5" /> },
    { type: "AUDIENCE", label: "Public", icon: <Users className="w-5 h-5" /> },
    { type: "SWITCH", label: "Switch", icon: <RefreshCw className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 bg-[#070e24]/80 p-2.5 md:p-3 rounded-2xl border border-amber-500/30">
      {jokerList.map(({ type, label, icon }) => {
        const isUsed = jokers[type].used;

        return (
          <button
            key={type}
            disabled={disabled || isUsed}
            onClick={() => onTriggerJoker(type)}
            className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl font-bold text-xs md:text-sm border transition-all ${
              isUsed
                ? "bg-slate-900/60 border-slate-800 text-slate-600 line-through cursor-not-allowed opacity-50"
                : "bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-400 shadow-md shadow-amber-500/10 active:scale-95 cursor-pointer"
            }`}
          >
            {icon}
            <span>{label}</span>
            {isUsed && <span className="text-[10px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-black ml-1">X</span>}
          </button>
        );
      })}
    </div>
  );
}
