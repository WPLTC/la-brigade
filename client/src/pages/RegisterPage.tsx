import { Check } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { errorMessage } from '../lib/api'
import { redirectTarget } from '../lib/navigation'

export function RegisterPage() {
  useDocumentTitle('Inscription')
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const passwordOk = password.length >= 8

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!passwordOk) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await register(name, email, password)
      toast.success(`Bienvenue dans la brigade, ${name.trim().split(' ')[0]} !`)
      navigate(redirectTarget(location), { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Impossible de créer le compte'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Rejoignez la communauté"
      title="Inscription"
      footer={
        <>
          Déjà membre ?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-brigade-red hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">
            Nom affiché
          </label>
          <input
            id="name"
            type="text"
            required
            minLength={2}
            maxLength={60}
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="input"
          />
        </div>
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
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby="password-hint"
            className="input"
          />
          <p id="password-hint" className={`mt-1.5 flex items-center gap-1 text-xs ${passwordOk ? 'text-olive' : 'text-charcoal-light'}`}>
            <Check className="h-3.5 w-3.5" /> Au moins 8 caractères
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-brigade-red/10 px-3 py-2 text-sm text-brigade-red">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3">
          {submitting ? 'Création du compte…' : 'Créer mon compte'}
        </button>
      </form>
    </AuthShell>
  )
}
