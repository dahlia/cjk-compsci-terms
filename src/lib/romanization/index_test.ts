import { assertEquals } from "@std/assert";
import {
  getCharacterReadings,
  getLanguageTag,
  hasReader,
  hasRomanizer,
  romanize,
} from "./index.ts";

Deno.test("romanize handles Japanese", async () => {
  const result = await romanize("コンピュータ", "ja");
  assertEquals(result.langTag, "ja-Latn-hepburn");
  assertEquals(result.text.length > 0, true);
});

Deno.test("romanize handles Korean", async () => {
  const result = await romanize("컴퓨터", "ko");
  assertEquals(result.langTag, "ko-Latn-t-m0-mcst");
  assertEquals(result.text.length > 0, true);
});

Deno.test("romanize handles Simplified Chinese", async () => {
  const result = await romanize("电脑", "zh-CN");
  assertEquals(result.langTag, "zh-CN-Latn-pny");
  assertEquals(result.text.length > 0, true);
});

Deno.test("romanize handles Traditional Chinese", async () => {
  const result = await romanize("電腦", "zh-TW");
  assertEquals(result.langTag, "zh-TW-Latn-pny");
  assertEquals(result.text.length > 0, true);
});

Deno.test("romanize handles Cantonese", async () => {
  const result = await romanize("電腦", "zh-HK");
  assertEquals(result.langTag, "yue-HK-Latn-jyutping");
  assertEquals(result.text.length > 0, true);
});

Deno.test("romanize handles English (passthrough)", async () => {
  const result = await romanize("computer", "en");
  assertEquals(result.langTag, "en-Latn");
  assertEquals(result.text, "computer");
});

Deno.test("getLanguageTag returns correct tags", () => {
  assertEquals(getLanguageTag("ja"), "ja-Latn-hepburn");
  assertEquals(getLanguageTag("ko"), "ko-Latn-t-m0-mcst");
  assertEquals(getLanguageTag("zh-CN"), "zh-CN-Latn-pny");
  assertEquals(getLanguageTag("zh-HK"), "yue-HK-Latn-jyutping");
  assertEquals(getLanguageTag("zh-TW"), "zh-TW-Latn-pny");
  assertEquals(getLanguageTag("en"), "en-Latn");
});

Deno.test("getCharacterReadings works for Japanese", async () => {
  const readings = await getCharacterReadings("日本", "日本", [], "ja");
  assertEquals(readings.length > 0, true);
});

Deno.test("getCharacterReadings works for Korean", async () => {
  const readings = await getCharacterReadings("情報", "情報", [], "ko");
  assertEquals(readings.length, 2);
});

Deno.test("getCharacterReadings works for Chinese", async () => {
  const readings = await getCharacterReadings("电脑", "电脑", [], "zh-CN");
  assertEquals(readings.length, 2);
});

Deno.test("getCharacterReadings falls back for English", async () => {
  const readings = await getCharacterReadings("abc", "abc", [], "en");
  assertEquals(readings.length, 3);
  assertEquals(readings[0], ["a", "a"]);
});

Deno.test("hasRomanizer returns true for CJK locales", () => {
  assertEquals(hasRomanizer("ja"), true);
  assertEquals(hasRomanizer("ko"), true);
  assertEquals(hasRomanizer("zh-CN"), true);
  assertEquals(hasRomanizer("zh-HK"), true);
  assertEquals(hasRomanizer("zh-TW"), true);
});

Deno.test("hasRomanizer returns false for English", () => {
  assertEquals(hasRomanizer("en"), false);
});

Deno.test("hasReader returns true for CJK locales", () => {
  assertEquals(hasReader("ja"), true);
  assertEquals(hasReader("ko"), true);
  assertEquals(hasReader("zh-CN"), true);
  assertEquals(hasReader("zh-HK"), true);
  assertEquals(hasReader("zh-TW"), true);
});

Deno.test("hasReader returns false for English", () => {
  assertEquals(hasReader("en"), false);
});
