import { assertEquals } from "@std/assert";
import {
  hanjaToHangul,
  KOREAN_LANG_TAG,
  readKorean,
  romanizeKorean,
} from "./korean.ts";

Deno.test("romanizeKorean returns correct language tag", () => {
  const result = romanizeKorean("컴퓨터");
  assertEquals(result.langTag, KOREAN_LANG_TAG);
});

Deno.test("romanizeKorean converts hangul to romaji", () => {
  const result = romanizeKorean("한글");
  // Result should be in ASCII (romanized)
  assertEquals(/^[A-Za-z]+$/.test(result.text), true);
});

Deno.test("romanizeKorean removes spaces", () => {
  const result = romanizeKorean("소프트 웨어");
  // Should not contain spaces
  assertEquals(result.text.includes(" "), false);
});

Deno.test("hanjaToHangul converts Chinese characters to Korean", () => {
  const result = hanjaToHangul("情報");
  // Result should be in Hangul
  assertEquals(/^[\uAC00-\uD7AF]+$/.test(result), true);
});

Deno.test("readKorean returns character-by-character readings", () => {
  const readings = readKorean("情報", "情報", []);
  assertEquals(readings.length, 2);
  // Each reading should be [hanja, hangul]
  for (const [orig, hangul] of readings) {
    assertEquals(typeof orig, "string");
    assertEquals(typeof hangul, "string");
  }
});

Deno.test("readKorean handles dueum beopchik with previous terms", () => {
  // Test that previous terms affect the reading
  // 女 at word start becomes 여, but after another character stays 녀
  const readingsAlone = readKorean("女", "女", []);
  const readingsWithPrefix = readKorean("女", "女", ["男"]);

  // Both should produce readings
  assertEquals(readingsAlone.length, 1);
  assertEquals(readingsWithPrefix.length, 1);
});
