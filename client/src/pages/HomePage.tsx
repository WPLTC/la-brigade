import {
  ArrowRight,
  BadgeCheck,
  CakeSlice,
  CookingPot,
  FlaskConical,
  Heart,
  MessageCircle,
  Quote,
  Salad,
  Search,
  Send,
  Sparkles,
  Star,
  Timer,
  Trophy,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RecipeCard } from '../components/RecipeCard'
import { RecipeGridSkeleton, RecipeImage, SectionHeading, Stars } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../lib/api'
import { formatMonth, plural } from '../lib/format'
import type { HomeData } from '../lib/types'

const CATEGORY_TILES = [
  { category: 'ENTREE', label: 'Entrées', icon: Salad, tone: 'bg-olive/10 text-olive' },
  { category: 'PLAT', label: 'Plats', icon: CookingPot, tone: 'bg-brigade-red/10 text-brigade-red' },
  { category: 'DESSERT', label: 'Desserts', icon: CakeSlice, tone: 'bg-gold/15 text-gold-dark' },
] as const

const QUICK_FILTERS = [
  { label: 'Moins de 30 min', to: '/recipes?maxTime=30', icon: Timer },
  { label: 'Sélection bistronomique', to: '/recipes?bistronomic=true', icon: Sparkles },
  { label: 'Les mieux notées', to: '/recipes?sort=rating', icon: Star },
]

const STEPS = [
  { icon: Send, title: 'Vous proposez', text: 'Ingrédients, étapes, une belle photo : partagez votre création.' },
  { icon: FlaskConical, title: 'La brigade teste', text: "L'équipe du chef réalise la recette en cuisine et vous fait un retour." },
  { icon: BadgeCheck, title: 'La communauté savoure', text: 'Validée, elle est publiée : chacun peut la noter, la commenter, la garder.' },
  { icon: Trophy, title: 'Le chef goûte', text: 'Chaque mois, le chef teste la recette la plus populaire et livre son verdict.' },
]

