import { Heart, MessageCircle, Star, Trash2, Trophy } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { api, errorMessage } from '../../lib/api'
import { currentMonthKey, formatMonth } from '../../lib/format'
import type { MonthlyData } from '../../lib/types'
import { ConfirmDialog } from '../ConfirmDialog'
import { EmptyState, PageLoader, RecipeImage } from '../ui'

export function MonthlyPanel() {
  const toast = useToast()
  const [month, setMonth] = useState(currentMonthKey())
  const [data, setData] = useState<MonthlyData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [verdict, setVerdict] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const load = useCallback(() => {
    api
      .get<MonthlyData>(`/moderation/monthly?month=${month}`)
      .then((result) => {
        setData(result)
        setError(null)
        setSelectedId(result.pick?.recipe.id ?? result.ranking[0]?.recipe.id ?? null)
        setVerdict(result.pick?.verdict ?? '')
      })
      .catch((err) => setError(errorMessage(err)))
  }, [month])

  useEffect(() => {
    setData(null)
    load()
  }, [load])

  async function save() {
    if (!selectedId) {
      setError('Choisis une recette dans le classement')
      return
    }
    if (verdict.trim().length < 10) {
      setError('Le verdict du chef doit contenir au moins 10 caractères')
      return
    }
    setSaving(true)
    try {
      await api.put(`/moderation/monthly/${month}`, { recipeId: selectedId, verdict: verdict.trim() })
      toast.success(`Recette du mois de ${formatMonth(month)} enregistrée`)
      load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    try {
      await api.delete(`/moderation/monthly/${month}`)
      toast.success('Recette du mois retirée')
      setConfirmRemove(false)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const selected = data?.ranking.find((entry) => entry.recipe.id === selectedId)?.recipe ?? data?.pick?.recipe

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section className="card p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Classement de popularité</h2>
            <p className="text-sm text-charcoal-light">Interactions du mois : favori ×3 · note ×2 · commentaire ×1</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            Mois
            <input
              type="month"
              value={month}
              max={currentMonthKey()}
              onChange={(event) => event.target.value && setMonth(event.target.value)}
              className="input w-auto py-2"
            />
          </label>
        </div>

        <div className="mt-5">
          {!data ? (
            error ? <p className="text-sm text-brigade-red">{error}</p> : <PageLoader />
          ) : data.ranking.length === 0 ? (
            <EmptyState icon={Trophy} title="Aucune interaction ce mois-ci" text="Le classement se remplira au fil des favoris, notes et commentaires." />
          ) : (
            <div role="radiogroup" aria-label="Recette du mois" className="space-y-2">
              {data.ranking.map((entry, index) => {
                const active = entry.recipe.id === selectedId
                return (
                  <label
                    key={entry.recipe.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3 ring-1 transition ${
                      active ? 'bg-brigade-red/5 ring-brigade-red' : 'bg-white ring-charcoal/10 hover:ring-charcoal/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="monthly-pick"
                      className="sr-only"
                      checked={active}
                      onChange={() => setSelectedId(entry.recipe.id)}
                    />
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-heading text-lg ${
                        index === 0 ? 'bg-gold text-charcoal' : 'bg-cream'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                      <RecipeImage src={entry.recipe.imageUrl} alt="" category={entry.recipe.category} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{entry.recipe.title}</span>
                      <span className="flex gap-3 text-xs text-charcoal-light">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {entry.favorites}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3" /> {entry.ratings}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> {entry.comments}
                        </span>
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-heading text-2xl leading-none">{entry.score}</span>
                      <span className="text-[10px] tracking-wider text-charcoal-light uppercase">points</span>
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <div className="space-y-6">
        <section className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-brigade-red" /> Verdict du chef · {formatMonth(month)}
          </h2>

          {data?.pick && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-olive/10 p-3 text-sm">
              <span className="min-w-0 flex-1">
                Actuellement :{' '}
                <Link to={`/recipes/${data.pick.recipe.id}`} className="font-semibold hover:text-brigade-red">
                  {data.pick.recipe.title}
                </Link>
              </span>
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="rounded-full p-1.5 text-charcoal-light hover:bg-brigade-red/10 hover:text-brigade-red"
                aria-label="Retirer la recette du mois"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          <p className="mt-4 text-sm">
            Recette choisie : <strong>{selected?.title ?? 'aucune'}</strong>
          </p>
          <label htmlFor="verdict" className="label mt-4">
            Verdict après dégustation
          </label>
          <textarea
            id="verdict"
            rows={5}
            maxLength={1000}
            value={verdict}
            onChange={(event) => setVerdict(event.target.value)}
            placeholder="Ce que le chef a pensé de la recette…"
            className="input"
          />
          {error && data && (
            <p role="alert" className="mt-2 text-sm text-brigade-red">
              {error}
            </p>
          )}
          <button type="button" onClick={save} disabled={saving || !selectedId} className="btn btn-primary mt-4 w-full">
            <Trophy /> {saving ? 'Enregistrement…' : data?.pick ? 'Mettre à jour la recette du mois' : 'Désigner la recette du mois'}
          </button>
        </section>

        {data && data.history.length > 0 && (
          <section className="card p-6">
            <h2 className="text-lg font-semibold">Historique</h2>
            <ul className="mt-3 divide-y divide-charcoal/5">
              {data.history.map((pick) => (
                <li key={pick.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-28 shrink-0 text-xs font-semibold text-charcoal-light capitalize">{formatMonth(pick.month)}</span>
                  <Link to={`/recipes/${pick.recipe.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-brigade-red">
                    {pick.recipe.title}
                  </Link>
                  <span className="text-xs text-charcoal-light">{pick.score} pts</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        title="Retirer la recette du mois ?"
        message="Le verdict du chef sera supprimé pour ce mois."
        confirmLabel="Retirer"
        onConfirm={remove}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  )
}
