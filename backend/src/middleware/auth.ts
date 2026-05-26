import type { Request } from "express";
import { store } from "../db/store.js";
import { verifyAuthToken } from "../services/token.js";
import type { User } from "../types.js";

export function getBearerToken(req: Request): string | null {
  const auth = req.headers.authorization ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export function getAuthenticatedUser(req: Request): User | null {
  const token = getBearerToken(req);
  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload) return null;

  return store.getUser(payload.sub) ?? null;
}
