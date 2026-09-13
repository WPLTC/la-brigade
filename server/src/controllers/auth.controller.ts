import bcrypt from 'bcryptjs'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { notFound, conflict, unauthorized } from '../lib/http-error.js'
import { prisma } from '../lib/prisma.js'
import { parse } from '../lib/validation.js'
import { signToken } from '../middleware/auth.js'

const email = z
  .string({ required_error: "L'email est obligatoire" })
  .trim()
  .toLowerCase()
  .email('Adresse email invalide')

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Le nom est obligatoire' })
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(60, 'Le nom ne doit pas dépasser 60 caractères'),
  email,
  password: z
    .string({ required_error: 'Le mot de passe est obligatoire' })
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe est trop long'),
})

const loginSchema = z.object({
  email,
  password: z.string({ required_error: 'Le mot de passe est obligatoire' }).min(1, 'Le mot de passe est obligatoire'),
})

export const sessionUserSelect = {
  id: true,
  email: true,
  name: true,
  bio: true,
  role: true,
  createdAt: true,
} as const

export async function register(req: Request, res: Response) {
  const { name, email, password } = parse(registerSchema, req.body)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw conflict('Un compte existe déjà avec cet email')
  }

  const user = await prisma.user.create({
    data: { email, name, password: await bcrypt.hash(password, 10) },
    select: sessionUserSelect,
  })

  res.status(201).json({ token: signToken({ userId: user.id, role: user.role }), user })
}

export async function login(req: Request, res: Response) {
  const { email, password } = parse(loginSchema, req.body)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw unauthorized('Email ou mot de passe incorrect')
  }

  const { password: _password, ...sessionUser } = user
  res.json({ token: signToken({ userId: user.id, role: user.role }), user: sessionUser })
}

/** Renvoie l'utilisateur connecté et un token à jour (utile si son rôle a changé). */
export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: sessionUserSelect,
  })
  if (!user) {
    throw notFound('Utilisateur introuvable')
  }

  res.json({ token: signToken({ userId: user.id, role: user.role }), user })
}
