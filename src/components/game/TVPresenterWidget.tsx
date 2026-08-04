import React from "react";
import { Mic, Sparkles, MessageCircle } from "lucide-react";
import type { GameState } from "../../core/types";

export interface TVPresenterWidgetProps {
  gameState: GameState;
  presenterName?: string;
  className?: string;
}

export function TVPresenterWidget({
  gameState,
  presenterName = "Le Présentateur",
  className = "",
}: TVPresenterWidgetProps) {
  const { phase, currentLevel, isAnswerCorrect, selectedIndex, jokers } = gameState;

  let speechText = "Bienvenue en plateau ! Concentrez-vous bien...";

  if (phase === "QUESTION_ACTIVE") {
    if (jokers.AUDIENCE.used && jokers.AUDIENCE.votes) {
      speechText = "Le public a donné son avis ! Observez bien le résultat des votes...";
    } else if (jokers.PHONE.used && jokers.PHONE.hintText) {
      speechText = "L'ami a donné son précieux conseil ! Qu'en pensez-vous ?";
    } else if (jokers["50_50"].used) {
      speechText = "Hop ! Deux mauvaises réponses ont été éliminées par le 50:50 !";
    } else {
      speechText = `Voici la question N° ${currentLevel} ! Observez attentivement les 4 propositions...`;
    }
  } else if (phase === "ANSWER_SELECTED") {
    const letters = ["A", "B", "C", "D"];
    const choiceLetter = selectedIndex !== null ? letters[selectedIndex] : "";
    speechText = `Vous avez sélectionné la réponse ${choiceLetter}... Est-ce bien votre dernier mot ?`;
  } else if (phase === "FINAL_ANSWER") {
    speechText = "Dernier mot verrouillé ! Le suspense est à son comble en plateau...";
  } else if (phase === "QUESTION_SUCCESS") {
    speechText = "C'EST LA BONNE RÉPONSE ! Bravo ! Un niveau de plus vers le million !";
  } else if (phase === "REVEAL_RESULT" || phase === "GAME_OVER") {
    if (isAnswerCorrect === false) {
      speechText = "Aïe aïe aïe... Malheureusement ce n'était pas la bonne réponse ! Quel dommage !";
    } else {
      speechText = "Voyons le résultat...";
    }
  } else if (phase === "VICTORY") {
    speechText = "EXTRAORDINAIRE ! Vous avez répondu sans faute aux 15 questions !";
  } else if (phase === "WALK_AWAY") {
    speechText = "Une décision très sage ! Vous vous arrêtez au bon moment les poches pleines !";
  }

  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl bg-[#091432]/95 border-2 border-amber-500/50 shadow-2xl backdrop-blur-xl relative overflow-hidden ${className}`}>
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Presenter Avatar */}
      <div className="relative shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 flex items-center justify-center text-2xl shadow-lg border-2 border-amber-300 shadow-amber-500/30 animate-pulse">
          🎙️
        </div>
        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full border border-slate-950 shadow-md">
          <Mic className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Speech Bubble */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> {presenterName}
          </div>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold border border-amber-500/30">
            En direct
          </span>
        </div>

        <div className="relative bg-slate-950/80 p-3 rounded-xl border border-amber-500/30 text-slate-100 text-xs md:text-sm font-semibold leading-relaxed shadow-inner">
          <MessageCircle className="w-3.5 h-3.5 text-amber-400/60 absolute -top-1 -left-1 transform -rotate-12" />
          <p className="italic">« {speechText} »</p>
        </div>
      </div>
    </div>
  );
}
