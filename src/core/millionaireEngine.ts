import type {
  GameConfig,
  GameState,
  JokerType,
  QuizQuestion,
} from "./types";
import { getLadderStep, getSafetyThresholdEarnings, getWalkAwayEarnings } from "./ladder";
import { compute5050RemovedIndices, computeAudienceVotes, computePhoneFriendHint } from "./jokers";

export class MillionaireEngine {
  public state: GameState;

  constructor(initialConfig?: Partial<GameConfig>) {
    this.state = this.createInitialState(initialConfig);
  }

  public createInitialState(customConfig?: Partial<GameConfig>): GameState {
    const config: GameConfig = {
      presenterMode: "HOST_PRESENTER",
      presenterPeerId: null,
      candidatePeerIds: [],
      categoryFilter: "all",
      autoTimerSeconds: 0,
      enabledJokers: ["50_50", "PHONE", "AUDIENCE", "SWITCH"],
      ...customConfig,
    };

    return {
      config,
      phase: "LOBBY",
      currentLevel: 1,
      currentQuestion: null,
      shuffledChoices: [],
      correctAnswerIndex: null,
      selectedIndex: null,
      isFinalAnswer: false,
      isAnswerCorrect: null,
      revealedChoicesCount: 4,
      jokers: {
        "50_50": { used: false, removedIndices: [] },
        PHONE: { used: false, hintText: null },
        AUDIENCE: { used: false, votes: null },
        SWITCH: { used: false },
      },
      activeCandidatePeerId: null,
      activeCandidatePeerIds: [],
      earnings: 0,
      potentialEarnings: 100,
      questionPool: [],
      usedQuestionIds: [],
      playerProfiles: {},
    };
  }

  public setConfig(partial: Partial<GameConfig>): boolean {
    if (this.state.phase !== "LOBBY") return false;
    this.state.config = { ...this.state.config, ...partial };
    return true;
  }

  public registerProfile(peerId: string, username: string, avatar?: string): boolean {
    if (!peerId || !username) return false;
    this.state.playerProfiles = {
      ...this.state.playerProfiles,
      [peerId]: {
        username,
        avatar: avatar || "💰",
      },
    };
    return true;
  }

  public startGame(pool: QuizQuestion[], candidates?: string[] | string): boolean {
    if (pool.length === 0) return false;

    const candidateList = Array.isArray(candidates)
      ? candidates
      : candidates
      ? [candidates]
      : this.state.config.candidatePeerIds.length > 0
      ? this.state.config.candidatePeerIds
      : [];

    this.state.questionPool = pool;
    this.state.usedQuestionIds = [];
    this.state.currentLevel = 1;
    this.state.earnings = 0;
    this.state.activeCandidatePeerIds = candidateList;
    this.state.activeCandidatePeerId = candidateList[0] || null;

    // Reset Jokers
    this.state.jokers = {
      "50_50": { used: false, removedIndices: [] },
      PHONE: { used: false, hintText: null },
      AUDIENCE: { used: false, votes: null },
      SWITCH: { used: false },
    };

    return this.loadQuestionForLevel(1);
  }

  public loadQuestionForLevel(level: number, customQuestion?: QuizQuestion): boolean {
    const question = customQuestion || this.state.questionPool[level - 1];
    if (!question) return false;

    this.state.currentLevel = level;
    this.state.currentQuestion = question;
    this.state.usedQuestionIds.push(question.id);

    // Shuffle choices A, B, C, D
    const choices = [question.answer, ...question.badAnswers];
    choices.sort(() => Math.random() - 0.5);

    this.state.shuffledChoices = choices;
    this.state.correctAnswerIndex = choices.indexOf(question.answer);
    this.state.selectedIndex = null;
    this.state.isFinalAnswer = false;
    this.state.isAnswerCorrect = null;
    this.state.potentialEarnings = getLadderStep(level).amount;
    this.state.revealedChoicesCount = this.state.config.presenterMode === "HOST_PRESENTER" ? 0 : 4;
    this.state.phase = "QUESTION_ACTIVE";

    // Reset transient jokers info for this question
    this.state.jokers["50_50"].removedIndices = [];
    this.state.jokers.PHONE.hintText = null;
    this.state.jokers.AUDIENCE.votes = null;

    return true;
  }

  public revealNextChoice(): boolean {
    if (this.state.revealedChoicesCount < 4) {
      this.state.revealedChoicesCount += 1;
      return true;
    }
    return false;
  }

