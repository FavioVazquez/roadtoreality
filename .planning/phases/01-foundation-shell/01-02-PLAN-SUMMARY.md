# Plan 01-02 Summary — Shared JS Modules & Landing Page

**Completed:** 2026-03-20

## What was built

Three shared JavaScript IIFE modules and the landing page. `progress.js` exposes `window.PhysicsProgress` with localStorage-backed visited-stop tracking (try/catch guarded). `stop-shell.js` reads the `#stop-config` JSON script tag on each stop page, renders breadcrumb and prev/next nav via DOM manipulation, registers an IntersectionObserver on `#sim-mount` to call `SimAPI.start/pause`, and wires the play/reset buttons. `nav.js` fetches `assets/data/stops.json`, groups stops by era, renders the full card grid and era timeline on the landing page, applies visited badges from `PhysicsProgress`, and shows a helpful error if `fetch()` fails (file:// protocol). `index.html` is the full landing page: animated starfield background canvas (respects `prefers-reduced-motion`), hero section, sticky era tabs with scroll-spy, era timeline visual, card grid mount point, footer.

## Key files

- `Episodio4/assets/js/progress.js`: `window.PhysicsProgress` API
- `Episodio4/assets/js/stop-shell.js`: per-stop DOM wiring and sim lifecycle
- `Episodio4/assets/js/nav.js`: landing page card grid renderer
- `Episodio4/index.html`: full landing page

## Decisions made

- `stops.json` fetched at runtime by `nav.js` — not inlined into HTML
- Breadcrumb and prev/next nav rendered via JS (not hardcoded) so stop metadata is the single source of truth in `stops.json`
- Starfield uses `requestAnimationFrame` loop with `prefers-reduced-motion` check — disables entirely if set
- Scroll-spy uses `setTimeout(300)` after nav renders to init `IntersectionObserver` on era sections

## Notes for downstream

- Every stop page must have a `<script id="stop-config" type="application/json">` tag with the stop's metadata for `stop-shell.js` to read
- Every stop page must have `#sim-mount`, `#stop-breadcrumb`, `#stop-nav`, `#sim-play-btn`, `#sim-reset-btn`, `.sim-caption__dot` in its HTML
- `SimAPI` must be set on `window` by `sim.js` before `stop-shell.js` binds the IntersectionObserver (load order: `progress.js` → `stop-shell.js` → `sim.js`)
- `nav.js` links stub stops to `#` and adds `pointer-events: none` via `.stop-card--stub` — they are not navigable
