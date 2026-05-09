# hunter's personal website

[hunterpaulson.dev](https://hunterpaulson.dev)

### start the dev server

```
bun install
bun run dev
```

The Vite dev server watches markdown, the shared template, CSS, and the `Makefile`. Any time you save changes it runs `make` to regenerate the HTML output, then triggers a browser reload at `http://localhost:5173/`.

### build and test

```bash
bun run build
bun run test
```

### shared markdown includes

Large shared HTML blocks can live under `content/includes/` and be reused from Markdown with:

```md
{{ include "content/includes/animations/wikipedia-bfs.html" }}
```

The build expands those include markers before running `pandoc`, so the source stays short while the generated HTML is unchanged.

### export art media

List the built-in presets:

```bash
bun run export:media -- list
```

Export all public GIF downloads for the art page:

```bash
bun run export:art
```

Export a single GIF or screenshot using the checked-in presets:

```bash
bun run export:media -- home-blackhole-gif
bun run export:media -- just-another-abstraction-gif --build
bun run export:media -- wikipedia-bfs-gif
```

The exporter uses a local Chromium-based browser already installed on the machine, waits for the page animation to report ready when it exposes a media hook, and writes output into the preset's `assets/.../social/` path unless you override it with `--output`. GIF presets use PNG frame capture plus a JS GIF encoder. To add a future animation, add a GIF preset in `scripts/media/presets.mjs`; if the page has multiple exportable animations or needs deterministic frames, register a named media export hook from the animation code.
