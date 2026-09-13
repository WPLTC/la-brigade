import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChefHat,
  CircleX,
  Flame,
  Heart,
  Hourglass,
  Lightbulb,
  MessageCircle,
  Pencil,
  Share2,
  ShieldCheck,
  Star,
  Timer,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  Avatar,
  BistroBadge,
  ChefPickBadge,
  EmptyState,
  PageLoader,
  RecipeImage,
  RoleBadge,
  StarInput,
  Stars,
} from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api, ApiError, errorMessage } from '../lib/api'
import {
  CATEGORY_LABEL,
  CATEGORY_PLURAL,
  DIFFICULTY_LABEL,
  formatDate,
  formatDuration,
  formatMonth,
  plural,
  relativeDate,
} from '../lib/format'
import type { Comment, CommentKind, RecipeDetail } from '../lib/types'

type CommentFilter = 'ALL' | CommentKind
type PendingDeletion = { type: 'recipe' } | { type: 'comment'; id: string } | null

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading')
  useDocumentTitle(recipe?.title)

  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set())
  const [doneSteps, setDoneSteps] = useState<Set<string>>(new Set())
  const [ratingBusy, setRatingBusy] = useState(false)
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentKind, setCommentKind] = useState<CommentKind>('AVIS')
  const [commentBusy, setCommentBusy] = useState(false)
  const [commentFilter, setCommentFilter] = useState<CommentFilter>('ALL')
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      setRecipe(await api.get<RecipeDetail>(`/recipes/${id}`))
      setState('ready')
    } catch (error) {
      setState(error instanceof ApiError && error.status === 404 ? 'notfound' : 'error')
    }
  }, [id])

  useEffect(() => {
    setState('loading')
    load()
  }, [load, user?.id])

  const toggleInSet = (setter: typeof setDoneSteps, key: string) =>
    setter((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  if (state === 'loading') return <PageLoader />

  if (state !== 'ready' || !recipe) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <EmptyState
          icon={CircleX}
          title={state === 'notfound' ? 'Recette introuvable' : 'Chargement impossible'}
          text={
            state === 'notfound'
              ? "Cette recette n'existe pas, a été supprimée, ou attend encore la validation de la brigade."
              : 'Le serveur ne répond pas. Réessaie dans un instant.'
          }
          action={
            <Link to="/recipes" className="btn btn-primary">
              Retour aux recettes
            </Link>
          }
        />
      </div>
    )
  }

  const current = recipe
  const chefPick = current.chefPicks[0]
  const isValidated = current.status === 'VALIDATED'
  const comments = current.comments.filter((comment) => commentFilter === 'ALL' || comment.kind === commentFilter)
  const tipsCount = current.comments.filter((comment) => comment.kind === 'CONSEIL').length

  function requireLogin() {
    navigate('/login', { state: { from: location } })
  }

  async function toggleFavorite() {
    if (!isAuthenticated) return requireLogin()
    const next = !current.isFavorite
    setFavoriteBusy(true)
    try {
      const response = next
        ? await api.put<{ isFavorite: boolean; favoritesCount: number }>(`/recipes/${current.id}/favorite`)
        : await api.delete<{ isFavorite: boolean; favoritesCount: number }>(`/recipes/${current.id}/favorite`)
      setRecipe((previous) =>
        previous && {
          ...previous,
          isFavorite: response.isFavorite,
          _count: { ...previous._count, favorites: response.favoritesCount },
        },
      )
      toast.success(next ? 'Ajoutée à tes favoris' : 'Retirée de tes favoris')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setFavoriteBusy(false)
    }
  }

  async function rate(value: number) {
    setRatingBusy(true)
    try {
      await api.post(`/recipes/${current.id}/ratings`, { value })
      await load()
      toast.success('Merci pour ta note !')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setRatingBusy(false)
    }
  }

  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: current.title, text: `${current.title} sur La Brigade`, url })
      } catch {
        // partage annulé par l'utilisateur
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Lien de la recette copié')
    } catch {
      toast.error('Impossible de copier le lien')
    }
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault()
    if (!commentText.trim()) return
    setCommentBusy(true)
    try {
      const comment = await api.post<Comment>(`/recipes/${current.id}/comments`, {
        content: commentText.trim(),
        kind: commentKind,
      })
      setRecipe((previous) => previous && { ...previous, comments: [comment, ...previous.comments] })
      setCommentText('')
      toast.success(commentKind === 'CONSEIL' ? 'Merci pour ton conseil !' : 'Ton avis est publié')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setCommentBusy(false)
    }
  }

  async function confirmDeletion() {
    if (!pendingDeletion) return
    setDeleting(true)
    try {
      if (pendingDeletion.type === 'comment') {
        const commentId = pendingDeletion.id
        await api.delete(`/comments/${commentId}`)
        setRecipe((previous) => previous && { ...previous, comments: previous.comments.filter((c) => c.id !== commentId) })
        toast.success('Commentaire supprimé')
      } else {
        await api.delete(`/recipes/${current.id}`)
        toast.success('Recette supprimée')
        navigate(user?.id === current.author.id ? '/profile' : '/recipes')
      }
      setPendingDeletion(null)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setDeleting(false)
    }
  }

  const facts = [
    { label: 'Préparation', value: formatDuration(current.prepTime), icon: Timer },
    { label: 'Cuisson', value: current.cookTime ? formatDuration(current.cookTime) : 'Sans cuisson', icon: Flame },
    { label: 'Portions', value: plural(current.servings, 'personne'), icon: Users },
    { label: 'Difficulté', value: DIFFICULTY_LABEL[current.difficulty], icon: ChefHat },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-charcoal-light" aria-label="Fil d'Ariane">
        <Link to="/recipes" className="inline-flex items-center gap-1 hover:text-brigade-red">
          <ArrowLeft className="h-4 w-4" /> Recettes
        </Link>
        <span aria-hidden="true">/</span>
        <Link to={`/recipes?category=${current.category}`} className="hover:text-brigade-red">
          {CATEGORY_PLURAL[current.category]}
        </Link>
      </nav>

      {current.status === 'PENDING' && (
        <div className="mt-6 flex gap-3 rounded-2xl bg-gold/15 p-4 text-sm ring-1 ring-gold/30">
          <Hourglass className="h-5 w-5 shrink-0 text-gold-dark" />
          <div>
            <p className="font-semibold text-gold-dark">En attente de validation par la brigade</p>
            <p className="text-charcoal-light">
              Cette recette n'est visible que par son auteur et l'équipe du chef tant qu'elle n'a pas été testée.
            </p>
            {current.reviewNote && <p className="mt-2">Dernier retour de la brigade : « {current.reviewNote} »</p>}
          </div>
        </div>
      )}

      {current.status === 'REJECTED' && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-brigade-red/10 p-4 text-sm ring-1 ring-brigade-red/20 sm:flex-row sm:items-center">
          <CircleX className="h-5 w-5 shrink-0 text-brigade-red" />
          <div className="flex-1">
            <p className="font-semibold text-brigade-red">Recette refusée par la brigade</p>
            {current.reviewNote && <p className="mt-1 text-charcoal">« {current.reviewNote} »</p>}
          </div>
          {current.permissions.canEdit && (
            <Link to={`/recipes/${current.id}/edit`} className="btn btn-primary btn-sm">
              <Pencil /> Corriger et resoumettre
            </Link>
          )}
        </div>
      )}

      {/* ---------- En-tête ---------- */}
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-cream-dark shadow-xl">
          <RecipeImage src={current.imageUrl} alt={current.title} category={current.category} />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {chefPick && <ChefPickBadge />}
            {current.isBistronomic && <BistroBadge />}
          </div>
        </div>

        <div>
          <p className="eyebrow">{CATEGORY_LABEL[current.category]}</p>
          <h1 className="mt-2 font-heading text-4xl leading-none uppercase sm:text-5xl">{current.title}</h1>

          <Link to={`/users/${current.author.id}`} className="group mt-5 inline-flex items-center gap-3">
            <Avatar name={current.author.name} />
            <span className="text-sm">
              Proposée par <strong className="group-hover:text-brigade-red">{current.author.name}</strong>
              <span className="block text-xs text-charcoal-light">le {formatDate(current.createdAt)}</span>
            </span>
          </Link>

          <p className="mt-5 leading-relaxed text-charcoal-light">{current.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl bg-white p-3 ring-1 ring-charcoal/5">
                <Icon className="h-4 w-4 text-brigade-red" />
                <dt className="mt-2 text-xs text-charcoal-light">{label}</dt>
                <dd className="text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          {isValidated && (
            <a href="#avis" className="mt-6 inline-flex items-center gap-2">
              <Stars value={current.averageRating} size={18} />
              {current.ratingsCount > 0 ? (
                <>
                  <span className="font-semibold">{current.averageRating.toFixed(1)}</span>
                  <span className="text-sm text-charcoal-light">({plural(current.ratingsCount, 'note')})</span>
                </>
              ) : (
                <span className="text-sm text-charcoal-light">Pas encore notée — sois le premier !</span>
              )}
            </a>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {isValidated && (
              <button
                type="button"
                onClick={toggleFavorite}
                disabled={favoriteBusy}
                aria-pressed={current.isFavorite}
                className={`btn ${current.isFavorite ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Heart className={current.isFavorite ? 'fill-current' : ''} />
                {current.isFavorite ? 'Dans mes favoris' : 'Ajouter aux favoris'}
                <span className="opacity-70">· {current._count.favorites}</span>
              </button>
            )}
            <button type="button" onClick={share} className="btn btn-secondary">
              <Share2 /> Partager
            </button>
            {current.permissions.canEdit && (
              <Link to={`/recipes/${current.id}/edit`} className="btn btn-secondary">
                <Pencil /> Modifier
              </Link>
            )}
            {current.permissions.canModerate && current.status === 'PENDING' && (
              <Link to="/moderation" className="btn btn-dark">
                <ShieldCheck /> Tester dans l'espace brigade
              </Link>
            )}
            {current.permissions.canDelete && (
              <button type="button" onClick={() => setPendingDeletion({ type: 'recipe' })} className="btn btn-ghost text-brigade-red">
                <Trash2 /> Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Verdict du chef ---------- */}
      {chefPick && (
        <section className="mt-14 overflow-hidden rounded-[2rem] bg-charcoal text-cream">
          <div className="grid sm:grid-cols-[auto_1fr]">
            <div className="flex items-center justify-center bg-brigade-red p-8">
              <Trophy className="h-14 w-14" />
            </div>
            <div className="p-8">
              <p className="eyebrow text-cream/60">Recette du mois · {formatMonth(chefPick.month)}</p>
              <blockquote className="mt-3 font-serif text-xl leading-relaxed italic sm:text-2xl">« {chefPick.verdict} »</blockquote>
              <p className="mt-4 text-sm text-cream/70">— {chefPick.chef.name}, après dégustation</p>
            </div>
          </div>
        </section>
      )}

      {isValidated && current.reviewNote && (
        <div className="mt-8 flex gap-4 rounded-3xl bg-olive/10 p-6 ring-1 ring-olive/20">
          <BadgeCheck className="h-6 w-6 shrink-0 text-olive" />
          <div>
            <p className="font-semibold text-olive">Le mot de la brigade</p>
            <p className="mt-1">{current.reviewNote}</p>
            {current.reviewer && (
              <p className="mt-2 text-xs text-charcoal-light">
                Testée par {current.reviewer.name}
                {current.reviewedAt && ` le ${formatDate(current.reviewedAt)}`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ---------- Ingrédients & étapes ---------- */}
      <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <section className="card p-6 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-heading text-2xl uppercase">Ingrédients</h2>
            <span className="text-sm text-charcoal-light">pour {plural(current.servings, 'personne')}</span>
          </div>
          <ul className="mt-4 divide-y divide-charcoal/5">
            {current.ingredients.map((ingredient) => {
              const checked = checkedIngredients.has(ingredient.id)
              return (
                <li key={ingredient.id}>
                  <label className="flex cursor-pointer items-start gap-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleInSet(setCheckedIngredients, ingredient.id)}
                      className="mt-1 h-4 w-4 accent-brigade-red"
                    />
                    <span className={`flex-1 ${checked ? 'text-charcoal-light line-through' : ''}`}>{ingredient.name}</span>
                    {ingredient.quantity && (
                      <span className="text-right text-sm font-medium text-charcoal-light">{ingredient.quantity}</span>
                    )}
                  </label>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-xs text-charcoal-light">Astuce : coche les ingrédients au fur et à mesure.</p>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase">Préparation</h2>
          <ol className="mt-4 space-y-3">
            {current.steps.map((step) => {
              const done = doneSteps.has(step.id)
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => toggleInSet(setDoneSteps, step.id)}
                    aria-pressed={done}
                    className={`flex w-full gap-4 rounded-2xl p-4 text-left ring-1 transition ${
                      done ? 'bg-olive/5 ring-olive/20' : 'bg-white ring-charcoal/5 hover:ring-charcoal/20'
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-heading text-lg text-white ${
                        done ? 'bg-olive' : 'bg-brigade-red'
                      }`}
                    >
                      {done ? <Check className="h-5 w-5" /> : step.order}
                    </span>
                    <span className={`pt-1.5 leading-relaxed ${done ? 'text-charcoal-light' : ''}`}>{step.description}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      </div>

      {/* ---------- Notes & commentaires ---------- */}
      {isValidated && (
        <section id="avis" className="mt-16 grid scroll-mt-24 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div className="card p-6 lg:self-start">
            <h2 className="font-heading text-2xl uppercase">Notes</h2>
            <div className="mt-4 flex items-center gap-4">
              <span className="font-heading text-6xl leading-none">
                {current.ratingsCount ? current.averageRating.toFixed(1) : '–'}
              </span>
              <div>
                <Stars value={current.averageRating} size={20} />
                <p className="mt-1 text-sm text-charcoal-light">{plural(current.ratingsCount, 'note')}</p>
              </div>
            </div>
            <div className="mt-5 space-y-1.5">
              {[5, 4, 3, 2, 1].map((value) => {
                const count = current.ratingDistribution[value] ?? 0
                const percent = current.ratingsCount ? (count / current.ratingsCount) * 100 : 0
                return (
                  <div key={value} className="flex items-center gap-2 text-xs">
                    <span className="w-2">{value}</span>
                    <Star className="h-3 w-3 text-gold" fill="currentColor" strokeWidth={0} />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-charcoal/10">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-5 text-right text-charcoal-light">{count}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 border-t border-charcoal/10 pt-5">
              {current.permissions.canRate ? (
                <>
                  <p className="text-sm font-semibold">{current.myRating ? 'Ta note (tu peux la modifier)' : "Tu l'as cuisinée ? Donne ta note"}</p>
                  <StarInput value={current.myRating} onChange={rate} disabled={ratingBusy} />
                </>
              ) : !isAuthenticated ? (
                <p className="text-sm text-charcoal-light">
                  <Link to="/login" state={{ from: location }} className="font-semibold text-brigade-red hover:underline">
                    Connecte-toi
                  </Link>{' '}
                  pour noter cette recette.
                </p>
              ) : (
                <p className="text-sm text-charcoal-light">Tu ne peux pas noter ta propre recette.</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-2xl uppercase">
                Avis & conseils <span className="text-charcoal-light">({current.comments.length})</span>
              </h2>
              <div role="tablist" aria-label="Filtrer les commentaires" className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-charcoal/10">
                {(
                  [
                    ['ALL', 'Tous'],
                    ['AVIS', 'Avis'],
                    ['CONSEIL', `Conseils (${tipsCount})`],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={commentFilter === value}
                    onClick={() => setCommentFilter(value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      commentFilter === value ? 'bg-charcoal text-cream' : 'text-charcoal-light hover:text-charcoal'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {isAuthenticated && user ? (
              <form onSubmit={submitComment} className="card mt-4 p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={user.name} />
                  <div className="min-w-0 flex-1">
                    <label htmlFor="comment" className="sr-only">
                      Ton commentaire
                    </label>
                    <textarea
                      id="comment"
                      rows={3}
                      maxLength={1000}
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      placeholder={
                        commentKind === 'CONSEIL'
                          ? 'Partage une astuce de préparation, une variante…'
                          : 'Raconte comment ça s’est passé en cuisine…'
                      }
                      className="input"
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-2" role="radiogroup" aria-label="Type de commentaire">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={commentKind === 'AVIS'}
                          onClick={() => setCommentKind('AVIS')}
                          className={`chip ${commentKind === 'AVIS' ? 'chip-active' : ''}`}
                        >
                          <MessageCircle /> Avis
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={commentKind === 'CONSEIL'}
                          onClick={() => setCommentKind('CONSEIL')}
                          className={`chip ${commentKind === 'CONSEIL' ? 'chip-active' : ''}`}
                        >
                          <Lightbulb /> Conseil
                        </button>
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={commentBusy || !commentText.trim()}>
                        {commentBusy ? 'Publication…' : 'Publier'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="card mt-4 p-5 text-sm text-charcoal-light">
                <Link to="/login" state={{ from: location }} className="font-semibold text-brigade-red hover:underline">
                  Connecte-toi
                </Link>{' '}
                pour partager ton avis ou un conseil de préparation.
              </div>
            )}

            {comments.length === 0 ? (
              <p className="mt-6 text-center text-sm text-charcoal-light">
                {commentFilter === 'CONSEIL' ? 'Aucun conseil pour le moment.' : 'Aucun commentaire pour le moment.'}
              </p>
            ) : (
              <ul className="mt-5 space-y-3">
                {comments.map((comment) => (
                  <li key={comment.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <Link to={`/users/${comment.author.id}`} aria-label={`Profil de ${comment.author.name}`}>
                        <Avatar name={comment.author.name} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link to={`/users/${comment.author.id}`} className="font-semibold hover:text-brigade-red">
                            {comment.author.name}
                          </Link>
                          <RoleBadge role={comment.author.role} />
                          {comment.kind === 'CONSEIL' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold-dark">
                              <Lightbulb className="h-3 w-3" /> Conseil
                            </span>
                          )}
                          <span className="text-xs text-charcoal-light">{relativeDate(comment.createdAt)}</span>
                        </div>
                        <p className="mt-1.5 whitespace-pre-line">{comment.content}</p>
                      </div>
                      {(user?.id === comment.author.id || current.permissions.canModerate) && (
                        <button
                          type="button"
                          onClick={() => setPendingDeletion({ type: 'comment', id: comment.id })}
                          aria-label="Supprimer le commentaire"
                          className="rounded-full p-1.5 text-charcoal-light transition hover:bg-brigade-red/10 hover:text-brigade-red"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={pendingDeletion !== null}
        title={pendingDeletion?.type === 'recipe' ? 'Supprimer la recette ?' : 'Supprimer le commentaire ?'}
        message={
          pendingDeletion?.type === 'recipe'
            ? 'La recette, ses notes et ses commentaires seront définitivement supprimés.'
            : 'Ce commentaire sera définitivement supprimé.'
        }
        confirmLabel="Supprimer"
        busy={deleting}
        onConfirm={confirmDeletion}
        onCancel={() => setPendingDeletion(null)}
      />
    </div>
  )
}
