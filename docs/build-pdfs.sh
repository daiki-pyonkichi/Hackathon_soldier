#!/bin/bash
# 作業指南書を PDF に再生成するスクリプト。
# 前提: brew install pandoc (lualatex は TeXLive にあれば動く)
# 実行: ./docs/build-pdfs.sh

set -e
cd "$(dirname "$0")"
mkdir -p pdf

for name in naganawa tsutsumi takebayashi kuremoto; do
  echo "=== Generating $name.pdf ==="
  pandoc "guidebook-$name.md" \
    -o "pdf/guidebook-$name.pdf" \
    --pdf-engine=lualatex \
    --toc --toc-depth=2 \
    2>&1 | grep -v "Missing character" | grep -v "^$" || true
done

echo ""
echo "✅ 出力先: docs/pdf/"
ls -la pdf/
