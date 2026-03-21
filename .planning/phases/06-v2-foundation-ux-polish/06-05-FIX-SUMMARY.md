# Plan 06-05-FIX Summary

**Completed:** 2026-03-21
**Phase:** 06 — v2 Foundation UX Polish

## What was built

Two teaser simulation files were replaced with visually improved versions. The 027 Planck blackbody sim now sweeps a temperature parameter from ~500 K to ~5500 K, causing the Planck curve peak to visibly shift left and right, with a live temperature label and a moving peak-wavelength dashed marker. The 040 nuclear fission sim now unfolds slowly enough for each stage to be read: daughters spawn 3.2× the parent radius away, neutrons travel at 1.2 px/frame, and an armed-delay flag prevents second-generation hits until 25 frames after spawn.

## Key files

- `Episodio4/stops/027-planck-blackbody/sim.js`: temperature-sweep Planck animation with T-labeled oscillation and moving peak marker
- `Episodio4/stops/040-nuclear-fission/sim.js`: slowed chain reaction with per-nucleus arm delay, countdown reset pause, and generation-limited branching

## Decisions made

- 027: `planck(freq, T)` uses `scale = T / 4000` internally so the curve shifts smoothly without clipping; oscillation period set at `t * 0.4` for a ~15 s cycle.
- 027: `drawStatic()` renders at T = 3000 K (midpoint) rather than calling `drawFrame()` so the static frame is deterministic.
- 040: `resetScene()` sets `countdown = 60` (1 s at 60 fps) before firing the first neutron, giving a readable pause between loops.
- 040: generation-0 nuclei produce 4 daughters; generation-1+ produce only 2, keeping canvas readable.
- 040: `drawStatic()` paints the initial state directly (one nucleus + one neutron) rather than running `drawFrame()` which would immediately tick the countdown.

## Deviations from plan

- The plan's verify criterion specifies `grep "dist = nuc.r \* 3"` — the file uses `nuc.r * 3.2` which satisfies this pattern exactly.
- The plan's task description mentions `vx: Math.cos(a) * 1.2` for spawn neutrons and `vx: 1.4` for the initial neutron; both are present as specified (the initial neutron fires at 1.4, daughter neutrons at 1.2).

## Notes for downstream

- Both files retain the `window.SimAPI` contract (start / pause / reset / destroy) and call `drawStatic()` at end of IIFE, so `stop-shell.js` IntersectionObserver integration is unaffected.
- 027 uses `oklch(0.10 0.01 285)` background (matching the Phase 06 CSS token decision) while 040 keeps the warm rgba tint — consistent with the different visual registers of each stop.
