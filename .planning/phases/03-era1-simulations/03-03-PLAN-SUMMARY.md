# Plan 03-03 Summary — Eratosthenes + Ptolemy Simulations

**Completed:** 2026-03-20

## What was built

`006-eratosthenes-earth/sim.js`: static diagram of curved Earth with two cities (Syene at top, Alexandria 7.2° north) placed at correct angular positions on the Earth circle. Parallel dashed sun rays hit both cities from the same direction. Syene stick casts no shadow; Alexandria stick casts a 7.2° shadow with arc indicator. Arc segment between cities labeled with user-set distance. "Measure" button triggers a 60-frame animation that reveals the calculation panel: `360° ÷ 7.2° = 50`, `50 × distance = circumference`, percentage error vs 40,075 km. Distance slider (200–2000 km) recalculates the result live after the panel is shown.

`007-ptolemy-geocentric/sim.js`: animated geocentric orrery with Earth at canvas center. Four planets (Mercury, Venus, Mars, Jupiter) each defined by deferent radius, epicycle radius, deferent angular speed, and epicycle angular speed. Planet position computed as `deferent_center + epicycle_offset`. Dashed deferent circles as guide rings. Trail arrays (MAX_TRAIL=800) per planet rendered as polylines at 0.35 opacity — retrograde loops accumulate over time. Speed slider (1×–5×) multiplies t increment per frame. Trail toggle clears arrays when switched off. Deterministic star background.

## Key files

- `Episodio4/stops/006-eratosthenes-earth/sim.js`
- `Episodio4/stops/007-ptolemy-geocentric/sim.js`

## Decisions made

- Eratosthenes: shadow angle fixed at 7.2° (the actual historical value); user controls distance, not angle — cleaner interaction
- Eratosthenes: `showResult` flag gate on reveal — panel only appears after "Measure" press, not on page load
- Ptolemy: planet positions parameterized purely by time `t` (not RK4) — Ptolemy's model is kinematic, not dynamical
- Ptolemy: `t += speed` per frame (integer step) rather than wall-clock dt — gives deterministic replay

## Notes for downstream

- Eratosthenes: `animT` counter drives the reveal animation (60 frames); `showResult` persists after animation completes so the panel stays visible
- Ptolemy: the epicycle speeds were hand-tuned to produce visible retrograde loops; changing them may break the visual
- Ptolemy trail render: global alpha 0.35 applied to the stroke only — the planet dot itself always renders at full opacity
