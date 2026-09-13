import { Router } from 'express'
import {
  deleteMonthlyPick,
  getMonthly,
  getStats,
  listRecipesForReview,
  listUsers,
  reviewRecipe,
  setMonthlyPick,
  updateUserRole,
} from '../controllers/moderation.controller.js'
import { requireAuth, requireChefTeam } from '../middleware/auth.js'

/** Espace de la brigade : toutes les routes sont réservées à l'équipe du chef */
export const moderationRouter = Router()

moderationRouter.use(requireAuth, requireChefTeam)

moderationRouter.get('/stats', getStats)
moderationRouter.get('/recipes', listRecipesForReview)
moderationRouter.patch('/recipes/:id', reviewRecipe)
moderationRouter.get('/monthly', getMonthly)
moderationRouter.put('/monthly/:month', setMonthlyPick)
moderationRouter.delete('/monthly/:month', deleteMonthlyPick)
moderationRouter.get('/users', listUsers)
moderationRouter.patch('/users/:id/role', updateUserRole)
