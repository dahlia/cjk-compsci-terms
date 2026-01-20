AGENTS.md
=========

This file provides guidance to LLM coding agents when working with code in this
repository.  See also *CONTRIBUTING.md* for word identifier conventions and
data format details.


Project overview
----------------

CJK Computer Science Terms Comparison is a static website comparing how English
computer science terms are translated in Chinese
(Mandarin/Cantonese/Traditional), Japanese, and Korean. It showcases
translation patterns including calques (loan translations), homophonic
translations, and cognates across the Sinosphere.


Build commands
--------------

~~~~ bash
deno task build              # Build all HTML files
deno task build -l en        # Build single locale
deno task test               # Run all tests
deno task check              # Type check all TypeScript
deno task lint               # Run linter
deno task fmt                # Format source code
~~~~

Output goes to `public_html/`.


Tech stack
----------

 -  Deno 2.6+ with TypeScript
 -  Custom JSX runtime for server-side HTML generation (no React)
 -  YAML data files for term translations (`@std/yaml`)
 -  Markdown content files per locale (en.md, ja.md, ko.md, zh-Hant.md)
 -  Key libraries:
    - kuroshiro + kuromoji (Japanese romanization, Hepburn)
    - es-hangul + hanja (Korean romanization, MCST)
    - pinyin (Chinese Mandarin, Pinyin)
    - to-jyutping (Cantonese, Jyutping)
    - opencc-js (Chinese character conversion)


Architecture
------------

### Directory Structure

~~~~
src/
  types/           # TypeScript type definitions
    locale.ts      # LocaleCode, LocaleInfo, parsing utilities
    spacing.ts     # Spacing enum and utilities
    term.ts        # BaseTerm, EasternTerm, WesternTerm
    word.ts        # Word interface
    translation.ts # Translation with cognate/correspondence metadata
    table.ts       # Table with lookup utilities
  lib/
    romanization/  # Language-specific romanization
      index.ts     # Unified romanize() and getCharacterReadings()
      japanese.ts  # Kuroshiro-based Hepburn romanization
      korean.ts    # es-hangul + hanja conversion
      chinese.ts   # Pinyin for Mandarin
      cantonese.ts # Jyutping for Cantonese
      opencc.ts    # Character normalization (jp2t, s2t)
    yaml-loader.ts # YAML table parsing
    markdown.ts    # Markdown to HTML conversion
  jsx-runtime/     # Custom JSX factory (jsx, jsxs, Fragment)
  components/      # TSX components
    Layout.tsx     # Page wrapper
    Navigation.tsx # Language switcher
    Table.tsx      # Comparison table
    WordSpan.tsx   # Term with ruby annotations
  build.ts         # CLI entry point
~~~~

### Data Flow

1.  YAML tables (`tables/*.yaml`) contain term translations for all locales
2.  `yaml-loader.ts` parses YAML into typed Table/Translation/Word objects
3.  `romanization/` modules add phonetic readings and romanizations
4.  TSX components render HTML tables with ruby annotations
5.  `build.ts` assembles pages from Markdown content + rendered tables

### Key Files

 -  `src/build.ts` - Main build script with CLI
 -  `src/lib/yaml-loader.ts` - YAML parsing and type conversion
 -  `src/lib/romanization/index.ts` - Unified romanization API
 -  `src/components/Table.tsx` - Main table rendering component
 -  `table.schema.yaml` - JSON Schema for validating YAML table structure

### YAML table format

Each entry maps locales to term definitions:

~~~~ yaml
- en:
    computer:
    - { term: comput, correspond: compute }
    - { term: er, space: no }
  ja:
    computer:
    - { term: コンピュータ, loan: computer }
  zh-CN:
    電腦:
    - { term: 电, correspond: electronic, read: diàn }
    - { term: 脑, correspond: brain, read: nǎo, space: no }
~~~~

Term properties: `term` (required), `space`, `correspond` (etymology link),
`read` (phonetic), `loan` (loanword source).

### Supported locales

`en`, `ja`, `ko`, `zh-CN` (Simplified), `zh-HK` (Cantonese), `zh-TW`
(Traditional)


Testing
-------

All modules have corresponding `*_test.ts` files using Deno's built-in test
runner with `@std/assert`. Run with:

~~~~ bash
deno task test               # All tests
deno test src/lib/           # Just library tests
deno test --filter "romanize" # Tests matching pattern
~~~~


Linting
-------

YAML files must follow `.yamllint` rules: 80 char lines, 2-space indent, double
quotes. TypeScript follows Deno's default formatter and linter rules.
