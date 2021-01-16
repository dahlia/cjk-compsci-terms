OBJ = public_html
VENV = .venv
PYTHON_INTERPRETER = python3

ifeq ($(VENV),.)
PYTHON = $(PYTHON_INTERPRETER)
else
PYTHON = $(VENV)/bin/python
endif
LANGS = $(patsubst %.md,%,$(patsubst README.md,en.md,$(wildcard *.md)))
LANG_HREFS = $(patsubst %:en/,%:./,$(foreach f,$(LANGS),$(f):$(f)/))
TABLES = $(wildcard *.yaml)
TEMPLATES = $(wildcard *.html)
OBJ_FILES = \
	$(patsubst $(OBJ)/en/%,$(OBJ)/%,$(LANGS:%=$(OBJ)/%/index.html)) \
	$(patsubst %,$(OBJ)/%,$(wildcard *.css)) \
	$(patsubst %,$(OBJ)/%,$(wildcard *.js)) \
	$(OBJ)/.nojekyll

all: $(OBJ_FILES)

clean:
	rm -rf $(OBJ_FILES) $(OBJ)
	[ "$(VENV)" = "." ] || rm -rf $(VENV)

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
		$(VENV)/bin/pip install -U setuptools; \
		$(VENV)/bin/pip install -U -r requirements.txt; \
	fi

$(OBJ)/:
	mkdir -p $(OBJ)

$(OBJ)/.nojekyll:
	touch $(OBJ)/.nojekyll

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
