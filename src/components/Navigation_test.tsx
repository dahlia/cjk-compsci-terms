import { assertEquals } from "@std/assert";
import { render } from "../jsx-runtime/index.ts";
import { Navigation } from "./Navigation.tsx";

Deno.test("Navigation renders language links", () => {
  const result = render(
    Navigation({
      locale: "en",
      langHrefs: [
        ["en", "index.html"],
        ["ja", "ja.html"],
      ],
    })
  );

  assertEquals(result.includes("<nav>"), true);
  assertEquals(result.includes("</nav>"), true);
  assertEquals(result.includes('href="./index.html"'), true);
  assertEquals(result.includes('href="./ja.html"'), true);
});

Deno.test("Navigation marks current locale as canonical", () => {
  const result = render(
    Navigation({
      locale: "ja",
      langHrefs: [
        ["en", "index.html"],
        ["ja", "ja.html"],
      ],
    })
  );

  // ja should be canonical, en should be alternate
  assertEquals(result.includes('hreflang="ja"'), true);
  assertEquals(result.includes('hreflang="en"'), true);
});

Deno.test("Navigation includes GitHub and license links", () => {
  const result = render(
    Navigation({
      locale: "en",
      langHrefs: [],
    })
  );

  assertEquals(result.includes("GitHub"), true);
  assertEquals(result.includes("CC BY-SA 4.0"), true);
  assertEquals(result.includes('rel="source-code"'), true);
  assertEquals(result.includes('rel="license"'), true);
});

Deno.test("Navigation uses baseUrl for links", () => {
  const result = render(
    Navigation({
      locale: "en",
      langHrefs: [["en", "index.html"]],
      baseUrl: "/app",
    })
  );

  assertEquals(result.includes('href="/app/index.html"'), true);
});
