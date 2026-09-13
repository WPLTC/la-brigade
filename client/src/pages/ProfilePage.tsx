import { BookOpen, Eye, Heart, Lightbulb, MessageCircle, Pencil, Plus, Star, Trash2, UtensilsCrossed } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { RecipeCard } from '../components/RecipeCard'
import {
  Avatar,
  BistroBadge,
  ChefPickBadge,
  EmptyState,
  PageLoader,
  RecipeImage,
  RoleBadge,
  StatusBadge,
  Stars,
  Tabs,
} from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api, errorMessage } from '../lib/api'
import { formatDate, formatMonthYear, relativeDate } from '../lib/format'
import type { MyProfile, MyRecipe, SessionUser } from '../lib/types'

type Tab = 'recipes' | 'favorites' | 'activity'
const TABS: Tab[] = ['recipes', 'favorites', 'activity']

export function ProfilePage() {
  useDocumentTitle('Mon profil')
  const { updateUser } = useAuth()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab') as Tab | null
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : 'recipes'

  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<MyRecipe | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => {
    api
      .get<MyProfile>('/users/me')
      .then(setProfile)
      .catch((err) => setError(errorMessage(err, 'Impossible de charger le profil')))
  }, [])

  useEffect(load, [load])

  function startEditing() {
    if (!profile) return
    setName(profile.name)
    setBio(profile.bio ?? '')
    setEditing(true)
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const user = await api.patch<SessionUser>('/users/me', { name, bio })
      updateUser(user)
      setProfile((previous) => previous && { ...previous, name: user.name, bio: user.bio })
      setEditing(false)
      toast.success('Profil mis à jour')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function deleteRecipe() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/recipes/${toDelete.id}`)
      setProfile((previous) => previous && { ...previous, recipes: previous.recipes.filter((r) => r.id !== toDelete.id) })
      toast.success('Recette supprimée')
      setToDelete(null)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  if (error) return <p className="mx-auto max-w-6xl px-4 py-16 text-brigade-red">{error}</p>
  if (!profile) return <PageLoader />

  const validatedCount = profile.recipes.filter((recipe) => recipe.status === 'VALIDATED').length
  const pendingCount = profile.recipes.filter((recipe) => recipe.status === 'PENDING').length

  return (
    <>
      <section className="bg-charcoal text-cream">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar name={profile.name} size="xl" />
            <div className="min-w-0 flex-1">
              {editing ? (
                <form onSubmit={saveProfile} className="max-w-xl space-y-3">
                  <div>
                    <label htmlFor="name" className="mb-1 block text-sm font-semibold text-cream/80">
                      Nom affiché
                    </label>
                    <input id="name" value={name} onChange={(event) => setName(event.target.value)} className="input" maxLength={60} />
                  </div>
                  <div>
                    <label htmlFor="bio" className="mb-1 block text-sm font-semibold text-cream/80">
                      Bio <span className="font-normal text-cream/50">({bio.length}/300)</span>
                    </label>
                    <textarea
                      id="bio"
                      rows={3}
                      maxLength={300}
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      placeholder="Ta cuisine en quelques mots…"
                      className="input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                    <button type="button" className="btn text-cream hover:bg-cream/10" onClick={() => setEditing(false)}>
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-heading text-4xl uppercase sm:text-5xl">{profile.name}</h1>
                    <RoleBadge role={profile.role} />
                  </div>
                  <p className="mt-1 text-sm text-cream/60">
                    {profile.email} · membre depuis {formatMonthYear(profile.createdAt)}
                  </p>
                  <p className="mt-3 max-w-2xl text-cream/85">
                    {profile.bio || <span className="text-cream/50 italic">Ajoute une bio pour te présenter à la communauté.</span>}
                  </p>
                </>
              )}
            </div>
            {!editing && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={startEditing} className="btn bg-cream text-charcoal hover:bg-white">
                  <Pencil /> Modifier
                </button>
                <Link to={`/users/${profile.id}`} className="btn text-cream ring-1 ring-cream/20 hover:bg-cream/10">
                  <Eye /> Profil public
                </Link>
              </div>
            )}
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [validatedCount, 'recettes publiées'],
              [pendingCount, 'en attente de test'],
              [profile._count.ratings, 'notes données'],
              [profile._count.comments, 'commentaires'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-cream/5 p-4 ring-1 ring-cream/10">
                <dd className="font-heading text-3xl">{value}</dd>
                <dt className="text-xs text-cream/60">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <Tabs
          active={tab}
          onChange={(next) => setParams(next === 'recipes' ? {} : { tab: next }, { replace: true })}
          tabs={[
            { id: 'recipes', label: 'Mes recettes', count: profile.recipes.length, icon: BookOpen },
            { id: 'favorites', label: 'Mes favoris', count: profile.favorites.length, icon: Heart },
            { id: 'activity', label: 'Mes interactions', icon: MessageCircle },
          ]}
        />

        <div className="mt-6">
          {tab === 'recipes' &&
            (profile.recipes.length === 0 ? (
              <EmptyState
                icon={UtensilsCrossed}
                title="Tu n'as pas encore proposé de recette"
                text="Partage ton plat signature : la brigade le testera et te fera un retour."
                action={
                  <Link to="/recipes/new" className="btn btn-primary">
                    <Plus /> Proposer une recette
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-3">
                {profile.recipes.map((recipe) => (
                  <li key={recipe.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <Link to={`/recipes/${recipe.id}`} className="h-32 w-full shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-32">
                      <RecipeImage src={recipe.imageUrl} alt={recipe.title} category={recipe.category} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={recipe.status} />
                        {recipe.isBistronomic && <BistroBadge />}
                        {recipe.chefPicks.length > 0 && <ChefPickBadge />}
                      </div>
                      <Link to={`/recipes/${recipe.id}`} className="mt-1.5 block truncate text-lg font-semibold hover:text-brigade-red">
                        {recipe.title}
                      </Link>
                      <p className="text-xs text-charcoal-light">
                        Proposée le {formatDate(recipe.createdAt)}
                        {recipe.status === 'VALIDATED' &&
                          ` · ${recipe.ratingsCount ? `${recipe.averageRating.toFixed(1)}/5 (${recipe.ratingsCount} notes)` : 'pas encore notée'} · ${recipe._count.favorites} favoris`}
                      </p>
                      {recipe.reviewNote && recipe.status !== 'VALIDATED' && (
                        <p
                          className={`mt-2 rounded-xl px-3 py-2 text-sm ${
                            recipe.status === 'REJECTED' ? 'bg-brigade-red/10 text-brigade-red' : 'bg-cream-dark text-charcoal-light'
                          }`}
                        >
                          <strong>Retour de la brigade :</strong> {recipe.reviewNote}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {recipe.status !== 'VALIDATED' && (
                        <Link to={`/recipes/${recipe.id}/edit`} className="btn btn-secondary btn-sm">
                          <Pencil /> {recipe.status === 'REJECTED' ? 'Corriger' : 'Modifier'}
                        </Link>
                      )}
                      <button type="button" onClick={() => setToDelete(recipe)} className="btn btn-ghost btn-sm text-brigade-red">
                        <Trash2 /> Supprimer
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ))}

          {tab === 'favorites' &&
            (profile.favorites.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="Aucun favori pour le moment"
                text="Garde sous le coude les recettes que tu veux cuisiner en cliquant sur « Ajouter aux favoris »."
                action={
                  <Link to="/recipes" className="btn btn-primary">
                    Parcourir les recettes
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {profile.favorites.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            ))}

          {tab === 'activity' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Star className="h-5 w-5 text-gold" /> Mes notes
                </h2>
                {profile.ratings.length === 0 ? (
                  <p className="mt-4 text-sm text-charcoal-light">Tu n'as encore noté aucune recette.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-charcoal/5">
                    {profile.ratings.map((rating) => (
                      <li key={rating.id} className="flex items-center gap-3 py-3">
                        <Link to={`/recipes/${rating.recipe.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-brigade-red">
                          {rating.recipe.title}
                        </Link>
                        <Stars value={rating.value} size={14} />
                        <span className="w-24 text-right text-xs text-charcoal-light">{relativeDate(rating.updatedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="card p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <MessageCircle className="h-5 w-5 text-brigade-red" /> Mes commentaires
                </h2>
                {profile.comments.length === 0 ? (
                  <p className="mt-4 text-sm text-charcoal-light">Tu n'as encore rien commenté.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {profile.comments.map((comment) => (
                      <li key={comment.id} className="rounded-2xl bg-cream p-3 text-sm">
                        <p className="flex items-center gap-1.5">
                          {comment.kind === 'CONSEIL' && <Lightbulb className="h-4 w-4 shrink-0 text-gold-dark" />}« {comment.content} »
                        </p>
                        <p className="mt-1 text-xs text-charcoal-light">
                          sur{' '}
                          <Link to={`/recipes/${comment.recipe.id}`} className="font-semibold hover:text-brigade-red">
                            {comment.recipe.title}
                          </Link>{' '}
                          · {relativeDate(comment.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Supprimer la recette ?"
        message={`« ${toDelete?.title ?? ''} » sera définitivement supprimée, avec ses notes et commentaires.`}
        confirmLabel="Supprimer"
        busy={deleting}
        onConfirm={deleteRecipe}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
