# Phase 1: Foundation & Shell — Context

**Gathered:** 2026-03-20
**Status:** Complete — executed without prior discuss-phase (retroactively documented)

<domain>
## Phase Boundary

Build the entire shared infrastructure that every stop page will live inside:
CSS design system, shared JS modules, self-hosted fonts, vendor libraries,
the `stops.json` data manifest, and the landing page. One proof-of-concept stop
validates the whole stack end-to-end before content phases begin.

This phase delivers no content — only the skeleton every subsequent phase fills.

</domain>

<decisions>
## Implementation Decisions

### Output directory
- All site code lives in `Episodio4/` — not the project root.
- Rationale: `Episodio4/` is the episode-specific work folder; planning lives in `.planning/`.

### Build tooling
- No build pipeline. Pure static HTML/CSS/JS served directly from the filesystem.
- Reason: matches the howaiworks reference model; freely hostable on GitHub Pages with zero CI.

### CSS architecture
- Three files: `base.css` (tokens, reset, typography), `components.css` (nav, cards, breadcrumb), `simulation.css` (sim container, controls, force arrows).
- Color system: oklch throughout — perceptually uniform, easy era accent derivation.
- Dark luxury aesthetic: near-black `oklch(0.07–0.12)`, warm off-white text, gold accent.
- Era accent colors: 5 distinct oklch values, one per era, applied consistently.

### Typography
- Display font: Cormorant Garamond (self-hosted WOFF2, 4 weights).
- Body font: DM Sans (self-hosted WOFF2, 2 weights).
- No CDN dependencies — all fonts vendored locally.

### JavaScript modules
- `nav.js`: fetches `stops.json`, renders era sections + card grid on the landing page.
- `stop-shell.js`: per-stop breadcrumb, prev/next nav, IntersectionObserver sim lifecycle.
- `progress.js`: localStorage visited-stop tracking with `PhysicsProgress` API.
- All modules are plain IIFE — no ES modules, no bundler. Works in all modern browsers without build step.

### Simulation API contract
- Each `sim.js` exposes `window.SimAPI = { start, pause, reset, destroy }`.
- `stop-shell.js` calls `SimAPI.start()` / `SimAPI.pause()` via IntersectionObserver on `#sim-mount`.
- Sim starts paused; IntersectionObserver or Play button triggers `start()`.

### stops.json as single source of truth
- All 50 stops defined in `assets/data/stops.json`.
- Fields: id, slug, order, title, subtitle, era, year, yearLabel, scientist, isStub, description, prev, next, prevTitle, nextTitle, path.
- `nav.js` reads this at runtime to render card grids — no hardcoded HTML for stop listings.

### Vendor libraries
- `p5.min.js` v1.9.4 — for p5 instance-mode simulations.
- `matter.min.js` v0.19.0 — for rigid-body simulations.
- Both vendored in `assets/js/vendor/` — no CDN fallback.

### Landing page features
- Animated starfield background (canvas, respects `prefers-reduced-motion`).
- Sticky era tab bar (jumps to era sections).
- Era timeline visual (click-to-jump).
- Hero section with stop count stats.
- Progress bar reading from `PhysicsProgress`.

### Claude's Discretion
- Specific card layout within the grid (auto-fill minmax 240px).
- Starfield particle density and twinkle speed.
- Era color exact oklch values (chosen for dark-mode contrast).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None at phase start — this phase creates the entire foundation.

### Established Patterns
- IIFE modules (`(function(){ 'use strict'; ... }());`) for all JS files.
- `document.readyState === 'loading'` guard before `DOMContentLoaded` listener.
- Canvas sizing: `mount.getBoundingClientRect()` → set `canvas.width/height` → `resize()` on window resize.
- `window.addEventListener('resize', resize)` in every sim setup.

### Integration Points
- `index.html` → loads `progress.js` then `nav.js`.
- Each stop `index.html` → loads `progress.js`, `stop-shell.js`, then `sim.js`.
- `stop-shell.js` reads `#stop-config` JSON script tag for stop metadata.
- `nav.js` fetches `assets/data/stops.json` relative to `index.html`.

</code_context>

<specifics>
## Specific Ideas

- Dark luxury aesthetic explicitly requested — "more polished and aesthetic than howaiworks; dark, elegant, rich design."
- Reference site: https://encyclopediaworld.github.io/howaiworks/
- Output directory constraint: "all the results and code and everything that shouldn't be in .planning should be inside the Episodio4/ folder."

</specifics>

<deferred>
## Deferred Ideas

- KaTeX equation rendering — deferred to v2.0.
- Three.js 3D simulations — deferred to v2.0 (Era 3+ complexity).
- Open Graph images per stop — deferred to Phase 5 / v2.0.
- Dark/light mode toggle — deferred to v2.0.

</deferred>

---
*Phase: 01-foundation-shell*
*Context gathered: 2026-03-20 (retroactive documentation)*
