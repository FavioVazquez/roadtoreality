# Roadmap — v2.0 Full Spectrum
*Last updated: 2026-03-21*

---

## Overview

| Phase | Name | Requirements | Description |
|-------|------|-------------|-------------|
| 1 | Foundation & UX Polish | UX-01–10, FEAT-KATEX-01–04, FEAT-SEARCH-01–04 | Cross-cutting infra: KaTeX, search, stub pages, UX fixes |
| 2 | Open Graph Images | FEAT-OG-01–03 | OG image SVG generation script + meta tags on all stop pages |
| 3 | Era Gap Fills | SIM-GAP-01–02 | Stop 002 (Pythagoras) + Stop 014 (Hooke's Law) |
| 4 | Era 3 — Classical Physics | SIM-CLS-01–12 | Stops 015–026: Bernoulli through Michelson-Morley |
| 5 | Era 4 — Modern Physics Part A | SIM-MOD-01–07 | Stops 027–033: Planck through Bohr |
| 6 | Era 4 — Modern Physics Part B | SIM-MOD-08–13 | Stops 034–039: General Relativity through Dirac |
| 7 | Era 5 — Contemporary Physics Part A | SIM-CON-01–06 | Stops 040–045: Nuclear Fission through Black Holes |
| 8 | Era 5 — Contemporary Physics Part B | SIM-CON-07–11 | Stops 046–050: Dark Matter through Open Questions |
| 9 | Integration & Polish | All | Final integration pass, UAT, cross-browser testing, deploy |

**Total: 9 phases, 59 requirements.**

---

## Phase 1 — Foundation & UX Polish

**Goal:** All cross-cutting infrastructure in place before simulation work begins. Every new stop benefits from search, KaTeX, and UX improvements automatically.

**Requirements:** UX-01–10, FEAT-KATEX-01–04, FEAT-SEARCH-01–04

**Plan 1-01: KaTeX Integration**
- Self-host KaTeX fonts + CSS + auto-render.min.js under `assets/katex/`
- Add KaTeX CSS to `<head>` of stop page template
- Add deferred KaTeX JS + init script to stop page template
- Validate rendering for: `$F = ma$`, `$$E = mc^2$$`, `$$\Delta x \cdot \Delta p \geq \frac{\hbar}{2}$$`

**Plan 1-02: Search (Fuse.js)**
- Self-host `fuse.min.js` under `assets/js/vendor/`
- Create `assets/js/search.js`: Fuse instance, modal open/close, keyboard handler (Cmd/Ctrl+K, Escape, ↑↓ Enter)
- Create `assets/css/search.css`: modal overlay, search input, result cards
- Add search modal HTML skeleton to `index.html` and stop page template

**Plan 1-03: UX Polish — Global**
- Increase `body { line-height: 1.9; }` in `base.css`
- Update `--color-text-muted` to `oklch(0.55 0.02 90)` in `base.css`
- Keyboard arrow navigation in `stop-shell.js` (← prev, → next)
- `data-autoplay` attribute support in `stop-shell.js`
- Sim viewport: `@media (max-width: 768px) { .sim-container { min-height: 60vh; } }` in `simulation.css`
- `.sim-control__hint` CSS component for slider landmark labels

**Plan 1-04: Stub Stop Pages**
- Create stub stop page HTML template
- Generate/update stub landing pages for all 37 remaining stubs
- Remove `pointer-events: none` from `.stop-card--stub`; update to "Coming Soon" badge overlay
- Stub pages: era-colored header, concept description, prev/next nav, GitHub link

**Plan 1-05: Mobile UX**
- Mobile sticky prev/next footer (`@media (max-width: 768px)`)
- Skeleton screen loader: `.stop-skeleton` with shimmer animation
- Slider touch targets: 44px min on mobile

---

## Phase 2 — Open Graph Images

**Goal:** Every stop has a social sharing image and complete OG meta tags.

**Requirements:** FEAT-OG-01–03

**Plan 2-01: OG SVG Generation**
- Write `scripts/generate-og-svgs.mjs`: reads stops.json, generates one SVG per stop (era color, title, scientist, year badge, branding)
- Run script; commit all 50 SVG files to `stops/{slug}/og-image.svg`

**Plan 2-02: OG Meta Tags**
- Add `og:title`, `og:description`, `og:image`, `og:type`, `twitter:card` meta tags to every stop's `index.html`
- Test: Twitter Card Validator + LinkedIn Post Inspector on 3–5 stops

---

## Phase 3 — Era Gap Fills (Stops 002, 014)

**Goal:** Complete the two missing stops so Eras 1–2 are fully implemented.

**Requirements:** SIM-GAP-01–02

**Plan 3-01: Stop 002 — Pythagoras and Mathematical Harmony**
- Web Audio API oscillator + Canvas 2D string visualization
- Frequency ratio readout; harmonic series toggle
- Label common intervals (2:1 octave, 3:2 fifth, 4:3 fourth)
- KaTeX equations, stops.json `isStub: false`

**Plan 3-02: Stop 014 — Hooke's Law and Elasticity**
- Canvas 2D spring + weights; live F vs. x graph
- Force vectors; material selector (rubber, steel, glass)
- Show yield point and rupture; elastic vs. plastic regime
- KaTeX equations, stops.json `isStub: false`

---

## Phase 4 — Era 3: Classical Physics (Stops 015–026)

**Goal:** All 12 Classical Physics stops fully implemented.

**Requirements:** SIM-CLS-01–12

**Plan 4-01: Stops 015 + 016 — Bernoulli + Euler**
**Plan 4-02: Stops 017 + 018 — Coulomb + Volta**
**Plan 4-03: Stops 019 + 020 — Faraday + Carnot**
**Plan 4-04: Stops 021 + 022 — Joule + Maxwell**
**Plan 4-05: Stops 023 + 024 — Doppler + Boltzmann**
**Plan 4-06: Stops 025 + 026 — Hertz + Michelson-Morley**

Each plan: implement `sim.js`, update `index.html` with KaTeX equations and stop content, set `isStub: false` in stops.json.

---

## Phase 5 — Era 4: Modern Physics Part A (Stops 027–033)

**Goal:** First 7 Modern Physics stops fully implemented.

**Requirements:** SIM-MOD-01–07

**Plan 5-01: Stops 027 + 028 — Planck + Photoelectric Effect**
**Plan 5-02: Stops 029 + 030 — Time Dilation + Length Contraction**
**Plan 5-03: Stop 031 — E = mc²**
**Plan 5-04: Stops 032 + 033 — Rutherford + Bohr**

---

## Phase 6 — Era 4: Modern Physics Part B (Stops 034–039)

**Goal:** Remaining 6 Modern Physics stops fully implemented.

**Requirements:** SIM-MOD-08–13

**Plan 6-01: Stops 034 + 035 — General Relativity + Double Slit**
**Plan 6-02: Stops 036 + 037 — Schrödinger + Heisenberg**
**Plan 6-03: Stops 038 + 039 — Pauli + Dirac**

---

## Phase 7 — Era 5: Contemporary Physics Part A (Stops 040–045)

**Goal:** First 6 Contemporary Physics stops fully implemented.

**Requirements:** SIM-CON-01–06

**Plan 7-01: Stops 040 + 041 — Nuclear Fission + Feynman/QED**
**Plan 7-02: Stops 042 + 043 — Big Bang + Standard Model**
**Plan 7-03: Stops 044 + 045 — Higgs Boson + Black Holes**

---

## Phase 8 — Era 5: Contemporary Physics Part B (Stops 046–050)

**Goal:** Final 5 Contemporary Physics stops; site fully implemented.

**Requirements:** SIM-CON-07–11

**Plan 8-01: Stops 046 + 047 — Dark Matter + Dark Energy**
**Plan 8-02: Stop 048 — Gravitational Waves**
**Plan 8-03: Stops 049 + 050 — Quantum Computing + Open Questions**

---

## Phase 9 — Integration & Polish

**Goal:** Site-wide integration pass, UAT, deploy v2.0.

**Requirements:** All (verification)

**Plan 9-01: Integration Pass**
- Verify all 50 stops: `isStub: false`, sim loads, KaTeX renders, OG meta tags present
- Cross-browser test (Chrome, Firefox, Safari, Edge)
- Mobile test (375px, 768px)
- Lighthouse performance + accessibility audit

**Plan 9-02: UAT**
- Walk through complete 50-stop experience start to finish
- Test search (Cmd/Ctrl+K, fuzzy matching, keyboard nav)
- Test OG images (social preview tools)
- Test keyboard navigation (← → on stop pages)

**Plan 9-03: Deploy v2.0**
- Commit final state
- Deploy to GitHub Pages (gh-pages branch)
- Tag: `v2.0`

---

## Requirement Coverage

| Requirement Group | Count | Phases |
|------------------|-------|--------|
| SIM-GAP | 2 | 3 |
| SIM-CLS | 12 | 4 |
| SIM-MOD | 13 | 5, 6 |
| SIM-CON | 11 | 7, 8 |
| FEAT-SEARCH | 4 | 1 |
| FEAT-KATEX | 4 | 1 |
| FEAT-OG | 3 | 2 |
| UX | 10 | 1 |
| **Total** | **59** | **9 phases** |
