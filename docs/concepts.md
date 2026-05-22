# Web開発の基本概念（はじめての人向け）

> 30分で読めるサイズに収めました。コードは書きません、概念だけ。

## 1. クライアントとサーバー

Webアプリには登場人物が3人います。

```
【クライアント】         【サーバー】              【データベース】
  ブラウザ        ⇄        Node.js          ⇄        SQLite等
  React画面                Express                  データ保管
  (frontend/)              (backend/)
```

- **クライアント**: ユーザーが見ている画面。スマホやPCのブラウザ上で動く。今回は **React + TypeScript**。
- **サーバー**: 裏で動いているコンピューター。データを読み書きしたり、難しい計算をしたり。今回は **Node.js + Express**。
- **データベース**: データをずっと保存しておくところ。今回は **SQLite or Firestore（今後選定）**。

**たとえ話**: レストランで考えると、クライアント=お客、サーバー=ウェイター、DB=冷蔵庫。

## 2. HTTP と API

クライアントとサーバーは **HTTP** というルールで会話する。

- **リクエスト**: クライアント → サーバー に送る。「在室者一覧ちょうだい」
- **レスポンス**: サーバー → クライアント に返す。「ん〜、現在以下の人が在室だよ」

**HTTPメソッド**:

| メソッド | 意味 | 例 |
| --- | --- | --- |
| GET | データを取得 | 在室者一覧をもらう |
| POST | データを送る/作る | ログイン、チェックイン |
| PUT/PATCH | 更新 | 今回はほぼ使わない |
| DELETE | 削除 | 今回は使わない |

**API**: サーバーが「このURLを叩いたらこのデータを返すよ」と提供する窓口。今回の例:

```
POST /api/auth/login    → ログインを試みる
POST /api/presence/ping → 「今ここにいるよ」と伝える
GET  /api/presence      → 誰が在室中かをもらう
```

## 3. JSON

クライアントとサーバーの間で流れるデータの形式。

```json
{
  "user": { "id": "u-naganawa", "name": "naganawa" },
  "isPresent": true,
  "enteredAt": "2026-05-21T09:30:00Z"
}
```

ルール: キーはダブルクオートで囲む / 文字列もダブルクオート / 数値・真偽値はそのまま / カンマ区切り / 最後にカンマを付けない。

## 4. localhost とポート

ローカル開発では、自分のPCの中でサーバーもクライアントも動かす。

- **localhost** = 「このPC自身」を表す言葉 = `127.0.0.1`
- **ポート** = 1つのPCにサーバーを複数起動するための「部屋番号」

今回の間取り:

- バックエンド → http://localhost:3001
- フロントエンド → http://localhost:5173

バックエンドとフロントエンドは、ターミナルを2つ開いてリアルタイムに両方起動した状態で作業する。

## 5. Node.js とは

- もともと JavaScript はブラウザの中でだけ動く言語だった
- Node.js は「ブラウザの外、PC の上で JavaScript を動かせるようにしたもの」
- これにより JavaScript でサーバーも書けるようになった

今回の例えば: `node --version` で v20.x と出ればOK。backend フォルダで `npm run dev` と打つと Node.js が backend/src/index.ts を起動してサーバーになる。

## 6. npm と package.json

- **npm** = Node Package Manager。他人が作ったライブラリをダウンロードして使う道具
- **package.json** = 「このプロジェクトはどのライブラリのどのバージョンを使う」を書いた設計図
- **node_modules/** = ダウンロードされたライブラリたちの隠し部屋（gitignore済み）

よく使うコマンド:

```bash
npm install              # package.json に書いてあるライブラリを全部入れる
npm install react        # 新しいライブラリを追加する
npm run dev              # package.json の scripts に書いてある dev を実行
npm run build            # 本番用ビルド
npx <コマンド>            # 1回だけライブラリを使う
```

## 7. TypeScript とは

- JavaScript + **型** = TypeScript
- 型 = 「この変数には文字列しか入らないよ」という制約を事前に書いておく
- 実行する前にミスを見つけてくれるので便利

```typescript
// JavaScript
function add(a, b) { return a + b; }
add("1", 2);    // "12" となってしまうバグが起きうる

// TypeScript
function add(a: number, b: number): number { return a + b; }
add("1", 2);    // エディタが赤い波線を引いてエラーを教えてくれる
```

型の記述例:

```typescript
const name: string = "naganawa";
const age: number = 24;
const isPresent: boolean = true;
const users: string[] = ["naganawa", "tsutsumi"];

interface User {
  id: string;
  name: string;
  avatarId: string;
}
const me: User = { id: "u1", name: "naganawa", avatarId: "soldier-blue" };
```

## 8. React と JSX/TSX

- **React** = 画面を作るためのライブラリ
- **JSX** = HTMLをJavaScriptの中に直接書けるようにした拡張記法
- **TSX** = TypeScript版のJSX。今回はこれ

画面を **コンポーネント** に分けて作る。コンポーネント = 画面の部品。

```tsx
function Hello({ name }: { name: string }) {
  return <h1>こんにちは {name} さん</h1>;
}

// 使い方
<Hello name="naganawa" />
```

React のポイント:

- `useState` = 画面上の「状態」を持つようにする
- `useEffect` = 「読み込み時」や「何かが変わったとき」に処理を走らせる

詳しくは担当者ごとのオンボーディングページに。

## 9. PWA とは

- Progressive Web App。**ホーム画面に追加してアプリ然に使えるWebサイト**
- iOS/Android のストア審査不要
- 今回は Vite の PWA プラグインを入れてあるので、manifest.json と アイコンを用意するだけで動く

## 10. さらっと読もう git

- **git** = コードの履歴を残し、複数人で同じコードをいじるためのツール
- **GitHub** = git のデータをクラウドに置いて共有できるサービス
- 今回のリポジトリ: https://github.com/luida-naganawa/Hackathon_soldier

使い方の詳細は Notion の Git 作業ガイドへ。

## 11. 今回のアプリが動く仕組みを一枚で

```
ユーザー → ブラウザ(React) → POST /api/auth/login → サーバー(Express) → DB
                                                   ← user + token
       ← localStorage にtoken保存

loop 1分ごと:
  React → POST /api/presence/ping → Express → IPチェック → DB
       ← { isPresent, ... }

ユーザー → ブラウザ → GET /api/presence → Express → DB
                                                ← 在室者一覧
       ← キャラ表示
```

---

## 📝 ここまで読んだら

概念がよくわからなくてもOK。コードを書いて動かして見ると一気になじむ。次は `docs/setup.md` を見てローカルでアプリを起動してみよう。
