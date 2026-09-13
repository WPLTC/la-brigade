import 'dotenv/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    // Les tests d'intégration partagent la même base : on les exécute l'un après l'autre
    fileParallelism: false,
    env: {
      JWT_SECRET: 'test-secret',
      // Les tests ne touchent jamais la base de développement
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? '',
    },
  },
})
