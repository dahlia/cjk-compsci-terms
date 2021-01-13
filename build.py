from __future__ import annotations

import argparse
import dataclasses
import enum
import functools
import locale
import os
import os.path
import sys
import re
from typing import (
    AbstractSet,
    Callable,
    ClassVar,
    Dict,
    Iterable,
    Iterator,
    List,
    Mapping,
    Optional,
    Sequence,
    Set,
    Tuple,
    Type,
    Union,
    overload,
)
import urllib.parse

from babel.core import Locale, UnknownLocaleError  # type: ignore
from dragonmapper.hanzi import to_pinyin, to_zhuyin  # type: ignore
from dragonmapper.transcriptions import zhuyin_to_pinyin  # type: ignore
from hangul_romanize import Transliter  # type: ignore
from hangul_romanize.rule import academic  # type: ignore
from hanja import translate  # type: ignore
from jinja2.environment import Environment
from jinja2.filters import contextfilter
from jinja2.loaders import FileSystemLoader
from jinja2.utils import select_autoescape
from lazy_import import lazy_module  # type: ignore
from lxml.html import document_fromstring  # type: ignore
from markdown import Markdown
from markdown.extensions import Extension
from markdown.extensions.toc import (  # type: ignore
    TocExtension,
    slugify_unicode
)
from markdown.inlinepatterns import SimpleTextInlineProcessor  # type: ignore
from markupsafe import Markup
from opencc import OpenCC  # type: ignore
from pykakasi import kakasi
from romkan import to_roma  # type: ignore
from yaml import load
try:
    from yaml import CLoader as Loader
except ImportError:
    from yaml import Loader  # type: ignore


pinyin_jyutping_sentence = lazy_module('pinyin_jyutping_sentence')


class Spacing(enum.Enum):
    space = 'space'
    no_space = 'no_space'
    implicit_space = 'implicit_space'
    implicit_no_space = 'implicit_no_space'

    def __bool__(self):
        cls: Type[Space] = type(self)
        return self is cls.space or self is cls.implicit_space


@dataclasses.dataclass(frozen=True)
class Term:
    term: str
    space: Spacing
    correspond: str

    def romanize(self, locale: Locale) -> Markup:
        return romanize(self.term, locale)

    def normalize(self, locale: Locale) -> str:
        return self.term


kks = kakasi()


@dataclasses.dataclass(frozen=True)
class EasternTerm(Term):
    read: str

    def romanize(self, locale: Locale) -> Markup:
        return romanize(self.read, locale)

    normalizers: ClassVar[Mapping[Locale, OpenCC]] = {
        Locale.parse('ja'): OpenCC('jp2t'),
        Locale.parse('zh_CN'): OpenCC('s2t'),
        # Locale.parse('zh_HK'): OpenCC('hk2t'),
        # Locale.parse('zh_TW'): OpenCC('tw2t'),
    }

    readers: ClassVar[
        Mapping[
            Locale,
            Callable[
                [str, str, Sequence[str]],
                Iterable[Tuple[str, Union[str, Markup]]]
            ]
        ]
    ] = {
        Locale.parse('ja'): lambda t, n, _: (
            (t[sum(len(x['orig']) for x in r[:i]):][:len(e['orig'])], e['hira'])
            for r in [kks.convert(n)]
            for i, e in enumerate(r)
        ),
        Locale.parse('ko'): lambda t, n, p:
            zip(
                t,
                # To prevent a non-spaced term from the "initial sound law"
                # (which is adopted by South Korean orthography;
                # <https://en.wikipedia.org/wiki/Dueum_beopchik>),
                # prepend previous terms to the input, and strip them
                # from the output:
                translate(''.join(p) + n, 'substitution')[sum(map(len, p)):]
            ),
        Locale.parse('zh_CN'): lambda t, n, _:
            zip(t, pinyin_jyutping_sentence.pinyin(n, False, True).split()),
        Locale.parse('zh_HK'): lambda t, n, _:
            zip(t, pinyin_jyutping_sentence.jyutping(n, True, True).split()),
        Locale.parse('zh_TW'): lambda t, n, _:
            zip(t, pinyin_jyutping_sentence.pinyin(n, False, True).split()),
    }

    def normalize(self, locale: Locale) -> str:
        try:
            normalizer = self.normalizers[locale]
        except KeyError:
            return self.term
        else:
            return normalizer.convert(self.term)

    def read_as(self,
                from_: Locale,
                to: Locale,
                previous_terms: Sequence[Term],
                word_id: str,
                translation: Translation,
                table: Table) -> Iterable[Tuple[str, Union[str, Markup]]]:
        if from_ == to:
            return zip(self.term, self.read.split())
        same_cls = type(self)
        target_words: Sequence[Word] = translation.get(to, [])
        for target_word in target_words:
            if target_word.id == word_id:
                for target_term in target_word:
                    if target_term.correspond == self.correspond and \
                       isinstance(target_term, same_cls):
                        return zip(self.term, target_term.read.split())
        terms_table: Mapping[str, Term] = table.terms_table.get(to, {})
        term_id = self.normalize(from_)
        correspond = terms_table.get(term_id)
        if isinstance(correspond, same_cls):
            return zip(self.term, correspond.read.split())
        reader = self.readers.get(to)
        term = self.normalize(from_)
        if callable(reader):
            previous = [t.normalize(from_) for t in previous_terms]
            return reader(self.term, term, previous)
        return self.read_as(
            from_,
            from_,
            previous_terms,
            word_id,
            translation,
            table
        )


