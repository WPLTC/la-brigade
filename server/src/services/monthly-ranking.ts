import { prisma } from '../lib/prisma.js'
import { recipeCardSelect } from '../lib/selects.js'
import { monthRange, rankByPopularity } from './popularity.js'

/**
 * Classement de popularité des recettes validées sur un mois donné,
 * à partir des favoris, notes et commentaires reçus pendant ce mois.
 */
export async function getMonthlyRanking(month: string, limit = 10) {
  const { start, end } = monthRange(month)
  const inMonth = { gte: start, lt: end }
  const validated = { status: 'VALIDATED' as const }

  const [favorites, ratings, comments] = await Promise.all([
    prisma.favorite.groupBy({
      by: ['recipeId'],
      where: { createdAt: inMonth, recipe: validated },
      _count: { _all: true },
    }),
    prisma.rating.groupBy({
      by: ['recipeId'],
      where: { updatedAt: inMonth, recipe: validated },
      _count: { _all: true },
    }),
    prisma.comment.groupBy({
      by: ['recipeId'],
      where: { createdAt: inMonth, recipe: validated },
      _count: { _all: true },
    }),
  ])

  const counts = new Map<string, { favorites: number; ratings: number; comments: number }>()
  const entry = (recipeId: string) => {
    let value = counts.get(recipeId)
    if (!value) {
      value = { favorites: 0, ratings: 0, comments: 0 }
      counts.set(recipeId, value)
    }
    return value
  }
  favorites.forEach((row) => (entry(row.recipeId).favorites = row._count._all))
  ratings.forEach((row) => (entry(row.recipeId).ratings = row._count._all))
  comments.forEach((row) => (entry(row.recipeId).comments = row._count._all))

  if (counts.size === 0) return []

  const recipes = await prisma.recipe.findMany({
    where: { id: { in: [...counts.keys()] } },
    select: recipeCardSelect,
  })

  const ranked = rankByPopularity(
    recipes.map((recipe) => ({
      recipeId: recipe.id,
      averageRating: recipe.averageRating,
      ...counts.get(recipe.id)!,
      recipe,
    })),
  )

  return ranked.slice(0, limit).map(({ recipe, favorites, ratings, comments, score }) => ({
    recipe,
    favorites,
    ratings,
    comments,
    score,
  }))
}
