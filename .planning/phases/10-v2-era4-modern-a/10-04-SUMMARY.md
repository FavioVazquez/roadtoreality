# Plan 10-04 Summary

**Completed:** 2026-03-25
**Phase:** 10 — Era 4: Modern Physics Part A

## What was built

Stop 032 (Rutherford gold foil scattering) received a full interactive simulation with a stream mode particle pool of 8 alpha particles recycled off-canvas, Coulomb-correct deflection via `theta = 2 * atan(D / b)`, a manual aim mode with impact parameter slider, and a nucleus charge slider (Z 1–79) that scales scattering distribution. Stop 033 (Bohr atom) implements the required two-phase pedagogical UX: a classical spiral collapse lasting 3.5 seconds ending with a white radial flash at the nucleus, a Bohr toggle button locked until collapse completes, then stable quantized orbits n=1–4 with click-to-jump transitions, flying photon particles, and a live-building Balmer emission spectrum bar. Both stops received updated index.html with full narrative, KaTeX equations, and controls.

## Key files

- `HowPhysicsWorks/stops/032-rutherford-nucleus/sim.js`: ES5 IIFE — DPR canvas, 8-particle stream pool, Rutherford formula deflection, mode toggle (stream/aim), nucleus charge slider, aim slider, `window.SimAPI`
- `HowPhysicsWorks/stops/032-rutherford-nucleus/index.html`: Controls with `id="mode-toggle"`, `id="nucleus-charge-slider"`, `id="aim-slider"`; three narrative sections; KaTeX Rutherford formula
- `HowPhysicsWorks/stops/033-bohr-atom/sim.js`: ES5 IIFE — DPR canvas, classical spiral collapse 3.5s, flash at nucleus, Bohr toggle (disabled during collapse), 4 orbit rings, electron jump on click, spectrum bar with Balmer line colors, `window.SimAPI`
- `HowPhysicsWorks/stops/033-bohr-atom/index.html`: Controls with `id="bohr-toggle-btn"` disabled initially, hint text, three narrative sections, KaTeX `E_n = -13.6/n^2` and delta-E formulas
- `HowPhysicsWorks/assets/data/stops.json`: `isStub: false` for orders 32 and 33

## Decisions made

- Rutherford deflection formula uses signed outAngle: above-center particles (sign>0) scatter upward `outAngle = -(pi - theta)`, below-center scatter downward `outAngle = (pi - theta)`; this gives correct bi-directional scatter distribution
- Stream mode uses semi-transparent background clear (`rgba(10,0,20,0.18)`) to create brief trail persistence without storing trail arrays per particle
- Bohr BOHR_RADII chosen as `[0, 28, 62, 108, 162]` pixels to fit comfortably within a ~400px canvas height while leaving room for the spectrum bar at bottom
- Collapse uses `r = r_max * exp(-3.5 * progress)` with `progress = elapsed / 3500` giving clean exponential decay to near-zero in exactly 3.5 seconds
- Manual aim mode (032) draws trajectory statically on every frame rather than animating a single flying particle, giving a cleaner interactive feel

## Deviations from plan

- The aim-slider-row container uses `id="aim-slider-row"` with `display:none` initially and `display:flex` when toggled; the plan specified `display:none` via inline style, which was implemented exactly
- The `wireControls()` function is called after `resize()` to ensure H is set before any slider wiring references it; collapseBohrBtn reference is captured inside wireControls rather than as a bare global assignment

## Notes for downstream

- Stop 032 stream mode particle recycling: particles are reset when `isOffCanvas` returns true; the pool naturally avoids pileup near nucleus since particles exit before being recycled
- Stop 033 Reset button (handled by stop-shell.js calling `SimAPI.reset`) correctly restarts the classical collapse from scratch and re-disables the Bohr toggle button
- Both sim.js files are pure ES5 — no arrow functions, no const/let, no template literals
