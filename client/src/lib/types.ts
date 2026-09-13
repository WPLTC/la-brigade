/** Types partagés : ils reflètent les réponses de l'API (server/src/controllers) */

export type Role = 'USER' | 'CHEF_TEAM'
export type RecipeStatus = 'PENDING' | 'VALIDATED' | 'REJECTED'
export type Category = 'ENTREE' | 'PLAT' | 'DESSERT'
export type Difficulty = 'FACILE' | 'MOYEN' | 'DIFFICILE'
export type CommentKind = 'AVIS' | 'CONSEIL'
export type RecipeSort = 'recent' | 'rating' | 'popular' | 'quick'

export interface UserSummary {
  id: string
  name: string
  role: Role
}

export interface SessionUser {
  id: string
  email: string
  name: string
  bio: string | null
  role: Role
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: SessionUser
}

export interface RecipeCardData {
  id: string
  title: string
  description: string
  imageUrl: string | null
  category: Category
  difficulty: Difficulty
  prepTime: number
  cookTime: number
  totalTime: number
  servings: number
  status: RecipeStatus
  isBistronomic: boolean
  averageRating: number
  ratingsCount: number
  createdAt: string
  author: UserSummary
  chefPicks: { month: string }[]
  _count: { comments: number; favorites: number }
}

export interface Ingredient {
  id: string
  name: string
  quantity: string
  position: number
}

export interface Step {
  id: string
  order: number
  description: string
}

export interface Comment {
  id: string
  content: string
  kind: CommentKind
  createdAt: string
  author: UserSummary
}

export interface ChefPickSummary {
  id: string
  month: string
  verdict: string
  score: number
  createdAt: string
  chef: UserSummary
}

export interface ChefPick extends ChefPickSummary {
  recipe: RecipeCardData
}

export interface RecipeDetail extends Omit<RecipeCardData, 'chefPicks' | 'author'> {
  author: UserSummary & { bio: string | null }
  reviewNote: string | null
  reviewedAt: string | null
  reviewer: UserSummary | null
  updatedAt: string
  ingredients: Ingredient[]
  steps: Step[]
  comments: Comment[]
  chefPicks: ChefPickSummary[]
  ratingDistribution: Record<string, number>
  myRating: number | null
  isFavorite: boolean
  permissions: {
    canEdit: boolean
    canDelete: boolean
    canModerate: boolean
    canRate: boolean
  }
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface RankingEntry {
  recipe: RecipeCardData
  favorites: number
  ratings: number
  comments: number
  score: number
}

export interface HomeData {
  stats: { recipes: number; members: number; bistronomic: number }
  categories: Record<Category, number>
  chefPick: ChefPick | null
  featured: RecipeCardData[]
  latest: RecipeCardData[]
  monthlyRace: { month: string; ranking: RankingEntry[] }
}

export interface RecipePreview {
  id: string
  title: string
  imageUrl: string | null
}

export interface MyRecipe extends RecipeCardData {
  reviewNote: string | null
  reviewedAt: string | null
  updatedAt: string
}

export interface MyProfile extends SessionUser {
  recipes: MyRecipe[]
  favorites: RecipeCardData[]
  comments: { id: string; content: string; kind: CommentKind; createdAt: string; recipe: RecipePreview }[]
  ratings: { id: string; value: number; updatedAt: string; recipe: RecipePreview }[]
  _count: { comments: number; ratings: number; favorites: number }
}

export interface PublicProfile {
  id: string
  name: string
  bio: string | null
  role: Role
  createdAt: string
  recipes: RecipeCardData[]
  comments: { id: string; content: string; kind: CommentKind; createdAt: string; recipe: RecipePreview }[]
  _count: { comments: number; ratings: number }
}

export interface ModerationStats {
  pending: number
  validated: number
  rejected: number
  bistronomic: number
  members: number
  chefTeam: number
  comments: number
  ratings: number
  oldestPendingAt: string | null
}

export interface ReviewRecipe extends MyRecipe {
  reviewer: UserSummary | null
  ingredients: Ingredient[]
  steps: Step[]
}

export interface ReviewResult {
  id: string
  status: RecipeStatus
  isBistronomic: boolean
  reviewNote: string | null
  reviewedAt: string | null
}

export interface MonthlyData {
  month: string
  ranking: RankingEntry[]
  pick: ChefPick | null
  history: { id: string; month: string; verdict: string; score: number; recipe: RecipePreview }[]
}

export interface Member {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
  _count: { recipes: number; comments: number; ratings: number }
}
