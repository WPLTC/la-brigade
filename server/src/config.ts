import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: process.env.JWT_SECRET ?? '',
  /** Origines autorisées pour CORS, séparées par des virgules (toutes si vide) */
  clientOrigin: process.env.CLIENT_ORIGIN,
  isProduction: process.env.NODE_ENV === 'production',
}

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET est manquant : copie server/.env.example vers server/.env')
}
