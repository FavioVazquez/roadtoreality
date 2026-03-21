# Plan 03-02 Summary — Aristotle + Archimedes Simulations

**Completed:** 2026-03-20

## What was built

`004-aristotle-motion/sim.js`: two balls dropped simultaneously from top of canvas. Left ball: user-set mass (1–10 kg) via slider. Right ball: fixed at 10 kg. Air resistance slider (None/Light/Medium/Heavy) applies drag force proportional to v²/mass. Euler integration. Landing time badges appear on each ball on impact. With air=None both balls land within 0.05s regardless of mass difference — directly contradicting Aristotle. Info panel shows acceleration, time, distance, velocity in real time. A label at the top announces the outcome ("Same time! Aristotle was wrong." / "Different times — air resistance at work.").

`005-archimedes-buoyancy/sim.js`: tank of water with five material choices (wood=600, ice=917, stone=2600, iron=7874, hollow ship=150 kg/m³). Object drops from above water and settles. Submerged fraction computed geometrically (overlap between ball bottom and water surface line). Net force = weight − buoyancy. Damping `vel *= 0.92` when submerged. Water level rises proportionally to submerged volume. Weight (down) and buoyancy (up) force arrows with labels drawn on ball when submerged fraction > 0.05. Density label and float/sink outcome displayed.

## Key files

- `Episodio4/stops/004-aristotle-motion/sim.js`
- `Episodio4/stops/005-archimedes-buoyancy/sim.js`

## Decisions made

- Aristotle: drag force = `coeff × v² / mass` so heavier objects are less affected by air — physically correct and demonstrates why Aristotle's error is partially understandable
- Archimedes: resting state detection via `|vel| < 0.05` stops the RAF loop — sim goes idle when settled
- Air resistance coefficients: [0, 0.08, 0.25, 0.6] for None/Light/Medium/Heavy

## Notes for downstream

- Aristotle sim: the `dropped` boolean flag separates "before drop" (sliders change preview) from "after drop" (physics running) states — preserve this pattern in any future modifications
- Archimedes: water level rise is visual approximation (not exact volume calculation) — sufficient for educational purposes
- Both sims stop their RAF loop on completion (settled/landed) and go idle — not all sims need to loop forever
