import { assertEquals } from "@std/assert";
import { getPreviousTerms, getWordText, type Word } from "./word.ts";
import type { BaseTerm, EasternTerm } from "./term.ts";
import { parseLocale } from "./locale.ts";

Deno.test("getWordText concatenates all terms", () => {
  const term1: BaseTerm = {
    term: "soft",
    norm: "soft",
    space: "implicit-space",
    correspond: "soft",
  };
  const term2: BaseTerm = {
    term: "ware",
    norm: "ware",
    space: "no-space",
    correspond: "ware",
  };

  const word: Word = {
    id: "software",
    locale: parseLocale("en"),
    terms: [term1, term2],
  };

  assertEquals(getWordText(word), "software");
});

Deno.test("getPreviousTerms returns terms before the given term", () => {
  const term1: EasternTerm = {
    term: "软",
    norm: "软",
    space: "implicit-no-space",
    correspond: "soft",
    read: "ruǎn",
  };
  const term2: EasternTerm = {
    term: "件",
    norm: "件",
    space: "no-space",
    correspond: "ware",
    read: "jiàn",
  };

  const word: Word = {
    id: "软件",
    locale: parseLocale("zh-CN"),
    terms: [term1, term2],
  };

  assertEquals(getPreviousTerms(word, term1), []);
  assertEquals(getPreviousTerms(word, term2), [term1]);
});

Deno.test("getPreviousTerms returns empty array for first term", () => {
  const term: BaseTerm = {
    term: "computer",
    norm: "computer",
    space: "implicit-space",
    correspond: "computer",
  };

  const word: Word = {
    id: "computer",
    locale: parseLocale("en"),
    terms: [term],
  };

  assertEquals(getPreviousTerms(word, term), []);
});
