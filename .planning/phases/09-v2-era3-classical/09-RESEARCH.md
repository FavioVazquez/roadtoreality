# Phase 09: Era 3 — Classical Physics — Research

**Researched:** 2026-03-23
**Phase goal:** Implement all 12 Classical Physics stub stops (015–026) with full interactive sims, KaTeX equations, and `isStub: false` in stops.json.

---

## Don't Hand-Roll

| Problem | Recommended solution | Why |
|---------|---------------------|-----|
| Field line tracing (017 Coulomb, 022 Maxwell) | Implement Euler-step integration from seed points around each charge | The only approach that works purely in ES5 Canvas 2D with no deps; seeding 8–16 rays per charge at equal angles and stepping along E-field gradient is the established algorithm and stays within ~50 lines |
| Particle gas physics (024 Boltzmann) | Elastic collision: reflect velocity on wall contact; pair collisions via distance check | Matter.js is vendored but overkill for a gas sim — vanilla ball-bounce with `vx = -vx` on boundary and velocity exchange on collision is sufficient and far less setup overhead |
| PV diagram curve drawing (020 Carnot) | Parametric canvas path through 4 Carnot stages: isothermal (hyperbola T=const), adiabatic (PVγ=const), back-isothermal, back-adiabatic | Do not approximate with straight lines — the isothermal curve is `P = nRT/V` and must be drawn point-by-point; the enclosed area is the visual payoff |
| Interference fringe pattern (026 Michelson-Morley Mode 3) | Use `Math.cos(2 * Math.PI * pathDiff / lambda)` mapped to grayscale intensity for each pixel row | Do not try to draw individual wavefronts; computing intensity directly per scanline at ~1px resolution is fast enough at canvas widths of 400–600px |
| EM wave rendering (022 Maxwell Panel 2, 025 Hertz) | Draw E and B as sinusoidal vector lines perpendicular to the propagation axis, sampled every ~10px | Do not try to fill the wave body with gradients — per-sample line segments from axis to amplitude give the clearest visual and are idiomatic in all physics education contexts |
| Mode-switching UI (026 three modes) | `data-state` attribute on a wrapping div; CSS shows/hides the active canvas section; sim.js holds all three draw functions in one IIFE | Do not create three separate canvases — maintain one canvas and branch in `draw()` on a `currentMode` variable; this avoids resize/observer duplication |

---

## Common Pitfalls

### Pitfall 1 — Field line termination without a stopping condition causes infinite loops
**What goes wrong:** When drawing electric field lines (017, 022), the Euler-step tracer keeps stepping forever if lines never reach a sink charge or canvas edge.
**Why:** Positive-only charge configurations have no sink; the tracer escapes to infinity.
**How to avoid:** Add two termination conditions — (a) line exits canvas bounds, (b) line comes within a threshold distance of any charge (acts as arrival at a sink). Also cap max steps at ~500 per line unconditionally.

### Pitfall 2 — Particle performance collapse with many particles (024 Boltzmann)
**What goes wrong:** Pairwise collision detection is O(n²). With 100 particles per frame at 60 fps this is 1,000,000 checks/second — visibly drops framerate on mobile.
**Why:** Naive "check every pair" loop with `Math.sqrt` for distance.
**How to avoid:** Use a spatial grid (divide canvas into cells, only check neighbors). Alternatively cap particle count at 60 and use squared-distance comparisons without `sqrt` for the threshold test. The codebase does not have a spatial hash helper — write a simple 2D cell grid inline.

### Pitfall 3 — Two-panel canvases fighting each other on resize (022, 024)
**What goes wrong:** When using a split canvas (left panel / right panel) within a single `sim.js`, the `splitX` calculation is based on `W` at init time. On resize, if `W` is recalculated but panel-specific coordinates are not invalidated, drawing clips or overflows.
**Why:** Stop 014 (Hooke) uses this pattern correctly — it recalculates `splitX = W * 0.5` inside the `resize()` callback. This must be replicated for 022 and 024.
**How to avoid:** Follow the 014 pattern exactly: compute all geometry-dependent variables (`splitX`, panel origins, scale factors) inside the `resize()` function, not at setup time. Verify on a 375px-wide viewport.

