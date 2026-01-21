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
  /** Page description for meta tags */
  description: string;
  /** Current locale */
  locale: LocaleCode;
  /** Locale -> href mapping for language navigation */
  langHrefs: [LocaleCode, string][];
  /** Page content (HTML string) */
  content: HtmlString;
  /** Base URL for assets (default: ".") */
  baseUrl?: string;
  /** Canonical URL for the current page (for Open Graph) */
  canonicalUrl?: string;
  /** Open Graph image URL */
  ogImage?: string;
}

/**
 * Render the full page layout.
 */
export function Layout(props: LayoutProps): HtmlString {
  const {
    title,
    description,
    locale,
    langHrefs,
    content,
    baseUrl = ".",
    canonicalUrl,
    ogImage,
  } = props;
  const langTag = locale.replace("_", "-");

  // Build alternate language links for SEO
  const alternateLinks = langHrefs.map(([langCode, href]) => {
    const langCodeTag = langCode.replace("_", "-");
    return jsx("link", {
      rel: "alternate",
      hreflang: langCodeTag,
      href: canonicalUrl
        ? `${canonicalUrl.replace(/[^/]*$/, "")}${href}`
        : `${baseUrl}/${href}`,
    });
  });

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
              jsx("meta", { name: "description", content: description }),
              jsx("link", { rel: "preconnect", href: "https://fonts.gstatic.com" }),
              jsx("link", {
                rel: "stylesheet",
                type: "text/css",
                href: `${baseUrl}/style.css`,
              }),
              jsx("script", { src: `${baseUrl}/script.js`, defer: true, children: "" }),

              // Canonical URL
              canonicalUrl ? jsx("link", { rel: "canonical", href: canonicalUrl }) : null,

              // Alternate language links
              ...alternateLinks,

              // Open Graph meta tags
              jsx("meta", { property: "og:type", content: "website" }),
              jsx("meta", { property: "og:title", content: title }),
              jsx("meta", { property: "og:description", content: description }),
              jsx("meta", { property: "og:locale", content: langTag.replace("-", "_") }),
              canonicalUrl
                ? jsx("meta", { property: "og:url", content: canonicalUrl })
                : null,
              ogImage
                ? jsx("meta", { property: "og:image", content: ogImage })
                : null,

              // Twitter Card meta tags
              jsx("meta", {
                name: "twitter:card",
                content: ogImage ? "summary_large_image" : "summary",
              }),
              jsx("meta", { name: "twitter:title", content: title }),
              jsx("meta", { name: "twitter:description", content: description }),
              ogImage
                ? jsx("meta", { name: "twitter:image", content: ogImage })
                : null,
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
