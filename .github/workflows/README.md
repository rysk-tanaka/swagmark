# GitHub Actions ワークフロー一覧

このディレクトリにあるワークフローを用途別に整理した一覧です。

## CI と品質チェック

| Workflow | Status | 主目的 | トリガー | 依存アクション |
| --- | --- | --- | --- | --- |
| [lint.yml](./lint.yml) | [![Lint](https://github.com/rysk-tanaka/swagmark/actions/workflows/lint.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/lint.yml) | Biome と markdownlint の実行 | `push` (main), `pull_request` (main) | `actions/checkout@v6`, `biomejs/setup-biome@v2`, `actions/setup-node@v6` |
| [test.yml](./test.yml) | [![Test](https://github.com/rysk-tanaka/swagmark/actions/workflows/test.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/test.yml) | テスト実行 | `push` (main), `pull_request` (main) | `actions/checkout@v6`, `actions/setup-node@v6` |
| [ci-auto-fix.yml](./ci-auto-fix.yml) | [![Auto Fix CI](https://github.com/rysk-tanaka/swagmark/actions/workflows/ci-auto-fix.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/ci-auto-fix.yml) | Test 失敗時の自動修正 | `workflow_run` (`Test` completed) | `actions/checkout@v6`, `actions/setup-node@v6`, `actions/github-script@v8`, `anthropics/claude-code-action@v1` |

## リリースと配布

| Workflow | Status | 主目的 | トリガー | 依存アクション |
| --- | --- | --- | --- | --- |
| [auto-release.yml](./auto-release.yml) | [![Release](https://github.com/rysk-tanaka/swagmark/actions/workflows/auto-release.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/auto-release.yml) | 公開系ジョブのオーケストレーション（major tag、npm、GHCR） | `push` (main, `package.json`), `workflow_dispatch` | `actions/checkout@v6`, `actions/setup-node@v6`, `docker/setup-buildx-action@v3`, `docker/login-action@v3`, `docker/build-push-action@v6` |
| [release-on-version-change.yml](./release-on-version-change.yml) | - | バージョン変更時のタグ作成と Release 作成 | `workflow_call` | - |
| [resolve-version.yml](./resolve-version.yml) | - | バージョン解決の共通処理 | `workflow_call` | `actions/checkout@v6` |
| [release-core.yml](./release-core.yml) | - | タグ作成と Release 作成の共通処理 | `workflow_call` | `actions/checkout@v6` |

## Issue 自動化

| Workflow | Status | 主目的 | トリガー | 依存アクション |
| --- | --- | --- | --- | --- |
| [issue-scan.yml](./issue-scan.yml) | [![Issue Scan](https://github.com/rysk-tanaka/swagmark/actions/workflows/issue-scan.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/issue-scan.yml) | open issue の難易度判定とラベル付与 | `schedule` (`50 0 * * *`), `workflow_dispatch` | `actions/checkout@v6`, `anthropics/claude-code-action@v1` |
| [issue-implement.yml](./issue-implement.yml) | [![Issue Implement](https://github.com/rysk-tanaka/swagmark/actions/workflows/issue-implement.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/issue-implement.yml) | `claude-implement` ラベルで自動実装と PR 作成 | `issues` (labeled) | `actions/checkout@v6`, `actions/github-script@v8`, `actions/setup-node@v6`, `anthropics/claude-code-action@v1` |
| [dependabot-scan.yml](./dependabot-scan.yml) | [![Dependabot Scan](https://github.com/rysk-tanaka/swagmark/actions/workflows/dependabot-scan.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/dependabot-scan.yml) | `pnpm audit` 結果を解析し Issue を起票/更新 | `workflow_dispatch` | `actions/checkout@v6`, `actions/setup-node@v6` |

## Claude 連携

| Workflow | Status | 主目的 | トリガー | 依存アクション |
| --- | --- | --- | --- | --- |
| [claude.yml](./claude.yml) | [![Claude Code](https://github.com/rysk-tanaka/swagmark/actions/workflows/claude.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/claude.yml) | `@claude` メンションへの応答 | `issue_comment`, `pull_request_review_comment`, `issues`, `pull_request_review` | `actions/checkout@v6`, `anthropics/claude-code-action@v1` |
| [claude-code-review.yml](./claude-code-review.yml) | [![Claude Code Review](https://github.com/rysk-tanaka/swagmark/actions/workflows/claude-code-review.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/claude-code-review.yml) | `claude-review` ラベル付き PR の自動レビュー | `pull_request` (opened/synchronize/labeled/ready_for_review/reopened) | `actions/checkout@v6`, `anthropics/claude-code-action@v1` |

## ワークフロー間の連携

| From | To | 連携条件 |
| --- | --- | --- |
| [test.yml](./test.yml) | [ci-auto-fix.yml](./ci-auto-fix.yml) | `Test` が `failure` で完了した PR の head SHA を対象に自動修正 |
| [issue-scan.yml](./issue-scan.yml) | [issue-implement.yml](./issue-implement.yml) | `claude-implement` ラベル付与で実装ワークフローを起動 |
| [issue-implement.yml](./issue-implement.yml) | [claude-code-review.yml](./claude-code-review.yml) | PR 作成後に `claude-review` ラベル付与でレビューを起動 |
| [auto-release.yml](./auto-release.yml) | [release-on-version-change.yml](./release-on-version-change.yml) | `workflow_call` でリリース処理を委譲 |
| [release-on-version-change.yml](./release-on-version-change.yml) | [resolve-version.yml](./resolve-version.yml) | `workflow_call` でバージョン解決を委譲 |
| [release-on-version-change.yml](./release-on-version-change.yml) | [release-core.yml](./release-core.yml) | `workflow_call` でタグ・Release 作成を委譲 |

## 依存アクション一覧

| Action | 採用バージョン | 利用 workflow |
| --- | --- | --- |
| `actions/checkout` | `v6` | `auto-release.yml`, `ci-auto-fix.yml`, `claude-code-review.yml`, `claude.yml`, `dependabot-scan.yml`, `issue-implement.yml`, `issue-scan.yml`, `lint.yml`, `release-core.yml`, `resolve-version.yml`, `test.yml` |
| `actions/setup-node` | `v6` | `auto-release.yml`, `ci-auto-fix.yml`, `dependabot-scan.yml`, `issue-implement.yml`, `lint.yml`, `test.yml` |
| `biomejs/setup-biome` | `v2` | `lint.yml` |
| `actions/github-script` | `v8` | `ci-auto-fix.yml`, `issue-implement.yml` |
| `anthropics/claude-code-action` | `v1` | `ci-auto-fix.yml`, `claude-code-review.yml`, `claude.yml`, `issue-implement.yml`, `issue-scan.yml` |
| `docker/setup-buildx-action` | `v3` | `auto-release.yml` |
| `docker/login-action` | `v3` | `auto-release.yml` |
| `docker/build-push-action` | `v6` | `auto-release.yml` |
