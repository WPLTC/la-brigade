import { Router } from 'express'
import { getMe } from '../controllers/users.controller.js'
import { requireAuth } from '../middleware/auth.js'

export const usersRouter = Router()

usersRouter.get('/me', requireAuth, getMe)