### Pitfall 4 — Draggable charges (022 Maxwell Panel 1) breaking on touch devices
**What goes wrong:** `mousemove` listeners work on desktop but the drag fails on mobile/tablet because touch events are separate.
**Why:** Canvas uses `touch-action: none` (already in simulation.css) but no `touchmove` listener is wired.
**How to avoid:** Wire both `mousemove`/`mousedown`/`mouseup` and `touchmove`/`touchstart`/`touchend` using the same handler with an event normalization helper: `var pos = e.touches ? e.touches[0] : e; var x = pos.clientX - rect.left;`. Do not use pointer events API — Safari support requires polyfill.

### Pitfall 5 — Carnot PV cycle area not visually closing
**What goes wrong:** The two isothermal and two adiabatic arcs don't form a closed path because floating-point errors accumulate during parametric stepping.
**Why:** Adiabatic curves are `P = K / V^γ` and if the step size is coarse the endpoint of one segment doesn't exactly meet the start of the next.
**How to avoid:** Draw each segment between analytically-defined endpoints (V1→V2 for isothermal expansion, etc.) computed from the temperature ratio. Close the path explicitly with `ctx.closePath()` before `ctx.fill()`. Never rely on the arc segments to accidentally close.

### Pitfall 6 — 026 three-mode sim: all modes drawing simultaneously
**What goes wrong:** If the `draw()` function lacks a mode guard, all three visual layers draw on top of each other.
**Why:** During refactoring it is easy to forget to add `if (currentMode !== 1) return;` guards at the top of each sub-draw function.
**How to avoid:** Structure as `function drawModeExpected()`, `function drawModeRace()`, `function drawModeInterferometer()` — and have the top-level `draw()` call exactly one of them based on `currentMode`. Clear canvas at the top of `draw()` before branching.

### Pitfall 7 — Doppler wavefront circles becoming invisible at high source speeds
**What goes wrong:** When source speed approaches or exceeds wave speed, concentric circles pile up in front of the source (Mach cone), and if drawn with the same radius formula all circles land on the same pixel.
**Why:** The wavefront radius for a given emission event is `v_wave * dt * n_frames`; at v_source > v_wave all forward circles collapse to zero or negative apparent spacing.
**How to avoid:** Cap the source speed slider below Mach 1 (v_source ≤ 0.95 v_wave) to stay in the subsonic regime for the classical Doppler story. If supersonic is shown, draw a Mach cone line explicitly instead of circles. The requirement (SIM-CLS-09) is classical Doppler — subsonic cap is correct physics.

### Pitfall 8 — ES5 IIFE: using `const`/`let`, arrow functions, or template literals
**What goes wrong:** The codebase constraint is ES5-compatible syntax. Modern JS works in current browsers but violates the established pattern.
**Why:** All existing sims use `var`, named `function` declarations, and string concatenation. Arrow functions and template literals would be inconsistent.
**How to avoid:** Use `var` throughout, write `function foo() {}` instead of `const foo = () => {}`, and use `'string ' + variable` not `` `string ${variable}` ``. The stop-014 sim.js (503 lines, ES5 clean) is the reference.

### Pitfall 9 — Entropy histogram (024) not updating smoothly
**What goes wrong:** Recounting particle speed bin membership each frame causes the histogram bars to flicker because small frame-to-frame changes cause individual bars to jump by ±1 pixel.
**Why:** With 60 particles in 10 bins, each bin holds ~6 particles. One particle moving between bins shifts a bar by 1/6 of max height — visible as flicker.
**How to avoid:** Smooth histogram bars with a per-bin exponential moving average: `displayHeight[i] = displayHeight[i] * 0.85 + actualHeight[i] * 0.15`. This is the same technique stop-002 uses for amplitude smoothing (analogous concept).

