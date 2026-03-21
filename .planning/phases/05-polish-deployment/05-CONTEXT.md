# Phase 5: Polish & Deployment — Context

**Gathered:** 2026-03-20
**Status:** Planned — not yet executed

<domain>
## Phase Boundary

Final quality pass before GitHub Pages deployment. Covers: performance optimization
(CSS/JS minification, image compression), accessibility audit, cross-browser testing,
README and deployment docs, GitHub Pages configuration, and any visual polish
identified during UAT of Phases 1-4.

This phase does NOT add new simulations or stops — that is Phase 3/4 territory.
It ships what exists in a production-ready state.

</domain>

<decisions>
## Implementation Decisions

### GitHub Pages deployment
Deploy from `Episodio4/` directory as the site root, OR restructure so `Episodio4/`
content is at project root. Preferred: keep `Episodio4/` and configure GitHub Pages
to serve from `/Episodio4` folder (supported since 2022 via "Custom subdirectory" option).
Alternative: create a `gh-pages` branch with only `Episodio4/` contents at root.
Decision to be confirmed during this phase.

### Minification strategy
Since there is no build pipeline, use one of:
A) python3 one-liners to strip comments/whitespace from JS
B) Use the `css-minifier` and `uglify-js` NPM packages run once as a pre-deploy step
C) Leave unminified — the entire site is ~200KB of JS, browsers handle this fine
Preferred: option C for v1.0 (simplicity > micro-optimization). Revisit for v2.0.

### Performance targets
- First Contentful Paint < 1.5s on 3G
- Total page weight < 500KB (excluding vendor libs loaded lazily)
- Simulations must not drop below 30fps on mobile (test on iPhone 12-class device)

### Accessibility minimum bar
- All interactive elements keyboard accessible
- All images have alt text
- All form controls have associated labels
- Color contrast: 4.5:1 for body text, 3:1 for large text (WCAG AA)
- `prefers-reduced-motion` already handled in CSS (from Phase 1)

### README content
- What the site is (1 paragraph)
- How to develop locally (`python3 -m http.server 8765 --directory Episodio4`)
- How to add a new stop (5-step checklist)
- How to deploy to GitHub Pages
- Tech stack summary

### Claude's Discretion
- Exact accessibility fixes discovered during audit
- Order of performance optimizations if needed
- Specific wording in README

</decisions>

<code_context>
## Existing Code Insights

### Known items to address in Phase 5
- `roundRect()` is used in all sim.js files — confirm browser support matrix
- `prefers-reduced-motion` handled in CSS but not in JS RAF loops — add check to sim setup
- `stops.json` fetch error message needs to be user-visible on the landing page (verify it renders)
- All 50 stop pages need `<meta name="description">` — confirm present (should be from stubs)

### Integration Points
- GitHub Pages: `.nojekyll` already present (from Phase 1)
- No build step needed — site is already static
- Font WOFF2 files need `font-display: swap` — already set (from Phase 1)

</code_context>

<specifics>
## Specific Ideas

- README should include a "How to add a new stop" section with numbered steps —
  this makes it easy to contribute Era 3-5 simulations in future milestones
- Performance: check if Matter.js (80KB) is actually used in v1.0 — if no sim uses it,
  remove the script tag from stop pages to save the parse cost

</specifics>

<deferred>
## Deferred Ideas

- Sitemap.xml generation — deferred to v2.0
- Open Graph images per stop — deferred to v2.0
- PWA / service worker for offline use — deferred to v2.0
- Search functionality — deferred to v2.0

</deferred>

---
*Phase: 05-polish-deployment*
*Context gathered: 2026-03-20*
