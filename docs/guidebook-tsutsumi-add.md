---
title: "LabSoldier 作業指南書 補遺 — tsutsumi (3状態判定への移行)"
author: "Hackathon Soldier Team"
date: 2026-05-26
documentclass: ltjsarticle
geometry: margin=18mm
fontsize: 11pt
mainfont: "Hiragino Sans"
monofont: "Menlo"
---

# 補遺の位置づけ

この補遺は **元の作業指南書（tsutsumi 在室判定バックエンド担当）への追記** です．会議での設計確定を受けて，以下の点で元の方針を更新します．

- 在室判定を **2状態（在室/不在）→ 3状態（在室/不明/不在）** へ変更
- タイムアウト処理の意味を **「10分で自動退室」→「30分で不在確定」** に変更
- 新規ファイル `backend/src/lib/judge.ts` を追加
- `GET /api/presence` のレスポンスに `status` フィールドを追加
- frontend からの ping 間隔は **15分** で運用

元の指南書のステップ番号に対応する形で，変更点と追加コードを示します．元のステップ0〜6（ブランチ作成，DBセットアップ，store.ts 置き換え，IP判定）はそのまま使えます．

---

# 第7部 3状態判定への移行

## 7.1 なぜ3状態にするのか

「在室/不在」の2値だけだと，「最後に確認できたのが10分前」のユーザーをどちらに分類するかが曖昧になる．3状態にすれば，

- **present（在室）**: 5分以内に研究室Wi-Fi経由で ping が来ている．確実に在室
- **unknown（不明）**: 30分以内に ping は来ているが，新しすぎるわけでもない．いるかもしれない
- **absent（不在）**: 30分以上 ping なし．不在とみなしてよい

…という形で，**不確実性をUIで正直に表現できる**．発表でも「誤検出を減らした設計判断」として語れる．

## 7.2 担当範囲の更新（元の 2.1 を更新）

| ファイル | やること |
| --- | --- |
| `backend/src/db/store.ts` | インメモリ → SQLite に置き換え（元のまま） |
| `backend/src/db/database.ts` (新規) | SQLite初期化（元のまま） |
| `backend/src/middleware/ipCheck.ts` | LAB_ALLOWED_IPS を `.env` から読み込み（元のまま） |
| `backend/src/routes/presence.ts` | DB を使うように本実装 ＋ **`status` フィールドを返す** |
| `backend/src/lib/judge.ts` (新規) | **★追加: 3状態判定関数** |
| `backend/src/lib/timeout.ts` (新規) | **30分以上pingがないユーザーの `entered_at` をクリア** |
| `backend/.env` (作る) | `LAB_ALLOWED_IPS`, `PORT`, `JWT_SECRET`（元のまま） |

---

# 第8部 judge.ts の実装（新規）

## 8.1 ファイルの目的

`last_seen_at` と `isPresent` と `source` から，3状態を返す純粋関数を1つだけ持つ．**DB アクセスを含まない**ことで，テストもしやすく，他のコードからも呼びやすくなる．

## 8.2 実装

`backend/src/lib/judge.ts`（新規）:

```typescript
import type { Presence } from "../types.js";

export type PresenceStatus = "present" | "unknown" | "absent";

const PRESENT_THRESHOLD_MIN = 5;   // 5分以内のping＋研究室IP → 在室
const UNKNOWN_THRESHOLD_MIN = 30;  // 30分以内のping → 不明

export function judgeStatus(p: Presence): PresenceStatus {
  // 手動チェックイン中は無条件で在室
  if (p.source === "manual" && p.isPresent) return "present";

  // 一度も ping が来ていない
  if (!p.lastSeenAt) return "absent";

  const elapsedMin =
    (Date.now() - new Date(p.lastSeenAt).getTime()) / 60000;

  if (elapsedMin < PRESENT_THRESHOLD_MIN && p.isPresent) return "present";
  if (elapsedMin < UNKNOWN_THRESHOLD_MIN) return "unknown";
  return "absent";
}

// 「○分前確認」を出すための補助関数（frontend に値を返すだけ）
export function elapsedMinutes(lastSeenAt: string | null): number | null {
  if (!lastSeenAt) return null;
  return Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 60000);
}
```

## 8.3 設計上のポイント

- **しきい値はファイル先頭の定数にまとめる**．会議で「やっぱり10分にしたい」となっても1ヶ所書き換えるだけ
- `judgeStatus` は **同じ入力に対して同じ出力を返さない**（`Date.now()` を使っているため）．これは仕様．テストするときは Date をモックする
- `elapsedMinutes` は frontend で「○分前」を表示するために使う

---

# 第9部 timeout.ts の変更（元のステップ7を更新）

## 9.1 何が変わるか

**元の設計**: 10分pingがないユーザーを `is_present = 0` に自動退室させていた．

**新しい設計**: 状態判定は `judge.ts` が動的に行うので，DB の `is_present` を自動で書き換える必要はない．ただし，`entered_at`（入室時刻）が古いまま残ると「滞在時間 3日」のような変な表示になるので，**30分以上 ping がないユーザーの `entered_at` だけクリア**する．

## 9.2 実装

`backend/src/lib/timeout.ts`（新規／元のステップ7から変更）:

```typescript
import { db } from "../db/database.js";

const STALE_THRESHOLD_MS = 30 * 60 * 1000;  // 30分

// 30分pingがないユーザーの entered_at をクリア
// （is_present は触らず，judge.ts が動的判定するため）
export function startTimeoutSweep() {
  const stmt = db.prepare(`
    UPDATE presence
    SET entered_at = NULL
    WHERE source = 'wifi'
      AND entered_at IS NOT NULL
      AND last_seen_at IS NOT NULL
      AND (julianday('now') - julianday(last_seen_at)) * 86400 * 1000 > ?
  `);

  setInterval(() => {
    const result = stmt.run(STALE_THRESHOLD_MS);
    if (result.changes > 0) {
      console.log(`[timeout] cleared entered_at for ${result.changes} stale user(s)`);
    }
  }, 60 * 1000);  // 1分ごとにチェック
}
```

