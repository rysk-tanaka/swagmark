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

# テスト実行
pnpm test

# テスト（ウォッチモード）
pnpm test:watch

# 単一テストファイル実行
pnpm test test/convert.test.mjs

# 特定の describe/test のみ実行
pnpm test -- -t "HTTPメソッドバッジ"

# カバレッジ計測
pnpm test:coverage

# スナップショット更新（テンプレート変更後に必要）
pnpm test -- -u

# THIRD_PARTY_LICENSES 更新（license-checker + 手動分の結合）
pnpm update-licenses
```

テストフレームワーク: Vitest（`test/` ディレクトリ、フィクスチャは `test/fixtures/`）

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
- `src/convert.mjs` — 変換ロジック本体。`export async function convert(input, opts)` を公開。ライブラリとしても利用可能な設計のため、エラーは `throw` で伝播させる（`process.exit` 禁止）。戻り値は `undefined`（結果はファイルに書き出す設計）。テストでは一時ディレクトリに出力後ファイルを読み込んで検証する
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
- `pnpm.overrides` で `markdown-it` を `^14.1.0` に固定（widdershins の間接依存 `markdown-it@10` が Node.js 組み込み `punycode` を使用し非推奨警告が出るため）
- GitHub Actions: actions/checkout@v6, actions/setup-node@v6（いずれも正式リリース済み）

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

## CI/CD

- `test.yml` — push / PR で `pnpm test` を自動実行
- `ci-auto-fix.yml` — "Test" ワークフロー失敗時に Claude が自動修正して PR ブランチにプッシュ（再帰防止: 直前コミットが `github-actions[bot]` ならスキップ）
- `claude-code-review.yml` — `claude-review` ラベル付き PR の自動コードレビュー（claude-code-action、オプトイン方式）
- claude-code-action を使うワークフローには `id-token: write` 権限が必須。`github_token` を明示指定しない場合、アクションは OIDC トークンを取得して Claude GitHub App のインストールトークンに交換する。`GITHUB_TOKEN` へのフォールバックはないため、この権限がないとアクション全体が失敗する
- `auto-release.yml` — `package.json` の version 変更を検知し、以下を一連で実行
  - semver タグ（`v0.1.0`）と GitHub Release の自動作成（常に実行）
  - メジャーバージョンタグ (`v0`) の更新 — `vars.PUBLISH_ACTION == 'true'` で有効化
  - npm レジストリへの公開 — `vars.PUBLISH_NPM == 'true'` + `NPM_TOKEN` シークレットで有効化
  - Docker イメージの GHCR への push — `vars.PUBLISH_DOCKER == 'true'` で有効化
  - `workflow_dispatch` で手動再実行にも対応（既存タグは安全にスキップ）

リリースフロー: version bump → push to main → auto-release（タグ・Release 作成 → publish）

## 配布形態

- npm パッケージ: `npx swagmark` / `npm install swagmark`
- GitHub Actions: `action.yml`（composite action）。`github.action_path` で自身の deps をインストールして CLI を実行
- Docker: `Dockerfile`（マルチステージビルド、node:24-slim）。ENTRYPOINT が `bin/cli.js`

## ライセンス管理

- `THIRD_PARTY_LICENSES` — `license-checker-rseidelsohn` で自動生成される npm 依存のライセンス情報（`--production` で本番依存のみ、`--limitAttributes` でパス情報を除外）
- `THIRD_PARTY_LICENSES.manual` — npm 外のサードパーティ素材（Petstore YAML 等）のライセンス情報。`pnpm update-licenses` で自動生成分の末尾に結合される
