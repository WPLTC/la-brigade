import type { z } from 'zod'
import { HttpError } from './http-error.js'

/**
 * Valide des données avec un schéma zod.
 * En cas d'échec, lève une erreur 400 dont le message est celui du premier problème
 * (lisible directement par l'utilisateur), le détail complet étant joint.
 */
export function parse<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'Données invalides'
    throw new HttpError(400, message, result.error.flatten())
  }
  return result.data
}
