import { randomUUID } from "node:crypto";
import { db } from "./database.js";
import type { Presence, PresenceLog, User } from "../types.js";

const userByIdStmt = db.prepare("SELECT * FROM users WHERE id = ?");
const userByNameStmt = db.prepare("SELECT * FROM users WHERE name = ?");
const allUsersStmt = db.prepare("SELECT * FROM users ORDER BY created_at");
const presenceByIdStmt = db.prepare("SELECT * FROM presence WHERE user_id = ?");
const allPresencesStmt = db.prepare("SELECT * FROM presence");
const upsertPresenceStmt = db.prepare(`
  INSERT INTO presence (user_id, is_present, source, entered_at, last_seen_at)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET
    is_present = excluded.is_present,
    source = excluded.source,
    entered_at = excluded.entered_at,
    last_seen_at = excluded.last_seen_at
`);
const insertLogStmt = db.prepare(`
  INSERT INTO presence_logs (id, user_id, entered_at, left_at, duration_sec)
  VALUES (?, ?, ?, ?, ?)
`);
const logsByUserStmt = db.prepare(`
  SELECT * FROM presence_logs WHERE user_id = ? ORDER BY left_at DESC
`);

type UserRow = {
  id: string;
  name: string;
  avatar_id: string;
  password_hash: string;
  created_at: string;
};

type PresenceRow = {
  user_id: string;
  is_present: number;
  source: string;
  entered_at: string | null;
  last_seen_at: string | null;
};

type PresenceLogRow = {
  id: string;
  user_id: string;
  entered_at: string;
  left_at: string;
  duration_sec: number;
};

//ここからデータベースの命名規則をアプリケーションの命名規則に変換する関数
function rowToUser(r: UserRow): User {
  return { id: r.id, name: r.name, avatarId: r.avatar_id };
}
function rowToPresence(r: PresenceRow): Presence {
  return {
    userId: r.user_id,
    isPresent: r.is_present === 1,
    source: r.source as "wifi" | "manual",
    enteredAt: r.entered_at,
    lastSeenAt: r.last_seen_at,
  };
}

//データベースを操作する関数群をまとめたオブジェクト
export const store = {
  listUsers(): User[] {
    return (allUsersStmt.all() as UserRow[]).map(rowToUser);
  },//ユーザーをすべてとる関数
  getUser(id: string): User | undefined {
    const row = userByIdStmt.get(id) as UserRow | undefined;
    return row ? rowToUser(row) : undefined;
  },//ユーザーIDからユーザー情報を取得する関数
  getUserByName(name: string): User | undefined {
    const row = userByNameStmt.get(name) as UserRow | undefined;
    return row ? rowToUser(row) : undefined;
  },//ユーザー名からユーザー情報を取得する関数
  listPresences(): Presence[] {
    return (allPresencesStmt.all() as PresenceRow[]).map(rowToPresence);
  },//すべての在室情報を取得する関数
  getPresence(userId: string): Presence | undefined {
    const row = presenceByIdStmt.get(userId) as PresenceRow | undefined;
    return row ? rowToPresence(row) : undefined;
  },//ユーザーIDから在室情報を取得する関数
  upsertPresence(p: Presence): Presence {
    upsertPresenceStmt.run(
      p.userId,
      p.isPresent ? 1 : 0,
      p.source,
      p.enteredAt,
      p.lastSeenAt,
    );
    return p;
  },//在室情報を書き換える関数
  insertPresenceLog(args: {
    userId: string;
    enteredAt: string;
    leftAt: string;
  }): PresenceLog {
    const durationSec = Math.max(
      0,
      Math.floor(
        (new Date(args.leftAt).getTime() - new Date(args.enteredAt).getTime()) /
          1000,
      ),
    );
    const id = randomUUID();
    insertLogStmt.run(
      id,
      args.userId,
      args.enteredAt,
      args.leftAt,
      durationSec,
    );
    return {
      id,
      userId: args.userId,
      enteredAt: args.enteredAt,
      leftAt: args.leftAt,
      durationSec,
    };
  },//UserID,入室時間、退室時間をもとに在室履歴を追加する関数
  listPresenceLogsByUser(userId: string): PresenceLog[] {
    return (logsByUserStmt.all(userId) as PresenceLogRow[]).map((r) => ({
      id: r.id,
      userId: r.user_id,
      enteredAt: r.entered_at,
      leftAt: r.left_at,
      durationSec: r.duration_sec,
    }));
  },//ユーザーIDから在室履歴を取得する関数
};
