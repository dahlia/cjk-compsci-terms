/**
 * Supported locale codes for the CJK computer science terms project.
 */
export type LocaleCode = "en" | "ja" | "ko" | "zh-CN" | "zh-HK" | "zh-TW";

/**
 * All supported locale codes as an array (for table columns).
 */
export const LOCALE_CODES: readonly LocaleCode[] = [
  "en",
  "ja",
  "ko",
  "zh-CN",
  "zh-HK",
  "zh-TW",
] as const;

/**
 * Locales for which pages are generated (for navigation).
 * Chinese variants share a single zh-Hant page.
 */
export const PAGE_LOCALES: readonly LocaleCode[] = [
  "en",
  "ja",
  "ko",
  "zh-TW",
] as const;

/**
 * Parsed locale information.
 */
export interface LocaleInfo {
  /** The full locale code (e.g., "zh-CN") */
  readonly code: LocaleCode;
  /** The language code (e.g., "zh") */
  readonly language: string;
  /** The territory/region code, if any (e.g., "CN") */
  readonly territory?: string;
}

/**
 * Parse a locale code string into a LocaleInfo object.
 */
export function parseLocale(code: string): LocaleInfo {
  // Normalize: replace underscore with hyphen
  const normalized = code.replace("_", "-") as LocaleCode;

  // Validate it's a supported locale
  if (!LOCALE_CODES.includes(normalized)) {
    throw new Error(`Unsupported locale: ${code}`);
  }

  const parts = normalized.split("-");
  const language = parts[0];
  const territory = parts.length > 1 ? parts[1] : undefined;

  return {
    code: normalized,
    language,
    territory,
  };
}

/**
 * Convert a LocaleInfo back to a string representation.
 * Uses hyphen as separator (e.g., "zh-CN").
 */
export function localeToString(locale: LocaleInfo): string {
  return locale.code;
}

/**
 * Convert locale code to BCP 47 format (hyphen-separated).
 */
export function toBcp47(code: LocaleCode | string): string {
  return code.replace("_", "-");
}

/**
 * Get the display name of a locale in a target language.
 * Uses the Intl.DisplayNames API.
 * For zh-TW, returns "中文 (繁體)" style format.
 */
export function getDisplayName(
  locale: LocaleInfo,
  inLocale: LocaleInfo,
): string {
  const displayNames = new Intl.DisplayNames([inLocale.code], {
    type: "language",
  });
  const langName = displayNames.of(locale.language) ?? locale.language;

  // For Traditional Chinese, add script name
  if (locale.code === "zh-TW") {
    const scriptNames = new Intl.DisplayNames([inLocale.code], {
      type: "script",
    });
    const scriptName = scriptNames.of("Hant");
    if (scriptName) {
      return `${langName} (${scriptName})`;
    }
  }

  return langName;
}

/**
 * Get the territory/region display name.
 * Special cases are handled for better display.
 */
export function getTerritoryName(
  locale: LocaleInfo,
  inLocale: LocaleInfo,
): string {
  if (!locale.territory) {
    return "";
  }

  // Special overrides for certain territories
  const overrides: Record<string, Record<string, string>> = {
    HK: {
      en: "Cantonese",
      ja: "広東語",
      ko: "광둥어",
      "zh-CN": "粤语",
      "zh-HK": "廣東話",
      "zh-TW": "粵語",
    },
  };

  const override = overrides[locale.territory]?.[inLocale.code];
  if (override) {
    return override;
  }

  const displayNames = new Intl.DisplayNames([inLocale.code], {
    type: "region",
  });
  return displayNames.of(locale.territory) ?? locale.territory;
}

/**
 * Check if a language uses spaces between words.
 * Japanese and Chinese do not use spaces.
 */
export function isSpacelessLanguage(language: string): boolean {
  return language === "ja" || language === "zh";
}

/**
 * Group locales by language.
 * Returns a map where single-variant languages map directly to LocaleInfo,
 * and multi-variant languages (like Chinese) map to a nested object.
 */
export function groupLocalesByLanguage(
  locales: Iterable<LocaleInfo>,
): Map<string, LocaleInfo | Map<string, LocaleInfo>> {
  const grouped = new Map<string, LocaleInfo | Map<string, LocaleInfo>>();

  for (const locale of locales) {
    const existing = grouped.get(locale.language);

    if (!existing) {
      // First locale for this language
      grouped.set(locale.language, locale);
    } else if (existing instanceof Map) {
      // Already a multi-variant language
      existing.set(locale.territory ?? "_", locale);
    } else {
      // Convert to multi-variant
      const map = new Map<string, LocaleInfo>();
      map.set("_", existing); // Base language
      map.set(existing.territory ?? "_", existing);
      map.set(locale.territory ?? "_", locale);
      grouped.set(locale.language, map);
    }
  }

  return grouped;
}
