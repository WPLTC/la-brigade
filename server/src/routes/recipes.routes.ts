import { Router } from 'express'
import {
  addComment,
  addFavorite,
  createRecipe,
  deleteComment,
  deleteRecipe,
  getRecipe,
  listRecipes,
  rateRecipe,
  removeFavorite,
  updateRecipe,
  uploadRecipeImage,
} from '../controllers/recipes.controller.js'
import { upload } from '../lib/upload.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

export const recipesRouter = Router()

recipesRouter.get('/', listRecipes)
recipesRouter.get('/:id', optionalAuth, getRecipe)
recipesRouter.post('/', requireAuth, createRecipe)
recipesRouter.put('/:id', requireAuth, updateRecipe)
recipesRouter.delete('/:id', requireAuth, deleteRecipe)
recipesRouter.post('/:id/image', requireAuth, upload.single('image'), uploadRecipeImage)
recipesRouter.post('/:id/comments', requireAuth, addComment)
recipesRouter.post('/:id/ratings', requireAuth, rateRecipe)
recipesRouter.put('/:id/favorite', requireAuth, addFavorite)
recipesRouter.delete('/:id/favorite', requireAuth, removeFavorite)

export const commentsRouter = Router()

commentsRouter.delete('/:id', requireAuth, deleteComment)
