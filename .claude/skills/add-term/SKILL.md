Add Term Skill
==============

Add new computer science terms to the CJK comparison tables.


Usage
-----

~~~~
/add-term <English term> [--category <category>]
~~~~


Overview
--------

This skill adds new terms to the YAML data files that power the CJK computer
science terms comparison website. Each term requires translations in 6 locales:
English (en), Japanese (ja), Korean (ko), Simplified Chinese (zh-CN),
Cantonese/Hong Kong (zh-HK), and Traditional Chinese/Taiwan (zh-TW).


YAML Data Format
----------------

Terms are stored in `tables/*.yaml` files. Each file is an array of translation
entries. Each entry maps locales to word definitions.

### Entry Structure

~~~~ yaml
# Comment describing the term (English name)
- en:
    <word-id>:
    - { term: <root1> }
    - { term: <root2>, space: no }
  ja:
    <word-id>:
    - { term: <text>, loan: <source> }
  ko:
    <word-id>:
    - { term: <text>, read: <reading>, correspond: <english> }
  zh-CN:
    <word-id>:
    - { term: <text>, read: <pinyin>, correspond: <english> }
  zh-HK:
    <word-id>:
    - { term: <text>, read: <jyutping>, correspond: <english> }
  zh-TW:
    <word-id>:
    - { term: <text>, read: <bopomofo>, correspond: <english> }
~~~~

### Term Properties

| Property     | Required | Description                                                                 |
| ------------ | -------- | --------------------------------------------------------------------------- |
| `term`       | Yes      | The actual word/root text                                                   |
| `space`      | No       | Spacing before this term: `no`/`false` (attach), `true` (space), `"hyphen"` |
| `correspond` | No       | Etymology link to English root (for calques/loan translations)              |
| `read`       | No       | Phonetic reading (see Phonetic Systems below)                               |
| `loan`       | No       | Original word for phonetic borrowings (e.g., `computer` for `コンピュータ`) |
| `norm`       | No       | Normalized form for regional character variants                             |

### Phonetic Systems by Locale

 -  **zh-CN**: Hanyu Pinyin with tone marks (e.g., `diàn`, `nǎo`)
 -  **zh-HK**: Jyutping (e.g., `din6`, `nou5`)
 -  **zh-TW**: Bopomofo/Zhuyin (e.g., `ㄉㄧㄢˋ`, `ㄋㄠˇ`)
 -  **ja**: Hiragana with spaces between kanji readings (e.g., `けい さん き`)
 -  **ko**: Hangul with spaces between hanja readings (e.g., `계 산 기`)

### Word ID Normalization Rules

Word IDs group cognates across languages. Follow these rules:

1.  **Sino-Japanese/Sino-Korean → Traditional Chinese**
     -  `전산학` → `電算學`
     -  `計算機` (Japanese) → `計算機`

2.  **All Chinese characters → Traditional/Orthodox form (康熙字典體)**
     -  `科学` → `科學`
     -  `电脑` → `電腦`

3.  **Transliterated Western words → lowercase Latin**
     -  `コンピュータ` → `computer`
     -  `버그` → `bug`
     -  Exception: Proper nouns keep capitalization (`圖靈` → `Turing`)

4.  **No spaces between Chinese characters, space before/after Latin**
     -  `암호 이론` → `暗號理論`
     -  `コンピュータ科学` → `computer 科學`

### Examples

#### Phonetic borrowing (外来語/외래어)

~~~~ yaml
- en:
    computer:
    - { term: comput, correspond: compute }
    - { term: er, space: no }
  ja:
    computer:
    - { term: コンピュータ, loan: computer }
  ko:
    computer:
    - { term: 컴퓨터, loan: computer }
~~~~

#### Calque/loan translation (번역차용/翻訳借用)

~~~~ yaml
- en:
    artificial intelligence:
    - term: artificial
    - term: intelligence
  ja:
    人工智能:
    - { term: 人工, read: じん こう, correspond: artificial }
    - { term: 知能, read: ち のう, correspond: intelligence }
  ko:
    人工智能:
    - { term: 人工, read: 인 공, correspond: artificial }
    - { term: 知能, read: 지 능, correspond: intelligence }
  zh-CN:
    人工智能:
    - { term: 人工, read: rén gōng, correspond: artificial }
    - { term: 智能, read: zhì néng, correspond: intelligence }
~~~~

#### Multiple variants in one locale

~~~~ yaml
  zh-HK:
    智能電話:
    - { term: 智能, correspond: smart, read: zi3 nang4 }
    - { term: 電話, correspond: telephone, read: din6 waa2 }
    智能手機:
    - { term: 智能, correspond: smart, read: zi3 nang4 }
    - { term: 手機, correspond: telephone, read: sau2 gei1 }
~~~~


Existing Categories
-------------------

