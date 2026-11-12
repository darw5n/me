# Me

Personal site — design + frontend. Since November 2026 it is "the table": an endless surface with
objects you can move around and tidy up.

**Live:** [darw.it](https://darw.it)

## Stack

Vanilla HTML + SCSS + TypeScript, compiled to plain ES modules. No bundler, no framework, no
dependencies: the compilers are fetched with `npx` when needed.

## Structure

```
index.html          ← the home, content in the HTML
src/tavola/         ← TypeScript sources (layout, camera, input, board…)
Script/tavola/      ← compiled JavaScript (committed, do not edit)
CSS/tavola.scss     ← SCSS entry; partials in CSS/tavola/
CSS/tavola.css      ← compiled CSS (committed, do not edit)
tests/              ← unit tests of the pure layout functions
```

## Development

```bash
sh scripts/build.sh              # TypeScript + SCSS + tests
python3 -m http.server 4142      # then open http://127.0.0.1:4142/
```

Decisions: `DECISIONS.md`.
