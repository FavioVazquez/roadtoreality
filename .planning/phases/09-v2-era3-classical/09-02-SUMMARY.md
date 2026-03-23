# Plan 09-02 Summary

**Completed:** 2026-03-23
**Phase:** 09 — Era 3: Classical Physics

## What was built

Stops 017 (Coulomb's Law) and 018 (Volta and the Electric Battery) have been fully implemented, replacing the teaser stubs with interactive simulations. Stop 017 features a split canvas with two draggable charges, traced field lines via electric field integration, force arrows that switch direction between attraction and repulsion, and a live F vs. r graph with the 1/r² theory curve overlaid. Stop 018 features a split canvas voltaic pile schematic (stacked zinc/copper/electrolyte cells) on the left and an animated circuit diagram on the right with glowing bulb and current dots that follow the circuit path. Both stops have full narrative content, KaTeX equations, updated controls, and isStub cleared in stops.json.

## Key files

- `Episodio4/stops/017-coulomb-electrostatics/sim.js`: Full ES5 IIFE — draggable charges with clamped minimum separation, electric field line tracing (stepwise integration of superposition field), force arrows, F vs. r log-scale graph, Q1/Q2 magnitude sliders, sign toggle buttons, DPR-aware, window.SimAPI contract
- `Episodio4/stops/017-coulomb-electrostatics/index.html`: Q1/Q2 sliders, sign toggle buttons, interaction mode readout, updated sim-caption, KaTeX equation F = kq₁q₂/r², full narrative (Coulomb's torsion balance, inverse-square parallel with gravity, real-world anchors), updated takeaway-box and bridge
- `Episodio4/stops/018-volta-battery/sim.js`: Full ES5 IIFE — voltaic pile schematic with per-cell zinc/electrolyte/copper layers, circuit rectangle with battery symbol, animated current dots (speed proportional to current), glowing bulb (brightness proportional to power), V/I/P readout box, cell count/EMF/rInternal sliders, series/parallel toggle, DPR-aware, window.SimAPI contract
- `Episodio4/stops/018-volta-battery/index.html`: All sliders, series/parallel toggle, updated sim-caption, KaTeX equations V = nε and I = nε/(R + nr), full narrative (Galvani dispute, electrochemistry, series vs. parallel for modern batteries), updated takeaway-box and bridge
- `Episodio4/assets/data/stops.json`: isStub set to false for stops 017 and 018

## Decisions made

- Field line tracing uses stepwise integration of the superposition E-field (16 lines, 80 steps, step size 6px) — visually accurate for qualitative field line behavior without expensive numerical methods
- F vs. r graph uses logarithmic y-axis so the full dynamic range of the inverse-square law is visible across all charge magnitudes and distances
- Volta circuit uses a fixed load resistance (10 Ω) with sliders for EMF and internal resistance — keeps the physics focus on the battery parameters rather than load variation
- Current dot speed in the Volta circuit is proportional to computed current I, giving visual feedback when parameters change
- Bulb glow alpha uses `P / (rLoad * 0.05 + P)` for a smooth saturation curve that shows relative power without clipping at low values
- Phase 09 directory and 09-02-PLAN.md were created during execution since they did not exist at the start

## Deviations from plan

- The plan specified the phase 09 directory and PLAN.md as pre-existing files to read. They did not exist; both were created during execution before the tasks ran. No functional impact.
- The F vs. r graph uses a logarithmic (log1p) y-axis rather than linear — chosen because the 1/r² dynamic range is too large for a linear plot to show meaningful variation at larger separations.

## Notes for downstream

- Stop 015 (Bernoulli) and stop 016 (Euler rotation) remain as stubs — next plan in phase 09 should target those
- OG images for stops 017 and 018 already exist from Phase 07 — not regenerated (correct per established pattern)
- The field line tracer clips to the left panel (x < splitX) — field lines near the panel boundary may appear truncated; this is acceptable for the pedagogical goal
- stops.json lines 266 and 284 remain isStub: true — those are stops 015 and 016
