import React, { useState, useEffect } from "react";
import { Mic, Eye, CheckCircle2, ArrowRight, Volume2, ShieldAlert, Sparkles, Award, Plus, Zap } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { MoneyTree } from "./MoneyTree";
import { JokersPanel } from "./JokersPanel";
import { AudiencePollModal } from "./AudiencePollModal";
import { PhoneFriendModal } from "./PhoneFriendModal";
import type { GameState, JokerType } from "../../core/types";
import { formatMoney } from "../../core/ladder";

export interface PresenterDeskProps {
  gameState: GameState;
  getPlayerName: (peerId: string) => string;
  onLockFinalAnswer: () => void;
  onRevealResult: () => void;
  onNextQuestion: () => void;
  onRevealNextChoice: () => void;
  onRevealAllChoices: () => void;
  onPlaySoundEffect?: (type: string) => void;
}

const LETTERS = ["A", "B", "C", "D"];

export function PresenterDesk({
  gameState,
  getPlayerName,
  onLockFinalAnswer,
  onRevealResult,
  onNextQuestion,
  onRevealNextChoice,
  onRevealAllChoices,
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
    revealedChoicesCount = 4,
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
    if (revealedChoicesCount < 4) return;
    if (type === "AUDIENCE") {
      setAudienceDismissedLevel(null);
      setShowAudienceModal(true);
    }
    if (type === "PHONE") {
      setPhoneDismissedLevel(null);
      setShowPhoneModal(true);
    }
  };

  // Presenter speech text for unified header
  let speechText = "Bienvenue en plateau ! À vous la parole...";
  if (phase === "QUESTION_ACTIVE") {
    if (jokers.AUDIENCE.used && jokers.AUDIENCE.votes) {
      speechText = "Le public a voté ! Commentez le sondage...";
    } else if (jokers.PHONE.used && jokers.PHONE.hintText) {
      speechText = "L'ami a donné son avis ! Demandez au candidat ce qu'il en pense...";
    } else if (jokers["50_50"].used) {
      speechText = "Le 50:50 a éliminé 2 mauvaises réponses !";
    } else if (revealedChoicesCount < 4) {
      speechText = `Lisez la question N° ${currentLevel}, puis affichez les réponses (${revealedChoicesCount}/4)...`;
    } else {
      speechText = `Les 4 choix sont révélés ! Attendez le choix du candidat...`;
    }
  } else if (phase === "ANSWER_SELECTED") {
    const choiceLetter = selectedIndex !== null ? LETTERS[selectedIndex] : "";
    if (revealedChoicesCount < 4) {
      speechText = `Le candidat a choisi ${choiceLetter}. Continuez d'afficher les autres réponses (${revealedChoicesCount}/4)...`;
    } else {
      speechText = `Le candidat a sélectionné la réponse ${choiceLetter}. Demandez s'il s'agit de son dernier mot !`;
    }
  } else if (phase === "FINAL_ANSWER") {
    speechText = "Dernier mot verrouillé ! Vous pouvez maintenant révéler le résultat en plateau !";
  } else if (phase === "QUESTION_SUCCESS") {
    speechText = "EXCELLENT ! C'est la bonne réponse ! Passez à la question suivante.";
  } else if (phase === "REVEAL_RESULT" || phase === "GAME_OVER") {
    speechText = "Aïe aïe aïe... Mauvaise réponse ! Le candidat quitte le plateau.";
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* UNIFIED PRESENTER REGIE CONSOLE HEADER */}
      <GlassCard className="border-2 border-amber-500/60 shadow-2xl bg-[#09122a]/95 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Info Line: Presenter & Room Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 flex items-center justify-center text-2xl shadow-lg border-2 border-amber-300 shadow-amber-500/30 animate-pulse shrink-0">
              🎙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
                  Régie Présentateur (En Direct)
                </h2>
                <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Direct
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                🎓 Candidats : <span className="text-amber-300 font-bold">{candidatesList}</span>
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
                <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" /> Musique Suspense
              </Button>
            )}
          </div>
        </div>

        {/* Presenter Speech Prompt & Direct Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2 bg-slate-950/80 p-3 rounded-xl border border-amber-500/30 text-xs md:text-sm font-semibold text-amber-200 italic flex-1 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="truncate">« {speechText} »</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* One-by-one or all-at-once Choice Reveal Controls: Stay visible as long as choices remain unrevealed */}
            {!isRevealed && revealedChoicesCount < 4 && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={onRevealNextChoice} className="text-xs">
                  <Plus className="w-3.5 h-3.5 text-amber-400" /> Afficher Choix {LETTERS[revealedChoicesCount]}
                </Button>
                <Button variant="ghost" size="sm" onClick={onRevealAllChoices} className="text-xs text-amber-300 border border-amber-500/30 hover:bg-amber-500/10">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Tout Afficher (A à D)
                </Button>
              </div>
            )}

            {isSelected && !isFinal && !isRevealed && (
              <Button variant="secondary" size="md" onClick={onLockFinalAnswer}>
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Verrouiller "Dernier Mot"
              </Button>
            )}

            {/* Reveal Result Button: Accessible only when "Dernier Mot" is locked */}
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

      {/* Main Integrated Stage: Left (Question & Secret Key) + Right (Money Pyramid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          {/* Jokers status panel */}
          <JokersPanel
            jokers={jokers}
            onTriggerJoker={handleJokerClick}
            disabled={revealedChoicesCount < 4}
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

            {/* Grid of Choices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shuffledChoices.map((choice, idx) => {
                const isCorrect = correctAnswerIndex === idx;
                const isChoiceSelected = selectedIndex === idx;
                const isRemovedBy5050 = jokers["50_50"].removedIndices.includes(idx);
                const isChoiceRevealedToCandidates = idx < revealedChoicesCount;

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
                if (!isChoiceRevealedToCandidates && !isRevealed) {
                  choiceStyle = "bg-slate-950/60 border-dashed border-amber-500/30 text-slate-400 opacity-60";
                } else if (isRevealed) {
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

                    <div className="flex items-center gap-2">
                      {!isChoiceRevealedToCandidates && !isRevealed && (
                        <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-semibold border border-amber-500/30">
                          Masqué candidats
                        </span>
                      )}
                      {isChoiceSelected && !isRevealed && (
                        <span className="text-xs bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-bounce">
                          Choisi par candidat
                        </span>
                      )}
                    </div>
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
