import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { DocumentIcon } from '../components/icons'
import { Navbar } from '../components/Navbar'
import { apiFetch, apiUpload, ApiError } from '../lib/api'
import {
  CATEGORIES,
  CATEGORY_LABEL,
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  type RecipeCategory,
  type RecipeDifficulty,
} from '../lib/recipeMeta'

interface Ingredient {
  name: string
  quantity: string
}

interface Step {
  description: string
}

interface CreatedRecipe {
  id: string
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export function ProposeRecipePage() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [prepTime, setPrepTime] = useState(30)
  const [category, setCategory] = useState<RecipeCategory>('PLAT')
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>('FACILE')
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', quantity: '' }])
  const [steps, setSteps] = useState<Step[]>([{ description: '' }])
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)))
  }

  function updateStep(index: number, value: string) {
    setSteps((prev) => prev.map((step, i) => (i === index ? { description: value } : step)))
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      setImage(null)
      setImagePreview(null)
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('L\'image ne doit pas dépasser 5 Mo')
      return
    }

    setError(null)
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const cleanIngredients = ingredients.filter((i) => i.name.trim() && i.quantity.trim())
    const cleanSteps = steps.filter((s) => s.description.trim())

    if (cleanIngredients.length === 0) {
      setError('Ajoute au moins un ingrédient')
      return
    }
    if (cleanSteps.length === 0) {
      setError('Ajoute au moins une étape')
      return
    }

    setIsSubmitting(true)

    try {
      const recipe = await apiFetch<CreatedRecipe>('/recipes', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          prepTime,
          category,
          difficulty,
          ingredients: cleanIngredients,
          steps: cleanSteps.map((s, index) => ({ order: index + 1, description: s.description })),
        }),
      })

      if (image) {
        const formData = new FormData()
        formData.append('image', image)
        await apiUpload(`/recipes/${recipe.id}/image`, formData)
      }

      navigate('/profile')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer la recette")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-10">
        <DocumentIcon className="h-8 w-8 text-brigade-red" />
        <h1 className="mt-2 font-heading text-4xl tracking-wide text-charcoal">
          Proposer une recette
        </h1>
        <p className="mt-1 text-sm text-charcoal-light">
          Ta recette sera examinée par l'équipe du chef avant d'être mise en avant.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
            <label className="flex flex-col gap-1 text-sm text-charcoal-light">
              Titre de la recette
              <input
                type="text"
                required
                minLength={3}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border border-charcoal/20 px-3 py-2 outline-none focus:border-brigade-red"
              />
            </label>

            <label className="mt-4 flex flex-col gap-1 text-sm text-charcoal-light">
              Description
              <textarea
                required
                minLength={10}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg border border-charcoal/20 px-3 py-2 outline-none focus:border-brigade-red"
              />
            </label>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm text-charcoal-light">
                Temps de préparation (min)
                <input
                  type="number"
                  required
                  min={1}
                  max={600}
                  value={prepTime}
                  onChange={(e) => setPrepTime(Number(e.target.value))}
                  className="rounded-lg border border-charcoal/20 px-3 py-2 outline-none focus:border-brigade-red"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-charcoal-light">
                Catégorie
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RecipeCategory)}
                  className="rounded-lg border border-charcoal/20 bg-white px-3 py-2 outline-none focus:border-brigade-red"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-charcoal-light">
                Difficulté
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as RecipeDifficulty)}
                  className="rounded-lg border border-charcoal/20 bg-white px-3 py-2 outline-none focus:border-brigade-red"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {DIFFICULTY_LABEL[d]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 flex flex-col gap-1 text-sm text-charcoal-light">
              Photo du plat
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="text-sm"
              />
            </label>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Aperçu"
                className="mt-3 h-40 w-full rounded-lg object-cover"
              />
            )}
          </div>

          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl tracking-wide text-charcoal">Ingrédients</h2>
              <button
                type="button"
                onClick={() => setIngredients((prev) => [...prev, { name: '', quantity: '' }])}
                className="text-sm font-medium text-brigade-red hover:underline"
              >
                + Ajouter
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ingrédient (ex: farine)"
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    className="flex-1 rounded-lg border border-charcoal/20 px-3 py-2 text-sm outline-none focus:border-brigade-red"
                  />
                  <input
                    type="text"
                    placeholder="Quantité (ex: 200g)"
                    value={ingredient.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    className="w-32 rounded-lg border border-charcoal/20 px-3 py-2 text-sm outline-none focus:border-brigade-red"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== index))}
                      className="px-2 text-charcoal-light hover:text-brigade-red"
                      aria-label="Supprimer l'ingrédient"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl tracking-wide text-charcoal">
                Étapes de préparation
              </h2>
              <button
                type="button"
                onClick={() => setSteps((prev) => [...prev, { description: '' }])}
                className="text-sm font-medium text-brigade-red hover:underline"
              >
                + Ajouter
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="mt-2 text-sm font-medium text-charcoal-light">{index + 1}.</span>
                  <textarea
                    rows={2}
                    placeholder="Décris cette étape"
                    value={step.description}
                    onChange={(e) => updateStep(index, e.target.value)}
                    className="flex-1 rounded-lg border border-charcoal/20 px-3 py-2 text-sm outline-none focus:border-brigade-red"
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSteps((prev) => prev.filter((_, i) => i !== index))}
                      className="mt-2 px-2 text-charcoal-light hover:text-brigade-red"
                      aria-label="Supprimer l'étape"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-brigade-red">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-brigade-red px-6 py-3 font-medium text-white transition hover:bg-brigade-red-dark disabled:opacity-50"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer la recette'}
          </button>
        </form>
      </main>
    </div>
  )
}
