all: public_html/index.html public_html/style.css public_html/script.js

clean:
	rm -rf .venv public_html

.venv: requirements.txt
	if [ ! -d .venv ]; then \
	  python3 -m venv .venv; \
	fi; \
	.venv/bin/pip install -U pip setuptools; \
	.venv/bin/pip install -U "$$(grep -i '^pyyaml\b' requirements.txt)"; \
	.venv/bin/pip install -U -r requirements.txt

public_html/style.css: style.css
	mkdir -p public_html
	cp style.css public_html/style.css

public_html/script.js: script.js
	mkdir -p public_html
	cp script.js public_html/script.js

public_html/index.html: .venv README.md studies.yaml build.py table.html
	mkdir -p public_html
	.venv/bin/python build.py en README.md > public_html/index.html
