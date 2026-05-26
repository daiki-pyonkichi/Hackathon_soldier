import { Router } from "express";
import { store } from "../db/store.js";
import { getClientIp, isLabIp } from "../middleware/ipCheck.js";
import { judgeStatus, elapsedMinutes } from "../lib/judge.js";
import type { Presence, PresenceView } from "../types.js";

/**
 * 在室判定ルート。
 * 担当: バックエンド係 (tsutsumi)
 *   - DB 永続化、認証連携、タイムアウト処理（数分pingが無ければ自動退室）
 */
export const presenceRouter = Router();

// 簡易: Authorization から userId を取り出す（モック）
function userIdFromReq(req: import("express").Request): string | null {
  const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/, "");
  if (!token.startsWith("mock-")) return null;
  return token.slice("mock-".length);
}

// POST /api/presence/ping : Wi-Fi(IP)判定で在室更新
presenceRouter.post("/ping", (req, res) => {
  const userId = userIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  const user = store.getUser(userId);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const ip = getClientIp(req);//リクエストからクライアントIPを取得
  const present = isLabIp(ip);//IPが研究室のものか判定
  const now = new Date().toISOString();//時間を取得
  const prev = store.getPresence(userId);//在室情報を取得

  // 在室→不在に切り替わった瞬間にセッションをログ化
  if (!present && prev?.isPresent && prev.enteredAt) {
    store.insertPresenceLog({
      userId,
      enteredAt: prev.enteredAt,
      leftAt: now,
    });
  }

  const updated = store.upsertPresence({
    userId,
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
  const userId = userIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  const action = String(req.body?.action ?? "");
  if (action !== "checkin" && action !== "checkout") {
    return res.status(400).json({ error: "action must be checkin or checkout" });
  }
  const now = new Date().toISOString();
  const prev = store.getPresence(userId);

  // 手動チェックアウト時にセッションをログ化
  if (action === "checkout" && prev?.isPresent && prev.enteredAt) {
    store.insertPresenceLog({
      userId,
      enteredAt: prev.enteredAt,
      leftAt: now,
    });
  }

  const updated = store.upsertPresence({
    userId,
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

// GET /api/presence : 在室者一覧（3状態判定）
presenceRouter.get("/", (_req, res) => {
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
