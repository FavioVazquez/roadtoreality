---
wave: 1
depends_on: []
gap_closure: true
files_modified:
  - HowPhysicsWorks/stops/030-special-relativity-length/sim.js
autonomous: true
objective: "Replace the ruler-like rectangle in Stop 030 with a recognisable train car shape — body with roof line, windows that squash with the contraction, wheels beneath, and a direction-of-motion arrow — so the length contraction visual is immediately readable as a vehicle shrinking, not a bar graph changing width."
must_haves:
  - "The contracted shape is visually recognisable as a train car (body, roof, at least 2 windows, wheels)"
  - "Windows squash horizontally along with the car body as velocity increases — they are part of the contracted shape"
  - "Ghost outline of the rest-length car is still visible as a dashed comparison"
  - "Live L readout still shows ~14.1 m at v=0.99c"
  - "The contraction is along the horizontal axis only — height and wheel positions do not change"
  - "sim.js remains a valid ES5 IIFE, DPR pattern, prefers-reduced-motion check"
---

# Plan 10-08-FIX: Stop 030 Train Car Visual

## Objective

The current sim draws a rounded rectangle with tick marks — it looks like a ruler. Replace the car drawing with a proper train car silhouette so the length contraction is immediately readable as a physical object shrinking.

The car should be drawn as a function `drawCar(ctx, cx, cy, w, h, alpha)` that takes a width parameter — this is the only value that changes with velocity. Height, wheel positions, and roof shape are fixed. Ghost outline uses the same function with `w = baseWidth` and a dashed stroke.

---

## Tasks

<task id="10-08-01">
<files>HowPhysicsWorks/stops/030-special-relativity-length/sim.js</files>
<action>
Replace the plain rectangle car with a train car silhouette:

1. Add a `drawCar(x, y, w, h, isGhost)` helper function. Parameters:
   - `x, y`: centre position of the car
   - `w`: current width (contracted or rest)
   - `h`: fixed height (never changes)
   - `isGhost`: boolean — if true draw as dashed outline only, no fill

2. Inside `drawCar`, draw:
   a. **Body:** filled rounded rectangle at `(x - w/2, y - h/2, w, h)` with `borderRadius = Math.min(8, h*0.15)`. Fill with a gradient (dark blue-grey for the car body). If ghost, skip fill, use dashed stroke in the site's muted text color.

   b. **Roof panel:** a slightly raised rectangle `(x - w/2 + w*0.05, y - h/2 - h*0.12, w*0.90, h*0.15)` — a flat roof section. Contracts with w.

   c. **Windows:** draw 2 windows, evenly spaced across the car width. Each window:
      - Width: `w * 0.18` (scales with car width — they squash)
      - Height: fixed `h * 0.28`
      - Y position: centred on upper half of car body
      - X positions: at `x - w*0.25` and `x + w*0.25`
      - Fill with a lighter semi-transparent blue

   d. **Wheels:** 4 wheels (2 per truck), fixed size (do not scale with w), positioned at bottom of car. Y position fixed; X positions relative to car centre: `-w*0.35`, `-w*0.15`, `+w*0.15`, `+w*0.35`. Radius: `h * 0.18`. Fill dark grey.

   e. **Undercarriage bar:** a thin horizontal bar connecting the wheels at the axle line. Width = `w * 0.85`, fixed height. Contracts with w.

3. In `drawScene()` (or wherever the car is currently drawn):
   - Replace the old rounded-rect + tick-marks drawing with: `drawCar(cx, carY, contractedW, carH, false)` for the moving car
   - Replace the old ghost outline with: `drawCar(cx, carY, baseW, carH, true)` for the ghost
   - Remove `drawTicks()` entirely — the windows provide visual compression cues instead

4. The `contractedW` is computed from `L / L0 * baseW` as before (existing logic). Keep all existing slider wiring and L readout unchanged.
</action>
<verify>
- At v=0: car shows full width with roof, 2 windows, 4 wheels, ghost outline coincides with car body
- At v=0.99c: car visibly squashes to ~14% of rest width; windows squash with it; wheels stay same size at bottom; ghost outline shows the original full-length car
- The shape is unmistakably a vehicle, not a ruler
- L readout still shows ~14.1 m at 0.99c
- Height of car body does not change at any velocity
</verify>
<done>[ ]</done>
</task>
