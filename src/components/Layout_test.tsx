import { assertEquals } from "@std/assert";
import { render, raw } from "../jsx-runtime/index.ts";
import { Layout } from "./Layout.tsx";

Deno.test("Layout renders complete HTML document", () => {
  const result = render(
    Layout({
      title: "Test Page",
      description: "Test description",
      locale: "en",
      langHrefs: [
        ["en", "index.html"],
        ["ja", "ja.html"],
      ],
      content: raw("<main>Content</main>"),
    })
  );

  assertEquals(result.includes("<!DOCTYPE html>"), true);
  assertEquals(result.includes('<html lang="en">'), true);
  assertEquals(result.includes("<title>Test Page</title>"), true);
  assertEquals(result.includes("<main>Content</main>"), true);
});

Deno.test("Layout includes stylesheet and script links", () => {
  const result = render(
    Layout({
      title: "Test",
      description: "Test description",
      locale: "en",
      langHrefs: [],
      content: raw(""),
    })
  );

  assertEquals(result.includes('href="./style.css"'), true);
  assertEquals(result.includes('src="./script.js"'), true);
});

Deno.test("Layout renders navigation with language links", () => {
  const result = render(
    Layout({
      title: "Test",
      description: "Test description",
      locale: "en",
      langHrefs: [
        ["en", "index.html"],
        ["ko", "ko.html"],
      ],
      content: raw(""),
    })
  );

  assertEquals(result.includes('hreflang="en"'), true);
  assertEquals(result.includes('hreflang="ko"'), true);
});

Deno.test("Layout uses custom baseUrl", () => {
  const result = render(
    Layout({
      title: "Test",
      description: "Test description",
      locale: "en",
      langHrefs: [["en", "index.html"]],
      content: raw(""),
      baseUrl: "/static",
    })
  );

  assertEquals(result.includes('href="/static/style.css"'), true);
  assertEquals(result.includes('src="/static/script.js"'), true);
});

Deno.test("Layout includes meta description", () => {
  const result = render(
    Layout({
      title: "Test",
      description: "A test description for SEO",
      locale: "en",
      langHrefs: [],
      content: raw(""),
    })
  );

  assertEquals(result.includes('name="description"'), true);
  assertEquals(result.includes("A test description for SEO"), true);
});

Deno.test("Layout includes Open Graph meta tags", () => {
  const result = render(
    Layout({
      title: "OG Test",
      description: "OG description",
      locale: "ko",
      langHrefs: [],
      content: raw(""),
      canonicalUrl: "https://example.com/ko/",
      ogImage: "https://example.com/og-image.png",
    })
  );

  assertEquals(result.includes('property="og:type"'), true);
  assertEquals(result.includes('property="og:title"'), true);
  assertEquals(result.includes('property="og:description"'), true);
  assertEquals(result.includes('property="og:url"'), true);
  assertEquals(result.includes('property="og:image"'), true);
  assertEquals(result.includes('property="og:locale"'), true);
  assertEquals(result.includes('content="ko"'), true);
});

Deno.test("Layout includes Twitter Card meta tags", () => {
  const result = render(
    Layout({
      title: "Twitter Test",
      description: "Twitter description",
      locale: "en",
      langHrefs: [],
      content: raw(""),
      ogImage: "https://example.com/og-image.png",
    })
  );

  assertEquals(result.includes('name="twitter:card"'), true);
  assertEquals(result.includes('content="summary_large_image"'), true);
  assertEquals(result.includes('name="twitter:title"'), true);
  assertEquals(result.includes('name="twitter:description"'), true);
  assertEquals(result.includes('name="twitter:image"'), true);
});

Deno.test("Layout includes canonical link when provided", () => {
  const result = render(
    Layout({
      title: "Canonical Test",
      description: "Test",
      locale: "en",
      langHrefs: [],
      content: raw(""),
      canonicalUrl: "https://example.com/",
    })
  );

  assertEquals(result.includes('rel="canonical"'), true);
  assertEquals(result.includes('href="https://example.com/"'), true);
});

Deno.test("Layout includes alternate language links", () => {
  const result = render(
    Layout({
      title: "Alternate Test",
      description: "Test",
      locale: "en",
      langHrefs: [
        ["en", ""],
        ["ja", "ja/"],
        ["ko", "ko/"],
      ],
      content: raw(""),
      canonicalUrl: "https://example.com/",
    })
  );

  assertEquals(result.includes('rel="alternate" hreflang="en"'), true);
  assertEquals(result.includes('rel="alternate" hreflang="ja"'), true);
  assertEquals(result.includes('rel="alternate" hreflang="ko"'), true);
});
