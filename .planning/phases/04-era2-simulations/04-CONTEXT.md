# Phase 4: Era 2 Simulations (Scientific Revolution) — Context

**Gathered:** 2026-03-20
**Status:** Partially executed — stops 008-013 sim.js files built during Phase 2/3 execution wave. Retroactively documented.

<domain>
## Phase Boundary

Build interactive `sim.js` simulations for the Scientific Revolution era stops (008–013).
This era introduces quantitative physics for the first time — equations, measured quantities,
and RK4 integration for orbital mechanics. All sims use vanilla Canvas 2D.

Stops in scope:
- 008 Copernicus: geocentric ↔ heliocentric toggle, orbital trails show the difference
- 009 Galileo inclined plane: ball rolls down slope, d=½at² graph, mass has no effect
- 010 Galileo pendulum: RK4 pendulum, period depends only on length (not mass)
- 011 Kepler: RK4 elliptical orbit, equal-areas law with shaded swept triangles
- 012 Newton laws: F=ma block on surface, inertia demo, friction, velocity graph
- 013 Newton gravity: Newton's cannon, projectile → orbit transition, escape velocity

</domain>

<decisions>
## Implementation Decisions

### RK4 for Era 2 orbital/pendulum physics
Use RK4 integration for: pendulum (010), Kepler orbital (011), Newton cannon (013).
Rationale: these systems have significant nonlinearity (pendulum at large angles, inverse-
square gravity). Euler integration produces visible energy drift over time. RK4 maintains
energy conservation to 4th order — orbits stay closed, pendulums stay isochronous.
Euler remains sufficient for: block friction (012) and ball on ramp (009).

### Copernicus model design
Single canvas showing both geocentric and heliocentric views of the same planetary system.
Toggle slider switches view mode. In heliocentric mode: true circular orbits around Sun,
trails show simple ellipses. In geocentric mode: Earth at center, same positions offset
by Earth's position, trails show retrograde loops. Key educational moment: same data,
two coordinate frames, radically different visual complexity.
5 planets: Mercury, Venus, Earth, Mars, Jupiter. Earth hidden in geocentric view (it's
the reference frame). Orbital periods are real-world ratios scaled to visual speed.

### Galileo inclined plane design
Tilted surface drawn at user-set angle (5°–60°). Ball rolls from top to bottom.
Physics: a = g·sin(θ), position via Euler. Mass slider: 1–10 kg — visually changes
ball radius but has NO effect on roll time. Side-by-side timer showing this clearly.
Mini graph of distance vs time² (should be linear for uniform acceleration).

### Galileo pendulum design
RK4 integration of exact pendulum ODE: θ'' = -(g/L)·sin(θ).
Three sliders: length (0.2–3.0 m), mass (1–10 kg), release angle (5°–80°).
Period readout: theoretical T = 2π√(L/g) AND measured T from sign-change counting.
Changing mass: period stays the same. Changing length: period changes. This is the payoff.
Large angle (>15°) produces noticeably longer period than small-angle formula predicts.

### Kepler equal-areas design
RK4 two-body gravity in simulation units (GM = 4π²a³, period T=1 for a=1).
Eccentricity slider (0.0–0.9). Shaded triangular wedges swept in equal time intervals —
5 wedges stored, each distinct color, rotating through as planet orbits.
First Law mode: show ellipse guide + focus points. Second Law mode: show wedge areas.
Perihelion/aphelion labels.

### Newton laws block design
Block on a surface. "Apply Force" button applies force while held (toggle).
Sliders: force (0–50 N), mass (1–20 kg), friction level (None/Low/Medium/High).
Friction: F_friction = µ × m × g, opposes velocity.
Wall on the right: block bounces with coefficient of restitution 0.5.
Velocity over time graph in mini panel (shows constant acceleration, friction deceleration).
Third Law: when block hits wall, reaction arrow displays briefly.

### Newton cannon design
Newton's cannon thought experiment. Earth sphere at canvas center.
Cannon on mountain (~200 km altitude). Launch speed slider (1–12 km/s).
RK4 integration of F = GMm/r² (GM = 9.8 × R_earth²).
Outcomes: landed (too slow), orbiting (~7.9 km/s), escaped (>11.2 km/s).
Trail color changes by outcome type. ~30 physics substeps per frame for accuracy.

### Claude's Discretion
- Visual style for heliocentric vs geocentric label text
- Trail fade/opacity implementation for Copernicus
- Number of RK4 substeps per frame for each sim
- Exact color assignments for Kepler area wedges

</decisions>

<code_context>
## Existing Code Insights

### Established Patterns (from Phases 1-3)
All patterns from Phase 3 carry forward. Additional:
- RK4 step function pattern: k1/k2/k3/k4 for (position, velocity) pairs
- Orbital units: use simulation units (AU, years) not SI (m, s) to avoid floating point issues
- `simT` accumulator for tracking simulation time separate from wall-clock time
- Speed multiplier: `t += speed` where speed = slider value (integer 1-5)
- Outcome detection: compare `Math.sqrt(x*x + y*y)` to threshold radii
- Sub-step loop: `for (var s = 0; s < substeps; s++) rk4Step(dt/substeps)`

### Integration Points
- stop-shell.js registers IntersectionObserver after DOM ready — SimAPI must be set synchronously
- Multiple slider controls: each needs unique id (#ecc-slider, #speed-slider, #law-select, etc.)
- Prevent duplicate slider ids within same page: use suffixed ids (#speed-slider2, #mass-slider-n, etc.)

</code_context>

<specifics>
## Specific Ideas

- Copernicus toggle is the key moment: switch from geocentric (complex loops) to heliocentric
  (simple circles) with one slider move. Make the difference visually dramatic.
- Galileo pendulum: live update of measured period as the pendulum swings — the user
  should see T (formula) and T (measured) converge and then see that changing mass has zero effect.
- Newton cannon: the transition from parabola to orbit should feel like a revelation.
  Color-code the three outcome types (red=landed, green=orbit, orange=escape).

</specifics>

<deferred>
## Deferred Ideas

- Matter.js rigid body for Newton's collision demo — deferred to v2.0
- Three.js for 3D orbit visualization — deferred to v2.0
- Interactive cannon aim direction — deferred (fixed perpendicular launch is sufficient)

</deferred>

---
*Phase: 04-era2-simulations*
*Context gathered: 2026-03-20 (retroactive documentation)*
