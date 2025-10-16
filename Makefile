VERSION=$(shell jq -r .version package.json)
DATE=$(shell date +%F)

CONTENT_DIR=content
TEMPLATE=$(CONTENT_DIR)/template.html
CSS_FILES=/src/reset.css /src/index.css
CSS_ARGS=$(foreach css,$(CSS_FILES),--css $(css))

HOME=$(wildcard $(CONTENT_DIR)/*.md)
SECTIONS=$(wildcard $(CONTENT_DIR)/*/index.md)
BLOGS=$(wildcard $(CONTENT_DIR)/blog/*/index.md)

HTML_HOME=$(patsubst $(CONTENT_DIR)/%.md,%.html,$(HOME))
HTML_SECTIONS=$(patsubst $(CONTENT_DIR)/%/index.md,%/index.html,$(SECTIONS))
HTML_BLOGS=$(patsubst $(CONTENT_DIR)/blog/%/index.md,blog/%/index.html,$(BLOGS))

BLOG_INDEX_MD=$(CONTENT_DIR)/blog/index.md

.PHONY: all clean assets

all: $(HTML_HOME) $(HTML_SECTIONS) $(HTML_BLOGS) assets

assets: assets/blackhole_frames.txt

assets/blackhole_frames.txt: blackhole.c Makefile
	@mkdir -p $(dir $@)
	cc -O3 blackhole.c -lm -o blackhole
	./blackhole --dump $@ --frames 180


# Re-generate blog listing when any blog post changes
$(BLOG_INDEX_MD): $(BLOGS) scripts/update-blog-index.js
	@node scripts/update-blog-index.js


clean:
	rm -rf $(HTML_HOME) $(HTML_SECTIONS) $(HTML_BLOGS)

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
