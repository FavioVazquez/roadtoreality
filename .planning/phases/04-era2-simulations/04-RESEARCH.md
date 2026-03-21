# Phase 4: Era 2 Simulations (Scientific Revolution) — Research

**Completed:** 2026-03-20
**Phase:** 04-era2-simulations
*(Retroactively documented)*

---

## Don't Hand-Roll

### RK4 for pendulum
The pendulum ODE θ'' = -(g/L)sin(θ) is nonlinear. Use the standard RK4 formulation
with state vector (θ, ω) where ω = dθ/dt. Each RK4 step computes 4 derivative estimates
and combines them with (1/6, 1/3, 1/3, 1/6) weights. Sub-step: 4 sub-steps per frame
at dt/4 each. Do not use the small-angle approximation θ'' = -(g/L)θ — it gives a
slightly wrong period at large angles, exactly the effect the simulation should demonstrate.

### RK4 for two-body gravity
Use simulation units: semi-major axis A = 1.0, GM = 4π²A³ (gives orbital period T = 1 for A = 1).
This avoids floating point precision issues from using SI units (meters, seconds).
State vector: (x, y, vx, vy). Acceleration: a = -GM/r³ × (x, y).
8 sub-steps per frame for the Kepler sim. 30 sub-steps per frame for Newton's cannon
(faster relative speed, needs more accuracy near Earth).

### Period measurement from pendulum simulation
Count sign changes of θ (angle). Two sign changes = one full period. Record wall-clock
simulation time between sign changes 1 and 3. This is more robust than detecting the
maximum angle or a zero crossing with velocity check.

### Orbital simulation units vs screen coordinates
Work entirely in simulation units internally. Convert to screen coordinates only at draw time:
`screenX = cx + x * scale`. Never mix units inside the physics update functions.
This keeps the physics code clean and scale-independent.

---

## Common Pitfalls

### Kepler equal-areas: area wedge accumulation
Wedge areas must be computed over equal time intervals, not equal angle intervals.
Store planet positions at regular dt intervals and draw the wedge as a polygon:
`[Sun, pt[0], pt[1], ... pt[n], Sun]`. Cap each segment at ~20 stored points.
Rotate through 5 colors for consecutive wedges.

### Newton cannon: orbit detection is tricky
A projectile "orbiting" looks the same as one about to crash on the far side.
Reliable detection: after `simT > 5000` seconds (simulation time), if not landed or
escaped, classify as orbiting. This works because a surface-level orbit period is
~5060 seconds — if the ball has survived that long without landing or escaping, it's orbiting.

### Geocentric coordinate transform in Copernicus
Geocentric = heliocentric position of planet − heliocentric position of Earth + canvas center.
Do not compute geocentric positions separately — always derive from the shared true positions.
This ensures the geocentric view is physically correct (not a separate parameterization).

### Pendulum bob radius scaling with mass
Increasing mass should not affect the period — but making the bob visually larger when
mass increases helps users intuitively grasp "mass is bigger, but period is still the same."
Use: `bobRadius = Math.max(12, Math.min(28, mass * 2.2 + 8))` for visual scaling only.

### Block friction: static vs kinetic
For simplicity, use a single friction coefficient (kinetic only). Aristotle's error
("heavier objects need more force to keep moving") is illustrated by the mass slider —
higher mass means more friction force, so you need more applied force to achieve the
same acceleration. This is intentional: friction IS proportional to mass (F_f = µmg).
Do NOT simulate static friction separately — it complicates the code without adding insight.

### Canvas resize during active simulation
On window resize, reset canvas dimensions and reinitialize positions. If a simulation
is actively running, pause it first, resize, then resume. If no resize during active
drop/orbit, at minimum: reinitialize ball/block positions after resize to prevent
objects being off-screen.
