const TOKEN_KEY = 'la-brigade-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await res.json().catch(() => undefined)

  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Une erreur est survenue'
    throw new ApiError(message, res.status)
  }

  return data as T
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken()

  const res = await fetch(`/api${path}`, {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  const data = await res.json().catch(() => undefined)

  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Une erreur est survenue'
    throw new ApiError(message, res.status)
  }

  return data as T
}