export function HomePage() {
  useDocumentTitle()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [data, setData] = useState<HomeData | null>(null)
  const [failed, setFailed] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get<HomeData>('/home').then(setData).catch(() => setFailed(true))
  }, [])

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    const query = search.trim()
    navigate(query ? `/recipes?search=${encodeURIComponent(query)}` : '/recipes')
  }

  const pick = data?.chefPick

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-10 pb-20 md:grid-cols-[1.1fr_1fr] md:items-center md:pt-16">
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold tracking-wider text-olive uppercase shadow-sm ring-1 ring-charcoal/5">
              <BadgeCheck className="h-4 w-4" /> Recettes testées par la brigade
            </p>
            <h1 className="mt-6 font-heading text-5xl leading-[0.95] uppercase sm:text-7xl">
              La cuisine <span className="text-brigade-red">bistronomique</span>, par et pour les passionnés
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-charcoal-light">
              Proposez vos créations, l'équipe du chef les teste en cuisine et les meilleures sont mises à l'honneur.
              Chaque mois, le chef goûte la recette préférée de la communauté.
            </p>

            <form
              onSubmit={handleSearch}
              role="search"
              className="mt-8 flex max-w-lg items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-lg ring-1 ring-charcoal/10 focus-within:ring-brigade-red"
            >
              <Search className="h-5 w-5 shrink-0 text-charcoal-light" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Un plat, un ingrédient… (ex : cèpes)"
                aria-label="Rechercher une recette"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
              />
              <button type="submit" className="btn btn-primary">
                Rechercher
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/recipes" className="btn btn-dark">
                Voir les recettes <ArrowRight />
              </Link>
              <Link to={isAuthenticated ? '/recipes/new' : '/register'} className="btn btn-secondary">
                Proposer ma recette
              </Link>
            </div>

            {data && (
              <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
                {[
                  [data.stats.recipes, 'recettes validées'],
                  [data.stats.bistronomic, 'bistronomiques'],
                  [data.stats.members, 'membres'],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dd className="font-heading text-4xl">{value}</dd>
                    <dt className="text-xs font-medium tracking-wide text-charcoal-light uppercase">{label}</dt>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="relative">
            <div className="absolute -top-6 -right-6 h-40 w-40 rounded-full bg-brigade-red/15 blur-2xl" />
            <img
              src="/images/hero-bistrot.jpg"
              alt="Une assiette dressée sur une table de bistrot"
              className="relative aspect-[4/5] w-full rounded-[2.5rem] object-cover shadow-2xl md:rotate-2"
            />
            {pick && (
              <Link
                to={`/recipes/${pick.recipe.id}`}
                className="absolute right-4 -bottom-8 left-4 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-charcoal/5 transition hover:-translate-y-1 sm:right-auto sm:-left-8 sm:w-80"
              >
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <RecipeImage src={pick.recipe.imageUrl} alt="" category={pick.recipe.category} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-brigade-red uppercase">
                    <Trophy className="h-3.5 w-3.5" /> Recette du mois
                  </span>
                  <span className="mt-0.5 block truncate font-semibold">{pick.recipe.title}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-charcoal-light">
                    <Stars value={pick.recipe.averageRating} size={12} /> {formatMonth(pick.month)}
                  </span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {failed && (
        <p className="mx-auto max-w-6xl px-4 text-sm text-brigade-red">
          Impossible de charger les recettes pour le moment. Vérifie que l'API est lancée.
        </p>
      )}

      {/* ---------- Recette du mois ---------- */}
      {pick && (
        <section className="bg-charcoal text-cream">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:items-center">
            <Link to={`/recipes/${pick.recipe.id}`} className="group relative block overflow-hidden rounded-[2rem]">
              <div className="aspect-[4/3]">
                <RecipeImage
                  src={pick.recipe.imageUrl}
                  alt={pick.recipe.title}
                  category={pick.recipe.category}
                  className="transition duration-700 group-hover:scale-105"
                />
              </div>
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-brigade-red px-3 py-1.5 text-xs font-bold tracking-wider uppercase">
                <Trophy className="h-4 w-4" /> {formatMonth(pick.month)}
              </span>
            </Link>
            <div>
              <p className="eyebrow text-cream/60">Le chef a testé pour vous</p>
              <h2 className="mt-3 font-heading text-4xl leading-none uppercase sm:text-5xl">{pick.recipe.title}</h2>
              <p className="mt-2 text-sm text-cream/60">Proposée par {pick.recipe.author.name}</p>
              <blockquote className="relative mt-8 border-l-2 border-brigade-red pl-6">
                <Quote className="absolute -top-2 -left-3 h-6 w-6 rotate-180 bg-charcoal text-brigade-red" />
                <p className="font-serif text-xl leading-relaxed italic sm:text-2xl">{pick.verdict}</p>
                <footer className="mt-4 text-sm font-semibold text-cream/80">— {pick.chef.name}</footer>
              </blockquote>
              <Link to={`/recipes/${pick.recipe.id}`} className="btn btn-primary mt-8">
                Découvrir la recette <ArrowRight />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ---------- À la une ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <SectionHeading
          eyebrow="Sélection de la brigade"
          title="Recettes à la une"
          action={
            <Link to="/recipes?bistronomic=true" className="btn btn-secondary">
              Toute la sélection <ArrowRight />
            </Link>
          }
        />
        <div className="mt-8">
          {data ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.featured.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            !failed && <RecipeGridSkeleton count={3} />
          )}
        </div>
      </section>

      {/* ---------- Concept + recherche rapide ---------- */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pt-20 lg:grid-cols-[1.3fr_1fr]">
        <div className="card overflow-hidden p-8">
          <p className="eyebrow">Découvrez le concept</p>
          <h2 className="mt-2 font-heading text-4xl leading-none uppercase">De votre cuisine à la brigade</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="flex gap-4">
                <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cream">
                  <Icon className="h-5 w-5 text-brigade-red" />
                  <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-charcoal font-heading text-xs text-cream">
                    {index + 1}
                  </span>
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="mt-1 block text-sm text-charcoal-light">{text}</span>
                </span>
              </li>
            ))}
          </ol>
          <Link to="/concept" className="btn btn-secondary mt-8">
            En savoir plus <ArrowRight />
          </Link>
        </div>

        <div className="card p-8">
          <p className="eyebrow">Recherche rapide</p>
          <h2 className="mt-2 font-heading text-4xl leading-none uppercase">Envie de…</h2>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {CATEGORY_TILES.map(({ category, label, icon: Icon, tone }) => (
              <Link
                key={category}
                to={`/recipes?category=${category}`}
                className="group flex flex-col items-center gap-2 rounded-2xl bg-cream p-4 text-center transition hover:-translate-y-1 hover:shadow-md"
              >
                <span className={`grid h-12 w-12 place-items-center rounded-full ${tone}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="font-semibold group-hover:text-brigade-red">{label}</span>
                {data && <span className="text-xs text-charcoal-light">{plural(data.categories[category], 'recette')}</span>}
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {QUICK_FILTERS.map(({ label, to, icon: Icon }) => (
              <Link key={label} to={to} className="chip">
                <Icon /> {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Course à la recette du mois ---------- */}
      {data && data.monthlyRace.ranking.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20">
          <SectionHeading eyebrow={`En direct · ${formatMonth(data.monthlyRace.month)}`} title="La course à la recette du mois" />
          <p className="mt-3 max-w-2xl text-charcoal-light">
            Chaque favori rapporte 3 points, chaque note 2 points et chaque commentaire 1 point. En fin de mois, le chef teste
            la recette en tête.
          </p>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {data.monthlyRace.ranking.map((entry, index) => (
              <li key={entry.recipe.id}>
                <Link
                  to={`/recipes/${entry.recipe.id}`}
                  className={`group flex h-full items-center gap-4 rounded-3xl p-4 ring-1 transition hover:-translate-y-1 hover:shadow-lg ${
                    index === 0 ? 'bg-charcoal text-cream ring-charcoal' : 'bg-white ring-charcoal/5'
                  }`}
                >
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-full font-heading text-2xl ${
                      index === 0 ? 'bg-gold text-charcoal' : 'bg-cream text-charcoal'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                    <RecipeImage src={entry.recipe.imageUrl} alt="" category={entry.recipe.category} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 leading-snug font-semibold">{entry.recipe.title}</span>
                    <span className={`mt-1 flex gap-3 text-xs ${index === 0 ? 'text-cream/70' : 'text-charcoal-light'}`}>
                      <span className="inline-flex items-center gap-1" aria-label="favoris">
                        <Heart className="h-3 w-3" /> {entry.favorites}
                      </span>
                      <span className="inline-flex items-center gap-1" aria-label="notes">
                        <Star className="h-3 w-3" /> {entry.ratings}
                      </span>
                      <span className="inline-flex items-center gap-1" aria-label="commentaires">
                        <MessageCircle className="h-3 w-3" /> {entry.comments}
                      </span>
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-heading text-3xl leading-none">{entry.score}</span>
                    <span className={`text-[10px] tracking-wider uppercase ${index === 0 ? 'text-cream/60' : 'text-charcoal-light'}`}>
                      pts
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ---------- Dernières recettes ---------- */}
      {data && data.latest.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20">
          <SectionHeading
            eyebrow="Fraîchement validées"
            title="Nouveautés"
            action={
              <Link to="/recipes" className="btn btn-secondary">
                Toutes les recettes <ArrowRight />
              </Link>
            }
          />
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.latest.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- Appel à contribution ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-brigade-red px-8 py-14 text-white sm:px-14">
          <div className="absolute -right-20 -bottom-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute top-8 right-24 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative max-w-2xl">
            <h2 className="font-heading text-4xl leading-none uppercase sm:text-6xl">Votre recette mérite la brigade</h2>
            <p className="mt-4 text-lg text-white/85">
              Partagez votre plat signature : s'il passe le test de la brigade, il rejoindra la sélection. Et qui sait, peut-être
              sera-t-il goûté par le chef le mois prochain.
            </p>
            <Link
              to={isAuthenticated ? '/recipes/new' : '/register'}
              className="btn mt-8 bg-white px-7 py-3 text-base text-brigade-red hover:bg-cream"
            >
              {isAuthenticated ? 'Proposer une recette' : 'Rejoindre la communauté'} <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
