/**
 * Open Graph image generator using Satori and resvg.
 * Generates locale-specific OG images for social media sharing.
 * @module
 */

import type { LocaleCode } from "../types/locale.ts";

// Satori element type (React-like structure without React dependency)
interface SatoriElement {
  type: string;
  props: {
    style?: Record<string, unknown>;
    lang?: string;
    children?: SatoriElement | SatoriElement[] | string | (SatoriElement | string)[];
    [key: string]: unknown;
  };
}

/** OG image dimensions (recommended by social platforms) */
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/**
 * Font URLs for Noto Sans CJK (using Google Fonts).
 * These are subsetted fonts which work well for the limited text in OG images.
 */
const FONT_URLS: Record<string, string> = {
  // Noto Sans for English (Latin)
  en: "https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyAaBN9d.ttf",
  // Noto Sans JP for Japanese
  ja: "https://fonts.gstatic.com/s/notosansjp/v56/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFPYk75s.ttf",
  // Noto Sans KR for Korean
  ko: "https://fonts.gstatic.com/s/notosanskr/v39/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzg01eLQ.ttf",
  // Noto Sans TC for Traditional Chinese
  "zh-TW": "https://fonts.gstatic.com/s/notosanstc/v39/-nFuOG829Oofr2wohFbTp9ifNAn722rq0MXz70e1_Co.ttf",
};

/** Cached font data */
const fontCache = new Map<string, ArrayBuffer>();

/**
 * Fetch and cache font data.
 */
async function loadFont(locale: string): Promise<ArrayBuffer> {
  const cached = fontCache.get(locale);
  if (cached) return cached;

  const url = FONT_URLS[locale] ?? FONT_URLS.en;
  console.log(`  Fetching font for ${locale}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font for ${locale}: ${response.statusText}`);
  }
  const data = await response.arrayBuffer();
  fontCache.set(locale, data);
  return data;
}

/** Subtitles for each locale */
const PAGE_SUBTITLES: Record<string, string> = {
  en: "Chinese · Japanese · Korean",
  ja: "中国語 · 日本語 · 韓国語",
  ko: "중국어 · 일본어 · 한국어",
  "zh-TW": "中文 · 日文 · 韓文",
};

/** Language names for CJK display at bottom */
const LANG_LABELS: Record<string, [string, string, string]> = {
  en: ["中文", "日本語", "한국어"],
  ja: ["中文", "日本語", "한국어"],
  ko: ["中文", "日本語", "한국어"],
  "zh-TW": ["中文", "日本語", "한국어"],
};

/** Convert LocaleCode to Satori-compatible lang tag */
function toSatoriLang(locale: string): string {
  const map: Record<string, string> = {
    en: "en",
    ja: "ja-JP",
    ko: "ko-KR",
    "zh-TW": "zh-TW",
    "zh-CN": "zh-CN",
    "zh-HK": "zh-HK",
  };
  return map[locale] ?? locale;
}

// Satori and resvg modules (loaded dynamically)
let satori: typeof import("satori").default | null = null;
let Resvg: typeof import("@resvg/resvg-wasm").Resvg | null = null;
let resvgInitialized = false;

/**
 * Initialize Satori.
 * Satori 0.19+ bundles yoga internally, no separate initialization needed.
 */
async function initSatori(): Promise<void> {
  if (satori) return;
  const satoriModule = await import("satori");
  satori = satoriModule.default;
}

/**
 * Initialize resvg-wasm.
 */
async function initResvg(): Promise<void> {
  if (resvgInitialized) return;

  const resvgModule = await import("@resvg/resvg-wasm");
  Resvg = resvgModule.Resvg;

  // Initialize WASM
  const wasmResponse = await fetch(
    "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm"
  );
  await resvgModule.initWasm(wasmResponse);
  resvgInitialized = true;
}

/**
 * Calculate appropriate font size based on title length.
 * Longer titles get smaller fonts to fit the container.
 */
function getTitleFontSize(title: string): number {
  const len = title.length;
  if (len <= 12) return 72;
  if (len <= 16) return 64;
  if (len <= 20) return 56;
  if (len <= 25) return 48;
  return 42;
}

