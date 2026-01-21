/**
 * Build script for generating static HTML pages.
 * @module
 */

import { ensureDir, copy } from "@std/fs";
import { parseArgs } from "@std/cli";
import { render, raw } from "./jsx-runtime/index.ts";
import type { LocaleCode } from "./types/locale.ts";
import { LOCALE_CODES, PAGE_LOCALES } from "./types/locale.ts";
import type { Table } from "./types/table.ts";
import type { Word } from "./types/word.ts";
import type { Term } from "./types/term.ts";
import { loadTable } from "./lib/yaml-loader.ts";
import { processMarkdown } from "./lib/markdown.ts";
import { Table as TableComponent } from "./components/Table.tsx";
import { Layout } from "./components/Layout.tsx";
import { romanize, getCharacterReadings } from "./lib/romanization/index.ts";
import type { CharacterReading } from "./lib/romanization/types.ts";
import { generateOGImage, getOGImageFilename } from "./lib/og-image.ts";

/** Output directory */
const OUTPUT_DIR = "public_html";

/** Static assets to copy */
const STATIC_ASSETS = ["style.css", "script.js", "cc-by-sa.svg"];

/**
 * Get the base URL for links.
 * If URL_BASE environment variable is set, use absolute URLs.
 * Otherwise, use relative URLs.
 */
function getUrlBase(): string | null {
  const urlBase = Deno.env.get("URL_BASE");
  if (!urlBase) return null;
  // Ensure no trailing slash for consistent joining
  return urlBase.replace(/\/+$/, "");
}

/** Locale to markdown file mapping (only for PAGE_LOCALES) */
const LOCALE_MD_FILES: Record<string, string> = {
  en: "en.md",
  ja: "ja.md",
  ko: "ko.md",
  "zh-TW": "zh-Hant.md",
};

/** Locale to output filename mapping (only for PAGE_LOCALES) */
const LOCALE_OUTPUT_FILES: Record<string, string> = {
  en: "index.html",
  ja: "ja/index.html",
  ko: "ko/index.html",
  "zh-TW": "zh-Hant/index.html",
};

/** Page descriptions for each locale (for meta tags) */
const LOCALE_DESCRIPTIONS: Record<string, string> = {
  en: "Comparison of how computer science terms are translated in Chinese, Japanese, and Korean — featuring calques, loanwords, and cognates across the Sinosphere.",
  ja: "中国語・日本語・韓国語におけるコンピュータ科学用語の翻訳比較 — 漢字文化圏における訳語・外来語・同根語の対照表",
  ko: "중국어·일본어·한국어의 컴퓨터 과학 용어 번역 비교 — 한자문화권의 번역어·외래어·동근어 대조표",
  "zh-TW": "中文、日文、韓文電腦科學術語翻譯比較 — 漢字文化圈的譯詞、外來語、同源詞對照表",
};


/**
 * Language hrefs for navigation.
 * @param cleanUrls If true, removes index.html from URLs (e.g., "ja/" instead of "ja/index.html")
 */
function getLanguageHrefs(cleanUrls: boolean): [LocaleCode, string][] {
  return PAGE_LOCALES.map((locale) => {
    let href = LOCALE_OUTPUT_FILES[locale];
    if (cleanUrls) {
      // "index.html" -> "", "ja/index.html" -> "ja/"
      href = href.replace(/index\.html$/, "");
    }
    return [locale, href];
  });
}

/**
 * Pre-compute romanizations for all words in a table.
 * Processes all locales in the table, not just the display locale.
 * For EasternTerms, romanizes the 'read' field (phonetic reading).
 * For other terms, romanizes the 'term' field.
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

        // For EasternTerms, use the 'read' field (phonetic reading)
        // For WesternTerms with 'read', use that
        // Otherwise use the term text
        const text = word.terms.map((t) => {
          if ("read" in t && t.read) {
            // Remove spaces from read field (spaces are for character separation)
            return t.read.replace(/ /g, "");
          }
          return t.term;
        }).join("");

        const rom = await romanize(text, localeCode);
        results.set(word, { langTag: rom.langTag, text: rom.text });
      }
    }
  }

  return results;
}

/**
 * Pre-compute character readings for all words in a table for a specific display locale.
 * Uses the display locale's reader to generate readings, implementing the read_as logic.
 *
 * The reading rules are:
 * 1. If word locale == display locale: use the term's own 'read' field
 * 2. If display locale has a reader: use display locale's reader function
 * 3. Otherwise (fallback): use the term's own 'read' field (original reading)
 */
