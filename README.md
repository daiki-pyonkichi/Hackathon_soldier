# LabSoldier (Hackathon_soldier)

研究室にいるかどうかをキャラクターの挙動で共有する PWA アプリ。
サポーターズ主催のハッカソン製作物。jidjfijidjfsjifjdijsfi


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

**読む順番**:

1. `docs/concepts.md` — Web アプリの基本概念（30分で読める）
2. `docs/setup.md` — 環境構築完全ガイド
3. `docs/git-guide.md` — git の使い方
4. `docs/development-order.md` — 開発の進め方
5. `docs/guidebook-{あなたの名前}.pdf` — 自分の担当の手順書（PDF）

`docs/pdf/` に作業指南書PDFが入っています。

PDFを再生成したい時:

```bash
brew install pandoc      # 一度だけ
./docs/build-pdfs.sh
```

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
