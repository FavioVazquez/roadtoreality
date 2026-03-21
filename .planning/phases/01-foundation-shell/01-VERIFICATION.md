# Phase 1: Foundation & Shell — Verification

**Date:** 2026-03-20
**Status:** passed
**Verified by:** Cascade (retroactive)

---

## Must-Have Checklist

### ARCH-01–09 (Architecture & Infrastructure)
- [x] ARCH-01: Static site, no backend — `index.html` and all stop pages are plain HTML
- [x] ARCH-02: All site code in `Episodio4/` — confirmed directory
- [x] ARCH-03: Multi-page structure: `index.html` + `stops/{id}/index.html` pattern
- [x] ARCH-04: `stops.json` exists at `assets/data/stops.json` with all 50 stops
- [x] ARCH-05: All vendor libs self-hosted: `p5.min.js` (1,034,532 bytes), `matter.min.js` (80,807 bytes)
- [x] ARCH-06: `window.SimAPI = { start, pause, reset, destroy }` contract defined and documented
- [x] ARCH-07: `IntersectionObserver` in `stop-shell.js` wires sim lifecycle on viewport entry/exit
- [x] ARCH-08: Pure HTML/CSS/JS — no framework, no build step required
- [x] ARCH-09: `.nojekyll` present at `Episodio4/` root

### VIS-01–07 (Visual Design — partial)
- [x] VIS-01: Dark luxury aesthetic — oklch `0.07` void background, warm off-white text
- [x] VIS-02: 5 era accent colors defined as CSS custom properties, applied via data-era attribute
- [x] VIS-03: Cormorant Garamond and DM Sans self-hosted as WOFF2, referenced in @font-face
- [x] VIS-04: Body text column `max-width: 680px` on `.content-column`
- [x] VIS-05: Mobile-friendly — sim-controls stack vertically at 640px breakpoint
- [x] VIS-07: `prefers-reduced-motion` respected — animations set to 0.01ms duration

### Plan must_haves — Plan 01-01
- [x] base.css defines all oklch design tokens (9 color roles, 5 era colors, 2 accents)
- [x] Fluid type scale: 9 clamp() steps from --text-xs to --text-4xl
- [x] All 6 @font-face declarations present and reference correct WOFF2 filenames
- [x] All 6 WOFF2 files > 10KB (range: 18KB–37KB confirmed)
- [x] components.css has .stop-card, .era-section, .era-timeline, .breadcrumb, .stop-nav, .btn
- [x] simulation.css has .sim-wrapper, .sim-container, .sim-controls, .sim-btn, .sim-caption, .takeaway-box, .stop-bridge
- [x] prefers-reduced-motion disables animations in base.css

### Plan must_haves — Plan 01-02
- [x] progress.js exposes window.PhysicsProgress with all 4 methods
- [x] stop-shell.js reads #stop-config, renders breadcrumb and stop-nav, wires IntersectionObserver
- [x] nav.js fetches stops.json, renders all era sections + card grid, shows visited badges
- [x] index.html has: hero, era timeline, sticky era tabs, #era-sections, #progress-bar, starfield canvas
- [x] nav.js shows human-readable error on fetch fail (confirmed in source)
- [x] stop-shell.js play/pause/reset buttons call SimAPI correctly

---

## Human Verification Items

- [ ] **Visual inspection**: Landing page renders correctly at 1280px, 768px, 375px
- [ ] **Starfield**: Animated starfield visible on landing page; stops when prefers-reduced-motion set
- [ ] **Fonts**: Cormorant Garamond renders for headings; DM Sans for body text
- [ ] **Era colors**: 5 era sections each have distinct accent color
- [ ] **Starfield**: Does not render on stop pages (correctly scoped to index.html)

---

## Gaps Found

None — all automated criteria pass.

*Verified: 2026-03-20*
