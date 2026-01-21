/**
 * Markdown processing with markdown-it and table embedding.
 * @module
 */

import MarkdownIt from "markdown-it";
import abbr from "markdown-it-abbr";
import anchor from "markdown-it-anchor";
import deflist from "markdown-it-deflist";
import footnote from "markdown-it-footnote";
import toc from "markdown-it-toc-done-right";
import type { HtmlString } from "../jsx-runtime/index.ts";
import { raw } from "../jsx-runtime/index.ts";

/**
 * Generate a URL-safe slug from heading text.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Initialize markdown-it with plugins
const md = new MarkdownIt({
  html: true, // Allow HTML tags in source
  linkify: true, // Auto-convert URLs to links
  typographer: false, // Don't replace quotes/dashes
})
  .use(abbr)
  .use(deflist)
  .use(footnote)
  .use(anchor, {
    slugify,
    permalink: false,
  })
  .use(toc, {
    slugify,
    containerClass: "toc",
    listType: "ul",
    level: [2, 3],
  });

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
 * Extract TOC title from placeholder and replace with ${toc}.
 * Returns [processedMarkdown, title].
 */
function prepareTocPlaceholder(markdown: string): [string, string] {
  let title = "Contents";
  const processed = markdown.replace(
    /<!--\s*TOC:\s*(.+?)\s*-->/i,
    (_, t: string) => {
      title = t;
      return "${toc}";
    }
  );
  return [processed, title];
}

/**
 * Wrap the generated TOC nav with proper structure.
 */
function wrapToc(html: string, title: string): string {
  // markdown-it-toc-done-right generates: <nav class="toc">...</nav>
  // We need: <div id="toc"><div><h2>Title</h2><nav class="toc">...</nav></div></div>
  return html.replace(
    /<nav class="toc">([^]*?)<\/nav>/,
    `<div id="toc"><div><h2>${title}</h2><nav class="toc">$1</nav></div></div>`
  );
}

/**
 * Convert markdown to HTML using markdown-it.
 */
export function markdownToHtml(markdown: string): string {
  return md.render(markdown);
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

  // 3. Prepare TOC placeholder (convert <!-- TOC: Title --> to ${toc})
  const [withTocPlaceholder, tocTitle] = prepareTocPlaceholder(processed);

  // 4. Convert markdown to HTML (TOC is generated automatically)
  let html = markdownToHtml(withTocPlaceholder);

  // 5. Wrap TOC with proper structure
  html = wrapToc(html, tocTitle);

  return raw(html);
}

// Legacy exports for tests (keeping backward compatibility)
export function extractToc(markdown: string): { id: string; text: string; level: number }[] {
  const tocItems: { id: string; text: string; level: number }[] = [];
  const atxRegex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = atxRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    const id = slugify(text);
    tocItems.push({ id, text, level });
  }
  const setextH2Regex = /^(.+)\n-{2,}$/gm;
  while ((match = setextH2Regex.exec(markdown)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    const id = slugify(text);
    tocItems.push({ id, text, level: 2 });
  }
  return tocItems;
}

export function renderToc(tocItems: { id: string; text: string; level: number }[]): string {
  if (tocItems.length === 0) return "";
  let html = '<nav class="toc"><ul>';
  for (const item of tocItems) {
    html += `<li class="toc-level-${item.level}"><a href="#${item.id}">${item.text}</a></li>`;
  }
  html += "</ul></nav>";
  return html;
}

export function insertToc(html: string, tocHtml: string): string {
  return html.replace(
    /<!--\s*TOC:\s*(.+?)\s*-->/i,
    (_, title: string) => {
      if (!tocHtml) return "";
      return `<div id="toc"><div><h2>${title}</h2>${tocHtml}</div></div>`;
    }
  );
}
