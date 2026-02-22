# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

swagmark は OpenAPI YAML から GitHub プレビューで Swagger 風に見える Markdown を生成する Node.js CLI ツール。widdershins のカスタム doT.js テンプレートをコアとする。

## コマンド

```bash
# 依存関係インストール
pnpm install

# CLI 実行
node bin/cli.js <input.yaml> -o <output-dir>

# フォーマット
pnpm format
```

テストフレームワークは未導入。

## アーキテクチャ

- `bin/cli.js` — CLI エントリポイント。commander で引数をパースし `src/convert.mjs` の `convert()` を呼び出す
- `src/convert.mjs` — 変換ロジック本体。widdershins API にカスタムテンプレートとオプションを渡し、生成後に後処理（RFC リンク除去、generator コメント除去）を行う。タグ別ファイル + README.md（インデックス）を出力
- `templates/openapi3/` — widdershins の doT.js テンプレート群。主要なカスタマイズ箇所は以下の通り
  - `operation.dot` — エンドポイントを `<details>/<summary>` で囲み、badgers.space の HTTP メソッドバッジを付与
  - `code_shell.dot` — curl 例にリクエストボディ（`-d`）を自動付与
  - `main.dot` — スキーマセクションも `<details>` で折りたたみ化

## 技術スタック

- Node.js >= 18, ESM (`"type": "module"`)
- パッケージマネージャ: pnpm
- 主要依存: widdershins, commander, js-yaml
- テンプレートエンジン: doT.js（widdershins 内蔵）

## テンプレート編集時の注意

doT.js 構文を使用。`{{= }}` で出力、`{{? }}` で条件分岐、`{{~ }}` でループ、`{{ }}` で JS 実行。テンプレート内で定義した変数は `defined_` プレフィックスで命名する慣習がある（例: `defined_badgeColor`）。
