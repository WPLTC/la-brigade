import { describe, expect, it } from 'vitest'
import {
  isMonthKey,
  monthKey,
  monthRange,
  popularityScore,
  previousMonthKey,
  rankByPopularity,
} from '../src/services/popularity.js'

describe('popularityScore', () => {
  it('pondère favoris (x3), notes (x2) et commentaires (x1)', () => {
    expect(popularityScore({ favorites: 2, ratings: 3, comments: 4 })).toBe(2 * 3 + 3 * 2 + 4)
  })

  it('vaut 0 sans interaction', () => {
    expect(popularityScore({ favorites: 0, ratings: 0, comments: 0 })).toBe(0)
  })
})

describe('rankByPopularity', () => {
  const candidate = (recipeId: string, favorites: number, ratings: number, comments: number, averageRating = 0) => ({
    recipeId,
    favorites,
    ratings,
    comments,
    averageRating,
  })

  it('classe par score décroissant', () => {
    const ranked = rankByPopularity([candidate('a', 0, 1, 0), candidate('b', 2, 0, 0), candidate('c', 0, 0, 3)])
    expect(ranked.map((r) => r.recipeId)).toEqual(['b', 'c', 'a'])
    expect(ranked[0].score).toBe(6)
  })

  it('départage les ex æquo par la note moyenne', () => {
    const ranked = rankByPopularity([candidate('a', 1, 0, 0, 3.5), candidate('b', 1, 0, 0, 4.8)])
    expect(ranked.map((r) => r.recipeId)).toEqual(['b', 'a'])
  })

  it('écarte les recettes sans interaction', () => {
    expect(rankByPopularity([candidate('a', 0, 0, 0, 5)])).toEqual([])
  })
})

describe('gestion des mois', () => {
  it('formate une date en AAAA-MM', () => {
    expect(monthKey(new Date(Date.UTC(2026, 8, 13)))).toBe('2026-09')
    expect(monthKey(new Date(Date.UTC(2026, 0, 1)))).toBe('2026-01')
  })

  it('valide le format', () => {
    expect(isMonthKey('2026-09')).toBe(true)
    expect(isMonthKey('2026-13')).toBe(false)
    expect(isMonthKey('09-2026')).toBe(false)
  })

  it('calcule les bornes du mois', () => {
    const { start, end } = monthRange('2026-12')
    expect(start.toISOString()).toBe('2026-12-01T00:00:00.000Z')
    expect(end.toISOString()).toBe('2027-01-01T00:00:00.000Z')
  })

  it('trouve le mois précédent, y compris en janvier', () => {
    expect(previousMonthKey('2026-09')).toBe('2026-08')
    expect(previousMonthKey('2026-01')).toBe('2025-12')
  })

  it('refuse un mois invalide', () => {
    expect(() => monthRange('2026-00')).toThrow()
  })
})
