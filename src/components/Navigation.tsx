/**
 * Navigation component for language switching.
 * @module
 */

import { type HtmlString, jsx } from "../jsx-runtime/index.ts";
import type { LocaleCode } from "../types/locale.ts";
import { getDisplayName, parseLocale } from "../types/locale.ts";

export interface NavigationProps {
  /** Current locale */
  locale: LocaleCode;
  /** Locale -> href mapping for available languages */
  langHrefs: [LocaleCode, string][];
  /** Base URL for links */
  baseUrl?: string;
}

/**
 * Render the language navigation bar.
 */
export function Navigation(props: NavigationProps): HtmlString {
  const { locale, langHrefs, baseUrl = "." } = props;
  const currentLocale = parseLocale(locale);

  return jsx("nav", {
    children: [
      ...langHrefs.map(([langCode, href]) => {
        const langLocale = parseLocale(langCode);
        const langTag = langCode.replace("_", "-");
        const isCurrent = langCode === locale;

        return jsx("a", {
          href: `${baseUrl}/${href}`,
          hreflang: langTag,
          rel: isCurrent ? "canonical" : "alternate",
          lang: langTag,
          title: getDisplayName(langLocale, currentLocale),
          children: getDisplayName(langLocale, langLocale),
        });
      }),
      jsx("a", {
        href: "https://github.com/dahlia/cjk-compsci-terms",
        rel: "source-code",
        children: "GitHub",
      }),
      jsx("a", {
        href: "https://creativecommons.org/licenses/by-sa/4.0/",
        rel: "license",
        children: "CC BY-SA 4.0",
      }),
    ],
  });
}
