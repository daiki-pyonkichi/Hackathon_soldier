import type { Presence, User } from "../types.js";

/**
 * 叩き台用のインメモリストア。
 * 本実装では SQLite / PostgreSQL / Firestore などに置き換える。
 * 担当: バックエンド係 (tsutsumi)
 */

// 初期ダミーユーザー（4人チーム想定）
const users: User[] = [
  { id: "u-naganawa", name: "naganawa", avatarId: "soldier-blue" },
  { id: "u-tsutsumi", name: "tsutsumi", avatarId: "soldier-red" },
  { id: "u-takebayashi", name: "takebayashi", avatarId: "soldier-green" },
  { id: "u-kuremoto", name: "kuremoto", avatarId: "soldier-yellow" },
];

const presences = new Map<string, Presence>(
  users.map((u) => [
    u.id,
    {
      userId: u.id,
      isPresent: false,
      source: "wifi" as const,
      enteredAt: null,
      lastSeenAt: null,
    },
  ]),
);

export const store = {
  listUsers(): User[] {
    return users;
  },
  getUser(id: string): User | undefined {
    return users.find((u) => u.id === id);
  },
  listPresences(): Presence[] {
    return [...presences.values()];
  },
  getPresence(userId: string): Presence | undefined {
    return presences.get(userId);
  },
  upsertPresence(p: Presence): Presence {
    presences.set(p.userId, p);
    return p;
  },
};
