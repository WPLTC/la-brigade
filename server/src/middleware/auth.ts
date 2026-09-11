import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthPayload {
  userId: string
  role: 'USER' | 'CHEF_TEAM'
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthPayload
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

  if (!token) {
    return res.status(401).json({ error: 'Authentification requise' })
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload
    } catch {
      // token invalide : on continue sans utilisateur authentifié
    }
  }
  next()
}

export function requireChefTeam(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'CHEF_TEAM') {
    return res.status(403).json({ error: "Réservé à l'équipe du chef" })
  }
  next()
}
