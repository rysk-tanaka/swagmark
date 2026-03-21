# GitHub Actions ワークフロー一覧

このディレクトリにあるワークフローを用途別に整理した一覧です。

## 外部ワークフロー参照

汎用的なワークフローとアクションは [rysk-tanaka/workflows](https://github.com/rysk-tanaka/workflows) リポジトリに移設しています。

| 外部リソース | 用途 |
| --- | --- |
| `release-on-version-change.yml` | バージョン変更時のタグ作成と Release 作成 |
| `claude.yml` | `@claude` メンション応答の共通ロジック |
| `claude-code-review.yml` | コードレビューの共通ロジック |
| `issue-scan.yml` | Issue トリアージの共通ロジック |
| `issue-implement.yml` | Issue 自動実装の共通ロジック |
| `dependabot-scan.yml` | 脆弱性スキャンの共通ロジック |
| `resolve-version` (action) | プロジェクトファイルからバージョン検出 |
| `release-core` (action) | タグ・Release 作成（冪等） |
| `audit-scan` (action) | audit JSON 解析と Issue 管理 |

## CI と品質チェック

| Workflow | Status | 主目的 | トリガー | 依存アクション |
| --- | --- | --- | --- | --- |
| [lint.yml](./lint.yml) | [![Lint](https://github.com/rysk-tanaka/swagmark/actions/workflows/lint.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/lint.yml) | Biome と markdownlint の実行 | `push` (main), `pull_request` (main) | `actions/checkout@v6`, `biomejs/setup-biome@v2`, `actions/setup-node@v6` |
| [test.yml](./test.yml) | [![Test](https://github.com/rysk-tanaka/swagmark/actions/workflows/test.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/test.yml) | テスト実行 + PR 時のロックファイル自動更新 | `push` (main), `pull_request` (main) | `actions/checkout@v6`, `actions/setup-node@v6` |
| [ci-auto-fix.yml](./ci-auto-fix.yml) | [![Auto Fix CI](https://github.com/rysk-tanaka/swagmark/actions/workflows/ci-auto-fix.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/ci-auto-fix.yml) | Test 失敗時の自動修正 | `workflow_run` (`Test` completed) | `actions/checkout@v6`, `actions/setup-node@v6`, `actions/github-script@v8`, `anthropics/claude-code-action@v1` |

## リリースと配布

| Workflow | Status | 主目的 | トリガー | 依存アクション |
| --- | --- | --- | --- | --- |
| [auto-release.yml](./auto-release.yml) | [![Release](https://github.com/rysk-tanaka/swagmark/actions/workflows/auto-release.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/auto-release.yml) | 公開系ジョブのオーケストレーション（major tag、npm、GHCR） | `push` (main, `package.json`), `workflow_dispatch` | `rysk-tanaka/workflows` (release-on-version-change) |

## Issue 自動化

| Workflow | Status | 主目的 | トリガー | 依存アクション |
| --- | --- | --- | --- | --- |
| [issue-scan.yml](./issue-scan.yml) | [![Issue Scan](https://github.com/rysk-tanaka/swagmark/actions/workflows/issue-scan.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/issue-scan.yml) | open issue の難易度判定とラベル付与 | `schedule` (`50 0 * * *`), `workflow_dispatch` | `rysk-tanaka/workflows` (issue-scan) |
| [issue-implement.yml](./issue-implement.yml) | [![Issue Implement](https://github.com/rysk-tanaka/swagmark/actions/workflows/issue-implement.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/issue-implement.yml) | `claude-implement` ラベルで自動実装と PR 作成 | `issues` (labeled) | `rysk-tanaka/workflows` (issue-implement) |
| [dependabot-scan.yml](./dependabot-scan.yml) | [![Dependabot Scan](https://github.com/rysk-tanaka/swagmark/actions/workflows/dependabot-scan.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/dependabot-scan.yml) | `pnpm audit` 結果を解析し Issue を起票/更新 | `workflow_dispatch` | `rysk-tanaka/workflows` (dependabot-scan) |

## Claude 連携

| Workflow | Status | 主目的 | トリガー | 依存アクション |
| --- | --- | --- | --- | --- |
| [claude.yml](./claude.yml) | [![Claude Code](https://github.com/rysk-tanaka/swagmark/actions/workflows/claude.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/claude.yml) | `@claude` メンションへの応答 | `issue_comment`, `pull_request_review_comment`, `issues`, `pull_request_review` | `rysk-tanaka/workflows` (claude) |
| [claude-code-review.yml](./claude-code-review.yml) | [![Claude Code Review](https://github.com/rysk-tanaka/swagmark/actions/workflows/claude-code-review.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/claude-code-review.yml) | `claude-review` ラベル付き PR の自動レビュー | `pull_request` (opened/synchronize/labeled/ready_for_review/reopened) | `rysk-tanaka/workflows` (claude-code-review) |

## ワークフロー間の連携

| From | To | 連携条件 |
| --- | --- | --- |
| [test.yml](./test.yml) | [ci-auto-fix.yml](./ci-auto-fix.yml) | `Test` が `failure` で完了した PR の head SHA を対象に自動修正 |
| [issue-scan.yml](./issue-scan.yml) | [issue-implement.yml](./issue-implement.yml) | `claude-implement` ラベル付与で実装ワークフローを起動 |
| [issue-implement.yml](./issue-implement.yml) | [claude-code-review.yml](./claude-code-review.yml) | PR 作成後に `claude-review` ラベル付与でレビューを起動 |
| [auto-release.yml](./auto-release.yml) | release-on-version-change (external) | `workflow_call` でリリース処理を委譲 |

## claude-code-action の権限メモ

`anthropics/claude-code-action` を使うワークフローの `permissions` 設定に関する注意事項。

### 注意事項

ソースコード（`src/github/token.ts`, `src/github/operations/comments/create-initial.ts`）上は、bot/ユーザー作成PRの区別なく常に OIDC 交換後の App トークンを使用する設計になっている。ただし、`issues: write` が不足していると `use_sticky_comment: true` のコメント投稿がサイレントに失敗することが確認されているため、必ず付与すること。

### 必要な権限の対応表

| 操作 | 必要な権限 |
| --- | --- |
| `use_sticky_comment: true`（PR へのサマリーコメント投稿） | `issues: write` |
| PR review / インラインコメント投稿 | `pull-requests: write` |
| コードの読み取り（checkout） | `contents: read` |
| ファイル編集・push | `contents: write` |
| OIDC トークン取得（必須） | `id-token: write` |
