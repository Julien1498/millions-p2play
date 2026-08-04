import type { QuizQuestion } from "./types";

export function compute5050RemovedIndices(correctIndex: number): number[] {
  const wrongIndices = [0, 1, 2, 3].filter((i) => i !== correctIndex);
  // Shuffle wrong indices and take 2
  wrongIndices.sort(() => Math.random() - 0.5);
  return wrongIndices.slice(0, 2);
}

export function computeAudienceVotes(
  correctIndex: number,
  level: number,
  spectatorVotes?: Record<string, number> // peerId -> chosenIndex
): Record<number, number> {
  const result: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };

  if (spectatorVotes && Object.keys(spectatorVotes).length >= 2) {
    // Aggregate real spectator votes
    const totalVotes = Object.keys(spectatorVotes).length;
    Object.values(spectatorVotes).forEach((choice) => {
      if (choice >= 0 && choice <= 3) {
        result[choice] = (result[choice] || 0) + 1;
      }
    });
    // Convert to percentages
    [0, 1, 2, 3].forEach((idx) => {
      result[idx] = Math.round(((result[idx] || 0) / totalVotes) * 100);
    });
    return result;
  }

  // Simulated Audience poll based on level difficulty
  // Higher level = lower audience confidence
  let correctPct = 75 - level * 2.5; // level 1: ~72%, level 15: ~37%
  correctPct = Math.max(32, Math.min(80, correctPct));

  let remainingPct = 100 - correctPct;
  const wrongIndices = [0, 1, 2, 3].filter((i) => i !== correctIndex);

  // Distribute remaining among wrong options
  const r1 = Math.floor(Math.random() * (remainingPct * 0.6));
  const r2 = Math.floor(Math.random() * (remainingPct - r1));
  const r3 = remainingPct - r1 - r2;

  const wrongSplits = [r1, r2, r3].sort(() => Math.random() - 0.5);

  result[correctIndex] = Math.round(correctPct);
  wrongIndices.forEach((idx, i) => {
    result[idx] = Math.round(wrongSplits[i]);
  });

  return result;
}

export function computePhoneFriendHint(
  correctIndex: number,
  choices: string[],
  level: number
): string {
  const letters = ["A", "B", "C", "D"];
  const correctLetter = letters[correctIndex];

  // Friend accuracy drops as level increases
  const accuracy = Math.max(40, 95 - level * 3.5);
  const isAccurate = Math.random() * 100 <= accuracy;

  if (isAccurate) {
    const confidence = Math.round(70 + Math.random() * 25);
    return `« Allo ! Je suis sûr à ${confidence}% que la bonne réponse est la ${correctLetter} : "${choices[correctIndex]}". »`;
  } else {
    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== correctIndex);
    const randomWrong = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
    return `« Hésitation... Je dirais sans doute la ${letters[randomWrong]} : "${choices[randomWrong]}", mais ne suis pas certain à 100%. »`;
  }
}
