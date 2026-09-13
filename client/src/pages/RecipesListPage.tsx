import { CakeSlice, CookingPot, Salad, Search, SearchX, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RecipeCard } from '../components/RecipeCard'
import { EmptyState, Pagination, RecipeGridSkeleton } from '../components/ui'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api, errorMessage } from '../lib/api'
import { plural } from '../lib/format'
import type { Paginated, RecipeCardData } from '../lib/types'

const CATEGORIES = [
  { value: '', label: 'Toutes', icon: null },
  { value: 'ENTREE', label: 'Entrées', icon: Salad },
  { value: 'PLAT', label: 'Plats', icon: CookingPot },
  { value: 'DESSERT', label: 'Desserts', icon: CakeSlice },
]

const DIFFICULTIES = [
  { value: '', label: 'Toutes difficultés' },
  { value: 'FACILE', label: 'Facile' },
  { value: 'MOYEN', label: 'Moyen' },
  { value: 'DIFFICILE', label: 'Difficile' },
]

const TIMES = [
  { value: '', label: 'Toutes durées' },
  { value: '30', label: '30 min max' },
  { value: '60', label: '1 h max' },
  { value: '120', label: '2 h max' },
]

const SORTS = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'rating', label: 'Mieux notées' },
  { value: 'popular', label: 'Plus aimées' },
  { value: 'quick', label: 'Plus rapides' },
]

const FILTER_KEYS = ['search', 'category', 'difficulty', 'maxTime', 'bistronomic', 'sort']

export function RecipesListPage() {
  useDocumentTitle('Recettes')
  // L'URL est la source de vérité des filtres : une recherche peut être partagée ou mise en favori
  const [params, setParams] = useSearchParams()
  const urlSearch = params.get('search') ?? ''
  const [searchInput, setSearchInput] = useState(urlSearch)
  const lastPushedSearch = useRef(urlSearch)

  const [result, setResult] = useState<Paginated<RecipeCardData> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setParam = useCallback(
    (key: string, value: string | null) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          if (value) next.set(key, value)
          else next.delete(key)
          if (key !== 'page') next.delete('page')
          return next
        },
        { replace: key === 'search' },
      )
    },
    [setParams],
  )

  // Recherche "au fil de la frappe", avec un léger délai
  useEffect(() => {
    const value = searchInput.trim()
    if (value === urlSearch) return
    const timer = setTimeout(() => {
      lastPushedSearch.current = value
      setParam('search', value || null)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput, urlSearch, setParam])

  // Si la recherche change depuis l'extérieur (lien, bouton retour), on met le champ à jour
  useEffect(() => {
    if (urlSearch !== lastPushedSearch.current) {
      lastPushedSearch.current = urlSearch
      setSearchInput(urlSearch)
    }
  }, [urlSearch])

  const query = params.toString()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .get<Paginated<RecipeCardData>>(`/recipes?pageSize=12${query ? `&${query}` : ''}`)
      .then((data) => {
        if (cancelled) return
        setResult(data)
        setError(null)
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Impossible de charger les recettes')))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [query])

  const category = params.get('category') ?? ''
  const bistronomic = params.get('bistronomic') === 'true'
  const hasFilters = FILTER_KEYS.some((key) => params.has(key))

  function resetFilters() {
    lastPushedSearch.current = ''
    setSearchInput('')
    setParams(new URLSearchParams())
  }

  function changePage(page: number) {
    setParam('page', page > 1 ? String(page) : null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <section className="border-b border-charcoal/10 bg-cream-dark/50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="eyebrow">Le carnet de la brigade</p>
          <h1 className="mt-2 font-heading text-5xl uppercase sm:text-6xl">Les recettes</h1>
          <p className="mt-2 max-w-xl text-charcoal-light">
            Toutes les recettes publiées ont été testées en cuisine et validées par l'équipe du chef.
          </p>
          <div className="relative mt-8 max-w-2xl">
            <Search className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-charcoal-light" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Rechercher par nom de plat ou ingrédient…"
              aria-label="Rechercher une recette"
              className="input rounded-full py-4 pl-13 text-base shadow-sm"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Catégorie">
            {CATEGORIES.map(({ value, label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                aria-pressed={category === value}
                onClick={() => setParam('category', value || null)}
                className={`chip ${category === value ? 'chip-active' : ''}`}
              >
                {Icon && <Icon />}
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Difficulté"
              value={params.get('difficulty') ?? ''}
              onChange={(event) => setParam('difficulty', event.target.value || null)}
              className="input w-auto rounded-full py-2"
            >
              {DIFFICULTIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Durée totale"
              value={params.get('maxTime') ?? ''}
              onChange={(event) => setParam('maxTime', event.target.value || null)}
              className="input w-auto rounded-full py-2"
            >
              {TIMES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-pressed={bistronomic}
              onClick={() => setParam('bistronomic', bistronomic ? null : 'true')}
              className={`chip ${bistronomic ? 'bg-olive text-white ring-olive hover:text-white hover:ring-olive' : ''}`}
            >
              <Sparkles /> Bistronomiques
            </button>
            <select
              aria-label="Trier par"
              value={params.get('sort') ?? 'recent'}
              onChange={(event) => setParam('sort', event.target.value === 'recent' ? null : event.target.value)}
              className="input w-auto rounded-full py-2 font-semibold"
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex min-h-6 items-center justify-between text-sm text-charcoal-light">
          <p aria-live="polite">{result && !loading ? plural(result.total, 'recette trouvée', 'recettes trouvées') : ''}</p>
          {hasFilters && (
            <button type="button" onClick={resetFilters} className="font-semibold text-brigade-red hover:underline">
              Réinitialiser les filtres
            </button>
          )}
        </div>

        <div className="mt-4">
          {error ? (
            <p className="rounded-2xl bg-brigade-red/10 p-4 text-sm text-brigade-red">{error}</p>
          ) : loading && !result ? (
            <RecipeGridSkeleton />
          ) : result && result.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Aucune recette ne correspond"
              text="Essaie d'élargir ta recherche ou de retirer quelques filtres."
              action={
                <button type="button" onClick={resetFilters} className="btn btn-secondary">
                  Voir toutes les recettes
                </button>
              }
            />
          ) : (
            <div
              className={`grid grid-cols-1 gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-50' : ''}`}
            >
              {result?.items.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>

        {result && <Pagination page={result.page} totalPages={result.totalPages} onChange={changePage} />}
      </div>
    </>
  )
}