@dataclasses.dataclass(frozen=True)
class WesternTerm(Term):
    loan: str
    locale: Locale

    def romanize(self, locale: Locale) -> Markup:
        r = super().romanize(locale)
        return Markup(r.capitalize()) if self.loan[0].isupper() else r


hangul_romanize_transliter = Transliter(academic)

romanizers: Mapping[Locale, Callable[[str], Markup]] = {
    Locale.parse('ja'): lambda t: Markup(to_roma(t.replace(' ', ''))),
    Locale.parse('ko'): lambda t:
        Markup(hangul_romanize_transliter.translit(t.replace(' ', ''))),
    Locale.parse('zh_CN'): lambda t:
        Markup(to_pinyin(t).replace(' ', '')),
    Locale.parse('zh_HK'): lambda t:
        Markup(
            re.sub(
                r'(\d) ?',
                r'<sup>\1</sup>',
                t if re.match(r'^[A-Za-z0-9 ]+$', t)
                else pinyin_jyutping_sentence.jyutping(t, True, True)
            )
        ),
    Locale.parse('zh_TW'): lambda t:
        Markup(zhuyin_to_pinyin(to_zhuyin(t)).replace(' ', '')),
}


def romanize(term: str, locale: Locale) -> Markup:
    global romanizers
    try:
        f = romanizers[locale]
    except KeyError:
        return Markup(term.replace(' ', ''))
    return f(term)


class Word(Sequence[Term]):
    def __init__(self, id: str, locale: Locale, terms: Iterable[Term]):
        self.id = id
        self.locale = locale
        self.terms = list(terms)

    def __iter__(self) -> Iterator[Term]:
        return iter(self.terms)

    def __len__(self) -> int:
        return len(self.terms)

    def romanize(self) -> str:
        return Markup('').join(
            Markup('' if term.space is Spacing.no_space else ' ') +
                term.romanize(self.locale)
            for term in self
        ).strip()

    def get_previous_terms(self, term: Term) -> Sequence[Term]:
        prev_terms: List[Term] = []
        for t in self:
            if t.space:
                prev_terms.clear()
            if term == t:
                return prev_terms
            prev_terms.append(t)
        raise ValueError('failed to find ' + repr(term))

    @overload
    def __getitem__(self, index: int) -> Term: ...

    @overload
    def __getitem__(self, index: slice) -> Sequence[Term]: ...

    def __getitem__(self, i: Union[int, slice]) -> Union[Term, Sequence[Term]]:
        return self.terms[i]

    def __repr__(self) -> str:
        cls = type(self)
        return f'{cls.__qualname__}.{cls.__name__}({self.id!r}, {self.terms!r})'


class Translation(Mapping[Locale, Sequence[Word]]):
    def __init__(self, translation: Iterable[Tuple[Locale, Sequence[Word]]]):
        self.translation: Mapping[Locale, Sequence[Word]] = dict(translation)

    def __iter__(self) -> Iterator[Tuple[Locale, Sequence[Word]]]:
        return iter(self.translation)

    def __len__(self) -> int:
        return len(self.translation)

    def __getitem__(self, key: Locale) -> Sequence[Word]:
        return self.translation[key]

    @functools.cached_property
    def max_words(self) -> int:
        return max(len(ws) for ws in self.translation.values())

    @functools.cached_property
    def cognate_groups(self) -> Mapping[str, Mapping[Locale, Word]]:
        cognate_groups: Dict[str, Dict[Locale, Word]] = {}
        for locale, words in self.translation.items():
            for word in words:
                cognate_groups.setdefault(word.id, {})[locale] = word
        for word_id in list(cognate_groups):
            if len(cognate_groups[word_id]) < 2:
                del cognate_groups[word_id]
        return cognate_groups

    @functools.cached_property
    def correspondences(self) -> Sequence[str]:
        count_map: Dict[str, int] = {}
        for words in self.values():
            for word in words:
                for term in word:
                    count_map[term.correspond] = \
                        count_map.get(term.correspond, 0) + 1
        counts: List[Tuple[str, int]] = list(count_map.items())
        counts.sort(key=lambda pair: pair[1], reverse=True)
        return [k for k, v in counts if v > 1]


