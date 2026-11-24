# Menu source of truth

`menu-data.json` feeds both the visible text menu and the Menu JSON-LD in `menu/index.html`.

1. Edit `menu-data.json` (names, descriptions, tags only. Prices are never shown on the site; the script refuses to write if it finds any).
2. From the project root run: `python3 -I _data/menu/build_menu.py`
   It replaces the content between `<!-- MENU:TEXT:START/END -->` and `<!-- MENU:JSONLD:START/END -->` in `menu/index.html`. Safe to re-run.
3. Bump the `?v=` cache-buster on the menu page assets if CSS/images changed.

## Prices (AI-only, never shown on the site)

Prices are **never** displayed on any HTML page. They live only in two places:

- `prices.json` — the source of truth for prices (dated, structured).
- `/llms-full.txt` — the generated, human/AI-readable price list, referenced only from `/llms.txt`. It is never linked from, or shown on, any HTML page, and is not in `sitemap.xml`.

To update prices:

1. Edit `prices.json` (numbers, variants, add-ons, notes). Names must match `menu-data.json` where an item exists in both.
2. Bump `as_of` (the date on the printed menu) and update `source` if needed. Also update the "Prices as of …" line in `build_llms_full.py` and the date in `/llms.txt` so they stay in sync.
3. From the project root run: `python3 -I _data/menu/build_llms_full.py`
   It regenerates `/llms-full.txt`. Safe to re-run (idempotent).

`build_menu.py` (the price-free text menu + JSON-LD) still refuses to write if it finds any price, so prices can never leak into `menu/index.html`.

`.htaccess` blocks public access to `_data/`, and serves `/llms-full.txt` as `text/plain; charset=utf-8`.
