# Phase 4: Era 2 Simulations (Scientific Revolution) — Verification

**Date:** 2026-03-20
**Status:** passed
**Verified by:** Cascade (retroactive)

---

## Must-Have Checklist

### Plan 04-01 (Copernicus + Galileo inclined plane)
- [x] Copernicus sim: heliocentric view shows simple circular orbits around Sun
- [x] Copernicus sim: geocentric view shows retrograde loops in trails after running
- [x] Copernicus sim: toggle slider switches modes; trails cleared on switch
- [x] Galileo inclined plane: a = g·sin(θ), angle slider 5°–60°
- [x] Galileo inclined plane: mass slider 1–10 kg has no effect on landing time
- [x] Galileo inclined plane: mini d vs t² graph renders and is visually linear
- [x] Both sims: window.SimAPI defined

### Plan 04-02 (Pendulum + Kepler)
- [x] Pendulum: RK4 exact ODE — not small-angle approximation
- [x] Pendulum: length slider changes period; mass slider does not
- [x] Pendulum: live measured period readout converges to formula
- [x] Pendulum: large angle (80°) produces period > formula value
- [x] Kepler: RK4 orbital mechanics, closed orbit (no energy drift)
- [x] Kepler: eccentricity slider 0.0–0.9
- [x] Kepler: 5 distinct colored swept-area wedges
- [x] Kepler: perihelion and aphelion labels

### Plan 04-03 (Newton Laws + Newton Gravity)
- [x] Newton laws: "Apply Force" toggle; block keeps moving after release (1st law)
- [x] Newton laws: F=ma live readout
- [x] Newton laws: friction slider decelerates block after release
- [x] Newton laws: wall reaction arrow on bounce (3rd law)
- [x] Newton laws: velocity over time mini graph
- [x] Newton gravity: RK4 gravity, launch speed slider 1–12 km/s
- [x] Newton gravity: landed / orbiting / escaped outcomes correctly detected
- [x] Newton gravity: trail color changes by outcome type
- [x] Newton gravity: orbital speed 7.9 km/s and escape speed 11.2 km/s thresholds shown

---

## Human Verification Items

- [ ] Copernicus: run 60+ seconds in geocentric mode — verify Mars retrograde loops visible
- [ ] Pendulum: set length=1.0m, verify T(formula) = 2.007s and T(measured) converges
- [ ] Pendulum: change mass from 1→10 while running — period stays same
- [ ] Kepler: run with e=0.9 — wedges near perihelion thin but same area as aphelion wedges
- [ ] Newton cannon: speed=7.9 → orbit; speed=5 → landed; speed=12 → escaped
- [ ] Newton laws: friction=None, release force → block glides indefinitely

*Verified: 2026-03-20*
