import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { apiFetch } from '../lib/api'

interface Recipe {
  id: string
  title: string
  description: string
  imageUrl: string | null
  createdAt: string
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

  useEffect(() => {
    apiFetch<Recipe[]>('/recipes')
      .then(setRecipes)
      .catch(() => setError('Impossible de charger les recettes'))
  }, [])

  const visibleRecipes = useMemo(() => {
    if (!recipes) return []

    const query = search.trim().toLowerCase()
    const filtered = query
      ? recipes.filter(
          (r) =>
            r.title.toLowerCase().includes(query) || r.description.toLowerCase().includes(query),
        )
      : recipes

    const sorted = [...filtered]
    if (sort === 'recent') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else {
      sorted.sort((a, b) => (averageRating(b.ratings) ?? 0) - (averageRating(a.ratings) ?? 0))
    }
    return sorted
  }, [recipes, search, sort])

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-heading text-4xl tracking-wide text-charcoal">Les recettes</h1>
        <p className="mt-1 text-sm text-charcoal-light">
          Toutes les recettes validées par l'équipe du chef.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                    <span className="text-4xl">🍽️</span>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
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
