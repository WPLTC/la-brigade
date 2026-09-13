import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { forbidden, unauthorized } from '../lib/http-error.js'
import { prisma } from '../lib/prisma.js'

export type UserRole = 'USER' | 'CHEF_TEAM'

export interface AuthPayload {
  userId: string
  role: UserRole
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthPayload
  }
}

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}

function readToken(req: Request) {
  const header = req.headers.authorization
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req)
  if (!token) {
    throw unauthorized()
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret) as AuthPayload
  } catch {
    throw unauthorized('Session expirée, reconnecte-toi')
  }
  next()
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req)
  if (token) {
    try {
      req.user = jwt.verify(token, config.jwtSecret) as AuthPayload
    } catch {
      // token invalide : on continue sans utilisateur authentifié
    }
  }
  next()
}

/**
 * Réservé à l'équipe du chef. Le rôle est relu en base (et non depuis le token)
 * pour qu'une promotion ou un retrait de droits prenne effet immédiatement.
 */
export async function requireChefTeam(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw unauthorized()
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { role: true },
  })
  if (user?.role !== 'CHEF_TEAM') {
    throw forbidden("Réservé à l'équipe du chef")
  }

  req.user.role = user.role
  next()
}

export async function isChefTeam(userId: string | undefined) {
  if (!userId) return false
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  return user?.role === 'CHEF_TEAM'
}
