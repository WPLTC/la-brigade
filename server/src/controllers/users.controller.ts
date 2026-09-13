import type { Request, Response } from 'express'
import { z } from 'zod'
import { notFound } from '../lib/http-error.js'
import { prisma } from '../lib/prisma.js'
import { recipeCardSelect } from '../lib/selects.js'
import { parse } from '../lib/validation.js'
import { sessionUserSelect } from './auth.controller.js'

const recipePreviewSelect = { id: true, title: true, imageUrl: true } as const

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(60, 'Le nom ne doit pas dépasser 60 caractères'),
  bio: z
    .string()
    .trim()
    .max(300, 'La bio ne doit pas dépasser 300 caractères')
    .transform((bio) => bio || null)
    .nullable()
    .optional(),
})

/** Profil complet de l'utilisateur connecté : recettes (tous statuts), favoris et interactions. */
export async function getMe(req: Request, res: Response) {
  const userId = req.user!.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...sessionUserSelect,
      recipes: {
        orderBy: { createdAt: 'desc' },
        select: { ...recipeCardSelect, reviewNote: true, reviewedAt: true, updatedAt: true },
      },
      favorites: {
        orderBy: { createdAt: 'desc' },
        select: { recipe: { select: recipeCardSelect } },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { recipe: { select: recipePreviewSelect } },
      },
      ratings: {
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: { recipe: { select: recipePreviewSelect } },
      },
      _count: { select: { comments: true, ratings: true, favorites: true } },
    },
  })

  if (!user) {
    throw notFound('Utilisateur introuvable')
  }

  const { favorites, ...profile } = user
  res.json({
    ...profile,
    favorites: favorites.map((favorite) => favorite.recipe),
  })
}

export async function updateMe(req: Request, res: Response) {
  const data = parse(updateProfileSchema, req.body)

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data,
    select: sessionUserSelect,
  })

  res.json(user)
}

/** Profil public : uniquement les recettes validées et les interactions visibles de tous. */
export async function getPublicProfile(req: Request<{ id: string }>, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      bio: true,
      role: true,
      createdAt: true,
      recipes: {
        where: { status: 'VALIDATED' },
        orderBy: { createdAt: 'desc' },
        select: recipeCardSelect,
      },
      comments: {
        where: { recipe: { status: 'VALIDATED' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { recipe: { select: recipePreviewSelect } },
      },
      _count: { select: { comments: true, ratings: true } },
    },
  })

  if (!user) {
    throw notFound('Membre introuvable')
  }

  res.json(user)
}
