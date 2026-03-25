# Plan 10-06-FIX Summary

**Completed:** 2026-03-25
**Phase:** 10 — Era 4: Modern Physics Part A

## What was built

Four fixes and enhancements were applied to Stop 032 (Rutherford Nucleus). The aim mode toggle now explicitly sets `display: flex` so the slider row renders correctly without layout overlap. Aim mode gained an animated alpha particle that travels along the computed hyperbolic path when Play is pressed, with looping progress and reset support. The canvas foil label now uses a Z-keyed element name lookup table instead of the hardcoded string "Au foil". Four preset buttons (H, C, Fe, Au) were added to the controls and wired to dispatch input events on the charge slider.

## Key files

- `HowPhysicsWorks/stops/032-rutherford-nucleus/sim.js`: All four changes — display fix, animated particle with `buildAimPathPoints()` and `progress` state, `ELEMENT_NAMES` lookup table + `elementLabel()`, preset button wiring in `wireControls()`
- `HowPhysicsWorks/stops/032-rutherford-nucleus/index.html`: Added preset button row (H, C, Fe, Au) in the sim-controls section

## Decisions made

- Path points are computed as 60 evenly spaced points: 30 on the incoming segment (left edge to foil), 30 on the outgoing segment (foil to off-canvas). Linear interpolation between points gives smooth animation.
- Progress advances at 0.008 per frame (approximately one full traversal per 2 seconds at 60fps) and loops back to 0 at 1.0.
- The charge slider handler was updated to call `drawAimMode()` instead of `drawStatic()` when in aim mode, so slider changes reflect correctly in both paused and running states.
- `SimAPI.reset()` now draws `drawAimMode()` or `drawStatic()` depending on current mode, rather than always `drawStatic()`.
- Preset button closures use an IIFE to correctly capture each preset object in the ES5 `for` loop.

## Deviations from plan

- None. All four tasks implemented exactly as specified.

## Notes for downstream

- `ELEMENT_NAMES` covers a curated set of Z values (1–92); unlisted Z values fall back to "Z=N foil" format.
- The animated particle dot replaces the static dot at the foil junction — the static path lines remain always visible as the preview trajectory.
- The charge readout label still only shows "(Gold)" and "(Hydrogen)" special-cases; consider extending it to use `ELEMENT_NAMES` for consistency if desired in a future pass.
