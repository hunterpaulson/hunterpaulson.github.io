# CLAUDE.md

this file provides guidance to llms when working with code in this repository.

## styling constraint

this project uses **the monospace web** framework - a css grid system based on fixed-width character cells. **do not modify the monospace grid styles** unless explicitly requested. the layout depends on precise character alignment (1ch width, 1.20rem line-height).

this means that we really only have 2 headers. h1 takes up 2 lines, h2 takes up 1 line. because h2 is the same height as other text we often use all caps for h2s to make them stand out more.

## build system

```bash
npm run dev      # start vite dev server with auto-rebuild (http://localhost:5173)
npm run build    # run make to generate dist/
make clean       # remove dist/ directory
```

the build uses **pandoc** to convert `content/**/*.md` → `dist/**/*.html` using `content/template.html`. vite watches for changes to content/, src/*.css, makefile, and blackhole*.c files, automatically runs `make`, and triggers browser reload.

## architecture

```
content/           # markdown source files (edit these)
  ├── index.md     # home page with embedded black hole simulation js
  ├── template.html # pandoc html template (header, footer, toc)
  └── blog/        # blog posts with yaml frontmatter

src/               # css and client js (copied to dist/src/)
  ├── index.css    # monospace web styles + custom theme
  └── index.js     # grid alignment, theme toggle, debug mode

assets/            # pre-compiled assets (copied to dist/assets/)
  ├── blackhole_gpu.js    # webgpu renderer class
  ├── blackhole_gpu.wgsl  # wgsl compute shaders
  ├── blackhole_wasm.*    # emscripten wasm module
  └── blackhole_frames.txt # pre-rendered ascii frames

dist/              # generated output - do not edit directly
```

### source files vs build output

**never edit files in `dist/`** - this directory is generated output and gitignored. all changes must be made to source files:

| to change... | edit this source file |
|--------------|----------------------|
| home page | `content/index.md` |
| blog posts | `content/blog/{slug}/index.md` |
| section pages | `content/{section}/index.md` |
| styles | `src/index.css` |
| client js | `src/index.js` |
| html template | `content/template.html` |
| gpu shader | `assets/blackhole_gpu.wgsl` |
| gpu renderer | `assets/blackhole_gpu.js` |

## black hole simulation

the home page (`content/index.md`) contains an inline `<script>` with the black hole renderer. it uses:

- **webgpu** (primary): real-time raytracing via compute shaders, instant parameter updates
- **wasm** (fallback): cpu-based rendering for browsers without webgpu, debounced rebuilds

key state variables for the renderer:
- `vsyncEnabled` - toggle between requestAnimationFrame (capped) and setTimeout(0) (uncapped)
- `isDragging` - temporarily enables vsync during slider interaction for responsiveness
- `gpuRunning` - controls the gpu animation loop
- `fpsHistory` - 5-second rolling window for min/max fps display

### black hole simulation assets

the black hole raytracer has two compile targets:

1. **wasm** (requires emscripten): `blackhole_wasm.c` + `blackhole_core.c` → `assets/blackhole_wasm.js`
2. **pre-rendered frames**: `blackhole.c` + `blackhole_core.c` → `assets/blackhole_frames.txt`

after modifying c files, run `make clean && npm run build` to recompile.

## blog system

blog posts use yaml frontmatter with `title` and `date` fields. the script `scripts/update-blog-index.js` auto-generates the blog listing in `content/blog/index.md` between `<!-- blog-posts:start -->` and `<!-- blog-posts:end -->` markers.
