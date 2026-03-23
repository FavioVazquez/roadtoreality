# Plan 09-FIX-01 Summary

**Completed:** 2026-03-23
**Phase:** 09 — Era 3: Classical Physics (UAT gap fixes)

## What was built

Two targeted fixes addressing UAT gaps found in Phase 09. First, KaTeX auto-render was updated to always target `document.body` so math equations render across all page content, not just inside `.takeaway-box`. Second, stop 016 (Euler rotation teaser) received a physics upgrade: torque-driven angular acceleration (α = τ/I) now drives each shape with τ = 1.0 N·m, omega is capped at 10 rad/s, and the disk's radius spoke is rendered as a high-contrast white line so rotation is visually unmistakable.

## Key files

- `Episodio4/assets/js/katex-init.js`: Now calls `renderMathInElement(document.body, …)` unconditionally — no more `.takeaway-box` fallback logic.
- `Episodio4/stops/016-euler-rotation/sim.js`: Physics loop converted from kinematic (fixed omega) to torque-driven (α = τ/I, TORQUE=1.0 N·m, OMEGA_MAX=10 rad/s). Each shape carries its own `I`, `omega`, and `angle` state. `drawDisk` now draws the spoke with a separate `beginPath()` in `#ffffff` at lineWidth 3.

## Decisions made

- Torque physics implemented as simple Euler integration (alpha = torque/I, omega capped, angle accumulated) — appropriate for a teaser sim, no RK4 needed.
- Moment of inertia values use m=1 kg, r=0.1 m, L=0.2 m as representative values; the resulting speed contrast (disk spins fastest, ring slowest) correctly illustrates the I = ½mr² vs I = mr² lesson.
- The `t` variable was removed as it became unused after switching from kinematic to state-based animation.
- `drawStatic()` sets each shape's angle to 0.4 rad for a non-zero initial preview, then resets before the live animation starts.

## Deviations from plan

- The 09-FIX-01-PLAN.md file did not exist on disk; execution was driven entirely from the `<success_criteria>` in the task prompt. All required behaviors were addressed.
- Fixes 2 (spoke) and 3 (torque/cap) were committed together in one sim.js commit because they are inseparable parts of the same physics refactor; fix 1 (katex) was committed independently.

## Notes for downstream

- Stop 016 now shows visually distinct rotation speeds across disk / rod / ring — the disk (lowest I) spins to max omega fastest, the ring (highest I) accelerates slowest. This directly illustrates Euler's rotational dynamics.
- KaTeX now renders all `$…$` and `$$…$$` math on every stop page, including content outside `.takeaway-box` such as section prose and definition lists.
