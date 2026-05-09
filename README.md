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
