import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { ChefHatIcon, PlateIcon } from '../components/icons'
import { apiFetch, ApiError } from '../lib/api'

interface PendingRecipe {
  id: string
  title: string
  description: string
  imageUrl: string | null
  status: 'PENDING' | 'VALIDATED' | 'REJECTED'
  author: { id: string; name: string }
}

export function ModerationPage() {
  const [recipes, setRecipes] = useState<PendingRecipe[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)

  function loadRecipes() {
    apiFetch<PendingRecipe[]>('/recipes')
      .then((all) => setRecipes(all.filter((r) => r.status === 'PENDING')))
      .catch(() => setError('Impossible de charger les recettes'))
  }

  useEffect(() => {
    loadRecipes()
  }, [])

  async function handleReview(id: string, status: 'VALIDATED' | 'REJECTED') {
    setPendingActionId(id)
    try {
      await apiFetch(`/recipes/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setRecipes((prev) => (prev ? prev.filter((r) => r.id !== id) : prev))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action impossible')
    } finally {
      setPendingActionId(null)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <ChefHatIcon className="h-8 w-8 text-brigade-red" />
        <h1 className="mt-2 font-heading text-4xl tracking-wide text-charcoal">
          Validation par la brigade
        </h1>
        <p className="mt-1 text-sm text-charcoal-light">
          Recettes en attente de validation avant d'être mises en avant.
        </p>

        {error && <p className="mt-4 text-sm text-brigade-red">{error}</p>}

        {!recipes && !error && <p className="mt-6 text-sm text-charcoal-light">Chargement...</p>}

        {recipes && recipes.length === 0 && (
          <p className="mt-10 text-center text-sm text-charcoal-light">
            Aucune recette en attente pour le moment.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-4">
          {recipes?.map((recipe) => (
            <div
              key={recipe.id}
              className="flex flex-col gap-4 rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="flex h-24 w-32 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream-dark">
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <PlateIcon className="h-8 w-8 text-charcoal/30" />
                )}
              </div>

              <div className="flex-1">
                <Link
                  to={`/recipes/${recipe.id}`}
                  className="font-heading text-xl tracking-wide text-charcoal hover:text-brigade-red"
                >
                  {recipe.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-charcoal-light">
                  {recipe.description}
                </p>
                <p className="mt-1 text-xs text-charcoal-light">proposée par {recipe.author.name}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pendingActionId === recipe.id}
                  onClick={() => handleReview(recipe.id, 'REJECTED')}
                  className="rounded-full border border-charcoal/20 px-4 py-1.5 text-sm font-medium text-charcoal hover:border-brigade-red hover:text-brigade-red disabled:opacity-50"
                >
                  Refuser
                </button>
                <button
                  type="button"
                  disabled={pendingActionId === recipe.id}
                  onClick={() => handleReview(recipe.id, 'VALIDATED')}
                  className="rounded-full bg-olive px-4 py-1.5 text-sm font-medium text-white hover:bg-olive-light disabled:opacity-50"
                >
                  Valider
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
