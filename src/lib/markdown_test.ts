import { assertEquals } from "@std/assert";
import {
  extractToc,
  findTablePlaceholders,
  insertToc,
  markdownToHtml,
  renderToc,
} from "./markdown.ts";

Deno.test("markdownToHtml converts headers", () => {
  const md = "# Header 1\n\n## Header 2\n\n### Header 3";
  const html = markdownToHtml(md);
  assertEquals(html.includes('<h1 id="header-1">Header 1</h1>'), true);
  assertEquals(html.includes('<h2 id="header-2">Header 2</h2>'), true);
  assertEquals(html.includes('<h3 id="header-3">Header 3</h3>'), true);
});

Deno.test("markdownToHtml converts bold and italic", () => {
  const md = "**bold** and *italic* text";
  const html = markdownToHtml(md);
  assertEquals(html.includes("<strong>bold</strong>"), true);
  assertEquals(html.includes("<em>italic</em>"), true);
});

Deno.test("markdownToHtml converts links", () => {
  const md = "Check [this link](https://example.com)";
  const html = markdownToHtml(md);
  assertEquals(html.includes('<a href="https://example.com">this link</a>'), true);
});

Deno.test("markdownToHtml converts inline code", () => {
  const md = "Use `code` here";
  const html = markdownToHtml(md);
  assertEquals(html.includes("<code>code</code>"), true);
});

Deno.test("markdownToHtml converts definition lists", () => {
  const md = "Term\n:   Definition here";
  const html = markdownToHtml(md);
  assertEquals(html.includes("<dl>"), true);
  assertEquals(html.includes("<dt>Term</dt>"), true);
  assertEquals(html.includes("<dd>Definition here</dd>"), true);
});

Deno.test("markdownToHtml converts images", () => {
  const md = "![Alt text](image.png)";
  const html = markdownToHtml(md);
  assertEquals(html.includes('<img src="image.png" alt="Alt text"'), true);
});

Deno.test("markdownToHtml preserves HTML tags", () => {
  const md = '<span lang="zh">中文</span>';
  const html = markdownToHtml(md);
  assertEquals(html.includes('<span lang="zh">中文</span>'), true);
});

Deno.test("extractToc extracts h2 and h3 headers", () => {
  const md = "# H1\n\n## Section 1\n\n### Subsection\n\n## Section 2";
  const toc = extractToc(md);
  assertEquals(toc.length, 3);
  assertEquals(toc[0].text, "Section 1");
  assertEquals(toc[0].level, 2);
  assertEquals(toc[1].text, "Subsection");
  assertEquals(toc[1].level, 3);
  assertEquals(toc[2].text, "Section 2");
  assertEquals(toc[2].level, 2);
});

Deno.test("extractToc handles setext headers", () => {
  const md = "Section\n-------\n\nContent";
  const toc = extractToc(md);
  assertEquals(toc.length, 1);
  assertEquals(toc[0].text, "Section");
  assertEquals(toc[0].level, 2);
});

Deno.test("renderToc generates nav element", () => {
  const toc = [
    { id: "sec-1", text: "Section 1", level: 2 },
    { id: "sec-2", text: "Section 2", level: 2 },
  ];
  const html = renderToc(toc);
  assertEquals(html.includes('<nav class="toc">'), true);
  assertEquals(html.includes('<a href="#sec-1">Section 1</a>'), true);
  assertEquals(html.includes('<a href="#sec-2">Section 2</a>'), true);
});

Deno.test("findTablePlaceholders finds table links with any text", () => {
  const md = `
Some text
[Show table](tables/basic.yaml)
More text
[表示](tables/programming.yaml)
[표 보기](tables/tools.yaml)
[顯示表](tables/units.yaml)
`;
  const placeholders = findTablePlaceholders(md);
  assertEquals(placeholders.length, 4);
  assertEquals(placeholders[0][1], "tables/basic.yaml");
  assertEquals(placeholders[1][1], "tables/programming.yaml");
  assertEquals(placeholders[2][1], "tables/tools.yaml");
  assertEquals(placeholders[3][1], "tables/units.yaml");
});

Deno.test("findTablePlaceholders ignores non-table yaml links", () => {
  const md = `[Config](config.yaml)\n[Data](data/test.yaml)`;
  const placeholders = findTablePlaceholders(md);
  assertEquals(placeholders.length, 0);
});

Deno.test("markdownToHtml converts footnotes", () => {
  const md = "Text with footnote[^1].\n\n[^1]: This is the footnote.";
  const html = markdownToHtml(md);
  assertEquals(html.includes("footnote"), true);
  assertEquals(html.includes("This is the footnote"), true);
});

Deno.test("insertToc replaces TOC placeholder", () => {
  const html = "Header\n<!-- TOC: Contents -->\nBody";
  const toc = '<nav class="toc">...</nav>';
  const result = insertToc(html, toc);
  assertEquals(result.includes("<!-- TOC: Contents -->"), false);
  assertEquals(result.includes('<nav class="toc">'), true);
});
