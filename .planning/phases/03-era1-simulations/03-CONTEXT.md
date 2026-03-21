# Phase 3: Era 1 Simulations (Ancient) — Context

**Gathered:** 2026-03-20
**Status:** Partially executed — stops 001, 003-007 sim.js files built in Phase 2 execution (bundled together). Retroactively documented.

<domain>
## Phase Boundary

Build interactive `sim.js` simulations for the Ancient & Classical era stops (001, 003–007).
Each simulation is a self-contained IIFE exposing `window.SimAPI`. Physics is real but
simplified — prioritize visual clarity and insight over numerical precision. All sims
use vanilla Canvas 2D (no p5.js for this era — simpler code, smaller files).

Stops in scope:
- 001 Thales: supernatural vs natural explanation comparison (two-panel)
- 003 Democritus: zoom into matter (macroscopic → molecular → atomic → nuclear → quark)
- 004 Aristotle: two balls dropped simultaneously (mass + air resistance sliders)
- 005 Archimedes: objects dropped into water (density → float/sink, force arrows)
- 006 Eratosthenes: two sticks on curved Earth (shadow angle → circumference calc)
- 007 Ptolemy: geocentric model with epicycles + retrograde trails

</domain>

<decisions>
## Implementation Decisions

### Physics engine choice for Era 1
Vanilla Canvas 2D only — no p5.js, no Matter.js. Rationale: Era 1 simulations are
conceptually simple (comparisons, zoom, drop, buoyancy, geometry, epicycles). p5.js
adds 1MB for features not needed here. Vanilla canvas code is also more transparent
for educational context.

### Euler vs RK4 for Era 1
Euler integration for Aristotle (free fall) and Archimedes (buoyancy settling).
Sufficient for dt < 0.05s without visible energy drift. RK4 reserved for orbital
mechanics (Phase 4 Kepler, Newton).

### Simulation interactivity pattern
Every sim has:
- At least one slider (a physics parameter the user controls)
- Play/Pause button (calls SimAPI.start/pause)
- Reset button (calls SimAPI.reset)
- Live readout showing the physics quantity being explored
The slider value change should update the sim state immediately, even while paused.

### Thales sim design
Two-panel side-by-side: left = supernatural narrative (lightning bolt, divine figure
iconography), right = natural/scientific narrative (cloud charge buildup, discharge arc).
A center slider moves between the two explanations as a "perspective dial."
No physics equations — this is a conceptual/historical stop.

### Democritus zoom design
Five discrete zoom levels: macroscopic (apple), microscopic (cells), molecular (H2O),
atomic (hydrogen), quark level. Slider snaps between levels. Each level draws a
different particle visualization. Includes level name, scale indicator (1m → 1nm, etc.).

### Aristotle drop design
Two balls at the top of the canvas, drop simultaneously on button press.
Left ball: user-set mass (1–10 kg). Right ball: fixed heavy mass (10 kg) or user-set.
Air resistance: 4 levels (none/light/medium/heavy) → drag ∝ v²/mass.
Both balls show landing time badge. Key insight: with no air, both land simultaneously.

### Archimedes buoyancy design
Tank of water. User selects one of 5 materials (wood, ice, stone, iron, hollow ship).
Ball drops from above water surface. Settles at equilibrium. Force arrows show weight
(down) and buoyancy (up) when submerged. Stops when settled (resting state).

### Eratosthenes design
Static diagram of curved Earth with two stick figures + shadows.
Sun rays drawn as parallel dashed lines. Angle arc at Alexandria stick.
"Measure" button triggers animated calculation reveal showing 360°/7.2° × distance = circumference.
Distance slider (200–2000 km) recalculates result live.

### Ptolemy design
Animated geocentric orrery: Earth at center, 4 planets (Mercury, Venus, Mars, Jupiter)
on deferents + epicycles. Speed multiplier slider. Trail toggle shows retrograde loops.
Orbit guide circles shown as dashed rings.

### Claude's Discretion
- Exact particle shapes at each Democritus zoom level
- Color palette for each ball/object in Aristotle/Archimedes
- Trail length in frames for Ptolemy (MAX_TRAIL = 800)
- Number of star background particles (80-100 range)

</decisions>

<code_context>
## Existing Code Insights

### Established Patterns (from Phases 1-2)
- IIFE structure: `(function(){ 'use strict'; ... var canvas, ctx, W, H; ... }());`
- Canvas setup: mount element → `getBoundingClientRect()` → canvas.width/height → resize on window.resize
- SimAPI contract: `window.SimAPI = { start, pause, reset, destroy }`
- Button state management: `btn.textContent = '⏸ Pause'` + `btn.dataset.state = 'playing'`
- Dot animation: `dot.classList.add('is-running')` / `.remove('is-running')`
- RAF loop: `if (!running) return; ... rafId = requestAnimationFrame(loop);`
- `lastTs` pattern: `if (!lastTs) lastTs = ts; var dt = Math.min((ts - lastTs)/1000, 0.05);`
- Font in canvas: `'12px "DM Sans", system-ui, sans-serif'` (inline to avoid CORS issues with canvas)

### Integration Points
- `sim.js` loaded last: after `stop-shell.js` has already registered the IntersectionObserver
- `window.SimAPI` must be set synchronously during script execution (not inside async callback)
- Slider elements: `#[name]-slider` → `addEventListener('input', ...)` → update state + redraw
- Status text: `document.getElementById('sim-status').textContent = '...'`

</code_context>

<specifics>
## Specific Ideas

- Aristotle sim must clearly demonstrate that mass has NO effect on fall time (no air) —
  the key "aha" moment. Make the two balls the same size visually but different mass labels.
- Archimedes: "Eureka" moment should feel tangible — show the water level actually rising
  as the object enters, not just a static diagram.
- Ptolemy: The retrograde loops in the trail are the main insight — make trails prominent.

</specifics>

<deferred>
## Deferred Ideas

- Sound effects on simulation events (Archimedes splash, etc.) — deferred to v2.0
- Stop 002 (Pythagoras harmony) full simulation — deferred to Phase 3 of v1.1
- Animated transition between Democritus zoom levels — deferred (discrete snaps for now)

</deferred>

---
*Phase: 03-era1-simulations*
*Context gathered: 2026-03-20 (retroactive documentation)*
