---
wave: 1
depends_on: []
gap_closure: true
files_modified:
  - HowPhysicsWorks/stops/031-einstein-emc2/sim.js
  - HowPhysicsWorks/stops/032-rutherford-nucleus/index.html
  - HowPhysicsWorks/stops/033-bohr-atom/sim.js
autonomous: true
objective: "Fix three UAT round-2 issues: (1) Stop 031 Play button produces no visible animation — replace the invisible ±2px pulse with expanding energy shockwave rings radiating from the sphere when running; (2) Stop 032 aim slider overflows its container to the right — constrain with max-width; (3) Stop 033 Balmer lines too thin and unclear — make lines wider with a glow, deduplicate by wavelength, and flash newly added lines briefly."
must_haves:
  - "Stop 031: pressing Play produces a clearly visible, continuous animation — expanding shockwave rings radiate from the energy sphere at a steady rate while running"
  - "Stop 031: pressing Pause stops the animation; pressing Play resumes it; the sphere and labels remain correct at any mass slider position"
  - "Stop 032: aim slider is fully visible and does not overflow or clip outside the controls box at any viewport width"
  - "Stop 033: Balmer spectrum lines are clearly visible against the background (at least 3px wide with a glow/bloom effect)"
  - "Stop 033: when a new line is added, it briefly flashes bright white then settles to its emission color"
  - "Stop 033: duplicate lines at the same wavelength are not stacked — each wavelength appears once (deduplicate on add)"
  - "All three sim.js/html files remain valid ES5 — no arrow functions, no const/let"
---

# Plan 10-09-FIX: 031 Play animation + 032 slider overflow + 033 Balmer clarity

## Objective

Three focused fixes from UAT round 2.

**Stop 031:** The play animation is a ±2px sphere pulse that is completely imperceptible. Replace with expanding concentric shockwave rings: when running, every N frames a new ring is born at the sphere surface and expands outward, fading as it goes. This makes "energy radiating from mass" visually literal and the play state obviously different from paused.

**Stop 032:** The aim slider has `style="flex:1"` inside a flex row that can overflow. Fix: set `max-width: 140px` on the slider input so it stays within the controls panel.

**Stop 033:** Spectrum lines are 2px with 0.85 alpha on a colorful gradient — they disappear into the background. Fix: draw each line at 3px with a bright glow pass (wider, lower alpha overlay). Deduplicate on push — if `spectrumLines` already contains a line within ±2nm of the new one, skip the push. Add a `flashLines` array tracking newly added lines with a frame countdown; newly added lines render bright white for ~20 frames before settling to their emission color.

---

## Tasks

<task id="10-09-01">
<files>HowPhysicsWorks/stops/031-einstein-emc2/sim.js</files>
<action>
Replace the invisible glow pulse with expanding shockwave rings:

1. Add a `rings` array near the top of the IIFE (after other var declarations):
   `var rings = [];`
   Each ring is an object: `{ r: Number, maxR: Number, alpha: Number }` where `r` starts at the current sphere radius, `maxR` is `r + 80` (the ring expands 80px), and `alpha` starts at 0.7.

2. In `drawFrame`, after incrementing `glowT`, add ring spawning logic:
   - Spawn a new ring every 40 frames (use `Math.round(glowT / 0.05) % 40 === 0` as the condition, since `glowT` increments 0.05/frame).
   - Get the current sphere radius `r` by re-running the same `fraction` computation used in `drawEnergySphere`, then `var r = Math.max(4, fraction * maxR)`.
   - Push `{ r: r, maxR: r + 80, alpha: 0.7 }` to `rings`.

3. In `drawEnergySphere` (or at the end of `drawFrame` after `drawEnergySphere` returns), draw and update all rings:
   ```
   for (var ri = rings.length - 1; ri >= 0; ri--) {
     var ring = rings[ri];
     var progress = (ring.r - ring.startR) / 80;  /* 0 → 1 */
     ctx.beginPath();
     ctx.arc(sphereCX, sphereCY, ring.r, 0, Math.PI * 2);
     ctx.strokeStyle = 'rgba(255,200,80,' + ring.alpha + ')';
     ctx.lineWidth = 2;
     ctx.stroke();
     ring.r += 1.5;
     ring.alpha -= 0.012;
     if (ring.alpha <= 0) rings.splice(ri, 1);
   }
   ```
   Note: `sphereCX` and `sphereCY` are the centre of the sphere — compute them from the `x, y, w, h` params of `drawEnergySphere` (`var sphereCX = x + w / 2; var sphereCY = y + h * 0.45;` or wherever the sphere centre is currently computed).

