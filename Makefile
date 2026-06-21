VERSION=$(shell jq -r .version package.json)
DATE=$(shell date +%F)

DIST_DIR=dist
CONTENT_DIR=content
TEMPLATE=$(CONTENT_DIR)/template.html
CSS_FILES=/src/reset.css /src/index.css
CSS_ARGS=$(foreach css,$(CSS_FILES),--css $(css))
INCLUDES=$(shell find $(CONTENT_DIR)/includes -type f 2>/dev/null)
EXPAND_INCLUDES=scripts/expand-markdown-includes.mjs
PREPARE_MARKDOWN=scripts/prepare-markdown-page.mjs
PAGE_METADATA=scripts/page-metadata.mjs

HOME=$(wildcard $(CONTENT_DIR)/*.md)
SECTIONS=$(wildcard $(CONTENT_DIR)/*/index.md)
BLOGS=$(wildcard $(CONTENT_DIR)/blog/*/index.md)
INDEX_PAGES=$(shell find $(CONTENT_DIR) -path "$(CONTENT_DIR)/includes" -prune -o -mindepth 2 -name index.md -print)
NESTED_INDEX_PAGES=$(filter-out $(SECTIONS) $(BLOGS),$(INDEX_PAGES))

HTML_HOME=$(patsubst $(CONTENT_DIR)/%.md,$(DIST_DIR)/%.html,$(HOME))
HTML_SECTIONS=$(patsubst $(CONTENT_DIR)/%/index.md,$(DIST_DIR)/%/index.html,$(SECTIONS))
HTML_BLOGS=$(patsubst $(CONTENT_DIR)/blog/%/index.md,$(DIST_DIR)/blog/%/index.html,$(BLOGS))
HTML_NESTED_INDEX_PAGES=$(patsubst $(CONTENT_DIR)/%/index.md,$(DIST_DIR)/%/index.html,$(NESTED_INDEX_PAGES))

BLOG_INDEX_MD=$(CONTENT_DIR)/blog/index.md
SITEMAP_FILE=$(DIST_DIR)/sitemap.xml
ROBOTS_FILE=$(DIST_DIR)/robots.txt
ROBOT_FRAME=$(wildcard assets/blackhole_frame_robot.txt)

.PHONY: all clean assets copy-assets copy-src

all: $(HTML_HOME) $(HTML_SECTIONS) $(HTML_BLOGS) $(HTML_NESTED_INDEX_PAGES) assets copy-assets copy-src $(SITEMAP_FILE) $(ROBOTS_FILE)

assets: assets/blackhole_frames.txt assets/blackhole_wasm.js

assets/blackhole_frames.txt: blackhole.c blackhole_core.c blackhole_core.h Makefile
	@mkdir -p $(dir $@)
	cc -O3 blackhole.c blackhole_core.c -lm -o blackhole
	./blackhole --dump $@ --frames 180

assets/blackhole_wasm.js: blackhole_wasm.c blackhole_core.c blackhole_core.h Makefile
	@mkdir -p $(dir $@)
	emcc blackhole_wasm.c blackhole_core.c -O3 \
		-s MODULARIZE=1 \
		-s EXPORT_ES6=1 \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s ENVIRONMENT=web \
		-s EXPORTED_FUNCTIONS='["_bh_wasm_init","_bh_wasm_destroy","_bh_wasm_width","_bh_wasm_height","_bh_wasm_frame_len","_bh_wasm_generate_frame"]' \
		-s EXPORTED_RUNTIME_METHODS='["cwrap","UTF8ToString"]' \
		-o $@

copy-assets: assets
	@mkdir -p $(DIST_DIR)/assets
	@cp -r assets/* $(DIST_DIR)/assets/

copy-src:
	@mkdir -p $(DIST_DIR)/src
	@cp -r src/* $(DIST_DIR)/src/
	@cp node_modules/prismjs/prism.js $(DIST_DIR)/src/prism.js
	@cp node_modules/prismjs/components/prism-clike.min.js $(DIST_DIR)/src/prism-clike.min.js
	@cp node_modules/prismjs/components/prism-python.min.js $(DIST_DIR)/src/prism-python.min.js
	@cp node_modules/prismjs/components/prism-javascript.min.js $(DIST_DIR)/src/prism-javascript.min.js
	@cp node_modules/prismjs/components/prism-typescript.min.js $(DIST_DIR)/src/prism-typescript.min.js
	@cp node_modules/prismjs/components/prism-markup.min.js $(DIST_DIR)/src/prism-markup.min.js


# Re-generate blog listing when any blog post changes
$(BLOG_INDEX_MD): $(BLOGS) scripts/update-blog-index.js
	@bun scripts/update-blog-index.js


# Build sitemap and robots metadata
$(SITEMAP_FILE) $(ROBOTS_FILE): $(HOME) $(SECTIONS) $(BLOGS) $(NESTED_INDEX_PAGES) scripts/generate-sitemap.js $(ROBOT_FRAME) Makefile
	@mkdir -p $(DIST_DIR)
	@bun scripts/generate-sitemap.js


clean:
	rm -rf $(DIST_DIR)

# Home page (content/index.md -> dist/index.html)
$(HTML_HOME): $(DIST_DIR)/%.html: $(CONTENT_DIR)/%.md $(TEMPLATE) $(EXPAND_INCLUDES) $(PREPARE_MARKDOWN) $(PAGE_METADATA) $(INCLUDES) Makefile
	@mkdir -p $(dir $@)
	@prepared_md="$(DIST_DIR)/.markdown/$*.md"; mkdir -p "$$(dirname "$$prepared_md")"; bun $(PREPARE_MARKDOWN) "$<" "$$prepared_md"; pandoc --wrap=none --toc -s $(CSS_ARGS) -Vversion=v$(VERSION) -i "$$prepared_md" -o "$@" --template=$(TEMPLATE) --no-highlight

# Section index pages (blog/index.md, projects/index.md -> dist/*/index.html)
$(HTML_SECTIONS): $(DIST_DIR)/%/index.html: $(CONTENT_DIR)/%/index.md $(TEMPLATE) $(EXPAND_INCLUDES) $(PREPARE_MARKDOWN) $(PAGE_METADATA) $(INCLUDES) Makefile
	@mkdir -p $(dir $@)
	@if [ "$(dir $@)" = "$(DIST_DIR)/blog/" ]; then bun scripts/update-blog-index.js; fi
	@prepared_md="$(DIST_DIR)/.markdown/$*.md"; mkdir -p "$$(dirname "$$prepared_md")"; bun $(PREPARE_MARKDOWN) "$<" "$$prepared_md"; pandoc --wrap=none --toc -s $(CSS_ARGS) -Vversion=v$(VERSION) -i "$$prepared_md" -o "$@" --template=$(TEMPLATE) --no-highlight

