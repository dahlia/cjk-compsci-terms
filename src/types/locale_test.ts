import { assertEquals, assertThrows } from "@std/assert";
import {
  getDisplayName,
  getTerritoryName,
  groupLocalesByLanguage,
  isSpacelessLanguage,
  type LocaleCode,
  LOCALE_CODES,
  localeToString,
  parseLocale,
  toBcp47,
} from "./locale.ts";

Deno.test("LOCALE_CODES contains all supported locales", () => {
  assertEquals(LOCALE_CODES.includes("en"), true);
  assertEquals(LOCALE_CODES.includes("ja"), true);
  assertEquals(LOCALE_CODES.includes("ko"), true);
  assertEquals(LOCALE_CODES.includes("zh-CN"), true);
  assertEquals(LOCALE_CODES.includes("zh-HK"), true);
  assertEquals(LOCALE_CODES.includes("zh-TW"), true);
  assertEquals(LOCALE_CODES.length, 6);
});

Deno.test("parseLocale parses simple locale codes", () => {
  const en = parseLocale("en");
  assertEquals(en.code, "en");
  assertEquals(en.language, "en");
  assertEquals(en.territory, undefined);

  const ja = parseLocale("ja");
  assertEquals(ja.code, "ja");
  assertEquals(ja.language, "ja");
  assertEquals(ja.territory, undefined);
});

Deno.test("parseLocale parses locale codes with territory", () => {
  const zhCN = parseLocale("zh-CN");
  assertEquals(zhCN.code, "zh-CN");
  assertEquals(zhCN.language, "zh");
  assertEquals(zhCN.territory, "CN");

  const zhTW = parseLocale("zh-TW");
  assertEquals(zhTW.code, "zh-TW");
  assertEquals(zhTW.language, "zh");
  assertEquals(zhTW.territory, "TW");
});

Deno.test("parseLocale normalizes underscore to hyphen", () => {
  const zhCN = parseLocale("zh_CN");
  assertEquals(zhCN.code, "zh-CN");
});

Deno.test("parseLocale throws for unsupported locales", () => {
  assertThrows(() => parseLocale("fr"), Error, "Unsupported locale");
  assertThrows(() => parseLocale("de-DE"), Error, "Unsupported locale");
});

Deno.test("localeToString returns the locale code", () => {
  const zhCN = parseLocale("zh-CN");
  assertEquals(localeToString(zhCN), "zh-CN");
});

Deno.test("toBcp47 converts underscore to hyphen", () => {
  assertEquals(toBcp47("zh_CN"), "zh-CN");
  assertEquals(toBcp47("zh-TW"), "zh-TW");
});

Deno.test("getDisplayName returns localized language name", () => {
  const ja = parseLocale("ja");
  const en = parseLocale("en");

  // In English, Japanese should be displayed as "Japanese"
  const nameInEn = getDisplayName(ja, en);
  assertEquals(nameInEn, "Japanese");

  // In Japanese, English should be displayed as "英語"
  const nameInJa = getDisplayName(en, ja);
  assertEquals(nameInJa, "英語");
});

Deno.test("getTerritoryName returns special name for HK (Cantonese)", () => {
  const zhHK = parseLocale("zh-HK");
  const en = parseLocale("en");

  const name = getTerritoryName(zhHK, en);
  assertEquals(name, "Cantonese");
});

Deno.test("getTerritoryName returns region name for other territories", () => {
  const zhTW = parseLocale("zh-TW");
  const en = parseLocale("en");

  const name = getTerritoryName(zhTW, en);
  assertEquals(name, "Taiwan");
});

Deno.test("getTerritoryName returns empty string for locales without territory", () => {
  const en = parseLocale("en");
  assertEquals(getTerritoryName(en, en), "");
});

Deno.test("isSpacelessLanguage identifies CJK languages correctly", () => {
  assertEquals(isSpacelessLanguage("ja"), true);
  assertEquals(isSpacelessLanguage("zh"), true);
  assertEquals(isSpacelessLanguage("en"), false);
  assertEquals(isSpacelessLanguage("ko"), false);
});

Deno.test("groupLocalesByLanguage groups Chinese variants together", () => {
  const locales = [
    parseLocale("en"),
    parseLocale("ja"),
    parseLocale("zh-CN"),
    parseLocale("zh-TW"),
    parseLocale("zh-HK"),
  ];

  const grouped = groupLocalesByLanguage(locales);

  // English and Japanese should be single entries
  const en = grouped.get("en");
  assertEquals(en instanceof Map, false);

  const ja = grouped.get("ja");
  assertEquals(ja instanceof Map, false);

  // Chinese should be a map of variants
  const zh = grouped.get("zh");
  assertEquals(zh instanceof Map, true);
  if (zh instanceof Map) {
    assertEquals(zh.size >= 3, true);
  }
});
