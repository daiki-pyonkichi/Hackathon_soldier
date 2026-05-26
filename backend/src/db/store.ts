import { randomUUID } from "node:crypto";
import { hashPassword } from "../services/password.js";
import type { AuthUserRecord, Presence, User } from "../types.js";

/**
 * 叩き台用のインメモリストア。
 * 本実装では SQLite / PostgreSQL / Firestore などに置き換える。
 * 担当: バックエンド係 (tsutsumi)
 */

const createdAt = new Date("2026-05-22T00:00:00.000Z").toISOString();
const defaultPasswordHash = hashPassword("password123", "labsoldier-dev-seed");
const avatarIds = ["soldier-blue", "soldier-red", "soldier-green", "soldier-yellow"];

function toPublicUser(user: AuthUserRecord): User {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

function blankPresence(userId: string): Presence {
  return {
    userId,
    isPresent: false,
    source: "wifi",
    enteredAt: null,
    lastSeenAt: null,
  };
}

// 初期ダミーユーザー（3人チーム想定）。開発用初期パスワードは password123。
const users: AuthUserRecord[] = [
  {
    id: "u-naganawa",
    name: "naganawa",
    avatarId: "soldier-blue",
    createdAt,
    passwordHash: defaultPasswordHash,
  },
  {
    id: "u-tsutsumi",
    name: "tsutsumi",
    avatarId: "soldier-red",
    createdAt,
    passwordHash: defaultPasswordHash,
  },
  {
    id: "u-takebayashi",
    name: "takebayashi",
    avatarId: "soldier-green",
    createdAt,
    passwordHash: defaultPasswordHash,
  },
];

const presences = new Map<string, Presence>(
  users.map((u) => [u.id, blankPresence(u.id)]),
);

export const store = {
  listUsers(): User[] {
    return users.map(toPublicUser);
  },
  getUser(id: string): User | undefined {
    const user = users.find((u) => u.id === id);
    return user ? toPublicUser(user) : undefined;
  },
  getAuthUserByName(name: string): AuthUserRecord | undefined {
    return users.find((u) => u.name.toLowerCase() === name.toLowerCase());
  },
  createUser(input: { name: string; passwordHash: string; avatarId?: string }): User {
    const user: AuthUserRecord = {
      id: randomUUID(),
      name: input.name,
      avatarId: input.avatarId ?? avatarIds[users.length % avatarIds.length],
      createdAt: new Date().toISOString(),
      passwordHash: input.passwordHash,
    };
    users.push(user);
    presences.set(user.id, blankPresence(user.id));
    return toPublicUser(user);
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
