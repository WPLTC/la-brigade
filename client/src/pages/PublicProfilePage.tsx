import { CircleX, Lightbulb, MessageCircle, UtensilsCrossed } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RecipeCard } from '../components/RecipeCard'
import { Avatar, EmptyState, PageLoader, RoleBadge } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api, errorMessage } from '../lib/api'
import { formatMonthYear, relativeDate } from '../lib/format'
import type { PublicProfile } from '../lib/types'

export function PublicProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  useDocumentTitle(profile?.name)

  useEffect(() => {
    setProfile(null)
    setError(null)
    api
      .get<PublicProfile>(`/users/${id}`)
      .then(setProfile)
      .catch((err) => setError(errorMessage(err, 'Membre introuvable')))
  }, [id])

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <EmptyState icon={CircleX} title={error} action={<Link to="/recipes" className="btn btn-primary">Voir les recettes</Link>} />
      </div>
    )
  }
  if (!profile) return <PageLoader />

  const averageRating = profile.recipes.filter((r) => r.ratingsCount > 0)
  const globalAverage = averageRating.length
    ? averageRating.reduce((sum, r) => sum + r.averageRating, 0) / averageRating.length
    : null

  return (
    <>
      <section className="border-b border-charcoal/10 bg-cream-dark/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center">
          <Avatar name={profile.name} size="xl" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-4xl uppercase sm:text-5xl">{profile.name}</h1>
              <RoleBadge role={profile.role} />
            </div>
            <p className="mt-1 text-sm text-charcoal-light">Membre depuis {formatMonthYear(profile.createdAt)}</p>
            {profile.bio && <p className="mt-3 max-w-2xl">{profile.bio}</p>}
          </div>
          {user?.id === profile.id && (
            <Link to="/profile" className="btn btn-secondary">
              Gérer mon profil
            </Link>
          )}
        </div>
        <dl className="mx-auto grid max-w-6xl grid-cols-3 gap-3 px-4 pb-10 sm:max-w-6xl sm:grid-cols-4">
          {[
            [profile.recipes.length, 'recettes validées'],
            [globalAverage ? globalAverage.toFixed(1) : '–', 'note moyenne reçue'],
            [profile._count.ratings, 'notes données'],
            [profile._count.comments, 'commentaires'],
          ].map(([value, label], index) => (
            <div key={label} className={`rounded-2xl bg-white p-4 ring-1 ring-charcoal/5 ${index === 3 ? 'hidden sm:block' : ''}`}>
              <dd className="font-heading text-3xl">{value}</dd>
              <dt className="text-xs text-charcoal-light">{label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="font-heading text-3xl uppercase">Ses recettes</h2>
        <div className="mt-6">
          {profile.recipes.length === 0 ? (
            <EmptyState icon={UtensilsCrossed} title="Aucune recette publiée pour le moment" />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {profile.recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>

        {profile.comments.length > 0 && (
          <>
            <h2 className="mt-14 flex items-center gap-2 font-heading text-3xl uppercase">
              <MessageCircle className="h-6 w-6 text-brigade-red" /> Derniers échanges
            </h2>
            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {profile.comments.map((comment) => (
                <li key={comment.id} className="card p-4 text-sm">
                  <p className="flex gap-1.5">
                    {comment.kind === 'CONSEIL' && <Lightbulb className="h-4 w-4 shrink-0 text-gold-dark" />}« {comment.content} »
                  </p>
                  <p className="mt-2 text-xs text-charcoal-light">
                    sur{' '}
                    <Link to={`/recipes/${comment.recipe.id}`} className="font-semibold hover:text-brigade-red">
                      {comment.recipe.title}
                    </Link>{' '}
                    · {relativeDate(comment.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
