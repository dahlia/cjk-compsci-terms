OBJ = public_html
VENV = .venv
PYTHON_INTERPRETER = python3
YAJSV = bin/yajsv
YAJSV_VERSION = 1.4.0
YAJSV_DOWNLOAD_URL = https://github.com/neilpa/yajsv/releases/download/v$(YAJSV_VERSION)

ifeq ($(VENV),.)
PYTHON = $(PYTHON_INTERPRETER)
else
PYTHON = $(VENV)/bin/python
endif
LANGS = $(patsubst %.md,%,$(patsubst README.md,en.md, \
	$(filter-out CONTRIBUTING.md,$(wildcard *.md))))
LANG_HREFS = $(patsubst %:en/,%:./,$(foreach f,$(LANGS),$(f):$(f)/))
TABLES = $(wildcard tables/*.yaml)
TEMPLATES = $(wildcard templates/*.html)
OBJ_FILES = \
	$(patsubst %,$(OBJ)/%,$(wildcard *.css)) \
	$(patsubst %,$(OBJ)/%,$(wildcard *.js)) \
	$(patsubst %,$(OBJ)/%,$(wildcard *.svg)) \
	$(patsubst $(OBJ)/en/%,$(OBJ)/%,$(LANGS:%=$(OBJ)/%/index.html)) \
	$(OBJ)/.nojekyll

all: lint $(OBJ_FILES)

clean:
	rm -rf $(OBJ_FILES) $(OBJ) $(YAJSV)
	rmdir $(dir $(YAJSV)) || true
	[ "$(VENV)" = "." ] || rm -rf $(VENV)

lint: yaml-schema mypy yamllint

yaml-schema: $(YAJSV) table.schema.yaml $(TABLES)
	$(YAJSV) -s table.schema.yaml $(TABLES)

yamllint: $(VENV)/ $(TABLES) .yamllint
	$(PYTHON) -m yamllint -c .yamllint --strict $(TABLES)

mypy: $(VENV)/ build.py
	$(PYTHON) -m mypy build.py

$(VENV)/: requirements.txt
	if [ "$(VENV)" != "." ]; then \
		if [ ! -d $(VENV) ]; then \
			if ! $(PYTHON_INTERPRETER) -m venv $(VENV); then \
				virtualenv -p $(PYTHON_INTERPRETER) venv; \
				curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py; \
				$(VENV)/bin/python get-pip.py; \
				rm get-pip.py; \
			fi; \
		fi; \
		$(VENV)/bin/pip install -U setuptools wheel; \
		$(VENV)/bin/pip install -U -r requirements.txt; \
	fi

$(YAJSV):
	mkdir -p $(dir $(YAJSV))
	{ \
		echo "#!$$(which sh)"; \
		echo "echo 'yajsv was failed to be installed;' > /dev/stderr"; \
		echo "echo 'lint was skipped...' > /dev/stderr"; \
	} > $(YAJSV)
	GOOS="$$(uname -s | tr '[:upper:]' '[:lower:]')"; \
	case "$$(uname -m)" in \
		x86_64) \
			GOARCH=amd64; \
			;; \
		*) \
			exit 0; \
			;; \
	esac; \
	download_url=$(YAJSV_DOWNLOAD_URL)/yajsv.$$GOOS.$$GOARCH; \
	if command -v curl > /dev/null; then \
		curl -L -o $(YAJSV) $$download_url || exit 0; \
	else \
		wget -O $(YAJSV) $$download_url || exit 0; \
	fi
	chmod +x $(YAJSV)

$(OBJ)/:
	mkdir -p $(OBJ)

$(OBJ)/.nojekyll:
	touch $(OBJ)/.nojekyll

$(OBJ)/%.svg: %.svg | $(OBJ)/
	cp $< $@

$(OBJ)/%.css: %.css | $(OBJ)/
	cp $< $@

$(OBJ)/%.js: %.js | $(OBJ)/
	cp $< $@

$(OBJ)/index.html: README.md $(VENV)/ build.py $(TABLES) $(TEMPLATES) | $(OBJ)/
	$(PYTHON) build.py \
		$(if $(URL_BASE),--base-href=$(URL_BASE),) \
		$(LANG_HREFS:%=--lang=%$(if $(URL_BASE),,index.html)) en $< > $@

$(OBJ)/%/index.html: %.md $(VENV)/ build.py $(TABLES) $(TEMPLATES) | $(OBJ)/
	mkdir -p $(dir $@)
	$(PYTHON) build.py \
		--base-href=$(or $(URL_BASE),../) \
		$(LANG_HREFS:%=--lang=%$(if $(URL_BASE),,index.html)) \
		$(basename $(notdir $<)) \
		$< \
		> $@
