import { Router } from "express";
import { store } from "../db/store.js";
import { getAuthenticatedUser } from "../middleware/auth.js";
import { getClientIp, isLabIp } from "../middleware/ipCheck.js";
import { judgeStatus, elapsedMinutes } from "../lib/judge.js";
import type { Presence, PresenceView } from "../types.js";

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

  // 在室→不在に切り替わった瞬間にセッションをログ化
  if (!present && prev?.isPresent && prev.enteredAt) {
    store.insertPresenceLog({
      userId: user.id,
      enteredAt: prev.enteredAt,
      leftAt: now,
    });
  }

  const updated = store.upsertPresence({
    userId: user.id,
    isPresent: present,
    source: "wifi",
    enteredAt: present
      ? prev?.isPresent && prev.enteredAt
        ? prev.enteredAt
        : now
      : null,
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

  // 手動チェックアウト時にセッションをログ化
  if (action === "checkout" && prev?.isPresent && prev.enteredAt) {
    store.insertPresenceLog({
      userId: user.id,
      enteredAt: prev.enteredAt,
      leftAt: now,
    });
  }

  const updated = store.upsertPresence({
    userId: user.id,
    isPresent: action === "checkin",
    source: "manual",
    enteredAt:
      action === "checkin"
        ? prev?.isPresent && prev.enteredAt
          ? prev.enteredAt
          : now
        : null,
    lastSeenAt: now,
  });
  return res.json(updated);
});

// GET /api/presence : 在室者一覧（3状態判定、要認証）
presenceRouter.get("/", (req, res) => {
  const authUser = getAuthenticatedUser(req);
  if (!authUser) return res.status(401).json({ error: "unauthorized" });

  const users = store.listUsers();
  const presences = store.listPresences();
  const view: PresenceView[] = users.map((u) => {
    const p: Presence = presences.find((x) => x.userId === u.id) ?? {
      userId: u.id,
      isPresent: false,
      source: "wifi",
      enteredAt: null,
      lastSeenAt: null,
    };
    return {
      userId: u.id,
      name: u.name,
      avatarId: u.avatarId,
      status: judgeStatus(p),
      lastSeenAt: p.lastSeenAt,
      elapsedMin: elapsedMinutes(p.lastSeenAt),
      enteredAt: p.enteredAt,
    };
  });
  return res.json({ presences: view });
});
