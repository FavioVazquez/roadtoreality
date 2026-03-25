---
wave: 1
depends_on: []
gap_closure: true
files_modified:
  - HowPhysicsWorks/stops/031-einstein-emc2/sim.js
autonomous: true
objective: "Redesign Stop 031 sim: fix flickering scale labels by snapping to stable unit thresholds, and replace the hard-to-understand two-panel bar graph layout with a single-narrative visual — a glowing energy sphere that expands as mass increases, with clearly annotated real-world scale markers (TNT, bomb, city) drawn as landmark lines on the canvas rather than oscillating text labels."
must_haves:
  - "Scale labels (TNT kilotons/megatons, bombs, city power) do not flicker — each label shows a stable value that only changes when the slider moves"
  - "1 gram of mass shows ~21.5 kilotons TNT equivalent as a stable, non-flickering label"
  - "The sim has a clear single visual anchor: dragging the mass slider produces an obvious, intuitive visual change that a non-physicist immediately understands"
  - "The velocity slider and relativistic energy relationship is still present and functional"
  - "Both KaTeX equations (E=mc² and E²=(pc)²+(mc²)²) remain in the takeaway box"
  - "sim.js remains a valid ES5 IIFE with DPR canvas pattern and prefers-reduced-motion check"
  - "window.SimAPI contract (start/pause/reset/destroy) unchanged"
---

# Plan 10-07-FIX: Stop 031 E=mc² Redesign

## Objective

Stop 031 has two problems to fix simultaneously:

**Flickering:** `sigfig3()` with `Math.log10` fluctuates at unit-boundary values. Fix with a stable threshold-based formatter that picks a fixed unit tier and stays there — no dynamic log10 per frame.

**Hard to understand:** The two-panel bar graph layout is too abstract. Replace the mass-energy panel with a single dramatic visual: a glowing energy sphere on the canvas whose radius grows logarithmically with the computed energy. Annotate the sphere with horizontal landmark lines showing where key thresholds sit (1 ton TNT, 1 kiloton, 1 megaton, Hiroshima, city power). As the user drags the mass slider, the sphere grows through these landmarks. This makes the scale visceral and spatial rather than numerical.

Keep the velocity panel (stacked rest energy + KE bars) as the second section — it is working and illustrates the SR relationship clearly.

---

## Tasks

<task id="10-07-01">
<files>HowPhysicsWorks/stops/031-einstein-emc2/sim.js</files>
<action>
Fix the flickering scale formatter:

1. Replace the `sigfig3()` helper (or add a new stable formatter `stableEnergyLabel(joules)`) that uses fixed threshold comparisons instead of `Math.log10`:

```javascript
function stableEnergyLabel(joules) {
  // TNT equivalents: 1 ton TNT = 4.184e9 J
  var TON = 4.184e9;
  var tnt = joules / TON;
  if (tnt >= 1e6)  return (tnt / 1e6).toFixed(2) + ' Mt TNT';
  if (tnt >= 1e3)  return (tnt / 1e3).toFixed(2) + ' kt TNT';
  if (tnt >= 1)    return tnt.toFixed(2) + ' t TNT';
  if (tnt >= 1e-3) return (tnt * 1e3).toFixed(2) + ' kg TNT';
  return joules.toFixed(2) + ' J';
}
```

2. For the bomb count label, use fixed thresholds (Hiroshima = ~6.3e13 J):
```javascript
function bombLabel(joules) {
  var HIROSHIMA = 6.3e13;
  var n = joules / HIROSHIMA;
  if (n >= 1000) return Math.round(n / 1000) + 'k Hiroshima bombs';
  if (n >= 1)    return n.toFixed(1) + ' Hiroshima bombs';
  return (n * 100).toFixed(1) + '% of Hiroshima bomb';
}
```

3. For city power, use fixed thresholds (1 GW city-year = ~3.15e16 J):
```javascript
function cityPowerLabel(joules) {
  var CITY_YEAR = 3.15e16;
  var years = joules / CITY_YEAR;
  if (years >= 1)   return years.toFixed(2) + ' city-years of power';
  var hours = joules / (CITY_YEAR / 8760);
  if (hours >= 1)   return hours.toFixed(1) + ' city-hours of power';
  var mins = hours * 60;
  return mins.toFixed(1) + ' city-minutes of power';
}
```

4. Replace all calls to `sigfig3` in the mass-energy panel rendering with calls to these stable formatters.
</action>
<verify>
- Drag mass slider slowly through the full range — labels never flicker, they change only when slider moves
- At the 1g position: TNT label shows ~21.5 kt TNT (stable, not oscillating)
- The label transitions smoothly at boundaries (e.g. 999 t TNT → 1.00 kt TNT) only when the slider crosses that point
</verify>
<done>[ ]</done>
</task>

<task id="10-07-02">
<files>HowPhysicsWorks/stops/031-einstein-emc2/sim.js</files>
<action>
Replace the mass-energy bar panel with an energy sphere visual:

The mass panel currently draws a horizontal bar. Replace `drawMassPanel()` (or equivalent) with `drawEnergySphere()`:

1. Compute `restEnergyJ = massKg * C_MS * C_MS` (existing calculation).

2. Compute sphere radius logarithmically so it spans the canvas height well across the slider range:
   ```javascript
   var LOG_MIN = Math.log10(1e3);   // 1 kJ (near-zero mass)
   var LOG_MAX = Math.log10(9e16);  // 1 kg → ~9e16 J
   var logE = Math.log10(Math.max(restEnergyJ, 1e3));
   var fraction = (logE - LOG_MIN) / (LOG_MAX - LOG_MIN);
   var maxR = H * 0.38;
   var r = Math.max(4, fraction * maxR);
   ```

3. Draw the glowing sphere: a radial gradient from a warm white/yellow core to orange/red at the edge, matching the site's dark luxury palette. Use `ctx.arc()`.

4. Draw 4–5 horizontal landmark lines across the canvas (as dashed lines with right-side labels):
   ```
   1 ton TNT     → at the radius where restEnergyJ = 4.184e9 J
   1 kt TNT      → 4.184e12 J
   1 Mt TNT      → 4.184e15 J
   Hiroshima     → 6.3e13 J
   City (1 year) → 3.15e16 J
   ```
   Each landmark: compute `r_landmark`, draw a dashed horizontal line at `cy - r_landmark` across the canvas, label it on the right side. If the current sphere radius is at or above a landmark line, highlight that landmark (bold/bright text).

5. Show the current stable label (from `stableEnergyLabel`) centered below the sphere as large text. Show `bombLabel` and `cityPowerLabel` as smaller text lines below that.

6. The sphere should pulse gently (sin wave on alpha or radius ±2px) when `running` to feel alive without changing the physics display.

7. Keep the canvas divided: upper 60% for the sphere, lower 40% for the velocity/relativistic energy panel (unchanged).
</action>
<verify>
- At minimum mass: small dot near center
- As mass slider increases: sphere grows visibly, passing through landmark lines
- Landmark lines visible at fixed positions; sphere grows past them
- Current energy label below sphere is stable (not flickering)
- Lower panel still shows velocity slider and energy bars
- A non-physicist looking at the canvas for 5 seconds understands that more mass = more energy = bigger sphere = bigger explosion
- Browser console shows zero JS errors on load and during full slider range interaction
</verify>
<done>[ ]</done>
</task>
