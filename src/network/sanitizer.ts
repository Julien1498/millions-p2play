import type { GameState } from "../core/types";

/**
 * Sanitizes GameState before broadcasting over WebRTC.
 * Prevents cheating by obfuscating the correct answer index from candidates and spectators
 * until the result is explicitly revealed by the host/presenter.
 * ALWAYS returns a new object reference so React setGameState triggers a re-render.
 */
export function sanitizeGameStateForViewer(
  state: GameState,
  viewerPeerId: string | null
): GameState {
  const isPresenter =
    state.config.presenterMode === "HOST_PRESENTER" &&
    Boolean(state.config.presenterPeerId) &&
    (state.config.presenterPeerId === viewerPeerId ||
      viewerPeerId === "local");

  // Deep clone jokers and state to guarantee React re-renders when jokers update live
  const clonedJokers = {
    "50_50": { ...state.jokers["50_50"], removedIndices: [...(state.jokers["50_50"].removedIndices || [])] },
    PHONE: { ...state.jokers.PHONE },
    AUDIENCE: { ...state.jokers.AUDIENCE, votes: state.jokers.AUDIENCE.votes ? { ...state.jokers.AUDIENCE.votes } : null },
    SWITCH: { ...state.jokers.SWITCH },
  };

  // Presenter receives full state with correct answer highlights
  if (isPresenter) {
    return {
      ...state,
      jokers: clonedJokers,
    };
  }

  // If answer hasn't been revealed yet, hide the correct answer index from candidates/spectators
  const isRevealed =
    state.phase === "REVEAL_RESULT" ||
    state.phase === "QUESTION_SUCCESS" ||
    state.phase === "GAME_OVER" ||
    state.phase === "VICTORY" ||
    state.phase === "WALK_AWAY";

  if (!isRevealed) {
    return {
      ...state,
      jokers: clonedJokers,
      correctAnswerIndex: null,
      currentQuestion: state.currentQuestion
        ? {
            ...state.currentQuestion,
            answer: "", // Hide exact string
            badAnswers: [],
          }
        : null,
    };
  }

  return {
    ...state,
    jokers: clonedJokers,
  };
}
