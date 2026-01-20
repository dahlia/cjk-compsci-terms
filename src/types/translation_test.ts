import { assertEquals } from "@std/assert";
import { createTranslation, getWords, type TranslationMap } from "./translation.ts";
import type { Word } from "./word.ts";
import type { BaseTerm, EasternTerm, WesternTerm } from "./term.ts";
import { parseLocale } from "./locale.ts";

function createTestTranslation(): TranslationMap {
  const enTerm: BaseTerm = {
    term: "computer",
    space: "implicit-space",
    correspond: "computer",
  };
  const enWord: Word = {
    id: "computer",
    locale: parseLocale("en"),
    terms: [enTerm],
  };

  const jaTerm: WesternTerm = {
    term: "コンピュータ",
    space: "implicit-no-space",
    correspond: "computer",
    loan: "computer",
    locale: parseLocale("en"),
  };
  const jaWord: Word = {
    id: "computer",
    locale: parseLocale("ja"),
    terms: [jaTerm],
  };

  const zhCNTerm1: EasternTerm = {
    term: "电",
    space: "implicit-no-space",
    correspond: "electronic",
    read: "diàn",
  };
  const zhCNTerm2: EasternTerm = {
    term: "脑",
    space: "no-space",
    correspond: "brain",
    read: "nǎo",
  };
  const zhCNWord: Word = {
    id: "電腦",
    locale: parseLocale("zh-CN"),
    terms: [zhCNTerm1, zhCNTerm2],
  };

  const map: TranslationMap = new Map();
  map.set("en", [enWord]);
  map.set("ja", [jaWord]);
  map.set("zh-CN", [zhCNWord]);
  return map;
}

Deno.test("createTranslation calculates maxWords correctly", () => {
  const map = createTestTranslation();
  const translation = createTranslation(map);
  assertEquals(translation.maxWords, 1);
});

Deno.test("createTranslation finds cognate groups", () => {
  const map = createTestTranslation();
  const translation = createTranslation(map);

  // "computer" ID appears in both en and ja
  assertEquals(translation.cognateGroups.includes("computer"), true);
});

Deno.test("createTranslation extracts correspondences", () => {
  const map = createTestTranslation();
  const translation = createTranslation(map);

  // "computer" correspondence appears multiple times (en and ja)
  assertEquals(translation.correspondences.includes("computer"), true);
});

Deno.test("getWords returns words for a locale", () => {
  const map = createTestTranslation();
  const translation = createTranslation(map);

  const enWords = getWords(translation, "en");
  assertEquals(enWords.length, 1);
  assertEquals(enWords[0].id, "computer");

  const frWords = getWords(translation, "ko");
  assertEquals(frWords.length, 0);
});
