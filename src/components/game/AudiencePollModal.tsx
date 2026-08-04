import React from "react";
import { Users, X } from "lucide-react";
import { Button } from "../ui/Button";

export interface AudiencePollModalProps {
  votes: Record<number, number> | null;
  onClose: () => void;
}

const LETTERS = ["A", "B", "C", "D"];

export function AudiencePollModal({ votes, onClose }: AudiencePollModalProps) {
  if (!votes) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1736] border-2 border-amber-500/50 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 text-slate-100">
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
            <Users className="w-6 h-6" /> Avis du Public
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 text-center">
          Voici la répartition statistique des votes du public et des spectateurs :
        </p>

        {/* Bar chart */}
        <div className="grid grid-cols-4 gap-4 items-end h-48 pt-4 px-2">
          {LETTERS.map((letter, index) => {
            const pct = votes[index] || 0;
            return (
              <div key={letter} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-xs font-mono font-bold text-amber-300">{pct}%</span>
                <div className="w-full bg-slate-900 rounded-t-lg h-36 flex items-end p-1 border border-slate-800">
                  <div
                    style={{ height: `${Math.max(5, pct)}%` }}
                    className="w-full bg-gradient-to-t from-amber-600 via-amber-400 to-amber-300 rounded-t transition-all duration-700"
                  />
                </div>
                <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold text-sm flex items-center justify-center border border-amber-500/40">
                  {letter}
                </span>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-center">
          <Button variant="secondary" size="md" onClick={onClose}>
            Fermer le Sondage
          </Button>
        </div>
      </div>
    </div>
  );
}
