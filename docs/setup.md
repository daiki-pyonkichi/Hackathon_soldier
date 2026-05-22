# 環境構築完全ガイド

> ゴール: ターミナルで `npm run dev` したらブラウザでアプリが開く状態を作る。30〜60分。

## 0. もの一覧

| ソフト | 用途 | バージョン |
| --- | --- | --- |
| Node.js | JavaScriptをPCで動かす | **20.x または 22.x (LTS)** |
| npm | パッケージ管理 | **10.x 以上** (Node.js付属) |
| Git | コード共有 | 2.30+ |
| VS Code (or Cursor) | エディタ | 最新 |
| Chrome (or Edge) | 動作確認用ブラウザ | 最新 |

## 1. Node.js を入れる

### 方法A: 公式インストーラー（一番楽）

https://nodejs.org/ から **LTS版** (v20 または v22) をダウンロードしてインストール。

### 方法B: nvm を使う（複数バージョンを切り替えたい人向け）

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# ターミナル開き直してから
nvm install 20
nvm use 20
```

### 確認

```bash
node --version    # v20.x.x と出ればOK
npm --version     # 10.x.x と出ればOK
```

⚠️ v18以下だと一部動かない。v20以上に。

## 2. Git の初期設定

```bash
git --version
```

「command not found」と言われたら:

```bash
xcode-select --install
```

名前とメール:

```bash
git config --global user.name  "あなたの名前"
git config --global user.email "GitHubと同じメール"
```

## 3. VS Code を入れる

https://code.visualstudio.com/ からインストール。

### 推奨拡張機能

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier - Code formatter** (`esbenp.prettier-vscode`)
- **GitLens**
- **Material Icon Theme**

### コマンドラインからVS Codeを開けるようにする

VS Codeを開いて ⌘+Shift+P → `shell command: install "code" command in PATH` を選択。

```bash
code .   # カレントディレクトリをVS Codeで開く
```

## 4. リポジトリを clone

```bash
cd ~/Desktop
git clone https://github.com/luida-naganawa/Hackathon_soldier.git
cd Hackathon_soldier
code .   # VS Code で開く
```

## 5. 依存パッケージをインストール

**ターミナルを2つ開いて** それぞれで実行。

```bash
# ターミナル①: backend
cd backend
npm install
```

```bash
# ターミナル②: frontend
cd frontend
npm install
```

初回は3〜5分かかる。`node_modules/` フォルダができる。

## 6. 起動してみる

```bash
# ターミナル①: backend
cd backend
npm run dev
# [backend] listening on http://localhost:3001 と出ればOK
```

```bash
# ターミナル②: frontend
cd frontend
npm run dev
#   VITE v5.x.x  ready in xxx ms
#   ➜  Local:   http://localhost:5173/
```

ブラウザで http://localhost:5173 を開く。ログイン画面が見える。
名前に `naganawa` と入れてログイン → ホーム画面でキャラクターが並ぶ。

🎉 これでセットアップ完了。

## 7. よくあるトラブル

### npm install で「EACCES」「permission denied」

```bash
sudo chown -R $(whoami) ~/.npm
```

### npm run dev で「EADDRINUSE」（ポート使用中）

別の何かが既に3001/5173を使ってる。

```bash
lsof -i :3001
kill <PID>
```

### frontend は出るが API エラーになる

backend が起動しているか確認。`http://localhost:3001/api/health` をブラウザで開いて `{"ok":true}` と出ればOK。

### npm install で「node-gyp」関連のエラー

Xcode CLT が入ってない。`xcode-select --install` を実行。

### 「cannot find module ...」と出る

```bash
rm -rf node_modules package-lock.json
npm install
```

## 8. ここまでできたら次へ

- ✅ Node.js, npm, Git, VS Code が入った
- ✅ リポジトリを clone した
- ✅ `npm install` が両方で成功した
- ✅ ブラウザでログイン画面が見え、キャラが並んだ

次は `docs/development-order.md` を見て、作業の順番とすり合わせのタイミングを把握しよう。
