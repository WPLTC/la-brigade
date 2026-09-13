import type { Location } from 'react-router-dom'

/** Page à rouvrir après connexion/inscription (mémorisée par ProtectedRoute) */
export function redirectTarget(location: Location) {
  const from = (location.state as { from?: Location } | null)?.from
  return from ? `${from.pathname}${from.search}` : '/'
}
