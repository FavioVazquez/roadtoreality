# Phase 2: Stops Data & Navigation — Context

**Gathered:** 2026-03-20
**Status:** Complete — executed without prior discuss-phase (retroactively documented)

<domain>
## Phase Boundary

Define all 50 stops in `stops.json`, generate the full stop HTML pages (12 with live
simulations, 38 as shells with placeholder slots), and verify the complete navigation
chain (prev/next links, breadcrumbs, era card grid) works end-to-end across every stop.

This phase delivers the site skeleton in its entirety — every stop navigable, all metadata
correct, all shells rendered by the shared Phase 1 infrastructure.

</domain>

<decisions>
## Implementation Decisions

### stops.json schema
Fields per stop: `id` (slug string, also directory name), `slug`, `order` (1-50),
`title`, `subtitle`, `era` (one of 5 values), `year` (integer), `yearLabel` (display string),
`scientist`, `isStub` (bool), `description` (2-3 sentences), `path`, `prev` (id or null),
`prevTitle` (string or null), `next` (id or null), `nextTitle` (string or null).
Rationale: `prev`/`next` as id strings (not order integers) lets `stop-shell.js` construct
relative URLs without looking up the full stops list.

### Stop directory naming
Format: `{order:03d}-{slug}` — e.g., `001-thales-natural-causes`.
Rationale: alphabetical sort == chronological order; human-readable in filesystem.

### Full simulations vs stubs
12 stops receive full `index.html` + `sim.js` (Eras 1-2, stops 001-013 excluding 002).
Stop 002 (Pythagoras) is stub — content complex, low aha-moment for a simulation.
All remaining stops 014-050 are stubs with placeholder simulation slot.

### Stub generation strategy
Python script `gen_stubs.py` generates HTML from a template for all stops where
`index.html` does not already exist. Script is deleted after use.

### Stop page HTML structure (required elements)
Every stop page must have:
- `<script id="stop-config" type="application/json">` with stop metadata
- `.site-header` with logo link
- `#stop-counter` span
- `.stop-page.container[data-era]` main element
- `#stop-breadcrumb` nav
- `.stop-header` with era label, h1, subtitle, meta
- `.stop-intro.content-column` for narrative text
- `.sim-wrapper.content-column` > `.sim-container#sim-mount` > noscript fallback
- `.sim-controls` with sliders + `#sim-play-btn` + `#sim-reset-btn`
- `.sim-caption` with `.sim-caption__dot`
- `.stop-body.content-column` for extended narrative
- `.takeaway-box.content-column` with 3 bullets
- `.stop-bridge.content-column` with forward-linking sentence
- `#stop-nav` nav for prev/next
- `.site-footer`
- Script load order: `progress.js` → `stop-shell.js` → `sim.js`

### Stub placeholder content
Stub pages show `<div class="sim-placeholder">` with icon, text, and stop number.
No `sim.js` loaded on stub pages.

### Navigation chain verification
Every stop's `prev` → `next` chain must form a single unbroken sequence 1-50.
Verified by inspecting stops.json: `stops[i].next === stops[i+1].id` for all i.

### Claude's Discretion
- Exact wording of placeholder text on stub pages.
- Icon choice for stub placeholder (used ⚗️).
- Order of stops within each era (chronological by year).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets (from Phase 1)
- `stop-shell.js`: reads `#stop-config`, wires all controls — stop pages must follow the HTML contract
- `progress.js`: `PhysicsProgress.markVisited(id)` called by stop-shell on every stop visit
- `nav.js`: reads `stops.json` and renders card grid — `isStub: true` stops get `.stop-card--stub`

### Established Patterns
- Stop page script load order: `progress.js` → `stop-shell.js` → `sim.js`
- `#stop-config` JSON script tag is the stop metadata source for stop-shell.js
- Canvas setup pattern: mount element → `getBoundingClientRect()` → set canvas dimensions

### Integration Points
- `nav.js` constructs card href as `stops/{id}/index.html` — directory name must match `id` field
- `stop-shell.js` constructs prev/next links as `../{prev}/index.html` relative to stop directory
- `#sim-mount` is the IntersectionObserver target — must be present on every stop page

</code_context>

<specifics>
## Specific Ideas

- All 50 stops in stops.json with full metadata — even stubs must have rich descriptions
  (used later for Open Graph and search)
- Physics content accuracy matters: dates, scientist names, and descriptions verified against
  standard physics history references

</specifics>

<deferred>
## Deferred Ideas

- Client-side search over stops.json — deferred to v2.0 (Fuse.js or Pagefind)
- Stop thumbnail images (assets/img/thumbnails/) — deferred; CSS-only styling used for now
- Era banner images (assets/img/era-banners/) — deferred
- Open Graph meta tags per stop — deferred to Phase 5 / v2.0

</deferred>

---
*Phase: 02-stops-data-navigation*
*Context gathered: 2026-03-20 (retroactive documentation)*
