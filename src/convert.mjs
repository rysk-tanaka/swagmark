// Convert OpenAPI YAML files using widdershins with custom Swagger-style templates

import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import widdershins from "widdershins";

const __dirname = dirname(fileURLToPath(import.meta.url));

const badgeColors = {
  get: "blue",
  post: "green",
  put: "orange",
  delete: "red",
  patch: "purple",
  head: "lightgrey",
  options: "lightgrey",
  trace: "lightgrey",
};

const badgeEmojis = Object.fromEntries(
  Object.keys(badgeColors).map((m) => [
    m,
    { get: "🔵", post: "🟢", put: "🟠", delete: "🔴", patch: "🟣" }[m] ||
      "⚪",
  ]),
);

const httpMethods = new Set(Object.keys(badgeColors));

function extractEndpoints(spec) {
  const endpoints = [];
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (httpMethods.has(method)) {
        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: op.summary || "",
          color: badgeColors[method],
          emoji: badgeEmojis[method],
        });
      }
    }
  }
  return endpoints;
}

async function convertFile(file, inputDir, outputDir, templateDir) {
  const name = basename(file, extname(file));
  const filePath = inputDir ? join(inputDir, file) : file;
  const specText = readFileSync(filePath, "utf-8");
  const spec = yaml.load(specText);

  const endpoints = extractEndpoints(spec);
  const tag =
    Object.values(spec.paths || {})
      .flatMap((item) =>
        Object.entries(item)
          .filter(([key]) => httpMethods.has(key))
          .map(([, op]) => op),
      )
      .find((op) => op?.tags)?.tags?.[0] || name;

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
  // 3. Insert markdownlint suppression comment
  md = `<!-- markdownlint-disable MD024 MD028 MD033 MD036 -->\n${md}`;

  md = `${md.trimEnd()}\n`;
  writeFileSync(join(outputDir, `${name}.md`), md);
  console.log(
    `widdershins-custom: ${name}.md (${md.split("\n").length} lines)`,
  );

  return { name, tag, endpoints };
}

function generateIndex(entries, outputDir) {
  const indexLines = [
    "# API Reference",
    "",
    `> ${entries.length} セクション / ${entries.reduce((sum, e) => sum + e.endpoints.length, 0)} エンドポイント`,
    "",
  ];

  for (const entry of entries) {
    indexLines.push(`## [${entry.tag}](./${entry.name}.md)`);
    indexLines.push("");
    for (const ep of entry.endpoints) {
      indexLines.push(
        `- ![${ep.emoji} ${ep.method}](https://badgers.space/badge/_/${ep.method}/${ep.color}?label=&corner_radius=5) \`${ep.path}\` — ${ep.summary}`,
      );
    }
    indexLines.push("");
  }

  const indexContent = `${indexLines.join("\n").trimEnd()}\n`;
  writeFileSync(join(outputDir, "README.md"), indexContent);
  console.log(
    `README.md (${indexLines.length} lines, ${entries.length} sections)`,
  );
}

export async function convert(input, opts = {}) {
  const outputDir = resolve(opts.output || "./output");
  const templateDir = opts.template
    ? resolve(opts.template)
    : resolve(__dirname, "../templates/openapi3");

  let stat;
  try {
    stat = statSync(input);
  } catch {
    throw new Error(`Input not found: ${input}`);
  }

  mkdirSync(outputDir, { recursive: true });

  const indexEntries = [];

  if (stat.isDirectory()) {
    const files = readdirSync(input).filter(
      (f) => f.endsWith(".yaml") || f.endsWith(".yml"),
    );
    if (files.length === 0) {
      throw new Error(`No YAML files found in directory: ${input}`);
    }
    for (const file of files) {
      const entry = await convertFile(file, input, outputDir, templateDir);
      indexEntries.push(entry);
    }
  } else {
    const entry = await convertFile(input, null, outputDir, templateDir);
    indexEntries.push(entry);
  }

  if (opts.index !== false) {
    generateIndex(indexEntries, outputDir);
  }

  const indexLabel = opts.index !== false ? " + index" : "";
  console.log(
    `\nDone. Converted ${indexEntries.length} file(s)${indexLabel} to ${outputDir}`,
  );
}
