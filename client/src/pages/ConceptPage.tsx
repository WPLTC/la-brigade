import { ArrowRight, Award, BadgeCheck, Check, FlaskConical, Send, Sparkles, Trophy, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RecipeCard } from '../components/RecipeCard'
import { SectionHeading } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../lib/api'
import { formatMonth } from '../lib/format'
import type { ChefPick } from '../lib/types'

const PILLARS = [
  { icon: Users, title: 'Accessible', text: 'Des produits que l’on trouve au marché et des techniques réalisables dans une cuisine familiale.' },
  { icon: Sparkles, title: 'Créative', text: 'Un accord inattendu, une cuisson maîtrisée, un dressage soigné : la petite touche qui surprend.' },
  { icon: Award, title: 'Inspirée de la gastronomie', text: 'L’exigence des grandes tables, sans le décorum. Le goût avant tout.' },
]

const JOURNEY = [
  { icon: Send, title: 'Proposition', status: 'En attente', text: 'Un membre publie sa recette avec ingrédients, étapes et photo. Elle reste privée.' },
  { icon: FlaskConical, title: 'Test en cuisine', status: 'Par la brigade', text: 'Un membre de l’équipe du chef réalise la recette et rédige un retour pour l’auteur.' },
  { icon: BadgeCheck, title: 'Publication', status: 'Validée ou refusée', text: 'Validée, elle est publiée (et peut rejoindre la sélection bistronomique). Refusée, l’auteur peut la corriger et la resoumettre.' },
  { icon: Trophy, title: 'Recette du mois', status: 'Par le chef', text: 'La recette la plus populaire du mois est goûtée par le chef, qui livre son verdict.' },
]

const CRITERIA = [
  'La recette est reproductible en suivant uniquement les étapes écrites',
  'Les quantités et les temps annoncés sont justes',
  'Le résultat est à la hauteur de la description et de la photo',
  'Elle apporte une idée, un geste ou un accord qui la rend singulière',
  'Les produits sont de saison et accessibles',
]

export function ConceptPage() {
  useDocumentTitle('Le concept')
  const { isAuthenticated } = useAuth()
  const [picks, setPicks] = useState<ChefPick[]>([])

  useEffect(() => {
    api.get<ChefPick[]>('/chef-picks').then(setPicks).catch(() => setPicks([]))
  }, [])

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-12 pb-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="eyebrow">Le concept</p>
          <h1 className="mt-3 font-heading text-5xl leading-[0.95] uppercase sm:text-6xl">
            Une brigade, une communauté, une exigence
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-charcoal-light">
            La Brigade est née d'une idée simple : les meilleures recettes ne sortent pas toujours des cuisines étoilées. Un
            célèbre chef a donc ouvert les portes de sa brigade à tous les passionnés, avec une promesse : chaque recette
            publiée a été testée en cuisine par son équipe.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/recipes" className="btn btn-dark">
              Voir les recettes <ArrowRight />
            </Link>
            <Link to={isAuthenticated ? '/recipes/new' : '/register'} className="btn btn-secondary">
              Proposer ma recette
            </Link>
          </div>
        </div>
        <img
          src="/images/brigade-cuisine.jpg"
          alt="Un membre de la brigade prépare des légumes"
          className="aspect-[4/5] w-full rounded-[2.5rem] object-cover shadow-2xl md:-rotate-2"
        />
      </section>

      <section className="bg-charcoal py-16 text-cream">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading eyebrow="Notre cuisine" title="La bistronomie, c'est quoi ?" inverted />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl bg-cream/5 p-6 ring-1 ring-cream/10">
                <Icon className="h-8 w-8 text-brigade-red" />
                <h3 className="mt-4 font-heading text-2xl uppercase">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20">
        <SectionHeading eyebrow="Le parcours d'une recette" title="De votre cuisine à la carte" />
        <ol className="relative mt-10 grid gap-6 md:grid-cols-4">
          <div className="absolute top-7 right-8 left-8 hidden h-0.5 bg-charcoal/10 md:block" aria-hidden="true" />
          {JOURNEY.map(({ icon: Icon, title, status, text }, index) => (
            <li key={title} className="relative">
              <span className="relative grid h-14 w-14 place-items-center rounded-full bg-brigade-red text-white shadow-lg ring-8 ring-cream">
                <Icon className="h-6 w-6" />
              </span>
              <p className="mt-4 text-xs font-bold tracking-wider text-charcoal-light uppercase">
                Étape {index + 1} · {status}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-charcoal-light">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-20 grid max-w-6xl gap-6 px-4 lg:grid-cols-2">
        <div className="card p-8">
          <p className="eyebrow">Nos critères</p>
          <h2 className="mt-2 font-heading text-4xl uppercase">Ce que teste la brigade</h2>
          <ul className="mt-6 space-y-3">
            {CRITERIA.map((criterion) => (
              <li key={criterion} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-olive text-white">
                  <Check className="h-4 w-4" />
                </span>
                {criterion}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-8">
          <p className="eyebrow">La recette du mois</p>
          <h2 className="mt-2 font-heading text-4xl uppercase">Le chef goûte pour vous</h2>
          <p className="mt-4 leading-relaxed text-charcoal-light">
            Chaque interaction compte : un favori rapporte <strong>3 points</strong>, une note <strong>2 points</strong> et un
            commentaire <strong>1 point</strong>. À la fin du mois, la recette qui a le plus fait réagir la communauté est cuisinée
            et dégustée par le chef en personne.
          </p>
          <p className="mt-4 leading-relaxed text-charcoal-light">
            Son verdict est publié sur la recette et sur la page d'accueil : la plus belle récompense pour son auteur.
          </p>
        </div>
      </section>

      <section id="recettes-du-mois" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-20">
        <SectionHeading eyebrow="Le palmarès" title="Les recettes du mois" />
        {picks.length === 0 ? (
          <p className="mt-6 text-charcoal-light">Le chef n'a pas encore désigné de recette du mois.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map((pick) => (
              <div key={pick.id} className="flex flex-col gap-3">
                <p className="flex items-center gap-2 text-sm font-bold tracking-wider text-brigade-red uppercase">
                  <Trophy className="h-4 w-4" /> {formatMonth(pick.month)}
                </p>
                <RecipeCard recipe={pick.recipe} />
                <p className="font-serif text-charcoal-light italic">« {pick.verdict} »</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
