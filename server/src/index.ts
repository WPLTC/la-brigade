import cors from 'cors'
import 'dotenv/config'
import express, { type ErrorRequestHandler } from 'express'
import multer from 'multer'
import { UPLOADS_DIR } from './lib/upload.js'
import { authRouter } from './routes/auth.routes.js'
import { recipesRouter } from './routes/recipes.routes.js'
import { usersRouter } from './routes/users.routes.js'

const app = express()
const port = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(UPLOADS_DIR))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/recipes', recipesRouter)
app.use('/api/users', usersRouter)

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err instanceof Error) {
    return res.status(400).json({ error: err.message })
  }
  res.status(500).json({ error: 'Erreur serveur' })
}

app.use(errorHandler)

app.listen(port, () => {
  console.log(`La Brigade API listening on http://localhost:${port}`)
})
