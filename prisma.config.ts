import dotenv from 'dotenv'
import { defineConfig } from 'prisma/config'

dotenv.config({ path: process.env.ENV_FILE || '.env.dev' })

export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
