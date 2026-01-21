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
 * These are common on'yomi (Sino-Japanese) readings used in technical contexts.
 * Kuroshiro uses kuromoji which requires word context for morphological analysis,
 * so isolated characters often fail to get readings.
 */
const FALLBACK_READINGS: Record<string, string> = {
  // Characters that appear in Chinese terms but Kuroshiro can't read individually
  "軟": "なん", // soft (軟体, 軟件)
  "設": "せつ", // establish (設計, 設定)
  "錯": "さく", // mistake (錯誤)
  "碼": "ま", // code/number (編碼) - phonetic approximation
  "迴": "かい", // return - variant of 回
  "併": "へい", // combine (併合)
  "輯": "しゅう", // compile (編輯 = 編集)
  "斥": "せき", // repel/reject (排斥)
  "互": "ご", // mutual (互換, 相互)
  "訊": "しん", // inquire/message (通訊)
  "監": "かん", // supervise (監視)
  "演": "えん", // perform (演算)
  "憶": "おく", // remember (記憶)
  "循": "じゅん", // follow (循環)
  "絡": "らく", // connect (連絡)
  "竝": "へい", // line up - variant of 並
  "款": "かん", // article/section (條款)
  "授": "じゅ", // grant (授権, 授業)
  "圈": "けん", // circle - variant of 圏
  "訣": "けつ", // secret/farewell
  "韌": "じん", // tough/flexible
  "歷": "れき", // history - variant of 歴
  "區": "く", // area - variant of 区
  "塊": "かい", // lump/block
  "訂": "てい", // revise (訂正)
  "佈": "ふ", // spread - variant of 布
  "訪": "ほう", // visit (訪問)
  "邏": "ら", // patrol (邏輯 = logic)
  "遞": "てい", // relay - variant of 逓
  "滙": "かい", // confluence - variant of 匯
  "識": "しき", // know (認識, 識別)
  "個": "こ", // individual
  "値": "ち", // value (値段)
  "樣": "よう", // manner - variant of 様
  "據": "きょ", // base on - variant of 拠
  "條": "じょう", // article/strip - variant of 条
  "變": "へん", // change - variant of 変
  "數": "すう", // number - variant of 数
  "處": "しょ", // place - variant of 処
  "與": "よ", // give - variant of 与
  "關": "かん", // gate/relate - variant of 関
  "對": "たい", // opposite - variant of 対
  "體": "たい", // body - variant of 体
  "應": "おう", // respond - variant of 応
  "當": "とう", // hit/appropriate - variant of 当
  "發": "はつ", // emit - variant of 発
  "開": "かい", // open
  "問": "もん", // ask (問題)
  "題": "だい", // topic (問題)
  "電": "でん", // electric
  "腦": "のう", // brain - 脳
  "網": "もう", // net
  "資": "し", // resources
  "語": "ご", // language
  "言": "げん", // word
  "號": "ごう", // number/sign - variant of 号
  "偵": "てい", // spy/detect (偵錯 = debugging)
  "備": "び", // prepare (準備)
};

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
