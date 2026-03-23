# Plan 09-FIX-03 Summary

**Completed:** 2026-03-23
**Phase:** 09 — Era 3: Classical Physics

## What was built

Stop 026 (Michelson-Morley) was upgraded from a single teaser animation to a
three-mode interactive interferometer. The sim now supports auto-rotation
(mode 1), manual rotation via slider (mode 2), and arm-ratio exploration
(mode 3). When the arm ratio is within 0.005 of 1.0 in mode 3, the detector
renders uniform mid-grey with a bold "NULL RESULT" label and no fringe stripes,
correctly communicating the historical null result.

## Key files

- `Episodio4/stops/026-michelson-morley/sim.js`: Full multi-mode sim with
  `drawModeInterferometer()`, `drawDetectorNull()`, `drawDetectorFringes()`,
  and `setMode()` controlling slider row visibility and the mode-hint text.
- `Episodio4/stops/026-michelson-morley/index.html`: Added `#sim-controls-026`
  with three mode buttons, `.row-rotation` slider row, `.row-arm-ratio` slider
  row, and `<p id="mode-hint">` below the slider rows.

## Decisions made

- `drawModeInterferometer()` is the single top-level draw function called each
  frame; it delegates to `drawApparatus()`, `drawDetectorNull()`, or
  `drawDetectorFringes()` based on mode and armRatio state.
- Null-result threshold set to `abs(armRatio - 1.0) < 0.005` (per plan spec).
- Slider display-value spans (`rot-slider-val`, `arm-slider-val`) are wired
  inside sim.js to keep all state management co-located.
- Mode 1 ignores the rotation slider (auto-animates); mode 2 uses it.

## Deviations from plan

- The plan file (09-FIX-03-PLAN.md) was not present in the repository at
  execution time; implementation was derived directly from the success criteria
  supplied in the objective prompt.

## Notes for downstream

- The `.row-rotation` `display` property is initially set to `flex` in HTML;
  `setMode(1)` called at init re-asserts the correct state, so no flicker risk.
- Mode buttons use `.active` class for styling — downstream CSS should define
  `.sim-btn.active` if a highlighted-button style is desired.
