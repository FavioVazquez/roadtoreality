# Plan 04-02 Summary — Galileo Pendulum + Kepler Laws Simulations

**Completed:** 2026-03-20

## What was built

`010-galileo-pendulum/sim.js`: RK4 integration of the exact pendulum ODE θ'' = -(g/L)sin(θ) — no small-angle approximation. State vector (θ, ω). 4 sub-steps per frame at dt/4. Canvas draws pivot bracket, pendulum rod, bob (radius scales visually with mass), arc guide, and a fading 120-point trail. Three sliders: length (0.2–3.0 m), mass (1–10 kg), release angle (5°–80°). Period measurement counts sign changes of θ; period = time between sign-changes 1 and 3. Live readout: T (formula) = 2π√(L/g) and T (measured) converging side by side. Changing mass slider updates bob size without resetting swing — user sees period unchanged in real time. At 80° the measured period exceeds the formula by ~15%.

`011-kepler-laws/sim.js`: RK4 two-body orbital mechanics in simulation units (A=1 AU, GM=4π²A³, T=1). Initial conditions at perihelion: x = A(1-e), vy = √(GM(2/r - 1/A)) from vis-viva equation. 8 sub-steps per frame. Orbit closes with no visible energy drift. Equal-areas display: segments accumulated over SEG_DURATION=0.08 (fraction of period); 5 segments stored with distinct oklch colors; each drawn as filled polygon from Sun through segment points back to Sun. Eccentricity slider (0.0–0.9) pauses sim, reinitializes orbit, resumes. Law toggle: 1st Law highlights ellipse guide; 2nd Law highlights swept-area wedges. Focus placement shifts canvas so Sun appears at left focus. Perihelion/aphelion labels at both ends of the major axis.

## Key files

- `Episodio4/stops/010-galileo-pendulum/sim.js`
- `Episodio4/stops/010-galileo-pendulum/index.html`
- `Episodio4/stops/011-kepler-laws/sim.js`
- `Episodio4/stops/011-kepler-laws/index.html`

## Decisions made

- Pendulum: mass slider does NOT call `reset()` — this is intentional so users see period unchanged while the sim keeps swinging
- Pendulum: `lastSign` initialized from `Math.sign(theta0)` so sign-change counting starts correctly
- Kepler: canvas center offset by `A * ecc * scale` pixels so Sun (at focus) appears near center of canvas, not at mathematical center of ellipse
- Kepler: `SEG_DURATION = 0.08` chosen so each wedge covers ~1/12 of the orbit — visually clear size differences at high eccentricity

## Notes for downstream

- Pendulum: period measurement gives garbage for first 2-3 swings while `periodStart` is being established — this is expected; measured T stabilizes after ~3 full swings
- Kepler: `toCanvas(sx, sy)` function handles the focus offset; always use this function for converting sim coords to screen — never compute canvas position directly from (x, y)
- Kepler: `initOrbit()` must be called whenever `ecc` changes (done by the eccentricity slider handler)
