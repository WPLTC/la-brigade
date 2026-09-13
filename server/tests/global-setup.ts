import { execSync } from 'child_process'

/** Applique les migrations sur la base de test avant les tests d'intégration. */
export default function setup() {
  const url = process.env.DATABASE_URL_TEST
  if (!url) {
    console.warn('DATABASE_URL_TEST absent : les tests d\'intégration de l\'API seront ignorés')
    return
  }
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  })
}
