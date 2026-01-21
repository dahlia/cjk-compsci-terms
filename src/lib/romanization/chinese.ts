/**
 * Chinese (Mandarin) romanization using pinyin and zhuyin.
 * Handles both Simplified (zh-CN) and Traditional (zh-TW) Chinese.
 * zh-CN uses Pinyin, zh-TW uses Bopomofo (Zhuyin).
 */
import { pinyin as pinyinFunc } from "pinyin";
import { pinyinToBopomofo } from "@austinshelby/pinyin-to-bopomofo";
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

/** Language tag for Traditional Chinese Zhuyin (Bopomofo) */
export const CHINESE_TRADITIONAL_LANG_TAG = "zh-TW-Bopo";

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
 * Convert Chinese text to Bopomofo (Zhuyin).
 * Uses pinyin with tone marks as intermediate, since pinyinToBopomofo
 * expects tone marks (e.g., diàn) rather than tone numbers (e.g., dian4).
 */
export function toBopomofo(text: string): string {
  const pinyinList = toPinyinPerCharacter(text);
  const bopomofos = pinyinList.map((py) => {
    try {
      return pinyinToBopomofo(py);
    } catch {
      // If conversion fails, return the original pinyin
      return py;
    }
  });
  return bopomofos.join("");
}

/**
 * Get Bopomofo for each character.
 */
export function toBopomofoPerCharacter(text: string): string[] {
  const pinyinList = toPinyinPerCharacter(text);
  return pinyinList.map((py) => {
    try {
      return pinyinToBopomofo(py);
    } catch {
      return py;
    }
  });
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
 * Romanize Traditional Chinese text to Bopomofo (Zhuyin).
 * Taiwan uses Zhuyin (ㄅㄆㄇㄈ) as the primary phonetic system.
 */
export function romanizeTraditionalChinese(text: string): RomanizationResult {
  const normalized = text.replace(/ /g, "");
  return {
    langTag: CHINESE_TRADITIONAL_LANG_TAG,
    text: toBopomofo(normalized),
  };
}

/**
 * Get character-by-character readings for Simplified Chinese text.
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

/**
 * Get character-by-character readings for Traditional Chinese text.
 * Returns pairs of [character, bopomofo].
 */
export function readTraditionalChinese(
  term: string,
  normalizedTerm: string,
  _previousTerms: string[],
): CharacterReading[] {
  const bopomofoList = toBopomofoPerCharacter(normalizedTerm);
  const readings: CharacterReading[] = [];

  for (let i = 0; i < term.length; i++) {
    const origChar = term[i];
    const bopomofoReading = bopomofoList[i] ?? origChar;
    readings.push([origChar, bopomofoReading]);
  }

  return readings;
}
