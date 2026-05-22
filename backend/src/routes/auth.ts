import { Router } from "express";
import { store } from "../db/store.js";

/**
 * 認証ルート（モック実装）。
 * 担当: バックエンド係 (tsutsumi) で Firebase Auth or 自前JWT に差し替え。
 */
export const authRouter = Router();

// POST /api/auth/login : { name } → user を返すだけのモック
authRouter.post("/login", (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "name required" });
  const user = store.listUsers().find((u) => u.name === name);
  if (!user) return res.status(404).json({ error: "user not found" });
  return res.json({ user, token: `mock-${user.id}` });
});

// POST /api/auth/signup : 同上、今は何もしない
authRouter.post("/signup", (req, res) => {
  return res.status(501).json({ error: "not implemented" });
});

// GET /api/auth/me : Authorization: Bearer mock-<userId> でユーザーを返す
authRouter.get("/me", (req, res) => {
  const auth = req.headers.authorization ?? "";
  const token = auth.replace(/^Bearer\s+/, "");
  const userId = token.replace(/^mock-/, "");
  const user = store.getUser(userId);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  return res.json({ user });
});

// GET /api/me 用のエクスポート（index.ts でマウント）
export function meHandler(req: import("express").Request, res: import("express").Response) {
  const auth = req.headers.authorization ?? "";
  const token = auth.replace(/^Bearer\s+/, "");
  const userId = token.replace(/^mock-/, "");
  const user = store.getUser(userId);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  return res.json({ user });
}
