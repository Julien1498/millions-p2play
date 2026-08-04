import React, { useState, useEffect } from "react";
import { Trophy, Frown, LogOut, RotateCcw } from "lucide-react";
import { Button } from "../ui/Button";
import { formatMoney } from "../../core/ladder";
import type { GamePhase } from "../../core/types";

export interface VictoryGameOverModalProps {
  phase: GamePhase;
  earnings: number;
  isHost: boolean;
  onResetLobby: () => void;
}

export function VictoryGameOverModal({
  phase,
  earnings,
  isHost,
  onResetLobby,
}: VictoryGameOverModalProps) {
  const [delayOver, setDelayOver] = useState(false);

  // Allow 2.5s delay when losing/winning so everyone sees the board answer reveal first
  useEffect(() => {
    if (phase === "VICTORY" || phase === "GAME_OVER" || phase === "WALK_AWAY") {
      setDelayOver(false);
      const timer = setTimeout(() => {
        setDelayOver(true);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setDelayOver(false);
    }
  }, [phase]);

  if (phase !== "VICTORY" && phase !== "GAME_OVER" && phase !== "WALK_AWAY") {
    return null;
  }

  if (!delayOver) {
    return null;
  }

  const isVictory = phase === "VICTORY";
  const isWalkAway = phase === "WALK_AWAY";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-in zoom-in-95 duration-300">
      <div className="bg-[#0b1736] border-2 border-amber-500/60 rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-4">
          {isVictory ? (
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/40 animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
          ) : isWalkAway ? (
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center text-blue-300 shadow-lg">
              <LogOut className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center text-red-400 shadow-lg">
              <Frown className="w-10 h-10" />
            </div>
          )}

          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
            {isVictory
              ? "GRAND GAGNANT DES MILLIONS !"
              : isWalkAway
              ? "Départ avec les Gains !"
              : "Quel Dommage !"}
          </h2>

          <p className="text-slate-300 text-sm">
            {isVictory
              ? "Félicitations ! Vous avez franchi la pyramide des 15 questions jusqu'au sommet !"
              : isWalkAway
              ? "Vous avez choisi de vous arrêter sagement avant l'erreur fatale."
              : "Votre réponse était incorrecte. Vous repartez avec le palier acquis :"}
          </p>

          <div className="py-4 bg-slate-900/80 rounded-2xl border border-amber-500/30">
            <div className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-1">
              Somme Remportée
            </div>
            <div className="text-4xl md:text-5xl font-black text-amber-400 tracking-tight">
              {formatMoney(earnings)}
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-4 flex justify-center">
          {isHost ? (
            <Button size="lg" onClick={onResetLobby}>
              <RotateCcw className="w-5 h-5" /> Revenir au Salon (Hôte)
            </Button>
          ) : (
            <div className="text-slate-400 text-sm italic bg-slate-900/60 py-2.5 px-4 rounded-xl border border-slate-800">
              🎙️ L'hôte réinitialisera bientôt le salon pour relancer une partie...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
