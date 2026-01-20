import type { Word } from "./word.ts";
import type { LocaleCode } from "./locale.ts";

/**
 * A translation maps locales to their word translations.
 * Each locale can have multiple word variants (e.g., different terms for
 * the same concept in different Chinese regions).
 */
export type TranslationMap = Map<LocaleCode, readonly Word[]>;

/**
 * Translation with computed metadata.
 */
export interface Translation {
  /** The underlying locale -> words mapping */
  readonly map: TranslationMap;
  /** Maximum number of word variants across all locales */
  readonly maxWords: number;
  /** Word IDs that appear in multiple locales (for cognate highlighting) */
  readonly cognateGroups: readonly string[];
  /** Correspondence values sorted by frequency (for coloring) */
  readonly correspondences: readonly string[];
}

/**
 * Create a Translation from a map with computed metadata.
 */
export function createTranslation(map: TranslationMap): Translation {
  // Calculate max words
  let maxWords = 0;
  for (const words of map.values()) {
    if (words.length > maxWords) {
      maxWords = words.length;
    }
  }

  // Find cognate groups (word IDs appearing in multiple locales)
  const idCounts = new Map<string, number>();
  for (const words of map.values()) {
    for (const word of words) {
      idCounts.set(word.id, (idCounts.get(word.id) ?? 0) + 1);
    }
  }
  const cognateGroups = [...idCounts.entries()]
    .filter(([_, count]) => count > 1)
    .map(([id]) => id);

  // Collect correspondences sorted by frequency
  const correspondCounts = new Map<string, number>();
  for (const words of map.values()) {
    for (const word of words) {
      for (const term of word.terms) {
        if (term.correspond) {
          correspondCounts.set(
            term.correspond,
            (correspondCounts.get(term.correspond) ?? 0) + 1,
          );
        }
      }
    }
  }
  const correspondences = [...correspondCounts.entries()]
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([correspond]) => correspond);

  return {
    map,
    maxWords,
    cognateGroups,
    correspondences,
  };
}

/**
 * Get words for a specific locale from a translation.
 */
export function getWords(
  translation: Translation,
  locale: LocaleCode,
): readonly Word[] {
  return translation.map.get(locale) ?? [];
}
