# Plan 10-08-FIX Summary

**Completed:** 2026-03-25
**Phase:** 10 — Era 4: Modern Physics Part A

## What was built

Replaced the ruler-like rounded rectangle in Stop 030 (Special Relativity: Length Contraction) with a recognisable train car silhouette. The `drawCar(cx, cy, w, h, isGhost)` helper renders a gradient body with a roof panel, two windows, four wheels with hub highlights, and an undercarriage bar. All elements except wheel radius scale horizontally with the contracted width `w`, so windows visibly squash at high velocity. The ghost outline at rest length uses the same function with a dashed purple stroke. The `drawTicks()` function was removed entirely.

## Key files

- `HowPhysicsWorks/stops/030-special-relativity-length/sim.js`: complete rewrite of the drawing layer — `drawCar()` + `roundedRect()` helpers replace the old rect+ticks approach; all physics (gamma, L = L0/gamma, slider wiring, SimAPI) unchanged.

## Decisions made

- Wheels use a fixed radius (`carH * 0.18`) so they do not squash with velocity — only the body, roof, windows, and undercarriage bar contract horizontally.
- Ghost car is drawn at the upper vertical position (H * 0.38) and the contracted moving car at H * 0.62, giving clear vertical separation for comparison.
- Window glint (small bright rect) is only drawn when `winW > 8 px` to avoid artefacts at extreme contraction.
- The file stays pure ES5 IIFE with DPR pattern and prefers-reduced-motion check, matching the project's sim.js conventions.

## Deviations from plan

- Plan specified ghost at the same vertical band as the moving car; the existing code already used two separate vertical rows (ghost above, moving car below). The two-row layout was kept because it makes the rest-length vs contracted-length comparison clearer — both cars are fully visible simultaneously.
- `drawCar` signature uses `cx, cy` (centre) rather than `x, y, isGhost` with separate alpha param as the plan described, but achieves the same interface contract.

## Notes for downstream

- The L readout in the panel still shows `L = 14.1 m` at v = 0.99c — physics unchanged.
- The sim remains a single file with no external dependencies — no asset imports needed for the train car (pure Canvas 2D).
