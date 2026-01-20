/**
 * Language tag for romanization systems.
 * Following BCP 47 / RFC 6497 conventions.
 */
export type LanguageTag = string;

/**
 * Result of romanization.
 */
export interface RomanizationResult {
  /** BCP 47 language tag indicating the romanization system used */
  langTag: LanguageTag;
  /** The romanized text */
  text: string;
}

/**
 * Character-by-character reading result.
 * Maps original characters to their phonetic readings.
 */
export type CharacterReading = [original: string, reading: string];

/**
 * Romanizer function type (may be async for some languages).
 */
export type Romanizer = (
  text: string,
) => RomanizationResult | Promise<RomanizationResult>;

/**
 * Reader function type for character-by-character readings.
 * Takes the original term, normalized term, and previous terms for context.
 * May be async for some languages (like Japanese with kanji).
 */
export type Reader = (
  term: string,
  normalizedTerm: string,
  previousTerms: string[],
) => CharacterReading[] | Promise<CharacterReading[]>;