`backend/src/index.ts` への組み込みは元のまま:

```typescript
import { startTimeoutSweep } from "./lib/timeout.js";
// app.listen() の後に
startTimeoutSweep();
```

## 9.3 「自動退室」をやめた理由

- 状態判定が動的（`judge.ts` で計算）になったので，DB の `is_present` を書き換える必要がない
- 書き換えないことで，**「ping が再開したら自動で在室復帰」**が自然に動く．元の設計だと自動退室された後の復帰タイミングが曖昧だった
- `source = 'manual'` のレコードは触らない．手動チェックインは明示的にユーザーが解除するまで残る

---

# 第10部 presence.ts ルートの変更

## 10.1 何が変わるか

`GET /api/presence` のレスポンスに `status` と `lastSeenAt` を含める．frontend が3グループ表示するために必要．

## 10.2 実装イメージ

`backend/src/routes/presence.ts` 内の `GET /` ハンドラ:

```typescript
import { judgeStatus, elapsedMinutes } from "../lib/judge.js";

presenceRouter.get("/", (req, res) => {
  const presences = store.listPresences();
  const users = store.listUsers();

  const view = users.map((u) => {
    const p = presences.find((x) => x.userId === u.id);
    const presence: Presence = p ?? {
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
      status: judgeStatus(presence),
      lastSeenAt: presence.lastSeenAt,
      elapsedMin: elapsedMinutes(presence.lastSeenAt),
      enteredAt: presence.enteredAt,
    };
  });

  res.json({ presences: view });
});
```

レスポンスの例:

```json
{
  "presences": [
    {
      "userId": "u-naganawa",
      "name": "naganawa",
      "avatarId": "soldier-blue",
      "status": "present",
      "lastSeenAt": "2026-05-26T08:32:10.000Z",
      "elapsedMin": 1,
      "enteredAt": "2026-05-26T06:30:00.000Z"
    },
    {
      "userId": "u-takebayashi",
      "name": "takebayashi",
      "avatarId": "soldier-green",
      "status": "unknown",
      "lastSeenAt": "2026-05-26T08:21:00.000Z",
      "elapsedMin": 12,
      "enteredAt": null
    }
  ]
}
```

## 10.3 ping エンドポイントは変更不要

`POST /api/presence/ping` 側は元のまま．`last_seen_at` を更新するだけでよい．`status` 判定は GET 時にだけ行う．

---

# 第11部 動作確認の更新（元のステップ9を更新）

## 11.1 status フィールドの確認

```bash
# ping を1回打つ
curl -X POST http://localhost:3001/api/presence/ping \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{}'

# 直後に GET → status: "present" のはず
curl http://localhost:3001/api/presence | jq '.presences[] | {name, status, elapsedMin}'
# →
# {"name": "tsutsumi", "status": "present", "elapsedMin": 0}
```

## 11.2 状態遷移のテスト

時刻を進めるのは大変なので，しきい値を一時的に小さくしてテストする．

`backend/src/lib/judge.ts` の冒頭を一時書き換え:

```typescript
const PRESENT_THRESHOLD_MIN = 0.1;   // 6秒
const UNKNOWN_THRESHOLD_MIN = 0.5;   // 30秒
```

その後:

```bash
# ping を1回打つ
curl -X POST .../ping ...
sleep 1 && curl .../api/presence  # present
sleep 10 && curl .../api/presence # unknown になっているはず
sleep 30 && curl .../api/presence # absent になっているはず
```

確認できたら本来の値（5, 30）に戻す．

---

# 第12部 frontend 担当への申し送り事項

tsutsumi の作業範囲外だが，連携のために伝えておく．

## 12.1 ping は15分間隔

frontend は `setInterval` で15分ごとに `POST /api/presence/ping` を打つ．

理由:

- present の閾値は5分．ping間隔をそれより短くしたいが，1分だとサーバー負荷とログがうるさい
- 15分間隔 × present閾値5分にすると，「直前のpingから5分以上経つと一時的に unknown に落ちる」という挙動になる
- それで困らない．むしろ「ブラウザがフリーズしているかも」が UI で見えるのは良いこと

逆に「present 状態を常に維持したい」なら ping間隔を3分などに短くする．会議で議論する余地あり．

## 12.2 frontend types の更新

frontend 側で必要な型定義:

```typescript
// frontend/src/types.ts
export type PresenceStatus = "present" | "unknown" | "absent";

export interface PresenceView {
  userId: string;
  name: string;
  avatarId: string;
  status: PresenceStatus;
  lastSeenAt: string | null;
  elapsedMin: number | null;
  enteredAt: string | null;
}
```

---

# 第13部 PR メッセージのテンプレ

```
feat(backend): 在室判定を3状態化（present/unknown/absent）

- judge.ts: しきい値ベースの状態判定関数を追加（5分/30分）
- presence.ts: GET レスポンスに status, lastSeenAt, elapsedMin を追加
- timeout.ts: 自動退室をやめ，stale な entered_at のクリアに変更
- frontend からは引き続き POST /ping を15分間隔で送る想定

Refs: 設計計画書 §3 (3状態判定ロジック)
```

---

# まとめ

元の指南書の DB / SQLite / IP判定の知識はそのまま使える．今回の変更は「**判定ロジックを `judge.ts` に切り出して，GET時に動的計算する**」という1点に尽きる．コード量も少なく，ロジックも単純なので，元の手順を終えたあとに数十分で追加できる．

困ったらすぐLINEで相談．