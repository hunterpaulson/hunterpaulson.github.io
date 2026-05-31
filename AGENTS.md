# AGENTS.md

this file provides guidance to llms when working with code in this repository.

## styling constraint

this project uses **the monospace web** framework - a css grid system based on fixed-width character cells. **do not modify the monospace grid styles** unless explicitly requested. the layout depends on precise character alignment (1ch width, 1.20rem line-height).

this means that we really only have 2 headers. h1 takes up 2 lines, h2 takes up 1 line. because h2 is the same height as other text we often use all caps for h2s to make them stand out more.

## build system

```bash
npm install      # install local dev dependencies for a fresh worktree
npm run dev      # start vite dev server with auto-rebuild (http://localhost:5173)
npm run build    # run make to generate dist/
npm test         # run all tests (node auto-discovers nested test files)
make clean       # remove dist/ directory
```

`bun run dev` also works after dependencies are installed because it uses the local `node_modules/.bin/vite` binary from the `vite` dev dependency.

the build uses **pandoc** to convert `content/**/*.md` -> `dist/**/*.html` using `content/template.html`. vite watches for changes to content/, src/*.css, makefile, and blackhole*.c files, automatically runs `make`, and triggers browser reload.

## architecture

```
content/           # markdown source files (edit these)
  ├── index.md     # home page with embedded black hole simulation js
  ├── template.html # pandoc html template (header, footer, toc)
  └── blog/        # blog posts with yaml frontmatter

src/               # client js and css (copied to dist/src/)
  ├── index.css    # monospace web styles + custom theme
  ├── index.js     # grid alignment, theme toggle, debug mode
  ├── blackhole_simulation.js
  └── blog/
      └── {slug}/

tests/             # node tests, mirrored by blog slug when post-specific
  └── blog/

scripts/           # build and authoring helpers
  ├── update-blog-index.js
  ├── generate-sitemap.js
  └── blog/
      └── {slug}/

assets/            # pre-compiled assets (copied to dist/assets/)
  ├── blackhole_gpu.js    # webgpu renderer class
  ├── blackhole_gpu.wgsl  # wgsl compute shaders
  ├── blackhole_wasm.*    # emscripten wasm module
  ├── blackhole_frames.txt # pre-rendered ascii frames
  └── blog/
      └── {slug}/

dist/              # generated output - do not edit directly
```

## blog system

blog posts use yaml frontmatter with `title` and `date` fields. the script `scripts/update-blog-index.js` auto-generates the blog listing in `content/blog/index.md` between `<!-- BLOG-POSTS:START -->` and `<!-- BLOG-POSTS:END -->` markers.
