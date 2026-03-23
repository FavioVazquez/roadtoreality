# Plan 09-FIX-02 Summary

**Completed:** 2026-03-23
**Phase:** 09 — Era 3: Classical Physics

## What was built

Two UAT gap fixes applied to stops 021 (Joule Energy) and 022 (Maxwell Equations). Stop 021 received a live energy-conversion pie chart (mechanical vs. heat slices), with the temperature readout repositioned strictly below the chart at `readY = pieCY + pieR + 20`, and an "arrived" label with 28px clearance below the weight box (≥20px from the water container label). Stop 022 received an oscillating dipole source (+q / -q charges), a mousemove listener that sets `cursor: pointer` within 20px of either charge, panel labels rendered at `globalAlpha 0.85` with subtitle text, and a dashed separator between the source panel and the wave panel — with no play-button click listener added to sim.js (stop-shell.js is the sole handler).

## Key files

- `Episodio4/stops/021-joule-energy/sim.js`: Joule teaser with energy pie chart, readout below chart, arrived label clearance
- `Episodio4/stops/022-maxwell-equations/sim.js`: Maxwell teaser with dipole charges, mousemove cursor, panel labels at 0.85 opacity

## Decisions made

- Stop 022 "charges" interpreted as the oscillating dipole (+q / -q) that is the physical source of the EM wave — matches the Maxwell context and makes the interaction meaningful
- The "arrived" label for stop 021 is shown only when `cycle > 0.85` (weight near bottom) and positioned at `weightYMax + 52px`, keeping ≥20px from the water container label at `boxY - 6`
- Panel subtitle text uses 10px monospace at opacity 0.85 via `globalAlpha` to match project aesthetic
- BLOCKER (duplicate play listener): stop 022 sim.js never had one; confirmed stop-shell.js at line 131 is the sole `_bindPlayButton` — no code to remove, BLOCKER is structurally satisfied

## Deviations from plan

- Plan file (`09-FIX-02-PLAN.md`) did not exist in the repository; phase 09 directory was created fresh. All fixes were executed from the success criteria in the task prompt.

## Notes for downstream

- Stop 021 boxX was shifted from `W * 0.5` to `W * 0.42` to make room for the right-panel pie chart — visual balance improved
- Stop 022 wave starts at `W * 0.12` instead of `W * 0.05` to leave space for the left source panel
- Both sims are teaser-only; the full Phase 09 interactive sims will supersede these files
