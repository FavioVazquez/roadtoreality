# Plan 03-01 Summary — Thales + Democritus Simulations

**Completed:** 2026-03-20

## What was built

Two vanilla Canvas 2D simulations. `001-thales-natural-causes/sim.js`: two-panel interactive comparison between supernatural (divine lightning bolt, red tones, particle drift) and natural (cloud charge buildup, discharge arc, labels) explanations of natural phenomena. Center slider moves between the two perspectives. Both panels animate independently. `003-democritus-atoms/sim.js`: five-level zoom simulation through scales of matter — macroscopic (apple, ~1m), microscopic (cell membrane, ~10µm), molecular (H2O arrangement, ~0.1nm), atomic (hydrogen atom with orbiting electron, ~1pm), quark-level (proton with up/down quarks, ~1fm). Each level has unique particle visualization. Scale indicator and level name update per step.

## Key files

- `Episodio4/stops/001-thales-natural-causes/sim.js`
- `Episodio4/stops/003-democritus-atoms/sim.js`

## Decisions made

- Thales sim: slider as "perspective dial" (0–100) rather than binary toggle — smoother UX
- Democritus sim: discrete snap between zoom levels (not continuous zoom) — cleaner visuals
- Both sims: `prefers-reduced-motion` check at setup — skip animation loop if set
- Deterministic star background using golden-ratio offset: `(i * 137.508 * W) % W`

## Notes for downstream

- Thales has no physics equations — purely conceptual/historical, no SimAPI physics state
- Democritus level 4 (quarks) shows 3 colored dots inside the proton — colors are conventional (red/green/blue QCD colors), not literal
- Both sims follow the established IIFE + SimAPI + dt-clamped-loop pattern for all subsequent sims
