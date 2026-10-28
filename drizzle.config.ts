import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({ path: [".env.local", ".env"] })

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations need a direct (non-pooled) connection.
    url: (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)!,
  },
})
