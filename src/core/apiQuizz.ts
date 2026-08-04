import type { Difficulty, QuizQuestion } from "./types";
import { FALLBACK_QUESTIONS } from "./fallbackQuestions";

const DIRECT_API_HOST = "https://quizzapi.jomoreschi.fr";

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
    // Direct browser fetch to /categories on production triggers CORS console error
    // because the external API lacks Access-Control-Allow-Origin headers on /categories.
    // Return default categories directly to ensure zero console errors.
    return DEFAULT_CATEGORIES;
  }

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
