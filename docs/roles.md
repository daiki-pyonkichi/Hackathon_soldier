# 役割分担

> 3人で各自1スライスを担当。キャラ素材などのデザインは naganawa が兼務。
> 役割は重複OK・ペアプロ歓迎。詰まったらすぐ相談。

## 担当一覧

| 担当 | 役割 | 持ち物（このスライスを完成させる責任） |
| --- | --- | --- |
| **naganawa** | PM + **ログイン機能** + デザイン | 認証フロー全体（FE+BE）/ `/api/auth/*` / `/api/me` / `Login.tsx` / トークン保管 / ログアウト / PR レビュー / IP 実測 / デプロイ / キャラ素材(GIF) / アイコン素材 / デモ動画 |
| **tsutsumi** | **在室判定バックエンド** | DB（SQLite等）構築 / `/api/presence/*` 本実装 / IP 判定ロジック / タイムアウト処理（10分pingなしで自動退室） |
| **takebayashi** | **在室画面フロントエンド** | 在室一覧画面 / キャラ表示 / 1分 ping ループ / 手動チェックイン / PWA 設定 / レスポンシブ |

## スライスごとの境界

```
┌─────────────────────┐   ┌─────────────────────┐
│  ログイン機能         │   │  在室判定機能         │
│  (naganawa)         │   │  (tsutsumi+takebayashi) │
├─────────────────────┤   ├─────────────────────┤
│ POST /auth/login    │   │ POST /presence/ping │
│ POST /auth/signup   │   │ POST /presence/manual│
│ GET  /me            │   │ GET  /presence      │
│ Login.tsx           │   │ PresenceList.tsx    │
│ token保管(client.ts)│   │ Character.tsx       │
│ logout              │   │ usePresencePing.ts  │
│                     │   │ ManualCheckin.tsx   │
└─────────────────────┘   └─────────────────────┘
              ↑
              └ naganawa: キャラ素材(GIF) → frontend/public/avatars/
```

## 機能 × 担当マッピング

| 要件ID | 機能 | 主担当 | 副担当 |
| --- | --- | --- | --- |
| F-01 | ユーザー登録・ログイン | naganawa | tsutsumi（ユーザーテーブル設計を協力） |
| F-02 | Wi-Fi(IP) 在室判定 | tsutsumi | naganawa（IP実測） |
| F-03 | 手動チェックイン／アウト | tsutsumi（API）/ takebayashi（UI） | - |
| F-04 | 在室メンバー一覧表示 | takebayashi | naganawa（見取り図） |
| F-05 | キャラクター表示 | takebayashi（実装）/ naganawa（GIF素材） | tsutsumi |
| F-06 | 自動更新（1分ping） | takebayashi | tsutsumi |

## 詳しい手順は Notion の個別オンボーディングページへ

- 👤 naganawa: ログイン機能の作り方手順書（デザイン・キャラ素材の手順も含む）
- 👤 tsutsumi: presence API & DB の作り方手順書
- 👤 takebayashi: 在室画面の作り方手順書
