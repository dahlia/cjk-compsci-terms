import { assertEquals } from "@std/assert";
import {
  CANTONESE_LANG_TAG,
  formatJyutpingTones,
  readCantonese,
  romanizeCantonese,
  toJyutping,
} from "./cantonese.ts";

Deno.test("romanizeCantonese returns correct language tag", () => {
  const result = romanizeCantonese("電腦");
  assertEquals(result.langTag, CANTONESE_LANG_TAG);
});

Deno.test("formatJyutpingTones converts numbers to superscript", () => {
  const result = formatJyutpingTones("din6 nou5");
  assertEquals(result, "din<sup>6</sup>nou<sup>5</sup>");
});

Deno.test("formatJyutpingTones handles already formatted text", () => {
  const result = formatJyutpingTones("din6");
  assertEquals(result, "din<sup>6</sup>");
});

Deno.test("toJyutping converts Chinese to jyutping", () => {
  const result = toJyutping("電腦");
  // Result should contain jyutping
  assertEquals(result.length > 0, true);
});

Deno.test("romanizeCantonese passes through already romanized text", () => {
  const result = romanizeCantonese("din6 nou5");
  // Should format tones but preserve the text
  assertEquals(result.text.includes("<sup>"), true);
});

Deno.test("readCantonese returns character-by-character readings", () => {
  const readings = readCantonese("電腦", "電腦", []);
  assertEquals(readings.length, 2);
  // Each reading should be [character, jyutping]
  for (const [orig, jyutping] of readings) {
    assertEquals(typeof orig, "string");
    assertEquals(typeof jyutping, "string");
  }
});
