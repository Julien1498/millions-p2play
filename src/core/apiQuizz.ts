import type { Difficulty, QuizQuestion } from "./types";
import { FALLBACK_QUESTIONS } from "./fallbackQuestions";

const DIRECT_API_HOST = "https://quizzapi.jomoreschi.fr";
const HISTORY_KEY = "MILLIONAIRE_PLAYED_QUESTIONS_HISTORY";

export interface QuizzCategory {
  id: string;
  name: string;
  slug: string;
}

export const DEFAULT_CATEGORIES: QuizzCategory[] = [
  { id: "cmck8wdgi0001hzrocg4h8p39", name: "Culture générale", slug: "culture_generale" },
  { id: "cmck8wdgi0000hzrotiew45v6", name: "Musique", slug: "musique" },
  { id: "cmck8wdgi0002hzrogafqdta7", name: "Arts et littérature", slug: "art_litterature" },
  { id: "cmck8wdgi0003hzroikw9krfe", name: "TV et cinéma", slug: "tv_cinema" },
  { id: "cmck8wdgi0004hzro6ki6dq2m", name: "Actualités et politique", slug: "actu_politique" },
  { id: "cmck8wdgi0005hzrosvpphnje", name: "Sport", slug: "sport" },
  { id: "cmck8wdgi0006hzrolulrfg0v", name: "Jeux vidéos", slug: "jeux_videos" },
  { id: "cmgp9fign001uhzbjiwabp29p", name: "Histoire", slug: "histoire" },
  { id: "cmgp9imnk001whzbjhmcc2bn8", name: "Géographie", slug: "geographie" },
  { id: "cmgp9jf2z001xhzbjjeaeb9i3", name: "Science", slug: "science" },
  { id: "cmgp9jpuh001yhzbj8na5lk44", name: "Gastronomie", slug: "gastronomie" },
];

/**
 * Returns set of played question IDs and normalized question texts stored in localStorage
 */
