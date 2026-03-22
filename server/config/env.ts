import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.string().default("5000"),
  CORS_ALLOWED_ORIGINS: z.string().default(""),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  SUPABASE_ID_CARD_BUCKET: z.string().default("id-card-images"),
  SUPABASE_DOCUMENT_BUCKET: z.string().default("documents"),
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