### Pitfall 10 — Faraday galvanometer needle not reversing direction on Lenz's law reversal
**What goes wrong:** The galvanometer needle's angle is driven by `inducedCurrent` which is computed as the time-derivative of flux (`dΦ/dt`). If the formula uses absolute flux rather than its derivative, the needle points the same direction during both approach and recession.
**Why:** A common mistake is computing `currentFlux` and using it directly rather than `currentFlux - previousFlux` (the change per frame).
**How to avoid:** Store `previousFlux` each frame and compute `inducedCurrent = (currentFlux - previousFlux) / dt`. The galvanometer needle angle should be proportional to this signed value — positive = clockwise, negative = counter-clockwise. This directly demonstrates Lenz's law.

---

## Existing Patterns in This Codebase

- **IIFE + `window.SimAPI`:** Every sim is an immediately-invoked function expression that sets `window.SimAPI = { start, pause, reset, destroy }` synchronously during script execution. `stop-shell.js` relies on this being set synchronously before `DOMContentLoaded`. See `/Episodio4/stops/014-hooke-elasticity/sim.js` lines 402–435.

- **Canvas setup + DPR scaling:** `canvas.width = Math.round(W * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`. All drawing uses CSS-pixel coordinates after `setTransform`. Resize is handled by a `resize()` function called inside `requestAnimationFrame` on init and on `window.addEventListener('resize', resize)`. See stop-014 `setup()` at line 437.

- **Split-canvas two-panel layout:** Stop 014 defines `splitX = W * 0.5` and draws spring on left (`x < splitX`) and F vs. x graph on right (`x > splitX`), with a dashed divider line. This is the direct pattern for 022 (field lines / EM wave) and 024 (particle gas / entropy). Dashed divider: `ctx.setLineDash([4, 4])`, `ctx.strokeStyle = 'rgba(180,180,180,0.15)'`.

- **`prefers-reduced-motion` guard:** `var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;` — check before calling `requestAnimationFrame`. If reduced, draw static frame only. Present in every existing sim.

- **Animation loop pattern:** `function loop() { if (!running) return; t += 0.016; draw(); raf = requestAnimationFrame(loop); }`. The `t` variable is a wall-time accumulator in seconds. Wave oscillations use `Math.sin(omega * t)` where `omega` is set aesthetically. Consistent across all sims.

- **Control wiring in `setup()`:** Sliders, selects, and buttons are wired with `getElementById` and `addEventListener('input', ...)` inside `setup()`. The play button's `data-state` attribute toggles between `'playing'` and `'paused'`. The reset button calls `window.SimAPI.reset()`. `stop-shell.js` also binds play and reset — the sim's own bindings are for additional controls (sliders, mode buttons) not covered by stop-shell.

- **Era color token for Classical Physics:** `--era-classical-color: oklch(0.65 0.18 240)` (a steel blue). Slider thumbs, live readout values, and `.stop-header__era` automatically pick this up via `var(--era-stop-color)` when `data-era="classical"` is on `.stop-page`. No manual color override needed in sim.js — use `'rgba(82,133,200,0.8)'` (the approx hex `#5283c8` is already in the 015 placeholder) for canvas drawing to match the era color.

- **KaTeX equation placement:** KaTeX auto-renders any `$$...$$` blocks in `.takeaway-box` and `.stop-body`. Already self-hosted. No JS changes needed — just write LaTeX in the HTML. Existing stops (014 and prior) show the pattern: one or two `$$...$$` display equations inside `<div class="takeaway-box">`. Phase 09 context requires more equations for Maxwell (all 4) and Boltzmann (f(v) + S = k ln Ω).

- **`stop-config` JSON script tag:** Each stop's `index.html` contains `<script id="stop-config" type="application/json">` with `id`, `order`, `era`, `title`, `prev`, `prevTitle`, `next`, `nextTitle`. `stop-shell.js` reads this for breadcrumb and arrow-key navigation. Must not be omitted or malformed.

- **Skeleton loader removal:** `.stop-skeleton` is a `div` with `aria-hidden="true"` placed inside `.sim-container`. `stop-shell.js` removes it once `window.SimAPI` is set (polling at 50ms). No manual removal needed in sim.js — the skeleton will disappear automatically when the IIFE runs.

