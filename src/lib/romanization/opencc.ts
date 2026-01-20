/**
 * Character conversion using OpenCC.
 * Handles conversions between different Chinese character forms:
 * - Japanese Kanji (jp) -> Traditional Chinese (t)
 * - Simplified Chinese (s) -> Traditional Chinese (t)
 */
import * as OpenCC from "opencc-js";
import type { LocaleCode } from "../../types/locale.ts";

// Create converters
// Japanese Kanji to Traditional Chinese
const jp2tConverter = OpenCC.Converter({ from: "jp", to: "t" });
// Simplified Chinese to Traditional Chinese
const s2tConverter = OpenCC.Converter({ from: "cn", to: "t" });

/**
 * Locale-specific normalizers for character conversion.
 * Used to normalize characters before looking up readings in other locales.
 */
const normalizers: Partial<Record<LocaleCode, (text: string) => string>> = {
  ja: (text: string) => jp2tConverter(text),
  "zh-CN": (text: string) => s2tConverter(text),
};

/**
 * Normalize characters for a given locale.
 * Converts locale-specific characters to Traditional Chinese form
 * for cross-locale lookup.
 */
export function normalizeCharacters(
  text: string,
  locale: LocaleCode,
): string {
  const normalizer = normalizers[locale];
  if (!normalizer) {
    return text;
  }
  return normalizer(text);
}

/**
 * Check if a locale has a character normalizer.
 */
export function hasNormalizer(locale: LocaleCode): boolean {
  return locale in normalizers;
}

/**
 * Convert Japanese Kanji to Traditional Chinese characters.
 */
export function japaneseToTraditional(text: string): string {
  return jp2tConverter(text);
}

/**
 * Convert Simplified Chinese to Traditional Chinese characters.
 */
export function simplifiedToTraditional(text: string): string {
  return s2tConverter(text);
}
