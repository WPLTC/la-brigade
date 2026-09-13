import type { Prisma } from '@prisma/client'

/** Champs publics d'un utilisateur (jamais l'email ni le mot de passe) */
export const authorSelect = {
  id: true,
  name: true,
  role: true,
} satisfies Prisma.UserSelect

/** Tout ce qu'il faut pour afficher une "carte recette" */
export const recipeCardSelect = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  category: true,
  difficulty: true,
  prepTime: true,
  cookTime: true,
  totalTime: true,
  servings: true,
  status: true,
  isBistronomic: true,
  averageRating: true,
  ratingsCount: true,
  createdAt: true,
  author: { select: authorSelect },
  chefPicks: { select: { month: true }, orderBy: { month: 'desc' }, take: 1 },
  _count: { select: { comments: true, favorites: true } },
} satisfies Prisma.RecipeSelect
