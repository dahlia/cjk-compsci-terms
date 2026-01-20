import type { Term } from "./term.ts";
import type { LocaleInfo } from "./locale.ts";

/**
 * A word is a sequence of terms representing a complete translation.
 * For example, "컴퓨터" (computer in Korean) is a single Word with one Term,
 * while "소프트웨어" (software) might be a Word with two Terms: "소프트" + "웨어".
 */
export interface Word {
  /** Word identifier for cognate grouping across locales */
  readonly id: string;
  /** The locale this word belongs to */
  readonly locale: LocaleInfo;
  /** The sequence of terms making up this word */
  readonly terms: readonly Term[];
}

/**
 * Get all terms that appear before the given term in a word.
 * This is used for context-dependent phonetic conversions (e.g., Korean 두음법칙).
 */
export function getPreviousTerms(word: Word, term: Term): readonly Term[] {
  const index = word.terms.indexOf(term);
  if (index <= 0) return [];
  return word.terms.slice(0, index);
}

/**
 * Get the full text of a word by concatenating all terms.
 */
export function getWordText(word: Word): string {
  return word.terms.map((t) => t.term).join("");
}
