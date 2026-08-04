import React, { useState, useEffect } from "react";
import { Mic, Eye, CheckCircle2, ArrowRight, Volume2, ShieldAlert, Sparkles, Award } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { MoneyTree } from "./MoneyTree";
import { JokersPanel } from "./JokersPanel";
import { AudiencePollModal } from "./AudiencePollModal";
import { PhoneFriendModal } from "./PhoneFriendModal";
import { TVPresenterWidget } from "./TVPresenterWidget";
import type { GameState, JokerType } from "../../core/types";
import { formatMoney } from "../../core/ladder";

export interface PresenterDeskProps {
  gameState: GameState;
  getPlayerName: (peerId: string) => string;
  onLockFinalAnswer: () => void;
  onRevealResult: () => void;
  onNextQuestion: () => void;
  onPlaySoundEffect?: (type: string) => void;
}

const LETTERS = ["A", "B", "C", "D"];

export function PresenterDesk({
  gameState,
  getPlayerName,
  onLockFinalAnswer,
  onRevealResult,
  onNextQuestion,
  onPlaySoundEffect,
}: PresenterDeskProps) {
  const [showAudienceModal, setShowAudienceModal] = useState<boolean>(false);
  const [showPhoneModal, setShowPhoneModal] = useState<boolean>(false);
  const [audienceDismissedLevel, setAudienceDismissedLevel] = useState<number | null>(null);
  const [phoneDismissedLevel, setPhoneDismissedLevel] = useState<number | null>(null);

  const {
    currentQuestion,
    shuffledChoices,
    correctAnswerIndex,
    selectedIndex,
    phase,
    currentLevel,
    jokers,
    isFinalAnswer,
    activeCandidatePeerIds,
    activeCandidatePeerId,
  } = gameState;

  // Reset dismissal flags when current level changes
  useEffect(() => {
    setAudienceDismissedLevel(null);
    setPhoneDismissedLevel(null);
    setShowAudienceModal(false);
    setShowPhoneModal(false);
  }, [currentLevel]);

  if (!currentQuestion) return null;

  const isFinal = phase === "FINAL_ANSWER" || isFinalAnswer;
  const isSelected = selectedIndex !== null;
  const isSuccess = phase === "QUESTION_SUCCESS";
  const isRevealed =
    phase === "REVEAL_RESULT" ||
    phase === "QUESTION_SUCCESS" ||
    phase === "GAME_OVER" ||
    phase === "VICTORY";

  const candidatesList =
    activeCandidatePeerIds && activeCandidatePeerIds.length > 0
      ? activeCandidatePeerIds.map((id) => getPlayerName(id)).join(", ")
      : activeCandidatePeerId
      ? getPlayerName(activeCandidatePeerId)
      : "Candidats";

  const isAudienceOpen =
    (showAudienceModal || Boolean(jokers.AUDIENCE.used && jokers.AUDIENCE.votes)) &&
    audienceDismissedLevel !== currentLevel;

  const isPhoneOpen =
    (showPhoneModal || Boolean(jokers.PHONE.used && jokers.PHONE.hintText)) &&
    phoneDismissedLevel !== currentLevel;

  const handleCloseAudience = () => {
    setShowAudienceModal(false);
    setAudienceDismissedLevel(currentLevel);
  };

  const handleClosePhone = () => {
    setShowPhoneModal(false);
    setPhoneDismissedLevel(currentLevel);
  };

  const handleJokerClick = (type: JokerType) => {
    if (type === "AUDIENCE") {
      setAudienceDismissedLevel(null);
      setShowAudienceModal(true);
    }
    if (type === "PHONE") {
      setPhoneDismissedLevel(null);
      setShowPhoneModal(true);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Presenter Control Bar */}
      <GlassCard className="border-2 border-amber-500/60 shadow-2xl bg-[#09122a]/95 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
                  Régie Présentateur
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-extrabold uppercase">
                  En Direct
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                🎓 Candidats en plateau : <span className="text-amber-300 font-bold">{candidatesList}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>En Jeu : {formatMoney(gameState.potentialEarnings)}</span>
            </div>

            {onPlaySoundEffect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPlaySoundEffect("suspense")}
                className="text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 text-xs"
              >
                <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" /> Musique Suspense (Tous)
              </Button>
            )}
          </div>
        </div>

        {/* Action Controls for Presenter */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="text-xs text-slate-300 font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              {phase === "QUESTION_ACTIVE"
                ? "Lecture de la question par le présentateur..."
                : phase === "ANSWER_SELECTED"
                ? "Le candidat a sélectionné une réponse. Attendez le verrouillage de son 'Dernier Mot'..."
                : phase === "FINAL_ANSWER"
                ? "Dernier mot verrouillé ! Le bouton de révélation est débloqué."
                : isSuccess
                ? "Bravo ! Réponse correcte ! Vous pouvez passer à la question suivante."
                : "Résultat révélé en plateau."}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isSelected && !isFinal && !isRevealed && (
              <Button variant="secondary" size="md" onClick={onLockFinalAnswer}>
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Verrouiller le "Dernier Mot"
              </Button>
            )}

            {/* Reveal Result Button: Strictly disabled / inaccessible until "Dernier Mot" is locked */}
            {isFinal && !isRevealed && (
              <Button variant="gold" size="md" onClick={onRevealResult}>
                <Eye className="w-4 h-4" /> ⚡ Révéler le Résultat !
              </Button>
            )}

            {isSuccess && (
              <Button variant="gold" size="md" onClick={onNextQuestion}>
                Question Suivante <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Interactive Presenter Avatar & Speech Bubble */}
      <TVPresenterWidget gameState={gameState} presenterName="Régie Présentateur" />

      {/* Main Integrated Stage: Left (Question & Secret Key) + Right (Money Pyramid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          {/* Jokers status panel */}
          <JokersPanel
            jokers={jokers}
            onTriggerJoker={handleJokerClick}
            disabled={false}
          />

          {/* Secret Answer Banner for Host/Presenter (Single source of truth for secret answer) */}
          <div className="bg-slate-950/90 p-4 rounded-2xl border-2 border-emerald-500/50 shadow-lg space-y-1">
            <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Clé de Réponse Secrète (Régie)
            </div>
            <div className="text-sm font-black text-slate-100">
              Bonne Réponse :{" "}
              <span className="text-emerald-300 underline text-base ml-1 font-mono">
                {correctAnswerIndex !== null
                  ? `${LETTERS[correctAnswerIndex]} : ${currentQuestion.answer}`
                  : "—"}
              </span>
            </div>
          </div>

          {/* Question Box with Live Candidates Choices */}
          <div className="bg-[#0b1736]/90 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="text-center space-y-2">
              <div className="text-xs font-bold text-amber-400/80 uppercase tracking-widest">
                Question N° {currentLevel} • {currentQuestion.category || "Culture Générale"}
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-100 leading-snug">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Grid of Choices (Clean choice cards without duplicate green text) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shuffledChoices.map((choice, idx) => {
                const isCorrect = correctAnswerIndex === idx;
                const isChoiceSelected = selectedIndex === idx;
                const isRemovedBy5050 = jokers["50_50"].removedIndices.includes(idx);

                if (isRemovedBy5050) {
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-slate-900 bg-slate-950/40 text-slate-700 italic text-sm font-semibold opacity-30 cursor-not-allowed"
                    >
                      {LETTERS[idx]} : — (Éliminé 50:50)
                    </div>
                  );
                }

                let choiceStyle = "bg-slate-900/80 border-slate-700/80 text-slate-200";
                if (isRevealed) {
                  if (isCorrect) {
                    choiceStyle = "bg-emerald-500/25 border-emerald-400 text-emerald-200 font-extrabold shadow-lg shadow-emerald-500/20";
                  } else if (isChoiceSelected) {
                    choiceStyle = "bg-red-500/25 border-red-400 text-red-200 font-bold";
                  }
                } else if (isChoiceSelected) {
                  choiceStyle = "bg-amber-500/25 border-amber-400 text-amber-200 font-extrabold shadow-lg shadow-amber-500/20 animate-pulse";
                }

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between transition-all ${choiceStyle}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-black text-xs border border-amber-500/30 shrink-0">
                        {LETTERS[idx]}
                      </span>
                      <span>{choice}</span>
                    </span>

                    {isChoiceSelected && !isRevealed && (
                      <span className="text-xs bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-bounce">
                        Choisi par candidat
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Money Ladder */}
        <div className="lg:col-span-1 flex justify-center">
          <MoneyTree currentLevel={currentLevel} />
        </div>
      </div>

      {/* Modals with explicit close handling */}
      {isAudienceOpen && (
        <AudiencePollModal
          votes={jokers.AUDIENCE.votes}
          onClose={handleCloseAudience}
        />
      )}

      {isPhoneOpen && (
        <PhoneFriendModal
          hintText={jokers.PHONE.hintText}
          onClose={handleClosePhone}
        />
      )}
    </div>
  );
}
