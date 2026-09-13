import { ChefHat, Clock, Heart, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CATEGORY_LABEL, DIFFICULTY_LABEL, formatDuration } from '../lib/format'
import type { RecipeCardData } from '../lib/types'
import { BistroBadge, ChefPickBadge, RecipeImage } from './ui'

interface RecipeCardProps {
  recipe: RecipeCardData
  /** Pour l'aperçu dans le formulaire : la carte n'est pas cliquable */
  linkDisabled?: boolean
}

export function RecipeCard({ recipe, linkDisabled = false }: RecipeCardProps) {
  const content = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-dark">
        <RecipeImage
          src={recipe.imageUrl}
          alt={recipe.title}
          category={recipe.category}
          className="transition duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {recipe.chefPicks.length > 0 && <ChefPickBadge />}
          {recipe.isBistronomic && <BistroBadge />}
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-charcoal backdrop-blur">
          {CATEGORY_LABEL[recipe.category]}
        </span>
        {recipe._count.favorites > 0 && (
          <span
            className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold backdrop-blur"
            aria-label={`${recipe._count.favorites} favoris`}
          >
            <Heart className="h-3.5 w-3.5 fill-brigade-red text-brigade-red" />
            {recipe._count.favorites}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-lg leading-snug font-semibold text-charcoal transition group-hover:text-brigade-red">
          {recipe.title}
        </h3>
        <p className="mt-1 text-sm text-charcoal-light">par {recipe.author.name}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-charcoal-light">
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(recipe.totalTime)}
            </span>
            <span className="inline-flex items-center gap-1">
              <ChefHat className="h-3.5 w-3.5" />
              {DIFFICULTY_LABEL[recipe.difficulty]}
            </span>
          </span>
          {recipe.ratingsCount > 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold text-charcoal">
              <Star className="h-3.5 w-3.5 text-gold" fill="currentColor" strokeWidth={0} />
              {recipe.averageRating.toFixed(1)}
              <span className="font-normal text-charcoal-light">({recipe.ratingsCount})</span>
            </span>
          ) : (
            <span>Nouvelle</span>
          )}
        </div>
      </div>
    </>
  )

  const className =
    'group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-charcoal/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl'

  return linkDisabled ? (
    <div className={className}>{content}</div>
  ) : (
    <Link to={`/recipes/${recipe.id}`} className={className}>
      {content}
    </Link>
  )
}
