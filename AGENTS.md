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
make -j              # Build all HTML files (parallel, recommended)
make lint            # Run all linting (yaml-schema, mypy, yamllint)
make clean           # Clean build artifacts
make validate-html5  # Validate generated HTML5 (requires html5validator)
make yaml-schema     # Validate YAML tables against schema
make mypy            # Type check build.py
~~~~

Output goes to `public_html/`.


Tech stack
----------

 -  Python 3.10+ with Jinja2 templates
 -  YAML data files for term translations
 -  Markdown content files per locale (en.md, ja.md, ko.md, zh-Hant.md)
 -  Key libraries: pykakasi (Japanese), dragonmapper (Chinese pinyin),
    hangul-romanize (Korean), opencc-py (Chinese character conversion)


Architecture
------------

### Data Flow

1.  YAML tables (`tables/*.yaml`) contain term translations for all locales
2.  `build.py` parses YAML, creates Term objects with romanization
3.  Jinja2 templates (`templates/`) render HTML tables
4.  Markdown content files provide page text around tables

### Key Files

 -  `build.py` - Main build script (654 lines), handles all transformations and
    romanization
 -  `table.schema.yaml` - JSON Schema for validating YAML table structure
 -  `templates/table.html` - Complex macros for multi-locale table rendering with
    ruby annotations

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


Linting
-------

YAML files must follow `.yamllint` rules: 80 char lines, 2-space indent, double
quotes. The CI runs yaml-schema validation, editorconfig checks, yamllint, and
full build with HTML5 validation.