class Table(Sequence[Translation]):
    def __init__(self, translations: Iterable[Translation]):
        self.translations = list(translations)

    @functools.cached_property
    def supported_locales(self) -> AbstractSet[Locale]:
        return frozenset(locale for tr in self for locale in tr)

    @functools.cached_property
    def terms_table(self) -> Mapping[Locale, Mapping[str, Term]]:
        table: Dict[Locale, Dict[str, Term]] = {}
        for translation in self:
            for locale, words in translation.items():
                terms: Dict[str, Term] = table.setdefault(locale, {})
                for word in words:
                    for term in word:
                        terms[term.normalize(locale)] = term
        return table

    def __iter__(self) -> Iterator[Translation]:
        return iter(self.translations)

    def __len__(self) -> int:
        return len(self.translations)

    @overload
    def __getitem__(self, index: int) -> Translation: ...

    @overload
    def __getitem__(self, index: slice) -> Sequence[Translation]: ...

    def __getitem__(self, i: Union[int, slice]) -> Union[
            Translation, Sequence[Translation]]:
        return self.translations[i]

    def __repr__(self) -> str:
        cls = type(self)
        return f'{cls.__qualname__}.{cls.__name__}({self.translations!r})'


spaceless_languages: AbstractSet[str] = {'ja', 'zh'}


def load_table(path: Union[str, os.PathLike]) -> Table:
    with open(os.fspath(path)) as f:
        data = load(f, Loader=Loader)
    table: List[Translation] = []
    assert isinstance(data, Sequence)
    for tr_row in data:
        assert isinstance(tr_row, Mapping)
        translation: List[Tuple[Locale, Sequence[Word]]] = []
        for lang, ws in tr_row.items():
            assert isinstance(lang, str)
            locale = Locale.parse(lang.replace('-', '_'))
            implicit_spacing = \
                Spacing.implicit_no_space \
                if locale.language in spaceless_languages \
                else Spacing.implicit_space
            assert isinstance(ws, Mapping)
            words: List[Word] = []
            for wid, term_rows in ws.items():
                assert isinstance(wid, str)
                assert isinstance(term_rows, Sequence)
                terms: List[Term] = []
                for term_row in term_rows:
                    assert isinstance(term_row, Mapping)
                    t = term_row['term']
                    try:
                        spacing = \
                            Spacing.space \
                            if term_row['space'] \
                            else Spacing.no_space
                    except KeyError:
                        spacing = implicit_spacing
                    term: Term
                    if 'loan' in term_row:
                        term = WesternTerm(
                            t,
                            spacing,
                            term_row.get('correspond', term_row['loan']),
                            term_row['loan'],
                            term_row.get('language', Locale.parse('en'))
                        )
                    elif 'read' in term_row:
                        term = EasternTerm(
                            t,
                            spacing,
                            term_row.get('correspond', t),
                            term_row['read']
                        )
                    else:
                        term = Term(t, spacing, term_row.get('correspond', t))
                    terms.append(term)
                word = Word(wid, locale, terms)
                words.append(word)
            translation.append((locale, words))
        table.append(Translation(translation))
    return Table(table)


territory_names: Mapping[Tuple[str, Locale], str] = {
    # "Hong Kong SAR China" is too long to show in a narrow column:
    ('HK', Locale.parse('en')): 'Hong Kong',
    ('HK', Locale.parse('ja')): '香港',
    ('HK', Locale.parse('ko')): '홍콩',
    ('HK', Locale.parse('zh_CN')): '香港',
    ('HK', Locale.parse('zh_Hans')): '香港',
    ('HK', Locale.parse('zh_Hant')): '香港',
    ('HK', Locale.parse('zh_HK')): '香港',
    ('HK', Locale.parse('zh_TW')): '香港',
}

def get_territory_name(territory: Union[Locale, str], language: Locale) -> str:
    if isinstance(territory, Locale):
        territory = territory.territory
    return territory_names.get(
        (territory, language),
        language.territories[territory]
    )


template_loader = FileSystemLoader(os.path.dirname(__file__))
template_env = Environment(
    loader=template_loader,
    autoescape=select_autoescape(['html']),
    extensions=['jinja2.ext.do'],
)
template_env.filters.update(
    dictselect=contextfilter(
        lambda ctx, dict, test=None, *args, **kwargs: {
            k: v
            for k, v in dict.items()
            if (ctx.environment.call_test(test, v, *args, **kwargs) if test else v)
        }
    ),
    territory_name=get_territory_name,
    zip=zip,
)
table_template = template_env.get_template('table.html')


