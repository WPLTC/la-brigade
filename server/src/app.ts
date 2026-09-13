import cors from 'cors'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config.js'
import { UPLOADS_DIR } from './lib/upload.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'
import { authRouter } from './routes/auth.routes.js'
import { homeRouter } from './routes/home.routes.js'
import { moderationRouter } from './routes/moderation.routes.js'
import { commentsRouter, recipesRouter } from './routes/recipes.routes.js'
import { usersRouter } from './routes/users.routes.js'

const CLIENT_DIST = fileURLToPath(new URL('../../client/dist', import.meta.url))

/** Construit l'application Express (séparée de listen() pour pouvoir la tester). */
export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(cors(config.clientOrigin ? { origin: config.clientOrigin.split(',') } : undefined))
  app.use(express.json({ limit: '1mb' }))
  app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }))

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api', homeRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/recipes', recipesRouter)
  app.use('/api/comments', commentsRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/moderation', moderationRouter)
  app.use('/api', notFoundHandler)

  // En production, l'API sert aussi le front React compilé (un seul déploiement)
  if (config.isProduction && fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST))
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next()
      res.sendFile(path.join(CLIENT_DIST, 'index.html'))
    })
  }

  app.use(errorHandler)
  return app
}
