# Plan 10-03 Summary

**Completed:** 2026-03-25
**Phase:** 10 — Era 4: Modern Physics Part A

## What was built

Stop 031 (E = mc²) received a complete interactive simulation replacing the
teaser animation. The sim features a logarithmic mass slider (0–300 range
covering 1e-6 kg to 1 kg) with live scale references (TNT equivalent in
kilotons or megatons, Hiroshima-scale bombs, city power hours), plus a
velocity slider (0–0.99c) that renders stacked rest energy and relativistic
kinetic energy bars using the full SR formula E² = (pc)² + (mc²)² with
p = γmv. The index.html narrative explicitly explains the p=0 special case
and both equations appear in KaTeX.

## Key files

- `HowPhysicsWorks/stops/031-einstein-emc2/sim.js`: Full ES5 IIFE simulation with DPR canvas, two-panel layout, formatEnergy() helper switching across J/kJ/MJ/GJ/TJ/PJ/EJ, formatMass() helper, logarithmic mass slider, relativistic velocity panel, prefers-reduced-motion check, window.SimAPI set synchronously.
- `HowPhysicsWorks/stops/031-einstein-emc2/index.html`: Two sliders, three narrative sections, KaTeX takeaway box with both E=mc² and full SR equation, removed teaser stub content.
- `HowPhysicsWorks/assets/data/stops.json`: Stop 031 isStub changed from true to false.

## Decisions made

- Used logarithmic normalization (log10 scale 0–18) for the energy bar width so it remains readable across 18 orders of magnitude.
- Normalized velocity panel bars against the energy at 0.99c (max slider) so the rest energy bar fraction shrinks visually as velocity increases — making the KE growth visually dramatic.
- sigfig3() helper used for scale reference labels to avoid runaway decimal places.
- glowT animation variable drives subtle pulsing brightness on bars when running; no physics state changes during animation loop.

## Deviations from plan

- The plan specified `formatEnergy()` returning `j.toFixed(1)` for values < 1000 J with "3 significant figures" noted; the implementation returns `toFixed(1)` for the J range (consistent with the code block in the plan) and `.toFixed(3)` for all larger unit ranges. This matches the plan's code block exactly.
- `formatMass()` for the < 1g range uses `.toFixed(4)` to show sub-milligram precision, giving enough resolution across the 6-order-of-magnitude slider range.

## Notes for downstream

- Stop 031 is now the most complex single-stop sim in Phase 10 as planned. Stops 032+ can reference this pattern for two-panel canvas layouts.
- The velocity slider wiring pattern (slider 0–990 → divide by 1000 → betaVel) is consistent with what Plans 10-01/10-02 used for stops 029/030 teasers; future SR stops should continue this pattern.
- stops.json now has 27 stops with isStub: false.
