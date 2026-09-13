import { Prisma } from '@prisma/client'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import multer from 'multer'
import { HttpError, notFound } from '../lib/http-error.js'

export const notFoundHandler: RequestHandler = () => {
  throw notFound('Route introuvable')
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details })
    return
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? "L'image ne doit pas dépasser 5 Mo" : 'Envoi du fichier impossible'
    res.status(400).json({ error: message })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Ressource introuvable' })
      return
    }
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Cette ressource existe déjà' })
      return
    }
  }

  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Corps de requête JSON invalide' })
    return
  }

  console.error(err)
  res.status(500).json({ error: 'Erreur serveur' })
}
