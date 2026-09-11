import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const createRecipeSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  imageUrl: z.string().url().optional(),
  ingredients: z.array(z.object({ name: z.string().min(1), quantity: z.string().min(1) })).min(1),
  steps: z.array(z.object({ order: z.number().int().min(1), description: z.string().min(1) })).min(1),
})

export async function listRecipes(req: Request, res: Response) {
  const status = req.user?.role === 'CHEF_TEAM' ? undefined : 'VALIDATED'

  const recipes = await prisma.recipe.findMany({
    where: status ? { status } : undefined,
    include: {
      author: { select: { id: true, name: true } },
      ratings: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(recipes)
}

export async function getRecipe(req: Request, res: Response) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: req.params.id },
    include: {
      author: { select: { id: true, name: true } },
      ingredients: true,
      steps: { orderBy: { order: 'asc' } },
      comments: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      ratings: true,
    },
  })

  if (!recipe) {
    return res.status(404).json({ error: 'Recette introuvable' })
  }
  res.json(recipe)
}

export async function createRecipe(req: Request, res: Response) {
  const parsed = createRecipeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }
  const { title, description, imageUrl, ingredients, steps } = parsed.data

  const recipe = await prisma.recipe.create({
    data: {
      title,
      description,
      imageUrl,
      authorId: req.user!.userId,
      ingredients: { create: ingredients },
      steps: { create: steps },
    },
    include: { ingredients: true, steps: true },
  })

  res.status(201).json(recipe)
}

export async function reviewRecipe(req: Request, res: Response) {
  const statusSchema = z.object({ status: z.enum(['VALIDATED', 'REJECTED']) })
  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  const recipe = await prisma.recipe.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
  })

  res.json(recipe)
}

export async function addComment(req: Request, res: Response) {
  const schema = z.object({ content: z.string().min(1) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  const comment = await prisma.comment.create({
    data: {
      content: parsed.data.content,
      recipeId: req.params.id,
      authorId: req.user!.userId,
    },
    include: { author: { select: { id: true, name: true } } },
  })

  res.status(201).json(comment)
}

export async function rateRecipe(req: Request, res: Response) {
  const schema = z.object({ value: z.number().int().min(1).max(5) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  const rating = await prisma.rating.upsert({
    where: { recipeId_authorId: { recipeId: req.params.id, authorId: req.user!.userId } },
    update: { value: parsed.data.value },
    create: { value: parsed.data.value, recipeId: req.params.id, authorId: req.user!.userId },
  })

  res.status(201).json(rating)
}
