import { Router } from "express";
import { store, avatarIds } from "../db/store.js";
import { getAuthenticatedUser } from "../middleware/auth.js";
import { hashPassword, verifyPassword } from "../services/password.js";
import { signAuthToken } from "../services/token.js";

/**
 * 認証ルート。
 * 品川シーサイド側の「入力検証 → ユーザー検索 → パスワード検証 → token発行」
 * の流れを、LabSoldier向けに軽量化して実装している。
 */
export const authRouter = Router();

function readCredentials(body: unknown): { name: string; password: string } {
  const value = body as { name?: unknown; password?: unknown };
  return {
    name: String(value?.name ?? "").trim(),
    password: String(value?.password ?? ""),
  };
}

function isValidName(name: string): boolean {
  return /^[a-zA-Z0-9_-]{2,24}$/.test(name);
}

// POST /api/auth/login : { name, password } → user + token
authRouter.post("/login", (req, res) => {
  const { name, password } = readCredentials(req.body);
  if (!name || !password) {
    return res.status(400).json({ error: "name and password are required" });
  }

  const authUser = store.getAuthUserByName(name);
  if (!authUser || !verifyPassword(password, authUser.passwordHash)) {
    return res.status(401).json({ error: "name or password is incorrect" });
  }

  const user = store.getUser(authUser.id)!;
  return res.json({ user, token: signAuthToken(user) });
});

// POST /api/auth/signup : { name, password } → user + token
authRouter.post("/signup", (req, res) => {
  const { name, password } = readCredentials(req.body);
  if (!isValidName(name)) {
    return res.status(400).json({
      error: "name must be 2-24 chars: letters, numbers, _ or -",
    });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 characters" });
  }
  if (store.getAuthUserByName(name)) {
    return res.status(409).json({ error: "name is already taken" });
  }

  const requestedAvatar = String((req.body as { avatarId?: unknown })?.avatarId ?? "");
  const avatarId = avatarIds.includes(requestedAvatar) ? requestedAvatar : undefined;

  const user = store.createUser({ name, passwordHash: hashPassword(password), avatarId });
  return res.status(201).json({ user, token: signAuthToken(user) });
});

// GET /api/auth/me : Authorization: Bearer <token> でユーザーを返す
authRouter.get("/me", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  return res.json({ user });
});

// GET /api/me 用のエクスポート（index.ts でマウント）
export function meHandler(req: import("express").Request, res: import("express").Response) {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  return res.json({ user });
}

// PATCH /api/me : { avatarId } で自分のアバターを変更（index.ts でマウント）
export function updateMeHandler(req: import("express").Request, res: import("express").Response) {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const requestedAvatar = String((req.body as { avatarId?: unknown })?.avatarId ?? "");
  if (!avatarIds.includes(requestedAvatar)) {
    return res.status(400).json({ error: "invalid avatarId" });
  }

  const updated = store.updateAvatar(user.id, requestedAvatar);
  if (!updated) return res.status(404).json({ error: "user not found" });
  return res.json({ user: updated });
}

// DELETE /api/me : 自分のアカウントを削除。{ password } で本人確認する
export function deleteMeHandler(req: import("express").Request, res: import("express").Response) {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const password = String((req.body as { password?: unknown })?.password ?? "");
  if (!password) return res.status(400).json({ error: "password is required" });

  const authUser = store.getAuthUserByName(user.name);
  if (!authUser || !verifyPassword(password, authUser.passwordHash)) {
    return res.status(401).json({ error: "password is incorrect" });
  }

  store.deleteUser(user.id);
  return res.json({ ok: true });
}
