import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { apiFetch } from '../lib/api'

type RecipeStatus = 'PENDING' | 'VALIDATED' | 'REJECTED'

interface MyRecipe {
  id: string
  title: string
  status: RecipeStatus
  createdAt: string
  ratings: { value: number }[]
}

interface MyComment {
  id: string
  content: string
  createdAt: string
  recipe: { id: string; title: string }
}

interface MeResponse {
  id: string
  name: string
  email: string
  role: 'USER' | 'CHEF_TEAM'
  createdAt: string
  recipes: MyRecipe[]
  comments: MyComment[]
}

const STATUS_LABEL: Record<RecipeStatus, string> = {
  PENDING: 'En attente de validation',
  VALIDATED: 'Validée',
  REJECTED: 'Refusée',
}

const STATUS_STYLE: Record<RecipeStatus, string> = {
  PENDING: 'bg-cream-dark text-charcoal-light',
  VALIDATED: 'bg-olive/15 text-olive',
  REJECTED: 'bg-brigade-red/10 text-brigade-red',
}

function averageRating(ratings: { value: number }[]) {
  if (ratings.length === 0) return null
  return (ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length).toFixed(1)
}

export function ProfilePage() {
  const [profile, setProfile] = useState<MeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<MeResponse>('/users/me')
      .then(setProfile)
      .catch(() => setError('Impossible de charger le profil'))
  }, [])

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-heading text-4xl tracking-wide text-charcoal">Mon profil</h1>

        {error && <p className="mt-4 text-sm text-brigade-red">{error}</p>}

        {profile ? (
          <>
            <section className="mt-6 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
              <p className="text-lg font-semibold text-charcoal">{profile.name}</p>
              <p className="text-sm text-charcoal-light">{profile.email}</p>
              {profile.role === 'CHEF_TEAM' && (
                <span className="mt-2 inline-block rounded-full bg-brigade-red px-3 py-1 text-xs font-medium text-white">
                  Équipe du chef
                </span>
              )}
            </section>

            <section className="mt-8">
              <h2 className="mb-3 font-heading text-2xl tracking-wide text-charcoal">
                Mes recettes ({profile.recipes.length})
              </h2>

              {profile.recipes.length === 0 ? (
                <p className="text-sm text-charcoal-light">Tu n'as pas encore proposé de recette.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {profile.recipes.map((recipe) => {
                    const avg = averageRating(recipe.ratings)
                    return (
                      <li
                        key={recipe.id}
                        className="flex items-center justify-between rounded-xl border border-charcoal/10 bg-white px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-charcoal">{recipe.title}</p>
                          {avg && <p className="text-xs text-charcoal-light">Note moyenne : {avg}/5 ⭐</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[recipe.status]}`}>
                            {STATUS_LABEL[recipe.status]}
                          </span>
                          <Link
                            to={`/recipes/${recipe.id}/edit`}
                            className="text-xs font-medium text-brigade-red hover:underline"
                          >
                            Modifier
                          </Link>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="mt-8">
              <h2 className="mb-3 font-heading text-2xl tracking-wide text-charcoal">
                Mes derniers commentaires
              </h2>

              {profile.comments.length === 0 ? (
                <p className="text-sm text-charcoal-light">Aucun commentaire pour l'instant.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {profile.comments.map((comment) => (
                    <li key={comment.id} className="rounded-xl border border-charcoal/10 bg-white px-4 py-3 text-sm">
                      <p className="text-charcoal">« {comment.content} »</p>
                      <p className="mt-1 text-xs text-charcoal-light">sur {comment.recipe.title}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : (
          !error && <p className="mt-6 text-sm text-charcoal-light">Chargement...</p>
        )}
      </main>
    </div>
  )
}
