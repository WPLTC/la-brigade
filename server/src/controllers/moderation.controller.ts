import type { Request, Response } from 'express'
import { z } from 'zod'
import { badRequest, conflict, notFound } from '../lib/http-error.js'
import { prisma } from '../lib/prisma.js'
import { authorSelect, recipeCardSelect } from '../lib/selects.js'
import { parse } from '../lib/validation.js'
import { reviewInputSchema } from '../schemas/recipe.schemas.js'
import { getMonthlyRanking } from '../services/monthly-ranking.js'
import { isMonthKey, monthKey } from '../services/popularity.js'

const statusQuerySchema = z.object({
  status: z.enum(['PENDING', 'VALIDATED', 'REJECTED']).default('PENDING'),
})

const monthSchema = z.string().refine(isMonthKey, 'Mois invalide (format attendu : AAAA-MM)')

const chefPickSchema = z.object({
  recipeId: z.string({ required_error: 'Choisis une recette' }).min(1, 'Choisis une recette'),
  verdict: z
    .string({ required_error: 'Le verdict du chef est obligatoire' })
    .trim()
    .min(10, 'Le verdict du chef doit contenir au moins 10 caractères')
    .max(1000, 'Le verdict ne doit pas dépasser 1000 caractères'),
})

const roleSchema = z.object({
  role: z.enum(['USER', 'CHEF_TEAM'], { errorMap: () => ({ message: 'Rôle invalide' }) }),
})

export async function getStats(_req: Request, res: Response) {
  const [byStatus, bistronomic, members, chefTeam, comments, ratings, oldestPending] = await Promise.all([
    prisma.recipe.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.recipe.count({ where: { status: 'VALIDATED', isBistronomic: true } }),
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CHEF_TEAM' } }),
    prisma.comment.count(),
    prisma.rating.count(),
    prisma.recipe.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
  ])

  const count = (status: string) => byStatus.find((row) => row.status === status)?._count._all ?? 0

  res.json({
    pending: count('PENDING'),
    validated: count('VALIDATED'),
    rejected: count('REJECTED'),
    bistronomic,
    members,
    chefTeam,
    comments,
    ratings,
    oldestPendingAt: oldestPending?.createdAt ?? null,
  })
}

/** File de validation : les recettes en attente sont servies de la plus ancienne à la plus récente. */
export async function listRecipesForReview(req: Request, res: Response) {
  const { status } = parse(statusQuerySchema, req.query)

  const recipes = await prisma.recipe.findMany({
    where: { status },
    orderBy: status === 'PENDING' ? { createdAt: 'asc' } : { reviewedAt: 'desc' },
    select: {
      ...recipeCardSelect,
      reviewNote: true,
      reviewedAt: true,
      updatedAt: true,
      reviewer: { select: authorSelect },
      ingredients: { orderBy: { position: 'asc' } },
      steps: { orderBy: { order: 'asc' } },
    },
  })

  res.json(recipes)
}

export async function reviewRecipe(req: Request<{ id: string }>, res: Response) {
  const input = parse(reviewInputSchema, req.body)
  const existing = await prisma.recipe.findUnique({
    where: { id: req.params.id },
    select: { id: true, isBistronomic: true },
  })
  if (!existing) {
    throw notFound('Recette introuvable')
  }

  const recipe = await prisma.recipe.update({
    where: { id: existing.id },
    data: {
      status: input.status,
      // Seule une recette validée peut faire partie de la sélection bistronomique
      isBistronomic: input.status === 'VALIDATED' ? (input.isBistronomic ?? existing.isBistronomic) : false,
      ...(input.reviewNote !== undefined ? { reviewNote: input.reviewNote || null } : {}),
      reviewedAt: new Date(),
      reviewerId: req.user!.userId,
    },
    select: { id: true, status: true, isBistronomic: true, reviewNote: true, reviewedAt: true },
  })

  res.json(recipe)
}

export async function getMonthly(req: Request, res: Response) {
  const month = req.query.month ? parse(monthSchema, req.query.month) : monthKey()

  const [ranking, pick, history] = await Promise.all([
    getMonthlyRanking(month, 10),
    prisma.chefPick.findUnique({
      where: { month },
      include: { recipe: { select: recipeCardSelect }, chef: { select: authorSelect } },
    }),
    prisma.chefPick.findMany({
      orderBy: { month: 'desc' },
      take: 12,
      include: { recipe: { select: { id: true, title: true, imageUrl: true } } },
    }),
  ])

  res.json({ month, ranking, pick, history })
}

export async function setMonthlyPick(req: Request, res: Response) {
  const month = parse(monthSchema, req.params.month)
  const { recipeId, verdict } = parse(chefPickSchema, req.body)

  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { status: true } })
  if (!recipe) {
    throw notFound('Recette introuvable')
  }
  if (recipe.status !== 'VALIDATED') {
    throw conflict('Seule une recette validée peut devenir la recette du mois')
  }

  const ranking = await getMonthlyRanking(month, 50)
  const score = ranking.find((entry) => entry.recipe.id === recipeId)?.score ?? 0

  const pick = await prisma.chefPick.upsert({
    where: { month },
    update: { recipeId, verdict, score, chefId: req.user!.userId },
    create: { month, recipeId, verdict, score, chefId: req.user!.userId },
    include: { recipe: { select: recipeCardSelect }, chef: { select: authorSelect } },
  })

  res.json(pick)
}

export async function deleteMonthlyPick(req: Request, res: Response) {
  const month = parse(monthSchema, req.params.month)
  await prisma.chefPick.deleteMany({ where: { month } })
  res.status(204).end()
}

export async function listUsers(req: Request, res: Response) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: [{ role: 'desc' }, { createdAt: 'asc' }],
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { recipes: true, comments: true, ratings: true } },
    },
  })

  res.json(users)
}

export async function updateUserRole(req: Request<{ id: string }>, res: Response) {
  const { role } = parse(roleSchema, req.body)

  if (req.params.id === req.user!.userId) {
    throw badRequest('Tu ne peux pas modifier ton propre rôle')
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: { id: true, name: true, role: true },
  })

  res.json(user)
}
