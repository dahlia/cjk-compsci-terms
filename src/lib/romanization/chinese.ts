/**
 * Chinese (Mandarin) romanization using pinyin.
 * Handles both Simplified (zh-CN) and Traditional (zh-TW) Chinese.
 */
import { pinyin as pinyinFunc } from "pinyin";
import type { CharacterReading, RomanizationResult } from "./types.ts";

// STYLE_TONE = 1: with tone marks (e.g., diàn)
const STYLE_TONE = 1;

// Wrapper function for pinyin
function pinyin(
  text: string,
  options: { style?: number; heteronym?: boolean },
): string[][] {
  return pinyinFunc(text, options);
}

/** Language tag for Simplified Chinese Pinyin */
export const CHINESE_SIMPLIFIED_LANG_TAG = "zh-CN-Latn-pny";

/** Language tag for Traditional Chinese Pinyin */
export const CHINESE_TRADITIONAL_LANG_TAG = "zh-TW-Latn-pny";

/**
 * Convert Chinese text to Pinyin.
 */
export function toPinyin(text: string): string {
  // pinyin returns array of arrays (each character can have multiple pronunciations)
  // We take the first pronunciation for each character
  const result = pinyin(text, {
    style: STYLE_TONE, // With tone marks (e.g., diàn)
    heteronym: false, // Don't return all possible pronunciations
  });
  return result.map((arr: string[]) => arr[0]).join("");
}

/**
 * Get Pinyin for each character (space-separated).
 */
export function toPinyinPerCharacter(text: string): string[] {
  const result = pinyin(text, {
    style: STYLE_TONE,
    heteronym: false,
  });
  return result.map((arr: string[]) => arr[0]);
}

/**
 * Romanize Simplified Chinese text to Pinyin.
 */
export function romanizeSimplifiedChinese(text: string): RomanizationResult {
  const normalized = text.replace(/ /g, "");
  return {
    langTag: CHINESE_SIMPLIFIED_LANG_TAG,
    text: toPinyin(normalized),
  };
}

/**
 * Romanize Traditional Chinese text to Pinyin.
 * Note: zh-TW uses Zhuyin (Bopomofo) natively, but we convert to Pinyin for romanization.
 */
export function romanizeTraditionalChinese(text: string): RomanizationResult {
  const normalized = text.replace(/ /g, "");
  return {
    langTag: CHINESE_TRADITIONAL_LANG_TAG,
    text: toPinyin(normalized),
  };
}

/**
 * Get character-by-character readings for Chinese text.
 * Returns pairs of [character, pinyin].
 */
export function readChinese(
  term: string,
  normalizedTerm: string,
  _previousTerms: string[],
): CharacterReading[] {
  const pinyinList = toPinyinPerCharacter(normalizedTerm);
  const readings: CharacterReading[] = [];

  for (let i = 0; i < term.length; i++) {
    const origChar = term[i];
    const pinyinReading = pinyinList[i] ?? origChar;
    readings.push([origChar, pinyinReading]);
  }

  return readings;
}
