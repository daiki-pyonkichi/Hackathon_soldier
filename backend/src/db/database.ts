import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { hashPassword } from "../services/password.js";
// データベースの初期化とテーブル作成
// 本番では DB_PATH に永続ディスク上のパスを指定する（例: /opt/labsoldier/data/labsoldier.db）
const DB_PATH = process.env.DB_PATH ?? "data/labsoldier.db";
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");//高速モードを有効化
db.pragma("foreign_keys = ON");//外部キー制約を有効化

//データベースの構成
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT '',
    avatar_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS presence (
    user_id TEXT PRIMARY KEY,
    is_present INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'wifi',
    entered_at TEXT,
    last_seen_at TEXT,
    manual_off INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS presence_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    entered_at TEXT NOT NULL,
    left_at TEXT NOT NULL,
    duration_sec INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_logs_user_left
    ON presence_logs(user_id, left_at);
`);
//created_at 作成日時
  //last_seen_at 最終確認時間
  //初期データの投入（必要に応じて）
  //entered_at 入室時間
  //last_seen_at 最終確認時間
  //left_at 退室時間
  //duration_sec 在室時間（秒）


// 既存DBに manual_off カラムが無ければ追加（in-place マイグレーション）
const presenceCols = db.pragma("table_info(presence)") as Array<{ name: string }>;
if (!presenceCols.some((c) => c.name === "manual_off")) {
  db.exec(`ALTER TABLE presence ADD COLUMN manual_off INTEGER NOT NULL DEFAULT 0`);
}

// 開発用初期パスワードは password123（固定 salt でハッシュ化、毎起動で同じ値になる）
const seedCreatedAt = new Date("2026-05-22T00:00:00.000Z").toISOString();
const seedPasswordHash = hashPassword("password123", "labsoldier-dev-seed");

const seedUsers = [
  { id: "u-naganawa", name: "naganawa", avatarId: "soldier-blue" },
  { id: "u-tsutsumi", name: "tsutsumi", avatarId: "soldier-red" },
  { id: "u-takebayashi", name: "takebayashi", avatarId: "soldier-green" },
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, name, password_hash, avatar_id, created_at)
  VALUES (?, ?, ?, ?, ?)
`);
const insertPresence = db.prepare(`
  INSERT OR IGNORE INTO presence (user_id, is_present, source, entered_at, last_seen_at)
  VALUES (?, 0, 'wifi', NULL, NULL)
`);
for (const u of seedUsers) {
  insertUser.run(u.id, u.name, seedPasswordHash, u.avatarId, seedCreatedAt);
  insertPresence.run(u.id);
}

console.log("[db] ready:", DB_PATH);
