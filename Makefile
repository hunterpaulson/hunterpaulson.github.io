VERSION=$(shell jq -r .version package.json)
DATE=$(shell date +%F)

CONTENT_DIR=content
TEMPLATE=$(CONTENT_DIR)/template.html
CSS_FILES=/src/reset.css /src/index.css
CSS_ARGS=$(foreach css,$(CSS_FILES),--css $(css))

PAGES=$(wildcard $(CONTENT_DIR)/*.md)
SECTION_PAGES=$(wildcard $(CONTENT_DIR)/*/index.md)
POSTS=$(wildcard $(CONTENT_DIR)/blog/*/index.md)

HTML_PAGES=$(patsubst $(CONTENT_DIR)/%.md,%.html,$(PAGES))
SECTION_HTML=$(patsubst $(CONTENT_DIR)/%/index.md,%/index.html,$(SECTION_PAGES))
HTML_POSTS=$(patsubst $(CONTENT_DIR)/blog/%/index.md,blog/%/index.html,$(POSTS))

all: $(HTML_PAGES) $(SECTION_HTML) $(HTML_POSTS)

clean:
	rm -rf $(HTML_PAGES) $(SECTION_HTML) $(HTML_POSTS)

%.html: $(CONTENT_DIR)/%.md $(TEMPLATE) Makefile
	@mkdir -p $(dir $@)
	pandoc --toc -s $(CSS_ARGS) -Vversion=v$(VERSION) -Vdate=$(DATE) -i $< -o $@ --template=$(TEMPLATE)

%/index.html: $(CONTENT_DIR)/%/index.md $(TEMPLATE) Makefile
	@mkdir -p $(dir $@)
	@if [ "$(dir $@)" = "blog/" ]; then node scripts/update-blog-index.js; fi
	pandoc --toc -s $(CSS_ARGS) -Vversion=v$(VERSION) -Vdate=$(DATE) -i $< -o $@ --template=$(TEMPLATE)

blog/%/index.html: $(CONTENT_DIR)/blog/%/index.md $(TEMPLATE) Makefile
	@mkdir -p $(dir $@)
	pandoc -s $(CSS_ARGS) -i $< -o $@ --template=$(TEMPLATE)

.PHONY: all clean
