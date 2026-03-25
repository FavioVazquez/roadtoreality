# Plan 10-09-FIX Summary

**Completed:** 2026-03-25
**Phase:** 10 — Era 4: Modern Physics Part A

## What was built

Three focused UAT round-2 fixes were applied to stops 031, 032, and 033.
Stop 031's invisible ±2px sphere pulse was replaced with expanding concentric
golden shockwave rings that radiate outward from the energy sphere while
running and vanish on pause/reset, making the animated state obviously
distinct. Stop 032's aim slider was constrained with `max-width:140px` so it
no longer overflows its container at narrow viewports. Stop 033's Balmer
spectrum lines were made clearly visible with a 3px core line, a wide 6px
glow pass behind each line, deduplication within ±3nm, and a white flash
animation for newly added lines that settles to the emission color over 20
frames.

## Key files

- `HowPhysicsWorks/stops/031-einstein-emc2/sim.js`: adds `rings[]` array, spawns one ring per 40 frames at the sphere surface, draws/advances rings after the main panels, clears rings on pause and reset; removes old pulse variable
- `HowPhysicsWorks/stops/032-rutherford-nucleus/index.html`: adds `max-width:140px` to `#aim-slider` input style
- `HowPhysicsWorks/stops/033-bohr-atom/sim.js`: adds `flashLines{}` countdown map, deduplication loop in `triggerJump`, enhanced `drawSpectrumBar` rendering loop, flash decrement in `drawBohr`, clears on reset and phase switch

## Decisions made

- Ring spawn cadence: every 40 frames (≈0.67 s at 60 fps) — fast enough to feel continuous but not cluttered at small sphere sizes
- Ring expansion: 1.5 px/frame, alpha decay 0.012/frame — rings last ≈58 frames and travel ≈87px, well past any sphere radius
- Ring drawing happens inside the `if (running && !reduced)` block, after panels are drawn, so rings overlay the sphere correctly
- Sphere center for rings is recomputed from the same panel geometry constants (no new parameters passed)
- Flash duration: 20 frames (≈0.33 s at 60 fps) — noticeable but not distracting
- Deduplication threshold: ±3nm — covers rounding differences in repeated same-transition clicks

## Deviations from plan

- Ring drawing is placed inside the `if (running && !reduced)` block in `drawFrame` (after both panel draw calls) rather than inside `drawEnergySphere`. This achieves the same visual result without changing the function signature of `drawEnergySphere`, which does not expose `cx`/`cy` externally. The ring centre is computed from the same panel geometry variables already available in `drawFrame`.
- `ring.startR` field omitted — the plan noted it could be simplified by "decrementing alpha at a fixed rate regardless of position," which is what was implemented (no progress-based formula needed).
- The `Math.round(glowT / 0.05) % 40 === 0` condition from the plan was used as written; a `frameCount` local variable captures it for clarity.

## Notes for downstream

- Stop 031: if the mass slider is at a very low value the sphere radius is ~4px and rings will appear nearly at the centre — this is correct and expected.
- Stop 033: `drawStatic` does not decrement flash countdowns (it is a static snapshot). If a line is added while paused, the flash will appear on the next `drawBohr` call and count down normally during animation. Lines added via click while running flash correctly.
- All three files remain ES5-compatible (no `const`/`let`/arrow functions).
