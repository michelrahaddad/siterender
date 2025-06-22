import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts", // ou "./src/schema.ts", dependendo de onde está seu schema
  out: "./drizzle",
  driver: "pg",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: "postgresql://cartao_vidah_user:UsxdpiN5sqwycdJCYKWLrjO8GgcQRuqX@dpg-d1bl6o8dl3ps73eqbdeg-a.oregon-postgres.render.com/cartao_vidah",
  },
} satisfies Config;
