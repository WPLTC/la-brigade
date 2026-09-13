import { ChevronUp, CircleCheck, CircleX, FlaskConical, PartyPopper, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { api, errorMessage } from '../../lib/api'
import { CATEGORY_LABEL, DIFFICULTY_LABEL, formatDuration, plural, relativeDate } from '../../lib/format'
import type { RecipeStatus, ReviewRecipe, ReviewResult } from '../../lib/types'
import { BistroBadge, EmptyState, PageLoader, RecipeImage, StatusBadge } from '../ui'

const EMPTY_TEXT: Record<RecipeStatus, { title: string; text: string }> = {
  PENDING: { title: 'Aucune recette à tester', text: 'La file de validation est vide. Profitez-en pour goûter les recettes du mois !' },
  VALIDATED: { title: 'Aucune recette publiée', text: 'Les recettes validées apparaîtront ici.' },
  REJECTED: { title: 'Aucune recette refusée', text: 'Les recettes refusées apparaîtront ici avec votre retour.' },
}

interface ReviewCardProps {
  recipe: ReviewRecipe
  defaultOpen: boolean
  onReviewed: (id: string, result: ReviewResult) => void
}

function ReviewCard({ recipe, defaultOpen, onReviewed }: ReviewCardProps) {
  const toast = useToast()
  const [open, setOpen] = useState(defaultOpen)
  const [note, setNote] = useState(recipe.status === 'PENDING' ? '' : (recipe.reviewNote ?? ''))
  const [bistronomic, setBistronomic] = useState(recipe.isBistronomic)
  const [busy, setBusy] = useState<'VALIDATED' | 'REJECTED' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function decide(decision: 'VALIDATED' | 'REJECTED') {
    if (decision === 'REJECTED' && note.trim().length < 5) {
      setError("Explique à l'auteur pourquoi la recette est refusée (5 caractères minimum).")
      return
    }
    setBusy(decision)
    setError(null)
    try {
      const result = await api.patch<ReviewResult>(`/moderation/recipes/${recipe.id}`, {
        status: decision,
        reviewNote: note.trim(),
        isBistronomic: decision === 'VALIDATED' ? bistronomic : false,
      })
      toast.success(
        decision === 'VALIDATED'
          ? `« ${recipe.title} » est publiée${bistronomic ? ' dans la sélection bistronomique' : ''}`
          : `« ${recipe.title} » est refusée : l'auteur verra ton retour`,
      )
      onReviewed(recipe.id, result)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const when =
    recipe.status === 'PENDING'
      ? `proposée ${relativeDate(recipe.updatedAt)}`
      : `${recipe.reviewer ? `par ${recipe.reviewer.name}, ` : ''}${recipe.reviewedAt ? relativeDate(recipe.reviewedAt) : ''}`

  return (
    <article className="card overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="h-32 w-full shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-36">
          <RecipeImage src={recipe.imageUrl} alt={recipe.title} category={recipe.category} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={recipe.status} />
            <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase">
              {CATEGORY_LABEL[recipe.category]}
            </span>
            {recipe.isBistronomic && <BistroBadge />}
          </div>
          <h3 className="mt-1.5 truncate text-lg font-semibold">
            <Link to={`/recipes/${recipe.id}`} className="hover:text-brigade-red">
              {recipe.title}
            </Link>
          </h3>
          <p className="text-xs text-charcoal-light">
            de{' '}
            <Link to={`/users/${recipe.author.id}`} className="font-semibold hover:text-brigade-red">
              {recipe.author.name}
            </Link>{' '}
            · {when} · {formatDuration(recipe.totalTime)} · {DIFFICULTY_LABEL[recipe.difficulty]}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={`btn shrink-0 ${open ? 'btn-secondary' : 'btn-dark'}`}
        >
          {open ? (
            <>
              <ChevronUp /> Replier
            </>
          ) : (
            <>
              <FlaskConical /> {recipe.status === 'PENDING' ? 'Tester la recette' : 'Revoir'}
            </>
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-charcoal/10 bg-cream/60 p-5">
          <p className="text-sm leading-relaxed text-charcoal-light">{recipe.description}</p>

          <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-charcoal/5">
              <h4 className="font-semibold">
                Ingrédients <span className="font-normal text-charcoal-light">· {plural(recipe.servings, 'personne')}</span>
              </h4>
              <ul className="mt-2 text-sm">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient.id} className="flex justify-between gap-3 border-b border-charcoal/5 py-1.5 last:border-0">
                    <span>{ingredient.name}</span>
                    <span className="text-right text-charcoal-light">{ingredient.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-charcoal/5">
              <h4 className="font-semibold">
                Étapes{' '}
                <span className="font-normal text-charcoal-light">
                  · préparation {formatDuration(recipe.prepTime)} · cuisson {formatDuration(recipe.cookTime)}
                </span>
              </h4>
              <ol className="mt-2 space-y-2 text-sm">
                {recipe.steps.map((step) => (
                  <li key={step.id} className="flex gap-2">
                    <span className="font-heading text-brigade-red">{step.order}.</span>
                    <span>{step.description}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {recipe.status === 'PENDING' && recipe.reviewNote && (
            <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-charcoal/5">
              <strong>Précédent retour (avant correction) :</strong> {recipe.reviewNote}
            </p>
          )}

          <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-charcoal/10">
            <label htmlFor={`note-${recipe.id}`} className="label">
              Retour pour l'auteur
            </label>
            <textarea
              id={`note-${recipe.id}`}
              rows={3}
              maxLength={1000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Qu'avez-vous pensé du résultat en cuisine ? (obligatoire en cas de refus)"
              className="input"
            />

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-olive/5 p-3 ring-1 ring-olive/20">
              <input
                type="checkbox"
                checked={bistronomic}
                onChange={(event) => setBistronomic(event.target.checked)}
                className="mt-1 h-4 w-4 accent-olive"
              />
              <span>
                <span className="flex items-center gap-1.5 font-semibold text-olive">
                  <Sparkles className="h-4 w-4" /> Sélection bistronomique
                </span>
                <span className="text-xs text-charcoal-light">
                  Cuisine accessible, créative et inspirée de la gastronomie : la recette sera mise en avant.
                </span>
              </span>
            </label>

            {error && (
              <p role="alert" className="mt-3 text-sm font-medium text-brigade-red">
                {error}
              </p>
            )}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => decide('REJECTED')} disabled={busy !== null} className="btn btn-secondary">
                <CircleX /> {busy === 'REJECTED' ? 'Refus…' : recipe.status === 'VALIDATED' ? 'Dépublier' : 'Refuser'}
              </button>
              <button type="button" onClick={() => decide('VALIDATED')} disabled={busy !== null} className="btn btn-olive">
                <CircleCheck />
                {busy === 'VALIDATED' ? 'Enregistrement…' : recipe.status === 'VALIDATED' ? 'Mettre à jour' : 'Valider et publier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

interface ReviewQueueProps {
  status: RecipeStatus
  onChanged: () => void
}

export function ReviewQueue({ status, onChanged }: ReviewQueueProps) {
  const [recipes, setRecipes] = useState<ReviewRecipe[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setRecipes(null)
    setError(null)
    api
      .get<ReviewRecipe[]>(`/moderation/recipes?status=${status}`)
      .then((data) => !cancelled && setRecipes(data))
      .catch((err) => !cancelled && setError(errorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [status])

  function handleReviewed(id: string, result: ReviewResult) {
    setRecipes((current) =>
      result.status !== status
        ? (current?.filter((recipe) => recipe.id !== id) ?? null)
        : (current?.map((recipe) => (recipe.id === id ? { ...recipe, ...result } : recipe)) ?? null),
    )
    onChanged()
  }

  if (error) return <p className="rounded-2xl bg-brigade-red/10 p-4 text-sm text-brigade-red">{error}</p>
  if (!recipes) return <PageLoader />
  if (recipes.length === 0) {
    const { title, text } = EMPTY_TEXT[status]
    return <EmptyState icon={status === 'PENDING' ? PartyPopper : FlaskConical} title={title} text={text} />
  }

  return (
    <div className="space-y-4">
      {recipes.map((recipe, index) => (
        <ReviewCard key={recipe.id} recipe={recipe} defaultOpen={status === 'PENDING' && index === 0} onReviewed={handleReviewed} />
      ))}
    </div>
  )
}