async function computeReadingsForLocale(
  table: Table,
  displayLocale: LocaleCode,
): Promise<Map<Word, Map<Term, CharacterReading[]>>> {
  const results = new Map<Word, Map<Term, CharacterReading[]>>();
  const { hasReader } = await import("./lib/romanization/index.ts");

  for (const translation of table.translations) {
    // Process all locales in the translation
    for (const [wordLocale, words] of translation.map) {
      for (const word of words) {
        const wordReadings = new Map<Term, CharacterReading[]>();
        const previousTermTexts: string[] = [];

        for (const term of word.terms) {
          if ("read" in term && term.read) {
            let readings: CharacterReading[];

            // Check if we should use the original reading or display locale's reader
            const useOriginalReading =
              wordLocale === displayLocale || !hasReader(displayLocale);

            if (useOriginalReading) {
              // Use the term's own 'read' field
              const readParts = term.read.split(" ");
              readings = [];
              for (let i = 0; i < term.term.length; i++) {
                readings.push([term.term[i], readParts[i] ?? term.term[i]]);
              }
            } else {
              // Use display locale's reader
              // Normalize the term for the target locale's reading system
              const normalizedTerm = await normalizeForReading(
                term.term,
                wordLocale,
                displayLocale,
              );
              readings = await getCharacterReadings(
                term.term,
                normalizedTerm,
                previousTermTexts,
                displayLocale,
              );
            }
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
 * Normalize characters for reading in a target locale.
 * Converts characters to the form expected by the target locale's reader.
 *
 * For Japanese target: converts to Japanese shinjitai (新字体)
 * For other targets: converts to traditional Chinese form
 */
async function normalizeForReading(
  text: string,
  sourceLocale: LocaleCode,
  targetLocale: LocaleCode,
): Promise<string> {
  const { toJapaneseShinjitai, normalizeCharacters, hasNormalizer } =
    await import("./lib/romanization/index.ts");

  if (targetLocale === "ja") {
    // For Japanese readings, convert to shinjitai
    return toJapaneseShinjitai(text, sourceLocale);
  }

  // For other locales, use the source locale's normalizer (to traditional Chinese)
  if (hasNormalizer(sourceLocale)) {
    return normalizeCharacters(text, sourceLocale);
  }
  return text;
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
 * Cache for computed readings per (table, displayLocale) pair.
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

  // Get or compute readings (cached per table + display locale)
  const readingsCacheKey = `${tablePath}:${locale}`;
  let readings = readingsCache.get(readingsCacheKey);
  if (!readings) {
    readings = await computeReadingsForLocale(table, locale);
    readingsCache.set(readingsCacheKey, readings);
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
  const urlBase = getUrlBase();
  const useAbsoluteUrls = urlBase !== null;
  const langHrefs = getLanguageHrefs(useAbsoluteUrls);
  const baseUrl = urlBase ?? (locale === "en" ? "." : "..");

  // Build canonical URL and OG image URL if URL_BASE is set
  const outputHref = LOCALE_OUTPUT_FILES[locale].replace(/index\.html$/, "");
  const canonicalUrl = urlBase ? `${urlBase}/${outputHref}` : undefined;
  const ogImageFilename = getOGImageFilename(mdFile);
  const ogImage = urlBase ? `${urlBase}/${ogImageFilename}` : undefined;

  const page = Layout({
    title,
    description: LOCALE_DESCRIPTIONS[locale],
    locale,
    langHrefs,
    content: raw(contentHtml),
    baseUrl,
    canonicalUrl,
    ogImage,
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
 * Generate OG images for all locales.
 */
async function generateOGImages(): Promise<void> {
  console.log("\nGenerating OG images...");
  for (const locale of PAGE_LOCALES) {
    const mdFile = LOCALE_MD_FILES[locale];
    const md = await Deno.readTextFile(mdFile);
    const title = getTitle(md);
    const filename = getOGImageFilename(mdFile);
    console.log(`  Generating ${filename}...`);
    const pngData = await generateOGImage(locale, title);
    await Deno.writeFile(`${OUTPUT_DIR}/${filename}`, pngData);
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
  for (const locale of PAGE_LOCALES) {
    await buildPage(locale);
  }

  // Copy static assets
  await copyStaticAssets();

  // Generate OG images
  await generateOGImages();

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
      if (!PAGE_LOCALES.includes(locale)) {
        console.error(`Unknown locale: ${args.locale}`);
        console.error(`Valid locales: ${PAGE_LOCALES.join(", ")}`);
        Deno.exit(1);
      }
      await ensureDir(OUTPUT_DIR);
      await buildPage(locale);
      await copyStaticAssets();
      // Generate OG image for this locale
      const mdFile = LOCALE_MD_FILES[locale];
      const md = await Deno.readTextFile(mdFile);
      const ogTitle = getTitle(md);
      const filename = getOGImageFilename(mdFile);
      console.log(`\nGenerating ${filename}...`);
      const pngData = await generateOGImage(locale, ogTitle);
      await Deno.writeFile(`${OUTPUT_DIR}/${filename}`, pngData);
    } else {
      await build();
    }
  } catch (error) {
    console.error("Build failed:", error);
    Deno.exit(1);
  }
}
