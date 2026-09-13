import { z } from 'zod'
import { CATEGORIES, DIFFICULTIES } from '../services/recipe-query.js'

const minutes = (label: string) =>
  z
    .number({ invalid_type_error: `${label} doit être un nombre de minutes` })
    .int(`${label} doit être un nombre entier de minutes`)
    .min(0, `${label} ne peut pas être négatif`)
    .max(1440, `${label} ne peut pas dépasser 24 heures`)

export const recipeInputSchema = z.object({
  title: z
    .string({ required_error: 'Le titre est obligatoire' })
    .trim()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(120, 'Le titre ne doit pas dépasser 120 caractères'),
  description: z
    .string({ required_error: 'La description est obligatoire' })
    .trim()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(2000, 'La description ne doit pas dépasser 2000 caractères'),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choisis une catégorie' }) }),
  difficulty: z.enum(DIFFICULTIES, { errorMap: () => ({ message: 'Choisis une difficulté' }) }),
  prepTime: minutes('Le temps de préparation'),
  cookTime: minutes('Le temps de cuisson'),
  servings: z
    .number({ invalid_type_error: 'Le nombre de parts doit être un nombre' })
    .int()
    .min(1, 'La recette doit servir au moins 1 personne')
    .max(50, 'Le nombre de parts ne peut pas dépasser 50'),
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Chaque ingrédient doit avoir un nom').max(100),
        quantity: z.string().trim().max(50).default(''),
      }),
    )
    .min(1, 'Ajoute au moins un ingrédient')
    .max(60, 'Pas plus de 60 ingrédients'),
  steps: z
    .array(
      z.object({
        description: z.string().trim().min(1, 'Chaque étape doit être décrite').max(2000),
      }),
    )
    .min(1, 'Ajoute au moins une étape')
    .max(40, 'Pas plus de 40 étapes'),
})

export type RecipeInput = z.infer<typeof recipeInputSchema>

export const commentInputSchema = z.object({
  content: z
    .string({ required_error: 'Le commentaire est vide' })
    .trim()
    .min(1, 'Le commentaire est vide')
    .max(1000, 'Le commentaire ne doit pas dépasser 1000 caractères'),
  kind: z.enum(['AVIS', 'CONSEIL']).default('AVIS'),
})

export const ratingInputSchema = z.object({
  value: z
    .number({ required_error: 'La note est obligatoire' })
    .int('La note doit être un nombre entier')
    .min(1, 'La note doit être comprise entre 1 et 5')
    .max(5, 'La note doit être comprise entre 1 et 5'),
})

export const reviewInputSchema = z
  .object({
    status: z.enum(['VALIDATED', 'REJECTED'], {
      errorMap: () => ({ message: 'Décision invalide' }),
    }),
    reviewNote: z.string().trim().max(1000, 'Le retour ne doit pas dépasser 1000 caractères').optional(),
    isBistronomic: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === 'REJECTED' && (value.reviewNote?.length ?? 0) < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reviewNote'],
        message: "Explique à l'auteur pourquoi la recette est refusée",
      })
    }
  })

/** Prépare les données Prisma communes à la création et à la modification */
export function toRecipeData(input: RecipeInput) {
  return {
    title: input.title,
    description: input.description,
    category: input.category,
    difficulty: input.difficulty,
    prepTime: input.prepTime,
    cookTime: input.cookTime,
    totalTime: input.prepTime + input.cookTime,
    servings: input.servings,
    ingredients: {
      create: input.ingredients.map((ingredient, index) => ({ ...ingredient, position: index })),
    },
    steps: {
      create: input.steps.map((step, index) => ({ order: index + 1, description: step.description })),
    },
  }
}
