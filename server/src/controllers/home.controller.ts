import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authorSelect, recipeCardSelect } from '../lib/selects.js'
import { getMonthlyRanking } from '../services/monthly-ranking.js'
import { monthKey } from '../services/popularity.js'

const chefPickInclude = {
  recipe: { select: recipeCardSelect },
  chef: { select: authorSelect },
} as const

/** Tout le contenu de la page d'accueil en un seul appel. */
export async function getHome(_req: Request, res: Response) {
  const currentMonth = monthKey()
  const validated = { status: 'VALIDATED' as const }

  const [recipes, members, bistronomic, categories, chefPick, featured, latest, monthlyRace] =
    await Promise.all([
      prisma.recipe.count({ where: validated }),
      prisma.user.count(),
      prisma.recipe.count({ where: { ...validated, isBistronomic: true } }),
      prisma.recipe.groupBy({ by: ['category'], where: validated, _count: { _all: true } }),
      prisma.chefPick.findFirst({ orderBy: { month: 'desc' }, include: chefPickInclude }),
      prisma.recipe.findMany({
        where: validated,
        orderBy: [{ isBistronomic: 'desc' }, { averageRating: 'desc' }, { ratingsCount: 'desc' }],
        take: 3,
        select: recipeCardSelect,
      }),
      prisma.recipe.findMany({
        where: validated,
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: recipeCardSelect,
      }),
      getMonthlyRanking(currentMonth, 3),
    ])

  const categoryCount = (category: string) =>
    categories.find((row) => row.category === category)?._count._all ?? 0

  res.json({
    stats: { recipes, members, bistronomic },
    categories: {
      ENTREE: categoryCount('ENTREE'),
      PLAT: categoryCount('PLAT'),
      DESSERT: categoryCount('DESSERT'),
    },
    chefPick,
    featured,
    latest,
    monthlyRace: { month: currentMonth, ranking: monthlyRace },
  })
}

/** Historique public des recettes du mois testées par le chef. */
export async function listChefPicks(_req: Request, res: Response) {
  const picks = await prisma.chefPick.findMany({
    orderBy: { month: 'desc' },
    include: chefPickInclude,
  })
  res.json(picks)
}
