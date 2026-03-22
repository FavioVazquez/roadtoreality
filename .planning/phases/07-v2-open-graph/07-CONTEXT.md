# Phase 07: Open Graph Images — Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate a 1200×630 SVG social sharing image for every stop (all 50, including stubs) and inject full OG + Twitter Card meta tags into every stop's `index.html`.

Does NOT implement new simulations. Does NOT change site visuals or navigation.

</domain>

<decisions>
## Implementation Decisions

### SVG Visual Design
- Use the established era OKLCH colors as the primary design element (era-colored background/accent)
- Each SVG includes: era color, stop title, scientist name, year badge, site branding ("How Physics Works")
- Design follows existing dark luxury aesthetic — dark background with era-colored accent
- Stub stops get the same SVG treatment as implemented stops (all 50 generated equally)
- Format: 1200×630px (standard OG image size)

### Meta Tag Content
- `og:title` → stop title (e.g., "Thales and Natural Causes — How Physics Works")
- `og:description` → stop `description` field from stops.json (1–2 sentence concept summary)
- `og:image` → relative path to the committed SVG: `og-image.svg` in the stop's directory
- `og:type` → `article`
- `twitter:card` → `summary_large_image`

### Script Approach
- Script: `scripts/generate-og-svgs.mjs` at repo root (Node.js ESM, no dependencies beyond Node built-ins)
- Reads `Episodio4/assets/data/stops.json`
- Writes one SVG per stop to `Episodio4/stops/{stop-id}/og-image.svg`
- Idempotent: safe to re-run — later phases re-run per stop after implementing it
- No build step needed on the site itself; SVGs are static committed assets

### Regeneration Strategy
- Phase 07 generates all 50 SVGs now so every stop has social sharing from day one
- Later phases (08–13) re-run the script (or a targeted variant) after implementing each stop, if the SVG content needs updating
- The script design makes this trivial: filter by stop id, re-write that file

### Claude's Discretion
- Exact SVG layout/typography within the constraints above
- Whether to inline fonts or use system-safe font stack in SVG text
- Era color mapping to hex/rgb for SVG (oklch not universally supported in SVG renderers)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Episodio4/assets/data/stops.json`: fields available — `id`, `slug`, `title`, `subtitle`, `scientist`, `yearLabel`, `era`, `description`, `isStub`, `path`
- Era colors in `base.css`: ancient `oklch(0.72 0.12 60)`, revolution `oklch(0.72 0.15 145)`, classical `oklch(0.65 0.18 240)`, modern `oklch(0.68 0.20 310)`, contemporary `oklch(0.68 0.22 20)`
- Stop pages live at `Episodio4/stops/{stop-id}/index.html`

### Established Patterns
- No build pipeline — script is run locally, output committed (DEC-002)
- All generated files go under `Episodio4/` (DEC-001)
- Stop pages already have `<meta name="description">` — OG tags are additive, inserted after it

### Integration Points
- Every `stops/{stop-id}/index.html` needs 5 new `<meta>` tags in `<head>`
- `og:image` URL must be absolute for social crawlers — needs the GitHub Pages base URL: `https://faviovazquez.github.io/roadtoreality/stops/{stop-id}/og-image.svg`

</code_context>

<specifics>
## Specific Ideas

- The generation script should output a summary of how many SVGs were written and any errors
- Meta tag injection into 50 HTML files should be scripted (same `generate-og-svgs.mjs` or a companion script), not done by hand

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 07-v2-open-graph*
*Context gathered: 2026-03-22*
