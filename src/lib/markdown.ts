/**
 * Markdown processing with markdown-it and table embedding.
 * @module
 */

import MarkdownIt from "markdown-it";
import abbr from "markdown-it-abbr";
import deflist from "markdown-it-deflist";
import footnote from "markdown-it-footnote";
import type { HtmlString } from "../jsx-runtime/index.ts";
import { raw } from "../jsx-runtime/index.ts";

// Initialize markdown-it with plugins
const md = new MarkdownIt({
  html: true, // Allow HTML tags in source
  linkify: true, // Auto-convert URLs to links
  typographer: false, // Don't replace quotes/dashes
}).use(abbr).use(deflist).use(footnote);

/**
 * Remove <!-- hide -->...<!-- /hide --> sections from markdown.
 */
function removeHideSections(markdown: string): string {
  return markdown.replace(/<!--\s*hide\s*-->[\s\S]*?<!--\s*\/hide\s*-->/gi, "");
}

/**
 * Find table placeholders in markdown.
 * Matches any link text pointing to tables/*.yaml files.
 * Returns array of [placeholder, tablePath] tuples.
 */
export function findTablePlaceholders(markdown: string): [string, string][] {
  const regex = /\[[^\]]+\]\((tables\/[^)]+\.yaml)\)/g;
  const matches: [string, string][] = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    matches.push([match[0], match[1]]);
  }
  return matches;
}

/**
 * Extract TOC (Table of Contents) from markdown.
 * Only includes h2 and h3 headers (## and ###).
 */
export function extractToc(markdown: string): { id: string; text: string; level: number }[] {
  const toc: { id: string; text: string; level: number }[] = [];

  // Match ATX headers (## and ###)
  const atxRegex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = atxRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/<[^>]+>/g, "").trim(); // Strip HTML tags
    const id = generateId(text);
    toc.push({ id, text, level });
  }

  // Match setext h2 headers (underlined with --)
  const setextH2Regex = /^(.+)\n-{2,}$/gm;
  while ((match = setextH2Regex.exec(markdown)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    const id = generateId(text);
    toc.push({ id, text, level: 2 });
  }

  return toc;
}

/**
 * Generate a URL-safe ID from heading text.
 */
function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Generate TOC HTML (just the nav element with ul).
 */
export function renderToc(toc: { id: string; text: string; level: number }[]): string {
  if (toc.length === 0) return "";

  let html = '<nav class="toc"><ul>';
  for (const item of toc) {
    html += `<li class="toc-level-${item.level}"><a href="#${item.id}">${item.text}</a></li>`;
  }
  html += "</ul></nav>";
  return html;
}

/**
 * Replace TOC placeholder with rendered TOC.
 * Extracts the title from the placeholder comment and wraps TOC in proper structure.
 * Format: <!-- TOC: Title --> becomes <div id="toc"><div><h2>Title</h2>...</div></div>
 */
export function insertToc(html: string, toc: string): string {
  return html.replace(
    /<!--\s*TOC:\s*(.+?)\s*-->/i,
    (_, title: string) => {
      if (!toc) return "";
      return `<div id="toc"><div><h2>${title}</h2>${toc}</div></div>`;
    }
  );
}

/**
 * Add IDs to headers in rendered HTML for anchor links.
 */
function addHeaderIds(html: string): string {
  // Add id attributes to h1-h6 tags that don't have them
  return html.replace(
    /<(h[1-6])>([^<]+)<\/h[1-6]>/g,
    (_, tag: string, text: string) => {
      const id = generateId(text);
      return `<${tag} id="${id}">${text}</${tag}>`;
    }
  );
}

/**
 * Convert markdown to HTML using markdown-it.
 */
export function markdownToHtml(markdown: string): string {
  const html = md.render(markdown);
  return addHeaderIds(html);
}

/**
 * Process markdown content with table embedding.
 */
export function processMarkdown(
  markdown: string,
  tableRenderer: (tablePath: string) => HtmlString,
): HtmlString {
  // 1. Remove hide sections
  let processed = removeHideSections(markdown);

  // 2. Replace table placeholders before markdown processing
  const tablePlaceholders = findTablePlaceholders(processed);
  for (const [placeholder, tablePath] of tablePlaceholders) {
    const tableHtml = tableRenderer(tablePath);
    processed = processed.replace(placeholder, tableHtml.__html);
  }

  // 3. Extract TOC before converting (from original with tables replaced)
  const toc = extractToc(processed);
  const tocHtml = renderToc(toc);

  // 4. Convert markdown to HTML
  let html = markdownToHtml(processed);

  // 5. Insert TOC
  html = insertToc(html, tocHtml);

  return raw(html);
}
