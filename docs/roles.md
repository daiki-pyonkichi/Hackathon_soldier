# 役割分担（叩き台案）

> 詳細は Notion の「ハッカソン(共同作業)」ページに反映。
> 役割は重複OK・ペアプロ歓迎。kuremoto はコーディング無し（デザイン専任）。

| 役割 | 担当 | 主な作業 |
| --- | --- | --- |
| **PM / フルスタック** | naganawa | 全体進行、要件調整、IP判定の実測と組み込み、デプロイ、レビュー、詰まりどころのヘルプ |
| **バックエンド** | tsutsumi | Express の API 実装、DB 接続（SQLite → 最終的に決める）、認証、`/api/presence/*` の本実装 |
| **フロントエンド（ロジック）** | takebayashi | React 画面全体、API クライアント、ping ループ、PWA 設定、ログイン画面 |
| **デザイン** | kuremoto | Canva でキャラ作成、成長/虐待の段階デザイン、アニメーション仕様（Lottie 検討）、見取り図のモック |

## 機能 × 担当マッピング

| 要件ID | 機能 | 主担当 | 副担当 |
| --- | --- | --- | --- |
| F-01 | ユーザー登録・ログイン | tsutsumi | naganawa |
| F-02 | Wi-Fi(IP) 在室判定 | tsutsumi | naganawa |
| F-03 | 手動チェックイン／アウト | tsutsumi | takebayashi |
| F-04 | 在室メンバー一覧表示 | takebayashi | kuremoto |
| F-05 | キャラクター表示 | takebayashi（実装）/ kuremoto（素材） | naganawa |
| F-06 | 自動更新（1分ping） | takebayashi | tsutsumi |

## 直近やること（Day 1〜2）

- [ ] **全員**：リポジトリを clone して `npm install` → `npm run dev` が動くまで確認（Notion の git ガイド参照）
- [ ] **naganawa**：研究室Wi-FiのグローバルIPを実測 → `backend/.env` に反映、技術選定空欄を埋める
- [ ] **tsutsumi**：DB 選定（SQLite or Firestore）。インメモリ store を本物の DB に置換
- [ ] **takebayashi**：PWA 設定の最終確認（manifest のアイコン PNG 作成）、エラートースト
- [ ] **kuremoto**：キャラの初期デザイン案、成長 vs 虐待の方向性たたき台、4キャラ分の素材スケッチ

## 「ソルジャーする」の状態変化（叩き台）

現在のコードでは絵文字に `💪 → 😅 → 💀` を当てているだけ。
kuremoto のデザインが上がってきたら以下のいずれかに差し替える。

- **成長案**：0〜1h 通常 / 1〜3h 元気 / 3〜6h 鍛えてる / 6h〜 オーラ
- **虐待案**：0〜1h 通常 / 1〜3h 疲れ顔 / 3〜6h ぐったり / 6h〜 やつれ・幽体離脱
