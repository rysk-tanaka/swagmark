import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { convert } from "../src/convert.mjs";

const TMP_DIR = "test/tmp";

/** convert を実行して出力 Markdown 文字列を返すヘルパー */
async function convertAndRead(fixture, subDir = "") {
  const outDir = subDir ? join(TMP_DIR, subDir) : TMP_DIR;
  const name = fixture.replace(/\.yaml$/, "");
  await convert(`test/fixtures/${fixture}`, { output: outDir, index: false });
  return readFileSync(join(outDir, `${name}.md`), "utf-8");
}

let validMd;
let minimalMd;
let swagger2Md;
let extraMethodsMd;

beforeAll(async () => {
  validMd = await convertAndRead("valid.yaml");
  minimalMd = await convertAndRead("minimal.yaml", "minimal");
  swagger2Md = await convertAndRead("swagger2.yaml", "swagger2");
  extraMethodsMd = await convertAndRead("extra-methods.yaml", "extra-methods");
});

afterAll(() => {
  if (existsSync(TMP_DIR)) {
    rmSync(TMP_DIR, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// P1: HTTPメソッドバッジ
// ---------------------------------------------------------------------------

describe("HTTPメソッドバッジ", () => {
  test("GETエンドポイントに青バッジURLが含まれる", () => {
    expect(validMd).toContain("https://badgers.space/badge/_/GET/blue");
  });

  test("POSTエンドポイントに緑バッジURLが含まれる", () => {
    expect(validMd).toContain("https://badgers.space/badge/_/POST/green");
  });

  test("PUTエンドポイントにオレンジバッジURLが含まれる", () => {
    expect(validMd).toContain("https://badgers.space/badge/_/PUT/orange");
  });

  test("DELETEエンドポイントに赤バッジURLが含まれる", () => {
    expect(validMd).toContain("https://badgers.space/badge/_/DELETE/red");
  });

  test("PATCHエンドポイントに紫バッジURLが含まれる", () => {
    expect(validMd).toContain("https://badgers.space/badge/_/PATCH/purple");
  });

  test("バッジにaltテキスト（絵文字+メソッド名）が含まれる", () => {
    expect(validMd).toContain("![🔵 GET]");
    expect(validMd).toContain("![🟢 POST]");
    expect(validMd).toContain("![🟠 PUT]");
    expect(validMd).toContain("![🔴 DELETE]");
    expect(validMd).toContain("![🟣 PATCH]");
  });
});

// ---------------------------------------------------------------------------
// head/options/trace メソッド対応
// ---------------------------------------------------------------------------

describe("head/options/trace メソッド対応", () => {
  test("HEADエンドポイントにlightgreyバッジURLが含まれる", () => {
    expect(extraMethodsMd).toContain(
      "https://badgers.space/badge/_/HEAD/lightgrey",
    );
  });

  test("OPTIONSエンドポイントにlightgreyバッジURLが含まれる", () => {
    expect(extraMethodsMd).toContain(
      "https://badgers.space/badge/_/OPTIONS/lightgrey",
    );
  });

  test("TRACEエンドポイントにlightgreyバッジURLが含まれる", () => {
    expect(extraMethodsMd).toContain(
      "https://badgers.space/badge/_/TRACE/lightgrey",
    );
  });

  test("バッジにaltテキスト（絵文字+メソッド名）が含まれる", () => {
    expect(extraMethodsMd).toContain("![⚪ HEAD]");
    expect(extraMethodsMd).toContain("![⚪ OPTIONS]");
    expect(extraMethodsMd).toContain("![⚪ TRACE]");
  });

  test("head/options/trace がインデックスに含まれる", async () => {
    const outDir = join(TMP_DIR, "extra-methods-index");
    await convert("test/fixtures/extra-methods.yaml", {
      output: outDir,
      index: true,
    });
    const readme = readFileSync(join(outDir, "README.md"), "utf-8");
    expect(readme).toContain("https://badgers.space/badge/_/HEAD/lightgrey");
    expect(readme).toContain("https://badgers.space/badge/_/OPTIONS/lightgrey");
    expect(readme).toContain("https://badgers.space/badge/_/TRACE/lightgrey");
  });
});

// ---------------------------------------------------------------------------
// P1: <details>/<summary> 構造
// ---------------------------------------------------------------------------

describe("<details>/<summary> 構造", () => {
  test("各エンドポイントが<details>タグで囲まれる", () => {
    const openCount = (validMd.match(/<details>/g) || []).length;
    const closeCount = (validMd.match(/<\/details>/g) || []).length;
    expect(openCount).toBeGreaterThan(0);
    expect(closeCount).toBe(openCount);
  });

  test("<summary>内にメソッドバッジとパスが含まれる", () => {
    expect(validMd).toMatch(
      /<summary>[\s\S]*?badgers\.space[\s\S]*?<\/summary>/,
    );
  });

  test("<details>の直後に<summary>が続く", () => {
    expect(validMd).toMatch(/<details>\n<summary>/);
  });
});

// ---------------------------------------------------------------------------
// P1: curlサンプル生成
// ---------------------------------------------------------------------------

describe("curlサンプル生成", () => {
  test("GETリクエストに-dオプションが含まれない", () => {
    const getSection = validMd.match(/GET[\s\S]*?```shell([\s\S]*?)```/);
    expect(getSection).not.toBeNull();
    expect(getSection[1]).not.toContain(" -d '");
  });

  test("POSTリクエストにリクエストボディ(-d)が含まれる", () => {
    const postSection = validMd.match(/POST[\s\S]*?```shell([\s\S]*?)```/);
    expect(postSection).not.toBeNull();
    expect(postSection[1]).toContain(" -d '");
  });

  test("不要なwgetコメント行が出力に含まれない", () => {
    expect(validMd).not.toContain("# You can also use wget");
  });
});

// ---------------------------------------------------------------------------
// P1: GFMテーブル
// ---------------------------------------------------------------------------

describe("GFMテーブル", () => {
  test("パラメータテーブルが正しいカラム構造で生成される", () => {
    expect(validMd).toContain("|Name|In|Type|Required|Description|");
  });

  test("レスポンステーブルにステータスコードが含まれる", () => {
    expect(validMd).toContain("|Status|Meaning|Description|Schema|");
    expect(validMd).toMatch(/\|2\d\d\|/);
  });
});

// ---------------------------------------------------------------------------
// P2: YAML読み込みとエラーハンドリング
// ---------------------------------------------------------------------------

describe("YAML読み込み", () => {
  test("有効なOpenAPI 3.0 YAMLをパースできる", async () => {
    await expect(
      convert("test/fixtures/valid.yaml", {
        output: join(TMP_DIR, "valid-ok"),
        index: false,
      }),
    ).resolves.toBeUndefined();
  });

  test("存在しないファイルパスでエラーをthrowする", async () => {
    await expect(
      convert("nonexistent.yaml", { output: join(TMP_DIR, "nonexistent") }),
    ).rejects.toThrow();
  });

  test("不正なYAMLでエラーをthrowする", async () => {
    await expect(
      convert("test/fixtures/invalid.yaml", {
        output: join(TMP_DIR, "invalid"),
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// スナップショット
// ---------------------------------------------------------------------------

describe("スナップショット", () => {
  test("サンプルOpenAPIからの出力がスナップショットと一致する", () => {
    expect(validMd).toMatchSnapshot();
  });
});

// ---------------------------------------------------------------------------
// minimal.yaml: servers なし・タグなし
// ---------------------------------------------------------------------------

describe("minimal.yaml（最小構成OpenAPI）", () => {
  test("servers なしでも正常に変換される", () => {
    expect(minimalMd.length).toBeGreaterThan(0);
  });

  test("Base URLs セクションが含まれない", () => {
    expect(minimalMd).not.toContain("Base URLs:");
  });

  test("エンドポイントが <details> タグで囲まれる", () => {
    expect(minimalMd).toContain("<details>");
    expect(minimalMd).toContain("</details>");
  });

  test("GETバッジが含まれる", () => {
    expect(minimalMd).toContain("https://badgers.space/badge/_/GET/blue");
  });

  test("markdownlint 抑制コメントが先頭に挿入される", () => {
    expect(minimalMd).toMatch(/^<!-- markdownlint-disable /);
  });
});

// ---------------------------------------------------------------------------
// Swagger 2.0 入力
// ---------------------------------------------------------------------------

describe("Swagger 2.0 入力", () => {
  test("Swagger 2.0 YAMLが正常に変換される", () => {
    expect(swagger2Md.length).toBeGreaterThan(0);
  });

  test("GETバッジが含まれる", () => {
    expect(swagger2Md).toContain("https://badgers.space/badge/_/GET/blue");
  });

  test("POSTバッジが含まれる", () => {
    expect(swagger2Md).toContain("https://badgers.space/badge/_/POST/green");
  });

  test("エンドポイントが <details> タグで囲まれる", () => {
    expect(swagger2Md).toContain("<details>");
    expect(swagger2Md).toContain("</details>");
  });

  test("markdownlint 抑制コメントが先頭に挿入される", () => {
    expect(swagger2Md).toMatch(/^<!-- markdownlint-disable /);
  });
});

// ---------------------------------------------------------------------------
// ディレクトリ入力（一括変換）
// ---------------------------------------------------------------------------

describe("ディレクトリ入力（一括変換）", () => {
  const DIR_OUT = join(TMP_DIR, "dir-out");

  test("ディレクトリ内の全 YAML ファイルが変換される", async () => {
    await convert("test/fixtures/dir", { output: DIR_OUT, index: false });
    expect(existsSync(join(DIR_OUT, "api-a.md"))).toBe(true);
    expect(existsSync(join(DIR_OUT, "api-b.md"))).toBe(true);
    expect(existsSync(join(DIR_OUT, "README.md"))).toBe(false);
  });

  test("index: true のとき README.md が生成される", async () => {
    const outDir = join(TMP_DIR, "dir-index");
    await convert("test/fixtures/dir", { output: outDir, index: true });
    expect(existsSync(join(outDir, "README.md"))).toBe(true);
  });

  test("YAML ファイルが存在しないディレクトリでエラーをthrowする", async () => {
    const emptyDir = join(TMP_DIR, "empty-dir");
    mkdirSync(emptyDir, { recursive: true });
    await expect(
      convert(emptyDir, { output: join(TMP_DIR, "empty-out") }),
    ).rejects.toThrow("No YAML files found");
  });
});

// ---------------------------------------------------------------------------
// --no-index オプション
// ---------------------------------------------------------------------------

describe("--no-index オプション", () => {
  test("index: false のとき README.md が生成されない", async () => {
    const outDir = join(TMP_DIR, "no-index");
    await convert("test/fixtures/valid.yaml", { output: outDir, index: false });
    expect(existsSync(join(outDir, "README.md"))).toBe(false);
    expect(existsSync(join(outDir, "valid.md"))).toBe(true);
  });

  test("index オプション省略時（デフォルト）は README.md が生成される", async () => {
    const outDir = join(TMP_DIR, "with-index");
    await convert("test/fixtures/valid.yaml", { output: outDir });
    expect(existsSync(join(outDir, "README.md"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// カスタムテンプレート（-t オプション）
// ---------------------------------------------------------------------------

describe("カスタムテンプレート（-t オプション）", () => {
  test("カスタム operation.dot の内容が出力に反映される", async () => {
    const outDir = join(TMP_DIR, "custom-tpl");
    await convert("test/fixtures/valid.yaml", {
      output: outDir,
      index: false,
      template: "test/fixtures/custom-template",
    });
    const md = readFileSync(join(outDir, "valid.md"), "utf-8");
    expect(md).toContain("<!-- CUSTOM-TEMPLATE-MARKER -->");
  });
});
