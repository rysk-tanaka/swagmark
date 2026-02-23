# swagmark

> OpenAPI YAML から GitHub プレビューで Swagger 風に見える Markdown を生成するツール

[![release](https://github.com/rysk-tanaka/swagmark/actions/workflows/auto-release.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/auto-release.yml)
[![test](https://github.com/rysk-tanaka/swagmark/actions/workflows/test.yml/badge.svg)](https://github.com/rysk-tanaka/swagmark/actions/workflows/test.yml)
[![npm version](https://badgers.space/npm/version/swagmark?label=npm&corner_radius=5)](https://www.npmjs.com/package/swagmark)
[![node](https://badgers.space/badge/node/%3E%3D18/5FA04E?corner_radius=5)](https://nodejs.org/)
[![docker](https://badgers.space/badge/docker/ghcr.io/2496ED?corner_radius=5)](https://github.com/rysk-tanaka/swagmark/pkgs/container/swagmark)
[![license](https://badgers.space/github/license/rysk-tanaka/swagmark?corner_radius=5)](./LICENSE)

---

## 概要

swagmark は [widdershins](https://github.com/Mermade/widdershins) のカスタム doT.js テンプレートをコアとし、OpenAPI YAML から以下の特徴を持つ Markdown を生成します。

- ![🔵 GET](https://badgers.space/badge/_/GET/blue?label=&corner_radius=5) ![🟢 POST](https://badgers.space/badge/_/POST/green?label=&corner_radius=5) ![🟠 PUT](https://badgers.space/badge/_/PUT/orange?label=&corner_radius=5) ![🔴 DELETE](https://badgers.space/badge/_/DELETE/red?label=&corner_radius=5) HTTP メソッドの色付きバッジ表示
- `<details>` による折りたたみ可能なエンドポイント（Swagger UI のアコーディオンに近い操作感）
- GFM テーブルによるパラメータ・レスポンス表示
- curl 実行例の自動生成

生成された Markdown は GitHub や VS Code でそのままプレビュー可能です。Swagger UI の完全再現ではなく、Markdown の制約内で最大限 Swagger 風の見た目を実現することを目的としています。

> バッジ画像は [badgers.space](https://badgers.space/) を利用しています。サービス障害時は alt テキスト（例: 🔵 GET）が自動的に表示されます。

---

## 出力例

<details>
<summary>

![🟢 POST](https://badgers.space/badge/_/POST/green?label=&corner_radius=5) **`/pets`** — Create a pet

</summary>

```shell
curl -X POST http://petstore.swagger.io/v1/pets \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"id":0,"name":"string","tag":"string"}'
```

### Parameters

| Name | In | Type | Required | Description |
| --- | --- | --- | --- | --- |
| body | body | Pet | true | none |
| » id | body | integer(int64) | true | none |
| » name | body | string | true | none |
| » tag | body | string | false | none |

### Responses

| Status | Meaning | Description | Schema |
| --- | --- | --- | --- |
| 201 | Created | Null response | None |
| default | Default | unexpected error | Error |

</details>

実際の変換結果は [examples/petstore/output/](./examples/petstore/output/) で確認できます（[Petstore OpenAPI](https://github.com/OAI/learn.openapis.org/blob/main/examples/v3.0/petstore.yaml) を変換したもの）。

---

## インストール・実行

### npx

```bash
npx swagmark input.yaml -o docs/
```

### グローバルインストール

```bash
npm install -g swagmark
swagmark input.yaml -o docs/
```

### ローカルインストール

```bash
npm install --save-dev swagmark
```

```json
// package.json
{
  "scripts": {
    "docs": "swagmark openapi.yaml -o docs/"
  }
}
```

---

## 使い方

```bash
Usage: swagmark [options] <input>

Arguments:
  input                 OpenAPI YAML ファイルまたはディレクトリのパス

Options:
  -o, --output <dir>    出力ディレクトリ（デフォルト: ./output）
  -t, --template <dir>  カスタムテンプレートディレクトリ
  --no-index            README.md（インデックス）の生成をスキップ
  -h, --help            ヘルプを表示
  -v, --version         バージョンを表示
```

### 基本的な使い方

```bash
# 単一ファイルの変換
swagmark openapi.yaml -o docs/

# ディレクトリ内の全 YAML を一括変換
swagmark openapi/ -o docs/

# カスタムテンプレートを使用
swagmark openapi.yaml -o docs/ --template ./my-templates/
```

---

## GitHub Actions

```yaml
# .github/workflows/docs.yml
name: Generate API Docs

on:
  push:
    paths:
      - 'openapi/**'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: rysk-tanaka/swagmark@v0
        with:
          input: './openapi/api.yaml'
          output: './docs/'
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'docs: update API reference'
```

---

## Docker

```bash
docker run --rm \
  -v $(pwd):/work \
  ghcr.io/rysk-tanaka/swagmark \
  /work/openapi.yaml -o /work/docs/
```

---

## ディレクトリ構造

```tree
swagmark/
├── .github/
│   └── workflows/
│       ├── auto-release.yml  # リリース + npm + Docker 自動公開
│       └── test.yml          # テスト自動実行
├── action.yml                # GitHub Actions 定義
├── docs/
│   └── design.md             # 設計方針
├── bin/
│   └── cli.js                # CLI エントリポイント（npx 用）
├── examples/
│   └── petstore/             # Petstore サンプル（入力 YAML + 変換結果）
├── src/
│   └── convert.mjs           # 変換ロジック本体
├── templates/
│   └── openapi3/             # カスタム doT.js テンプレート
│       ├── main.dot
│       ├── operation.dot
│       ├── code_shell.dot
│       └── ...（widdershins デフォルトテンプレートからの派生）
├── test/
│   └── fixtures/             # テスト用 OpenAPI YAML
├── vitest.config.mjs         # Vitest 設定
├── Dockerfile
├── package.json
├── LICENSE                   # MIT
├── THIRD_PARTY_LICENSES      # widdershins 等の著作権表示
└── README.md
```

---

## カスタムテンプレート

`templates/openapi3/` は [widdershins](https://github.com/Mermade/widdershins) のデフォルトテンプレートをベースに以下をカスタマイズしています。

| テンプレート | 変更内容 |
| --- | --- |
| `operation.dot` | エンドポイントを `<details>/<summary>` で囲む・バッジを追加 |
| `code_shell.dot` | curl 例にリクエストボディ（`-d`）を追加・不要なコメント行を除去 |
| `main.dot` | HTML タグを Markdown 見出しに置き換え・認証情報をブロッククォートに変換 |

独自テンプレートを使用する場合は `--template` オプションで指定してください。設計方針の詳細は [docs/design.md](./docs/design.md) を参照してください。

---

## 既知の問題

### `punycode` モジュールの非推奨警告（Node.js v21 以降）

Node.js v21 以降で実行すると以下の警告が表示されることがあります（v22 LTS を含む）。

```text
(node:12345) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
```

これは間接依存（widdershins → markdown-it@10）が Node.js 組み込みの `punycode` モジュールを使用しているためで、swagmark の動作には影響しません。

- 組み込み `punycode` は将来のメジャーバージョンで削除予定ですが、現時点ではまだ残存しています
- 警告を抑制するには `node --disable-warning=DEP0040` オプションを使用してください

```bash
NODE_OPTIONS=--disable-warning=DEP0040 swagmark input.yaml -o docs/
```

---

## ライセンス

MIT License — © rysk-tanaka

サードパーティのライセンス情報は [THIRD_PARTY_LICENSES](./THIRD_PARTY_LICENSES) を参照してください。
