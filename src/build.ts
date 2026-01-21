/**
 * Build script for generating static HTML pages.
 * @module
 */

import { ensureDir, copy } from "@std/fs";
import { parseArgs } from "@std/cli";
import { render, raw } from "./jsx-runtime/index.ts";
import type { LocaleCode } from "./types/locale.ts";
import { LOCALE_CODES } from "./types/locale.ts";
import type { Table } from "./types/table.ts";
import type { Word } from "./types/word.ts";
import type { Term } from "./types/term.ts";
import { loadTable } from "./lib/yaml-loader.ts";
import { processMarkdown } from "./lib/markdown.ts";
import { Table as TableComponent } from "./components/Table.tsx";
import { Layout } from "./components/Layout.tsx";
import { romanize, getCharacterReadings } from "./lib/romanization/index.ts";
import type { CharacterReading } from "./lib/romanization/types.ts";

/** Output directory */
const OUTPUT_DIR = "public_html";

/** Static assets to copy */
const STATIC_ASSETS = ["style.css", "script.js", "cc-by-sa.svg"];

/** Locale to markdown file mapping */
const LOCALE_MD_FILES: Record<string, string> = {
  en: "en.md",
  ja: "ja.md",
  ko: "ko.md",
  "zh-CN": "zh-Hant.md",
  "zh-HK": "zh-Hant.md",
  "zh-TW": "zh-Hant.md",
};

/** Locale to output filename mapping */
const LOCALE_OUTPUT_FILES: Record<string, string> = {
  en: "index.html",
  ja: "ja/index.html",
  ko: "ko/index.html",
  "zh-CN": "zh-Hans/index.html",
  "zh-HK": "zh-Hant-HK/index.html",
  "zh-TW": "zh-Hant/index.html",
};

/** Language hrefs for navigation */
function getLanguageHrefs(): [LocaleCode, string][] {
  return LOCALE_CODES.map((locale) => [
    locale,
    LOCALE_OUTPUT_FILES[locale],
  ]);
}

/**
 * Pre-compute romanizations for all words in a table.
 * Processes all locales in the table, not just the display locale.
 */
async function computeRomanizations(
  table: Table,
): Promise<Map<Word, { langTag: string; text: string }>> {
  const results = new Map<Word, { langTag: string; text: string }>();

  for (const translation of table.translations) {
    // Process all locales in the translation
    for (const [localeCode, words] of translation.map) {
      for (const word of words) {
        if (word.locale.language === "en") continue;

        const text = word.terms.map((t) => t.term).join("");
        const rom = await romanize(text, localeCode);
        results.set(word, { langTag: rom.langTag, text: rom.text });
      }
    }
  }

  return results;
}

/**
 * Pre-compute character readings for all words in a table.
 * Processes all locales in the table, not just the display locale.
 */
async function computeReadings(
  table: Table,
): Promise<Map<Word, Map<Term, CharacterReading[]>>> {
  const results = new Map<Word, Map<Term, CharacterReading[]>>();

  for (const translation of table.translations) {
    // Process all locales in the translation
    for (const [localeCode, words] of translation.map) {
      for (const word of words) {
        const wordReadings = new Map<Term, CharacterReading[]>();
        const previousTermTexts: string[] = [];

        for (const term of word.terms) {
          if ("read" in term) {
            const readings = await getCharacterReadings(
              term.term,
              term.term, // normalized term
              previousTermTexts,
              localeCode,
            );
            wordReadings.set(term, readings);
          }
          previousTermTexts.push(term.term);
        }

        results.set(word, wordReadings);
      }
    }
  }

  return results;
}

/**
 * Cache for loaded tables.
 */
const tableCache = new Map<string, Table>();

/**
 * Load a table with caching.
 */
async function loadTableCached(path: string): Promise<Table> {
  let table = tableCache.get(path);
  if (!table) {
    table = await loadTable(path);
    tableCache.set(path, table);
  }
  return table;
}

/**
 * Cache for computed romanizations per table.
 */
const romanizationCache = new Map<string, Map<Word, { langTag: string; text: string }>>();

/**
 * Cache for computed readings per table.
 */
const readingsCache = new Map<string, Map<Word, Map<Term, CharacterReading[]>>>();

/**
 * Render a table for a specific locale.
 */
