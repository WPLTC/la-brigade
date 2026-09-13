import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page introuvable')

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="font-heading text-[8rem] leading-none text-brigade-red">404</p>
      <h1 className="mt-4 font-heading text-4xl uppercase">Cette page a quitté la cuisine</h1>
      <p className="mt-3 text-charcoal-light">
        Le plat que tu cherches n'est plus à la carte, ou l'adresse contient une coquille.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="btn btn-primary">
          Retour à l'accueil
        </Link>
        <Link to="/recipes" className="btn btn-secondary">
          Voir les recettes
        </Link>
      </div>
    </div>
  )
}
