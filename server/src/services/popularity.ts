/**
 * Calcul de la "recette la plus populaire du mois".
 *
 * Chaque interaction réalisée pendant le mois rapporte des points :
 * un favori pèse plus lourd qu'une note, elle-même plus lourde qu'un commentaire.
 * Les fonctions de ce fichier sont pures (sans base de données) pour être testées unitairement.
 */

export const POPULARITY_WEIGHTS = {
  favorite: 3,
  rating: 2,
  comment: 1,
} as const

export interface PopularityCounts {
  favorites: number
  ratings: number
  comments: number
}

export function popularityScore({ favorites, ratings, comments }: PopularityCounts) {
  return (
    favorites * POPULARITY_WEIGHTS.favorite +
    ratings * POPULARITY_WEIGHTS.rating +
    comments * POPULARITY_WEIGHTS.comment
  )
}

export interface PopularityCandidate extends PopularityCounts {
  recipeId: string
  averageRating: number
}

/** Trie par score décroissant, puis par note moyenne. Les recettes sans interaction sont écartées. */
export function rankByPopularity<T extends PopularityCandidate>(candidates: T[]) {
  return candidates
    .map((candidate) => ({ ...candidate, score: popularityScore(candidate) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || b.averageRating - a.averageRating)
}

const MONTH_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/

export function isMonthKey(value: string) {
  return MONTH_KEY.test(value)
}

/** Clé de mois au format AAAA-MM (UTC). */
export function monthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Bornes [start, end[ d'un mois donné. */
export function monthRange(key: string) {
  const match = MONTH_KEY.exec(key)
  if (!match) {
    throw new Error(`Mois invalide : ${key}`)
  }
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  return {
    start: new Date(Date.UTC(year, month, 1)),
    end: new Date(Date.UTC(year, month + 1, 1)),
  }
}

export function previousMonthKey(key: string) {
  const { start } = monthRange(key)
  return monthKey(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1)))
}
