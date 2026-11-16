import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://USERNAME@localhost:5432/tripster",
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
