import React, { useState, useEffect } from "react";
import { Lock, LogOut, ArrowRight, Mic } from "lucide-react";
import { QuestionBox } from "./QuestionBox";
import { MoneyTree } from "./MoneyTree";
import { JokersPanel } from "./JokersPanel";
import { Button } from "../ui/Button";
import { AudiencePollModal } from "./AudiencePollModal";
import { PhoneFriendModal } from "./PhoneFriendModal";
import { TVPresenterWidget } from "./TVPresenterWidget";
import type { GameState, JokerType } from "../../core/types";
import { formatMoney, getWalkAwayEarnings } from "../../core/ladder";

export interface CandidateScreenProps {
  gameState: GameState;
  myPeerId: string;
  isPresenter: boolean;
  getPlayerName: (peerId: string) => string;
  onSelectChoice: (index: number) => void;
  onLockFinalAnswer: () => void;
  onRevealResult: () => void;
  onNextQuestion: () => void;
  onTriggerJoker: (type: JokerType) => void;
  onWalkAway: () => void;
}

export function CandidateScreen({
  gameState,
  myPeerId,
  isPresenter,
  getPlayerName,
  onSelectChoice,
  onLockFinalAnswer,
  onRevealResult,
  onNextQuestion,
  onTriggerJoker,
  onWalkAway,
}: CandidateScreenProps) {
  const [showAudienceModal, setShowAudienceModal] = useState<boolean>(false);
  const [showPhoneModal, setShowPhoneModal] = useState<boolean>(false);
  const [audienceDismissedLevel, setAudienceDismissedLevel] = useState<number | null>(null);
  const [phoneDismissedLevel, setPhoneDismissedLevel] = useState<number | null>(null);

  const {
    currentQuestion,
    shuffledChoices,
    selectedIndex,
    correctAnswerIndex,
    jokers,
    isFinalAnswer,
    phase,
    currentLevel,
    activeCandidatePeerId,
    activeCandidatePeerIds,
  } = gameState;

  // Reset dismissal flags when current level changes
  useEffect(() => {
    setAudienceDismissedLevel(null);
    setPhoneDismissedLevel(null);
    setShowAudienceModal(false);
    setShowPhoneModal(false);
  }, [currentLevel]);

  const isCandidate =
    (activeCandidatePeerIds && activeCandidatePeerIds.includes(myPeerId)) ||
    activeCandidatePeerId === myPeerId;

  const isMyTurnToAnswer =
    isCandidate || gameState.config.presenterMode === "AUTO_PRESENTER";

  const isAutoMode = gameState.config.presenterMode === "AUTO_PRESENTER";
  const isRevealed =
    phase === "REVEAL_RESULT" ||
    phase === "QUESTION_SUCCESS" ||
    phase === "GAME_OVER" ||
    phase === "VICTORY";

  const presenterName =
    gameState.config.presenterMode === "HOST_PRESENTER" && gameState.config.presenterPeerId
      ? getPlayerName(gameState.config.presenterPeerId)
      : "Présentateur Automatique";

  const walkAwayEarnings = getWalkAwayEarnings(currentLevel);

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
    onTriggerJoker(type);
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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Bar Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#070e24]/80 p-4 rounded-2xl border border-amber-500/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shrink-0">
            {currentLevel}
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-amber-400 tracking-wider">
              En jeu pour {formatMoney(gameState.potentialEarnings)}
            </div>
            <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
              <Mic className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Présentateur : <span className="text-amber-300 font-extrabold">{presenterName}</span></span>
            </div>
          </div>
        </div>

        {/* Walk Away Button */}
        {phase !== "REVEAL_RESULT" && phase !== "QUESTION_SUCCESS" && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onWalkAway}
            disabled={!isMyTurnToAnswer || isFinalAnswer}
            className="text-xs"
          >
            <LogOut className="w-4 h-4 text-amber-400" /> S'arrêter à {formatMoney(walkAwayEarnings)}
          </Button>
        )}
      </div>

      {/* Interactive Presenter Avatar & Speech Bubble */}
      <TVPresenterWidget gameState={gameState} presenterName={presenterName} />

      {/* Main Grid: Left Stage (Question & Jokers) + Right Stage (Money Ladder) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          <JokersPanel
            jokers={jokers}
            onTriggerJoker={handleJokerClick}
            disabled={!isMyTurnToAnswer || isFinalAnswer || isRevealed}
          />

          <QuestionBox
            question={currentQuestion}
            choices={shuffledChoices}
            selectedIndex={selectedIndex}
            correctIndex={correctAnswerIndex}
            removedIndices={jokers["50_50"].removedIndices}
            isFinalAnswer={isFinalAnswer}
            isRevealed={isRevealed}
            revealedChoicesCount={gameState.revealedChoicesCount}
            onSelectChoice={onSelectChoice}
            disabled={!isMyTurnToAnswer || isFinalAnswer || isRevealed}
          />

          {/* Action Buttons */}
          <div className="flex justify-center pt-2">
            {selectedIndex !== null && !isFinalAnswer && (
              <Button size="lg" onClick={onLockFinalAnswer} disabled={!isMyTurnToAnswer}>
                <Lock className="w-5 h-5" /> C'est mon Dernier Mot !
              </Button>
            )}

            {isFinalAnswer && isAutoMode && !isRevealed && (
              <Button size="lg" onClick={onRevealResult}>
                ⚡ Révéler le Résultat !
              </Button>
            )}

            {phase === "QUESTION_SUCCESS" && (
              isAutoMode ? (
                <Button size="lg" onClick={onNextQuestion}>
                  Question Suivante <ArrowRight className="w-5 h-5" />
                </Button>
              ) : isPresenter ? (
                <Button size="lg" onClick={onNextQuestion}>
                  Question Suivante <ArrowRight className="w-5 h-5" />
                </Button>
              ) : (
                <div className="text-amber-400 font-bold text-sm italic py-2 bg-amber-500/10 px-4 rounded-xl border border-amber-500/30">
                  🎙️ En attente du présentateur ({presenterName}) pour passer à la question suivante...
                </div>
              )
            )}
          </div>
        </div>

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
