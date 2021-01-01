OBJ = public_html
VENV = .venv

LANGS = $(patsubst %.md,%,$(patsubst README.md,en.md,$(wildcard *.md)))
TABLES = $(wildcard *.yaml)
TEMPLATES = $(wildcard *.html)
OBJ_FILES = \
	$(patsubst public_html/en/%,public_html/%,\
		$(patsubst %,public_html/%/index.html,$(LANGS))) \
	$(patsubst %,public_html/%,$(wildcard *.css)) \
	$(patsubst %,public_html/%,$(wildcard *.js))

all: $(OBJ_FILES)

clean:
	rm -rf $(OBJ_FILES) $(VENV) $(OBJ)

$(VENV)/: requirements.txt
	if [ ! -d $(VENV) ]; then \
	  python3 -m venv $(VENV); \
	fi; \
	$(VENV)/bin/pip install -U pip setuptools; \
	$(VENV)/bin/pip install -U "$$(grep -i '^pyyaml\b' requirements.txt)"; \
	$(VENV)/bin/pip install -U -r requirements.txt

$(OBJ)/:
	mkdir -p $(OBJ)

$(OBJ)/%.css: %.css | $(OBJ)/
	cp $< $@

$(OBJ)/%.js: %.js | $(OBJ)/
	cp $< $@

$(OBJ)/index.html: README.md $(VENV)/ build.py $(TABLES) $(TEMPLATES) | $(OBJ)/
	$(VENV)/bin/python build.py en $< > $@

$(OBJ)/%/index.html: %.md $(VENV)/ build.py $(TABLES) $(TEMPLATES) | $(OBJ)/
	mkdir -p $(dir $@)
	$(VENV)/bin/python build.py \
		--base-href=../ \
		$(subst -,_,$(basename $(notdir $<))) \
		$< \
		> $@
