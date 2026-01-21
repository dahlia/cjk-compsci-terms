import { assertEquals } from "@std/assert";
import { createTable, lookupTerm } from "./table.ts";
import { createTranslation, type TranslationMap } from "./translation.ts";
import type { Word } from "./word.ts";
import type { BaseTerm, EasternTerm, WesternTerm } from "./term.ts";
import { parseLocale } from "./locale.ts";

function createTestTable() {
  // Create "computer" translation
  const computerEn: BaseTerm = {
    term: "computer",
    norm: "computer",
    space: "implicit-space",
    correspond: "computer",
  };
  const computerEnWord: Word = {
    id: "computer",
    locale: parseLocale("en"),
    terms: [computerEn],
  };

  const computerJa: WesternTerm = {
    term: "コンピュータ",
    norm: "コンピュータ",
    space: "implicit-no-space",
    correspond: "computer",
    loan: "computer",
    locale: parseLocale("en"),
  };
  const computerJaWord: Word = {
    id: "computer",
    locale: parseLocale("ja"),
    terms: [computerJa],
  };

  const computerMap: TranslationMap = new Map();
  computerMap.set("en", [computerEnWord]);
  computerMap.set("ja", [computerJaWord]);
  const computerTranslation = createTranslation(computerMap);

  // Create "software" translation
  const softwareEn1: BaseTerm = {
    term: "soft",
    norm: "soft",
    space: "implicit-space",
    correspond: "soft",
  };
  const softwareEn2: BaseTerm = {
    term: "ware",
    norm: "ware",
    space: "no-space",
    correspond: "ware",
  };
  const softwareEnWord: Word = {
    id: "software",
    locale: parseLocale("en"),
    terms: [softwareEn1, softwareEn2],
  };

  const softwareMap: TranslationMap = new Map();
  softwareMap.set("en", [softwareEnWord]);
  const softwareTranslation = createTranslation(softwareMap);

  return createTable([computerTranslation, softwareTranslation], "test.yaml");
}

Deno.test("createTable collects supported locales", () => {
  const table = createTestTable();

  assertEquals(table.supportedLocales.has("en"), true);
  assertEquals(table.supportedLocales.has("ja"), true);
  assertEquals(table.supportedLocales.has("ko"), false);
});

Deno.test("createTable stores source path", () => {
  const table = createTestTable();
  assertEquals(table.source, "test.yaml");
});

Deno.test("lookupTerm finds terms by locale and text", () => {
  const table = createTestTable();

  const computer = lookupTerm(table, "en", "computer");
  assertEquals(computer?.term, "computer");

  const soft = lookupTerm(table, "en", "soft");
  assertEquals(soft?.term, "soft");

  const notFound = lookupTerm(table, "en", "notexist");
  assertEquals(notFound, undefined);
});

Deno.test("lookupTerm is case insensitive", () => {
  const table = createTestTable();

  const computer = lookupTerm(table, "en", "COMPUTER");
  assertEquals(computer?.term, "computer");
});
