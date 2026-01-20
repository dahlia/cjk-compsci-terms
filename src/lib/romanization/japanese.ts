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
 */
export async function readJapanese(
  term: string,
  normalizedTerm: string,
  _previousTerms: string[],
): Promise<CharacterReading[]> {
  const kuroshiro = await getKuroshiro();
  // Get hiragana for each character group
  const hiragana = await kuroshiro.convert(normalizedTerm, {
    to: "hiragana",
    mode: "okurigana",
  });

  // For simplicity, pair each original character with corresponding hiragana
  // This is a simplified version - Kuroshiro's okurigana mode gives us furigana markup
  // We parse that to extract readings
  const readings: CharacterReading[] = [];
  let i = 0;
  for (const char of term) {
    // Simple approximation: just get the hiragana reading
    const reading = await kuroshiro.convert(char, {
      to: "hiragana",
      mode: "normal",
    });
    readings.push([char, reading]);
    i++;
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
