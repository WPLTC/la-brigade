import {
  ArrowDown,
  ArrowUp,
  CakeSlice,
  Camera,
  Check,
  ChefHat,
  CircleAlert,
  CookingPot,
  Plus,
  Salad,
  Send,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RecipeCard } from '../components/RecipeCard'
import { EmptyState, PageLoader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api, errorMessage } from '../lib/api'
import type { Category, Difficulty, RecipeCardData, RecipeDetail } from '../lib/types'

interface FormIngredient {
  key: string
  name: string
  quantity: string
}

interface FormStep {
  key: string
  description: string
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

let keySeed = 0
const newKey = () => `row-${++keySeed}`
const emptyIngredient = (): FormIngredient => ({ key: newKey(), name: '', quantity: '' })
const emptyStep = (): FormStep => ({ key: newKey(), description: '' })

const CATEGORY_OPTIONS: { value: Category; label: string; icon: LucideIcon }[] = [
  { value: 'ENTREE', label: 'Entrée', icon: Salad },
  { value: 'PLAT', label: 'Plat', icon: CookingPot },
  { value: 'DESSERT', label: 'Dessert', icon: CakeSlice },
]

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'FACILE', label: 'Facile' },
  { value: 'MOYEN', label: 'Moyen' },
  { value: 'DIFFICILE', label: 'Difficile' },
]

const CRITERIA = [
  'Des quantités précises pour chaque ingrédient',
  'Des étapes claires, dans le bon ordre',
  'Un temps de préparation et de cuisson réaliste',
  'Une touche créative, accessible à la maison',
  'Une photo appétissante du plat terminé',
]

function move<T>(list: T[], index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

const toInt = (value: string) => Math.max(0, Math.round(Number(value) || 0))

function FormSection({ number, title, action, children }: { number: number; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-lg font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-charcoal font-heading text-cream">{number}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

interface SegmentedProps<T extends string> {
  label: string
  options: { value: T; label: string; icon?: LucideIcon }[]
  value: T | ''
  onChange: (value: T) => void
}

function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2">
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => {
        const active = value === optionValue
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(optionValue)}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 transition ${
              active ? 'bg-charcoal text-cream ring-charcoal' : 'bg-white text-charcoal-light ring-charcoal/15 hover:ring-charcoal/40'
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {optionLabel}
          </button>
        )
      })}
    </div>
  )
}

