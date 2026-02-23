#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "commander";
import { convert } from "../src/convert.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "../package.json"), "utf-8"),
);

program
  .name("swagmark")
  .argument("<input>", "OpenAPI YAML ファイルまたはディレクトリのパス")
  .option("-o, --output <dir>", "出力ディレクトリ", "./output")
  .option("-t, --template <dir>", "カスタムテンプレートディレクトリ")
  .option("--no-index", "README.md の生成をスキップ")
  .version(pkg.version)
  .action(async (input, opts) => {
    try {
      await convert(input, opts);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
