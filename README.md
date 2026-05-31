# LabSoldier (Hackathon_soldier)

研究室にいるかどうかをキャラクターの挙動で共有する PWA アプリ。
サポーターズ主催のハッカソン製作物。

- 🌐 本番URL: https://161.33.21.136.sslip.io
- 📄 技術仕様書: [docs/SPEC.md](docs/SPEC.md)（構成・DB・API・デプロイの詳細）

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

## API エンドポイント

| Method | Path                    | 認証 | 説明                                   |
| ------ | ----------------------- | ---- | -------------------------------------- |
| POST   | /api/auth/login         | 不要 | ログイン → user + token                |
| POST   | /api/auth/signup        | 不要 | ユーザー登録（avatarId選択可）          |
| GET    | /api/me                 | 要   | 自分の情報取得                          |
| POST   | /api/presence/ping      | 要   | 在室状態の更新（サーバー側で IP 判定）  |
| POST   | /api/presence/leave     | 要   | 明示的に退室（以降pingを無視）          |
| POST   | /api/presence/resume    | 要   | 退室解除（自動判定を再開）              |
| GET    | /api/presence           | 要   | 現在の在室者一覧（status/hp付き）       |
| GET    | /api/stats/ranking      | 要   | 在室時間ランキング                      |
| GET    | /api/logs               | 要   | 在室履歴                                |

詳細・DB スキーマ・在室判定ロジック・デプロイ構成は [docs/SPEC.md](docs/SPEC.md) を参照。

## デプロイ / 更新

本番は Oracle Cloud VM（systemd + Caddy + HTTPS）。コード更新後の再デプロイは:

```bash
./deploy/redeploy.sh        # 最新をrsync → VMで再ビルド → サービス再起動
```

詳細は [docs/SPEC.md#8-デプロイ構成](docs/SPEC.md) を参照。
