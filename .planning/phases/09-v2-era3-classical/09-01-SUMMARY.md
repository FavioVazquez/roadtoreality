# Plan 09-01 Summary

**Completed:** 2026-03-23
**Phase:** 09 — Era 3: Classical Physics

## What was built

Two fully interactive physics simulations replacing placeholder teasers for
stops 015 (Bernoulli's Principle) and 016 (Euler and Rigid Body Rotation).
Both stops received complete sim.js implementations, updated index.html pages
with narrative prose and KaTeX equations, and stops.json was updated to
reflect isStub: false.

## Key files

- `Episodio4/stops/015-bernoulli-fluids/sim.js`: Venturi tube simulation with
  particle flow, cosine-tapered throat geometry, pressure manometer columns
  above tube, velocity arrows, and pressure-vs-position graph (right panel).
  Controls: throat-width slider (15–60%) and flow-speed slider (0.3–2 m/s).

- `Episodio4/stops/015-bernoulli-fluids/index.html`: Full narrative covering
  Hydrodynamica (1738), continuity equation A1v1=A2v2, Bernoulli equation
  P+½ρv²+ρgh=const, real applications. KaTeX block equations rendered inline.

- `Episodio4/stops/016-euler-rotation/sim.js`: Three rotating rigid bodies
  (disk, rod, ring) with different moments of inertia under equal applied
  torque. Physics integrates τ=Iα each frame. Angular-velocity graph (right
  panel) plots ω(t) for all three shapes, showing divergence proportional to
  1/I. Controls: torque slider (1–20 N·m) and mass slider (0.5–5 kg).

- `Episodio4/stops/016-euler-rotation/index.html`: Full narrative covering
  τ=Iα, three I formulas (½mr², ⅓mL², mr²), ω(t)=τt/I explanation, Euler's
  3D equations context. KaTeX block equations.

- `Episodio4/assets/data/stops.json`: isStub changed from true to false for
  both stop 015 and stop 016.

## Decisions made

- Bernoulli sim uses cosine taper for throat transition (smoother than linear)
  to avoid visual kink artifacts at x1 and x2 joints.
- Pressure derived directly from continuity (A·v=const) + Bernoulli equation;
  no separate fluid solver needed at this fidelity level.
- Particles are colored by local speed (blue at wide sections, lighter at
  throat) to reinforce speed-pressure trade-off visually.
- Euler sim resets angular velocities when mass slider moves, so each new
  mass setting starts from ω=0 and the graph cleanly shows the new rates.
- Graph history scrolls left via Array.shift() rather than a ring buffer for
  simplicity; at 200 frames the memory cost is negligible.
- Both sims follow the ES5 IIFE pattern from stop 014 (Hooke's Law) exactly:
  `window.SimAPI` assigned synchronously, `setup()` deferred to DOMContentLoaded.

## Deviations from plan

- Plan file (09-01-PLAN.md) did not exist when execution began; the phase 09
  directory had not been created. The plan was reconstructed from the objective
  and success_criteria in the agent prompt. All stated must-haves were
  delivered as specified.

## Notes for downstream

- Both stops are now full simulations and will appear as non-stub in the
  landing page grid (progress.js checks isStub from stops.json).
- Next Era 3 stops (017 Coulomb, 018 Lavoisier, etc.) remain isStub: true.
- The sim-controls CSS classes `sim-controls__row`, `sim-label`, `sim-slider`,
  `sim-value` are used consistently with earlier stops (e.g., 014 Hooke).
  If these classes are not yet defined in simulation.css, they will degrade
  gracefully — the controls are functional via native browser slider styling.
