/**
 * Spacing types for controlling how terms are separated in rendered output.
 *
 * - `space` / `implicit-space`: Adds a space between terms
 * - `no-space` / `implicit-no-space`: No space between terms
 * - `hyphen`: Connects terms with a hyphen
 *
 * The "implicit" variants represent default spacing based on language:
 * CJK languages default to no-space, Western languages default to space.
 */
export type Spacing =
  | "space"
  | "no-space"
  | "hyphen"
  | "implicit-space"
  | "implicit-no-space";

/**
 * Check if the spacing results in an actual space character.
 */
export function hasSpace(spacing: Spacing): boolean {
  return spacing === "space" || spacing === "implicit-space";
}

/**
 * Check if the spacing results in no space.
 */
export function hasNoSpace(spacing: Spacing): boolean {
  return spacing === "no-space" || spacing === "implicit-no-space";
}

/**
 * Convert spacing to its string representation for rendering.
 */
export function spacingToString(spacing: Spacing): string {
  if (spacing === "hyphen") return "-";
  return hasSpace(spacing) ? " " : "";
}

/**
 * Parse spacing from YAML input.
 * YAML uses: `space: no` (boolean false), `space: true` (boolean true),
 * `space: "hyphen"` (string), or omitted (uses implicit default).
 */
export function parseSpacing(
  value: boolean | string | undefined,
  implicitDefault: Spacing,
): Spacing {
  if (value === undefined) {
    return implicitDefault;
  }
  if (typeof value === "boolean") {
    return value ? "space" : "no-space";
  }
  if (value === "hyphen") {
    return "hyphen";
  }
  // Fallback to implicit default for unknown values
  return implicitDefault;
}

/**
 * Get the implicit default spacing for a language.
 * CJK languages (ja, zh, ko) default to no-space.
 * Other languages default to space.
 */
export function getImplicitSpacing(language: string): Spacing {
  const spacelessLanguages = new Set(["ja", "zh"]);
  return spacelessLanguages.has(language) ? "implicit-no-space" : "implicit-space";
}
