# Me

Personal portfolio site — design + frontend.

**Live:** [darw.it](https://darw.it)

## Stack

Vanilla HTML + SCSS + JavaScript. No bundler, no framework. Dependencies via CDN.

| | |
|---|---|
| Locomotive Scroll 3.5.4 | Virtual scroll + scroll-based animations |
| GSAP 3 + ScrollTrigger | Animations & horizontal scroll section |
| Splitting.js | Character-level text animations |
| Bootstrap 5 | Grid only |
| FontAwesome 6 | Icons |

## Structure

```
index.html          ← single page
CSS/
  main.scss         ← source (edit this)
  main.css          ← compiled output
  _variables.scss
  _common.scss
  _typo.scss
  _light-theme.scss
  _dark-theme.scss
Script/
  preloader.js
  theme.js
  Accordion.js
  email.js
Font/
  Matahari/
  Nognathy/
```

## Development

SCSS is compiled manually — no build step needed in production.

```bash
sass CSS/main.scss CSS/main.css
```
