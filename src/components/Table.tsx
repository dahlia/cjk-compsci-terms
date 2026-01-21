/**
 * Table component for rendering CJK term comparisons.
 * @module
 */

import { type HtmlString, jsx, raw } from "../jsx-runtime/index.ts";
import type { Table as TableType } from "../types/table.ts";
import type { Translation } from "../types/translation.ts";
import type { Word } from "../types/word.ts";
import type { Term } from "../types/term.ts";
import type { LocaleCode, LocaleInfo } from "../types/locale.ts";
import {
  getDisplayName,
  getTerritoryName,
  parseLocale,
} from "../types/locale.ts";
import { getWords } from "../types/translation.ts";
import { WordSpan } from "./WordSpan.tsx";
import type { CharacterReading } from "../lib/romanization/types.ts";

/**
 * Group locales by language for table headers.
 * Returns ordered groups where each group contains locales of the same language.
 */
function groupLocalesByLanguage(
  locales: LocaleCode[],
): Map<string, LocaleCode[]> {
  const groups = new Map<string, LocaleCode[]>();
  const order = ["en", "ja", "ko", "zh"];

  for (const locale of locales) {
    const language = locale.split("-")[0];
    let group = groups.get(language);
    if (!group) {
      group = [];
      groups.set(language, group);
    }
    group.push(locale);
  }

  // Return in canonical order
  const orderedGroups = new Map<string, LocaleCode[]>();
  for (const lang of order) {
    const group = groups.get(lang);
    if (group) {
      orderedGroups.set(lang, group);
    }
  }

  return orderedGroups;
}

export interface TableProps {
  /** The table data */
  table: TableType;
  /** Current display locale */
  displayLocale: LocaleCode;
  /** Pre-computed readings for all terms */
  readings: Map<Word, Map<Term, CharacterReading[]>>;
  /** Pre-computed romanizations for all words */
  romanizations: Map<Word, { langTag: string; text: string }>;
}

/**
 * Render table header with language names.
 */
function TableHeader(props: {
  locales: LocaleCode[];
  displayLocale: LocaleCode;
}): HtmlString {
  const { locales, displayLocale } = props;
  const displayLocaleInfo = parseLocale(displayLocale);
  const groups = groupLocalesByLanguage(locales);

  // First header row: language names
  const headerRow1 = jsx("tr", {
    children: [...groups.entries()].map(([language, groupLocales], idx) => {
      const firstLocale = parseLocale(groupLocales[0]);
      const Tag = idx === 0 ? "th" : "td";

      // Check if this language has multiple variants
      const hasVariants = groupLocales.length > 1;
      const attrs: Record<string, unknown> = {};

      if (hasVariants) {
        attrs.colspan = groupLocales.length;
      } else {
        attrs.rowspan = 2;
      }

      const displayName = getDisplayName(firstLocale, displayLocaleInfo);
      const nativeName = getDisplayName(firstLocale, firstLocale);

      return jsx(Tag, {
        ...attrs,
        children: [
          displayName,
          displayName !== nativeName
            ? jsx("span", {
                className: "native-name",
                children: [
                  " (",
                  jsx("span", { lang: language, children: nativeName }),
                  ")",
                ],
              })
            : null,
        ],
      });
    }),
  });

  // Second header row: territory names (only for languages with variants)
  const headerRow2Cells: HtmlString[] = [];
  for (const [, groupLocales] of groups) {
    if (groupLocales.length > 1) {
      for (const localeCode of groupLocales) {
        const localeInfo = parseLocale(localeCode);
        const territoryName = getTerritoryName(localeInfo, displayLocaleInfo);
        const nativeTerritoryName = getTerritoryName(localeInfo, localeInfo);

        headerRow2Cells.push(
          jsx("td", {
            children: [
              territoryName,
              territoryName !== nativeTerritoryName
                ? jsx("span", {
                    className: "native-name",
                    children: [
                      " (",
                      jsx("span", {
                        lang: localeCode.replace("_", "-"),
                        children: nativeTerritoryName,
                      }),
                      ")",
                    ],
                  })
                : null,
            ],
          })
        );
      }
    }
  }

  const headerRow2 =
    headerRow2Cells.length > 0
      ? jsx("tr", { children: headerRow2Cells })
      : raw("");

  return jsx("thead", { children: [headerRow1, headerRow2] });
}

