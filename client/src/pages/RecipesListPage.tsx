import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { ClockIcon, PlateIcon } from '../components/icons'
import { apiFetch } from '../lib/api'
import {
  CATEGORIES,
  CATEGORY_LABEL,
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  DIFFICULTY_STYLE,
  type RecipeCategory,
  type RecipeDifficulty,
} from '../lib/recipeMeta'

interface Recipe {
  id: string
  title: string
  description: string
  imageUrl: string | null
  createdAt: string
  prepTime: number
  category: RecipeCategory
  difficulty: RecipeDifficulty
  author: { id: string; name: string }
  ratings: { value: number }[]
}

type SortMode = 'recent' | 'rating'

function averageRating(ratings: { value: number }[]) {
  if (ratings.length === 0) return null
  return ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
}

export function RecipesListPage() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('recent')
  const [category, setCategory] = useState<RecipeCategory | 'ALL'>('ALL')
  const [difficulty, setDifficulty] = useState<RecipeDifficulty | 'ALL'>('ALL')

  useEffect(() => {
    apiFetch<Recipe[]>('/recipes')
      .then(setRecipes)
      .catch(() => setError('Impossible de charger les recettes'))
  }, [])

  const visibleRecipes = useMemo(() => {
    if (!recipes) return []

    const query = search.trim().toLowerCase()
    let filtered = query
      ? recipes.filter(
          (r) =>
            r.title.toLowerCase().includes(query) || r.description.toLowerCase().includes(query),
        )
      : recipes

    if (category !== 'ALL') {
      filtered = filtered.filter((r) => r.category === category)
    }
    if (difficulty !== 'ALL') {
      filtered = filtered.filter((r) => r.difficulty === difficulty)
    }

    const sorted = [...filtered]
    if (sort === 'recent') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else {
      sorted.sort((a, b) => (averageRating(b.ratings) ?? 0) - (averageRating(a.ratings) ?? 0))
    }
    return sorted
  }, [recipes, search, sort, category, difficulty])

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-heading text-4xl tracking-wide text-charcoal">Les recettes</h1>
        <p className="mt-1 text-sm text-charcoal-light">
          Toutes les recettes validées par l'équipe du chef.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="search"
              placeholder="Rechercher une recette..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-charcoal/20 bg-white px-3 py-2 text-sm outline-none focus:border-brigade-red"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSort('recent')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  sort === 'recent'
                    ? 'bg-brigade-red text-white'
                    : 'border border-charcoal/20 text-charcoal-light hover:border-brigade-red hover:text-brigade-red'
                }`}
              >
                Plus récentes
              </button>
              <button
                type="button"
                onClick={() => setSort('rating')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  sort === 'rating'
                    ? 'bg-brigade-red text-white'
                    : 'border border-charcoal/20 text-charcoal-light hover:border-brigade-red hover:text-brigade-red'
                }`}
              >
                Mieux notées
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory('ALL')}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  category === 'ALL'
                    ? 'bg-charcoal text-white'
                    : 'border border-charcoal/20 text-charcoal-light hover:border-charcoal'
                }`}
              >
                Toutes
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    category === c
                      ? 'bg-charcoal text-white'
                      : 'border border-charcoal/20 text-charcoal-light hover:border-charcoal'
                  }`}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(difficulty === d ? 'ALL' : d)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    difficulty === d
                      ? 'bg-olive text-white'
                      : 'border border-charcoal/20 text-charcoal-light hover:border-olive'
                  }`}
                >
                  {DIFFICULTY_LABEL[d]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="mt-6 text-sm text-brigade-red">{error}</p>}

        {!recipes && !error && <p className="mt-6 text-sm text-charcoal-light">Chargement...</p>}

        {recipes && visibleRecipes.length === 0 && (
          <p className="mt-10 text-center text-sm text-charcoal-light">
            Aucune recette ne correspond à ta recherche.
          </p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRecipes.map((recipe) => {
            const avg = averageRating(recipe.ratings)
            return (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="flex flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-40 items-center justify-center bg-cream-dark">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PlateIcon className="h-10 w-10 text-charcoal/30" />
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-cream-dark px-2 py-0.5 text-xs font-medium text-charcoal-light">
                      {CATEGORY_LABEL[recipe.category]}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_STYLE[recipe.difficulty]}`}
                    >
                      {DIFFICULTY_LABEL[recipe.difficulty]}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-charcoal-light">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {recipe.prepTime} min
                    </span>
                  </div>

                  <h2 className="font-heading text-lg tracking-wide text-charcoal">
                    {recipe.title}
                  </h2>
                  <p className="line-clamp-2 flex-1 text-sm text-charcoal-light">
                    {recipe.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-charcoal-light">
                    <span>par {recipe.author.name}</span>
                    {avg && <span>{avg.toFixed(1)}/5 ⭐</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