async function renderTable(
  tablePath: string,
  locale: LocaleCode,
): Promise<string> {
  const table = await loadTableCached(tablePath);

  // Get or compute romanizations (cached per table)
  let romanizations = romanizationCache.get(tablePath);
  if (!romanizations) {
    romanizations = await computeRomanizations(table);
    romanizationCache.set(tablePath, romanizations);
  }

  // Get or compute readings (cached per table)
  let readings = readingsCache.get(tablePath);
  if (!readings) {
    readings = await computeReadings(table);
    readingsCache.set(tablePath, readings);
  }

  const tableHtml = TableComponent({
    table,
    displayLocale: locale,
    readings,
    romanizations,
  });

  return render(tableHtml);
}

/**
 * Get page title from markdown content.
 */
function getTitle(md: string): string {
  // Try ATX header
  const atxMatch = md.match(/^#\s+(.+)$/m);
  if (atxMatch) return atxMatch[1];

  // Try setext header
  const setextMatch = md.match(/^(.+)\n=+$/m);
  if (setextMatch) return setextMatch[1];

  return "CJK Computer Science Terms";
}

/**
 * Build a page for a specific locale.
 */
async function buildPage(locale: LocaleCode): Promise<void> {
  const mdFile = LOCALE_MD_FILES[locale];
  const outputFile = LOCALE_OUTPUT_FILES[locale];

  console.log(`Building ${locale} -> ${outputFile}...`);

  // Read markdown content
  const md = await Deno.readTextFile(mdFile);
  const title = getTitle(md);

  // Process markdown with table embedding
  const content = processMarkdown(md, (tablePath) => {
    // Note: This is synchronous but we need async for romanization
    // We'll use a placeholder and replace later
    return raw(`<!-- TABLE:${tablePath} -->`);
  });

  // Replace table placeholders with rendered tables
  let contentHtml = content.__html;
  const tableRegex = /<!-- TABLE:([^>]+) -->/g;
  let match;
  const replacements: [string, string][] = [];

  while ((match = tableRegex.exec(contentHtml)) !== null) {
    const tablePath = match[1];
    const tableHtml = await renderTable(tablePath, locale);
    replacements.push([match[0], tableHtml]);
  }

  for (const [placeholder, html] of replacements) {
    contentHtml = contentHtml.replace(placeholder, html);
  }

  // Wrap in layout
  const langHrefs = getLanguageHrefs();
  const page = Layout({
    title,
    locale,
    langHrefs,
    content: raw(contentHtml),
    baseUrl: locale === "en" ? "." : "..",
  });

  // Write output
  const outputPath = `${OUTPUT_DIR}/${outputFile}`;
  await ensureDir(outputPath.substring(0, outputPath.lastIndexOf("/")));
  await Deno.writeTextFile(outputPath, render(page));
}

/**
 * Copy static assets.
 */
async function copyStaticAssets(): Promise<void> {
  for (const asset of STATIC_ASSETS) {
    console.log(`Copying ${asset}...`);
    await copy(asset, `${OUTPUT_DIR}/${asset}`, { overwrite: true });
  }
}

/**
 * Main build function.
 */
async function build(): Promise<void> {
  const start = Date.now();

  // Create output directory
  await ensureDir(OUTPUT_DIR);

  // Build all locale pages
  const localesToBuild = LOCALE_CODES;
  for (const locale of localesToBuild) {
    await buildPage(locale);
  }

  // Copy static assets
  await copyStaticAssets();

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\nBuild complete in ${elapsed}s`);
  console.log(`Output: ${OUTPUT_DIR}/`);
}

/**
 * CLI entry point.
 */
if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["locale"],
    boolean: ["help"],
    alias: { h: "help", l: "locale" },
  });

  if (args.help) {
    console.log(`
Usage: deno run --allow-read --allow-write src/build.ts [options]

Options:
  -h, --help      Show this help message
  -l, --locale    Build only a specific locale (e.g., en, ja, ko)

Examples:
  deno task build              # Build all pages
  deno task build -l en        # Build only English page
`);
    Deno.exit(0);
  }

  try {
    if (args.locale) {
      const locale = args.locale as LocaleCode;
      if (!LOCALE_CODES.includes(locale)) {
        console.error(`Unknown locale: ${args.locale}`);
        console.error(`Valid locales: ${LOCALE_CODES.join(", ")}`);
        Deno.exit(1);
      }
      await ensureDir(OUTPUT_DIR);
      await buildPage(locale);
      await copyStaticAssets();
    } else {
      await build();
    }
  } catch (error) {
    console.error("Build failed:", error);
    Deno.exit(1);
  }
}