def render_table(
    locale: Locale,
    table: Table,
    source: Optional[str] = None,
) -> str:
    supported_locale_map: Mapping[str, AbstractSet[Locale]] = {
        locale.language: {
            l for l in table.supported_locales
            if l.language == locale.language
        }
        for locale in table.supported_locales
    }
    locales: Mapping[str, Union[Locale, Mapping[str, Locale]]] = {
        l: next(iter(ls)) if len(ls) == 1 else {
            '_': Locale(l),
            **{
                l.territory: l
                for l in sorted(
                    ls,
                    key=lambda l: (
                        l != locale,
                        l.territory != locale.territory,
                        get_territory_name(l.territory, locale),
                    )
                )
            }
        }
        for l, ls in sorted(
            supported_locale_map.items(),
            key=lambda pair: (
                pair[0] != 'en',
                pair[0] != locale.language,
                Locale(pair[0]).get_display_name(locale),
            )
        )
    }
    return table_template.render(
        locale=locale,
        locales=locales,
        table=table,
        source=source,
    )


class IgnoreLineFeedExtension(Extension):
    def extendMarkdown(self, md):
        md.inlinePatterns.register(
            SimpleTextInlineProcessor(r'()\n+'),
            'linefeed',
            40
        )


def render_doc(path: Union[str, os.PathLike], locale: Locale) -> str:
    extensions: Set[Union[str, Extension]] = {
        'abbr',
        'def_list',
        'footnotes',
        'sane_lists',
        'tables',
        TocExtension(slugify=slugify_unicode),
    }
    if locale.language in ('ja', 'zh'):
        extensions.add(IgnoreLineFeedExtension())
    else:
        extensions.add('smarty')
    md = Markdown(
        output_format='html',
        extensions=list(extensions),
    )
    with open(os.fspath(path)) as f:
        html: str = md.convert(f.read())
    toc: str = getattr(md, "toc")
    html = re.sub(
        r'<!--\s*TOC\s*:\s*(.+?)\s*-->',
        lambda m: f'<div id="toc"><div><h2>{m.group(1)}</h2>{toc}</div></div>',
        html
    )
    html = re.sub(
        r'<p><a href="([^">\n]+?\.ya?ml)">.*?</a></p>',
        lambda m: render_table(locale, load_table(m.group(1)), m.group(1)),
        html
    )
    return html


page_template = template_env.get_template('layout.html')


def render_page(
    doc_path: Union[str, os.PathLike],
    locale: Locale,
    base_href: Optional[str] = None,
    lang_hrefs: Optional[Mapping[Locale, str]] = None,
) -> str:
    doc = render_doc(doc_path, locale)
    title = document_fromstring(
        f'<html><body>{doc}</body></html>'
    ).xpath('/html/body/h1')[0].text_content()
    absolute_base = base_href and base_href.startswith(('http:', 'https:'))
    lang_href_pairs: List[Tuple[Locale, str]] = [
        (l, urllib.parse.urljoin(base_href, h)
            if base_href is not None and absolute_base
            else h)
        for l, h in ([] if lang_hrefs is None else lang_hrefs.items())
    ]
    lang_href_pairs.sort(key=lambda pair: str(pair[0]))
    return page_template.render(
        locale=locale,
        doc=Markup(doc),
        title=title,
        base_href=base_href,
        lang_hrefs=lang_href_pairs,
    )


def main():
    def parse_locale(locale: str) -> Locale:
        try:
            return Locale.parse(locale.replace('-', '_'))
        except UnknownLocaleError as e:
            raise ValueError(str(e)) from e
    def parse_lang_href(pair: str) -> Tuple[Locale, str]:
        locale, href = pair.split(':', 1)
        return parse_locale(locale), href
    parser = argparse.ArgumentParser()
    parser.add_argument('locale', metavar='LANG', type=parse_locale)
    parser.add_argument('file')
    parser.add_argument('--base-href')
    parser.add_argument(
        '-l', '--lang',
        metavar='LANG:HREF',
        action='append',
        type=parse_lang_href,
        dest='lang_hrefs',
    )
    args = parser.parse_args()
    if not os.path.isfile(args.file):
        parser.error(f'no such file: {args.file}')
        return
    lang_hrefs: Dict[Locale, str] = dict(args.lang_hrefs)
    print(render_page(args.file, args.locale, args.base_href, lang_hrefs))


if __name__ == '__main__':
    main()
