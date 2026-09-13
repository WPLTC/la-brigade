export type RecipeCategory = 'ENTREE' | 'PLAT' | 'DESSERT'
export type RecipeDifficulty = 'FACILE' | 'MOYEN' | 'DIFFICILE'

export const CATEGORY_LABEL: Record<RecipeCategory, string> = {
  ENTREE: 'Entrée',
  PLAT: 'Plat',
  DESSERT: 'Dessert',
}

export const DIFFICULTY_LABEL: Record<RecipeDifficulty, string> = {
  FACILE: 'Facile',
  MOYEN: 'Moyen',
  DIFFICILE: 'Difficile',
}

export const DIFFICULTY_STYLE: Record<RecipeDifficulty, string> = {
  FACILE: 'bg-olive/15 text-olive',
  MOYEN: 'bg-amber-100 text-amber-800',
  DIFFICILE: 'bg-brigade-red/10 text-brigade-red',
}

export const CATEGORIES: RecipeCategory[] = ['ENTREE', 'PLAT', 'DESSERT']
export const DIFFICULTIES: RecipeDifficulty[] = ['FACILE', 'MOYEN', 'DIFFICILE']
