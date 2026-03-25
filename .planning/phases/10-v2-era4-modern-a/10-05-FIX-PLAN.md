---
wave: 1
depends_on: []
gap_closure: true
files_modified:
  - HowPhysicsWorks/stops/027-planck-blackbody/sim.js
  - HowPhysicsWorks/stops/033-bohr-atom/sim.js
autonomous: true
objective: "Fix two targeted bugs: (1) Stop 027 animation loop ignores temperature slider — make drawFrame use the live slider value as the sweep base instead of a hardcoded oscillation; (2) Stop 033 click handler never redraws after triggerJump — add drawStatic() call after every click so the spectrum bar updates immediately whether running or paused."
must_haves:
  - "Stop 027: dragging the temperature slider while the sim is running visibly shifts both curves on the canvas in real time"
  - "Stop 027: animation still runs (curves still animate) when no slider interaction; the sweep behaviour is preserved"
  - "Stop 033: clicking a lower orbit ring while paused immediately updates the Balmer spectrum bar on the canvas without requiring Play"
  - "Stop 033: clicking any orbit ring while running also updates the spectrum bar on the next frame"
  - "Stop 033: upward jumps (electron excitation, clicking higher ring) do not add a spectrum line — only downward jumps (emission) do"
  - "Both sim.js files remain valid ES5 IIFEs with no new ES6+ syntax"
---

# Plan 10-05-FIX: Stop 027 slider + Stop 033 Balmer

## Objective

Two focused bug fixes with clear root causes:

**Stop 027 — Temperature slider ignored in play mode:**
`drawFrame` computes `var T = 5500 + 4500 * Math.sin(animT * 0.018)` and passes it directly to `drawScene()`, bypassing the global `temperature` variable entirely. Fix: use `temperature` (from the slider) as the sweep centre — e.g. `var T = temperature + 1500 * Math.sin(animT * 0.018)` — so the animation still sweeps but is anchored to whatever the slider is set to. Also remove the `if (!running)` guard from the slider's input handler so it triggers a redraw even while running.

**Stop 033 — Spectrum bar doesn't repaint after click:**
`triggerJump()` updates `spectrumLines` and `photons` arrays but never calls `drawStatic()` or `drawBohr()` afterwards. When paused, nothing repaints the canvas. Fix: at the end of the canvas click handler, call `drawStatic()` (which should call `drawBohr()` internally, or call `drawBohr()` directly if in bohr phase).

---

## Tasks

<task id="10-05-01">
<files>HowPhysicsWorks/stops/027-planck-blackbody/sim.js</files>
<action>
Fix the animation loop to anchor the temperature sweep to the slider value:

1. Find the `drawFrame` function. Locate the line that computes the local temperature for the animation sweep — it reads approximately:
   `var T = 5500 + 4500 * Math.sin(animT * 0.018);`

2. Replace it so the sweep oscillates around the current slider value:
   `var T = temperature + 1500 * Math.sin(animT * 0.018);`
   (1500 K swing keeps it visually dynamic without jumping too far from the user's chosen value)

3. Find the slider input handler for the temperature slider. It contains a guard like:
   `if (!running) drawStatic();`
   Remove the `if (!running)` condition so it always calls `drawStatic()` — or simply remove the guard entirely and always call `drawStatic()`. When the animation loop is running, this extra drawStatic call on each slider input event is harmless since it will be overwritten by the next RAF frame.

4. Do not change any other logic. The h slider, curve drawing, and SimAPI contract must remain unchanged.
</action>
<verify>
- Open stop 027 in browser, press Play
- Drag temperature slider left and right — both curves visibly shift in real time while animation is running
- The curves still animate (continue moving) when not touching the slider
- Dragging h slider toward 0 still collapses the Planck curve onto Rayleigh-Jeans in both play and pause modes
</verify>
<done>[ ]</done>
</task>

<task id="10-05-02">
<files>HowPhysicsWorks/stops/033-bohr-atom/sim.js</files>
<action>
Fix the click handler so the spectrum bar repaints immediately after any jump:

1. Find the canvas click handler. It calls `triggerJump(closest)` when the click is within range of an orbit ring.

2. After the `triggerJump(closest)` call, add an immediate redraw call. If the sim has a `drawStatic()` function that renders the current bohr state, call it there. If `drawBohr()` is the correct function for the bohr phase, call that. Look for which function draws the full bohr scene (orbits + spectrum bar + electron) and call it unconditionally after triggerJump:
   ```
   triggerJump(closest);
   if (phase === 'bohr') drawBohr();
   ```

3. Verify that `drawBohr()` calls `drawSpectrumBar()` internally — if it does, this single addition is sufficient. If not, also call `drawSpectrumBar()` explicitly after `drawBohr()`.

4. Do not change the triggerJump logic, the spectrum line colors, or the orbital animation.
</action>
<verify>
- Open stop 033 in browser, press Play, wait for collapse to complete, click "Switch to Bohr Model"
- With the sim PAUSED: click a lower orbit ring (e.g. click n=1 or n=2 from n=3)
- The spectrum bar immediately shows a new colored line without needing to press Play
- With the sim RUNNING: click orbit rings — spectrum bar updates on each jump
- Clicking a higher orbit ring (upward jump, excitation) does NOT add a spectrum line
</verify>
<done>[ ]</done>
</task>