# Blog posts - use date from frontmatter
$(HTML_BLOGS): $(DIST_DIR)/blog/%/index.html: $(CONTENT_DIR)/blog/%/index.md $(TEMPLATE) $(EXPAND_INCLUDES) $(PREPARE_MARKDOWN) $(PAGE_METADATA) $(INCLUDES) Makefile
	@mkdir -p $(dir $@)
	@prepared_md="$(DIST_DIR)/.markdown/blog/$*.md"; mkdir -p "$$(dirname "$$prepared_md")"; bun $(PREPARE_MARKDOWN) "$<" "$$prepared_md"; pandoc --wrap=none -s $(CSS_ARGS) -i "$$prepared_md" -o "$@" --template=$(TEMPLATE) --no-highlight

# Nested section pages (agent-harness/context-window/index.md -> dist/agent-harness/context-window/index.html)
$(HTML_NESTED_INDEX_PAGES): $(DIST_DIR)/%/index.html: $(CONTENT_DIR)/%/index.md $(TEMPLATE) $(EXPAND_INCLUDES) $(PREPARE_MARKDOWN) $(PAGE_METADATA) $(INCLUDES) Makefile
	@mkdir -p $(dir $@)
	@prepared_md="$(DIST_DIR)/.markdown/$*.md"; mkdir -p "$$(dirname "$$prepared_md")"; bun $(PREPARE_MARKDOWN) "$<" "$$prepared_md"; pandoc --wrap=none --toc -s $(CSS_ARGS) -Vversion=v$(VERSION) -i "$$prepared_md" -o "$@" --template=$(TEMPLATE) --no-highlight
