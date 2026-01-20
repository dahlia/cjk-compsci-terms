import { assertEquals } from "@std/assert";
import { render, raw } from "../jsx-runtime/index.ts";
import { Layout } from "./Layout.tsx";

Deno.test("Layout renders complete HTML document", () => {
  const result = render(
    Layout({
      title: "Test Page",
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
  assertEquals(result.includes('rel="canonical"'), true);
  assertEquals(result.includes('rel="alternate"'), true);
});

Deno.test("Layout uses custom baseUrl", () => {
  const result = render(
    Layout({
      title: "Test",
      locale: "en",
      langHrefs: [["en", "index.html"]],
      content: raw(""),
      baseUrl: "/static",
    })
  );

  assertEquals(result.includes('href="/static/style.css"'), true);
  assertEquals(result.includes('src="/static/script.js"'), true);
});
