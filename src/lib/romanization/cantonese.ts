/**
 * Cantonese romanization using Jyutping via to-jyutping.
 */
import ToJyutping from "to-jyutping";
import type { CharacterReading, RomanizationResult } from "./types.ts";

/** Language tag for Cantonese Jyutping romanization */
export const CANTONESE_LANG_TAG = "yue-HK-Latn-jyutping";

/**
 * Convert Jyutping tone numbers to superscript HTML.
 * e.g., "din6" -> "din<sup>6</sup>"
 */
export function formatJyutpingTones(jyutping: string): string {
  return jyutping.replace(/(\d) ?/g, "<sup>$1</sup>");
}

/**
 * Convert Chinese text to Jyutping (Cantonese romanization).
 */
export function toJyutping(text: string): string {
  const result = ToJyutping.getJyutpingList(text);
  return result.map(([, jp]: [string, string | null]) => jp ?? "").join(" ");
}

/**
 * Get Jyutping for each character.
 */
export function toJyutpingPerCharacter(text: string): string[] {
  const result = ToJyutping.getJyutpingList(text);
  return result.map(([, jp]: [string, string | null]) => jp ?? "");
}

/**
 * Romanize Cantonese text to Jyutping with tone superscripts.
 * If the input is already romanized (ASCII only), just format the tones.
 */
export function romanizeCantonese(text: string): RomanizationResult {
  const normalized = text.replace(/ /g, "");

  // Check if already romanized (ASCII + numbers only)
  if (/^[A-Za-z0-9 ]+$/.test(text)) {
    return {
      langTag: CANTONESE_LANG_TAG,
      text: formatJyutpingTones(text),
    };
  }

  const jyutping = toJyutping(normalized);
  return {
    langTag: CANTONESE_LANG_TAG,
    text: formatJyutpingTones(jyutping),
  };
}

/**
 * Get character-by-character readings for Cantonese text.
 * Returns pairs of [character, jyutping].
 */
export function readCantonese(
  term: string,
  normalizedTerm: string,
  _previousTerms: string[],
): CharacterReading[] {
  const jyutpingList = toJyutpingPerCharacter(normalizedTerm);
  const readings: CharacterReading[] = [];

  for (let i = 0; i < term.length; i++) {
    const origChar = term[i];
    const jyutpingReading = jyutpingList[i] ?? origChar;
    readings.push([origChar, jyutpingReading]);
  }

  return readings;
}
