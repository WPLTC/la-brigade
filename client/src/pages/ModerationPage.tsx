import { CircleCheck, CircleX, FlaskConical, Sparkles, Trophy, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MembersPanel } from '../components/moderation/MembersPanel'
import { MonthlyPanel } from '../components/moderation/MonthlyPanel'
import { ReviewQueue } from '../components/moderation/ReviewQueue'
import { Tabs } from '../components/ui'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../lib/api'
import { plural, relativeDate } from '../lib/format'
import type { ModerationStats, RecipeStatus } from '../lib/types'

type Tab = RecipeStatus | 'monthly' | 'members'
const TABS: Tab[] = ['PENDING', 'VALIDATED', 'REJECTED', 'monthly', 'members']

export function ModerationPage() {
  useDocumentTitle('Espace brigade')
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab') as Tab | null
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : 'PENDING'
  const [stats, setStats] = useState<ModerationStats | null>(null)

  const refreshStats = useCallback(() => {
    api.get<ModerationStats>('/moderation/stats').then(setStats).catch(() => setStats(null))
  }, [])

  useEffect(refreshStats, [refreshStats])

  const tiles = [
    {
      label: 'À tester',
      value: stats?.pending,
      hint: stats?.oldestPendingAt ? `la plus ancienne ${relativeDate(stats.oldestPendingAt)}` : 'file vide',
      tone: 'bg-brigade-red text-white',
    },
    { label: 'Publiées', value: stats?.validated, hint: plural(stats?.rejected ?? 0, 'refusée'), tone: 'bg-cream/10' },
    { label: 'Bistronomiques', value: stats?.bistronomic, hint: 'dans la sélection', tone: 'bg-cream/10' },
    { label: 'Membres', value: stats?.members, hint: `dont ${stats?.chefTeam ?? 0} en brigade`, tone: 'bg-cream/10' },
  ]

  return (
    <>
      <section className="bg-charcoal text-cream">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="eyebrow text-cream/60">Réservé à l'équipe du chef</p>
          <h1 className="mt-2 font-heading text-5xl uppercase sm:text-6xl">Espace brigade</h1>
          <p className="mt-2 max-w-2xl text-cream/70">
            Testez les recettes proposées, faites un retour à leurs auteurs, composez la sélection bistronomique et désignez
            la recette du mois.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {tiles.map((tile) => (
              <div key={tile.label} className={`rounded-2xl p-4 ring-1 ring-cream/10 ${tile.tone}`}>
                <dd className="font-heading text-4xl">{tile.value ?? '–'}</dd>
                <dt className="text-sm font-semibold">{tile.label}</dt>
                <p className="text-xs opacity-70">{tile.hint}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <Tabs
          active={tab}
          onChange={(next) => setParams(next === 'PENDING' ? {} : { tab: next }, { replace: true })}
          tabs={[
            { id: 'PENDING', label: 'À tester', count: stats?.pending, icon: FlaskConical },
            { id: 'VALIDATED', label: 'Publiées', icon: CircleCheck },
            { id: 'REJECTED', label: 'Refusées', icon: CircleX },
            { id: 'monthly', label: 'Recette du mois', icon: Trophy },
            { id: 'members', label: 'Membres', icon: Users },
          ]}
        />

        <div className="mt-6">
          {(tab === 'PENDING' || tab === 'VALIDATED' || tab === 'REJECTED') && (
            <ReviewQueue status={tab} onChanged={refreshStats} />
          )}
          {tab === 'monthly' && <MonthlyPanel />}
          {tab === 'members' && <MembersPanel />}
        </div>

        {tab === 'VALIDATED' && (
          <p className="mt-6 flex items-center gap-2 text-xs text-charcoal-light">
            <Sparkles className="h-4 w-4 text-olive" /> Ouvre une recette publiée pour l'ajouter ou la retirer de la sélection
            bistronomique.
          </p>
        )}
      </div>
    </>
  )
}
