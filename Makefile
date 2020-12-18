.venv: requirements.txt
	if [ ! -d .venv ]; then \
	  python3 -m venv .venv; \
	fi; \
	.venv/bin/pip install -U pip setuptools; \
	.venv/bin/pip install -U -r requirements.txt

public_html/style.css: style.css
	mkdir -p public_html
	cp style.css public_html/style.css

public_html/studies.html: public_html/style.css .venv studies.yaml build.py
	{ \
		echo '<!DOCTYPE html><html><head>'; \
		echo '<meta charset="utf-8">'; \
		echo '<link rel="preconnect" href="https://fonts.gstatic.com">'; \
		echo '<link rel="stylesheet" type="text/css" href="style.css">'; \
		echo '</head><body>'; \
		.venv/bin/python build.py studies.yaml; \
		echo '</body></html>'; \
	} > public_html/studies.html

all: public_html/studies.html
