---
wave: 1
depends_on: []
gap_closure: true
gaps_addressed: [gap-01, gap-02, gap-03]
files_modified:
  - Episodio4/assets/js/katex-init.js
  - Episodio4/stops/016-euler-rotation/sim.js
autonomous: true
objective: "Fix KaTeX rendering scope so equations outside .takeaway-box render; make disk rotation visually apparent; lower default torque so rotation speed is comfortably observable."
must_haves:
  - "katex-init.js targets document.body (or equivalent broad selector) — no longer .takeaway-box only"
  - "drawDisk() in sim.js draws a white or high-contrast radius line visible against the filled disk"
  - "Default torque is 1.0 N·m in both the var declaration and the reset() call"
  - "physicsStep() applies an angular velocity cap so omegas[i] never exceeds 10 rad/s"
  - "The torque slider initial value set in setup() matches the new default of 1.0"
---

# Plan FIX-01: KaTeX Scope + Stop 016 Rotation Fixes

## Objective

Three gaps close here. Gap 1 is cross-cutting: KaTeX only renders inside `.takeaway-box` because `katex-init.js` uses a narrow querySelector; changing the container to `document.body` fixes all 12 stop pages at once. Gaps 2 and 3 are both in stop 016: the disk is painted opaque (the rgba color-replace trick fails on hex strings), so the radius line is invisible; and the default torque of 5.0 N·m produces angular velocities above 90 rad/s within three seconds of play.

## Context

**DEC-002**: All JS is plain ES5 IIFEs. No const/let. No arrow functions.

**DEC-004**: `window.SimAPI` is the interface stop-shell.js uses; sim.js must not also wire `#sim-play-btn` directly (relevant to FIX-02, not here — but note the pattern: sim.js owns physics, stop-shell.js owns the button).

**katex-init.js** (line 12): `var container = document.querySelector('.takeaway-box') || document.body;`
The fallback `|| document.body` only activates when `.takeaway-box` is entirely absent. When it exists, `renderMathInElement` receives only that node, leaving all inline `$...$` and display `$$...$$` in `.stop-body` paragraphs unprocessed. Fix: remove the querySelector entirely, always pass `document.body`.

**stop 016 drawDisk()** (lines 78–101): `SHAPE_COLORS` are hex strings (e.g., `'#5285c8'`). The pattern `color.replace(')', ',0.15)').replace('rgb', 'rgba')` finds nothing in a hex string, so `fillStyle` is set to the raw hex color — 100% opaque fill. The radius line drawn afterward uses the same color as the border stroke, making it invisible against the filled circle. Fix: use a literal `'rgba(255,255,255,0.9)'` white for the radius line so it contrasts with any fill color. Separately, make the disk fill semi-transparent by using the hex color with a hardcoded alpha via `ctx.globalAlpha` before the fill, then restoring alpha.

**Default torque** (line 21): `var torque = 5.0;`. At torque=5.0 and mass=2.0, disk α = 5.0 / (0.5 × 2.0 × 0.16) = 31.25 rad/s². After 3 seconds: ω ≈ 94 rad/s. Fix: change default to `1.0` and add a cap `omegas[i] = Math.min(omegas[i], 10)` in `physicsStep()`. Also update the `reset()` method (line 422: `torque = 5.0`) and the slider sync in `setup()` (line 481: `torqueSlider.value = torque`). The slider already reads the variable, so the `.value` assignment will correctly reflect the new default.

## Tasks

<task id="09-FIX-01-01">
<name>Broaden KaTeX container to document.body</name>
<files>
- Episodio4/assets/js/katex-init.js
</files>
<action>
Replace line 12 of katex-init.js:

  var container = document.querySelector('.takeaway-box') || document.body;

with:

  var container = document.body;

This removes the narrow querySelector so renderMathInElement processes all LaTeX delimiters found anywhere in the page DOM — including `.stop-body` paragraphs with inline `$...$` and display `$$...$$` equations. The rest of the file (renderMathInElement call, delimiters, throwOnError) remains unchanged.
</action>
<verify>
Open any stop page that has equations in `.stop-body` prose (e.g., stop 026 has `$v_E$` in the body paragraph at line 100 of its index.html). After the fix, those inline equations must render as KaTeX HTML elements, not raw dollar-sign text. The `.takeaway-box` equations must also still render correctly.
Alternatively: confirm `katex-init.js` line 12 reads exactly `var container = document.body;` with no querySelector.
</verify>
<done>[ ]</done>
</task>

