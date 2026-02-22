// Convert per-tag OpenAPI YAML files using widdershins with custom Swagger-style templates
// Usage: node convert-custom-template.mjs
// Output: output/widdershins-custom/<tag>.md

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import widdershins from "widdershins";
import yaml from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputDir = resolve(__dirname, "per-tag");
const outputDir = resolve(__dirname, "output/widdershins-custom");
const templateDir = resolve(__dirname, "../../templates/openapi3");

mkdirSync(outputDir, { recursive: true });

const files = readdirSync(inputDir).filter((f) => f.endsWith(".yaml"));

// Collect metadata for index generation
const indexEntries = [];

for (const file of files) {
  const name = file.replace(".yaml", "");
  const specText = readFileSync(`${inputDir}/${file}`, "utf-8");
  const spec = yaml.load(specText);

  // Extract endpoints metadata for index
  const endpoints = [];
  const badgeColors = {
    get: "blue",
    post: "green",
    put: "orange",
    delete: "red",
    patch: "purple",
  };
  const badgeEmojis = {
    get: "🔵",
    post: "🟢",
    put: "🟠",
    delete: "🔴",
    patch: "🟣",
  };
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (["get", "post", "put", "delete", "patch"].includes(method)) {
        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: op.summary || "",
          color: badgeColors[method] || "lightgrey",
          emoji: badgeEmojis[method] || "⚪",
        });
      }
    }
  }
  const tag =
    Object.values(spec.paths || {})
      .flatMap((m) => Object.values(m))
      .find((op) => op?.tags)?.tags?.[0] || name;
  indexEntries.push({ name, tag, endpoints });

  const options = {
    language_tabs: [{ shell: "Shell" }],
    codeSamples: true,
    sample: true,
    omitHeader: true,
    expandBody: true,
    shallowSchemas: false,
    user_templates: templateDir,
  };

  let md = await widdershins.convert(spec, options);

  // Post-processing
  // 1. Remove RFC links
  md = md.replace(/\[([^\]]+)\]\(https:\/\/tools\.ietf\.org[^)]+\)/g, "$1");
  // 2. Remove widdershins generator comment
  md = md.replace(/^<!-- Generator: Widdershins v[\d.]+ -->\n+/m, "");

  writeFileSync(`${outputDir}/${name}.md`, md);
  console.log(
    `widdershins-custom: ${name}.md (${md.split("\n").length} lines)`,
  );
}

// Generate index.md
const indexLines = [
  "# API Reference",
  "",
  `> ${files.length} セクション / ${indexEntries.reduce((sum, e) => sum + e.endpoints.length, 0)} エンドポイント`,
  "",
];

for (const entry of indexEntries) {
  indexLines.push(`## [${entry.tag}](./${entry.name}.md)`);
  indexLines.push("");
  for (const ep of entry.endpoints) {
    indexLines.push(
      `- ![${ep.emoji} ${ep.method}](https://badgers.space/badge/_/${ep.method}/${ep.color}?label=&corner_radius=5) \`${ep.path}\` — ${ep.summary}`,
    );
  }
  indexLines.push("");
}

const indexContent = indexLines.join("\n");
writeFileSync(`${outputDir}/README.md`, indexContent);
console.log(
  `README.md (${indexLines.length} lines, ${indexEntries.length} sections)`,
);

console.log(`\nDone. Converted ${files.length} files + index to ${outputDir}`);
