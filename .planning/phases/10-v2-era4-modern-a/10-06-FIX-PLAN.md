---
wave: 1
depends_on: []
gap_closure: true
files_modified:
  - HowPhysicsWorks/stops/032-rutherford-nucleus/sim.js
  - HowPhysicsWorks/stops/032-rutherford-nucleus/index.html
autonomous: true
objective: "Fix Stop 032: (1) aim mode toggle broken due to display:flex reveal issue causing layout overlap — fix the inline style reveal so it displays correctly; (2) aim mode needs animated single-particle trajectory instead of static diagram so Play is meaningful; (3) element label on canvas hardcoded as 'Au foil' — make it reflect the current Z value with a named element lookup table; (4) add element preset buttons for H(1), C(6), Fe(26), Au(79) so user can jump to named examples."
must_haves:
  - "Clicking the mode toggle button switches between stream mode and aim mode without any layout overlap or visual clipping"
  - "In aim mode, pressing Play animates a single alpha particle traveling the calculated deflection path; Play is visually meaningful"
  - "Aim slider changes the impact parameter and the trajectory updates live"
  - "The canvas label next to the foil updates to show the element name for the current Z value (e.g. 'Au foil' at Z=79, 'H nucleus' at Z=1, 'Fe foil' at Z=26)"
  - "Element preset buttons (H, C, Fe, Au) set the charge slider to the correct Z and immediately update the canvas"
  - "Stream mode still works correctly after these changes"
  - "sim.js remains a valid ES5 IIFE"
---

# Plan 10-06-FIX: Stop 032 Aim Mode + Element Label

## Objective

Stop 032 has three distinct problems to fix and two enhancements to add.

**Bug (a) — Aim mode display/overlap:**
`aimRow.style.display = ''` clears only the display value, leaving compound inline styles in place and causing flex-wrap layout issues. Fix by setting `aimRow.style.display = 'flex'` explicitly.

**Bug (b) — Aim mode play inert:**
Aim mode currently draws a static trajectory every frame. Add an animated alpha particle that travels along the computed Rutherford deflection path when Play is pressed — it should travel from left edge, curve around the nucleus following the theta angle, and exit. Reset returns the particle to the start.

**Bug (c) — Element label hardcoded:**
`drawFoil()` always renders `'Au foil'`. Build a lookup table of element names by Z and use it to compose the canvas label.

**Enhancement — element presets:**
Add 4 preset buttons (H, C, Fe, Au) in the controls that set the charge slider value and trigger an input event.

---

## Tasks

<task id="10-06-01">
<files>HowPhysicsWorks/stops/032-rutherford-nucleus/sim.js</files>
<action>
Fix aim mode toggle display:

1. Find the mode toggle handler in `wireControls()`. Locate where `aimRow.style.display` is set when switching to aim mode.

2. Replace `aimRow.style.display = ''` with `aimRow.style.display = 'flex'`.
   Replace the hide path (`aimRow.style.display = 'none'`) — ensure it is explicitly `'none'`.

3. This ensures the row appears as a proper flex container without relying on stylesheet cascade.
</action>
<verify>
- Click mode toggle to "Manual Aim" — aim slider row appears cleanly below the other controls, no overlap with canvas or captions
- Click back to "Stream" — aim slider row disappears cleanly
</verify>
<done>[ ]</done>
</task>

<task id="10-06-02">
<files>HowPhysicsWorks/stops/032-rutherford-nucleus/sim.js</files>
<action>
Add animated single-particle trajectory in aim mode:

1. Add state variables: `var aimParticle = null;` — when initialised, set to `{ x: 0, y: 0, progress: 0, pathPoints: [] }`.

2. In `drawAimMode()`, after drawing the static trajectory path, if `aimParticle` exists and `running` is true, draw the particle dot at its current position along the path.

3. In the animation `loop()`, when in aim mode and running: advance `aimParticle.progress` by a small step (e.g. 0.008 per frame). Interpolate the particle position along the pre-computed path points. When progress reaches 1.0, reset to 0 (loop the particle).

