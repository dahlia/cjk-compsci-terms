/**
 * WordSpan component for rendering terms with ruby annotations.
 * @module
 */

import { Fragment, type HtmlString, jsx, raw } from "../jsx-runtime/index.ts";
import type { Word } from "../types/word.ts";
import type { Term } from "../types/term.ts";
import { isEasternTerm, isWesternTerm } from "../types/term.ts";
import { hasSpace } from "../types/spacing.ts";
import type { Translation } from "../types/translation.ts";
import type { CharacterReading } from "../lib/romanization/types.ts";

export interface WordSpanProps {
  /** The word to render */
  word: Word;
  /** The current translation (for correspondence colors) */
  translation: Translation;
  /** Character readings for this word (pre-computed) */
  readings?: Map<Term, CharacterReading[]>;
}

/**
 * Get CSS class for a term based on its correspondence.
 */
function getTermClass(term: Term, correspondences: readonly string[]): string {
  const classes = ["term"];

  if (term.correspond) {
    const idx = correspondences.indexOf(term.correspond);
    if (idx >= 0) {
      classes.push(`correspond-${idx + 1}`);
    }
  }

  return classes.join(" ");
}

/**
 * Render spacing before a term.
 */
function renderSpacing(term: Term): HtmlString {
  if (hasSpace(term.space)) {
    return raw(" ");
  }
  if (term.space === "hyphen") {
    return raw("-");
  }
  return raw("");
}

/**
 * Check if a word has any annotations (reading or loan).
 */
function hasAnnotations(word: Word): boolean {
  return word.terms.some((t) => isEasternTerm(t) || isWesternTerm(t));
}

/**
 * Render a single term with ruby annotation.
 */
function renderTermWithRuby(
  term: Term,
  termClass: string,
  langTag: string,
  readings?: CharacterReading[],
): HtmlString {
  if (isWesternTerm(term)) {
    // Loanword: show original word as ruby text
    return jsx("ruby", {
      className: termClass,
      lang: langTag,
      children: [term.term, jsx("rt", { children: term.loan })],
    });
  }

  if (isEasternTerm(term) && readings && readings.length > 0) {
    // Check if any reading differs from the character
    const hasActualReadings = readings.some(([char, read]) => char !== read);

    if (hasActualReadings) {
      // Eastern term with character-by-character readings
      // Only add <rt> when the reading differs from the character
      return jsx("ruby", {
        className: termClass,
        lang: langTag,
        children: readings.map(([char, read]) =>
          char !== read
            ? jsx(Fragment, {
                children: [char, jsx("rt", { children: read })],
              })
            : char
        ),
      });
    }
  }

  // Term without ruby annotation (no reading or readings match characters)
  return jsx("span", {
    className: termClass,
    lang: langTag,
    children: term.term,
  });
}

/**
 * Render a term without ruby annotation.
 */
function renderTermPlain(
  term: Term,
  termClass: string,
  langTag: string,
): HtmlString {
  return jsx("span", {
    className: termClass,
    lang: langTag,
    children: term.term,
  });
}

/**
 * Render a complete word with all its terms.
 */
export function WordSpan(props: WordSpanProps): HtmlString {
  const { word, translation, readings } = props;
  const langTag = word.locale.code.replace("_", "-");
  const useRuby = hasAnnotations(word);

  return jsx(Fragment, {
    children: word.terms.map((term) => {
      const termClass = getTermClass(term, translation.correspondences);
      const termReadings = readings?.get(term);

      return jsx(Fragment, {
        children: [
          renderSpacing(term),
          useRuby
            ? renderTermWithRuby(term, termClass, langTag, termReadings)
            : renderTermPlain(term, termClass, langTag),
        ],
      });
    }),
  });
}
