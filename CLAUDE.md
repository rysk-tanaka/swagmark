# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

swagmark は OpenAPI YAML から GitHub プレビューで Swagger 風に見える Markdown を生成する Node.js CLI ツール。widdershins のカスタム doT.js テンプレートをコアとする。

## コマンド

```bash
# 依存関係インストール
pnpm install

# CLI 実行（単一ファイルまたはディレクトリを指定可能）
node bin/cli.js <input> -o <output-dir>

# Petstore サンプルで動作確認
pnpm example

# フォーマット
pnpm format

# THIRD_PARTY_LICENSES 更新（license-checker + 手動分の結合）
pnpm update-licenses
```

テストフレームワークは未導入。

## アーキテクチャ

```text
bin/cli.js (commander で引数パース)
  → src/convert.mjs::convert(input, opts)
    → statSync で入力判定（ファイル or ディレクトリ）
    → convertFile() でファイル毎に変換
      → js-yaml で YAML パース
      → widdershins.convert(spec, options) に カスタムテンプレート を渡す
      → 後処理（RFC リンク除去、generator コメント除去、markdownlint 抑制コメント挿入）
      → .md ファイル出力
    → generateIndex() で README.md（エンドポイント一覧）を生成
```

- `bin/cli.js` — CLI エントリポイント。`package.json` からバージョンを動的読み込み。`convert()` の例外を try-catch で受けて `process.exit(1)` するのは CLI 側の責務
- `src/convert.mjs` — 変換ロジック本体。`export async function convert(input, opts)` を公開。ライブラリとしても利用可能な設計のため、エラーは `throw` で伝播させる（`process.exit` 禁止）
- `templates/openapi3/` — widdershins の doT.js テンプレート群
  - `operation.dot` — エンドポイントを `<details>/<summary>` で囲み、badgers.space の HTTP メソッドバッジを付与
  - `code_shell.dot` — curl 例にリクエストボディ（`-d`）を自動付与
  - `main.dot` — HTML 見出しを Markdown 見出しに変換、スキーマセクションを `<details>` で折りたたみ化
- `examples/petstore/` — Petstore サンプル（入力 YAML + 変換結果）。`pnpm example` で再生成可能

## 技術スタック

- Node.js >= 18, ESM (`"type": "module"`)
- パッケージマネージャ: pnpm
- 主要依存: widdershins, commander, js-yaml
- テンプレートエンジン: doT.js（widdershins 内蔵）

## テンプレート編集時の注意

doT.js 構文を使用。`{{= }}` で出力、`{{? }}` で条件分岐、`{{~ }}` でループ、`{{ }}` で JS 実行。テンプレート内で定義した変数は `defined_` プレフィックスで命名する慣習がある（例: `defined_badgeColor`）。

`<details>` 内の Markdown はブランクラインの位置に注意が必要（GitHub のレンダリング挙動がやや不安定）。詳細は `docs/design.md` を参照。

## 後処理（post-processing）

`convertFile()` 内で widdershins 出力に対して以下の後処理を行う。

1. RFC リンク除去 — `[text](https://tools.ietf.org/...)` → `text`
2. widdershins generator コメント除去
3. markdownlint 抑制コメント挿入 — `<!-- markdownlint-disable MD024 MD028 -->`
   - MD024（重複見出し）は `<details>` 内のエンドポイント毎に同じ見出し（Parameters, Responses）が繰り返されるため不可避
   - MD028（blockquote 内の空行）は widdershins 内部生成によるもので制御不可

## ライセンス管理

- `THIRD_PARTY_LICENSES` — `license-checker-rseidelsohn` で自動生成される npm 依存のライセンス情報（`--production` で本番依存のみ、`--limitAttributes` でパス情報を除外）
- `THIRD_PARTY_LICENSES.manual` — npm 外のサードパーティ素材（Petstore YAML 等）のライセンス情報。`pnpm update-licenses` で自動生成分の末尾に結合される
