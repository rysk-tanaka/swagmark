# swagmark

> OpenAPI YAML から GitHub プレビューで Swagger 風に見える Markdown を生成するツール

[![npm version](https://badgers.space/npm/version/swagmark?label=npm&corner_radius=5)](https://www.npmjs.com/package/swagmark)
[![license](https://badgers.space/github/license/rysk-tanaka/swagmark?corner_radius=5)](./LICENSE)

---

## 概要

swagmark は [widdershins](https://github.com/Mermade/widdershins) のカスタム doT.js テンプレートをコアとし、OpenAPI YAML から以下の特徴を持つ Markdown を生成します。

- ![🔵 GET](https://badgers.space/badge/_/GET/blue?label=&corner_radius=5) ![🟢 POST](https://badgers.space/badge/_/POST/green?label=&corner_radius=5) ![🟠 PUT](https://badgers.space/badge/_/PUT/orange?label=&corner_radius=5) ![🔴 DELETE](https://badgers.space/badge/_/DELETE/red?label=&corner_radius=5) **HTTP メソッドの色付きバッジ表示**
- **`<details>` による折りたたみ可能なエンドポイント**（Swagger UI のアコーディオンに近い操作感）
- **GFM テーブルによるパラメータ・レスポンス表示**
- **curl 実行例の自動生成**

生成された Markdown は GitHub や VS Code でそのままプレビュー可能です。Swagger UI の完全再現ではなく、Markdown の制約内で最大限 Swagger 風の見た目を実現することを目的としています。

> バッジ画像は [badgers.space](https://badgers.space/)（MIT License）を利用しています。サービス障害時は alt テキスト（例: 🔵 GET）が自動的に表示されます。

---

## 出力例

<details>
<summary>

![🟢 POST](https://badgers.space/badge/_/POST/green?label=&corner_radius=5) **`/api/users`** — ユーザー作成

</summary>

新しいユーザーアカウントを作成します。

```bash
curl -X POST https://example.com/api/users \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{"name":"山田太郎","email":"taro@example.com"}'
```

### Parameters

| Name | In | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `name` | body | `string` | Yes | ユーザー名 |
| `email` | body | `string` | Yes | メールアドレス |

### Responses

| Status | Meaning | Description |
| --- | --- | --- |
| **201** | Created | 作成されたユーザー |
| **401** | Unauthorized | 認証エラー |

</details>

---

## インストール・実行

### npx（インストール不要）

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
  input                 OpenAPI YAML ファイルのパス

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
      - uses: rysk-tanaka/swagmark@v1
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
│       └── publish.yml       # npm + Docker 自動公開
├── action.yml                # GitHub Actions 定義
├── docs/
│   └── design.md             # 設計方針
├── bin/
│   └── cli.js                # CLI エントリポイント（npx 用）
├── src/
│   └── convert.mjs           # 変換ロジック本体
├── templates/
│   └── openapi3/             # カスタム doT.js テンプレート
│       ├── main.dot
│       ├── operation.dot
│       ├── code_shell.dot
│       └── ...（widdershins デフォルトテンプレートからの派生）
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

独自テンプレートを使用する場合は `--template` オプションで指定してください。

---

## 技術的な背景

GitHub の Markdown レンダラーはセキュリティのため `style` 属性や `class` 属性をサニタイズします。swagmark はこの制約内で Swagger UI に近い見た目を実現するため、以下の手法を採用しています。

| 要素 | 実装方法 |
| --- | --- |
| HTTP メソッドの色分け | [badgers.space](https://badgers.space/) の SVG バッジ（フォールバック: Unicode 絵文字） |
| 折りたたみ | `<details>` / `<summary>` タグ |
| パラメータ表示 | GFM テーブル |
| コードサンプル | fenced code block（`bash`） |

詳細な設計背景は [docs/design.md](./docs/design.md) を参照してください。

---

## ライセンス

MIT License — © rysk-tanaka

### サードパーティライセンス

| パッケージ | ライセンス |
| --- | --- |
| [widdershins](https://github.com/Mermade/widdershins) | MIT |
| [doT.js](https://github.com/olado/doT) | MIT |
| [swagger2openapi](https://github.com/Mermade/oas-kit) | BSD-3-Clause |
| [badgers.space](https://github.com/SplittyDev/spacebadgers) | MIT（外部サービス） |

詳細は [THIRD_PARTY_LICENSES](./THIRD_PARTY_LICENSES) を参照してください。
