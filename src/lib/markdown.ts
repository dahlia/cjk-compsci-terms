/**
 * Markdown processing with table embedding.
 * @module
 */

import type { HtmlString } from "../jsx-runtime/index.ts";
import { raw } from "../jsx-runtime/index.ts";

/**
 * Convert markdown to HTML using basic patterns.
 * This is a simple implementation for the specific markdown used in this project.
 */
export function markdownToHtml(md: string): string {
  let html = md;

  // Remove <!-- hide -->...<!-- /hide --> sections
  html = html.replace(/<!--\s*hide\s*-->[\s\S]*?<!--\s*\/hide\s*-->/gi, "");

  // Convert headers (# Header)
  html = html.replace(
    /^(#{1,6})\s+(.+)$/gm,
    (_, hashes: string, text: string) => {
      const level = hashes.length;
      const id = generateId(text);
      return `<h${level} id="${id}">${text}</h${level}>`;
    }
  );

  // Convert setext headers (Header\n======)
  html = html.replace(
    /^(.+)\n=+$/gm,
    (_, text: string) => {
      const id = generateId(text);
      return `<h1 id="${id}">${text}</h1>`;
    }
  );
  html = html.replace(
    /^(.+)\n-+$/gm,
    (_, text: string) => {
      const id = generateId(text);
      return `<h2 id="${id}">${text}</h2>`;
    }
  );

  // Convert definition lists (Term\n: Definition)
  html = html.replace(
    /^([^\n]+)\n:\s+(.+)$/gm,
    "<dt>$1</dt>\n<dd>$2</dd>"
  );
  html = html.replace(
    /(<dt>[\s\S]*?<\/dd>\n?)+/g,
    (match) => `<dl>\n${match}</dl>\n`
  );

  // Convert footnotes [^n]
  const footnotes: Map<string, string> = new Map();
  html = html.replace(
    /^\[\^(\d+)\]:\s+(.+)$/gm,
    (_, id: string, text: string) => {
      footnotes.set(id, text);
      return "";
    }
  );
  html = html.replace(/\[\^(\d+)\]/g, (_, id: string) => {
    return `<sup><a href="#fn${id}" id="fnref${id}">[${id}]</a></sup>`;
  });

  // Add footnotes section at the end
  if (footnotes.size > 0) {
    let footnotesHtml = '<aside class="footnotes"><ol>';
    for (const [id, text] of footnotes) {
      footnotesHtml += `<li id="fn${id}">${text} <a href="#fnref${id}">↩</a></li>`;
    }
    footnotesHtml += "</ol></aside>";
    html += footnotesHtml;
  }

  // Convert bold **text** and __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  // Convert italic *text* and _text_
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");

  // Convert links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2">$1</a>'
  );

  // Convert reference-style links [text][ref] and [ref]: url
  const refs: Map<string, string> = new Map();
  html = html.replace(
    /^\[([^\]]+)\]:\s*(.+)$/gm,
    (_, ref: string, url: string) => {
      refs.set(ref.toLowerCase(), url.trim());
      return "";
    }
  );
  html = html.replace(/\[([^\]]+)\]\[([^\]]*)\]/g, (_, text: string, ref: string) => {
    const actualRef = ref || text;
    const url = refs.get(actualRef.toLowerCase());
    return url ? `<a href="${url}">${text}</a>` : `[${text}][${ref}]`;
  });

  // Convert inline code `code`
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Convert blockquotes > text
  html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/<\/blockquote>\n<blockquote>/g, "\n");

  // Convert inline quotes <q>text</q> (already HTML, pass through)

  // Convert <cite>text</cite> (already HTML, pass through)

  // Convert <span lang="...">text</span> (already HTML, pass through)

  // Convert paragraphs (blank line separated text)
  html = html
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      // Don't wrap HTML elements
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<dl") ||
        trimmed.startsWith("<dt") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<table") ||
        trimmed.startsWith("<div") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<aside") ||
        trimmed.startsWith("<!--") ||
        trimmed === ""
      ) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("\n\n");

  // Convert unordered lists
  html = html.replace(
    /^(\s*[-*]\s+.+)$/gm,
    (match) => {
      if (match.trim().startsWith("-") || match.trim().startsWith("*")) {
        return `<li>${match.replace(/^\s*[-*]\s+/, "")}</li>`;
      }
      return match;
    }
  );
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (match) => {
    if (match.includes("<li>")) {
      return `<ul>\n${match}</ul>\n`;
    }
    return match;
  });

  // Clean up empty lines
  html = html.replace(/\n{3,}/g, "\n\n");

  return html.trim();
}

/**
 * Generate a URL-safe ID from heading text.
 */
function generateId(text: string): string {
  // Remove HTML tags
  const plainText = text.replace(/<[^>]+>/g, "");
  // Convert to lowercase, replace spaces with hyphens
  return plainText
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Extract TOC (Table of Contents) from markdown.
 */
export function extractToc(md: string): { id: string; text: string; level: number }[] {
  const toc: { id: string; text: string; level: number }[] = [];

  // Match ATX headers
  const atxRegex = /^(#{2,6})\s+(.+)$/gm;
  let match;
  while ((match = atxRegex.exec(md)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/<[^>]+>/g, ""); // Strip HTML
    toc.push({ id: generateId(text), text, level });
  }

  // Match setext h2 headers
  const setextH2Regex = /^(.+)\n-{2,}$/gm;
  while ((match = setextH2Regex.exec(md)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "");
    toc.push({ id: generateId(text), text, level: 2 });
  }

  return toc;
}

/**
 * Generate TOC HTML.
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
 * Find table placeholders in markdown.
 * Returns array of [placeholder, tablePath] tuples.
 */
export function findTablePlaceholders(md: string): [string, string][] {
  const regex = /\[Show table\]\(([^)]+\.yaml)\)/g;
  const matches: [string, string][] = [];
  let match;
  while ((match = regex.exec(md)) !== null) {
    matches.push([match[0], match[1]]);
  }
  return matches;
}

/**
 * Replace TOC placeholder with rendered TOC.
 */
export function insertToc(html: string, toc: string): string {
  return html.replace(/<!--\s*TOC:\s*[^>]+\s*-->/i, toc);
}

/**
 * Process markdown content with table embedding.
 */
export function processMarkdown(
  md: string,
  tableRenderer: (tablePath: string) => HtmlString,
): HtmlString {
  // Find and replace table placeholders
  let html = md;
  const tablePlaceholders = findTablePlaceholders(md);

  for (const [placeholder, tablePath] of tablePlaceholders) {
    const tableHtml = tableRenderer(tablePath);
    html = html.replace(placeholder, tableHtml.__html);
  }

  // Convert markdown to HTML
  html = markdownToHtml(html);

  // Extract and insert TOC
  const toc = extractToc(md);
  const tocHtml = renderToc(toc);
  html = insertToc(html, tocHtml);

  return raw(html);
}
