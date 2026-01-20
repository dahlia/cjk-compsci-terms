/**
 * Layout component for wrapping pages with common HTML structure.
 * @module
 */

import { Fragment, type HtmlString, jsx, raw } from "../jsx-runtime/index.ts";
import type { LocaleCode } from "../types/locale.ts";
import { Navigation } from "./Navigation.tsx";

export interface LayoutProps {
  /** Page title */
  title: string;
  /** Current locale */
  locale: LocaleCode;
  /** Locale -> href mapping for language navigation */
  langHrefs: [LocaleCode, string][];
  /** Page content (HTML string) */
  content: HtmlString;
  /** Base URL for assets (default: ".") */
  baseUrl?: string;
}

/**
 * Render the full page layout.
 */
export function Layout(props: LayoutProps): HtmlString {
  const { title, locale, langHrefs, content, baseUrl = "." } = props;
  const langTag = locale.replace("_", "-");

  return jsx(Fragment, {
    children: [
      raw("<!DOCTYPE html>\n"),
      jsx("html", {
        lang: langTag,
        children: [
          jsx("head", {
            children: [
              jsx("meta", { charset: "utf-8" }),
              jsx("meta", { name: "viewport", content: "width=device-width" }),
              jsx("title", { children: title }),
              jsx("link", { rel: "preconnect", href: "https://fonts.gstatic.com" }),
              jsx("link", {
                rel: "stylesheet",
                type: "text/css",
                href: `${baseUrl}/style.css`,
              }),
              jsx("script", { src: `${baseUrl}/script.js`, defer: true, children: "" }),
            ],
          }),
          jsx("body", {
            children: [
              jsx("header", {
                children: Navigation({ locale, langHrefs, baseUrl }),
              }),
              content,
            ],
          }),
        ],
      }),
    ],
  });
}
