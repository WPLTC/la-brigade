const TOKEN_KEY = 'la-brigade-token'

/** Émis quand l'API répond 401 alors qu'un token était envoyé (session expirée) */
export const UNAUTHORIZED_EVENT = 'la-brigade:unauthorized'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
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

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const isFormData = body instanceof FormData

  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Impossible de joindre le serveur', 0)
  }

  if (res.status === 204) {
    return undefined as T
  }

  const data = await res.json().catch(() => undefined)

  if (!res.ok) {
    if (res.status === 401 && token) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    const message = typeof data?.error === 'string' ? data.error : 'Une erreur est survenue'
    throw new ApiError(message, res.status)
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, formData: FormData) => request<T>('POST', path, formData),
}

export function errorMessage(error: unknown, fallback = 'Une erreur est survenue') {
  return error instanceof ApiError ? error.message : fallback
}
