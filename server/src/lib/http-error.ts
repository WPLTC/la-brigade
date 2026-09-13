/** Erreur métier transformée en réponse HTTP par le middleware d'erreurs. */
export class HttpError extends Error {
  status: number
  details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

export const badRequest = (message: string) => new HttpError(400, message)
export const unauthorized = (message = 'Authentification requise') => new HttpError(401, message)
export const forbidden = (message = 'Action non autorisée') => new HttpError(403, message)
export const notFound = (message = 'Ressource introuvable') => new HttpError(404, message)
export const conflict = (message: string) => new HttpError(409, message)
