import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de se connecter')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-charcoal/10 bg-white p-8 shadow-sm">
          <span className="text-3xl">🔑</span>
          <h1 className="mt-2 font-heading text-3xl tracking-wide text-charcoal">Connexion</h1>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-charcoal-light">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-charcoal/20 px-3 py-2 outline-none focus:border-brigade-red"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-charcoal-light">
              Mot de passe
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-charcoal/20 px-3 py-2 outline-none focus:border-brigade-red"
              />
            </label>

            {error && <p className="text-sm text-brigade-red">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-full bg-brigade-red px-4 py-2 font-medium text-white transition hover:bg-brigade-red-dark disabled:opacity-50"
            >
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-charcoal-light">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-medium text-brigade-red underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
