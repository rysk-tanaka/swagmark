#!/usr/bin/env node
import { program } from "commander";
import { convert } from "../src/convert.mjs";

program
  .name("swagmark")
  .argument("<input>", "OpenAPI YAML ファイルのパス")
  .option("-o, --output <dir>", "出力ディレクトリ", "./output")
  .option("-t, --template <dir>", "カスタムテンプレートディレクトリ")
  .option("--no-index", "README.md の生成をスキップ")
  .version("0.1.0")
  .action(async (input, opts) => {
    try {
      await convert(input, opts);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
