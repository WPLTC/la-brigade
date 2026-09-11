import { Router } from 'express'
import {
  addComment,
  createRecipe,
  getRecipe,
  listRecipes,
  rateRecipe,
  reviewRecipe,
  uploadRecipeImage,
} from '../controllers/recipes.controller.js'
import { optionalAuth, requireAuth, requireChefTeam } from '../middleware/auth.js'
import { upload } from '../lib/upload.js'

export const recipesRouter = Router()

recipesRouter.get('/', optionalAuth, listRecipes)
recipesRouter.get('/:id', getRecipe)
recipesRouter.post('/', requireAuth, createRecipe)
recipesRouter.post('/:id/image', requireAuth, upload.single('image'), uploadRecipeImage)
recipesRouter.patch('/:id/status', requireAuth, requireChefTeam, reviewRecipe)
recipesRouter.post('/:id/comments', requireAuth, addComment)
recipesRouter.post('/:id/ratings', requireAuth, rateRecipe)
