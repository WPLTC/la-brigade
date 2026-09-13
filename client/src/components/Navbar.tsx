import { ChevronDown, Heart, LogOut, Menu, Plus, ShieldCheck, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { ModerationStats } from '../lib/types'
import { ConfirmDialog } from './ConfirmDialog'
import { Logo } from './Logo'
import { Avatar } from './ui'

const LINKS = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/recipes', label: 'Recettes', end: false },
  { to: '/concept', label: 'Le concept', end: false },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
    isActive ? 'bg-charcoal text-cream' : 'text-charcoal-light hover:bg-charcoal/5 hover:text-charcoal'
  }`

export function Navbar() {
  const { user, isAuthenticated, isChef, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    setMenuOpen(false)
    setAccountOpen(false)
  }, [location.pathname])

  // Pastille "recettes à tester" pour la brigade
  useEffect(() => {
    if (!isChef) return
    api
      .get<ModerationStats>('/moderation/stats')
      .then((stats) => setPendingCount(stats.pending))
      .catch(() => setPendingCount(0))
  }, [isChef, location.pathname])

  function handleLogout() {
    setConfirmLogout(false)
    logout()
    navigate('/')
  }

  const moderationLink = isChef && (
    <NavLink to="/moderation" className={linkClass}>
      <ShieldCheck className="h-4 w-4" />
      Brigade
      {pendingCount > 0 && (
        <span className="rounded-full bg-brigade-red px-1.5 text-[11px] leading-5 text-white">{pendingCount}</span>
      )}
    </NavLink>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" aria-label="La Brigade, retour à l'accueil">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
          {moderationLink}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated && user ? (
            <>
              <Link to="/recipes/new" className="btn btn-primary">
                <Plus /> Proposer
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((open) => !open)}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-full bg-white p-1 pr-3 ring-1 ring-charcoal/10 transition hover:ring-charcoal/30"
                >
                  <Avatar name={user.name} size="sm" />
                  <span className="max-w-28 truncate text-sm font-medium">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="h-4 w-4 text-charcoal-light" />
                </button>

                {accountOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setAccountOpen(false)} />
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-charcoal/10"
                    >
                      <div className="px-3 py-2">
                        <p className="truncate text-sm font-semibold">{user.name}</p>
                        <p className="truncate text-xs text-charcoal-light">{user.email}</p>
                      </div>
                      <div className="my-1 h-px bg-charcoal/10" />
                      <Link role="menuitem" to="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-cream">
                        <User className="h-4 w-4" /> Mon profil
                      </Link>
                      <Link
                        role="menuitem"
                        to="/profile?tab=favorites"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-cream"
                      >
                        <Heart className="h-4 w-4" /> Mes favoris
                      </Link>
                      <div className="my-1 h-px bg-charcoal/10" />
                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => {
                          setAccountOpen(false)
                          setConfirmLogout(true)
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-brigade-red hover:bg-brigade-red/5"
                      >
                        <LogOut className="h-4 w-4" /> Se déconnecter
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Connexion
              </Link>
              <Link to="/register" className="btn btn-primary">
                Rejoindre la brigade
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-full p-2 hover:bg-charcoal/5 md:hidden"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-charcoal/10 bg-cream px-4 pt-3 pb-6 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Navigation mobile">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
            {moderationLink}
            {isAuthenticated && (
              <>
                <NavLink to="/profile" className={linkClass}>
                  Mon profil
                </NavLink>
                <button type="button" onClick={() => setConfirmLogout(true)} className="rounded-full px-3.5 py-2 text-left text-sm font-medium text-brigade-red">
                  Se déconnecter
                </button>
              </>
            )}
          </nav>
          <div className="mt-4 flex gap-2">
            {isAuthenticated ? (
              <Link to="/recipes/new" className="btn btn-primary flex-1">
                <Plus /> Proposer une recette
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary flex-1">
                  Connexion
                </Link>
                <Link to="/register" className="btn btn-primary flex-1">
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmLogout}
        title="Se déconnecter ?"
        message="Tu devras te reconnecter pour proposer, noter ou commenter des recettes."
        confirmLabel="Se déconnecter"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </header>
  )
}
