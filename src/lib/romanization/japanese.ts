/**
 * Japanese romanization using Kuroshiro (Hepburn romanization).
 */
import kuroshiroModule from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import type { CharacterReading, RomanizationResult } from "./types.ts";

// Get the actual Kuroshiro constructor from the module
const Kuroshiro = (kuroshiroModule as { default: new () => KuroshiroInstance })
  .default;

/** Kuroshiro instance type */
interface KuroshiroInstance {
  init(analyzer: unknown): Promise<void>;
  convert(
    text: string,
    options: { to: string; mode: string; romajiSystem?: string },
  ): Promise<string>;
}

/** Language tag for Japanese Hepburn romanization */
export const JAPANESE_LANG_TAG = "ja-Latn-hepburn";

/**
 * Fallback readings for kanji that Kuroshiro can't read as single characters.
 * Loaded from external JSON file for easier maintenance.
 */
import fallbackReadingsJson from "./japanese-fallback-readings.json" with { type: "json" };
const FALLBACK_READINGS: Record<string, string> = fallbackReadingsJson;

// Kuroshiro instance (lazy initialized)
let kuroshiroInstance: KuroshiroInstance | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize Kuroshiro instance.
 * This is done lazily to avoid blocking at module load.
 */
async function getKuroshiro(): Promise<KuroshiroInstance> {
  if (kuroshiroInstance) {
    return kuroshiroInstance;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const kuroshiro = new Kuroshiro();
      await kuroshiro.init(new KuromojiAnalyzer());
      kuroshiroInstance = kuroshiro;
    })();
  }

  await initPromise;
  return kuroshiroInstance!;
}

/**
 * Romanize Japanese text to Hepburn romanization.
 */
export async function romanizeJapanese(
  text: string,
): Promise<RomanizationResult> {
  const kuroshiro = await getKuroshiro();
  const normalized = text.replace(/ /g, "");
  const romaji = await kuroshiro.convert(normalized, {
    to: "romaji",
    mode: "normal",
    romajiSystem: "hepburn",
  });
  return {
    langTag: JAPANESE_LANG_TAG,
    text: romaji,
  };
}

/**
 * Get character-by-character readings for Japanese text.
 * Returns pairs of [original, hiragana].
 *
 * When the term contains non-Japanese characters (e.g., Simplified Chinese),
 * we use the normalized term (shinjitai) for reading lookup but
 * pair with the original characters for display.
 *
 * Uses a fallback dictionary for characters that Kuroshiro can't read
 * as single characters (due to kuromoji requiring word context).
 */
export async function readJapanese(
  term: string,
  normalizedTerm: string,
  _previousTerms: string[],
): Promise<CharacterReading[]> {
  const kuroshiro = await getKuroshiro();

  // Convert normalized term character by character to get readings
  const readings: CharacterReading[] = [];
  const termChars = [...term];
  const normalizedChars = [...normalizedTerm];

  for (let i = 0; i < termChars.length; i++) {
    const origChar = termChars[i];
    // Use normalized character for reading lookup (e.g., 脳 instead of 腦)
    const normalizedChar = normalizedChars[i] ?? origChar;

    // Get hiragana reading for the normalized character
    let reading = await kuroshiro.convert(normalizedChar, {
      to: "hiragana",
      mode: "normal",
    });

    // If Kuroshiro couldn't read it (returned the character unchanged),
    // try the fallback dictionary
    if (reading === normalizedChar) {
      // First check if the original character has a fallback reading
      const fallback =
        FALLBACK_READINGS[origChar] ?? FALLBACK_READINGS[normalizedChar];
      if (fallback) {
        reading = fallback;
      }
    }

    // Pair original character with its reading
    readings.push([origChar, reading]);
  }

  return readings;
}

/**
 * Convert Japanese text to hiragana.
 */
export async function toHiragana(text: string): Promise<string> {
  const kuroshiro = await getKuroshiro();
  return await kuroshiro.convert(text, { to: "hiragana", mode: "normal" });
}