| File                      | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `tables/basic.yaml`       | Basic terms (computer, software, hardware, etc.) |
| `tables/units.yaml`       | Units (bit, byte, etc.)                          |
| `tables/studies.yaml`     | Fields of study (computer science, AI, etc.)     |
| `tables/programming.yaml` | Programming concepts                             |
| `tables/tools.yaml`       | Development tools                                |
| `tables/theory-comp.yaml` | Theory of computation                            |
| `tables/paradigms.yaml`   | Programming paradigms                            |
| `tables/concurrency.yaml` | Concurrent programming                           |
| `tables/foss.yaml`        | Free/open source software                        |


Adding a New Category
---------------------

When creating a new category:

1.  Create `tables/<category>.yaml` with appropriate entries
2.  Add a section to ALL locale markdown files:

**en.md:**

~~~~ markdown
Category Title
--------------

[Show table](tables/<category>.yaml)
~~~~

**ja.md:**

~~~~ markdown
カテゴリー名
------------

[表示](tables/<category>.yaml)
~~~~

**ko.md:**

~~~~ markdown
카테고리명
----------

[표 보기](tables/<category>.yaml)
~~~~

**zh-Hant.md:**

~~~~ markdown
類別名稱
--------

[顯示表](tables/<category>.yaml)
~~~~


Research Guidelines
-------------------

**Translation research is critical.** Always cross-check multiple sources before
adding a term. Incorrect or uncommon translations degrade the quality of the
comparison tables.

### General Principles

 -  **Cross-reference multiple sources** - Never rely on a single source.
    Compare Wikipedia articles, technical documentation, academic papers, and
    actual usage in the wild.
 -  **Prefer official/standard terminology** - Government standards bodies,
    academic institutions, and major tech companies often have established
    translations.
 -  **Check actual usage frequency** - A term may have multiple translations;
    prefer the one most commonly used in practice.
 -  **Include multiple variants when appropriate** - If a concept has multiple
    translations with similar usage frequency in a locale, include all of them.
    For example, “smartphone” in Cantonese is both 智能電話 and 智能手機.
    Do not arbitrarily pick one; represent actual linguistic diversity.
 -  **User-provided references** - If the user provides reference materials
    (URLs, documents, screenshots), incorporate them into research and cite
    them when relevant.

### Recommended Search Engines by Locale

| Locale | Primary Search     | Secondary/Specialized                |
| ------ | ------------------ | ------------------------------------ |
| zh-CN  | [Baidu]            | [CNKI] (academic)                    |
| zh-TW  | Google (taiwan)    | [國家教育研究院雙語詞彙]             |
| zh-HK  | Google (hong kong) | HK government IT vocabulary          |
| ja     | Google (japan)     | [Weblio], [コトバンク]               |
| ko     | [Naver]            | [국립국어원 우리말샘], [네이버 사전] |

[Baidu]: https://www.baidu.com
[CNKI]: https://www.cnki.net
[國家教育研究院雙語詞彙]: https://terms.naer.edu.tw
[Weblio]: https://www.weblio.jp
[コトバンク]: https://kotobank.jp
[Naver]: https://www.naver.com
[국립국어원 우리말샘]: https://opendict.korean.go.kr
[네이버 사전]: https://dict.naver.com

### Useful Reference Resources

 -  **Wikipedia** - Check the article in each language; the sidebar shows
    equivalent articles in other languages
 -  **Microsoft Language Portal** - Official Microsoft terminology translations
 -  **國家教育研究院 (Taiwan)** - Official academic/technical term database
 -  **韓國情報通信用語辭典** - Korean ICT terminology
 -  **JIS/KS standards** - Japanese/Korean industrial standards for terminology

### Verification Checklist

Before finalizing a term entry:

 -  [ ] Searched in locale-appropriate search engines
 -  [ ] Verified the translation appears in authoritative sources
 -  [ ] Checked for regional variants (especially zh-CN vs zh-TW vs zh-HK)
 -  [ ] Confirmed phonetic readings are accurate
 -  [ ] Cross-checked cognate relationships across languages

### Handling Uncertainty

 -  If a translation cannot be verified with confidence, **ask the user** for
    guidance or additional references.
 -  If multiple equally valid translations exist, include all common variants
    (see “Multiple variants in one locale” example above).
 -  Add a comment in the YAML if there's notable ambiguity or regional
    variation worth documenting.


Workflow
--------

1.  **Identify the category** - Find the appropriate YAML file or create a new
    one
2.  **Research translations** - Use the guidelines above to find and verify
    translations in each locale
3.  **Determine word IDs** - Normalize according to the rules above
4.  **Add the entry** - Append to the YAML file with proper formatting
5.  **If new category** - Update all 4 markdown files
6.  **Build and verify** - Run `deno task build` to check for errors


YAML Style Guidelines
---------------------

 -  2-space indentation
 -  Double quotes for strings with special characters
 -  80 character line limit
 -  Align columns for readability when practical
 -  Add `# Comment` above each entry with the English term name
 -  End file with vim modeline: `# vim: set et sw=2 ts=2 sts=2 ft=yaml:`
