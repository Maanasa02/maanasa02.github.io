# Where next — life decision ranking

An interactive table ranking places to move to, for a couple on H-1B/H-4 with a dog (Monet).

## Run it

```bash
cd /path/to/repo
python3 -m http.server 8000
# open http://localhost:8000/lifedecision/
```

No build step. Plain HTML, CSS and vanilla JS.

## Files

- `index.html` — page shell, weight sliders, filters, table, footnotes
- `style.css` — all styling; light and dark via CSS variables
- `app.js` — scoring, sorting, filtering, expandable detail rows
- `data.js` — **the only file to edit to change facts.** `window.PLACES` is an array of 75 places.

## How the score works

Five criteria, each normalised to 0–1, combined with the slider weights:

| Criterion | How it is scored |
|---|---|
| Monet | allowed 1.0 · restricted 0.55 · murky 0.4 · banned 0 |
| Visa comfort | research score 1–5, rescaled |
| Monthly cost | cost band inverted, so cheaper scores higher |
| Diversity | research score 1–5, rescaled |
| English | research score 1–5, rescaled |

Weights persist in `localStorage`.

## Data provenance

Researched 5 September 2026. 26 cities have in-depth dog-law and visa research behind them;
the other 49 are coarse screens only and are marked "screened" in the table.

Still to add: detailed monthly budgets, climate figures, and service-design job markets.
Cost and weather are coarse bands until then.

## Moving this to its own repo

The folder is self-contained. Copy `lifedecision/` into a new repo, or:

```bash
git subtree split --prefix=lifedecision -b lifedecision-only
```