export function getPlayedQuestionsHistory(): Set<string> {
  try {
    if (typeof localStorage === "undefined") return new Set();
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

/**
 * Persists played question IDs and normalized question texts to localStorage (rolling 150 items)
 */
export function recordPlayedQuestions(questions: QuizQuestion[]): void {
  try {
    if (typeof localStorage === "undefined") return;
    const history = Array.from(getPlayedQuestionsHistory());
    const newItems: string[] = [];

    questions.forEach((q) => {
      newItems.push(q.id);
      newItems.push(normalizeQuestionText(q.question));
    });

    const updated = Array.from(new Set([...newItems, ...history])).slice(0, 150);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

function normalizeQuestionText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Resolves the request URL:
 * Uses local Vite dev server proxy `/api-quizz` during local development (localhost) to bypass browser CORS policy,
 * or direct URL for production builds.
 */
function getApiEndpoint(path: string): string {
  const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";
  if (isDev) {
    return `/api-quizz${path}`;
  }
  return `${DIRECT_API_HOST}${path}`;
}

export async function fetchCategoriesFromAPI(): Promise<QuizzCategory[]> {
  const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";
  if (!isDev) {
    return DEFAULT_CATEGORIES;
  }

  try {
    const res = await fetch(getApiEndpoint("/api/v2/quiz/categories"));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : DEFAULT_CATEGORIES;
  } catch (err) {
    return DEFAULT_CATEGORIES;
  }
}

export async function fetchQuizzesFromAPI(
  difficulty?: Difficulty,
  categorySlug?: string,
  limit: number = 10,
  excludeIds: Set<string> = new Set(),
  excludeTexts: Set<string> = new Set()
): Promise<QuizQuestion[]> {
  try {
    const params = new URLSearchParams();
    if (difficulty) params.set("difficulty", difficulty);
    if (categorySlug && categorySlug !== "all") params.set("category", categorySlug);

    // Randomize page offset to fetch fresh questions across different API database pages
    const randomPage = Math.floor(Math.random() * 5) + 1;
    params.set("page", randomPage.toString());
    params.set("limit", Math.max(limit * 2, 20).toString());

    const url = `${getApiEndpoint("/api/v2/quiz")}?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    if (data && Array.isArray(data.quizzes) && data.quizzes.length > 0) {
      const parsed: QuizQuestion[] = data.quizzes.map((q: any) => ({
        id: q.id || `q-${Math.random().toString(36).slice(2)}`,
        question: q.question,
        answer: q.answer,
        badAnswers: Array.isArray(q.badAnswers) ? q.badAnswers : ["Réponse A", "Réponse B", "Réponse C"],
        category: q.category || "Culture générale",
        difficulty: (q.difficulty as Difficulty) || difficulty || "normal",
      }));

      const filtered = parsed.filter((q) => {
        const norm = normalizeQuestionText(q.question);
        return !excludeIds.has(q.id) && !excludeTexts.has(norm);
      });

      if (filtered.length > 0) {
        filtered.sort(() => Math.random() - 0.5);
        return filtered.slice(0, limit);
      }
    }
  } catch (err) {
    // Silent fallback
  }

  // Fallback to local pool filtered by difficulty and excluded items
  let pool = [...FALLBACK_QUESTIONS];
  if (difficulty) {
    pool = pool.filter((q) => q.difficulty === difficulty);
  }
  if (pool.length === 0) pool = [...FALLBACK_QUESTIONS];

  const filteredLocal = pool.filter((q) => {
    const norm = normalizeQuestionText(q.question);
    return !excludeIds.has(q.id) && !excludeTexts.has(norm);
  });

  const finalPool = filteredLocal.length > 0 ? filteredLocal : pool;
  finalPool.sort(() => Math.random() - 0.5);
  return finalPool.slice(0, limit);
}

/**
 * Prepares a 15-question game pool with strict unique question deduplication:
 * - Includes localStorage rolling history to avoid repeating questions from recent games
 * - 5 Easy questions (Levels 1-5)
 * - 5 Medium questions (Levels 6-10)
 * - 5 Hard questions (Levels 11-15)
 * Guarantees zero duplicate questions in a game and maximum variety across games.
 */
export async function prepareGameQuestionPool(categorySlug?: string): Promise<QuizQuestion[]> {
  const historySet = getPlayedQuestionsHistory();
  const seenIds = new Set<string>(historySet);
  const seenTexts = new Set<string>(historySet);

  const [faciles, normales, difficiles] = await Promise.all([
    fetchQuizzesFromAPI("facile", categorySlug, 10, seenIds, seenTexts),
    fetchQuizzesFromAPI("normal", categorySlug, 10, seenIds, seenTexts),
    fetchQuizzesFromAPI("difficile", categorySlug, 10, seenIds, seenTexts),
  ]);

  const pool: QuizQuestion[] = [];

  const addUniqueQuestions = (candidates: QuizQuestion[], targetCount: number) => {
    let added = 0;
    for (const q of candidates) {
      const norm = normalizeQuestionText(q.question);
      if (!seenIds.has(q.id) && !seenTexts.has(norm)) {
        seenIds.add(q.id);
        seenTexts.add(norm);
        pool.push(q);
        added++;
        if (added >= targetCount) break;
      }
    }
  };

  // Add 5 Easy (Levels 1-5)
  addUniqueQuestions(faciles, 5);

  // Add 5 Medium (Levels 6-10)
  addUniqueQuestions(normales, 5);

  // Add 5 Hard (Levels 11-15)
  addUniqueQuestions(difficiles, 5);

  // If pool is under 15 due to strict history exclusions, relax history filter for extra fallbacks
  if (pool.length < 15) {
    const currentPoolIds = new Set(pool.map((q) => q.id));
    const currentPoolTexts = new Set(pool.map((q) => normalizeQuestionText(q.question)));

    const shuffledFallbacks = [...FALLBACK_QUESTIONS].sort(() => Math.random() - 0.5);
    for (const fb of shuffledFallbacks) {
      if (pool.length >= 15) break;
      const norm = normalizeQuestionText(fb.question);
      if (!currentPoolIds.has(fb.id) && !currentPoolTexts.has(norm)) {
        currentPoolIds.add(fb.id);
        currentPoolTexts.add(norm);
        pool.push(fb);
      }
    }
  }

  // Record selected questions to localStorage history
  recordPlayedQuestions(pool);

  return pool.slice(0, 15);
}
