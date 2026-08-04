export type Difficulty = "facile" | "normal" | "difficile";

export interface QuizQuestion {
  id: string;
  question: string;
  answer: string; // Correct answer
  badAnswers: string[]; // 3 incorrect answers
  category: string;
  difficulty: Difficulty;
}

export type QuestionLevel = number; // 1 to 15

export interface LadderStep {
  level: QuestionLevel;
  amount: number;
  formattedAmount: string;
  isSafetyThreshold: boolean;
}

export type GamePhase =
  | "LOBBY"
  | "QUESTION_ACTIVE"
  | "ANSWER_SELECTED"
  | "FINAL_ANSWER"
  | "REVEAL_RESULT"
  | "QUESTION_SUCCESS"
  | "WALK_AWAY"
  | "GAME_OVER"
  | "VICTORY";

export type PresenterMode = "HOST_PRESENTER" | "AUTO_PRESENTER";

export type JokerType = "50_50" | "PHONE" | "AUDIENCE" | "SWITCH";

export interface JokersState {
  "50_50": { used: boolean; removedIndices: number[] };
  PHONE: { used: boolean; hintText: string | null };
  AUDIENCE: { used: boolean; votes: Record<number, number> | null };
  SWITCH: { used: boolean };
}

export interface GameConfig {
  presenterMode: PresenterMode;
  presenterPeerId: string | null;
  candidatePeerIds: string[]; // List of peer IDs selected as active candidates (single or multiple)
  categoryFilter: string; // 'all' or specific slug
  autoTimerSeconds: number; // 0 for unlimited, or e.g. 30s
  enabledJokers: JokerType[];
}

export interface PlayerInfo {
  peerId: string;
  name: string;
  avatar: string;
  isPresenter: boolean;
  isCandidate: boolean;
}

export interface GameState {
  config: GameConfig;
  phase: GamePhase;
  currentLevel: QuestionLevel; // 1 to 15
  currentQuestion: QuizQuestion | null;
  shuffledChoices: string[]; // Array of 4 strings (A, B, C, D)
  correctAnswerIndex: number | null; // Index 0..3 (hidden for candidates before reveal)
  selectedIndex: number | null; // Candidate selected index 0..3
  isFinalAnswer: boolean; // Candidate locked "C'est votre dernier mot ?"
  isAnswerCorrect: boolean | null; // Reveal result
  revealedChoicesCount: number; // Number of choices revealed so far (0..4)
  jokers: JokersState;
  activeCandidatePeerId: string | null; // Backward compatibility
  activeCandidatePeerIds: string[]; // List of active candidates in game
  earnings: number; // Current guaranteed earnings
  potentialEarnings: number; // Current step potential earnings
  questionPool: QuizQuestion[];
  usedQuestionIds: string[];
  playerProfiles: Record<string, { username: string; avatar: string }>;
}
