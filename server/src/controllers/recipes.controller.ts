import type { Request, Response } from 'express'
import { badRequest, conflict, forbidden, notFound } from '../lib/http-error.js'
import { prisma } from '../lib/prisma.js'
import { authorSelect, recipeCardSelect } from '../lib/selects.js'
import { removeUploadedFile } from '../lib/upload.js'
import { parse } from '../lib/validation.js'
import { isChefTeam } from '../middleware/auth.js'
import {
  commentInputSchema,
  ratingInputSchema,
  recipeInputSchema,
  toRecipeData,
} from '../schemas/recipe.schemas.js'
import { buildRecipeOrderBy, buildRecipeWhere, recipeListQuerySchema } from '../services/recipe-query.js'

type IdParams = { id: string }

async function findRecipeOr404(id: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: { id: true, authorId: true, status: true, imageUrl: true },
  })
  if (!recipe) {
    throw notFound('Recette introuvable')
  }
  return recipe
}

async function findValidatedRecipeOr404(id: string) {
  const recipe = await findRecipeOr404(id)
  if (recipe.status !== 'VALIDATED') {
    throw conflict("Cette recette n'est pas encore validée par la brigade")
  }
  return recipe
}

export async function listRecipes(req: Request, res: Response) {
  const query = parse(recipeListQuerySchema, req.query)
  const where = buildRecipeWhere(query)

  const [total, items] = await prisma.$transaction([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({
      where,
      select: recipeCardSelect,
      orderBy: buildRecipeOrderBy(query.sort),
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ])

  res.json({
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  })
}

export async function getRecipe(req: Request<IdParams>, res: Response) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: req.params.id },
    include: {
      author: { select: { ...authorSelect, bio: true } },
      reviewer: { select: authorSelect },
      ingredients: { orderBy: { position: 'asc' } },
      steps: { orderBy: { order: 'asc' } },
      comments: {
        include: { author: { select: authorSelect } },
        orderBy: { createdAt: 'desc' },
      },
      chefPicks: {
        include: { chef: { select: authorSelect } },
        orderBy: { month: 'desc' },
      },
      _count: { select: { favorites: true, comments: true } },
    },
  })

  if (!recipe) {
    throw notFound('Recette introuvable')
  }

  const userId = req.user?.userId
  const isOwner = userId === recipe.authorId
  const isChef = await isChefTeam(userId)

  // Une recette non validée n'est visible que par son auteur et la brigade
  if (recipe.status !== 'VALIDATED' && !isOwner && !isChef) {
    throw notFound('Recette introuvable')
  }

  const [distribution, myRating, favorite] = await Promise.all([
    prisma.rating.groupBy({ by: ['value'], where: { recipeId: recipe.id }, _count: { _all: true } }),
    userId
      ? prisma.rating.findUnique({ where: { recipeId_authorId: { recipeId: recipe.id, authorId: userId } } })
      : null,
    userId
      ? prisma.favorite.findUnique({ where: { userId_recipeId: { userId, recipeId: recipe.id } } })
      : null,
  ])

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  distribution.forEach((row) => (ratingDistribution[row.value] = row._count._all))

  res.json({
    ...recipe,
    ratingDistribution,
    myRating: myRating?.value ?? null,
    isFavorite: Boolean(favorite),
    permissions: {
      canEdit: isOwner && recipe.status !== 'VALIDATED',
      canDelete: isOwner || isChef,
      canModerate: isChef,
      canRate: Boolean(userId) && !isOwner && recipe.status === 'VALIDATED',
    },
  })
}

export async function createRecipe(req: Request, res: Response) {
  const input = parse(recipeInputSchema, req.body)

  const recipe = await prisma.recipe.create({
    data: { ...toRecipeData(input), authorId: req.user!.userId },
    select: { id: true, status: true },
  })

  res.status(201).json(recipe)
}

export async function updateRecipe(req: Request<IdParams>, res: Response) {
  const input = parse(recipeInputSchema, req.body)
  const existing = await findRecipeOr404(req.params.id)

  if (existing.authorId !== req.user!.userId) {
    throw forbidden('Tu ne peux modifier que tes propres recettes')
  }
  if (existing.status === 'VALIDATED') {
    throw conflict('Une recette validée ne peut plus être modifiée')
  }

  // On remplace ingrédients et étapes, puis la recette repart en validation
  const [, , recipe] = await prisma.$transaction([
    prisma.ingredient.deleteMany({ where: { recipeId: existing.id } }),
    prisma.step.deleteMany({ where: { recipeId: existing.id } }),
    prisma.recipe.update({
      where: { id: existing.id },
      data: { ...toRecipeData(input), status: 'PENDING' },
      select: { id: true, status: true },
    }),
  ])

  res.json(recipe)
}

