import { describe, expect, it } from 'vitest'
import {
  buildRecipeOrderBy,
  buildRecipeWhere,
  recipeListQuerySchema,
} from '../src/services/recipe-query.js'
import { recipeInputSchema, reviewInputSchema } from '../src/schemas/recipe.schemas.js'

describe('recipeListQuerySchema', () => {
  it('applique les valeurs par défaut', () => {
    expect(recipeListQuerySchema.parse({})).toMatchObject({ sort: 'recent', page: 1, pageSize: 12 })
  })

  it('convertit les paramètres de l\'URL', () => {
    const query = recipeListQuerySchema.parse({ maxTime: '30', bistronomic: 'true', page: '2', category: '' })
    expect(query).toMatchObject({ maxTime: 30, bistronomic: true, page: 2 })
    expect(query.category).toBeUndefined()
  })

  it('refuse une catégorie inconnue et une taille de page excessive', () => {
    expect(recipeListQuerySchema.safeParse({ category: 'APERO' }).success).toBe(false)
    expect(recipeListQuerySchema.safeParse({ pageSize: '500' }).success).toBe(false)
  })
})

describe('buildRecipeWhere', () => {
  it('ne montre que les recettes validées', () => {
    expect(buildRecipeWhere({})).toEqual({ status: 'VALIDATED' })
  })

  it('combine tous les filtres', () => {
    const where = buildRecipeWhere({
      search: 'saumon',
      category: 'PLAT',
      difficulty: 'FACILE',
      maxTime: 45,
      bistronomic: true,
    })
    expect(where).toMatchObject({
      status: 'VALIDATED',
      category: 'PLAT',
      difficulty: 'FACILE',
      totalTime: { lte: 45 },
      isBistronomic: true,
    })
    // la recherche porte sur le titre, la description et les ingrédients
    expect(where.OR).toHaveLength(3)
  })

  it('permet de filtrer les recettes non bistronomiques', () => {
    expect(buildRecipeWhere({ bistronomic: false }).isBistronomic).toBe(false)
  })
})

describe('buildRecipeOrderBy', () => {
  it('trie par note puis nombre de notes', () => {
    expect(buildRecipeOrderBy('rating')[0]).toEqual({ averageRating: 'desc' })
  })

  it('trie les plus rapides en premier', () => {
    expect(buildRecipeOrderBy('quick')[0]).toEqual({ totalTime: 'asc' })
  })
})

describe('recipeInputSchema', () => {
  const valid = {
    title: 'Risotto aux cèpes',
    description: 'Un risotto crémeux et généreux.',
    category: 'PLAT',
    difficulty: 'MOYEN',
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    ingredients: [{ name: 'Riz arborio', quantity: '320 g' }],
    steps: [{ description: 'Nacrer le riz.' }],
  }

  it('accepte une recette complète', () => {
    expect(recipeInputSchema.safeParse(valid).success).toBe(true)
  })

  it('renvoie un message en français', () => {
    const result = recipeInputSchema.safeParse({ ...valid, ingredients: [] })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Ajoute au moins un ingrédient')
  })
})

describe('reviewInputSchema', () => {
  it('exige un retour argumenté en cas de refus', () => {
    expect(reviewInputSchema.safeParse({ status: 'REJECTED' }).success).toBe(false)
    expect(reviewInputSchema.safeParse({ status: 'REJECTED', reviewNote: 'Trop salé, à retravailler' }).success).toBe(true)
  })

  it('n\'exige rien pour une validation', () => {
    expect(reviewInputSchema.safeParse({ status: 'VALIDATED', isBistronomic: true }).success).toBe(true)
  })
})
