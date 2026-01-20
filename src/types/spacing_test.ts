import { assertEquals } from "@std/assert";
import {
  getImplicitSpacing,
  hasNoSpace,
  hasSpace,
  parseSpacing,
  type Spacing,
  spacingToString,
} from "./spacing.ts";

Deno.test("hasSpace returns true for space and implicit-space", () => {
  assertEquals(hasSpace("space"), true);
  assertEquals(hasSpace("implicit-space"), true);
  assertEquals(hasSpace("no-space"), false);
  assertEquals(hasSpace("implicit-no-space"), false);
  assertEquals(hasSpace("hyphen"), false);
});

Deno.test("hasNoSpace returns true for no-space and implicit-no-space", () => {
  assertEquals(hasNoSpace("no-space"), true);
  assertEquals(hasNoSpace("implicit-no-space"), true);
  assertEquals(hasNoSpace("space"), false);
  assertEquals(hasNoSpace("implicit-space"), false);
  assertEquals(hasNoSpace("hyphen"), false);
});

Deno.test("spacingToString converts spacing to string", () => {
  assertEquals(spacingToString("space"), " ");
  assertEquals(spacingToString("implicit-space"), " ");
  assertEquals(spacingToString("no-space"), "");
  assertEquals(spacingToString("implicit-no-space"), "");
  assertEquals(spacingToString("hyphen"), "-");
});

Deno.test("parseSpacing handles boolean values", () => {
  assertEquals(parseSpacing(true, "implicit-space"), "space");
  assertEquals(parseSpacing(false, "implicit-space"), "no-space");
});

Deno.test("parseSpacing handles hyphen string", () => {
  assertEquals(parseSpacing("hyphen", "implicit-space"), "hyphen");
});

Deno.test("parseSpacing returns implicit default when undefined", () => {
  assertEquals(parseSpacing(undefined, "implicit-space"), "implicit-space");
  assertEquals(parseSpacing(undefined, "implicit-no-space"), "implicit-no-space");
});

Deno.test("getImplicitSpacing returns no-space for CJK languages", () => {
  assertEquals(getImplicitSpacing("ja"), "implicit-no-space");
  assertEquals(getImplicitSpacing("zh"), "implicit-no-space");
});

Deno.test("getImplicitSpacing returns space for other languages", () => {
  assertEquals(getImplicitSpacing("en"), "implicit-space");
  assertEquals(getImplicitSpacing("ko"), "implicit-space");
  assertEquals(getImplicitSpacing("de"), "implicit-space");
});
