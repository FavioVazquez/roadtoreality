# Plan 10-02 Summary

**Completed:** 2026-03-25
**Phase:** 10 — Era 4: Modern Physics Part A

## What was built

Two fully independent production-quality Special Relativity simulations replaced the existing stub teasers. Stop 029 implements the twin paradox: two stick-figure twins with age counters that diverge live as the user drags a velocity slider from 0 to 0.99c, with a live gamma readout, age-gap panel, and a small gamma-vs-beta graph in the corner. Stop 030 implements length contraction: a train-car shape that squashes only horizontally as velocity increases, with a fixed ghost outline of the rest length for visual comparison and a live L readout. Both stops received updated narrative sections and KaTeX formulas.

## Key files

- `HowPhysicsWorks/stops/029-special-relativity-time/sim.js`: Full twin paradox ES5 IIFE sim — DPR canvas, velocity slider (0–990), gamma computation, diverging age counters, gamma-vs-beta curve panel, rocket animation, prefers-reduced-motion, SimAPI.
- `HowPhysicsWorks/stops/029-special-relativity-time/index.html`: Updated with velocity slider (id=velocity-slider), gamma readout, three narrative sections (Twin Paradox, Lorentz Factor, Not an Illusion), KaTeX Δt = γΔt₀ and γ formula, removed teaser caption and "Want to contribute" link.
- `HowPhysicsWorks/stops/030-special-relativity-length/sim.js`: Full length contraction ES5 IIFE sim — DPR canvas, velocity slider (0–990), contracted train-car with gradient fill, fixed ghost dashed outline for comparison, tick marks on both shapes, direction-of-motion arrow, live L readout panel, animation where car moves rightward at speed proportional to beta.
- `HowPhysicsWorks/stops/030-special-relativity-length/index.html`: Updated with velocity slider, L readout, three narrative sections (Space Compresses, Only Along Motion, Same Root Cause), KaTeX L = L₀/γ formula, removed teaser caption and "Want to contribute" link.
- `HowPhysicsWorks/assets/data/stops.json`: isStub set to false for orders 29 and 30.

## Decisions made

- Velocity slider uses range 0–990, divided by 1000 for beta precision (3 decimal places, no floating-point snap issues).
- At beta < 0.001, gamma is hard-clamped to 1.000 to prevent floating-point noise in the display.
- Stop 029 shows both twins' base age starting at 30 yr, with accumulated time added at 0.5 yr/unit. This keeps counters at readable human-scale values.
- Stop 030 animation: the car's horizontal position offset is reset when it exits the visible region, giving a smooth looping motion. Width contraction is computed in pixels as `baseWidth * (L/L0)`.
- Both sims mount directly to `#sim-mount` and wire sliders via `getElementById` per established Phase 10 pattern.

## Deviations from plan

- The Stop 029 "essentially zero at this speed" message is shown in the age-gap panel at the center bottom of the canvas (not as a canvas overlay text), which integrates better with the layout.
- Stop 030 tick marks on the contracted car use a reduced count proportional to the current contraction ratio, which visually reinforces spatial compression without overcrowding when squashed.
- The gamma graph (Stop 029) uses a max gamma of 10 for the y-axis scale; values above 10 are clipped to the top edge (only relevant above ~0.995c which is beyond the slider range).

## Notes for downstream

- Both stops now have `isStub: false` in stops.json — the landing page progress indicator will count them as complete.
- The takeaway-box formula divs use class `takeaway-box__formula` — verify that class has display:block or adequate spacing in components.css if rendering looks cramped.
- Stop 031 (E=mc²) is the next Modern Physics stop and remains a stub.
