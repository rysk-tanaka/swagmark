# 設計方針

swagmark が GitHub Markdown の制約内で Swagger 風レンダリングを実現するための設計方針をまとめます。

## GitHub Markdown の制約

GitHub の Markdown レンダラーはセキュリティのため HTML をサニタイズします。以下の制約が Swagger 風スタイリングに直接影響します。

### 使用可能

| 要素 | 用途 |
| --- | --- |
| `<details>` / `<summary>` | 折りたたみセクション |
| `<img>` (`src`, `width`, `height`, `alt`) | バッジ画像、アイコン |
| `<b>`, `<strong>`, `<em>`, `<code>` | テキスト強調 |
| `<sub>`, `<sup>` | 補足テキスト |
| `<kbd>` | キーボードスタイルのラベル |
| `<pre>` + ` ```lang ` | コードブロック（シンタックスハイライト付き） |
| GFM テーブル | パラメータ・レスポンスの一覧 |
| `align` 属性 | 要素の配置（`<p align="center">` 等） |

### 使用不可（サニタイズで除去）

| 要素 | 理由 |
| --- | --- |
| `style` 属性 | インライン CSS 全般が除去される |
| `class`, `id` 属性 | セキュリティ上除去 |
| `<style>` タグ | CSS ブロック自体が除去 |
| `<script>` タグ | JavaScript 実行不可 |
| `<font color="...">` | 非推奨・除去対象 |
| `background-color` | CSS 依存のため不可 |

## Swagger UI 要素の再現方法

### HTTP メソッドバッジ

[badgers.space](https://badgers.space/) の SVG バッジを使用します。alt テキストに Unicode 絵文字とメソッド名を設定し、画像が読み込めない場合のフォールバックとします。

```markdown
![🔵 GET](https://badgers.space/badge/_/GET/blue?label=&corner_radius=5)
![🟢 POST](https://badgers.space/badge/_/POST/green?label=&corner_radius=5)
![🟠 PUT](https://badgers.space/badge/_/PUT/orange?label=&corner_radius=5)
![🔴 DELETE](https://badgers.space/badge/_/DELETE/red?label=&corner_radius=5)
![🟣 PATCH](https://badgers.space/badge/_/PATCH/purple?label=&corner_radius=5)
```

| シナリオ | 表示 |
| --- | --- |
| GitHub / VS Code（オンライン） | badgers.space バッジ（画像） |
| バッジサービス障害時 / オフライン | alt テキスト（絵文字 + メソッド名） |

### エンドポイントの折りたたみ

`<details>` / `<summary>` タグで Swagger UI のアコーディオンを再現します。

```markdown
<details>
<summary>

![🔵 GET](https://badgers.space/badge/_/GET/blue?label=&corner_radius=5) **`/api/conversations`** — 会話一覧取得

</summary>

エンドポイントの詳細説明...

</details>
```

> `<details>` 内の Markdown はブランクラインの位置に注意が必要です（GitHub のレンダリング挙動がやや不安定な場合があります）。

### パラメータテーブル

GFM テーブルで表現します。

```markdown
| Name | In | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `status` | query | `string` | No | `active` \| `closed` |
```

### レスポンステーブル

```markdown
| Status | Meaning | Description |
| --- | --- | --- |
| **200** | OK | 会話一覧 |
| **401** | Unauthorized | 認証エラー |
```

### スキーマ定義

スキーマごとに `<details>` で囲み、Swagger UI の Models セクションに近い操作感を実現します。

```markdown
<details>
<summary>

**Conversation**

</summary>

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | 会話 ID（UUID） |
| `status` | string | `active` \| `closed` |

</details>
```

### 認証情報

`<aside>` の代わりにブロッククォートを使用します。

```markdown
> **認証必須** — Bearer JWT トークンを Authorization ヘッダーに含めること。
```

## テンプレートカスタマイズ方針

`templates/openapi3/` は widdershins のデフォルトテンプレートをベースに以下をカスタマイズしています。

### operation.dot

- エンドポイントを `<details>` / `<summary>` で囲む
- `<summary>` 内にバッジ・パス・サマリーを配置
- `<aside class="warning">` をブロッククォート（`> **認証必須**`）に置き換え
- curl 実行例を説明文の直後・パラメータテーブルの前に配置

### code_shell.dot

- 不要なコメント行（`# You can also use wget`）を除去
- POST / PUT / PATCH の場合に `-d` オプションでリクエストボディを追加

```text
curl -X {{=data.methodUpper}} {{=data.url}}{{=data.requiredQueryString}}{{?data.allHeaders.length}} \{{?}}
{{~data.allHeaders :p:index}}  -H '{{=p.name}}: {{=p.exampleValues.object}}' \
{{~}}{{? data.bodyParameter && data.bodyParameter.exampleValues}}  -d '{{=JSON.stringify(data.bodyParameter.exampleValues.object)}}'{{?}}
```

### main.dot

- `<h1>` 〜 `<h3>` HTML タグを Markdown 見出し（`#` 〜 `###`）に置き換え
- 不要な `<a id="...">` アンカーと HTML コメントを除去

## 目標出力例

````markdown
<details>
<summary>

![🟢 POST](https://badgers.space/badge/_/POST/green?label=&corner_radius=5) **`/api/conversations`** — 会話作成

</summary>

新しい会話セッションを作成します。

```bash
curl -X POST https://example.com/api/conversations \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{"lineUserId":"U1234567890","title":"新規会話"}'
```

#### Parameters

| Name | In | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `lineUserId` | body | `string` | Yes | LINE 顧客 ID |
| `title` | body | `string` | No | 会話タイトル |

#### Responses

| Status | Meaning | Description |
| --- | --- | --- |
| **201** | Created | 作成された会話 |
| **401** | Unauthorized | 認証エラー |

> **認証必須** — Bearer JWT トークン

</details>
````
