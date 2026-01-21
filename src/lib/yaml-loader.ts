/**
 * YAML table loader for CJK computer science terms.
 * Parses YAML files into strongly-typed Table objects.
 * @module
 */

import { parse } from "@std/yaml";
import type { LocaleCode } from "../types/locale.ts";
import { parseLocale } from "../types/locale.ts";
import type { RawTermData, Term } from "../types/term.ts";
import { parseSpacing, getImplicitSpacing } from "../types/spacing.ts";
import type { Word } from "../types/word.ts";
import type { Translation, TranslationMap } from "../types/translation.ts";
import { createTranslation } from "../types/translation.ts";
import type { Table } from "../types/table.ts";
import { createTable } from "../types/table.ts";

/**
 * Raw YAML row as parsed directly from YAML.
 * Maps locale codes to word definitions.
 */
export type RawYamlRow = Record<string, Record<string, RawTermData[]>>;

/**
 * Parse a YAML string into raw table rows.
 */
export function parseTableYaml(yaml: string): RawYamlRow[] {
  const parsed = parse(yaml);
  if (!Array.isArray(parsed)) {
    throw new Error("YAML must be an array of translation rows");
  }
  return parsed as RawYamlRow[];
}

/**
 * Parse raw term data into a Term object.
 */
function parseRawTerm(
  raw: RawTermData,
  locale: LocaleCode,
  isFirstTerm: boolean,
): Term {
  const language = locale.split("-")[0];
  const implicitSpacing = getImplicitSpacing(language);
  const space = parseSpacing(raw.space, isFirstTerm ? "implicit-no-space" : implicitSpacing);

  const baseTerm = {
    term: raw.term,
    space,
    correspond: raw.correspond ?? "",
    norm: raw.norm ?? raw.term,
  };

  // Check for loan word (Western term)
  if (raw.loan) {
    return {
      ...baseTerm,
      loan: raw.loan,
      read: raw.read,
      locale: parseLocale("en"), // Assume English source for loanwords
    };
  }

  // Check for phonetic reading (Eastern term)
  if (raw.read) {
    return {
      ...baseTerm,
      read: raw.read,
    };
  }

  // Plain base term
  return baseTerm;
}

/**
 * Parse a raw word definition into a Word object.
 */
export function parseRawWord(
  wordId: string,
  rawTerms: RawTermData[],
  locale: LocaleCode,
): Word {
  const localeInfo = parseLocale(locale);
  const terms: Term[] = rawTerms.map((raw, index) =>
    parseRawTerm(raw, locale, index === 0)
  );

  return {
    id: wordId,
    locale: localeInfo,
    terms,
  };
}

/**
 * Parse a raw YAML row into a Translation object.
 */
export function parseRawTranslation(rawRow: RawYamlRow): Translation {
  const map: TranslationMap = new Map();

  for (const [localeStr, wordDefs] of Object.entries(rawRow)) {
    // Skip non-locale keys (like comments that might slip through)
    let locale: LocaleCode;
    try {
      locale = parseLocale(localeStr).code as LocaleCode;
    } catch {
      // Not a valid locale, skip
      continue;
    }

    const words: Word[] = [];
    for (const [wordId, rawTerms] of Object.entries(wordDefs)) {
      if (Array.isArray(rawTerms)) {
        words.push(parseRawWord(wordId, rawTerms as RawTermData[], locale));
      }
    }

    if (words.length > 0) {
      map.set(locale, words);
    }
  }

  return createTranslation(map);
}

/**
 * Load a YAML table file and parse it into a Table object.
 */
export async function loadTable(path: string): Promise<Table> {
  const content = await Deno.readTextFile(path);
  const rawRows = parseTableYaml(content);

  const translations = rawRows.map(parseRawTranslation);

  return createTable(translations, path);
}

/**
 * Load multiple YAML table files.
 */
export async function loadTables(paths: string[]): Promise<Table[]> {
  return await Promise.all(paths.map(loadTable));
}

/**
 * Find all YAML table files in the tables/ directory.
 */
export async function findTableFiles(dir = "tables"): Promise<string[]> {
  const files: string[] = [];

  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith(".yaml")) {
      files.push(`${dir}/${entry.name}`);
    }
  }

  return files.sort();
}

/**
 * Load all tables from the tables/ directory.
 */
export async function loadAllTables(dir = "tables"): Promise<Table[]> {
  const files = await findTableFiles(dir);
  return await loadTables(files);
}
