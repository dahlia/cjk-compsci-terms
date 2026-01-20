/**
 * Korean romanization using es-hangul and hanja.
 */
import { romanize } from "es-hangul";
import hanjaModule from "hanja";
import type { CharacterReading, RomanizationResult } from "./types.ts";

// The hanja module has a nested default.default structure
const hanjaDefault = (hanjaModule as unknown as { default: unknown }).default;
const hanja = hanjaDefault as {
  translate: (text: string, mode: "SUBSTITUTION" | "combination") => string;
};

/** Language tag for Korean romanization (MCST standard) */
export const KOREAN_LANG_TAG = "ko-Latn-t-m0-mcst";

/**
 * Romanize Korean text (Hangul) to Latin script.
 * Uses the MCST (Ministry of Culture, Sports and Tourism) standard.
 */
export function romanizeKorean(text: string): RomanizationResult {
  const normalized = text.replace(/ /g, "");
  return {
    langTag: KOREAN_LANG_TAG,
    text: romanize(normalized),
  };
}

/**
 * Convert Hanja (Chinese characters) to Hangul.
 */
export function hanjaToHangul(text: string): string {
  return hanja.translate(text, "SUBSTITUTION");
}

/**
 * Get character-by-character readings for Korean text containing Hanja.
 * Returns pairs of [original, hangul].
 *
 * To prevent a non-spaced term from the "initial sound law"
 * (두음법칙, Dueum beopchik) which is adopted by South Korean orthography,
 * we prepend previous terms to the input and strip them from the output.
 * See: https://en.wikipedia.org/wiki/Dueum_beopchik
 */
export function readKorean(
  term: string,
  normalizedTerm: string,
  previousTerms: string[],
): CharacterReading[] {
  // Prepend previous terms to prevent dueum beopchik transformation
  const prefix = previousTerms.join("");
  const fullText = prefix + normalizedTerm;

  // Convert Hanja to Hangul
  const converted = hanjaToHangul(fullText);

  // Strip the prefix from the result
  const hangulResult = converted.slice(prefix.length);

  // Pair each original character with its Hangul reading
  const readings: CharacterReading[] = [];
  for (let i = 0; i < term.length; i++) {
    const origChar = term[i];
    const hangulChar = hangulResult[i] ?? origChar;
    readings.push([origChar, hangulChar]);
  }

  return readings;
}