4. Compute `pathPoints` as an array of ~60 {x,y} positions following the Rutherford hyperbolic path from left edge, curving around the nucleus, exiting right. Use the same theta computed from the aim slider. Store these on `aimParticle` when aim mode is entered or aim slider changes.

5. `SimAPI.reset()` in aim mode: reset `aimParticle.progress = 0`.

6. The static trajectory line should remain visible always (it is the path preview). The moving dot is the animation layer on top.
</action>
<verify>
- In aim mode, press Play — a particle dot travels along the deflection path and loops
- Changing the aim slider updates the trajectory path and the particle resets to start
- Pressing Reset returns particle to start of path
- When paused, the static path line is visible but no dot moves
</verify>
<done>[ ]</done>
</task>

<task id="10-06-03">
<files>HowPhysicsWorks/stops/032-rutherford-nucleus/sim.js</files>
<action>
Make canvas element label reflect current Z value:

1. Add an element name lookup table near the top of the IIFE:
   ```
   var ELEMENT_NAMES = {
     1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C',
     7: 'N', 8: 'O', 10: 'Ne', 11: 'Na', 12: 'Mg', 13: 'Al',
     14: 'Si', 16: 'S', 17: 'Cl', 18: 'Ar', 20: 'Ca', 26: 'Fe',
     29: 'Cu', 47: 'Ag', 74: 'W', 78: 'Pt', 79: 'Au', 82: 'Pb',
     92: 'U'
   };
   function elementLabel(Z) {
     return (ELEMENT_NAMES[Z] || 'Z=' + Z) + ' foil';
   }
   ```

2. In `drawFoil()` (or wherever `'Au foil'` is hardcoded as a canvas text string), replace it with `elementLabel(nucleusCharge)`.

3. Ensure `nucleusCharge` is the current value of the charge slider (it should already be a var updated by the slider handler).
</action>
<verify>
- At default Z=79: canvas shows "Au foil"
- Drag charge slider to Z=1: canvas shows "H foil"
- Drag to Z=26: canvas shows "Fe foil"
- Drag to Z=6: canvas shows "C foil"
- Drag to Z=50 (no named entry): canvas shows "Z=50 foil"
</verify>
<done>[ ]</done>
</task>

<task id="10-06-04">
<files>HowPhysicsWorks/stops/032-rutherford-nucleus/index.html</files>
<action>
Add element preset buttons to the controls:

1. In the sim-controls section, after the nucleus-charge-slider row, add a row of 4 preset buttons:

```html
<div class="sim-control-row" style="gap:0.5rem;flex-wrap:wrap;">
  <span class="sim-label">Element:</span>
  <button class="sim-btn" id="preset-h"  style="padding:0.25rem 0.75rem;font-size:0.85rem;">H (Z=1)</button>
  <button class="sim-btn" id="preset-c"  style="padding:0.25rem 0.75rem;font-size:0.85rem;">C (Z=6)</button>
  <button class="sim-btn" id="preset-fe" style="padding:0.25rem 0.75rem;font-size:0.85rem;">Fe (Z=26)</button>
  <button class="sim-btn" id="preset-au" style="padding:0.25rem 0.75rem;font-size:0.85rem;">Au (Z=79)</button>
</div>
```

2. In sim.js `wireControls()`, wire each preset button:
```
document.getElementById('preset-h').addEventListener('click', function() {
  chargeSlider.value = '1';
  chargeSlider.dispatchEvent(new Event('input'));
});
// same for preset-c (value '6'), preset-fe (value '26'), preset-au (value '79')
```

3. The `dispatchEvent(new Event('input'))` triggers the existing charge slider handler which updates `nucleusCharge`, the canvas label, and the readout.
</action>
<verify>
- 4 preset buttons visible: H (Z=1), C (Z=6), Fe (Z=26), Au (Z=79)
- Clicking each sets the slider to the correct position and the canvas label updates immediately
- Au preset restores default gold foil behaviour
</verify>
<done>[ ]</done>
</task>
