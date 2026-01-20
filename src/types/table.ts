import type { Translation } from "./translation.ts";
import type { LocaleCode } from "./locale.ts";
import type { Term } from "./term.ts";

/**
 * A table is a collection of translations (rows in the comparison table).
 */
export interface Table {
  /** All translations in the table */
  readonly translations: readonly Translation[];
  /** Set of all locales that appear in the table */
  readonly supportedLocales: ReadonlySet<LocaleCode>;
  /** Lookup table: locale -> normalized term -> Term object */
  readonly termsTable: ReadonlyMap<LocaleCode, ReadonlyMap<string, Term>>;
  /** Optional source file path */
  readonly source?: string;
}

/**
 * Create a Table from translations with computed metadata.
 */
export function createTable(
  translations: readonly Translation[],
  source?: string,
): Table {
  // Collect all supported locales
  const supportedLocales = new Set<LocaleCode>();
  for (const translation of translations) {
    for (const locale of translation.map.keys()) {
      supportedLocales.add(locale);
    }
  }

  // Build terms lookup table
  const termsTable = new Map<LocaleCode, Map<string, Term>>();
  for (const translation of translations) {
    for (const [locale, words] of translation.map) {
      let localeTerms = termsTable.get(locale);
      if (!localeTerms) {
        localeTerms = new Map();
        termsTable.set(locale, localeTerms);
      }
      for (const word of words) {
        for (const term of word.terms) {
          // Use normalized term text as key
          const key = term.term.toLowerCase();
          if (!localeTerms.has(key)) {
            localeTerms.set(key, term);
          }
        }
      }
    }
  }

  return {
    translations,
    supportedLocales,
    termsTable,
    source,
  };
}

/**
 * Look up a term in the table by locale and text.
 */
export function lookupTerm(
  table: Table,
  locale: LocaleCode,
  text: string,
): Term | undefined {
  return table.termsTable.get(locale)?.get(text.toLowerCase());
}
