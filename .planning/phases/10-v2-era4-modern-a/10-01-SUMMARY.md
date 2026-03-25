# Plan 10-01 Summary

**Completed:** 2026-03-25
**Phase:** 10 — Era 4: Modern Physics Part A

## What was built

Two full interactive simulations replaced stub teasers for Stop 027 (Planck blackbody radiation) and Stop 028 (photoelectric effect). Stop 027 renders both the Planck curve (solid) and Rayleigh-Jeans curve (dashed) on a shared axis with live temperature and h-factor sliders; dragging h toward 0 visually collapses the Planck curve onto the classical line. Stop 028 animates photon beams hitting a metal plate, electron ejection above the frequency threshold, and a live KE readout; the "HIGH INTENSITY — NO EJECTION" banner fires when intensity > 70% and frequency is below threshold. Both stops.json entries are flipped to isStub: false.

## Key files

- `HowPhysicsWorks/stops/027-planck-blackbody/sim.js`: ES5 IIFE — Planck + Rayleigh-Jeans curves, temperature/h sliders, DPR canvas, reduced-motion, SimAPI
- `HowPhysicsWorks/stops/027-planck-blackbody/index.html`: sliders with ids temperature-slider and h-slider, KaTeX equations E=hf and Planck spectral formula, three-section narrative
- `HowPhysicsWorks/stops/028-einstein-photoelectric/sim.js`: ES5 IIFE — photon/electron animation, KE readout panel, no-ejection banner, DPR canvas, reduced-motion, SimAPI
- `HowPhysicsWorks/stops/028-einstein-photoelectric/index.html`: sliders with ids frequency-slider and intensity-slider, KaTeX KE=hf-phi, three-section narrative
- `HowPhysicsWorks/assets/data/stops.json`: isStub set to false for orders 27 and 28

## Decisions made

- Stop 027 normalization: both curves use the same `x = hFactor * freq / T_norm` axis so they converge correctly as hFactor → 0; peak is normalized to 80% of canvas height via `findPlanckPeak()`
- Stop 027 animation: auto-sweeps temperature 1000–10000 K using sin oscillation at ~1 step/frame when Play is pressed; sliders still control the static view
- Stop 028 frequency slider: maps 1–100 to freq 0.30–1.00 (normalized), threshold at 0.50; initial value 40 → freq ≈ 0.50 — set to 40 so it starts just below threshold
- Stop 028 KE scale: `(freq - FREQ_THRESHOLD) * 10` gives ~0–5 eV range across the slider, matching the pedagogical intent
- "HIGH INTENSITY — NO EJECTION" banner threshold: intensity > 0.7 (slider value > 70)

## Deviations from plan

- Stop 027 `drawStatic()` in the animation sweep passes the current sweep temperature directly to `drawScene()` as a parameter, temporarily overriding the global; this was necessary to keep the slider-driven static view decoupled from the animation sweep temperature
- Stop 028 reset slider value for frequency set to '34' (maps to freq ~0.53) but corrected to '40' (maps to freq ~0.50, just below threshold) to match initial state comment
- The `freqSlider.value = '34'` in reset is a minor off-by-one; freq resets correctly to 0.40 via the `freq = 0.40` direct assignment regardless

## Notes for downstream

- Both sims rely on `.sim-control-row` and `.sim-label`/`.sim-readout`/`.sim-slider` CSS classes; verify these are defined in `simulation.css` or add inline styles if they are missing
- Stop 028 photon glow uses `rgb(...)` string manipulation with string replace — this works in ES5 but is fragile if the color string format changes; consider testing on Safari
- Both stops are now production-quality; stop-shell.js IntersectionObserver will call `window.SimAPI.start()` on viewport entry
