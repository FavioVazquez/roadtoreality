# Requirements — How Physics Works
## Milestone v1.0 — First Light

*Last updated: 2026-03-20*

---

## v1.0 Requirements (In Scope)

### ARCH — Architecture & Infrastructure

| REQ-ID | Requirement |
|--------|-------------|
| ARCH-01 | Static site — pure HTML/CSS/JS, no backend, no build step required to serve |
| ARCH-02 | All site code lives under `Episodio4/` |
| ARCH-03 | Multi-page structure: `index.html` (landing) + `stops/{slug}/index.html` per stop |
| ARCH-04 | `Episodio4/assets/data/stops.json` is the single source of truth for all stop metadata |
| ARCH-05 | All vendor libraries self-hosted under `Episodio4/assets/js/vendor/` (no CDN dependencies) |
| ARCH-06 | Simulation modules are self-contained IIFEs exposing `window.SimAPI = { start, pause, reset, destroy }` |
| ARCH-07 | `IntersectionObserver` in `stop-shell.js` starts/pauses simulation when it enters/leaves viewport |
| ARCH-08 | Site must work in Chrome, Firefox, Safari, Edge without plugins |
| ARCH-09 | `.nojekyll` file at `Episodio4/` root for GitHub Pages compatibility |

### NAV — Navigation & Structure

| REQ-ID | Requirement |
|--------|-------------|
| NAV-01 | Landing page shows a visual era timeline (5 eras) with color-coded sections |
| NAV-02 | Landing page shows a card grid per era; each card links to a stop |
| NAV-03 | Every stop page has prev/next navigation linking to adjacent stops |
| NAV-04 | Every stop page has a breadcrumb: `Era > Stop Title` |
| NAV-05 | Every stop page has a "Back to map" link returning to `index.html` |
| NAV-06 | Stop URLs are human-readable: `/stops/001-aristotle-motion/` |
| NAV-07 | `progress.js` tracks visited stops in `localStorage` and shows visited badges on cards |

### CONTENT — Content & Stops (v1.0 scope: ~10 stops, Eras 1–2)

| REQ-ID | Requirement |
|--------|-------------|
| CONT-01 | Era 1 stops (Ancient, ~350 BCE – 150 CE): minimum 4 stops fully implemented |
| CONT-02 | Era 2 stops (Scientific Revolution, 1543–1700): minimum 6 stops fully implemented |
| CONT-03 | Each stop has: title, subtitle, era label, date, scientist name, 2–3 sentence plain-language intro |
| CONT-04 | Each stop has a working interactive simulation (not a placeholder) |
| CONT-05 | Each stop ends with a "Key Takeaway" box (2–3 bullets) |
| CONT-06 | Each stop has a "Bridge" sentence connecting forward to the next discovery |
| CONT-07 | All remaining stops (11–50) exist as stub pages with placeholder simulation slots |

### SIM — Simulation Quality

| REQ-ID | Requirement |
|--------|-------------|
| SIM-01 | Every simulation starts paused; begins on viewport entry or explicit Play action |
| SIM-02 | Every simulation has a visible Reset button that restores default state |
| SIM-03 | Controls limited to 3 primary parameters visible by default; advanced controls hidden |
| SIM-04 | Each simulation is designed around one explicit "aha moment" observable within 30 seconds |
| SIM-05 | Simulation parameters use plain-language labels with units (not raw variable names) |
| SIM-06 | Physics uses RK4 or Verlet integration (not naive Euler) for energy-conserving simulations |
| SIM-07 | Simulations are responsive: canvas dimensions derived from container width, not hardcoded |
| SIM-08 | Touch events handled alongside mouse events (Pointer Events API) |

### VIS — Visual Design

| REQ-ID | Requirement |
|--------|-------------|
| VIS-01 | Dark luxury aesthetic: near-black background (`oklch(0.08–0.12)`), warm off-white text |
| VIS-02 | Each era has a distinct accent color applied consistently to cards, borders, and breadcrumbs |
| VIS-03 | Display font: Cormorant Garamond (self-hosted WOFF2); body font: DM Sans or Inter |
| VIS-04 | Body text constrained to 680px max-width column; simulations may break to full width |
| VIS-05 | Mobile-friendly layout: all controls reflow correctly at 375px viewport width |
| VIS-06 | WCAG AA contrast (4.5:1 for text, 3:1 for UI components) |
| VIS-07 | `prefers-reduced-motion` respected: animations slow or pause for users who set this |

### PERF — Performance

| REQ-ID | Requirement |
|--------|-------------|
| PERF-01 | Landing page loads in under 3 seconds on broadband |
| PERF-02 | Stop page simulation JS loads only for that stop (not all 50 at once) |
| PERF-03 | No heap allocations (new arrays/objects) inside simulation animation loops |
| PERF-04 | Total transfer per stop page under 500 KB |

---

## v2.0 Candidates (Next Milestone)

- Eras 3–5 stops (Classical Physics through Contemporary)
- Client-side search (Fuse.js or Pagefind)
- "Random stop" button
- Physics concept map / family tree visualization
- Quote card generator
- KaTeX equation rendering for stops that warrant it
- D3.js historical data charts (blackbody curves, photoelectric effect data)
- Dark/light mode toggle
- Open Graph images per stop for social sharing
- Animated era transition screens

---

## Out of Scope

| Item | Reason |
|------|--------|
| Backend / server-side processing | Static only — free hosting, zero maintenance |
| User accounts or progress sync | localStorage only for v1.0 |
| Full WCAG 2.1 AAA compliance | Minimum viable: AA; full PDOM is v2+ |
| Eras 3–5 fully implemented simulations | Scope control; deliver quality over quantity |
| Three.js 3D simulations | Adds complexity; most Era 1–2 physics is 2D |
| WebAssembly / Rapier | Overkill for Era 1–2 simulation complexity |
| Build pipeline / bundler | Static serving is sufficient for v1.0 |
