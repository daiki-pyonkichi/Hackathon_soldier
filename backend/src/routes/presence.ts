import { Router } from "express";
import { store } from "../db/store.js";
import { getAuthenticatedUser } from "../middleware/auth.js";
import { getClientIp, isLabIp } from "../middleware/ipCheck.js";
import type { PresenceView } from "../types.js";

/**
 * 在室判定ルート。
 * 担当: バックエンド係 (tsutsumi)
 *   - DB 永続化、認証連携、タイムアウト処理（数分pingが無ければ自動退室）
 */
export const presenceRouter = Router();

// POST /api/presence/ping : Wi-Fi(IP)判定で在室更新
presenceRouter.post("/ping", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const ip = getClientIp(req);
  const present = isLabIp(ip);
  const now = new Date().toISOString();
  const prev = store.getPresence(user.id);

  const updated = store.upsertPresence({
    userId: user.id,
    isPresent: present,
    source: "wifi",
    enteredAt: present ? (prev?.isPresent ? prev.enteredAt : now) : null,
    lastSeenAt: now,
  });

  return res.json({ ...updated, ip });
});

// POST /api/presence/manual : 手動 checkin/checkout
presenceRouter.post("/manual", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  const action = String(req.body?.action ?? "");
  if (action !== "checkin" && action !== "checkout") {
    return res.status(400).json({ error: "action must be checkin or checkout" });
  }
  const now = new Date().toISOString();
  const prev = store.getPresence(user.id);
  const updated = store.upsertPresence({
    userId: user.id,
    isPresent: action === "checkin",
    source: "manual",
    enteredAt:
      action === "checkin" ? (prev?.isPresent ? prev.enteredAt : now) : null,
    lastSeenAt: now,
  });
  return res.json(updated);
});

// GET /api/presence : 在室者一覧
presenceRouter.get("/", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const now = Date.now();
  const view: PresenceView[] = store.listPresences().map((p) => {
    const user = store.getUser(p.userId)!;
    const durationSec = p.isPresent && p.enteredAt
      ? Math.floor((now - new Date(p.enteredAt).getTime()) / 1000)
      : 0;
    return { ...p, user, durationSec };
  });
  return res.json({ presences: view });
});
