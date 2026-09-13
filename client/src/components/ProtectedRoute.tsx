import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../lib/types'

interface ProtectedRouteProps {
  children: ReactNode
  role?: Role
}

/** Redirige vers la connexion (en mémorisant la page demandée) ou vers l'accueil si le rôle ne suffit pas */
export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
