# Plan 06-03 Summary

**Completed:** 2026-03-21
**Phase:** 06 — Foundation & UX Polish

## What was built

Implemented a Cmd/Ctrl+K fuzzy search modal powered by self-hosted Fuse.js 7.1.0. The modal indexes all 50 stops by title, scientist, subtitle, description, and era, with era-colored result cards and keyboard navigation (arrow keys + Enter). It was wired to every page on the site — the landing page and all 50 stop pages. The modal open/closed state is managed via the HTML `open` attribute on `#search-modal`, establishing the shared contract for Plan 06-04's stop-shell.js arrow-key guard.

## Key files

- `Episodio4/assets/js/vendor/fuse.min.js`: Fuse.js 7.1.0 (26 KB, self-hosted from jsDelivr)
- `Episodio4/assets/css/search.css`: Modal styles — overlay, panel, input row, result cards with era colors, footer hints
- `Episodio4/assets/js/search.js`: IIFE search module — fetches stops.json via STOPS_DATA_PATH, builds Fuse index, handles keyboard events, manages open attribute
- `Episodio4/index.html`: Added search.css, modal HTML, STOPS_DATA_PATH = 'assets/data/stops.json'
- `Episodio4/stops/*/index.html`: All 50 stop pages updated with search.css, modal HTML, STOPS_DATA_PATH = '../../assets/data/stops.json'

## Decisions made

- Used `<div role="dialog">` instead of native `<dialog>` element to avoid inconsistent browser behavior with the `open` attribute
- Placed search scripts (STOPS_DATA_PATH + fuse.min.js + search.js) before progress.js on stop pages, keeping sim.js and KaTeX scripts after stop-shell.js as before
- Used Python script to batch-edit all 50 stop pages atomically to avoid repetition errors
- The overlay uses both `#search-modal[open] + .search-overlay` CSS sibling selector and `.is-open` class fallback for dual open-state tracking

## Deviations from plan

- The plan shows the `⌕` icon as a Unicode character in HTML; the Python batch script encoded it as `&#x2315;` entity in the raw HTML string to avoid encoding issues. The rendered output is identical.
- stops.json structure: the `stops` array is at `data.stops` where `data` is the parsed JSON root object (which has key `"stops"` at the top level). The `_initFuse(data)` function uses `data.stops` correctly.

## Notes for downstream

- Plan 06-04 (stop-shell.js arrow-key guard) should check `document.getElementById('search-modal').hasAttribute('open')` before responding to ArrowLeft/ArrowRight — this contract is in place.
- All 13 KaTeX-equipped stop pages (001, 003-013) retain their KaTeX scripts in the correct order after the search additions.
- The `window.STOPS_DATA_PATH` variable must be defined before `search.js` loads on every page — this is enforced by the inline `<script>` tag order.
