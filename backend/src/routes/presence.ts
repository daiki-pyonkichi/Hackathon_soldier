import { Router } from "express";
import { store } from "../db/store.js";
import { getAuthenticatedUser } from "../middleware/auth.js";
import { getClientIp, isLabIp } from "../middleware/ipCheck.js";
import { judgeStatus, elapsedMinutes } from "../lib/judge.js";
import type { Presence, PresenceView } from "../types.js";

/**
 * 在室判定ルート。
 * - 自動判定: POST /ping (Wi-Fi IP)
 * - 明示的な退室: POST /leave （manualOff=true、以降の ping は無視される）
 * - 退室解除: POST /resume （次の ping から自動判定再開）
 */
export const presenceRouter = Router();

// POST /api/presence/ping : Wi-Fi(IP)判定で在室更新
presenceRouter.post("/ping", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const ip = getClientIp(req);
  const prev = store.getPresence(user.id);

  // 明示的に退室中なら、自動 ping では何も更新しない
  if (prev?.manualOff) {
    return res.json({ ...prev, ip, skipped: true });
  }

  const present = isLabIp(ip);
  const now = new Date().toISOString();

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
    manualOff: false,
  });

  return res.json({ ...updated, ip });
});

// POST /api/presence/leave : 明示的に退室。manualOff=true を立てる
presenceRouter.post("/leave", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const now = new Date().toISOString();
  const prev = store.getPresence(user.id);

  // 在室中なら退室セッションをログ化
  if (prev?.isPresent && prev.enteredAt) {
    store.insertPresenceLog({
      userId: user.id,
      enteredAt: prev.enteredAt,
      leftAt: now,
    });
  }

  const updated = store.upsertPresence({
    userId: user.id,
    isPresent: false,
    source: "manual",
    enteredAt: null,
    lastSeenAt: now,
    manualOff: true,
  });
  return res.json(updated);
});

// POST /api/presence/resume : 退室フラグを解除。以降の ping で自動判定再開
presenceRouter.post("/resume", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  store.setManualOff(user.id, false);
  const updated = store.getPresence(user.id);
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
      manualOff: false,
    };
    return {
      userId: u.id,
      name: u.name,
      avatarId: u.avatarId,
      status: judgeStatus(p),
      lastSeenAt: p.lastSeenAt,
      elapsedMin: elapsedMinutes(p.enteredAt),
      enteredAt: p.enteredAt,
      manualOff: p.manualOff,
    };
  });
  return res.json({ presences: view });
});
