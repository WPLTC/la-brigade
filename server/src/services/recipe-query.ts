import type { Prisma } from '@prisma/client'
import { z } from 'zod'

export const CATEGORIES = ['ENTREE', 'PLAT', 'DESSERT'] as const
export const DIFFICULTIES = ['FACILE', 'MOYEN', 'DIFFICILE'] as const
export const SORTS = ['recent', 'rating', 'popular', 'quick'] as const

/** Les paramètres d'URL vides (?category=) sont traités comme absents */
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value)

export const recipeListQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  category: z.preprocess(emptyToUndefined, z.enum(CATEGORIES).optional()),
  difficulty: z.preprocess(emptyToUndefined, z.enum(DIFFICULTIES).optional()),
  maxTime: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  bistronomic: z.preprocess(
    emptyToUndefined,
    z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
  ),
  sort: z.preprocess(emptyToUndefined, z.enum(SORTS).default('recent')),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).default(1)),
  pageSize: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(48).default(12)),
})

export type RecipeListQuery = z.infer<typeof recipeListQuerySchema>
export type RecipeSort = (typeof SORTS)[number]

/** Traduit les filtres de la page "liste des recettes" en clause Prisma. Seules les recettes validées sont publiques. */
export function buildRecipeWhere(query: Partial<RecipeListQuery>): Prisma.RecipeWhereInput {
  const where: Prisma.RecipeWhereInput = { status: 'VALIDATED' }

  if (query.search) {
    const contains = { contains: query.search, mode: 'insensitive' as const }
    where.OR = [
      { title: contains },
      { description: contains },
      { ingredients: { some: { name: contains } } },
    ]
  }
  if (query.category) where.category = query.category
  if (query.difficulty) where.difficulty = query.difficulty
  if (query.maxTime) where.totalTime = { lte: query.maxTime }
  if (query.bistronomic !== undefined) where.isBistronomic = query.bistronomic

  return where
}

export function buildRecipeOrderBy(sort: RecipeSort): Prisma.RecipeOrderByWithRelationInput[] {
  switch (sort) {
    case 'rating':
      return [{ averageRating: 'desc' }, { ratingsCount: 'desc' }, { createdAt: 'desc' }]
    case 'popular':
      return [{ favorites: { _count: 'desc' } }, { ratingsCount: 'desc' }, { createdAt: 'desc' }]
    case 'quick':
      return [{ totalTime: 'asc' }, { createdAt: 'desc' }]
    case 'recent':
    default:
      return [{ createdAt: 'desc' }]
  }
}
