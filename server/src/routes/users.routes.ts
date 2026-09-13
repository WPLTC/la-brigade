import { Router } from 'express'
import { getMe, getPublicProfile, updateMe } from '../controllers/users.controller.js'
import { requireAuth } from '../middleware/auth.js'

export const usersRouter = Router()

usersRouter.get('/me', requireAuth, getMe)
usersRouter.patch('/me', requireAuth, updateMe)
usersRouter.get('/:id', getPublicProfile)
