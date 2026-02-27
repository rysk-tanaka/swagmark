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

# lint（Biome + markdownlint 一括実行）
pnpm lint

# lint 自動修正
pnpm lint:fix

# Markdown のみ lint
pnpm lint:md

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
  - `opts`: `{ output, index, template }` — `output` は出力先ディレクトリ、`index` は `false` で README.md 生成スキップ、`template` はカスタムテンプレートディレクトリパス
- `templates/openapi3/` — widdershins の doT.js テンプレート群
  - `operation.dot` — エンドポイントを `<details>/<summary>` で囲み、badgers.space の HTTP メソッドバッジを付与
  - `code_shell.dot` — curl 例にリクエストボディ（`-d`）を自動付与
  - `main.dot` — HTML 見出しを Markdown 見出しに変換、スキーマセクションを `<details>` で折りたたみ化
- `examples/petstore/` — Petstore サンプル（入力 YAML + 変換結果）。`pnpm example` で再生成可能

## 技術スタック

- Node.js >= 20, ESM (`"type": "module"`)
- パッケージマネージャ: pnpm
- リンター / フォーマッター: Biome（`biome.json` の `!!` プレフィックスは Biome 2.x 公式の force-ignore 構文。スキャナーレベルでディレクトリを完全除外する。`!` とは異なる機能）
  - JS スタイル: ダブルクォート、セミコロン必須、trailing comma あり、インデント 2 スペース、行幅 80
- 主要依存: widdershins, commander, js-yaml
- テンプレートエンジン: doT.js（widdershins 内蔵）
- `pnpm.overrides` で `markdown-it` を `^14.1.0` に固定（widdershins の間接依存 `markdown-it@10` が Node.js 組み込み `punycode` を使用し非推奨警告が出るため）
- GitHub Actions: actions/checkout@v6, actions/setup-node@v6（いずれも正式リリース済み）
  - pnpm キャッシュを使う場合、`corepack enable pnpm` を `actions/setup-node`（`cache: pnpm`）より前に実行する必要がある

## コミット規約

- 英語で Conventional Commits 形式（`feat:`, `fix:`, `chore:` 等）
- コミットメッセージは単一行にする（マルチライン・HEREDOC 不可）

## テンプレート編集時の注意

doT.js 構文を使用。`{{= }}` で出力、`{{? }}` で条件分岐、`{{~ }}` でループ、`{{ }}` で JS 実行。テンプレート内で定義した変数は `defined_` プレフィックスで命名する慣習がある（例: `defined_badgeColor`）。

`<details>` 内の Markdown はブランクラインの位置に注意が必要（GitHub のレンダリング挙動がやや不安定）。詳細は `docs/design.md` を参照。

## 後処理（post-processing）

`convertFile()` 内で widdershins 出力に対して以下の後処理を行う。

1. RFC リンク除去 — `[text](https://tools.ietf.org/...)` → `text`
2. widdershins generator コメント除去
3. markdownlint 抑制コメント挿入 — `<!-- markdownlint-disable MD024 MD028 MD033 MD036 -->`
   - MD024（重複見出し）は `<details>` 内のエンドポイント毎に同じ見出し（Parameters, Responses）が繰り返されるため不可避
   - MD028（blockquote 内の空行）は widdershins 内部生成によるもので制御不可
   - MD033（インライン HTML）は `<details>/<summary>` や `<a>` タグの使用が必須
   - MD036（強調のみの行）は widdershins が生成するスキーマ見出し等で発生

markdownlint 抑制は二層構造で運用している。

- `.markdownlint-cli2.jsonc`（グローバル設定）— 本プロジェクトの開発者向けポリシー
- インライン抑制コメント（`convertFile()` で自動挿入）— `convert()` の出力先で markdownlint を実行するユーザー向け（`.markdownlint-cli2.jsonc` がない環境）

グローバル設定とインライン抑制でルールが重複するのは意図的な設計であり、冗長ではない。

## CI/CD

