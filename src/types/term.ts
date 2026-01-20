import type { Spacing } from "./spacing.ts";
import type { LocaleInfo } from "./locale.ts";

/**
 * Base term interface representing a single morpheme or word part.
 */
export interface BaseTerm {
  /** The actual term text */
  readonly term: string;
  /** Spacing before this term */
  readonly space: Spacing;
  /** Etymology/correspondence link for coloring related terms */
  readonly correspond: string;
}

/**
 * Eastern term with phonetic reading (for CJK languages).
 * The `read` field contains the pronunciation, which may be:
 * - Pinyin for Simplified Chinese (zh-CN)
 * - Zhuyin for Traditional Chinese (zh-TW)
 * - Jyutping for Cantonese (zh-HK)
 * - Hiragana/reading for Japanese (ja)
 * - Hangul for Korean (ko) when the term contains Hanja
 */
export interface EasternTerm extends BaseTerm {
  /** Phonetic reading (may be space-separated for multi-character terms) */
  readonly read: string;
}

/**
 * Western term representing a loanword.
 * Used when a term is borrowed from another language (usually English).
 */
export interface WesternTerm extends BaseTerm {
  /** The original loanword source (e.g., "computer" for コンピュータ) */
  readonly loan: string;
  /** Optional explicit phonetic reading */
  readonly read?: string;
  /** The source locale of the loan (defaults to English) */
  readonly locale: LocaleInfo;
}

/**
 * Union type for all term types.
 */
export type Term = BaseTerm | EasternTerm | WesternTerm;

/**
 * Type guard: Check if a term is an EasternTerm (has phonetic reading).
 */
export function isEasternTerm(term: Term): term is EasternTerm {
  return "read" in term && !("loan" in term);
}

/**
 * Type guard: Check if a term is a WesternTerm (loanword).
 */
export function isWesternTerm(term: Term): term is WesternTerm {
  return "loan" in term;
}

/**
 * Check if a term has any kind of annotation (ruby text).
 * This is true for EasternTerms (phonetic) or WesternTerms (loanword source).
 */
export function hasAnnotation(term: Term): term is EasternTerm | WesternTerm {
  return isEasternTerm(term) || isWesternTerm(term);
}

/**
 * Raw term data as parsed from YAML.
 */
export interface RawTermData {
  term: string;
  space?: boolean | "hyphen";
  correspond?: string;
  read?: string;
  loan?: string;
}
