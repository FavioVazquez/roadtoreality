# Plan 09-03 Summary

**Completed:** 2026-03-23
**Phase:** 09 — Era 3: Classical Physics

## What was built

Two full interactive Canvas 2D simulations replaced the existing teaser stubs for stops 019 and 020. The Faraday induction sim drives the galvanometer needle via dΦ/dt (the flux time-derivative), producing direction reversal when the magnet changes direction of travel — demonstrating Lenz's law. The Carnot heat engine sim draws all four cycle stages as analytically correct curves (isothermal hyperbola P=nRT/V and adiabatic power law P=K/V^γ), closes the work-area fill with closePath(), and animates a tracing dot with a right-panel piston. Both index.html files received full narrative content and KaTeX equations; stops.json now marks both stops live.

## Key files

- `Episodio4/stops/019-faraday-induction/sim.js`: ES5 IIFE, galvanometer driven by (currentFlux-prevFlux)/dt, magnet-position-slider + auto-oscillate-btn wired, Lenz arrow rendered, SimAPI present
- `Episodio4/stops/020-carnot-heat-engine/sim.js`: ES5 IIFE, Carnot PV diagram with 4 analytical curve segments, closePath() for work fill, piston panel, T_H/T_C sliders, live efficiency readout η = (eta*100).toFixed(1)%, SimAPI present
- `Episodio4/stops/019-faraday-induction/index.html`: updated with real sim-controls (magnet-position-slider, auto-oscillate-btn), KaTeX equations (Faraday's law + flux integral), narrative
- `Episodio4/stops/020-carnot-heat-engine/index.html`: updated with real sim-controls (hot-temp-slider, cold-temp-slider), KaTeX equations (η_Carnot, W=Q_H-Q_C), narrative
- `Episodio4/assets/data/stops.json`: isStub set to false for 019 and 020

## Decisions made

- Flux model: `K_FLUX / dist^2` with a minimum distance clamp of 20px gives a physically plausible shape and sufficient dΦ/dt sensitivity at close range without blowing up
- Galvanometer needle clamped to ±60 degrees; CURRENT_SCALE tuned to 0.00025 so the needle reaches near full deflection when the magnet is close
- Carnot V-ratio fixed at V2 = 2*V1 for visualization clarity; adiabatic endpoints computed analytically from V3 and V4 formulae
- Piston position mapped piecewise per stage (not proportional to V coordinate) for visual clarity on the right panel
- No template literals, const, let, or arrow functions anywhere in either sim.js

## Deviations from plan

- The plan's flux formula used `dist^2` with `Math.max(dist, minDist)^2`; implementation used `dist*dist` with a manual `Math.max` clamp — functionally equivalent
- Auto-oscillate starts the animation loop if it is not already running (convenience, not specified in plan but safe)

## Notes for downstream

- Phase 09 has additional stops to implement; both 019 and 020 are now fully live
- The CURRENT_SCALE (0.00025) and K_FLUX (50000) tuning constants may need adjustment based on visual QA in different viewport sizes
- The piston panel is simplified (no true V-proportional position) — it conveys compression/expansion directionally but not precisely
