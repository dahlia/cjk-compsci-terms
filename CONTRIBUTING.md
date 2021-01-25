Contribution guide / 參與指針
=============================

 -  Please be kind to each other.
 -  All issues, pull requests, and comments should be written in one of
    the following four languages: English (preferred), Chinese, Japanese,
    or Korean.


How to build
------------

Prerequisites are:

 -  POSIX-compliant environment (e.g., Linux, macOS)
 -  Python 3.7+
 -  GNU Make
 -  GNU Wget or `curl`

The single command to build the whole website is:

    make

This command takes much longer time at the first run as it installs dependent
libraries.  As all dependencies are installed at first run, runs from second
are faster than the first run.

The built files are placed to the *public_html/* directory.


How to add words
----------------

Word data are placed in the *tables/* directory.  Each *.yaml* file contains
a single topic.

Unfortunately, the file format is not documented yet.  However, you can still
add new words by mimicking other existing words.  Few keywords:

 -  Every word has an identifier.  This should be normalized to be grouped
    with cognates.
     -  Sino-Japanese and Sino-Korean roots/words should be written in
        Chinese characters.  E.g.: `전산학` → `電算學`.
     -  All Chinese characters should be in traditional and orthodox form
        (繁體字/舊字體/《康熙字典》體).  E.g.: `科学` → `科學`.
     -  All roots/stems that transliterates English (or other Western languages)
        word should be in small Latin letters.  Only proper nouns are
        exceptional.  E.g.: `圖靈` → `Turing`, `コンピュータ` → `computer`,
        `버그` → `bug`.
     -  All roots/stems with Chinese characters should not be separated by
        spaces, unless they are next to a root/stem with Latin characters.
        E.g.: `암호 이론` → `暗號理論`, `コンピュータ科学` → `computer 科學`,
        `コンピュータセキュリティ` → `computer security`.
 -  `loan:` indicates a root/word is a part of a loan translation and what
    the original word is.
 -  `read:` specifies phonetic rendering of a root/word.  Separated by
    spaces to pair with Chinese characters.
 -  `correspond:` specifies the correspondence in the original language
    of a root/word.
