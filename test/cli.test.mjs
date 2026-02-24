import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { afterAll, describe, expect, test } from "vitest";

const CLI_TMP = "test/tmp-cli";

afterAll(() => {
  if (existsSync(CLI_TMP)) {
    rmSync(CLI_TMP, { recursive: true, force: true });
  }
});

describe("CLIオプション", () => {
  test("-V でバージョンがpackage.jsonと一致する", () => {
    const version = JSON.parse(readFileSync("package.json", "utf-8")).version;
    const output = execSync("node bin/cli.js -V", { stdio: "pipe" })
      .toString()
      .trim();
    expect(output).toContain(version);
  });

  test("-o オプションで出力ディレクトリが指定できる", () => {
    const outDir = `${CLI_TMP}/output`;
    execSync(`node bin/cli.js test/fixtures/valid.yaml -o "${outDir}"`, {
      stdio: "pipe",
    });
    expect(existsSync(outDir)).toBe(true);
  });

  test("inputファイル未指定時に非ゼロで終了する", () => {
    expect(() => execSync("node bin/cli.js", { stdio: "pipe" })).toThrow();
  });

  test("--no-index オプションで README.md が生成されない", () => {
    const outDir = `${CLI_TMP}/no-index`;
    execSync(
      `node bin/cli.js test/fixtures/valid.yaml -o "${outDir}" --no-index`,
      { stdio: "pipe" },
    );
    expect(existsSync(`${outDir}/README.md`)).toBe(false);
    expect(existsSync(`${outDir}/valid.md`)).toBe(true);
  });

  test("ディレクトリ入力で複数ファイルが一括変換される", () => {
    const outDir = `${CLI_TMP}/dir-output`;
    execSync(`node bin/cli.js test/fixtures/dir -o "${outDir}"`, {
      stdio: "pipe",
    });
    expect(existsSync(`${outDir}/api-a.md`)).toBe(true);
    expect(existsSync(`${outDir}/api-b.md`)).toBe(true);
    expect(existsSync(`${outDir}/README.md`)).toBe(true);
  });
});
