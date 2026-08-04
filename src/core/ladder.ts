import type { LadderStep, QuestionLevel } from "./types";

export const MILLIONAIRE_LADDER: LadderStep[] = [
  { level: 1, amount: 100, formattedAmount: "100 €", isSafetyThreshold: false },
  { level: 2, amount: 200, formattedAmount: "200 €", isSafetyThreshold: false },
  { level: 3, amount: 300, formattedAmount: "300 €", isSafetyThreshold: false },
  { level: 4, amount: 500, formattedAmount: "500 €", isSafetyThreshold: false },
  { level: 5, amount: 800, formattedAmount: "800 €", isSafetyThreshold: true },
  { level: 6, amount: 1500, formattedAmount: "1 500 €", isSafetyThreshold: false },
  { level: 7, amount: 3000, formattedAmount: "3 000 €", isSafetyThreshold: false },
  { level: 8, amount: 6000, formattedAmount: "6 000 €", isSafetyThreshold: false },
  { level: 9, amount: 12000, formattedAmount: "12 000 €", isSafetyThreshold: false },
  { level: 10, amount: 24000, formattedAmount: "24 000 €", isSafetyThreshold: true },
  { level: 11, amount: 48000, formattedAmount: "48 000 €", isSafetyThreshold: false },
  { level: 12, amount: 72000, formattedAmount: "72 000 €", isSafetyThreshold: false },
  { level: 13, amount: 100000, formattedAmount: "100 000 €", isSafetyThreshold: false },
  { level: 14, amount: 300000, formattedAmount: "300 000 €", isSafetyThreshold: false },
  { level: 15, amount: 1000000, formattedAmount: "1 000 000 €", isSafetyThreshold: true },
];

export function getLadderStep(level: QuestionLevel): LadderStep {
  const step = MILLIONAIRE_LADDER.find((s) => s.level === level);
  return step ?? MILLIONAIRE_LADDER[0];
}

/**
 * Returns guaranteed safety threshold amount based on current completed level.
 */
export function getSafetyThresholdEarnings(completedLevel: number): number {
  if (completedLevel >= 10) return 24000;
  if (completedLevel >= 5) return 800;
  return 0;
}

/**
 * Returns money amount when candidate walks away before answering level.
 */
export function getWalkAwayEarnings(level: QuestionLevel): number {
  if (level <= 1) return 0;
  const previousStep = getLadderStep(level - 1);
  return previousStep.amount;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
