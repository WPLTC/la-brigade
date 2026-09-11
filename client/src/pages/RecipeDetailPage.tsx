import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { apiFetch, ApiError } from '../lib/api'

interface Ingredient {
  id: string
  name: string
  quantity: string
}

interface Step {
  id: string
  order: number
  description: string
}

interface Comment {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string }
}

interface Rating {
  id: string
  value: string | number
  authorId: string
}

interface RecipeDetail {
  id: string
  title: string
  description: string
  imageUrl: string | null
  author: { id: string; name: string }
  ingredients: Ingredient[]
  steps: Step[]
  comments: Comment[]
  ratings: Rating[]
}

function averageRating(ratings: Rating[]) {
  if (ratings.length === 0) return null
  const sum = ratings.reduce((acc, r) => acc + Number(r.value), 0)
  return sum / ratings.length
}

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuth()

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)

  function loadRecipe() {
    if (!id) return
    apiFetch<RecipeDetail>(`/recipes/${id}`)
      .then(setRecipe)
      .catch(() => setNotFound(true))
  }

  useEffect(() => {
    loadRecipe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleCommentSubmit(event: FormEvent) {
    event.preventDefault()
    if (!id || !commentText.trim()) return

    setCommentError(null)
    setIsSubmittingComment(true)
    try {
      await apiFetch(`/recipes/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText.trim() }),
      })
      setCommentText('')
      loadRecipe()
    } catch (err) {
      setCommentError(err instanceof ApiError ? err.message : "Impossible d'envoyer le commentaire")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  async function handleRate(value: number) {
    if (!id || isSubmittingRating) return
    setIsSubmittingRating(true)
    try {
      await apiFetch(`/recipes/${id}/ratings`, {
        method: 'POST',
        body: JSON.stringify({ value }),
      })
      loadRecipe()
    } finally {
      setIsSubmittingRating(false)
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-charcoal-light">Cette recette n'existe pas ou plus.</p>
          <Link to="/recipes" className="mt-4 inline-block text-brigade-red underline">
            Retour aux recettes
          </Link>
        </main>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center text-charcoal-light">
          Chargement...
        </main>
      </div>
    )
  }

  const avg = averageRating(recipe.ratings)
  const myRating = recipe.ratings.find((r) => r.authorId === user?.id)

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/recipes" className="text-sm text-charcoal-light hover:underline">
          ← Toutes les recettes
        </Link>

        <div className="mt-4 overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
          <div className="flex h-64 items-center justify-center bg-cream-dark">
            {recipe.imageUrl ? (
              <img src={recipe.imageUrl} alt={recipe.title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-6xl">🍽️</span>
            )}
          </div>

          <div className="p-6">
            <h1 className="font-heading text-4xl tracking-wide text-charcoal">{recipe.title}</h1>
            <p className="mt-1 text-sm text-charcoal-light">par {recipe.author.name}</p>
            <p className="mt-4 text-charcoal">{recipe.description}</p>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex" aria-label="Note moyenne">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={avg && star <= Math.round(avg) ? 'text-brigade-red' : 'text-charcoal/20'}>
                    ★
                  </span>
                ))}
              </div>
              {avg && (
                <span className="text-sm text-charcoal-light">
                  {avg.toFixed(1)}/5 ({recipe.ratings.length} avis)
                </span>
              )}
            </div>

            {isAuthenticated && (
              <div className="mt-3">
                <p className="text-xs text-charcoal-light">
                  {myRating ? 'Ta note :' : 'Donne ta note :'}
                </p>
                <div className="mt-1 flex text-2xl">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoveredStar ?? Number(myRating?.value ?? 0)) >= star
                    return (
                      <button
                        key={star}
                        type="button"
                        disabled={isSubmittingRating}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(null)}
                        onClick={() => handleRate(star)}
                        className={`transition ${active ? 'text-brigade-red' : 'text-charcoal/20'} hover:scale-110`}
                        aria-label={`Noter ${star} étoiles`}
                      >
                        ★
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-xl tracking-wide text-charcoal">Ingrédients</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-charcoal">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient.id} className="flex justify-between border-b border-charcoal/5 pb-1">
                  <span>{ingredient.name}</span>
                  <span className="text-charcoal-light">{ingredient.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-xl tracking-wide text-charcoal">Étapes</h2>
            <ol className="mt-3 flex flex-col gap-3 text-sm text-charcoal">
              {recipe.steps.map((step) => (
                <li key={step.id} className="flex gap-2">
                  <span className="font-medium text-brigade-red">{step.order}.</span>
                  <span>{step.description}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-heading text-2xl tracking-wide text-charcoal">
            Commentaires ({recipe.comments.length})
          </h2>

          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="mt-4 flex flex-col gap-2">
              <textarea
                rows={2}
                placeholder="Partage ton avis ou un conseil de préparation..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="rounded-lg border border-charcoal/20 bg-white px-3 py-2 text-sm outline-none focus:border-brigade-red"
              />
              {commentError && <p className="text-sm text-brigade-red">{commentError}</p>}
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="self-start rounded-full bg-brigade-red px-4 py-1.5 text-sm font-medium text-white hover:bg-brigade-red-dark disabled:opacity-50"
              >
                {isSubmittingComment ? 'Envoi...' : 'Commenter'}
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-charcoal-light">
              <Link to="/login" className="text-brigade-red underline">
                Connecte-toi
              </Link>{' '}
              pour laisser un commentaire.
            </p>
          )}

          <ul className="mt-6 flex flex-col gap-3">
            {recipe.comments.map((comment) => (
              <li key={comment.id} className="rounded-xl border border-charcoal/10 bg-white px-4 py-3 text-sm">
                <p className="font-medium text-charcoal">{comment.author.name}</p>
                <p className="mt-1 text-charcoal-light">{comment.content}</p>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}
