import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="border-b border-charcoal/10 bg-cream">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🧑‍🍳</span>
          <span className="font-heading text-2xl tracking-wide text-charcoal">La Brigade</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-charcoal-light">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="hover:text-brigade-red">
                {user?.name}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-charcoal/20 px-4 py-1.5 hover:border-brigade-red hover:text-brigade-red"
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
                className="rounded-full bg-brigade-red px-4 py-1.5 text-white hover:bg-brigade-red-dark"
              >
                Inscription
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
