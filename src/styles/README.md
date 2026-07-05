# CSS organization

`src/index.css` is the public entrypoint linked by generated pages. Keep it small:
it should mostly import the modules in this directory.

Use these buckets when adding styles:

- `tokens.css`: global custom properties and theme variables.
- `base.css`: raw element styles such as body text, links, tables, code, lists,
  forms, figures, and blockquotes.
- `layout.css`: site shell styles such as the header, post title row, and footer.
- `utilities.css`: reusable utility systems such as debug grid, tree, and grid helpers.
- `components/`: named reusable visual systems. Prefer adding a component file
  here when a selector family has a clear prefix, such as `.llm-context-*`.

Prefer splitting by concept/component, not by CSS property type. For example,
`components/llm-context.css` is easier to maintain than separate files for
colors, borders, and spacing.

This project uses a fixed-character monospace layout. Be careful when changing
rules that depend on `1ch`, `--line-height`, or `round(..., 1ch)`.
