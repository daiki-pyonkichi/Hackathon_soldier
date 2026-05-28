/**
 * ダミーの在室ログをDBに投入するスクリプト。
 * 実行: cd backend && npx tsx scripts/seed-logs.ts
 */

import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

const db = new Database("data/labsoldier.db");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const USERS = [
  { id: "u-naganawa",     name: "naganawa" },
  { id: "u-tsutsumi",     name: "tsutsumi" },
  { id: "u-takebayashi",  name: "takebayashi" },
];

// 過去28日ぶんのデータを生成する
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// JST offset: UTC+9
const JST = 9 * 60 * 60 * 1000;

function jstDate(daysAgo: number, hour: number, minute = 0): Date {
  const d = new Date(TODAY.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  d.setHours(hour, minute, 0, 0);
  // ローカルがJSTでない環境でもJSTとして扱う（ローカル開発用なのでシンプルに）
  return d;
}

type Session = { userId: string; enteredAt: Date; leftAt: Date };

function makeSession(userId: string, daysAgo: number, startHour: number, durationHour: number): Session {
  const enteredAt = jstDate(daysAgo, startHour);
  const leftAt = new Date(enteredAt.getTime() + durationHour * 60 * 60 * 1000);
  return { userId, enteredAt, leftAt };
}

// ユーザーごとに異なるパターンで28日ぶんのセッションを作成
const sessions: Session[] = [];

for (let day = 1; day <= 28; day++) {
  const dow = new Date(TODAY.getTime() - day * 24 * 60 * 60 * 1000).getDay();
  const isWeekend = dow === 0 || dow === 6;

  // naganawa: 毎日コツコツ型（週末も少し来る）
  if (!isWeekend || Math.random() < 0.3) {
    const start = 10 + Math.floor(Math.random() * 2);   // 10〜11時入室
    const dur = 5 + Math.random() * 3;                  // 5〜8時間
    sessions.push(makeSession("u-naganawa", day, start, dur));
  }

  // tsutsumi: 夜型（平日のみ）
  if (!isWeekend) {
    const start = 13 + Math.floor(Math.random() * 3);   // 13〜15時入室
    const dur = 4 + Math.random() * 5;                  // 4〜9時間
    sessions.push(makeSession("u-tsutsumi", day, start, dur));
  }

  // takebayashi: 不定期（週3〜4日）
  if (!isWeekend && Math.random() < 0.7) {
    const start = 9 + Math.floor(Math.random() * 4);    // 9〜12時入室
    const dur = 3 + Math.random() * 6;                  // 3〜9時間
    sessions.push(makeSession("u-takebayashi", day, start, dur));
  }
}

// 既存のシードデータを削除してから投入
db.exec(`DELETE FROM presence_logs`);

const insert = db.prepare(`
  INSERT INTO presence_logs (id, user_id, entered_at, left_at, duration_sec)
  VALUES (?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((rows: Session[]) => {
  for (const s of rows) {
    const durationSec = Math.floor((s.leftAt.getTime() - s.enteredAt.getTime()) / 1000);
    insert.run(
      randomUUID(),
      s.userId,
      s.enteredAt.toISOString(),
      s.leftAt.toISOString(),
      durationSec,
    );
  }
});

insertMany(sessions);

console.log(`Inserted ${sessions.length} logs.`);
console.log("内訳:");
for (const u of USERS) {
  const count = sessions.filter(s => s.userId === u.id).length;
  console.log(`  ${u.name}: ${count} セッション`);
}

db.close();
