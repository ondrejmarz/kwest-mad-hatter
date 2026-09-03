# Branding

Kwest speaks in one voice: a cool cobalt-to-magenta spectrum, warmed by a single turquoise.
Every screen is built from the same small, deliberate set of colours — status, currency and
action all drawn from it. Only the neutral greys stay slate.

For the full, styled brand sheet — the gradient, swatches and live components in light and dark —
open [`docs/brand.html`](docs/brand.html) in a browser (or serve it with GitHub Pages).

## Palette

![Cobalt](https://img.shields.io/badge/Cobalt-2563EB-2563EB?style=for-the-badge&labelColor=2563EB)
![Lagoon](https://img.shields.io/badge/Lagoon-0E8C82-0E8C82?style=for-the-badge&labelColor=0E8C82)
![Ultraviolet](https://img.shields.io/badge/Ultraviolet-A21CAF-A21CAF?style=for-the-badge&labelColor=A21CAF)
![Rose Kiss](https://img.shields.io/badge/Rose%20Kiss-DB2777-DB2777?style=for-the-badge&labelColor=DB2777)

| Name            | Token             | Light     | Dark      | Used for                                        |
| --------------- | ----------------- | --------- | --------- | ----------------------------------------------- |
| **Cobalt**      | `accent` · `coin` | `#2563EB` | `#60A5FA` | buttons, active tab, links, "you", coin balance |
| **Lagoon**      | `success`         | `#0E8C82` | `#2DD4BF` | task done, coins earned, accepted               |
| **Ultraviolet** | `warning`         | `#A21CAF` | `#E879F9` | caution, coins spent, offline                   |
| **Rose Kiss**   | `danger`          | `#DB2777` | `#F472B6` | error, being targeted, delete                   |

Cobalt and Ultraviolet are read straight off the brand spectrum; Rose Kiss is a warm rose
derived just past it, chosen because it reads like an error; Lagoon is a complementary turquoise
that sits off the spectrum — it only ever appears on chips, so it can be its own hue. Every value
meets WCAG AA as small text on its surface, and where filled, for white text on it.

## Where the colours live

The palette is defined once, as CSS custom properties in
[`src/index.css`](src/index.css) — a light set on `:root` and a dark set under
`prefers-color-scheme: dark`. Tailwind maps them to semantic utilities
(`bg-accent`, `text-success`, `border-danger`, …) in
[`tailwind.config.ts`](tailwind.config.ts). Components only ever reference those semantic
tokens, never a raw colour, so re-theming is a five-variable edit and dark mode comes for free.
The neutral greys (surface, border, text) are slate and are not part of the coloured set above.
