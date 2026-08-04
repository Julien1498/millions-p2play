import { describe, it, expect, beforeEach } from "vitest";
import { MillionaireEngine } from "./millionaireEngine";
import { FALLBACK_QUESTIONS } from "./fallbackQuestions";
import { getLadderStep, getSafetyThresholdEarnings, getWalkAwayEarnings } from "./ladder";

describe("MillionaireEngine Core Logic", () => {
  let engine: MillionaireEngine;

  beforeEach(() => {
    engine = new MillionaireEngine();
  });

  it("should initialize in LOBBY phase with default config", () => {
    expect(engine.state.phase).toBe("LOBBY");
    expect(engine.state.currentLevel).toBe(1);
    expect(engine.state.earnings).toBe(0);
    expect(engine.state.config.presenterMode).toBe("HOST_PRESENTER");
  });

  it("should start game and load first question", () => {
    const started = engine.startGame(FALLBACK_QUESTIONS, "peer-1");
    expect(started).toBe(true);
    expect(engine.state.phase).toBe("QUESTION_ACTIVE");
    expect(engine.state.currentLevel).toBe(1);
    expect(engine.state.shuffledChoices.length).toBe(4);
    expect(engine.state.correctAnswerIndex).not.toBeNull();
  });

  it("should handle choice reveal, answer selection and final answer locking", () => {
    engine.startGame(FALLBACK_QUESTIONS, "peer-1");
    expect(engine.state.revealedChoicesCount).toBe(0);

    engine.revealNextChoice();
    expect(engine.state.revealedChoicesCount).toBe(1);

    engine.revealAllChoices();
    expect(engine.state.revealedChoicesCount).toBe(4);

    expect(engine.selectAnswer(1)).toBe(true);
    expect(engine.state.phase).toBe("ANSWER_SELECTED");
    expect(engine.state.selectedIndex).toBe(1);

    expect(engine.lockFinalAnswer()).toBe(true);
    expect(engine.state.phase).toBe("FINAL_ANSWER");
    expect(engine.state.isFinalAnswer).toBe(true);
  });

  it("should calculate correct earnings on correct reveal", () => {
    engine.startGame(FALLBACK_QUESTIONS, "peer-1");
    engine.revealAllChoices();

    const correctIdx = engine.state.correctAnswerIndex!;
    engine.selectAnswer(correctIdx);
    engine.lockFinalAnswer();
    engine.revealResult();

    expect(engine.state.isAnswerCorrect).toBe(true);
    expect(engine.state.earnings).toBe(100);
    expect(engine.state.phase).toBe("QUESTION_SUCCESS");
  });

  it("should drop to safety threshold on wrong answer reveal", () => {
    engine.startGame(FALLBACK_QUESTIONS, "peer-1");
    // Simulate level 6 (passed level 5 safety threshold 800 €)
    engine.loadQuestionForLevel(6);
    engine.revealAllChoices();

    const wrongIdx = (engine.state.correctAnswerIndex! + 1) % 4;
    engine.selectAnswer(wrongIdx);
    engine.lockFinalAnswer();
    engine.revealResult();

    expect(engine.state.isAnswerCorrect).toBe(false);
    expect(engine.state.earnings).toBe(800); // Level 5 safety threshold
    expect(engine.state.phase).toBe("GAME_OVER");
  });

  it("should trigger 50:50 joker and remove 2 wrong answers", () => {
    engine.startGame(FALLBACK_QUESTIONS, "peer-1");
    const triggered = engine.triggerJoker("50_50");
    expect(triggered).toBe(true);
    expect(engine.state.jokers["50_50"].used).toBe(true);
    expect(engine.state.jokers["50_50"].removedIndices.length).toBe(2);
    expect(engine.state.jokers["50_50"].removedIndices).not.toContain(
      engine.state.correctAnswerIndex
    );
  });

  it("should calculate walk away earnings accurately", () => {
    expect(getWalkAwayEarnings(1)).toBe(0);
    expect(getWalkAwayEarnings(6)).toBe(800); // 800 € from level 5
    expect(getWalkAwayEarnings(11)).toBe(24000); // 24 000 € from level 10
  });

  it("should evaluate ladder thresholds correctly", () => {
    expect(getSafetyThresholdEarnings(4)).toBe(0);
    expect(getSafetyThresholdEarnings(5)).toBe(800);
    expect(getSafetyThresholdEarnings(9)).toBe(800);
    expect(getSafetyThresholdEarnings(10)).toBe(24000);
    expect(getLadderStep(15).amount).toBe(1000000);
  });
});