/**
 * Create the OG image element for Satori.
 */
function createOGElement(locale: LocaleCode, title: string): SatoriElement {
  const subtitle = PAGE_SUBTITLES[locale] ?? PAGE_SUBTITLES.en;
  const langLabels = LANG_LABELS[locale] ?? LANG_LABELS.en;
  const satoriLang = toSatoriLang(locale);
  const titleFontSize = getTitleFontSize(title);

  // Replace middle dot (·) with bullet (•) which has better width metrics in fonts
  const displayTitle = title.replace(/·/g, "•");

  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        padding: "60px",
      },
      children: [
        // Main title
        {
          type: "div",
          props: {
            lang: satoriLang,
            style: {
              fontSize: `${titleFontSize}px`,
              fontWeight: "bold",
              color: "#ffffff",
              textAlign: "center",
              marginBottom: "30px",
              maxWidth: "1000px",
            },
            children: displayTitle,
          },
        },
        // Subtitle
        {
          type: "div",
          props: {
            lang: satoriLang,
            style: {
              fontSize: "36px",
              color: "#a0a0a0",
              marginBottom: "50px",
            },
            children: subtitle,
          },
        },
        // Language labels in a horizontal row
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "30px",
              marginTop: "20px",
              padding: "20px 40px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.1)",
            },
            children: langLabels.flatMap((label, i) => {
              const labelElement = {
                type: "div",
                props: {
                  lang: ["zh-TW", "ja-JP", "ko-KR"][i],
                  style: {
                    fontSize: "32px",
                    color: "#ffffff",
                    fontWeight: "bold",
                  },
                  children: label,
                },
              };
              // Add separator between labels (not after the last one)
              if (i < langLabels.length - 1) {
                return [
                  labelElement,
                  {
                    type: "div",
                    props: {
                      style: {
                        fontSize: "32px",
                        color: "#4a9eff",
                      },
                      children: "/",
                    },
                  },
                ];
              }
              return [labelElement];
            }),
          },
        },
      ],
    },
  };
}

/**
 * Generate an OG image for a specific locale.
 * @param locale The locale code
 * @param title The page title (from markdown file)
 * @returns PNG image data as Uint8Array
 */
export async function generateOGImage(
  locale: LocaleCode,
  title: string,
): Promise<Uint8Array> {
  // Initialize libraries
  await initSatori();
  await initResvg();

  if (!satori || !Resvg) {
    throw new Error("Failed to initialize satori or resvg");
  }

  // Load fonts for all needed languages
  const [enFont, jaFont, koFont, zhFont] = await Promise.all([
    loadFont("en"),
    loadFont("ja"),
    loadFont("ko"),
    loadFont("zh-TW"),
  ]);

  // Create the element
  const element = createOGElement(locale, title);

  // Generate SVG
  // deno-lint-ignore no-explicit-any
  const svg = await satori(element as any, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: [
      { name: "Noto Sans", data: enFont, weight: 700, style: "normal" },
      { name: "Noto Sans JP", data: jaFont, weight: 700, style: "normal", lang: "ja-JP" },
      { name: "Noto Sans KR", data: koFont, weight: 700, style: "normal", lang: "ko-KR" },
      { name: "Noto Sans TC", data: zhFont, weight: 700, style: "normal", lang: "zh-TW" },
    ],
  });

  // Convert to PNG
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: OG_WIDTH },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

/**
 * Get the OG image filename from markdown file path.
 * @param mdFile The markdown file path (e.g., "en.md", "zh-Hant.md")
 * @returns The OG image filename (e.g., "og-image.png", "og-image-zh-Hant.png")
 */
export function getOGImageFilename(mdFile: string): string {
  // Extract language code from filename (e.g., "en.md" → "en", "zh-Hant.md" → "zh-Hant")
  const langCode = mdFile.replace(/\.md$/, "");
  if (langCode === "en") return "og-image.png";
  return `og-image-${langCode}.png`;
}
