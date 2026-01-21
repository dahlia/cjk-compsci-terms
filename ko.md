한·중·일 전산학 용어 대조
=========================

[![GitHub](https://img.shields.io/github/stars/dahlia/cjk-compsci-terms?style=social)][GitHub]
[![Netlify](https://api.netlify.com/api/v1/badges/2ae1a16c-e345-4863-90c0-080e520855a5/deploy-status)][Netlify]
[![크리에이티브 커먼즈 라이선스](/cc-by-sa.svg)][CC BY-SA 4.0]
[![GitHub Sponsors](https://img.shields.io/github/sponsors/dahlia?logo=github)][GitHub Sponsors]

한국·일본·중화권은 이른바 [한자문화권]으로 불리며,
근대 이후 서양의 여러 개념을 한자의 조어력을 이용해 번역차용했습니다.
그 중에서는 각자 다른 번역어를 만든 것도 있지만,
옆 나라의 번역어를 수입한 경우도 있습니다.
옆 나라에서 수입한 어근과 자국의 고유어를 합쳐서 번역차용어를
만드는 경우도 있습니다.
그 결과, 한자문화권의 나라들은 많은 말을 공유하면서도 어느 정도
각자의 고유한 부분을 갖게 됐습니다.
그리고 이는 전산학 번역어에서도 다르지 않습니다.

이 페이지는 주로 영어가 원어인 전산학의 여러 용어들을 한자문화권의
여러 지역에서 어떻게 옮겨서 부르고 있는지를 비교한 대조표를 싣고 있습니다.

이 저작물은 [크리에이티브 커먼즈 저작자표시-동일조건변경허락 4.0 국제
라이선스][CC BY-SA 4.0]에 따라 이용할 수 있습니다.

[한자문화권]: https://ko.wikipedia.org/wiki/%ED%95%9C%EC%9E%90_%EB%AC%B8%ED%99%94%EA%B6%8C
[GitHub]: https://github.com/dahlia/cjk-compsci-terms
[Netlify]: https://app.netlify.com/sites/cjk-compsci-terms/deploys
[CC BY-SA 4.0]: https://creativecommons.org/licenses/by-sa/4.0/
[GitHub Sponsors]: https://github.com/sponsors/dahlia


<!-- TOC: 목차 -->


일러두기
--------

### 동계어 <span lang="en">(cognate)</span>

동계어는 한 쪽이 다른 한 쪽에서 파생했거나 공통된 어원을 공유하는 단어들을
뜻합니다.

예를 들어, 영어 <q lang="en">computer</q>와 한국어 <q>컴퓨터</q>, 일본어 <q
lang="ja">情報</q>(조우호우)와 한국어 <q>정보</q>(情報)는 동계어입니다.

동계어는 같은 색의 테두리로 표시됩니다.

### 번역차용 <span lang="fr">(calque)</span>

번역차용이란 원어를 어근 단위로 번역하여 단어를 차용하는 방식입니다.

예를 들어, 영어 <q lang="en">artificial intelligence</q>의 한국어 번역어
<q lang="ko">인공 지능</q>은 영어의 어근 <q lang="en">artificial</q> →
<q lang="ko">인공</q>과 <q lang="en">intelligence</q> →
<q lang="ko">지능</q>을 각각 번역하여 차용했습니다.

이와 같이 여러 언어 사이에서 대응되는 어근은 같은 색과 모양의 밑줄로
표시됩니다.

### 한자어

어근이 한자어일 경우, 한국식 한자 독음을 글자 위에 표시합니다.

예를 들어, 일본어 <q lang="ja">情報</q>(조우호우)는 한국어
<q>정보</q>(情報)와 동계어임을 알아보기 쉽도록, 글자 위에는 일본어 독음인
<q>조우호우</q>가 아닌 한국 한자음 <q>정보</q>를 표시합니다: <q
lang="ja"><ruby>情<rt lang="ko">정</rt>報<rt lang="ko">보</rt></ruby></q>.

### 음차

어근이 외국어의 음차일 경우, 원문 표기를 어근 위에 표시합니다.

예를 들어, 중국어 <q lang="zh">圖靈</q>(투링)은 영국 수학자 앨런
튜링(<span lang="en">Alan Turing</span>)의 음차이므로,
글자 위에는 한국 한자음 <q>도령</q>이 아니라 원어 <q lang="en">Turing</q>을
표시합니다: <q lang="zh"><ruby>圖靈<rt lang="en">Turing</rt></ruby></q>.

### 현지음 로마자 표기

단어의 현지음은 단어 아래 괄호 안에 로마자로 표기됩니다.
언어별 전사 방식은 다음과 같습니다.

한국어
:   [국립국어원 로마자 표기법]

일본어
:   [헵번식 로마자 표기법]

표준 중국어 (중국·대만)
:   [한어 병음]

광동어 (홍콩)
:   [월병]

*[월병]: 홍콩 언어학 학회 월어 병음 방안

[국립국어원 로마자 표기법]: https://kornorms.korean.go.kr/regltn/regltnView.do?regltn_code=0004
[헵번식 로마자 표기법]: https://ko.wikipedia.org/wiki/%ED%97%B5%EB%B2%88%EC%8B%9D_%EB%A1%9C%EB%A7%88%EC%9E%90_%ED%91%9C%EA%B8%B0%EB%B2%95
[한어 병음]: https://ko.wikipedia.org/wiki/%ED%95%9C%EC%96%B4_%EB%B3%91%EC%9D%8C
[월병]: https://ko.wikipedia.org/wiki/%ED%99%8D%EC%BD%A9_%EC%96%B8%EC%96%B4%ED%95%99_%ED%95%99%ED%9A%8C_%EC%9B%94%EC%96%B4_%EB%B3%91%EC%9D%8C_%EB%B0%A9%EC%95%88


기본 용어
---------

[표 보기](tables/basic.yaml)


단위
----

[표 보기](tables/units.yaml)


연구 분야
---------

[표 보기](tables/studies.yaml)


프로그래밍
----------

[표 보기](tables/programming.yaml)


도구
----

[표 보기](tables/tools.yaml)


계산 이론
---------

[표 보기](tables/theory-comp.yaml)


프로그래밍 패러다임
-------------------

[표 보기](tables/paradigms.yaml)


동시성 프로그래밍
----------------

[표 보기](tables/concurrency.yaml)


운영 체제
---------

[표 보기](tables/os.yaml)


자유·오픈 소스 소프트웨어
-------------------------

[표 보기](tables/foss.yaml)
