# Phase 09: Era 3 — Classical Physics — Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement all 12 Classical Physics stub stops (015–026): Bernoulli through Michelson-Morley.

Deliverables per stop:
- Full `sim.js` with real interactivity (not just play/pause)
- Updated `index.html` with narrative content and KaTeX equations
- `isStub: false` in `stops.json`

Does NOT touch Era 4 or Era 5 stops — those are Phases 10–13.

Stops in scope:
- 015 Bernoulli's Principle
- 016 Euler and Rigid Body Rotation
- 017 Coulomb's Law
- 018 Volta and the Electric Battery
- 019 Faraday's Electromagnetic Induction
- 020 Carnot and the Heat Engine
- 021 Joule and Conservation of Energy
- 022 Maxwell's Equations
- 023 The Doppler Effect
- 024 Boltzmann and Entropy
- 025 Hertz and Radio Waves
- 026 The Michelson-Morley Experiment

</domain>

<decisions>
## Implementation Decisions

### Interactivity (all stops)
- Every sim must give the user something to manipulate: sliders, draggable objects, adjustable parameters, removable elements, or interactive controls.
- Play/pause-only sims are not acceptable. Minimum bar: 2 meaningful interactive controls per stop.
- The interaction should make the underlying physics clearer — user manipulates a variable and sees the consequence.

### KaTeX Equation Depth
- Embrace the full equation set where the physics calls for it.
- Maxwell's equations: all 4 (Gauss electric, Gauss magnetic, Faraday, Ampère-Maxwell) in display form.
- Boltzmann: Maxwell-Boltzmann distribution f(v) + Boltzmann entropy S = k ln Ω.
- All other stops: include all equations relevant to understanding the stop's core concept.
- Do not artificially limit to 1–2 equations if the physics is richer.

### Stop 022 — Maxwell's Equations (two-panel sim)
- **Panel 1 — Field lines:** User drags positive and negative point charges around the canvas; field lines redraw live showing the electric field configuration.
- **Panel 2 — EM wave:** Sliders for frequency and amplitude; wave propagates in real time with E and B fields drawn as perpendicular oscillating vectors.
- Both panels active simultaneously; user switches focus naturally.

### Stop 024 — Boltzmann and Entropy (two-panel sim)
- **Panel 1 — Particle gas:** Temperature slider; particles bounce around the canvas; Maxwell-Boltzmann speed distribution histogram updates live as temperature changes.
- **Panel 2 — Entropy:** Particles start in one corner (ordered state); user removes a partition wall; particles spread and entropy meter climbs in real time. Reset returns to ordered state.
- Both panels active simultaneously.

### Stop 026 — Michelson-Morley (three-mode interactive)
- **Mode 1 — Expected vs. Found:** Split-screen showing what the aether hypothesis predicted vs. what was actually observed; rotation slider lets user rotate the apparatus and see both outcomes side by side.
- **Mode 2 — Speed-of-light race:** Two light beams race along perpendicular arms; user rotates the apparatus; both beams always arrive simultaneously (the null result).
- **Mode 3 — Interferometer:** User adjusts arm length ratio; fringe pattern shifts accordingly; equal arms = null result shown explicitly.
- Tabs or segmented control to switch between modes.

### Claude's Discretion
- Stops 015–021, 023, 025: specific sim interaction model (e.g., which sliders, what draggable) chosen by planner based on what best illustrates the physics — follow the established Canvas 2D, ES5 IIFE, window.SimAPI pattern.
- Era 3 color coding for stop cards follows existing `stops.json` era field — no changes needed.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `stop-shell.js`: wires SimAPI, handles play/pause/reset buttons, IntersectionObserver autoplay — all sims get this for free
- `assets/css/simulation.css`: `.sim-container`, `.sim-controls`, `.sim-btn`, slider styles — use as-is
- KaTeX: already self-hosted under `assets/katex/`, auto-renders `$...$` and `$$...$$` — just write the LaTeX in the HTML

### Established Patterns
- `window.SimAPI = { start, pause, reset, destroy }` — set synchronously during script execution
- Canvas sized to `mount.clientWidth / clientHeight` on init; redraw on resize via ResizeObserver or window resize event
- ES5 IIFEs — no arrow functions, no const/let (use var), no template literals in complex expressions
- `prefers-reduced-motion` check before starting animation loops
- Sim layout: `#sim-mount` div receives the canvas; controls declared in HTML, wired in sim.js or stop-shell.js
- Phase 08 sims (~500 lines each) are the complexity baseline — complex sims like 022/024/026 may run longer

### Integration Points
- `stops.json`: set `isStub: false` per stop when sim is complete
- `index.html` per stop: update `#stop-config` JSON script tag if any metadata changes; add KaTeX equations to `.takeaway` section
- No changes needed to nav.js, progress.js, or search.js

</code_context>

<specifics>
## Specific Ideas

### Stop 026 — Michelson-Morley
User explicitly requested maximum interactivity: all three modes (expected vs. found split-screen, speed-of-light race, interferometer) available in a single sim with tab/mode switching. This is the most complex sim of the phase — plan accordingly.

### Stop 022 — Maxwell
Two-panel layout; both panels simultaneously active. Field lines must redraw live on charge drag (not on release).

### Stop 024 — Boltzmann
Partition wall removal is the key interaction — it should feel like physically pulling a divider out. The entropy meter rising in real time as particles spread is the "aha" moment.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 09-v2-era3-classical*
*Context gathered: 2026-03-23*
