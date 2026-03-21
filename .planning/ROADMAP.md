# Roadmap — How Physics Works
## Milestone v1.0 — First Light

*Last updated: 2026-03-20*
*Output directory: `Episodio4/`*

---

## Overview

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Foundation & Shell | ARCH-01–09, VIS-01–07, PERF-01–04 | ✓ Complete (2026-03-20) |
| 2 | Stops Data & Navigation | NAV-01–07, ARCH-04, CONT-07 | ✓ Complete (2026-03-20) |
| 3 | Era 1 Simulations (Ancient) | CONT-01, CONT-03–06, SIM-01–08 | ✓ Complete (2026-03-20) |
| 4 | Era 2 Simulations (Scientific Revolution) | CONT-02, CONT-03–06, SIM-01–08 | ✓ Complete (2026-03-20) |
| 5 | Polish & Deployment | PERF-01–04, VIS-05–07, ARCH-09 | In Progress |

---

## Phase 1 — Foundation & Shell

**Goal:** Build the shared CSS system, base HTML templates, shared JS modules, and one end-to-end proof-of-concept stop. Nothing content-specific yet — just the architecture every stop will live inside.

**Definition of done:**
- `Episodio4/` directory structure matches the spec
- `assets/css/base.css`, `components.css`, `simulation.css` written with dark luxury palette
- Fonts (Cormorant Garamond, DM Sans) self-hosted as WOFF2
- `assets/js/stop-shell.js` — breadcrumb, prev/next, IntersectionObserver bootstrap
- `assets/js/progress.js` — localStorage visited-stop tracking
- `assets/js/nav.js` — reads `stops.json`, renders era sections and card grids
- Vendor libraries downloaded: `p5.min.js` (v2.2.2), `matter.min.js` (v0.19.0)
- One complete stop end-to-end (Newton's Laws, stop 014) as the proof-of-concept: narrative text, working canvas simulation, prev/next, breadcrumb, mobile layout
- `index.html` skeleton renders with era timeline and placeholder card grid

**Requirements covered:** ARCH-01–09, VIS-01–07 (partial), PERF-03–04

---

## Phase 2 — Stops Data & Navigation

**Goal:** Define all ~50 stops in `stops.json`, generate stub HTML pages for all stops, wire up the landing page card grid, and verify navigation works end-to-end across all stubs.

**Definition of done:**
- `assets/data/stops.json` contains all ~50 stops with full metadata (id, slug, order, title, subtitle, era, year, scientist, prev, next, path)
- All 50 stub `stops/{slug}/index.html` files generated — each has the full page shell (header, breadcrumb, prev/next) but a `<div class="sim-placeholder">` instead of a real simulation
- Landing page card grid renders all stops organized by era from `stops.json`
- Era color coding applied to all cards and section headers
- `progress.js` marks stops as visited and shows visited badges on the landing page
- All 50 pages navigable: every prev/next link resolves to the correct stop
- Verified no broken navigation across the full chain

**Requirements covered:** NAV-01–07, ARCH-04, CONT-07, VIS-02

---

## Phase 3 — Era 1 Simulations (Ancient Physics)

**Goal:** Replace stub placeholders with fully polished interactive simulations for all Era 1 stops (Ancient & Classical, ~600 BCE – 150 CE).

**Stops (minimum 4, target all 7):**

| Stop | Title | Simulation Type | Key Aha Moment |
|------|-------|-----------------|----------------|
| 001 | Aristotle's Theory of Motion | Canvas 2D (vanilla) | Drop two masses — they fall at the same rate |
| 002 | Archimedes and Buoyancy | Canvas 2D (vanilla) | Drag objects into water — displaced volume = buoyant force |
| 003 | Eratosthenes Measures the Earth | SVG / Canvas 2D | Two sticks, two shadows, one sphere — calculate Earth's size |
| 004 | Ptolemy's Geocentric Model | Canvas 2D (vanilla) | Drag the epicycle radius — watch Mars "retrograde" |
| 005 | Democritus and the Atom | Canvas 2D (p5.js) | Zoom in — matter keeps subdividing; where does it stop? |
| 006 | Archimedes and the Lever | Matter.js | Balance objects at different distances — feel the lever law |
| 007 | Al-Haytham's Pinhole Camera | Canvas 2D (vanilla) | Move an object; its inverted image appears on the far wall |

**Definition of done (per stop):**
- Simulation runs at 60fps on mid-range hardware
- Reset button works; simulation starts paused
- 3 or fewer primary controls visible by default
- Plain-language intro (2–3 sentences) above simulation
- Key Takeaway box (2–3 bullets) below simulation
- Bridge sentence connecting to next discovery
- Tested on mobile (375px); no scroll/drag conflict
- `prefers-reduced-motion` respected

**Requirements covered:** CONT-01, CONT-03–06, SIM-01–08, VIS-05–07

---

## Phase 4 — Era 2 Simulations (Scientific Revolution)

**Goal:** Replace stub placeholders with fully polished interactive simulations for all Era 2 stops (Scientific Revolution, 1543–1700).

**Stops (minimum 6, target all 6):**

| Stop | Title | Simulation Type | Key Aha Moment |
|------|-------|-----------------|----------------|
| 008 | Copernicus — Heliocentric Model | Canvas 2D (vanilla) | Toggle geocentric/heliocentric — planetary paths simplify |
| 009 | Galileo's Inclined Plane | Canvas 2D (vanilla) | Change the angle; distance ∝ time² regardless of mass |
| 010 | Galileo's Pendulum | Matter.js or Canvas | Change mass — period unchanged; change length — period changes |
| 011 | Kepler's Laws | Canvas 2D (vanilla RK4) | Drag planet to different orbit — equal areas in equal times |
| 012 | Newton's Laws of Motion | Matter.js | Apply force; watch F=ma play out with real objects |
| 013 | Newton's Cannon (Orbital Mechanics) | Canvas 2D (vanilla RK4) | Fire faster — it orbits instead of falling |

**Definition of done:** Same criteria as Phase 3.

**Requirements covered:** CONT-02, CONT-03–06, SIM-01–08, VIS-05–07

---

## Phase 5 — Polish & Deployment

**Goal:** Performance audit, accessibility pass, mobile validation, deployment to GitHub Pages, and final quality checks.

**Definition of done:**
- All 10+ implemented stops load under 500 KB total transfer
- Landing page loads under 3 seconds on broadband
- `prefers-reduced-motion` verified working on all stops
- WCAG AA contrast verified (4.5:1 text, 3:1 UI) on all stops
- Keyboard navigation tested (Tab through all controls, no mouse required)
- Mobile tested at 375px on all implemented stops
- `.nojekyll` present at `Episodio4/` root
- GitHub Pages deployment verified (or local `python3 -m http.server` test confirms no broken paths)
- All stub stops display cleanly (placeholder, not broken)

**Requirements covered:** PERF-01–04, VIS-05–07, ARCH-09, NAV-01–07 (final verification)

---

## File Structure (Target)

```
Episodio4/
├── index.html                        ← Landing page
├── .nojekyll
├── assets/
│   ├── css/
│   │   ├── base.css                  ← Reset, tokens, typography, layout
│   │   ├── components.css            ← Nav, cards, breadcrumb, buttons
│   │   └── simulation.css            ← Sim container, controls, captions
│   ├── js/
│   │   ├── nav.js                    ← Renders card grid from stops.json
│   │   ├── progress.js               ← localStorage visited tracking
│   │   ├── stop-shell.js             ← Per-stop: breadcrumb, prev/next, IntersectionObserver
│   │   └── vendor/
│   │       ├── p5.min.js
│   │       └── matter.min.js
│   ├── data/
│   │   └── stops.json
│   └── fonts/
│       ├── cormorant-garamond-*.woff2
│       └── dm-sans-*.woff2
└── stops/
    ├── 001-aristotle-motion/
    │   ├── index.html
    │   └── sim.js
    ├── 002-archimedes-buoyancy/
    │   ├── index.html
    │   └── sim.js
    └── ... (all 50 stops)
```
