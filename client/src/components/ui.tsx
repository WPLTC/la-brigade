import {
  CakeSlice,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  CookingPot,
  Hourglass,
  LoaderCircle,
  Salad,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { initials, STATUS_LABEL } from '../lib/format'
import type { Category, RecipeStatus, Role } from '../lib/types'

/* ---------- Images ---------- */

const PLACEHOLDERS: Record<Category, { icon: LucideIcon; className: string }> = {
  ENTREE: { icon: Salad, className: 'from-olive/25 to-cream-dark' },
  PLAT: { icon: CookingPot, className: 'from-brigade-red/20 to-cream-dark' },
  DESSERT: { icon: CakeSlice, className: 'from-gold/30 to-cream-dark' },
}

interface RecipeImageProps {
  src: string | null
  alt: string
  category: Category
  className?: string
}

/** Photo de la recette, ou illustration par catégorie si absente/cassée */
export function RecipeImage({ src, alt, category, className = '' }: RecipeImageProps) {
  const [failed, setFailed] = useState(false)

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    )
  }

  const { icon: Icon, className: tone } = PLACEHOLDERS[category]
  return (
    <div role="img" aria-label={alt} className={`flex h-full w-full items-center justify-center bg-linear-to-br ${tone} ${className}`}>
      <Icon className="h-1/3 max-h-16 w-1/3 max-w-16 text-charcoal/25" strokeWidth={1.25} />
    </div>
  )
}

/* ---------- Avatars ---------- */

const AVATAR_TONES = [
  'bg-brigade-red text-white',
  'bg-olive text-white',
  'bg-navy text-white',
  'bg-gold text-charcoal',
  'bg-charcoal text-cream',
]

const AVATAR_SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
}

export function Avatar({ name, size = 'md' }: { name: string; size?: keyof typeof AVATAR_SIZES }) {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-bold ${AVATAR_SIZES[size]} ${AVATAR_TONES[hash % AVATAR_TONES.length]}`}
    >
      {initials(name)}
    </span>
  )
}

/* ---------- Étoiles ---------- */

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const percent = Math.max(0, Math.min(100, (value / 5) * 100))
  const row = (className: string) =>
    [0, 1, 2, 3, 4].map((index) => (
      <Star key={index} size={size} className={`shrink-0 ${className}`} fill="currentColor" strokeWidth={0} />
    ))

  return (
    <span className="relative inline-flex" role="img" aria-label={`Note : ${value.toFixed(1)} sur 5`}>
      <span className="flex text-charcoal/15">{row('')}</span>
      <span className="absolute inset-0 flex overflow-hidden text-gold" style={{ width: `${percent}%` }}>
        {row('')}
      </span>
    </span>
  )
}

interface StarInputProps {
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
}

export function StarInput({ value, onChange, disabled }: StarInputProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const shown = hovered ?? value ?? 0

  return (
    <div className="mt-2 flex" role="radiogroup" aria-label="Ta note" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
          disabled={disabled}
          onMouseEnter={() => setHovered(star)}
          onFocus={() => setHovered(star)}
          onBlur={() => setHovered(null)}
          onClick={() => onChange(star)}
          className="p-0.5 transition hover:scale-110 disabled:opacity-50"
        >
          <Star
            className={`h-8 w-8 ${star <= shown ? 'text-gold' : 'text-charcoal/20'}`}
            fill="currentColor"
            strokeWidth={0}
          />
        </button>
      ))}
    </div>
  )
}

/* ---------- Badges ---------- */

const badgeBase = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase'

export function BistroBadge() {
  return (
    <span className={`${badgeBase} bg-olive text-white shadow-sm`}>
      <Sparkles className="h-3 w-3" /> Bistronomique
    </span>
  )
}

export function ChefPickBadge() {
  return (
    <span className={`${badgeBase} bg-brigade-red text-white shadow-sm`}>
      <Trophy className="h-3 w-3" /> Recette du mois
    </span>
  )
}

const STATUS_STYLE: Record<RecipeStatus, { className: string; icon: LucideIcon }> = {
  PENDING: { className: 'bg-gold/20 text-gold-dark', icon: Hourglass },
  VALIDATED: { className: 'bg-olive/15 text-olive', icon: CircleCheck },
  REJECTED: { className: 'bg-brigade-red/10 text-brigade-red', icon: CircleX },
}

export function StatusBadge({ status }: { status: RecipeStatus }) {
  const { className, icon: Icon } = STATUS_STYLE[status]
  return (
    <span className={`${badgeBase} ${className}`}>
      <Icon className="h-3 w-3" /> {STATUS_LABEL[status]}
    </span>
  )
}

export function RoleBadge({ role }: { role: Role }) {
  if (role !== 'CHEF_TEAM') return null
  return (
    <span className={`${badgeBase} bg-charcoal text-cream`}>
      <ChefHat className="h-3 w-3" /> Brigade
    </span>
  )
}

/* ---------- États ---------- */

export function Spinner({ className = '' }: { className?: string }) {
  return <LoaderCircle className={`h-6 w-6 animate-spin text-brigade-red ${className}`} aria-hidden="true" />
}

export function PageLoader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-charcoal-light" role="status">
      <Spinner className="h-8 w-8" />
      {label}
    </div>
  )
}

export function RecipeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse overflow-hidden rounded-3xl bg-white ring-1 ring-charcoal/5">
          <div className="aspect-[4/3] bg-cream-dark" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 rounded-full bg-cream-dark" />
            <div className="h-3 w-1/3 rounded-full bg-cream-dark" />
            <div className="h-3 w-1/2 rounded-full bg-cream-dark" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  text?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, text, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-charcoal/10 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-white shadow-sm">
        <Icon className="h-6 w-6 text-brigade-red" />
      </span>
      <p className="mt-4 text-lg font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-md text-sm text-charcoal-light">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ---------- Navigation ---------- */

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b)

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="btn btn-secondary px-3"
        aria-label="Page précédente"
      >
        <ChevronLeft />
      </button>
      {pages.map((p, index) => (
        <span key={p} className="flex items-center gap-1.5">
          {index > 0 && p - pages[index - 1] > 1 && <span className="px-1 text-charcoal-light">…</span>}
          <button
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition ${
              p === page ? 'bg-charcoal text-cream' : 'bg-white ring-1 ring-charcoal/15 hover:ring-brigade-red'
            }`}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="btn btn-secondary px-3"
        aria-label="Page suivante"
      >
        <ChevronRight />
      </button>
    </nav>
  )
}

interface TabsProps<T extends string> {
  tabs: { id: T; label: string; count?: number; icon?: LucideIcon }[]
  active: T
  onChange: (id: T) => void
}

export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-charcoal/10">
      {tabs.map(({ id, label, count, icon: Icon }) => {
        const selected = id === active
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition ${
              selected ? 'text-charcoal' : 'text-charcoal-light hover:text-charcoal'
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
            {count !== undefined && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${selected ? 'bg-brigade-red text-white' : 'bg-charcoal/10'}`}
              >
                {count}
              </span>
            )}
            {selected && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brigade-red" />}
          </button>
        )
      })}
    </div>
  )
}

interface SectionHeadingProps {
  eyebrow: string
  title: string
  action?: ReactNode
  inverted?: boolean
}

export function SectionHeading({ eyebrow, title, action, inverted }: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className={`eyebrow ${inverted ? 'text-cream/60' : ''}`}>{eyebrow}</p>
        <h2 className="mt-2 font-heading text-4xl leading-none uppercase sm:text-5xl">{title}</h2>
      </div>
      {action}
    </div>
  )
}
