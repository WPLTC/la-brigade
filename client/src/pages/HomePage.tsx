import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChatIcon, ChefHatIcon, DocumentIcon, PlateIcon, SearchIcon } from '../components/icons'
import { Navbar } from '../components/Navbar'
import { apiFetch } from '../lib/api'
import { CATEGORY_LABEL, DIFFICULTY_LABEL, DIFFICULTY_STYLE, type RecipeCategory, type RecipeDifficulty } from '../lib/recipeMeta'

interface Recipe {
  id: string
  title: string
  description: string
  imageUrl: string | null
  prepTime: number
  category: RecipeCategory
  difficulty: RecipeDifficulty
  createdAt: string
}

export function HomePage() {
  const [featured, setFeatured] = useState<Recipe[]>([])

  useEffect(() => {
    apiFetch<Recipe[]>('/recipes')
      .then((recipes) => setFeatured(recipes.slice(0, 3)))
      .catch(() => setFeatured([]))
  }, [])

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="overflow-hidden rounded-3xl border border-charcoal/10 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center sm:px-12">
            <ChefHatIcon className="h-14 w-14 text-charcoal" />
            <h1 className="font-heading text-4xl tracking-wide text-charcoal sm:text-5xl">
              Bienvenue sur La Brigade !
            </h1>
            <p className="max-w-lg text-charcoal-light">
              Découvrez des recettes bistronomiques validées par des chefs, partagez les
              vôtres et échangez avec une communauté de passionnés.
            </p>
            <Link
              to="/recipes"
              className="mt-2 rounded-full bg-brigade-red px-6 py-3 font-medium text-white transition hover:bg-brigade-red-dark"
            >
              Voir les recettes
            </Link>
          </div>
        </section>

        {featured.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl tracking-wide text-charcoal">
                Recettes à la une
              </h2>
              <Link to="/recipes" className="text-sm font-medium text-brigade-red hover:underline">
                Tout voir →
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {featured.map((recipe) => (
                <Link
                  key={recipe.id}
                  to={`/recipes/${recipe.id}`}
                  className="flex flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="flex h-32 items-center justify-center bg-cream-dark">
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <PlateIcon className="h-8 w-8 text-charcoal/30" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-cream-dark px-2 py-0.5 text-xs font-medium text-charcoal-light">
                        {CATEGORY_LABEL[recipe.category]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_STYLE[recipe.difficulty]}`}
                      >
                        {DIFFICULTY_LABEL[recipe.difficulty]}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg tracking-wide text-charcoal">
                      {recipe.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 text-center shadow-sm">
            <DocumentIcon className="mx-auto h-8 w-8 text-brigade-red" />
            <h3 className="mt-2 font-heading text-lg tracking-wide text-charcoal">Publier</h3>
            <p className="mt-1 text-sm text-charcoal-light">
              Propose tes propres recettes bistronomiques à la communauté.
            </p>
          </div>
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 text-center shadow-sm">
            <SearchIcon className="mx-auto h-8 w-8 text-brigade-red" />
            <h3 className="mt-2 font-heading text-lg tracking-wide text-charcoal">Découvrir</h3>
            <p className="mt-1 text-sm text-charcoal-light">
              Parcours des recettes validées par l'équipe du chef, filtrées à ton goût.
            </p>
          </div>
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 text-center shadow-sm">
            <ChatIcon className="mx-auto h-8 w-8 text-brigade-red" />
            <h3 className="mt-2 font-heading text-lg tracking-wide text-charcoal">Échanger</h3>
            <p className="mt-1 text-sm text-charcoal-light">
              Note et commente les recettes, partage tes conseils de préparation.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
