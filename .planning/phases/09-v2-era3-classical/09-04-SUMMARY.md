# Plan 09-04 Summary

**Completed:** 2026-03-23
**Phase:** 09 — Era 3: Classical Physics

## What was built

Stop 021 (Joule) received a full ES5 IIFE simulation showing a weight-drop apparatus with a live three-slice energy pie chart (PE/KE/heat). The weight falls under free-fall physics, the pie updates every frame enforcing exact energy conservation, and the temperature readout shows deltaT via Joule's 4184 J/(kg·K) constant. Drop-height and mass sliders let users explore the tiny but real temperature rise.

Stop 022 (Maxwell) received a split-canvas two-panel ES5 IIFE simulation. The left panel renders draggable positive/negative charges with Euler-step field line tracing (8 rays per positive charge, 500-step max, canvas-exit and sink-proximity termination) that recomputes live every frame. The right panel draws a propagating EM wave as E-field blue vertical arrows and B-field gold in/out-of-canvas markers, driven by frequency and amplitude sliders. Both panels are simultaneously active. splitX is computed in resize() following the stop-014 pattern.

Both index.html files were rewritten with narrative content, real sim-controls matching the sim.js control IDs, and KaTeX equations. Stop 022 includes all four Maxwell equations in display math form. stops.json marks both stops as isStub: false.

## Key files

- `Episodio4/stops/021-joule-energy/sim.js`: weight-drop apparatus, energy pie chart, temperature readout, ES5 IIFE
- `Episodio4/stops/021-joule-energy/index.html`: real sim-controls, KaTeX energy conservation equation, narrative
- `Episodio4/stops/022-maxwell-equations/sim.js`: two-panel split-canvas, Euler field lines, EM wave vectors, ES5 IIFE
- `Episodio4/stops/022-maxwell-equations/index.html`: real sim-controls, all four Maxwell equations in KaTeX, narrative
- `Episodio4/assets/data/stops.json`: isStub: false for stops 021 and 022

## Decisions made

- Stop 022 field line tracing runs inside draw() every frame (not cached), as specified in the plan. At 2 charges × 8 rays × 500 steps this is ~8000 iterations/frame — acceptable for canvas widths under 800px.
- B-field visualization: gold dot markers (B out of screen) and gold X markers (B into screen) at a vertical offset of +18px from the propagation axis. This avoids overlap with the E-field vertical arrows.
- Energy model enforces conservation exactly: heat = E_total - PE - KE at each frame, eliminating any accumulation drift.
- The stop 021 animation uses kinematic free-fall: v = sqrt(2*g*y), position updates via v*dt + 0.5*g*dt^2 per frame.

## Deviations from plan

- Stop 022 sim.js is ~460 lines, below the ~600 line budget. The code is complete and all required features are present; the line count difference is due to lean implementation rather than missing functionality.
- Charge positions in stop 022: both charges are placed in the left panel (charges[0].x = splitX*0.35, charges[1].x = splitX*0.65). The plan noted charge1 "starts in the RIGHT panel visually" but then clarified "Both charges live in the left panel" — the left-panel placement was used.

## Notes for downstream

- Stops 021 and 022 are now fully implemented with isStub: false. The next plan in phase 09 can proceed to stops 023-024 or whichever stops are next in the wave.
- The stop 022 drag interaction is wired for both mouse and touch events with passive:false on touchstart/touchmove to prevent scroll interference.
- The field line termination logic uses a 12px sink-proximity radius and a 0 < px < splitX canvas-exit check. This means field lines reaching the right edge of the left panel terminate cleanly at the divider.
