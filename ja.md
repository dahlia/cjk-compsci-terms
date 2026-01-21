日中韓のコンピュータ科学の用語対照
==================================

[![GitHub](https://img.shields.io/github/stars/dahlia/cjk-compsci-terms?style=social)][GitHub]
[![Netlify](https://api.netlify.com/api/v1/badges/2ae1a16c-e345-4863-90c0-080e520855a5/deploy-status)][Netlify]
[![クリエイティブ・コモンズ・ライセンス](/cc-by-sa.svg)][CC BY-SA 4.0]
[![GitHub Sponsors](https://img.shields.io/github/sponsors/dahlia?logo=github)][GitHub Sponsors]

日本·中華圏·韓国はいわゆる[漢字文化圏]と呼ばれ、
近代以降の西洋の様々な概念を漢字の造語力を利用して翻訳·借用しました。
その中では国ごとに独自の訳語を作った場合もありますが、
隣国の訳語を輸入した場合もあります。
隣国から輸入した語根と自国の固有語を合わせて翻訳借用語を作る場合もあります。
その結果、漢字文化圏の国々は多くの言葉を共有しながらも、
ある程度それぞれ固有の部分を持つようになりました。
そしてこれはコンピュータ科学の用語でも同じです。

このページは主に英語が原語であるコンピューター科学の様々な用語を、
漢字文化圏の国々でどのように訳しているのかを比較した対照表を載せています。

この作品は[クリエイティブ・コモンズ表示-継承4.0国際ライセンス][CC BY-SA 4.0]
の下に提供されています。

[漢字文化圏]: https://ja.wikipedia.org/wiki/%E6%BC%A2%E5%AD%97%E6%96%87%E5%8C%96%E5%9C%8F
[GitHub]: https://github.com/dahlia/cjk-compsci-terms
[Netlify]: https://app.netlify.com/sites/cjk-compsci-terms/deploys
[CC BY-SA 4.0]: https://creativecommons.org/licenses/by-sa/4.0/
[GitHub Sponsors]: https://github.com/sponsors/dahlia


<!-- TOC: 目次 -->


例言
----

### 同根語 <span lang="en">(cognate)</span>

同根語とは、共通の起源を持つ単語を意味します。

例えば、英語<q lang="en">computer</q>と日本語<q>コンピュータ</q>、
日本語<q>情報</q>と韓国語<q lang="ko"><ruby>정<rt>チョン</rt>보<rt>ボ</rt>
</ruby></q><span lang="ko">(情報)</span>は同根語です。

同根語は、同じ色の枠で表示されます。

### 翻訳借用 <span lang="fr">(calque)</span>

翻訳借用とは、或る言語が他の言語から語を借用する時、
借用元の語の意味をなぞり、翻訳して取り入れる事を指します。

例えば、英語の<q lang="en">artificial intelligence</q>
の訳語<q>人工知能</q>は、英語の語根の<q lang="en">artificial</q>→<q>人工</q>
と<q lang="en">intelligence</q>→<q>知能</q>をそれぞれ翻訳して借用しました。

この様に、言語間で対応する語根は、同じ色と形の下線で表示されます。

### 漢字

語根が漢字である場合は、日本語読みの振り仮名を付きます。

例えば、中国語の単語の<q lang="zh-CN"><ruby>问<rt>ウェン</rt>
题<rt>ティー</rt></ruby></q>は、日本語の単語の<q>問題</q>と
同根語であることを分かりやすくする為、中国語読みの<q>ウェンティー</q>
ではなく日本語読みの<q>もんだい</q>の振り仮名を付きます: <q lang="zh-CN">
<ruby>问<rt lang="ja">もん</rt>题<rt lang="ja">だい</rt></ruby></q>。

### 音訳

語根が外国語を音訳した場合、原文のルビを付きます。

例えば、中国語の<q lang="zh">圖靈</q>は、英国の数学者であるアラン・
チューリング(<span lang="en">Alan Turing</span>)の音訳ですが、
日本語読みをせず原文の<q lang="en">Turing</q>のルビを付きます: <q lang="zh">
<ruby>圖靈<rt lang="en">Turing</rt></ruby></q>.

### 原音のローマ字表記

単語の原音は、単語の下の括弧内にローマ字で表記されます。
言語別転写規則は、次のとおりです。

日本語
:   [ヘボン式ローマ字]

標準中国語 (中国と台湾)
:   [漢語拼音]

広東語 (香港)
:   [香港語言学学会粤語拼音方案][粤拼]

韓国語
:   [文化観光部2000年式]

[ヘボン式ローマ字]: https://ja.wikipedia.org/wiki/%E3%83%98%E3%83%9C%E3%83%B3%E5%BC%8F%E3%83%AD%E3%83%BC%E3%83%9E%E5%AD%97
[漢語拼音]: https://ja.wikipedia.org/wiki/%E6%8B%BC%E9%9F%B3
[粤拼]: https://ja.wikipedia.org/wiki/%E9%A6%99%E6%B8%AF%E8%AA%9E%E8%A8%80%E5%AD%A6%E5%AD%A6%E4%BC%9A%E7%B2%A4%E8%AA%9E%E6%8B%BC%E9%9F%B3%E6%96%B9%E6%A1%88
[文化観光部2000年式]: https://ja.wikipedia.org/wiki/%E6%96%87%E5%8C%96%E8%A6%B3%E5%85%89%E9%83%A82000%E5%B9%B4%E5%BC%8F


基本用語
--------

[表示](tables/basic.yaml)


単位
----

[表示](tables/units.yaml)


研究分野
--------

[表示](tables/studies.yaml)


プログラミング
--------------

[表示](tables/programming.yaml)


道具
----

[表示](tables/tools.yaml)


計算理論
--------

[表示](tables/theory-comp.yaml)


プログラミングパラダイム
------------------------

[表示](tables/paradigms.yaml)


並行計算
-------

[表示](tables/concurrency.yaml)


オペレーティングシステム
------------------------

[表示](tables/os.yaml)


自由ソフトウェアとオープンソース
--------------------------------

[表示](tables/foss.yaml)


ネットワーク
------------

[表示](tables/networking.yaml)


データベース
------------

[表示](tables/database.yaml)


セキュリティ
------------

[表示](tables/security.yaml)


データ構造
----------

[表示](tables/data-structures.yaml)


アルゴリズム
------------

[表示](tables/algorithms.yaml)


人工知能と機械学習
------------------

[表示](tables/ai-ml.yaml)


コンピュータグラフィックス
--------------------------

[表示](tables/graphics.yaml)


ウェブ
------

[表示](tables/web.yaml)


モバイル
--------

[表示](tables/mobile.yaml)


ゲーム開発
----------

[表示](tables/game-dev.yaml)


ハードウェア
------------

[表示](tables/hardware.yaml)


コンピュータアーキテクチャ
--------------------------

[表示](tables/architecture.yaml)
