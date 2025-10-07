# hunter's personal website

## run locally

```
make clean
make
python -m http.server 8000
```

### start the dev server

```
npm install
npm run dev
```

The Vite dev server watches markdown, the shared template, CSS, and the `Makefile`. Any time you save changes it runs `make` to regenerate the HTML output, then triggers a browser reload at `http://localhost:5173/`.