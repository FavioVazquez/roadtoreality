# Phase 08: Era Gap Fills — Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the two remaining stub stops in Eras 1–2:
- Stop 002: Pythagoras and Mathematical Harmony (Web Audio API + Canvas 2D)
- Stop 014: Hooke's Law and Elasticity (Canvas 2D spring + F vs. x graph)

Both pages already have: HTML shell, stub sim.js, KaTeX wired, OG images committed.
Deliverables per stop: full `sim.js`, updated `index.html` (content + KaTeX equation), `isStub: false` in `stops.json`, OG PNG regenerated.

Does NOT implement any Era 3–5 stops — that is Phases 09–13.

</domain>

<decisions>
## Implementation Decisions

### Stop 002 — Pythagoras: Mathematical Harmony

**Audio/visual balance:**
- Sound is primary — this stop is literally about music. The standing wave canvas reinforces what the ear hears.
- Auto-play tone on ratio selection; silent fallback message for browsers requiring a user gesture (AudioContext suspended until click).

**Interaction model:**
- Six ratio buttons: 1:1 (unison), 2:1 (octave), 3:2 (perfect fifth), 4:3 (perfect fourth), 5:4 (major third), 9:8 (whole tone)
- Continuous string-length slider as an alternative way to explore (ratio label updates to nearest named interval)
- Selecting a ratio: plays tone + animates standing wave showing correct harmonic number (n=1 fundamental, n=2 octave, etc.)
- Display: frequency ratio fraction + interval name + harmonic number visible as labels on canvas

**Audio implementation:**
- Web Audio `OscillatorNode` (sine wave, base ~220 Hz) with `GainNode` envelope
- Attack 10ms, decay 800ms — sounds like a plucked string, not a continuous drone
- No looping tone
- Ratio multiplies base frequency: octave = 440 Hz, fifth = 330 Hz, etc.

**`data-autoplay`:** `false` — user clicks a ratio button to activate first sound

**KaTeX equation for takeaway box:**
$$f_n = n \cdot f_1, \quad n = 1, 2, 3, \ldots$$

---

### Stop 014 — Hooke's Law and Elasticity

**Scope — elastic + plastic + rupture:**
- Full story shown: elastic zone (F = kx, linear), plastic zone (non-linear yielding), rupture
- Elastic zone is the primary teaching point; plastic + rupture give memorable context for limits
- Material selector with 3 presets:
  - Steel: high k (~500), small elastic range, abrupt brittle rupture
  - Rubber: low k (~50), very large elastic range, gradual rupture
  - Glass: very high k (~800), tiny elastic range, instant snap

**F vs. x graph:**
- Shows complete curve for the selected material
- Elastic region: era color (revolution green `#61bd67`)
- Plastic region: muted gray
- Rupture point: red dot
- Live tracking dot follows current position as weight slider moves
- Axes labeled: F (N) vertical, x (m) horizontal

**Spring canvas visual:**
- Coil spring drawn with correct physics proportions
- Stretches proportionally in elastic zone
- Coils spread unevenly (permanent deformation look) in plastic zone
- Snap animation + weight drops at rupture
- Weight block hangs below spring, mass shown as label

**Controls:**
- Weight slider (0 → max for material) — primary interaction
- Material selector (Steel / Rubber / Glass) — resets to elastic state

**`data-autoplay`:** `true` — spring oscillates gently on load; weight slider defaults to ~30% to show system in motion

**KaTeX equation for takeaway box:**
$$F = -kx$$

---

### Shared Sim Patterns (established, carry forward)
- Vanilla Canvas 2D IIFE, no p5.js or Matter.js for these stops
- `window.SimAPI = { start, pause, reset, destroy }` — mandatory contract
- `var` declarations (no `const`/`let`) — ES5 IIFE pattern used across all sims
- `IntersectionObserver` managed by `stop-shell.js` — sim must not start its own
- Canvas sized to `mount.clientWidth` on init; resize not required
- `stops.json`: set `isStub: false` for both stops after implementation
- Regenerate OG SVG + PNG for both stops after implementation

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Episodio4/stops/002-pythagoras-harmony/sim.js` — existing stub (standing wave teaser, no audio), to be replaced entirely
- `Episodio4/stops/014-hooke-elasticity/sim.js` — existing stub (spring-mass oscillation teaser), to be replaced entirely
- `Episodio4/stops/002-pythagoras-harmony/index.html` — full HTML shell, KaTeX wired, takeaway box present (needs equation + richer content)
- `Episodio4/stops/014-hooke-elasticity/index.html` — same
- `Episodio4/assets/data/stops.json` — `isStub: true` for both; update to `false`

### Established Patterns (from implemented sims 001, 003–013)
- All sims: IIFE, `'use strict'`, `window.SimAPI`, canvas appended to `#sim-mount`
- RK4 physics used for orbital/pendulum sims; simple Euler OK for spring (low velocity)
- `window.matchMedia('(prefers-reduced-motion: reduce)')` checked and respected
- Era colors used within canvas drawings (e.g., `oklch(0.72 0.15 145)` for revolution era)

### Integration Points
- `stop-shell.js` reads `data-autoplay` from `.sim-wrapper` and calls `SimAPI.start()` on intersection
- KaTeX `auto-render` scans for `$$...$$` and `$...$` — just place equations in HTML
- `stops.json` `isStub` field controls "Coming Soon" pill badge on landing page grid

</code_context>

<specifics>
## Specific Ideas

- Stop 002: The interval name (e.g., "Perfect Fifth") should be prominent — it's the memorable human label for what Pythagoras discovered
- Stop 014: The snap/break moment at rupture should feel satisfying — brief screen shake or flash to make it memorable

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 08-v2-era-gap-fills*
*Context gathered: 2026-03-22*
