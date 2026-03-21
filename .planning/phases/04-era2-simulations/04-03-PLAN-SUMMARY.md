# Plan 04-03 Summary — Newton Laws + Newton Gravity Simulations

**Completed:** 2026-03-20

## What was built

`012-newton-laws/sim.js`: block (64×48 px) on a textured floor surface. Three sliders: applied force (0–50 N), mass (1–20 kg), friction level (4 values: µ = 0, 0.05, 0.15, 0.35). "Apply Force" button is a toggle: pressed = force applied, pressed again = released. While force is on: net force = applied − µmg. After release: only friction decelerates. Wall on the right (at W×0.82) bounces block with restitution 0.5. Left boundary clamps block at x=0. Velocity history array (200 samples) renders as a mini line graph. F=ma live panel shows F_net, m, a, v. Third Law: reaction arrow drawn for 30 frames after wall bounce. Status text narrates what's happening (force applied / released / inertia / bounce).

`013-newton-gravity/sim.js`: Earth circle at canvas center (radius = min(W,H)×0.28). Cannon at altitude 200 km above Earth surface at angle −π/4. Launch direction perpendicular to the radius vector (horizontal at cannon). RK4 integration in km/km/s units: GM derived from g=9.8 m/s², R_earth=6371 km. 30 sub-steps per frame, ~60 simulation seconds per wall-second. Trail stored in km coordinates, converted to canvas at draw time. Three outcomes: `landed` (r < R_earth+10 km), `escape` (r > R_earth×15), `orbit` (simT > 5000 s without landing/escaping). Trail color: red=landed, green=orbit, orange=escape. Speed info panel shows launch speed vs 7.9 km/s orbital and 11.2 km/s escape thresholds.

## Key files

- `Episodio4/stops/012-newton-laws/sim.js`
- `Episodio4/stops/013-newton-gravity/sim.js`

## Decisions made

- Newton laws: "Apply Force" is a toggle (start/pause repurposed) rather than a hold-to-apply button — works better with keyboard and mobile
- Newton laws: friction IS proportional to mass (F_f = µmg) — this is correct physics AND illustrates why heavier objects need more force to accelerate at the same rate
- Newton cannon: 30 sub-steps/frame chosen empirically — fewer causes visible energy drift near Earth surface at high speeds
- Newton cannon: `simT > 5000` orbit threshold is ~1 orbital period at surface level (T_surface = 2π√(R/g) ≈ 5060 s)

## Notes for downstream

- Newton laws: the velocity graph uses `Math.max(...velHistory.map(Math.abs), 1)` for y-scaling — spread operator on large arrays is fine here (200 elements)
- Newton cannon: trail points stored in km (not px) and converted at draw time — this is intentional for resize safety. On canvas resize the trail redraws correctly because `toCanvas()` uses current canvas dimensions
- Newton cannon: the cannon position is recomputed each draw call from `cannonPos()` — not cached. This ensures it stays on Earth surface after canvas resize.
