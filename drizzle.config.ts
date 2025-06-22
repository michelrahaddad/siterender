import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: "postgresql://cartao_vidah_user:UsxdpiN5sqwycdJCYKWLrjO8GgcQRuqX@dpg-d1bl6o8dl3ps73eqbdeg-a.oregon-postgres.render.com/cartao_vidah"
  }
});
