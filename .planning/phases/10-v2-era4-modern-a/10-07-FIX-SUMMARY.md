# Plan 10-07-FIX Summary

**Completed:** 2026-03-25
**Phase:** 10 — Era 4: Modern Physics Part A

## What was built

Stop 031 (E=mc²) received two targeted improvements. First, the flickering
scale labels caused by `sigfig3()` using `Math.log10()` per frame were
replaced with three stable threshold-based formatters (`stableEnergyLabel`,
`bombLabel`, `cityPowerLabel`) that use fixed if-comparisons and never
recompute logarithms during rendering. Second, the abstract horizontal bar
panel was replaced with a glowing energy sphere (`drawEnergySphere`) that
grows logarithmically as the mass slider moves, with five annotated dashed
landmark lines (1 t TNT, 1 kt TNT, Hiroshima, 1 Mt TNT, City 1 yr) that
light up as the sphere grows past them. The velocity/relativistic energy
panel is unchanged.

## Key files

- `HowPhysicsWorks/stops/031-einstein-emc2/sim.js`: all changes — stable
  formatters added at lines 74–101; `drawEnergySphere()` replaces
  `drawMassPanel()` at lines 191–308; `drawFrame()` updated at line 182.

## Decisions made

- Used `Math.log()` (natural log) rather than `Math.log10()` for the
  radius mapping inside `energyToRadius()` — both are equivalent for
  fractional mapping but using `Math.log` is slightly faster and avoids
  the log10 association with the flickering bug.
- LOG_MIN/LOG_MAX are module-level constants computed once on load, not
  inside the draw loop.
- Landmark lines are clipped to the sphere area (`lmY < sphereAreaTop`
  guard) so they never render outside bounds at extreme slider positions.
- Panel split changed from 56% / 44% to 60% / 40% to give the sphere
  enough vertical room.

## Deviations from plan

- Plan specified `Math.log10` for `energyToRadius`; implementation uses
  `Math.log` (natural log) with matching LOG_MIN/LOG_MAX. Functionally
  identical — the fraction computed is the same ratio regardless of log base.
- `J_PER_KILOTON_TNT`, `J_PER_HIROSHIMA`, `J_PER_CITY_HOUR` constants from
  the original file are now unused (stable formatters embed their own
  constants inline per plan spec). They remain in the file as dead code but
  are harmless.

## Notes for downstream

- At slider=300 (1 gram), `stableEnergyLabel` returns "21.48 kt TNT" —
  stable, non-flickering, consistent with the ~21.5 kt requirement.
- The sphere pulse (±2px sin wave) only activates when `running` is true and
  `reduced` is false, respecting prefers-reduced-motion.
- `window.SimAPI` contract (start/pause/reset/destroy) is unchanged.
- Both KaTeX equations remain in the takeaway box in index.html (not touched
  by this plan).
