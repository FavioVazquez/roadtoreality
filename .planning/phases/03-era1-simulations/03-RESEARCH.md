# Phase 3: Era 1 Simulations (Ancient) — Research

**Completed:** 2026-03-20
**Phase:** 03-era1-simulations
*(Retroactively documented)*

---

## Don't Hand-Roll

### Buoyancy physics
Use Archimedes' principle directly: F_buoyancy = ρ_fluid × g × V_submerged.
Calculate submerged fraction from the overlap between object position and water surface.
Don't simulate fluid dynamics — just compute the fraction of the object below the water line geometrically and apply the force proportionally.

### Epicycle orbital math
For Ptolemy's model, parameterize by time t:
- Deferent center: `(cx + cos(dSpeed*t)*dR, cy + sin(dSpeed*t)*dR)`
- Planet: `(defX + cos(eSpeed*t)*eR, defY + sin(eSpeed*t)*eR)`
Both angles are linear in time. No need for Kepler or RK4. This is not physically correct
(Ptolemy isn't) — it's just the kinematic model that produces the retrograde loops.

### Canvas star backgrounds
Use a deterministic pseudo-random for star positions to avoid re-randomizing on resize:
`x = ((i * 137.508 * W) % W + W) % W` — golden-ratio offset per star index.
This gives a stable, spread-out distribution without a seeded PRNG library.

### Shadow/glow effects on canvas
Use `ctx.shadowColor` + `ctx.shadowBlur` before `ctx.fill()` to add glow.
Set `ctx.shadowBlur = 0` after the fill to prevent the shadow from bleeding into
subsequent draw calls. Glow is expensive — limit to planet dots and ball highlights,
not background elements.

---

## Common Pitfalls

### Buoyancy damping
Without damping, the buoyancy spring oscillates forever. Apply velocity damping when
the object is submerged: `vel = vel * 0.92` per frame. Increase damping factor toward 1.0
for denser materials (they settle faster due to inertia). Let the settling check compare
`|vel| < 0.05` to detect the resting state and stop the RAF loop.

### Ptolemy trail growing unbounded
Without a `MAX_TRAIL` cap on the trail array, memory grows linearly with runtime.
Cap at 800 points per planet and shift the array: `if (trail.length > MAX_TRAIL) trail.shift()`.

### dt clamping in RAF loops
Browser tabs deprioritized (background, minimized) can produce dt values of seconds,
not milliseconds. Without clamping, one frame catch-up causes objects to teleport.
Always: `var dt = Math.min((ts - lastTs) / 1000, 0.05)` — caps at 50ms.

### Canvas text rendering with custom fonts
Canvas 2D uses system fonts by default. To use Cormorant Garamond in canvas text:
`ctx.font = '700 16px "Cormorant Garamond", serif'`. This works only after the font
is loaded (FontFace API or after page load). Safe approach: use DM Sans for all canvas
labels (already a system-near font by the time the sim runs) and Cormorant Garamond
only for HTML headings.

### Slider `input` event vs `change`
Use `input` event (fires continuously as slider moves) not `change` (fires on release only).
This gives live preview as the user drags — essential for educational interactivity.
Update sim state immediately and redraw if the sim is paused.

### Eratosthenes geometry
The angle between Syene and Alexandria on the Earth surface equals the shadow angle
(7.2°) — this is the key geometric fact. Drawing this correctly on the canvas requires
placing both cities on the correct angular positions on the Earth circle and drawing
parallel sun rays hitting both. The parallel rays are the crucial visual element —
make them obvious with distinct dashes.
