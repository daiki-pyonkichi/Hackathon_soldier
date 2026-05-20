# Git 作業ガイド（初心者向け）

> 詳細・図解は Notion の「Git 作業ガイド（初心者向け）」ページが本体。
> このファイルは Notion ページの簡易ミラーです。

## 0. 一度だけやること

```bash
# 名前とメールを設定（コミットに残る）
git config --global user.name  "あなたの名前"
git config --global user.email "あなたのメール"

# 改行コードのトラブル防止（Mac/Linux）
git config --global core.autocrlf input
```

## 1. リポジトリを clone（コピー）する

```bash
cd ~/Desktop
git clone https://github.com/luida-naganawa/Hackathon_soldier.git
cd Hackathon_soldier
```

## 2. 作業前に main を最新にする

```bash
git switch main
git pull origin main
```

## 3. ブランチを切って作業する

ブランチ名のルール: `feature/担当_やること` または `fix/...`

```bash
git switch -c feature/tsutsumi_presence-api
```

## 4. コードを書く → 変更を確認 → コミット

```bash
git status                       # 何が変わったか
git diff                         # 中身を確認
git add <ファイル>                 # ステージング
git commit -m "feat: ping API 実装"
```

コミットメッセージは `[Prefix]: 内容` 形式：

| Prefix | 用途 |
| --- | --- |
| feat | 新機能 |
| fix | バグ修正 |
| docs | ドキュメント |
| refactor | リファクタ |
| chore | 設定や雑用 |

## 5. push する（GitHub に送る）

```bash
git push -u origin feature/tsutsumi_presence-api
```

## 6. Pull Request を作る

GitHub 上で `Compare & pull request` を押す → タイトルと本文を書く → 作成。
他のメンバー（最低1人）からレビュー&approve → main にマージ。

## 7. マージ後の片付け

```bash
git switch main
git pull origin main
git branch -d feature/tsutsumi_presence-api
```

## 困ったら

- `git status` を見て深呼吸
- 何かを「消す」コマンドは打つ前に slack/notion で相談
- 詰まったら naganawa に丸投げ OK