  public revealAllChoices(): boolean {
    this.state.revealedChoicesCount = 4;
    return true;
  }

  public selectAnswer(index: number): boolean {
    if (this.state.phase !== "QUESTION_ACTIVE" && this.state.phase !== "ANSWER_SELECTED") return false;
    if (this.state.isFinalAnswer) return false;
    if (this.state.jokers["50_50"].removedIndices.includes(index)) return false;
    if (index >= this.state.revealedChoicesCount) return false;

    this.state.selectedIndex = index;
    this.state.phase = "ANSWER_SELECTED";
    return true;
  }

  public lockFinalAnswer(): boolean {
    if (this.state.selectedIndex === null) return false;
    this.state.isFinalAnswer = true;
    this.state.phase = "FINAL_ANSWER";
    return true;
  }

  public revealResult(): boolean {
    if (this.state.selectedIndex === null) return false;

    const isCorrect = this.state.selectedIndex === this.state.correctAnswerIndex;
    this.state.isAnswerCorrect = isCorrect;
    this.state.phase = "REVEAL_RESULT";

    if (isCorrect) {
      this.state.earnings = this.state.potentialEarnings;
      if (this.state.currentLevel >= 15) {
        this.state.phase = "VICTORY";
      } else {
        this.state.phase = "QUESTION_SUCCESS";
      }
    } else {
      this.state.earnings = getSafetyThresholdEarnings(this.state.currentLevel - 1);
      this.state.phase = "GAME_OVER";
    }

    return true;
  }

  public nextLevel(nextQuestion?: QuizQuestion): boolean {
    if (this.state.currentLevel >= 15) {
      this.state.phase = "VICTORY";
      return false;
    }
    return this.loadQuestionForLevel(this.state.currentLevel + 1, nextQuestion);
  }

  public walkAway(): boolean {
    if (this.state.phase === "LOBBY" || this.state.phase === "GAME_OVER" || this.state.phase === "VICTORY") {
      return false;
    }
    this.state.earnings = getWalkAwayEarnings(this.state.currentLevel);
    this.state.phase = "WALK_AWAY";
    return true;
  }

  public triggerJoker(type: JokerType, extraQuestion?: QuizQuestion): boolean {
    if (this.state.jokers[type].used) return false;
    if (this.state.phase !== "QUESTION_ACTIVE" && this.state.phase !== "ANSWER_SELECTED") return false;

    if (type === "50_50") {
      this.state.jokers["50_50"].used = true;
      if (this.state.correctAnswerIndex !== null) {
        this.state.jokers["50_50"].removedIndices = compute5050RemovedIndices(this.state.correctAnswerIndex);
      }
    } else if (type === "PHONE") {
      this.state.jokers.PHONE.used = true;
      if (this.state.correctAnswerIndex !== null) {
        this.state.jokers.PHONE.hintText = computePhoneFriendHint(
          this.state.correctAnswerIndex,
          this.state.shuffledChoices,
          this.state.currentLevel
        );
      }
    } else if (type === "AUDIENCE") {
      this.state.jokers.AUDIENCE.used = true;
      if (this.state.correctAnswerIndex !== null) {
        this.state.jokers.AUDIENCE.votes = computeAudienceVotes(this.state.correctAnswerIndex, this.state.currentLevel);
      }
    } else if (type === "SWITCH") {
      this.state.jokers.SWITCH.used = true;
      if (extraQuestion) {
        this.loadQuestionForLevel(this.state.currentLevel, extraQuestion);
      }
    }

    return true;
  }

  public resetToLobby(): void {
    this.state.phase = "LOBBY";
    this.state.currentLevel = 1;
    this.state.currentQuestion = null;
    this.state.shuffledChoices = [];
    this.state.correctAnswerIndex = null;
    this.state.selectedIndex = null;
    this.state.isFinalAnswer = false;
    this.state.isAnswerCorrect = null;
    this.state.revealedChoicesCount = 4;
    this.state.earnings = 0;
    this.state.potentialEarnings = 100;
    this.state.questionPool = [];
    this.state.usedQuestionIds = [];
    this.state.activeCandidatePeerIds = [];
    this.state.activeCandidatePeerId = null;
    this.state.config.presenterPeerId = null;
    this.state.config.candidatePeerIds = [];
    // Note: playerProfiles is explicitly preserved so registered player usernames stay intact
  }
}