---

## Physics Model Notes Per Stop

### 015 — Bernoulli
The existing placeholder (`sim.js`, 119 lines) already has the venturi tube geometry and particle flow but lacks the pressure gauge interactivity required by SIM-CLS-01. The full sim needs: (a) a throat-width slider that changes the constriction ratio, (b) animated pressure gauge columns that rise/fall per Bernoulli's equation `P + ½ρv² = const`, and (c) particles speeding up in the throat. Continuity equation: `A₁v₁ = A₂v₂`. Pressure readout: `ΔP = ½ρ(v₂² - v₁²)`. Use ρ = 1.225 kg/m³ (air) for the display but the visual doesn't need physical accuracy — normalize to fractions.

### 016 — Euler Rigid Body Rotation
Three bodies (disk, rod, ring) with the same mass M but different moment of inertia: `I_disk = ½MR²`, `I_rod = ¼ML²`, `I_ring = MR²`. Apply the same constant torque τ to each; angular acceleration α = τ/I differs. Animate each body rotating at its own rate. Live ω graph tracks diverging speeds. The "same torque, different angular acceleration" is the pedagogical point — keep the visual side by side.

### 017 — Coulomb Electrostatics
Two interactive charges (drag to reposition). Force arrow between them scales as `F = kq₁q₂/r²`. Field lines traced from positive to negative (or to infinity). Live F vs. r plot in right panel. Toggle same-sign (repulsion) vs. opposite-sign (attraction). Key pitfall: same-sign charges produce a field line saddle point between them — field lines curve away, not toward — ensure the tracer handles this correctly by following the actual E-field direction.

### 018 — Volta Battery
Circuit schematic: cells represented as alternating long/short lines (standard symbol). Series: cells stack voltage (V_total = n × V_cell). Parallel: cells share current capacity, voltage stays equal. Interactive: slider for number of cells + series/parallel toggle. Readouts: voltage (V), current (I = V/R), power (P = IV). Use a fixed load resistance (e.g. 10 Ω) shown as a resistor symbol. No need for physical electrochemistry — the conceptual circuit model is sufficient.

