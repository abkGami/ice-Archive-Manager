import { createClient } from "@supabase/supabase-js";
import type { Request, Response } from "express";
import { env, isProduction } from "./config/env";

const ACCESS_COOKIE = "sb-access-token";
const REFRESH_COOKIE = "sb-refresh-token";

export function createAnonSupabaseClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
);

export function uniqueIdToSupabaseEmail(uniqueId: string) {
  const normalized = uniqueId.trim().toLowerCase();
  const encoded = Buffer.from(normalized, "utf8").toString("base64url");
  return `${encoded}@identifier.local`;
}

export function parseBase64Image(dataUrl: string) {
  const match = dataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
  if (!match?.[1] || !match[2]) {
    throw new Error("Invalid ID card image format.");
  }

  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");

  if (!buffer.length) {
    throw new Error("ID card image is empty.");
  }

  return { mime, buffer };
}

export function fileExtensionFromMime(mime: string) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  return map[mime] ?? "bin";
}

export function sanitizeUniqueIdForPath(uniqueId: string) {
  return uniqueId.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function setAuthCookies(
  res: Response,
  session: { access_token: string; refresh_token: string; expires_in?: number },
) {
  const maxAgeMs = (session.expires_in ?? 3600) * 1000;

  res.cookie(ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeMs,
  });

  res.cookie(REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
}

export function getAccessTokenFromRequest(req: Request) {
  return req.cookies?.[ACCESS_COOKIE] as string | undefined;
}

export function getRefreshTokenFromRequest(req: Request) {
  return req.cookies?.[REFRESH_COOKIE] as string | undefined;
}
