# LabSoldier (Hackathon_soldier)

研究室にいるかどうかをキャラクターの挙動で共有する PWA アプリ。
サポーターズ主催のハッカソン製作物。

## 構成

```
.
├── frontend/   # Vite + React + TypeScript (PWA)
├── backend/    # Node.js + Express + TypeScript
└── docs/       # 開発ガイド・ドキュメント
```

## 必要なもの

- Node.js 20+
- npm 10+
- Git

## はじめての人へ

このリポジトリで作業する流れは [docs/git-guide.md](docs/git-guide.md) または
Notion の「Git 作業ガイド（初心者向け）」ページを必ず読んでから始めてください。

## セットアップ

ターミナルを 2 つ開いて、それぞれで以下を実行します。

### 1. バックエンド

```bash
cd backend
npm install
npm run dev
```

→ http://localhost:3001 で API が立ち上がります。

### 2. フロントエンド

```bash
cd frontend
npm install
npm run dev
```

→ http://localhost:5173 で画面が開きます。

## API エンドポイント（叩き台）

| Method | Path                    | 説明                                       |
| ------ | ----------------------- | ------------------------------------------ |
| POST   | /api/auth/login         | ログイン（モック実装）                     |
| POST   | /api/auth/signup        | ユーザー登録（モック実装）                 |
| GET    | /api/me                 | 自分の情報取得                             |
| POST   | /api/presence/ping      | 在室状態の更新（サーバー側で IP 判定）     |
| POST   | /api/presence/manual    | 手動 checkin / checkout                    |
| GET    | /api/presence           | 現在の在室者一覧                           |

詳細は Notion の要件定義ページを参照。

## ステータス

🚧 叩き台レベル。各機能の中身はチーム各自で実装していきます。
