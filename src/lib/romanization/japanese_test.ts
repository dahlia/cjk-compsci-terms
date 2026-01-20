import { assertEquals } from "@std/assert";
import {
  JAPANESE_LANG_TAG,
  readJapanese,
  romanizeJapanese,
  toHiragana,
} from "./japanese.ts";

Deno.test("romanizeJapanese returns correct language tag", async () => {
  const result = await romanizeJapanese("コンピュータ");
  assertEquals(result.langTag, JAPANESE_LANG_TAG);
});

Deno.test("romanizeJapanese converts katakana to romaji", async () => {
  const result = await romanizeJapanese("コンピュータ");
  // Check that it produces non-empty output (may include special chars)
  assertEquals(result.text.length > 0, true);
  // Result should contain romaji characters (Hepburn: ン before p becomes m)
  // Note: Kuroshiro uses macrons (ū) for long vowels
  assertEquals(/kompy[uū]/i.test(result.text), true);
});

Deno.test("romanizeJapanese converts hiragana to romaji", async () => {
  const result = await romanizeJapanese("ひらがな");
  assertEquals(/^[a-z]+$/i.test(result.text), true);
});

Deno.test("romanizeJapanese removes spaces", async () => {
  const result = await romanizeJapanese("ソフト ウェア");
  // Should not contain spaces
  assertEquals(result.text.includes(" "), false);
});

Deno.test("toHiragana converts text to hiragana", async () => {
  // Test with kanji which should definitely be converted to hiragana
  const result = await toHiragana("日本");
  // Result should be hiragana (にほん or にっぽん)
  assertEquals(result.length > 0, true);
  // Should contain hiragana characters
  assertEquals(/^[\u3040-\u309F]+$/.test(result), true);
});

Deno.test("readJapanese returns character-by-character readings", async () => {
  const readings = await readJapanese("日本語", "日本語", []);
  assertEquals(readings.length > 0, true);
  // Each reading should have original character and hiragana
  for (const [orig, hira] of readings) {
    assertEquals(typeof orig, "string");
    assertEquals(typeof hira, "string");
  }
});