- `lint.yml` — push / PR で Biome（`biomejs/setup-biome@v2` で `pnpm install` 不要）と markdownlint（`lint-md` ジョブ）を自動実行
- `test.yml` — push / PR で `pnpm test` を自動実行
- `ci-auto-fix.yml` — "Test" ワークフロー失敗時に Claude が自動修正して PR ブランチにプッシュ（再帰防止: 直前コミットが `github-actions[bot]` ならスキップ）
- `claude.yml` — `@claude` メンションへの応答ワークフロー。`issue_comment`、`pull_request_review_comment`、`issues`、`pull_request_review` をトリガーに Claude Code を実行
- `claude-code-review.yml` — `claude-review` ラベル付き PR の自動コードレビュー（claude-code-action、オプトイン方式）
- `issue-scan.yml` — 日次 cron（09:50 JST / 00:50 UTC）+ `workflow_dispatch` で open issue をトリアージ。claude-haiku-4-5 で難易度判定（easy/medium/hard）し、ラベル付与とコメントを行う。easy は `claude-implement` ラベルを付与して自動実装ワークフローに連携
- `issue-implement.yml` — `claude-implement` ラベルが付与された open Issue を検知して Claude（opus）が自動実装。`implement-issue-{number}` ブランチ作成、コミット、PR 作成まで実行し、PR に `claude-review` ラベルを付与して `claude-code-review.yml` と連携。重複 PR ガード（本文のクローズキーワード + ブランチ名で判定）あり
- `dependabot-scan.yml` — `workflow_dispatch` で手動実行。`pnpm audit` で脆弱性を検出し、シェルスクリプトが依存チェーンを分析して対応方針（`pnpm.overrides` 追加等）を Issue に起票。解消済み Issue は自動クローズ
- ワークフロー共通規約 — git identity ステップ名は "Configure git identity"、`--allowed-tools` は最小権限（`Bash(git *)` や `Bash(pnpm *)` のようなワイルドカードは禁止、個別サブコマンドを指定）、ツール順序は `Read,Edit,Write,Glob,Grep` で統一
- `--allowed-tools` のパターンマッチ制約 — `Bash(...)` 内の `*` は改行を跨げない。`--body` や `-m` に改行を含むコマンドはマッチしないため、`--body-file` で一時ファイル経由にするか、単一行に制限する必要がある。また `*` は前方一致ではなく、許可パターンにないフラグ（例: `-u`）が挟まるとマッチしない
- claude-code-action を使うワークフローには `id-token: write` 権限が必須。`github_token` を明示指定しない場合、アクションは OIDC トークンを取得して Claude GitHub App のインストールトークンに交換する。`GITHUB_TOKEN` へのフォールバックはないため、この権限がないとアクション全体が失敗する
- GitHub App トークンの `workflows` 権限制限 — OIDC 経由のインストールトークンでは `.github/workflows/` 配下のファイルを push できない。ワークフローファイルを変更する issue は自動実装の対象外
- bot アクター連鎖と `allowed_bots` — issue-scan が `claude[bot]` としてラベル付与 → 後続ワークフローのトリガーアクターが bot になる。claude-code-action はデフォルトで bot アクターを拒否するため、連鎖するワークフローには `allowed_bots: "claude[bot]"` が必要
- Issue 自動対応フロー — `issue-scan.yml`（scan）→ `issue-implement.yml`（implement）→ `claude-code-review.yml`（review）の順で処理
- ラベル体系 — `claude-scanned` はトリアージ済みの印、`difficulty/*` は実装難易度（easy/medium/hard）、`claude-implement` は自動実装トリガー
- `auto-release.yml` — `package.json` の version 変更を検知し、以下を一連で実行
  - semver タグ（`v0.1.0`）と GitHub Release の自動作成（常に実行）
  - メジャーバージョンタグ (`v0`) の更新 — `vars.PUBLISH_ACTION == 'true'` で有効化
  - npm レジストリへの公開 — `vars.PUBLISH_NPM == 'true'` + `NPM_TOKEN` シークレットで有効化
  - Docker イメージの GHCR への push — `vars.PUBLISH_DOCKER == 'true'` で有効化
  - `workflow_dispatch` で手動再実行にも対応（既存タグは安全にスキップ）

リリースフロー: version bump → push to main → auto-release（タグ・Release 作成 → publish）

## 依存関係の自動更新

Renovate で npm、GitHub Actions、Dockerfile の依存を自動更新（毎週土曜 9:00 JST 前）。widdershins は最終リリースが 2020 年のため自動更新を無効化しており、手動チェックが必要。

## 配布形態

- npm パッケージ: `npx swagmark` / `npm install swagmark`
- GitHub Actions: `action.yml`（composite action）。`github.action_path` で自身の deps をインストールして CLI を実行
- Docker: `Dockerfile`（マルチステージビルド、node:24-slim）。ENTRYPOINT が `bin/cli.js`

## ライセンス管理

- `THIRD_PARTY_LICENSES` — `license-checker-rseidelsohn` で自動生成される npm 依存のライセンス情報（`--production` で本番依存のみ、`--limitAttributes` でパス情報を除外）
- `THIRD_PARTY_LICENSES.manual` — npm 外のサードパーティ素材（Petstore YAML 等）のライセンス情報。`pnpm update-licenses` で自動生成分の末尾に結合される
