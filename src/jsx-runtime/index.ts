/**
 * Custom JSX runtime for server-side HTML generation.
 * This provides jsx, jsxs, and Fragment for the automatic JSX transform.
 * @module
 */

/** Branded type for HTML strings to prevent mixing with raw strings */
export interface HtmlString {
  readonly __html: string;
}

/** Children type (can be various nested arrays and values) */
export type Children = HtmlString | string | number | boolean | null | undefined | Children[];

/** Valid HTML attributes */
export type HtmlAttributes = {
  [key: string]: string | number | boolean | undefined | null | Children;
};

/** Props with children */
export interface PropsWithChildren {
  children?: Children;
  [key: string]: unknown;
}

/** Function component signature */
// deno-lint-ignore no-explicit-any
export type FunctionComponent<P = any> = (props: P) => HtmlString;

/** JSX element type: string tag name or function component */
export type ElementType = string | FunctionComponent;

/** Fragment symbol for grouping children without wrapper element */
export const Fragment = Symbol("Fragment");

/**
 * Convert a value to an HtmlString, escaping raw strings.
 */
function toHtmlString(value: Children): string {
  if (value === null || value === undefined || value === false || value === true) {
    return "";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    // Escape HTML entities in raw strings
    return escapeHtml(value);
  }

  if (Array.isArray(value)) {
    return value.map(toHtmlString).join("");
  }

  // Already an HtmlString
  if (typeof value === "object" && "__html" in value) {
    return value.__html;
  }

  return "";
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Convert a prop name to its HTML attribute name.
 */
function propToAttribute(prop: string): string {
  // Handle special cases
  if (prop === "className") return "class";
  if (prop === "htmlFor") return "for";

  // Convert camelCase to kebab-case for data-* and aria-*
  if (prop.startsWith("data") || prop.startsWith("aria")) {
    return prop.replace(/([A-Z])/g, "-$1").toLowerCase();
  }

  return prop;
}

/**
 * Render attributes to HTML string.
 */
function renderAttributes(attrs: HtmlAttributes): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(attrs)) {
    if (key === "children" || key === "key") continue;
    if (value === null || value === undefined || value === false) continue;

    const attrName = propToAttribute(key);

    if (value === true) {
      parts.push(attrName);
    } else {
      parts.push(`${attrName}="${escapeHtml(String(value))}"`);
    }
  }

  return parts.length > 0 ? " " + parts.join(" ") : "";
}

/** Self-closing HTML tags (void elements) */
const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/**
 * Create an HTML element.
 * This is the main JSX factory function.
 */
export function jsx(
  type: ElementType | typeof Fragment,
  props: PropsWithChildren,
): HtmlString {
  const { children, ...attrs } = props;

  // Handle Fragment
  if (type === Fragment) {
    return { __html: toHtmlString(children) };
  }

  // Handle function components
  if (typeof type === "function") {
    return type(props);
  }

  // Handle HTML elements
  const tag = type;
  const attrStr = renderAttributes(attrs as HtmlAttributes);

  if (VOID_ELEMENTS.has(tag)) {
    return { __html: `<${tag}${attrStr}>` };
  }

  const content = toHtmlString(children);
  return { __html: `<${tag}${attrStr}>${content}</${tag}>` };
}

/**
 * Create an HTML element with static children.
 * This is the same as jsx() for our purposes.
 */
export const jsxs = jsx;

/**
 * Create raw HTML without escaping.
 * Use this for pre-escaped HTML content.
 */
export function raw(html: string): HtmlString {
  return { __html: html };
}

/**
 * Check if a value is an HtmlString.
 */
export function isHtmlString(value: unknown): value is HtmlString {
  return typeof value === "object" && value !== null && "__html" in value;
}

/**
 * Render an HtmlString to a plain string.
 */
export function render(element: HtmlString): string {
  return element.__html;
}

/**
 * Join multiple HTML strings.
 */
export function join(elements: HtmlString[], separator = ""): HtmlString {
  return { __html: elements.map((e) => e.__html).join(separator) };
}

// Re-export for JSX automatic runtime
export { jsx as jsxDEV };
