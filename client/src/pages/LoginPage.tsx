import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { errorMessage } from '../lib/api'
import { redirectTarget } from '../lib/navigation'

const DEMO_ACCOUNTS = [
  { label: 'Équipe du chef', email: 'chef@labrigade.fr' },
  { label: 'Membre', email: 'lea@example.com' },
]

export function LoginPage() {
  useDocumentTitle('Connexion')
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      toast.success('Content de te revoir !')
      navigate(redirectTarget(location), { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Impossible de se connecter'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Bon retour parmi nous"
      title="Connexion"
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/register" state={location.state} className="font-semibold text-brigade-red hover:underline">
            Rejoindre la brigade
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-charcoal-light hover:text-charcoal"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-brigade-red/10 px-3 py-2 text-sm text-brigade-red">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3">
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      {import.meta.env.DEV && (
        <div className="mt-6 rounded-2xl bg-cream p-4 text-xs text-charcoal-light">
          <p className="font-semibold text-charcoal">Comptes de démonstration (mot de passe : Brigade2026!)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email)
                  setPassword('Brigade2026!')
                }}
                className="chip py-1 text-xs"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  )
}
