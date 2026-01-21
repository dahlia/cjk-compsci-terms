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
 * we use the normalized term (Traditional Chinese) for reading lookup but
 * pair with the original characters for display.
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
    // Use normalized character for reading lookup (e.g., 電 instead of 电)
    const normalizedChar = normalizedChars[i] ?? origChar;

    // Get hiragana reading for the normalized character
    const reading = await kuroshiro.convert(normalizedChar, {
      to: "hiragana",
      mode: "normal",
    });

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
