# Roadmap — v2.0 Full Spectrum
*Last updated: 2026-03-21*

> **Phase numbering note:** v1.0 used phases 01–05 (dirs `01-foundation-shell` through `05-polish-deployment`).
> v2.0 phases continue from **06–14** so all phases across both milestones form one unambiguous sequence.
> When commands reference "Phase 06", "Phase 07", etc., those are the directory numbers.

---

## Overview

| Dir | v2.0 Phase | Name | Requirements | Description |
|-----|-----------|------|-------------|-------------|
| 06 | Phase 06 | Foundation & UX Polish | UX-01–10, FEAT-KATEX-01–04, FEAT-SEARCH-01–04 | KaTeX, search, stub pages, UX fixes |
| 07 | Phase 07 | Open Graph Images | FEAT-OG-01–03 | OG SVG generation + meta tags on all stop pages |
| 08 | Phase 08 | Era Gap Fills | SIM-GAP-01–02 | Stop 002 (Pythagoras) + Stop 014 (Hooke's Law) |
| 09 | Phase 09 | Era 3 — Classical Physics | SIM-CLS-01–12 | Stops 015–026: Bernoulli through Michelson-Morley |
| 10 | Phase 10 | Era 4 — Modern Physics Part A | SIM-MOD-01–07 | Stops 027–033: Planck through Bohr |
| 11 | Phase 11 | Era 4 — Modern Physics Part B | SIM-MOD-08–13 | Stops 034–039: General Relativity through Dirac |
| 12 | Phase 12 | Era 5 — Contemporary Physics Part A | SIM-CON-01–06 | Stops 040–045: Nuclear Fission through Black Holes |
| 13 | Phase 13 | Era 5 — Contemporary Physics Part B | SIM-CON-07–11 | Stops 046–050: Dark Matter through Open Questions |
| 14 | Phase 14 | Integration & Polish | All | Final integration pass, UAT, cross-browser testing, deploy |

**Total: 9 phases (06–14), 59 requirements.**

---

## Phase 06 — Foundation & UX Polish

**Goal:** All cross-cutting infrastructure in place before simulation work begins. Every new stop benefits from search, KaTeX, and UX improvements automatically.

**Requirements:** UX-01–10, FEAT-KATEX-01–04, FEAT-SEARCH-01–04
**Dir:** `06-v2-foundation-ux-polish`
**Context:** `06-CONTEXT.md` ✓
**Status:** ✓ Complete — 2026-03-21

**Plan 06-01: KaTeX Integration**
- Self-host KaTeX fonts + CSS + auto-render.min.js under `assets/katex/`
- Add KaTeX CSS to `<head>` of stop page template
- Add deferred KaTeX JS + init script to stop page template
- Retroactively add `$$...$$` display equation to the takeaway box of each of the 13 implemented stops
- Validate rendering for: `$F = ma$`, `$$E = mc^2$$`, `$$\Delta x \cdot \Delta p \geq \frac{\hbar}{2}$$`

**Plan 06-02: Search (Fuse.js)**
- Self-host `fuse.min.js` under `assets/js/vendor/`
- Create `assets/js/search.js`: Fuse instance, modal open/close, keyboard handler (Cmd/Ctrl+K, Escape, ↑↓ Enter)
- Create `assets/css/search.css`: modal overlay, search input, era-colored result cards
- Add search modal HTML skeleton to `index.html` and stop page template

**Plan 06-03: UX Polish — Global**
- Increase `body { line-height: 1.9; }` in `base.css`
- Update `--color-text-muted` to `oklch(0.55 0.02 90)` in `base.css`
- Keyboard arrow navigation in `stop-shell.js` (← prev, → next; only fires when no input is focused)
- `data-autoplay` attribute support in `stop-shell.js`
- Sim viewport: `@media (max-width: 768px) { .sim-container { min-height: 60vh; } }` in `simulation.css`
- Slider touch targets: 44px min on mobile; Play+Reset buttons 50/50 width on mobile

**Plan 06-04: Stub Stop Pages**
- Create stub stop page HTML template with rich canvas teaser animation per concept
- Generate stub landing pages for all 37 remaining stubs (same quality bar as implemented stops)
- Remove `pointer-events: none` from `.stop-card--stub`; replace `opacity: 0.5` with "Coming Soon" pill badge
- Stub pages: era-colored header, concept description, prev/next nav, GitHub contribution link

---

## Phase 6.1: Episodio4 Article — Learnship Behind the Scenes *(INSERTED)*

**Goal:** Write a long-form Spanish article documenting how Learnship is being used to build "How Physics Works" — covering the discuss → plan → execute → verify cycle, phase progress, and what agentic collaboration looks like in practice.
**Status:** [ ] Not started
**Depends on:** Phase 06
**Note:** Inserted between Phase 06 and Phase 07. Content lives in the roadtoreality repo as a Markdown article.

### Plans
*Not yet planned — run `plan-phase 6.1`*

---

## Phase 07 — Open Graph Images

**Goal:** Every stop has a social sharing image and complete OG meta tags.

**Requirements:** FEAT-OG-01–03
**Dir:** `07-v2-open-graph`

**Plan 07-01: OG SVG Generation**
- Write `scripts/generate-og-svgs.mjs`: reads stops.json, generates one SVG per stop (era color, title, scientist, year badge, branding)
- Run script; commit all 50 SVG files to `stops/{slug}/og-image.svg`

**Plan 07-02: OG Meta Tags**
- Add `og:title`, `og:description`, `og:image`, `og:type`, `twitter:card` meta tags to every stop's `index.html`
- Test: Twitter Card Validator + LinkedIn Post Inspector on 3–5 stops

## Phase 08 — Era Gap Fills (Stops 002, 014)

**Goal:** Complete the two missing stops so Eras 1–2 are fully implemented.

**Requirements:** SIM-GAP-01–02
**Dir:** `08-v2-era-gap-fills`

**Plan 08-01: Stop 002 — Pythagoras and Mathematical Harmony**
- Web Audio API oscillator + Canvas 2D string visualization
- Frequency ratio readout; harmonic series toggle
- Label common intervals (2:1 octave, 3:2 fifth, 4:3 fourth)
- KaTeX equations, stops.json `isStub: false`

**Plan 08-02: Stop 014 — Hooke's Law and Elasticity**
- Canvas 2D spring + weights; live F vs. x graph
- Force vectors; material selector (rubber, steel, glass)
- Show yield point and rupture; elastic vs. plastic regime
- KaTeX equations, stops.json `isStub: false`

---

## Phase 09 — Era 3: Classical Physics (Stops 015–026)

**Goal:** All 12 Classical Physics stops fully implemented.

**Requirements:** SIM-CLS-01–12
**Dir:** `09-v2-era3-classical`

**Plan 09-01: Stops 015 + 016 — Bernoulli + Euler**
**Plan 09-02: Stops 017 + 018 — Coulomb + Volta**
**Plan 09-03: Stops 019 + 020 — Faraday + Carnot**
**Plan 09-04: Stops 021 + 022 — Joule + Maxwell**
**Plan 09-05: Stops 023 + 024 — Doppler + Boltzmann**
**Plan 09-06: Stops 025 + 026 — Hertz + Michelson-Morley**

Each plan: implement `sim.js`, update `index.html` with KaTeX equations and stop content, set `isStub: false` in stops.json.

---

## Phase 10 — Era 4: Modern Physics Part A (Stops 027–033)

**Goal:** First 7 Modern Physics stops fully implemented.

**Requirements:** SIM-MOD-01–07
**Dir:** `10-v2-era4-modern-a`

**Plan 10-01: Stops 027 + 028 — Planck + Photoelectric Effect**
**Plan 10-02: Stops 029 + 030 — Time Dilation + Length Contraction**
**Plan 10-03: Stop 031 — E = mc²**
**Plan 10-04: Stops 032 + 033 — Rutherford + Bohr**

---

## Phase 11 — Era 4: Modern Physics Part B (Stops 034–039)

**Goal:** Remaining 6 Modern Physics stops fully implemented.

**Requirements:** SIM-MOD-08–13
**Dir:** `11-v2-era4-modern-b`

**Plan 11-01: Stops 034 + 035 — General Relativity + Double Slit**
**Plan 11-02: Stops 036 + 037 — Schrödinger + Heisenberg**
**Plan 11-03: Stops 038 + 039 — Pauli + Dirac**

---

## Phase 12 — Era 5: Contemporary Physics Part A (Stops 040–045)

**Goal:** First 6 Contemporary Physics stops fully implemented.

**Requirements:** SIM-CON-01–06
**Dir:** `12-v2-era5-contemporary-a`

**Plan 12-01: Stops 040 + 041 — Nuclear Fission + Feynman/QED**
**Plan 12-02: Stops 042 + 043 — Big Bang + Standard Model**
**Plan 12-03: Stops 044 + 045 — Higgs Boson + Black Holes**

---

## Phase 13 — Era 5: Contemporary Physics Part B (Stops 046–050)

**Goal:** Final 5 Contemporary Physics stops; site fully implemented.

**Requirements:** SIM-CON-07–11
**Dir:** `13-v2-era5-contemporary-b`

**Plan 13-01: Stops 046 + 047 — Dark Matter + Dark Energy**
**Plan 13-02: Stop 048 — Gravitational Waves**
**Plan 13-03: Stops 049 + 050 — Quantum Computing + Open Questions**

---

## Phase 14 — Integration & Polish

**Goal:** Site-wide integration pass, UAT, deploy v2.0.

**Requirements:** All (verification)
**Dir:** `14-v2-integration-polish`

**Plan 14-01: Integration Pass**
- Verify all 50 stops: `isStub: false`, sim loads, KaTeX renders, OG meta tags present
- Cross-browser test (Chrome, Firefox, Safari, Edge)
- Mobile test (375px, 768px)
- Lighthouse performance + accessibility audit

**Plan 14-02: UAT**
- Walk through complete 50-stop experience start to finish
- Test search (Cmd/Ctrl+K, fuzzy matching, keyboard nav)
- Test OG images (social preview tools)
- Test keyboard navigation (← → on stop pages)

**Plan 14-03: Deploy v2.0**
- Commit final state
- Deploy to GitHub Pages (gh-pages branch)
- Tag: `v2.0`

---

## Requirement Coverage

| Requirement Group | Count | Phase |
|------------------|-------|-------|
| FEAT-SEARCH | 4 | 06 |
| FEAT-KATEX | 4 | 06 |
| UX | 10 | 06 |
| FEAT-OG | 3 | 07 |
| SIM-GAP | 2 | 08 |
| SIM-CLS | 12 | 09 |
| SIM-MOD | 13 | 10, 11 |
| SIM-CON | 11 | 12, 13 |
| **Total** | **59** | **Phases 06–14** |
