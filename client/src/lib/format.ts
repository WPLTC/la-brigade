import type { Category, Difficulty, RecipeStatus } from './types'

export const CATEGORY_LABEL: Record<Category, string> = {
  ENTREE: 'Entrée',
  PLAT: 'Plat',
  DESSERT: 'Dessert',
}

export const CATEGORY_PLURAL: Record<Category, string> = {
  ENTREE: 'Entrées',
  PLAT: 'Plats',
  DESSERT: 'Desserts',
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  FACILE: 'Facile',
  MOYEN: 'Moyen',
  DIFFICILE: 'Difficile',
}

export const STATUS_LABEL: Record<RecipeStatus, string> = {
  PENDING: 'En attente',
  VALIDATED: 'Validée',
  REJECTED: 'Refusée',
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const monthYearFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso))
}

/** "2026-09" -> "septembre 2026" */
export function formatMonth(key: string) {
  const [year, month] = key.split('-').map(Number)
  return monthYearFormat.format(new Date(Date.UTC(year, month - 1, 1)))
}

export function formatMonthYear(iso: string) {
  return monthYearFormat.format(new Date(iso))
}

const relativeFormat = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_557_600],
  ['month', 2_629_800],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

/** "il y a 3 jours", "hier"… */
export function relativeDate(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeFormat.format(Math.round(seconds / size), unit)
    }
  }
  return "à l'instant"
}

export function currentMonthKey() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count > 1 ? pluralForm : singular}`
}
