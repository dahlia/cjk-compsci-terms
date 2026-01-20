import { assertEquals } from "@std/assert";
import {
  CHINESE_SIMPLIFIED_LANG_TAG,
  CHINESE_TRADITIONAL_LANG_TAG,
  readChinese,
  romanizeSimplifiedChinese,
  romanizeTraditionalChinese,
  toPinyin,
  toPinyinPerCharacter,
} from "./chinese.ts";

Deno.test("romanizeSimplifiedChinese returns correct language tag", () => {
  const result = romanizeSimplifiedChinese("电脑");
  assertEquals(result.langTag, CHINESE_SIMPLIFIED_LANG_TAG);
});

Deno.test("romanizeTraditionalChinese returns correct language tag", () => {
  const result = romanizeTraditionalChinese("電腦");
  assertEquals(result.langTag, CHINESE_TRADITIONAL_LANG_TAG);
});

Deno.test("toPinyin converts simplified Chinese to pinyin", () => {
  const result = toPinyin("电脑");
  // Result should contain pinyin with tone marks
  assertEquals(result.length > 0, true);
  // Should be ASCII with possible diacritics
  assertEquals(/^[A-Za-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+$/.test(result), true);
});

Deno.test("toPinyin converts traditional Chinese to pinyin", () => {
  const result = toPinyin("電腦");
  assertEquals(result.length > 0, true);
});

Deno.test("toPinyinPerCharacter returns array of pinyin", () => {
  const result = toPinyinPerCharacter("电脑");
  assertEquals(result.length, 2);
  assertEquals(typeof result[0], "string");
  assertEquals(typeof result[1], "string");
});

Deno.test("romanizeSimplifiedChinese removes spaces", () => {
  const result = romanizeSimplifiedChinese("软 件");
  assertEquals(result.text.includes(" "), false);
});

Deno.test("readChinese returns character-by-character readings", () => {
  const readings = readChinese("电脑", "电脑", []);
  assertEquals(readings.length, 2);
  // Each reading should be [character, pinyin]
  for (const [orig, pinyin] of readings) {
    assertEquals(typeof orig, "string");
    assertEquals(typeof pinyin, "string");
  }
});
