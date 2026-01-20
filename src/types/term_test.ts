import { assertEquals } from "@std/assert";
import {
  type BaseTerm,
  type EasternTerm,
  hasAnnotation,
  isEasternTerm,
  isWesternTerm,
  type WesternTerm,
} from "./term.ts";
import { parseLocale } from "./locale.ts";

Deno.test("isEasternTerm identifies terms with read property", () => {
  const eastern: EasternTerm = {
    term: "电",
    space: "implicit-no-space",
    correspond: "electronic",
    read: "diàn",
  };

  const base: BaseTerm = {
    term: "comput",
    space: "implicit-space",
    correspond: "compute",
  };

  assertEquals(isEasternTerm(eastern), true);
  assertEquals(isEasternTerm(base), false);
});

Deno.test("isWesternTerm identifies terms with loan property", () => {
  const western: WesternTerm = {
    term: "コンピュータ",
    space: "implicit-no-space",
    correspond: "computer",
    loan: "computer",
    locale: parseLocale("en"),
  };

  const eastern: EasternTerm = {
    term: "电",
    space: "implicit-no-space",
    correspond: "electronic",
    read: "diàn",
  };

  assertEquals(isWesternTerm(western), true);
  assertEquals(isWesternTerm(eastern), false);
});

Deno.test("hasAnnotation returns true for terms needing ruby annotations", () => {
  const western: WesternTerm = {
    term: "コンピュータ",
    space: "implicit-no-space",
    correspond: "computer",
    loan: "computer",
    locale: parseLocale("en"),
  };

  const eastern: EasternTerm = {
    term: "电",
    space: "implicit-no-space",
    correspond: "electronic",
    read: "diàn",
  };

  const base: BaseTerm = {
    term: "comput",
    space: "implicit-space",
    correspond: "compute",
  };

  assertEquals(hasAnnotation(western), true);
  assertEquals(hasAnnotation(eastern), true);
  assertEquals(hasAnnotation(base), false);
});