4. In `SimAPI.reset` and `SimAPI.pause`, clear rings: `rings = [];`

5. Remove or reduce the old ±2px sphere pulse — it is now redundant. Keep `glowT` for the ring spawning cadence.

6. Store `ring.startR = ring.r` at push time for the progress calculation, or simplify by just decrementing alpha at a fixed rate regardless of position.
</action>
<verify>
- Press Play on Stop 031 — expanding golden rings visibly radiate outward from the sphere at a steady pace
- Rings are clearly visible at any mass slider position
- Pressing Pause stops new rings from appearing and removes existing ones (or lets them fade out)
- Mass slider and velocity slider still update the sphere and labels correctly while running
- No JS console errors
</verify>
<done>[ ]</done>
</task>

<task id="10-09-02">
<files>HowPhysicsWorks/stops/032-rutherford-nucleus/index.html</files>
<action>
Fix the aim slider overflow:

1. Find the aim slider input element:
   `<input type="range" id="aim-slider" min="0" max="100" step="1" value="50" style="flex:1;">`

2. Replace `style="flex:1;"` with `style="flex:1;max-width:140px;"`.

3. This prevents the slider from growing beyond 140px and overflowing its container row.
</action>
<verify>
- Switch to Manual Aim mode — the aim slider row appears fully contained within the controls box
- No horizontal overflow or clipping on the right side
- Slider is still draggable across its full range
</verify>
<done>[ ]</done>
</task>

<task id="10-09-03">
<files>HowPhysicsWorks/stops/033-bohr-atom/sim.js</files>
<action>
Make Balmer lines visible and add flash effect on new additions:

1. Add a `flashLines` object near the top of the IIFE:
   `var flashLines = {};`
   Keys are wavelength strings (e.g. `"656"`), values are frame countdown integers.

2. In `triggerJump`, before pushing to `spectrumLines`, deduplicate: check if `spectrumLines` already contains an entry within ±3nm of the new `lambda_nm`. If yes, just update `flashLines[Math.round(lambda_nm).toString()] = 20` (re-flash the existing line) and skip the push:
   ```
   var isDuplicate = false;
   for (var si = 0; si < spectrumLines.length; si++) {
     if (Math.abs(spectrumLines[si].lambda_nm - lambda_nm) < 3) {
       isDuplicate = true;
       flashLines[Math.round(lambda_nm).toString()] = 20;
       break;
     }
   }
   if (!isDuplicate) {
     spectrumLines.push({ lambda_nm: lambda_nm, x: lx, color: color });
     flashLines[Math.round(lambda_nm).toString()] = 20;
   }
   ```

3. In `drawSpectrumBar`, replace the existing line drawing loop with an enhanced version:
   ```
   for (var i = 0; i < spectrumLines.length; i++) {
     var line = spectrumLines[i];
     var key = Math.round(line.lambda_nm).toString();
     var flash = flashLines[key] || 0;
     var flashFrac = flash / 20;  /* 1.0 when just added, 0 when settled */

     /* glow pass — wide soft line behind */
     ctx.strokeStyle = line.color;
     ctx.lineWidth = 6;
     ctx.globalAlpha = 0.25 + flashFrac * 0.3;
     ctx.beginPath();
     ctx.moveTo(line.x, s.y);
     ctx.lineTo(line.x, s.y + s.h);
     ctx.stroke();

     /* core line */
     ctx.lineWidth = 3;
     ctx.globalAlpha = flashFrac > 0 ? 0.5 + flashFrac * 0.5 : 0.9;
     ctx.strokeStyle = flashFrac > 0
       ? 'rgba(255,255,255,' + (0.4 + flashFrac * 0.6) + ')'
       : line.color;
     ctx.beginPath();
     ctx.moveTo(line.x, s.y);
     ctx.lineTo(line.x, s.y + s.h);
     ctx.stroke();

     ctx.globalAlpha = 1;
   }
   ```

4. In the animation loop (`drawBohr`), decrement each flash countdown:
   ```
   var keys = Object.keys(flashLines);
   for (var ki = 0; ki < keys.length; ki++) {
     if (flashLines[keys[ki]] > 0) flashLines[keys[ki]] -= 1;
   }
   ```

5. In `SimAPI.reset`, clear `flashLines = {}`.
</action>
<verify>
- After Bohr toggle: click a lower orbit ring — a bright white line appears in the spectrum bar at the correct wavelength position, then settles to its emission color (red for n=3→2, cyan for n=4→2, violet for n=5→2)
- Clicking the same transition again re-flashes the existing line rather than stacking a duplicate
- Lines are clearly visible against the background at normal viewing distance
- No JS console errors
</verify>
<done>[ ]</done>
</task>
