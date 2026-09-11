import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { authRouter } from './routes/auth.routes.js'
import { recipesRouter } from './routes/recipes.routes.js'

const app = express()
const port = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/recipes', recipesRouter)

app.listen(port, () => {
  console.log(`La Brigade API listening on http://localhost:${port}`)
})
