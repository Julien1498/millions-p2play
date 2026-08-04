import type { Difficulty, QuizQuestion } from "./types";
import { FALLBACK_QUESTIONS } from "./fallbackQuestions";

const DIRECT_API_HOST = "https://quizzapi.jomoreschi.fr";

export interface QuizzCategory {
  id: string;
  name: string;
  slug: string;
}

const DEFAULT_CATEGORIES: QuizzCategory[] = [
  { id: "c1", name: "Culture Générale", slug: "culture_generale" },
  { id: "c2", name: "Histoire", slug: "histoire" },
  { id: "c3", name: "Géographie", slug: "geographie" },
  { id: "c4", name: "Science", slug: "science" },
  { id: "c5", name: "Art & Littérature", slug: "art_litterature" },
];

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
  try {
    const res = await fetch(getApiEndpoint("/api/v2/quiz/categories"));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : DEFAULT_CATEGORIES;
  } catch (err) {
    // Fallback to default category list on network/CORS failure
    return DEFAULT_CATEGORIES;
  }
}

export async function fetchQuizzesFromAPI(
  difficulty?: Difficulty,
  categorySlug?: string,
  limit: number = 10
): Promise<QuizQuestion[]> {
  try {
    const params = new URLSearchParams();
    if (difficulty) params.set("difficulty", difficulty);
    if (categorySlug && categorySlug !== "all") params.set("category", categorySlug);
    params.set("limit", limit.toString());

    const url = `${getApiEndpoint("/api/v2/quiz")}?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    if (data && Array.isArray(data.quizzes) && data.quizzes.length > 0) {
      return data.quizzes.map((q: any) => ({
        id: q.id || `q-${Math.random().toString(36).slice(2)}`,
        question: q.question,
        answer: q.answer,
        badAnswers: Array.isArray(q.badAnswers) ? q.badAnswers : ["Réponse A", "Réponse B", "Réponse C"],
        category: q.category || "Culture générale",
        difficulty: (q.difficulty as Difficulty) || difficulty || "normal",
      }));
    }
  } catch (err) {
    // Silent fallback to offline pool on network failure
  }

  // Fallback to local pool filtered by difficulty
  let pool = [...FALLBACK_QUESTIONS];
  if (difficulty) {
    pool = pool.filter((q) => q.difficulty === difficulty);
  }
  if (pool.length === 0) pool = [...FALLBACK_QUESTIONS];

  pool.sort(() => Math.random() - 0.5);
  return pool.slice(0, limit);
}

export async function prepareGameQuestionPool(categorySlug?: string): Promise<QuizQuestion[]> {
  const [faciles, normales, difficiles] = await Promise.all([
    fetchQuizzesFromAPI("facile", categorySlug, 6),
    fetchQuizzesFromAPI("normal", categorySlug, 6),
    fetchQuizzesFromAPI("difficile", categorySlug, 6),
  ]);

  const pool: QuizQuestion[] = [];

  pool.push(...faciles.slice(0, 5));
  pool.push(...normales.slice(0, 5));
  pool.push(...difficiles.slice(0, 5));

  while (pool.length < 15) {
    const randomFallback = FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
    if (!pool.some((q) => q.id === randomFallback.id)) {
      pool.push(randomFallback);
    }
  }

  return pool.slice(0, 15);
}
