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
    // Queries: Transaction Pooler (PgBouncer, port 6543) — serverless safe
    url: process.env.DATABASE_URL,
    // Migrations: Direct connection (port 5432) — required to bypass PgBouncer advisory locks
    // Note: Prisma 7's TS types don't expose directUrl yet, but the runtime CLI reads it correctly
    ...({ directUrl: process.env.DIRECT_DATABASE_URL } as object),
  } as any,
});