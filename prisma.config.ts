import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

// Load .env.local (Next.js convention — Prisma doesn't read this by default)
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // CLI Commands: Direct Connection (port 5432) to bypass PgBouncer transaction pooler
    url: process.env.DIRECT_DATABASE_URL,
  } as any,
});