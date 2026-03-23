# Plan 09-05 Summary

**Completed:** 2026-03-23
**Phase:** 09 — Era 3: Classical Physics

## What was built

Stop 023 (Doppler Effect) received a full interactive simulation: a moving source that emits growing wavefront circles at each emission event, a source-speed slider (0–0.95c), and a live frequency readout showing f_obs ahead and behind using the exact Doppler formula. Stop 024 (Boltzmann Entropy) received a two-panel simulation: the left panel runs 60 elastic-collision particles with a temperature slider and an EMA-smoothed Maxwell-Boltzmann speed histogram (theoretical curve overlay included); the right panel has a partition wall the user opens, after which particles spread into the full volume and a gradient entropy meter climbs toward maximum. Both stops received updated index.html files with narrative content and KaTeX-rendered equations.

## Key files

- `Episodio4/stops/023-doppler-effect/sim.js`: Moving source Doppler sim — emission events, wavefront circles, speed slider, Doppler frequency readout
- `Episodio4/stops/023-doppler-effect/index.html`: Updated narrative, KaTeX Doppler formula and redshift approximation
- `Episodio4/stops/024-boltzmann-entropy/sim.js`: Two-panel sim — left: elastic collisions + EMA MB histogram; right: partition wall + entropy meter; squared-distance collision detection
- `Episodio4/stops/024-boltzmann-entropy/index.html`: Updated narrative, KaTeX Maxwell-Boltzmann distribution f(v) and S = k_B ln Omega
- `Episodio4/assets/data/stops.json`: isStub set to false for stops 023 and 024

## Decisions made

- Used squared-distance threshold in pairwise collision loop (no Math.sqrt on every pair) to satisfy the performance constraint; Math.sqrt is called only when two particles actually collide.
- EMA_ALPHA = 0.06 gives smooth histogram without sluggish response to temperature changes.
- Right-panel entropy meter uses a normalized approach: tracks fraction of particles that have crossed to the newly available half-volume, then smoothly approaches 1.0 as the distribution equilibrates.
- Doppler frequency readout uses the exact formula f = f0 * vw / (vw ∓ vs) and updates every frame alongside the slider.
- Phase 09 directory created; PLAN.md was not pre-existing — executed from success criteria in the prompt.

## Deviations from plan

- PLAN.md file was not found at `.planning/phases/09-v2-era3-classical/09-05-PLAN.md` (directory did not exist). Created the directory and executed from the success criteria provided in the orchestrator prompt.
- Boltzmann entropy meter is a normalized 0–100% progress bar rather than raw S = k ln Omega numeric value; this is more illustrative given the arbitrary particle count.

## Notes for downstream

- Both stops are fully functional interactive simulations, no longer stubs.
- Stop 023 has no audio; the Doppler formula is shown visually/numerically. If audio is desired in a future pass, a Web Audio approach similar to stop 002 could add a tone that shifts pitch.
- The collision detection in stop 024 is O(N^2) — fine for N=60 but would need a spatial hash if N grows above ~150.
- stops.json isStub flags are both now false for 023 and 024.