### 019 — Faraday Induction
Magnet moves on a horizontal track (slider controls position). Coil drawn as overlapping ellipses at center. Flux Φ = B × A × cos(θ); since the magnet axis is along the track, simplify to Φ proportional to `1/distance²` clamped. Galvanometer needle deflects as signed `dΦ/dt`. Arrow on coil reverses (Lenz's law) when magnet direction changes. Auto-oscillation mode: magnet oscillates back and forth, needle oscillates, demonstrating alternating current.

### 020 — Carnot Heat Engine
PV diagram with four clearly labeled stages. Hot reservoir T_H (slider), cold reservoir T_C (slider). Efficiency `η = 1 - T_C/T_H` displayed live. The enclosed area represents work W. Animate a piston-dot tracing the cycle. Color the work area distinctly. Key equation: `η_Carnot = 1 - T_C/T_H`. The two temperatures must be in Kelvin for the formula to work — if using Celsius sliders, convert internally.

### 021 — Joule Energy Conservation
Weight-drop apparatus or paddle-wheel in water. Weight descends; KE + gravitational PE convert to heat. Energy pie chart (three slices: PE remaining, KE, heat generated) updates in real time. Total energy stays constant — the conservation is the visual payoff. Mechanical equivalent: 1 cal = 4.184 J. Show the rising temperature readout of the water as heat accumulates.

### 022 — Maxwell (two panels, both active simultaneously)
**Panel 1 — Field lines:** Implement charge drag with the mouse/touch normalization pattern described above. Recompute field lines on every `mousemove` (not just on release). With 2 charges at ~30 lines each, full recompute per frame is ~60 traces × 500 steps = 30,000 iterations per frame — this is acceptable at canvas widths below 800px. Profile if slow.
**Panel 2 — EM wave:** Propagating wave with `E_y = A sin(kx - ωt)` for E-field; `B_z = (A/c) sin(kx - ωt)` for B-field drawn perpendicular. Frequency slider changes `k` (spatial frequency); amplitude slider changes `A`. Phase advances with `t`. Draw E in one color (classical color: blue tones) and B in a contrasting color (gold/orange). Arrow tips on each vector segment clarify direction.

### 023 — Doppler Effect
Moving source emitting concentric wavefronts. Each wavefront is a circle born at the source's position at emission time, growing at wave speed. Store an array of `{birthX, birthY, age}` emitted at regular intervals. Each frame: advance `age += dt`; draw circle radius `= v_wave * age` centered at `{birthX, birthY}`. Source position advances by `v_source * dt`. Frequency readout: `f_observed = f_source * (v_wave / (v_wave ± v_source))` for ahead/behind. Cap source speed at 0.95 × wave speed (see Pitfall 7).

### 024 — Boltzmann (two panels, both active simultaneously)
**Panel 1 — Particle gas:** 50–60 particles, radius ~4px, elastic wall/particle collisions. Temperature slider scales all particle speeds by `sqrt(T/T_ref)` on change (Maxwell-Boltzmann: mean speed ∝ √T). Histogram of speed distribution, smoothed (see Pitfall 9). Maxwell-Boltzmann curve overlaid as a reference line.
**Panel 2 — Entropy partition:** Start with all particles in the left half (partition wall drawn as vertical line). "Remove partition" button (or clicking the wall) sets `partitionActive = false`; particles continue with current velocities. Entropy meter: `S ≈ k * ln(Ω)` where Ω is approximated by how many cells are occupied out of a grid. As particles fill the right half, Ω grows and the meter climbs. Reset button restores all particles to left half and re-draws partition. The "remove partition" interaction must feel physical — animate the wall sliding up or fading out.

### 025 — Hertz Radio Waves
Oscillating dipole at canvas center: two charges oscillating up and down at frequency `f`. Radiating wavefronts expand outward. Wavefront rings are not plain circles — they are distorted (stronger perpendicular to dipole axis, zero along axis) per the sin²θ radiation pattern. Simplification acceptable: draw expanding ellipses wider perpendicular to the dipole, with opacity proportional to `sin²θ`. E-field direction color-coding: alternate red/blue for each half-cycle. Frequency slider controls oscillation rate.

### 026 — Michelson-Morley (three modes)
**Mode 1 — Expected vs. Found:** Left sub-panel draws a sine-wave fringe pattern with predicted fringe shift (based on apparatus rotation angle and hypothetical aether velocity). Right sub-panel always draws a flat/null fringe. Rotation slider (0–360°) modulates the predicted shift amplitude. Both panels update live.
**Mode 2 — Speed-of-light race:** Two perpendicular arms. Animated light-dot travels each arm. Both dots always arrive simultaneously regardless of rotation — this is the null result. Do not attempt relativistic time dilation; just make both travel at the same apparent speed (the physics point is that they do arrive together).
**Mode 3 — Interferometer:** Simplified schematic: beam splitter at center, two arm-length adjusters, a screen. Arm length ratio slider (0.5–2.0). Fringe pattern on screen: cosine intensity based on path length difference `ΔL = 2(L₁ - L₂)`. Equal lengths → zero path difference → central bright fringe. Off-center → alternating fringes. The null result is shown explicitly when the slider is at 1.0. Mode tabs: three buttons (or a segmented control) — clicking switches `currentMode` variable and redraws.

---

## Recommended Approach

Implement the 12 stops in the six paired plans as laid out in ROADMAP.md (09-01 through 09-06), in order, since each plan is two stops that share a physics domain. Start each stop by replacing the placeholder `sim.js` with a full IIFE following the stop-014 structure, then update `index.html` to replace stub controls with real ones and add full KaTeX equations to `.takeaway-box`. The three complex stops (022, 024, 026) should each be planned as single-plan deliverables with their own dedicated code sections for each panel or mode — budget approximately 600–800 lines of sim.js for these three, compared to ~350–500 for the simpler nine. Field line rendering (017, 022) and particle systems (024) are the highest-risk components; implement and test these first within their respective plans before adding secondary interactions.