/**
 * Render a single translation row.
 */
function TranslationRow(props: {
  translation: Translation;
  rowIndex: number;
  locales: LocaleCode[];
  displayLocale: LocaleCode;
  readings: Map<Word, Map<Term, CharacterReading[]>>;
  romanizations: Map<Word, { langTag: string; text: string }>;
  cognateGroups: string[];
}): HtmlString {
  const {
    translation,
    rowIndex,
    locales,
    displayLocale,
    readings,
    romanizations,
    cognateGroups,
  } = props;

  const isGroupHead = rowIndex === 0;
  const isGroupFoot = rowIndex + 1 >= translation.maxWords;

  const rowClasses = [
    isGroupHead ? "group-head" : "",
    isGroupFoot ? "group-foot" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return jsx("tr", {
    className: rowClasses || undefined,
    children: locales.map((localeCode, idx) => {
      const words = getWords(translation, localeCode);
      const Tag = idx === 0 ? "th" : "td";

      if (rowIndex >= words.length) {
        // No word at this row index - might need rowspan from previous
        return null;
      }

      const word = words[rowIndex];
      const wordReadings = readings.get(word);
      const romanization = romanizations.get(word);

      // Calculate rowspan if this word extends to remaining rows
      const remainingRows = translation.maxWords - rowIndex;
      const remainingWords = words.length - rowIndex;
      const rowspan =
        remainingRows > remainingWords && rowIndex + 1 === words.length
          ? remainingRows - remainingWords + 1
          : undefined;

      // Check for cognate group
      const cognateIndex = cognateGroups.indexOf(word.id);
      const cognateClass =
        cognateIndex >= 0 ? `cognate-group-${cognateIndex + 1}` : "";

      return jsx(Tag, {
        rowspan,
        className: cognateClass || undefined,
        children: [
          WordSpan({
            word,
            translation,
            readings: wordReadings,
          }),
          // Add romanization for non-English locales
          // Use raw() because Jyutping contains <sup> tags for tones
          word.locale.language !== "en" && romanization
            ? jsx("span", {
                className: "romanization",
                lang: romanization.langTag,
                children: [" (", raw(romanization.text), ")"],
              })
            : null,
        ],
      });
    }),
  });
}

/**
 * Render the complete table body.
 */
function TableBody(props: {
  table: TableType;
  locales: LocaleCode[];
  displayLocale: LocaleCode;
  readings: Map<Word, Map<Term, CharacterReading[]>>;
  romanizations: Map<Word, { langTag: string; text: string }>;
}): HtmlString {
  const { table, locales, displayLocale, readings, romanizations } = props;

  return jsx("tbody", {
    children: table.translations.flatMap((translation) => {
      const cognateGroups = [...translation.cognateGroups];

      return Array.from({ length: translation.maxWords }, (_, rowIndex) =>
        TranslationRow({
          translation,
          rowIndex,
          locales,
          displayLocale,
          readings,
          romanizations,
          cognateGroups,
        })
      );
    }),
  });
}

/**
 * Render the complete comparison table.
 */
export function Table(props: TableProps): HtmlString {
  const { table, displayLocale, readings, romanizations } = props;
  const langTag = displayLocale.replace("_", "-");

  // Get ordered list of locales
  const locales: LocaleCode[] = ["en", "ja", "ko", "zh-CN", "zh-HK", "zh-TW"].filter(
    (l) => table.supportedLocales.has(l as LocaleCode)
  ) as LocaleCode[];

  return jsx("div", {
    className: "terms",
    children: jsx("table", {
      className: "terms",
      lang: langTag,
      "data-src": table.source,
      children: [
        TableHeader({ locales, displayLocale }),
        TableBody({
          table,
          locales,
          displayLocale,
          readings,
          romanizations,
        }),
      ],
    }),
  });
}
