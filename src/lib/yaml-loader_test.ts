import { assertEquals, assertExists } from "@std/assert";
import {
  loadTable,
  loadTables,
  parseRawTranslation,
  parseRawWord,
  parseTableYaml,
} from "./yaml-loader.ts";
import type { LocaleCode } from "../types/locale.ts";

const SAMPLE_YAML = `
# Computer
- en:
    computer:
    - { term: comput, correspond: compute }
    - { term: er, space: no }
  ja:
    computer:
    - { term: コンピュータ, loan: computer }
  ko:
    computer:
    - { term: 컴퓨터, loan: computer }
  zh-CN:
    電腦:
    - { term: 电, correspond: electronic, read: diàn }
    - { term: 脑, correspond: brain, read: nǎo, space: no }
`;

Deno.test("parseTableYaml parses YAML string into raw data", () => {
  const result = parseTableYaml(SAMPLE_YAML);
  assertEquals(Array.isArray(result), true);
  assertEquals(result.length, 1);
  // Each entry should have locale keys
  assertEquals("en" in result[0], true);
  assertEquals("ja" in result[0], true);
});

Deno.test("parseRawWord creates Word from raw term data", () => {
  const rawTerms = [
    { term: "comput", correspond: "compute" },
    { term: "er", space: false },
  ];
  const word = parseRawWord("computer", rawTerms, "en" as LocaleCode);

  assertEquals(word.id, "computer");
  assertEquals(word.locale.code, "en");
  assertEquals(word.terms.length, 2);
  assertEquals(word.terms[0].term, "comput");
  assertEquals(word.terms[0].correspond, "compute");
  assertEquals(word.terms[1].space, "no-space");
});

Deno.test("parseRawWord handles space: hyphen", () => {
  const rawTerms = [
    { term: "well" },
    { term: "known", space: "hyphen" as const },
  ];
  const word = parseRawWord("well-known", rawTerms, "en" as LocaleCode);

  assertEquals(word.terms[1].space, "hyphen");
});

Deno.test("parseRawWord creates EasternTerm with read property", () => {
  const rawTerms = [
    { term: "电", correspond: "electronic", read: "diàn" },
    { term: "脑", correspond: "brain", read: "nǎo", space: false },
  ];
  const word = parseRawWord("電腦", rawTerms, "zh-CN" as LocaleCode);

  assertEquals(word.terms.length, 2);
  assertEquals("read" in word.terms[0], true);
  assertEquals((word.terms[0] as { read: string }).read, "diàn");
});

Deno.test("parseRawWord creates WesternTerm with loan property", () => {
  const rawTerms = [{ term: "コンピュータ", loan: "computer" }];
  const word = parseRawWord("computer", rawTerms, "ja" as LocaleCode);

  assertEquals(word.terms.length, 1);
  assertEquals("loan" in word.terms[0], true);
  assertEquals((word.terms[0] as { loan: string }).loan, "computer");
});

Deno.test("parseRawTranslation creates Translation from raw row", () => {
  const rawRow = {
    en: {
      computer: [
        { term: "comput", correspond: "compute" },
        { term: "er", space: false },
      ],
    },
    ja: {
      computer: [{ term: "コンピュータ", loan: "computer" }],
    },
  };

  const translation = parseRawTranslation(rawRow);

  assertEquals(translation.map.has("en"), true);
  assertEquals(translation.map.has("ja"), true);

  const enWords = translation.map.get("en")!;
  assertEquals(enWords.length, 1);
  assertEquals(enWords[0].id, "computer");

  const jaWords = translation.map.get("ja")!;
  assertEquals(jaWords.length, 1);
  assertEquals(jaWords[0].terms[0].term, "コンピュータ");
});

Deno.test("parseRawTranslation handles multiple words per locale", () => {
  const rawRow = {
    "zh-HK": {
      智能電話: [
        { term: "智能", correspond: "smart", read: "zi3 nang4" },
        { term: "電話", correspond: "telephone", read: "din6 waa2" },
      ],
      智能手機: [
        { term: "智能", correspond: "smart", read: "zi3 nang4" },
        { term: "手機", correspond: "telephone", read: "sau2 gei1" },
      ],
    },
  };

  const translation = parseRawTranslation(rawRow);

  const hkWords = translation.map.get("zh-HK")!;
  assertEquals(hkWords.length, 2);
  assertEquals(hkWords[0].id, "智能電話");
  assertEquals(hkWords[1].id, "智能手機");
});

Deno.test("loadTable loads and parses a YAML file", async () => {
  // Use an actual table file
  const table = await loadTable("tables/basic.yaml");

  assertExists(table);
  assertEquals(table.translations.length > 0, true);
  assertEquals(table.supportedLocales.has("en"), true);
  assertEquals(table.supportedLocales.has("ja"), true);
  assertEquals(table.source, "tables/basic.yaml");
});

Deno.test("loadTables loads multiple YAML files", async () => {
  const tables = await loadTables(["tables/basic.yaml", "tables/programming.yaml"]);

  assertEquals(tables.length, 2);
  assertEquals(tables[0].source, "tables/basic.yaml");
  assertEquals(tables[1].source, "tables/programming.yaml");
});
