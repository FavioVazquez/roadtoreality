# Phase 1 (v2.0): Foundation & UX Polish — Context

**Gathered:** 2026-03-21
**Status:** Ready for planning
**Phase dir:** 06-v2-foundation-ux-polish

<domain>
## Phase Boundary

Deliver all cross-cutting infrastructure before simulation work begins:
- KaTeX self-hosted equation rendering on all stop pages
- Fuse.js client-side search with Cmd/Ctrl+K modal
- Global UX polish (line-height, contrast, keyboard nav, data-autoplay)
- Stub stop pages: rich canvas teaser animations, full grid presence
- Mobile improvements (sim viewport, touch targets, button layout)

Does NOT add new physics simulations — that is Phases 7–13.
Does retroactively add key equations to the 13 already-implemented stops.

</domain>

<decisions>
## Implementation Decisions

### Search Modal (Fuse.js)
- **Layout:** Centered compact overlay — 600px wide, ~40% viewport height, centered vertically. Matches Linear/GitHub aesthetic.
- **Result cards:** Title + scientist name + era color badge + year. Standard — rich without clutter.
- **Input behavior:** Debounced 150ms. Snappiest feel across devices.
- **Keyboard nav:** Arrow keys move focus through results; Enter navigates to the selected stop.
- **Trigger:** Cmd/Ctrl+K from any page (landing + all stop pages). Escape or click-outside closes.
- **Style:** Dark overlay matching site aesthetic (oklch palette). Era color accent on active result.

### Stub Stop Pages
- **Page content:** Era-styled header (era color rule + scientist name + stop title) + 2–3 sentence concept preview (from stops.json `description`) + rich canvas teaser animation (see below) + prev/next navigation to adjacent implemented stops + GitHub contribution link.
- **Teaser animation:** Each stub page gets a real, visually compelling canvas animation hinting at the concept — same quality bar as implemented stops. NOT a static placeholder. It should make visitors want to see the full stop.
- **Stub cards on landing:** Full opacity, clickable, navigate to stub landing page. Small "Coming Soon" pill badge in card corner (era-colored, muted). No more `pointer-events: none` or `opacity: 0.5`.
- **Landing page flow:** Unchanged — era tabs, full 50-stop grid, no "Start Here" re-routing. The grid is the journey (consistent with the howaiworks reference, but better). Stubs are full citizens of the grid.

### KaTeX Scope
- **Template:** All 50 stop pages get KaTeX CSS + deferred JS + auto-render init. Zero per-page configuration needed — no cost on pages without math.
- **Existing 13 implemented stops:** Retroactively add the key formula to the takeaway box of each stop. One `$$...$$` display equation per stop, rendered beautifully with KaTeX.
- **Equation placement:** Inside the takeaway box, displayed as a `$$...$$` block below the key insight text. Prominent, elegant, not buried in paragraphs.
- **Self-hosting:** `assets/katex/katex.min.css`, `katex.min.js`, `auto-render.min.js`, `fonts/` (all woff2). CSS in `<head>`, JS deferred.

### Mobile Sim Controls
- **Control position:** Stay below sim (current layout). Sim viewport expands to `min-height: 60vh` on ≤768px. No sticky control bar — avoids overlap complexity on short phones.
- **Button layout mobile:** Play + Reset side by side, each 50% width, `min-height: 48px`. Sliders stack full-width above buttons.
- **Slider touch targets:** Invisible touch zone enlarged to 44px height via padding on `<input type="range">`. No visual change.
- **data-autoplay:** Each stop's sim wrapper gets `data-autoplay="true"` or `"false"`. Auto-play for visually compelling passive sims (orbital, galaxy). Manual play for parameter-heavy sims (Coulomb, Carnot). stop-shell.js reads this attribute to decide whether to call `SimAPI.start()` on load vs. waiting for user click.

### Global UX Polish
- **Line-height:** `body { line-height: 1.9; }` in base.css (from 1.7).
- **Muted text contrast:** `--color-text-muted: oklch(0.55 0.02 90)` in base.css (from 0.50). Target ≥5:1 WCAG AA.
- **Keyboard navigation:** Left/right arrow keys in stop-shell.js → prev/next stop navigation. Only fires when no input is focused.
- **No layout changes** to landing page or implemented stop pages beyond the above values.

### Claude's Discretion
- Exact animation concept per stub page (within "rich canvas, conceptually hinting at the physics")
- Search modal open/close animation style (fade vs. scale-in)
- Era color accent treatment on search result hover state
- Skeleton screen shimmer color and timing

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `stop-shell.js`: Already handles prev/next rendering from `cfg.prev`/`cfg.next`. Arrow key listener adds here without conflict.
- `base.css`: Design tokens at `:root`. `--color-text-muted` and `line-height` are single-point changes.
- `simulation.css`: `.sim-container` already has `min-height: 360px` — mobile override adds here.
- `stops.json`: `description` field already populated for all 50 stops — use directly for stub page preview text.
- `window.SimAPI` contract: stub teaser animations must also expose `{ start, pause, reset, destroy }`.

### Established Patterns
- DEC-002 (no build pipeline): KaTeX and Fuse.js must be self-hosted static files. CDN links as fallback only.
- DEC-004 (SimAPI contract): Stub teaser sims follow the same IIFE + `window.SimAPI` pattern.
- IIFE pattern for all JS modules (no ES modules, no import/export).
- oklch color system throughout — search modal must use existing tokens, not new hex values.
- `assets/js/vendor/` for all third-party libraries.

### Integration Points
- search.js reads stops.json (already fetched by nav.js on landing) — share the fetched data via a module-level variable or re-fetch on stop pages.
- stop-shell.js needs one new block: (1) keydown listener for arrow nav, (2) read `data-autoplay` on `.sim-wrapper` to conditionally call `SimAPI.start()`.
- KaTeX auto-render fires on `DOMContentLoaded` — must run after sim.js has mounted (no conflict since sim.js doesn't write math).
- Stub pages: a new `stub-shell.js` or inline script handles the teaser animation lifecycle (same IntersectionObserver pattern as stop-shell.js).

</code_context>

<specifics>
## Specific Ideas

- Reference site: https://encyclopediaworld.github.io/howaiworks/ — the grid IS the journey. Match or exceed that quality of landing experience. Stub pages should feel like an invitation, not a dead end.
- Stub teaser animations: "make visitors want to see the full stop" — the animation is a preview of the physics concept, not a logo or spinner.
- Search modal era color: active result row highlighted with the stop's era accent color (subtle background tint, not a harsh border).

</specifics>

<deferred>
## Deferred Ideas

- Playwright PNG generation for OG images if SVG proves inconsistent on social platforms — Phase 7 (OG Images).
- Mobile sticky footer prev/next nav — deferred to evaluate after 60vh viewport fix ships; may not be needed.
- CSS View Transitions between stops — v3.0 candidate, not v2.0 scope.
- "Start Here" onboarding pathway — rejected; landing page flow stays as-is per user decision.

</deferred>

---
*Phase: 06-v2-foundation-ux-polish*
*Context gathered: 2026-03-21*
