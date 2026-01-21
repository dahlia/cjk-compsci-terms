/**
 * Romanization system for CJK languages.
 * Provides unified API for converting CJK text to Latin script.
 * @module
 */

import type { LocaleCode } from "../../types/locale.ts";
import type {
  CharacterReading,
  LanguageTag,
  Reader,
  RomanizationResult,
  Romanizer,
} from "./types.ts";

// Import language-specific modules
import {
  JAPANESE_LANG_TAG,
  readJapanese,
  romanizeJapanese,
} from "./japanese.ts";
import { KOREAN_LANG_TAG, readKorean, romanizeKorean } from "./korean.ts";
import {
  CHINESE_SIMPLIFIED_LANG_TAG,
  CHINESE_TRADITIONAL_LANG_TAG,
  readChinese,
  readTraditionalChinese,
  romanizeSimplifiedChinese,
  romanizeTraditionalChinese,
} from "./chinese.ts";
import {
  CANTONESE_LANG_TAG,
  readCantonese,
  romanizeCantonese,
} from "./cantonese.ts";
import { normalizeCharacters } from "./opencc.ts";

// Re-export types
export type { CharacterReading, LanguageTag, RomanizationResult } from "./types.ts";

// Re-export language-specific functions
export {
  JAPANESE_LANG_TAG,
  readJapanese,
  romanizeJapanese,
  toHiragana,
} from "./japanese.ts";
export {
  hanjaToHangul,
  KOREAN_LANG_TAG,
  readKorean,
  romanizeKorean,
} from "./korean.ts";
export {
  CHINESE_SIMPLIFIED_LANG_TAG,
  CHINESE_TRADITIONAL_LANG_TAG,
  readChinese,
  readTraditionalChinese,
  romanizeSimplifiedChinese,
  romanizeTraditionalChinese,
  toBopomofo,
  toBopomofoPerCharacter,
  toPinyin,
  toPinyinPerCharacter,
} from "./chinese.ts";
export {
  CANTONESE_LANG_TAG,
  formatJyutpingTones,
  readCantonese,
  romanizeCantonese,
  toJyutping,
  toJyutpingPerCharacter,
} from "./cantonese.ts";
export {
  hasNormalizer,
  japaneseToTraditional,
  normalizeCharacters,
  simplifiedToTraditional,
} from "./opencc.ts";

/**
 * Map of locale codes to their romanizers.
 */
const romanizers: Partial<Record<LocaleCode, Romanizer>> = {
  ja: romanizeJapanese,
  ko: romanizeKorean,
  "zh-CN": romanizeSimplifiedChinese,
  "zh-HK": romanizeCantonese,
  "zh-TW": romanizeTraditionalChinese,
};

/**
 * Map of locale codes to their language tags.
 */
const langTags: Record<LocaleCode, LanguageTag> = {
  en: "en-Latn",
  ja: JAPANESE_LANG_TAG,
  ko: KOREAN_LANG_TAG,
  "zh-CN": CHINESE_SIMPLIFIED_LANG_TAG,
  "zh-HK": CANTONESE_LANG_TAG,
  "zh-TW": CHINESE_TRADITIONAL_LANG_TAG,
};

/**
 * Map of locale codes to their character readers.
 */
const readers: Partial<Record<LocaleCode, Reader>> = {
  ja: readJapanese,
  ko: readKorean,
  "zh-CN": readChinese,
  "zh-HK": readCantonese,
  "zh-TW": readTraditionalChinese, // zh-TW uses Bopomofo (Zhuyin)
};

/**
 * Romanize text according to the specified locale.
 * Returns both the language tag and the romanized text.
 * May be async for some locales (like Japanese with kanji).
 */
export async function romanize(
  text: string,
  locale: LocaleCode,
): Promise<RomanizationResult> {
  const romanizer = romanizers[locale];
  if (romanizer) {
    return await romanizer(text);
  }

  // Default: just remove spaces and use generic Latin tag
  const langTag = langTags[locale] ?? `${locale.split("-")[0]}-Latn`;
  return {
    langTag,
    text: text.replace(/ /g, ""),
  };
}

/**
 * Get the language tag for a locale's romanization.
 */
export function getLanguageTag(locale: LocaleCode): LanguageTag {
  return langTags[locale] ?? `${locale.split("-")[0]}-Latn`;
}

/**
 * Get character-by-character readings for text in the specified locale.
 * Used for generating ruby annotations.
 * May be async for some locales (like Japanese with kanji).
 *
 * @param term - The original term text (for display)
 * @param normalizedTerm - The normalized term (after OpenCC conversion)
 * @param previousTerms - Previous terms in the word (for context)
 * @param locale - The target locale for readings
 */
export async function getCharacterReadings(
  term: string,
  normalizedTerm: string,
  previousTerms: string[],
  locale: LocaleCode,
): Promise<CharacterReading[]> {
  const reader = readers[locale];
  if (reader) {
    return await reader(term, normalizedTerm, previousTerms);
  }

  // Default: return each character paired with itself
  return [...term].map((char) => [char, char]);
}

/**
 * Check if a locale has a romanization system.
 */
export function hasRomanizer(locale: LocaleCode): boolean {
  return locale in romanizers;
}

/**
 * Check if a locale has a character reader.
 */
export function hasReader(locale: LocaleCode): boolean {
  return locale in readers;
}