export function ProposeRecipePage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  useDocumentTitle(isEdit ? 'Modifier ma recette' : 'Proposer une recette')

  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [previousReview, setPreviousReview] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')
  const [prepTime, setPrepTime] = useState('15')
  const [cookTime, setCookTime] = useState('20')
  const [servings, setServings] = useState('4')
  const [ingredients, setIngredients] = useState<FormIngredient[]>(() => [emptyIngredient(), emptyIngredient(), emptyIngredient()])
  const [steps, setSteps] = useState<FormStep[]>(() => [emptyStep(), emptyStep()])

  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    api
      .get<RecipeDetail>(`/recipes/${id}`)
      .then((recipe) => {
        if (!recipe.permissions.canEdit) {
          setLoadError(
            recipe.status === 'VALIDATED'
              ? 'Cette recette est déjà validée par la brigade : elle ne peut plus être modifiée.'
              : 'Tu ne peux modifier que tes propres recettes.',
          )
          return
        }
        setTitle(recipe.title)
        setDescription(recipe.description)
        setCategory(recipe.category)
        setDifficulty(recipe.difficulty)
        setPrepTime(String(recipe.prepTime))
        setCookTime(String(recipe.cookTime))
        setServings(String(recipe.servings))
        setIngredients(recipe.ingredients.map((ingredient) => ({ key: newKey(), name: ingredient.name, quantity: ingredient.quantity })))
        setSteps(recipe.steps.map((step) => ({ key: newKey(), description: step.description })))
        setExistingImage(recipe.imageUrl)
        setPreviousReview(recipe.reviewNote)
      })
      .catch((err) => setLoadError(errorMessage(err, 'Recette introuvable')))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const cleanIngredients = ingredients.filter((ingredient) => ingredient.name.trim())
  const cleanSteps = steps.filter((step) => step.description.trim())

  const preview = useMemo<RecipeCardData>(
    () => ({
      id: 'apercu',
      title: title.trim() || 'Le nom de ta recette',
      description,
      imageUrl: imagePreview ?? existingImage,
      category: category || 'PLAT',
      difficulty: difficulty || 'MOYEN',
      prepTime: toInt(prepTime),
      cookTime: toInt(cookTime),
      totalTime: toInt(prepTime) + toInt(cookTime),
      servings: toInt(servings),
      status: 'PENDING',
      isBistronomic: false,
      averageRating: 0,
      ratingsCount: 0,
      createdAt: new Date().toISOString(),
      author: { id: user?.id ?? '', name: user?.name ?? 'Toi', role: 'USER' },
      chefPicks: [],
      _count: { comments: 0, favorites: 0 },
    }),
    [title, description, imagePreview, existingImage, category, difficulty, prepTime, cookTime, servings, user],
  )

  function selectImage(file?: File | null) {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Format non supporté : utilise une image JPEG, PNG ou WebP')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("L'image ne doit pas dépasser 5 Mo")
      return
    }
    setError(null)
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function validate() {
    if (title.trim().length < 3) return 'Le titre doit contenir au moins 3 caractères'
    if (description.trim().length < 10) return 'La description doit contenir au moins 10 caractères'
    if (!category) return 'Choisis une catégorie'
    if (!difficulty) return 'Choisis une difficulté'
    if (toInt(servings) < 1) return 'La recette doit servir au moins 1 personne'
    if (cleanIngredients.length === 0) return 'Ajoute au moins un ingrédient'
    if (cleanSteps.length === 0) return 'Ajoute au moins une étape'
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setSubmitting(true)

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      prepTime: toInt(prepTime),
      cookTime: toInt(cookTime),
      servings: toInt(servings),
      ingredients: cleanIngredients.map(({ name, quantity }) => ({ name: name.trim(), quantity: quantity.trim() })),
      steps: cleanSteps.map(({ description: text }) => ({ description: text.trim() })),
    }

    try {
      const saved = isEdit
        ? await api.put<{ id: string }>(`/recipes/${id}`, payload)
        : await api.post<{ id: string }>('/recipes', payload)

      if (image) {
        const formData = new FormData()
        formData.append('image', image)
        try {
          await api.upload(`/recipes/${saved.id}/image`, formData)
        } catch (err) {
          toast.error(`Recette enregistrée, mais la photo n'a pas pu être envoyée : ${errorMessage(err)}`)
        }
      }

      toast.success(isEdit ? 'Recette mise à jour et renvoyée à la brigade' : 'Recette envoyée à la brigade, merci !')
      navigate(`/recipes/${saved.id}`)
    } catch (err) {
      setError(errorMessage(err, "Impossible d'enregistrer la recette"))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoader />

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <EmptyState
          icon={CircleAlert}
          title="Modification impossible"
          text={loadError}
          action={
            <Link to="/profile" className="btn btn-primary">
              Retour à mon profil
            </Link>
          }
        />
      </div>
    )
  }

  const shownImage = imagePreview ?? existingImage

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="eyebrow">{isEdit ? 'Modification' : 'Nouvelle recette'}</p>
      <h1 className="mt-2 font-heading text-5xl uppercase">{isEdit ? 'Modifier ma recette' : 'Proposer une recette'}</h1>
      <p className="mt-2 max-w-2xl text-charcoal-light">
        Ta recette sera testée en cuisine par la brigade du chef avant d'être publiée. Sois précis : quantités, temps et
        gestes clés font toute la différence.
      </p>

      {previousReview && (
        <p className="mt-6 flex gap-3 rounded-2xl bg-gold/15 p-4 text-sm ring-1 ring-gold/30">
          <ChefHat className="h-5 w-5 shrink-0 text-gold-dark" />
          <span>
            <strong>Retour de la brigade :</strong> {previousReview}
          </span>
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <FormSection number={1} title="L'essentiel">
            <div className="space-y-5">
              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="title" className="label">
                    Nom de la recette
                  </label>
                  <span className="text-xs text-charcoal-light">{title.length}/120</span>
                </div>
                <input
                  id="title"
                  type="text"
                  maxLength={120}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex : Risotto crémeux aux cèpes"
                  className="input"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="description" className="label">
                    Description
                  </label>
                  <span className="text-xs text-charcoal-light">{description.length}/2000</span>
                </div>
                <textarea
                  id="description"
                  rows={4}
                  maxLength={2000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Qu'est-ce qui rend ce plat unique ? Son histoire, sa touche bistronomique…"
                  className="input"
                />
              </div>

              <div>
                <span className="label">Catégorie</span>
                <Segmented label="Catégorie" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
              </div>

              <div>
                <span className="label">Difficulté</span>
                <Segmented label="Difficulté" options={DIFFICULTY_OPTIONS} value={difficulty} onChange={setDifficulty} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    ['prep', 'Préparation', prepTime, setPrepTime, 'min'],
                    ['cook', 'Cuisson', cookTime, setCookTime, 'min'],
                    ['servings', 'Portions', servings, setServings, 'pers.'],
                  ] as const
                ).map(([key, label, value, setter, unit]) => (
                  <div key={key}>
                    <label htmlFor={key} className="label">
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        id={key}
                        type="number"
                        inputMode="numeric"
                        min={key === 'servings' ? 1 : 0}
                        max={key === 'servings' ? 50 : 1440}
                        value={value}
                        onChange={(event) => setter(event.target.value)}
                        className="input pr-12"
                      />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-charcoal-light">
                        {unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FormSection>

          <FormSection number={2} title="La photo du plat">
            <label
              onDragOver={(event) => {
                event.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragOver(false)
                selectImage(event.dataTransfer.files?.[0])
              }}
              className={`relative flex aspect-[16/9] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition ${
                dragOver ? 'border-brigade-red bg-brigade-red/5' : 'border-charcoal/15 bg-cream hover:border-charcoal/30'
              }`}
            >
              <input
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                className="sr-only"
                onChange={(event) => selectImage(event.target.files?.[0])}
              />
              {shownImage ? (
                <>
                  <img src={shownImage} alt="Aperçu du plat" className="absolute inset-0 h-full w-full object-cover" />
                  <span className="btn btn-secondary btn-sm absolute right-3 bottom-3">
                    <Camera /> Changer la photo
                  </span>
                </>
              ) : (
                <>
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white shadow-sm">
                    <Camera className="h-6 w-6 text-brigade-red" />
                  </span>
                  <span className="mt-3 px-4 font-semibold">Glisse ta photo ici ou clique pour la choisir</span>
                  <span className="mt-1 text-xs text-charcoal-light">JPEG, PNG ou WebP · 5 Mo max · format paysage conseillé</span>
                </>
              )}
            </label>
          </FormSection>

          <FormSection
            number={3}
            title="Ingrédients"
            action={
              <button
                type="button"
                onClick={() => setIngredients((list) => [...list, emptyIngredient()])}
                className="btn btn-secondary btn-sm"
              >
                <Plus /> Ajouter
              </button>
            }
          >
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <div key={ingredient.key} className="flex items-center gap-2">
                  <span className="hidden w-5 text-center text-xs font-semibold text-charcoal-light sm:block">{index + 1}</span>
                  <input
                    type="text"
                    value={ingredient.name}
                    aria-label={`Ingrédient ${index + 1}`}
                    placeholder="Ingrédient (ex : riz arborio)"
                    onChange={(event) =>
                      setIngredients((list) =>
                        list.map((item) => (item.key === ingredient.key ? { ...item, name: event.target.value } : item)),
                      )
                    }
                    className="input min-w-0 flex-1"
                  />
                  <input
                    type="text"
                    value={ingredient.quantity}
                    aria-label={`Quantité de l'ingrédient ${index + 1}`}
                    placeholder="Quantité"
                    maxLength={50}
                    onChange={(event) =>
                      setIngredients((list) =>
                        list.map((item) => (item.key === ingredient.key ? { ...item, quantity: event.target.value } : item)),
                      )
                    }
                    className="input w-24 sm:w-36"
                  />
                  <div className="hidden sm:flex">
                    <button
                      type="button"
                      onClick={() => setIngredients((list) => move(list, index, -1))}
                      disabled={index === 0}
                      aria-label="Monter l'ingrédient"
                      className="rounded-full p-2 text-charcoal-light hover:bg-charcoal/5 disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIngredients((list) => move(list, index, 1))}
                      disabled={index === ingredients.length - 1}
                      aria-label="Descendre l'ingrédient"
                      className="rounded-full p-2 text-charcoal-light hover:bg-charcoal/5 disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIngredients((list) => list.filter((item) => item.key !== ingredient.key))}
                    disabled={ingredients.length === 1}
                    aria-label="Supprimer l'ingrédient"
                    className="rounded-full p-2 text-charcoal-light hover:bg-brigade-red/10 hover:text-brigade-red disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </FormSection>

          <FormSection
            number={4}
            title="Étapes de préparation"
            action={
              <button type="button" onClick={() => setSteps((list) => [...list, emptyStep()])} className="btn btn-secondary btn-sm">
                <Plus /> Ajouter
              </button>
            }
          >
            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li key={step.key} className="flex items-start gap-3">
                  <span className="mt-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brigade-red font-heading text-white">
                    {index + 1}
                  </span>
                  <textarea
                    rows={2}
                    value={step.description}
                    aria-label={`Étape ${index + 1}`}
                    placeholder={index === 0 ? 'Ex : Faire suer l’échalote ciselée dans le beurre…' : 'Décris cette étape'}
                    onChange={(event) =>
                      setSteps((list) =>
                        list.map((item) => (item.key === step.key ? { ...item, description: event.target.value } : item)),
                      )
                    }
                    className="input flex-1"
                  />
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => setSteps((list) => move(list, index, -1))}
                      disabled={index === 0}
                      aria-label="Monter l'étape"
                      className="rounded-full p-1.5 text-charcoal-light hover:bg-charcoal/5 disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSteps((list) => list.filter((item) => item.key !== step.key))}
                      disabled={steps.length === 1}
                      aria-label="Supprimer l'étape"
                      className="rounded-full p-1.5 text-charcoal-light hover:bg-brigade-red/10 hover:text-brigade-red disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </FormSection>

          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-2xl bg-brigade-red/10 p-4 text-sm font-medium text-brigade-red">
              <CircleAlert className="h-5 w-5 shrink-0" /> {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={submitting} className="btn btn-primary px-7 py-3 text-base">
              <Send />
              {submitting ? 'Envoi en cours…' : isEdit ? 'Renvoyer à la brigade' : 'Envoyer à la brigade'}
            </button>
            <Link to={isEdit ? `/recipes/${id}` : '/recipes'} className="btn btn-ghost">
              Annuler
            </Link>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm font-semibold text-charcoal-light">Aperçu de ta carte</p>
          <RecipeCard recipe={preview} linkDisabled />
          <div className="card p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <ChefHat className="h-5 w-5 text-brigade-red" /> Ce que la brigade regarde
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-charcoal-light">
              {CRITERIA.map((criterion) => (
                <li key={criterion} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
                  {criterion}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </form>
    </div>
  )
}
