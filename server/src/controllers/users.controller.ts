import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

export async function getMe(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      recipes: {
        orderBy: { createdAt: 'desc' },
        include: { ratings: true },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { recipe: { select: { id: true, title: true } } },
      },
    },
  })

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' })
  }

  res.json(user)
}