export async function deleteRecipe(req: Request<IdParams>, res: Response) {
  const existing = await findRecipeOr404(req.params.id)
  const userId = req.user!.userId

  if (existing.authorId !== userId && !(await isChefTeam(userId))) {
    throw forbidden('Tu ne peux supprimer que tes propres recettes')
  }

  await prisma.recipe.delete({ where: { id: existing.id } })
  removeUploadedFile(existing.imageUrl)
  res.status(204).end()
}

export async function uploadRecipeImage(req: Request<IdParams>, res: Response) {
  if (!req.file) {
    throw badRequest('Aucune image envoyée')
  }
  const uploadedUrl = `/uploads/${req.file.filename}`

  try {
    const existing = await findRecipeOr404(req.params.id)
    if (existing.authorId !== req.user!.userId) {
      throw forbidden('Tu ne peux modifier que tes propres recettes')
    }

    const updated = await prisma.recipe.update({
      where: { id: existing.id },
      data: { imageUrl: uploadedUrl },
      select: { id: true, imageUrl: true },
    })
    removeUploadedFile(existing.imageUrl)
    res.json(updated)
  } catch (error) {
    removeUploadedFile(uploadedUrl)
    throw error
  }
}

export async function addComment(req: Request<IdParams>, res: Response) {
  const input = parse(commentInputSchema, req.body)
  const recipe = await findValidatedRecipeOr404(req.params.id)

  const comment = await prisma.comment.create({
    data: { ...input, recipeId: recipe.id, authorId: req.user!.userId },
    include: { author: { select: authorSelect } },
  })

  res.status(201).json(comment)
}

export async function deleteComment(req: Request<IdParams>, res: Response) {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.id } })
  if (!comment) {
    throw notFound('Commentaire introuvable')
  }

  const userId = req.user!.userId
  if (comment.authorId !== userId && !(await isChefTeam(userId))) {
    throw forbidden('Tu ne peux supprimer que tes propres commentaires')
  }

  await prisma.comment.delete({ where: { id: comment.id } })
  res.status(204).end()
}

export async function rateRecipe(req: Request<IdParams>, res: Response) {
  const { value } = parse(ratingInputSchema, req.body)
  const recipe = await findValidatedRecipeOr404(req.params.id)
  const userId = req.user!.userId

  if (recipe.authorId === userId) {
    throw forbidden('Tu ne peux pas noter ta propre recette')
  }

  // La moyenne est stockée sur la recette pour trier/filtrer efficacement
  const result = await prisma.$transaction(async (tx) => {
    await tx.rating.upsert({
      where: { recipeId_authorId: { recipeId: recipe.id, authorId: userId } },
      update: { value },
      create: { value, recipeId: recipe.id, authorId: userId },
    })

    const aggregate = await tx.rating.aggregate({
      where: { recipeId: recipe.id },
      _avg: { value: true },
      _count: { _all: true },
    })

    return tx.recipe.update({
      where: { id: recipe.id },
      data: {
        averageRating: Math.round((aggregate._avg.value ?? 0) * 100) / 100,
        ratingsCount: aggregate._count._all,
      },
      select: { averageRating: true, ratingsCount: true },
    })
  })

  res.status(201).json({ myRating: value, ...result })
}

async function favoritesCount(recipeId: string) {
  return prisma.favorite.count({ where: { recipeId } })
}

export async function addFavorite(req: Request<IdParams>, res: Response) {
  const recipe = await findValidatedRecipeOr404(req.params.id)
  const userId = req.user!.userId

  await prisma.favorite.upsert({
    where: { userId_recipeId: { userId, recipeId: recipe.id } },
    update: {},
    create: { userId, recipeId: recipe.id },
  })

  res.json({ isFavorite: true, favoritesCount: await favoritesCount(recipe.id) })
}

export async function removeFavorite(req: Request<IdParams>, res: Response) {
  const recipe = await findRecipeOr404(req.params.id)
  await prisma.favorite.deleteMany({ where: { userId: req.user!.userId, recipeId: recipe.id } })

  res.json({ isFavorite: false, favoritesCount: await favoritesCount(recipe.id) })
}
