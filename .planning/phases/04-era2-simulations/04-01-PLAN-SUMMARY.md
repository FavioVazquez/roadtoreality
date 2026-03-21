# Plan 04-01 Summary — Copernicus + Galileo Inclined Plane Simulations

**Completed:** 2026-03-20

## What was built

`008-copernicus-heliocentric/sim.js`: five-planet solar system (Mercury, Venus, Earth, Mars, Jupiter) with real orbital period ratios. In heliocentric mode: Sun at canvas center, planets orbit in circles, trails form clean rings. In geocentric mode: Earth placed at center, all other planet positions shifted by `planet_pos − earth_pos + canvas_center`. Earth itself hidden in geocentric mode (it is the reference frame). Mode toggle slider switches views; trail arrays cleared on each switch. After 30+ seconds in geocentric mode, retrograde loops appear in Mars trail — the key visual payoff. Speed slider 1×–5×.

`009-galileo-inclined-plane/sim.js`: tilted plane drawn at user-set angle. Ball released from top-left of plane on button press. Euler integration: `acc = g·sin(θ)`, position along slope in metres. Plane length fixed at 3m; `pxPerMetre` computed from canvas width for responsiveness. Angle slider (5°–60°) changes plane tilt and acceleration. Mass slider (1–10 kg) changes ball visual radius only — has zero effect on landing time. Landing time and elapsed timer displayed. Mini graph: x-axis = t², y-axis = distance, renders as straight line (confirming uniform acceleration d = ½at²). Resize guard prevents resetting ball mid-drop.

## Key files

- `Episodio4/stops/008-copernicus-heliocentric/sim.js`
- `Episodio4/stops/009-galileo-inclined-plane/sim.js`

## Decisions made

- Copernicus: geocentric positions derived from heliocentric by coordinate subtraction — not independently parameterized. Ensures physical correctness.
- Copernicus: `PLANETS` array includes Earth at index 2; Earth dot not drawn in geocentric mode
- Inclined plane: `dropped` boolean separates pre-drop (sliders change preview) from post-drop (physics running)
- Inclined plane: `timeHistory` and `distHistory` arrays cap at 200 samples for the d vs t² graph

## Notes for downstream

- Copernicus: orbital period ratios are approximate (Mercury=88 days, Venus=225, Earth=365, Mars=687, Jupiter=4333 in period units). Speed is scaled by the `speed` multiplier only — absolute time scale is visual.
- Inclined plane: if angle is changed mid-drop the physics still uses the pre-drop angle (intentional — don't reset during drop)
- Mini graph uses `velHistory` max for y-axis scaling — first few frames may look flat before data accumulates
