# Project State — How Physics Works

## Current Position

Milestone: v2.0 — Full Spectrum
Phase: 10 — Era 4: Modern Physics Part A
Plan: —
Status: Phase 09 ✓ complete + verified — all 12 Classical Physics stops (015–026) pass UAT round 2
Last activity: 2026-03-24 — Quick task 005: X share buttons (tweet + long post + screenshot) added to all stops via stop-shell.js.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Update episodio4.md with phases 7 & 8 + upcoming phases preview | 2026-03-23 | 20652f6 | .planning/quick/001-update-episodio4-phases-7-8/ |
| 002 | Add subtle Learnship attribution to How Physics Works footer | 2026-03-23 | d9af0ea | .planning/quick/002-add-learnship-attribution/ |
| 003 | Add GitHub repo link and favicon to How Physics Works | 2026-03-24 | dde54a5 | .planning/quick/003-github-link-and-favicon/ |
| 004 | Rename Episodio4/ → HowPhysicsWorks/ across all files | 2026-03-24 | 0a2bc6c | .planning/quick/004-rename-episodio4-howphysicsworks/ |
| 005 | Add X share buttons (tweet + long post) to all stops | 2026-03-24 | 1af3041 | .planning/quick/005-x-share-buttons/ |

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

## Full Simulations Built (25)
- 001 Thales: supernatural vs natural explanation two-panel comparison
- 002 Pythagoras: six harmonic ratio buttons (1:1 to 9:8), Web Audio sine tones, Canvas 2D standing wave (n=1 to 9)
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
- 014 Hooke's Law: split canvas spring + F vs. x graph, elastic/plastic/rupture, 3 material presets
- 015 Bernoulli: venturi tube, throat-width + flow-speed sliders, particle flow, pressure graph
- 016 Euler rotation: three bodies (disk/rod/ring), τ=Iα, wired torque+mass sliders, live ω graph
- 017 Coulomb: draggable charges, live field lines, F vs r graph
- 018 Volta: voltaic pile schematic, animated circuit, series/parallel toggle
- 019 Faraday: galvanometer driven by dΦ/dt, Lenz's law reversal
- 020 Carnot: PV diagram with analytical curves, T_H/T_C sliders, efficiency readout
- 021 Joule: stage-based PE→KE→Heat conversion, energy bar chart, wired height+mass sliders
- 022 Maxwell: two-panel — draggable charges with live field lines + EM wave with E/B vectors
- 023 Doppler: moving source wavefronts, source-speed + source-frequency sliders
- 024 Boltzmann: two-panel — elastic collision gas + MB histogram, partition wall + entropy meter
- 025 Hertz: oscillating dipole, sin²θ radiation pattern
- 026 Michelson-Morley: three-mode narrative (Setup / Expected vs Found / Arm Ratio)

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
- OG SVG era hex colors (approx of oklch): ancient=#c4922a, revolution=#4ca86b, classical=#5b8fd4, modern=#b06fd0, contemporary=#d45b5b

### Phase 06 Plans Progress
- 06-01: CSS & Global UX Polish — complete
- 06-02: KaTeX Integration — complete
- 06-03: Fuse.js Search — complete
- 06-04: Stub Pages + stop-shell.js Updates — complete
- 06-05-FIX: Teaser Animation Quality (027 Planck + 040 Fission) — complete
- 06-06-FIX: Search Discoverability (search trigger button, all 51 pages) — complete

### Phase 6.1 Plans Progress
- 06.1-01: Expand "El proyecto de ejemplo" section — complete (2026-03-21)
- 06.1-02: Strengthen "La conexión" section with Ep2/Ep3 explicit callbacks — complete (2026-03-21)

### Phase 07 Plans Progress
- 07-01: OG SVG Generation — complete (2026-03-22): 50 SVG files at Episodio4/stops/*/og-image.svg
- 07-02: OG meta tag injection — complete (2026-03-22): scripts/inject-og-meta.mjs + 50 stop pages updated

### Phase 08 Plans Progress
- 08-01: Stop 002 Pythagoras — complete (2026-03-22): Web Audio + Canvas standing wave sim, 6 ratio buttons
- 08-02: Stop 014 Hooke's Law — complete (2026-03-22): spring + F vs. x graph, 3 materials, snap animation

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
