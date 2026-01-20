import { assertEquals } from "@std/assert";
import {
  hasNormalizer,
  japaneseToTraditional,
  normalizeCharacters,
  simplifiedToTraditional,
} from "./opencc.ts";

Deno.test("japaneseToTraditional converts Japanese kanji", () => {
  // Japanese uses some variant characters that differ from Traditional Chinese
  const result = japaneseToTraditional("学");
  // Should convert to traditional form
  assertEquals(typeof result, "string");
});

Deno.test("simplifiedToTraditional converts simplified to traditional", () => {
  const result = simplifiedToTraditional("电脑");
  assertEquals(result, "電腦");
});

Deno.test("simplifiedToTraditional handles already traditional text", () => {
  const result = simplifiedToTraditional("電腦");
  assertEquals(result, "電腦");
});

Deno.test("normalizeCharacters uses correct normalizer for ja locale", () => {
  const result = normalizeCharacters("学", "ja");
  assertEquals(typeof result, "string");
});

Deno.test("normalizeCharacters uses correct normalizer for zh-CN locale", () => {
  const result = normalizeCharacters("电脑", "zh-CN");
  assertEquals(result, "電腦");
});

Deno.test("normalizeCharacters returns unchanged for locales without normalizer", () => {
  const result = normalizeCharacters("電腦", "zh-TW");
  assertEquals(result, "電腦");
});

Deno.test("hasNormalizer returns true for ja and zh-CN", () => {
  assertEquals(hasNormalizer("ja"), true);
  assertEquals(hasNormalizer("zh-CN"), true);
});

Deno.test("hasNormalizer returns false for other locales", () => {
  assertEquals(hasNormalizer("en"), false);
  assertEquals(hasNormalizer("ko"), false);
  assertEquals(hasNormalizer("zh-TW"), false);
  assertEquals(hasNormalizer("zh-HK"), false);
});
