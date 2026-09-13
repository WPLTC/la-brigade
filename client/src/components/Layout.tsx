import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Logo } from './Logo'
import { Navbar } from './Navbar'

function Footer() {
  return (
    <footer className="mt-24 bg-charcoal text-cream/75">
      <div className="flex h-1.5" aria-hidden="true">
        <div className="flex-1 bg-navy" />
        <div className="flex-1 bg-cream" />
        <div className="flex-1 bg-brigade-red" />
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo inverted />
          <p className="mt-5 max-w-sm text-sm leading-relaxed">
            La plateforme collaborative de recettes bistronomiques : une cuisine accessible, créative et inspirée de la
            gastronomie, testée et validée par la brigade du chef.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-cream">Explorer</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-cream" to="/recipes">Toutes les recettes</Link></li>
            <li><Link className="hover:text-cream" to="/recipes?category=ENTREE">Entrées</Link></li>
            <li><Link className="hover:text-cream" to="/recipes?category=PLAT">Plats</Link></li>
            <li><Link className="hover:text-cream" to="/recipes?category=DESSERT">Desserts</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-cream">La communauté</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-cream" to="/concept">Le concept</Link></li>
            <li><Link className="hover:text-cream" to="/concept#recettes-du-mois">Les recettes du mois</Link></li>
            <li><Link className="hover:text-cream" to="/recipes/new">Proposer une recette</Link></li>
            <li><Link className="hover:text-cream" to="/profile">Mon profil</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-cream/50 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} La Brigade · Projet Dev</span>
          <span>Photos de démonstration : Unsplash</span>
        </div>
      </div>
    </footer>
  )
}

export function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
