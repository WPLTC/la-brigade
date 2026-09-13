import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ConfirmDialog } from './ConfirmDialog'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)

  function handleConfirmLogout() {
    setIsLogoutConfirmOpen(false)
    logout()
    navigate('/')
  }

  return (
    <header className="border-b border-charcoal/10 bg-cream">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🧑‍🍳</span>
          <span className="font-heading text-2xl tracking-wide text-charcoal">La Brigade</span>
        </Link>

        <nav className="flex items-center text-sm font-medium text-charcoal-light">
          <Link to="/recipes" className="mr-4 hover:text-brigade-red">
            Recettes
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/recipes/new"
                className="rounded-full bg-brigade-red px-4 py-1.5 text-white hover:bg-brigade-red-dark"
              >
                Proposer une recette
              </Link>

              {user?.role === 'CHEF_TEAM' && (
                <Link to="/moderation" className="ml-3 hover:text-brigade-red">
                  Validation
                </Link>
              )}

              <div className="mx-4 h-6 w-px bg-charcoal/15" />

              <Link
                to="/profile"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-white hover:text-brigade-red"
              >
                <span aria-hidden="true">👤</span>
                {user?.name}
              </Link>

              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="ml-3 rounded-full border border-charcoal/20 px-4 py-1.5 hover:border-brigade-red hover:text-brigade-red"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-brigade-red">
                Connexion
              </Link>
              <Link
                to="/register"
                className="ml-4 rounded-full bg-brigade-red px-4 py-1.5 text-white hover:bg-brigade-red-dark"
              >
                Inscription
              </Link>
            </>
          )}
        </nav>
      </div>

      <ConfirmDialog
        open={isLogoutConfirmOpen}
        title="Se déconnecter ?"
        message="Tu devras te reconnecter pour accéder à ton profil et proposer des recettes."
        confirmLabel="Se déconnecter"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </header>
  )
}