<task id="09-FIX-01-02">
<name>Make disk rotation visually apparent with a white radius spoke</name>
<files>
- Episodio4/stops/016-euler-rotation/sim.js
</files>
<action>
In `drawDisk()` (lines 78–101), make two targeted changes:

1. Replace the broken semi-transparent fill logic. Currently line 85:
     ctx.fillStyle = color.replace(')', ',0.15)').replace('rgb', 'rgba');
   Replace with a fill that uses ctx.globalAlpha for transparency, then restores it:
     ctx.save();
     ctx.globalAlpha = 0.18;
     ctx.fillStyle = color;
     ctx.fill();
     ctx.restore();
   Remove the original `ctx.fill()` call that immediately follows it (line 86).

2. Make the radius line white and thicker so it contrasts against any fill color. Currently lines 91–94:
     ctx.beginPath();
     ctx.moveTo(0, 0);
     ctx.lineTo(vr - 2, 0);
     ctx.stroke();
   Change the strokeStyle before this block to a high-contrast color and increase lineWidth:
     ctx.strokeStyle = 'rgba(255,255,255,0.9)';
     ctx.lineWidth = 3;
     ctx.beginPath();
     ctx.moveTo(0, 0);
     ctx.lineTo(vr - 2, 0);
     ctx.stroke();

The center dot (lines 95–99) may keep the original color. The border stroke (lines 87–89) may keep the original color and lineWidth; just ensure the strokeStyle and lineWidth are set again before the radius line block (the ctx.save()/restore() for the fill handles isolation; set the radius line style explicitly after the fill block).

All changes are within the `ctx.save()` / `ctx.restore()` of `drawDisk()`.
</action>
<verify>
Load stop 016 in a browser and press Play. The disk (leftmost shape, blue) must show a clearly visible white spoke rotating against the blue fill. The spoke must complete visibly distinct rotation cycles at the default torque setting.
Alternatively: confirm in sim.js that the radius line uses `ctx.strokeStyle = 'rgba(255,255,255,0.9)'` and `ctx.lineWidth = 3` immediately before its `ctx.beginPath()`.
</verify>
<done>[ ]</done>
</task>

<task id="09-FIX-01-03">
<name>Lower default torque and cap angular velocity</name>
<files>
- Episodio4/stops/016-euler-rotation/sim.js
</files>
<action>
Make three changes in sim.js:

1. Line 21 — change the default torque variable:
   Before: var torque = 5.0;
   After:  var torque = 1.0;

2. In `physicsStep()` (lines 319–333), add a velocity cap after the omega update. After the line:
     omegas[i] += alpha * DT;
   add:
     if (omegas[i] > 10) { omegas[i] = 10; }

3. In `SimAPI.reset()` (lines 419–435), change:
   Before: torque = 5.0;
   After:  torque = 1.0;
   (The slider label update and `torqueSlider.value = 5.0` on line 430 must also be updated to match — change that value to 1.0 as well.)

No other changes. The mass default (2.0 kg) and radius (0.4 m) are unchanged. With torque=1.0 and the cap at 10 rad/s, the disk reaches its cap in about 1 second and holds steady — slow enough to observe clearly.
</action>
<verify>
Load stop 016 and press Play. The shapes should accelerate visibly but not spin into a blur. After a few seconds the ring (slowest) should still be visibly rotating and not at an impossibly high speed. The torque slider label in the controls bar should initialize to "1.0 N·m". Pressing Reset should restore the slider to 1.0 N·m.
Alternatively: confirm in sim.js that `var torque = 1.0` on the initial declaration line, that physicsStep contains `if (omegas[i] > 10) { omegas[i] = 10; }`, and that `reset()` sets `torque = 1.0`.
</verify>
<done>[ ]</done>
</task>

## Must-Haves

After all tasks complete, the following must be true:

- [ ] `katex-init.js` line 12 is `var container = document.body;` with no querySelector present
- [ ] `drawDisk()` in `016-euler-rotation/sim.js` sets `ctx.strokeStyle = 'rgba(255,255,255,0.9)'` before drawing the radius line
- [ ] `drawDisk()` uses `ctx.globalAlpha = 0.18` (or similar low value) for the disk fill to make it semi-transparent
- [ ] `var torque = 1.0` at the initial declaration in `016-euler-rotation/sim.js`
- [ ] `physicsStep()` contains an explicit cap: `if (omegas[i] > 10) { omegas[i] = 10; }`
- [ ] `SimAPI.reset()` restores `torque = 1.0` (not 5.0)
