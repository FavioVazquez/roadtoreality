# Project State — How Physics Works

## Current Position

Milestone: v2.0 — Full Spectrum
Phase: 6.1 — Episodio4 Article — Learnship Behind the Scenes
Plan: —
Status: discuss-phase 6.1 complete — context gathered, ready for plan-phase 6.1
Last activity: 2026-03-21 — Phase 6.1 context session completed

## Completed Phases

### Phase 1 — Foundation & Shell ✓
- `Episodio4/` full directory structure created
- `assets/css/base.css`, `components.css`, `simulation.css` written (dark luxury palette, oklch)
- Cormorant Garamond + DM Sans self-hosted as WOFF2 in `assets/fonts/`
- `assets/js/nav.js`, `stop-shell.js`, `progress.js` written
- Vendor libs: `p5.min.js` (1.9.4), `matter.min.js` (0.19.0) in `assets/js/vendor/`
- `index.html` landing page with starfield, era tabs, hero section

### Phase 2 — Stops Data & Navigation ✓
- `assets/data/stops.json` — all 50 stops with full metadata
- 50 stop directories created under `stops/`
- 12 stops with full HTML + interactive sim.js
- 38 stops with full HTML shell + placeholder sim
- All prev/next navigation chains verified
- `.nojekyll` added for GitHub Pages

## Full Simulations Built (12)
- 001 Thales: supernatural vs natural explanation two-panel comparison
- 003 Democritus: zoom-into-matter (macroscopic → nuclear → quarks)
- 004 Aristotle: two balls dropped, adjustable mass + air resistance
- 005 Archimedes: objects dropped into water, buoyancy force arrows
- 006 Eratosthenes: two-stick Earth measurement with circumference calc
- 007 Ptolemy: geocentric model with epicycles + retrograde trails
- 008 Copernicus: toggle heliocentric/geocentric view, orbital trails
- 009 Galileo inclined plane: ball rolls, d=½at² graph, mass has no effect
- 010 Galileo pendulum: RK4 physics, mass/length/angle sliders, period readout
- 011 Kepler: RK4 orbital mechanics, equal-areas triangles, adjustable eccentricity
- 012 Newton laws: F=ma block, friction, velocity graph, wall reaction
- 013 Newton gravity: Newton's cannon, projectile→orbit RK4, escape velocity

## Milestone

**v1.0 — First Light**
Goal: Ship a working static site with the shared shell, landing page, and ~10 fully polished interactive stops covering Eras 1–2 (Ancient → Scientific Revolution), deployable to GitHub Pages.

## Output Location

All site code lives in: `Episodio4/`

## Accumulated Context

### Key Decisions
- Site code and all generated artifacts live in `Episodio4/` (not project root)
- Static site, no build pipeline — pure HTML/CSS/JS + vendored libraries
- Multi-page hub-and-spoke: `index.html` + `stops/{slug}/index.html` per stop
- Simulations are self-contained IIFE modules exposing `window.SimAPI`
- `IntersectionObserver` starts/stops simulation loops on viewport entry/exit
- `stops.json` is the single source of truth for all stop metadata
- Dark luxury aesthetic (oklch color system, Cormorant Garamond display font)
- p5.js instance mode for most simulations; vanilla Canvas for simpler ones
- Matter.js for rigid-body sims; vanilla math (RK4) for orbital/wave physics
- Galaxy background: Perlin fBm noise procedural rendering (DEC-010)
- All oklch color tokens: hue 285 → 0 (neutral black, no blue cast)
- GitHub Pages: deploy from /Episodio4 subfolder (confirmed)

### Phase 06 Plans Progress
- 06-01: CSS & Global UX Polish — complete
- 06-02: KaTeX Integration — complete
- 06-03: Fuse.js Search — complete
- 06-04: Stub Pages + stop-shell.js Updates — complete
- 06-05-FIX: Teaser Animation Quality (027 Planck + 040 Fission) — complete
- 06-06-FIX: Search Discoverability (search trigger button, all 51 pages) — complete

### Constraints
- No backend, no build step required — must serve from file system or GitHub Pages
- All vendor libraries self-hosted in `Episodio4/assets/js/vendor/`
- Must work in Chrome, Firefox, Safari, Edge without plugins
- Mobile-friendly — simulations responsive, touch events handled

---

## Roadmap Evolution

- Phase 6.1 inserted after Phase 06: Spanish article documenting Learnship workflow used to build How Physics Works (discuss → plan → execute → verify cycle, current status, agentic collaboration behind the scenes)

---

## Milestone History

### v1.0 — First Light
Completed: 2026-03-21
Phases: 5
Requirements delivered: ARCH-01–09, NAV-01–07, CONT-01–07, SIM-01–08, VIS-01–07, PERF-01–04
Key achievements: Shipped a full static physics education site with 13 interactive Canvas 2D simulations covering Eras 1–2 (Ancient through Scientific Revolution). Deployed to GitHub Pages at https://faviovazquez.github.io/roadtoreality/. Landing page features a noise-based procedural galaxy background with Perlin fBm filamentary nebulae, dust-lane Milky Way, and animated starfield. All 50 stop navigation chain functional; 37 stub pages ready for v2.0 implementation.
