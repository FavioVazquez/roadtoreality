---
wave: 1
depends_on: []
gap_closure: true
gaps_addressed: [gap-09, gap-10]
files_modified:
  - Episodio4/stops/026-michelson-morley/sim.js
  - Episodio4/stops/026-michelson-morley/index.html
autonomous: true
objective: "Make Mode 3 armRatio=1.0 visually unambiguous as a null result (uniform grey fill + bold label instead of fringes); show only the relevant slider per mode and add a mode-hint paragraph below the controls."
must_haves:
  - "drawModeInterferometer() renders uniform mid-grey when abs(armRatio - 1.0) < 0.005, with a bold NULL RESULT label — no fringe stripes at armRatio=1.0"
  - "setMode() shows the rotation-slider row only for modes 1 and 2; shows the arm-ratio-slider row only for mode 3"
  - "A <p id='mode-hint'> element exists in index.html below the slider rows"
  - "setMode() updates the mode-hint text to a one-line description of the active mode's control"
---

# Plan FIX-03: Stop 026 Michelson-Morley Mode 3 + Controls Clarity

## Objective

Two gaps close here, both in stop 026. Gap 9: Mode 3 at armRatio=1.0 produces the same striped fringe pattern as other values because the formula `0.5 * (1 + Math.cos(2*PI*pathDiff/lambda + py*0.1))` retains a `py*0.1` cosine term that generates stripes regardless of pathDiff. The fix replaces the fringe panel with uniform mid-grey plus a bold "NULL RESULT" label when armRatio is within 0.005 of 1.0. Gap 10: both sliders are always visible regardless of mode, giving no indication which slider controls what. The fix shows only the relevant slider per mode and adds a text hint below the controls.

## Context

**DEC-002**: Pure ES5 IIFEs. No const/let/arrow functions.

**Stop 026 index.html structure (lines 70–91)**: The sim-controls div contains three child rows:
1. Mode buttons row (line 71–76): `display:flex` row with three mode buttons.
2. Rotation slider row (lines 77–81): a flex row with label, input#rotation-slider, span#rotation-label.
3. Arm-ratio slider row (lines 82–86): a flex row with label, input#arm-ratio-slider, span#arm-ratio-label.
Both slider rows have no id attribute. To show/hide them from JS, add `id="rotation-slider-row"` to the rotation flex div and `id="arm-ratio-slider-row"` to the arm-ratio flex div. Then `setMode()` in sim.js can call `document.getElementById('rotation-slider-row').style.display` to show or hide each row.

**Mode hint paragraph**: Add a `<p id="mode-hint">` element below the two slider rows (inside the flex column div, after line 86). The paragraph uses the existing text-secondary color and text-sm font size. `setMode()` sets its `textContent` to a one-line description appropriate to each mode:
- Mode 1: `'Move the rotation slider to vary the predicted fringe shift — observe vs found.'`
- Mode 2: `'Move the rotation slider to rotate the apparatus — both beams always arrive together.'`
- Mode 3: `'Move the arm-ratio slider. At 1.00 the arms are equal — the historical null result.'`

**drawModeInterferometer() null result fix** (lines 511–548): The current scanline loop at lines 516–521 always runs. When `abs(armRatio - 1.0) < 0.005`, skip the scanline loop entirely and instead:
1. Fill the fringe panel area with solid mid-grey: `ctx.fillStyle = 'rgb(128,128,128)'` + `ctx.fillRect(fringeLeft, 0, W - fringeLeft, H)`.
2. Draw a bold centered label: "NULL RESULT — no fringe shift" in white, bold 14px, centered in the fringe panel.
3. Draw a second line below it: "Equal arms: \u0394L = 0" in a smaller dimmer font.

When `abs(armRatio - 1.0) >= 0.005`, run the existing scanline fringe loop as-is. Remove the existing conditional null-result label block at lines 539–548 (which drew text over stripes) — it is superseded by the new solid-grey branch.

**Threshold precision**: use `< 0.005` (not the previous `< 0.05`) so the null result display is precise. The arm-ratio slider has step=0.05, so armRatio values are 0.50, 0.55, … 0.95, 1.00, 1.05 … The value 1.00 is the only one that satisfies `abs(armRatio - 1.0) < 0.005`. This is intentional — the null result should be a specific observable point, not a wide band.

## Tasks

<task id="09-FIX-03-01">
<name>Add IDs to slider rows and mode-hint paragraph in index.html</name>
<files>
- Episodio4/stops/026-michelson-morley/index.html
</files>
<action>
In the sim-controls section (lines 69–92), make two structural additions:

1. Add `id="rotation-slider-row"` to the rotation slider flex div. The current line 77 is:
     <div style="display:flex;align-items:center;gap:0.75rem;">
   Change it to:
     <div id="rotation-slider-row" style="display:flex;align-items:center;gap:0.75rem;">

2. Add `id="arm-ratio-slider-row"` to the arm-ratio slider flex div. The current line 82 is:
     <div style="display:flex;align-items:center;gap:0.75rem;">
   Change it to:
     <div id="arm-ratio-slider-row" style="display:flex;align-items:center;gap:0.75rem;">

3. After the arm-ratio slider row (after line 86, before the closing `</div>` of the flex column at line 87), insert a new paragraph element:
     <p id="mode-hint" style="font-size:var(--text-sm);color:var(--color-text-secondary);margin:0;"></p>

No other changes to index.html.
</action>
<verify>
Open the file and confirm:
- The rotation slider div tag contains `id="rotation-slider-row"`
- The arm-ratio slider div tag contains `id="arm-ratio-slider-row"`
- A `<p id="mode-hint">` element exists within the sim-controls flex column, after the arm-ratio row
</verify>
<done>[ ]</done>
</task>

<task id="09-FIX-03-02">
<name>Show/hide sliders per mode and update mode-hint in setMode()</name>
<files>
- Episodio4/stops/026-michelson-morley/sim.js
</files>
<action>
In `setMode(m)` (lines 43–49), extend the function body to show/hide the appropriate slider row and update the mode-hint text. After the three btn opacity lines and before the `if (!running)` call, add:

  var rotRow = document.getElementById('rotation-slider-row');
  var arRow  = document.getElementById('arm-ratio-slider-row');
  var hint   = document.getElementById('mode-hint');

  if (rotRow) {
    rotRow.style.display = (m === 1 || m === 2) ? 'flex' : 'none';
  }
  if (arRow) {
    arRow.style.display = (m === 3) ? 'flex' : 'none';
  }
  if (hint) {
    if (m === 1) {
      hint.textContent = 'Move the rotation slider to vary the predicted fringe shift \u2014 observe vs. found.';
    } else if (m === 2) {
      hint.textContent = 'Move the rotation slider to rotate the apparatus \u2014 both beams always arrive together.';
    } else {
      hint.textContent = 'Move the arm-ratio slider. At 1.00 the arms are equal \u2014 the historical null result.';
    }
  }

The complete updated setMode() will have the three opacity lines, then the show/hide and hint block, then the existing `if (!running) { draw(); }`. No other changes.
</action>
<verify>
Load stop 026. On initial load (mode 1), only the rotation slider row must be visible; the arm-ratio slider row must be hidden. The mode-hint paragraph must show the mode 1 description. Click "Interferometer" (mode 3) — the rotation slider must disappear, the arm-ratio slider must appear, and the hint must show the mode 3 description. Click "Light Race" (mode 2) — rotation slider visible, arm-ratio hidden, mode 2 hint shown.
Alternatively: confirm setMode() in sim.js contains getElementById('rotation-slider-row') and getElementById('arm-ratio-slider-row') and sets their display, plus getElementById('mode-hint') and sets its textContent for all three modes.
</verify>
<done>[ ]</done>
</task>

<task id="09-FIX-03-03">
<name>Render uniform grey null result in Mode 3 at armRatio=1.0</name>
<files>
- Episodio4/stops/026-michelson-morley/sim.js
</files>
<action>
In `drawModeInterferometer()`, replace the fringe-rendering and null-result-label section. Locate the block beginning at the comment `/* ── Right: fringe pattern computed per pixel row ── */` (around line 511).

The current code:
  var pathDiff = 2 * (L1 - L2);
  var lambda = 40;

  for (var py = 0; py < H; py++) {
    var intensity = 0.5 * (1 + Math.cos(2 * Math.PI * pathDiff / lambda + py * 0.1));
    var g = Math.round(intensity * 220);
    ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
    ctx.fillRect(fringeLeft, py, W - fringeLeft, 1);
  }

  /* Fringe panel overlay frame */
  ctx.save();
  ctx.strokeStyle = 'rgba(82,133,200,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(fringeLeft, 0, W - fringeLeft, H);
  ctx.restore();

  /* Arm ratio label on fringe panel */
  ctx.save();
  ctx.font = 'bold 11px "DM Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(180,180,180,0.8)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Arm ratio: ' + armRatio.toFixed(2), fringeLeft + (W - fringeLeft) * 0.5, 8);
  ctx.restore();

  /* Null result label (shown when armRatio is very close to 1.0) */
  if (Math.abs(armRatio - 1.0) < 0.05) {
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,160,80,0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Equal arms: null result', fringeLeft + (W - fringeLeft) * 0.5, H * 0.5);
    ctx.restore();
  }

Replace this entire section with:

  var pathDiff = 2 * (L1 - L2);
  var lambda = 40;
  var fringePanelCX = fringeLeft + (W - fringeLeft) * 0.5;
  var isNullResult = (Math.abs(armRatio - 1.0) < 0.005);

  if (isNullResult) {
    /* Uniform mid-grey — no fringes: visually distinct null result */
    ctx.save();
    ctx.fillStyle = 'rgb(128,128,128)';
    ctx.fillRect(fringeLeft, 0, W - fringeLeft, H);
    ctx.restore();

    /* NULL RESULT label */
    ctx.save();
    ctx.font = 'bold 14px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NULL RESULT \u2014 no fringe shift', fringePanelCX, H * 0.5 - 12);
    ctx.restore();

    /* Sub-label */
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.70)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Equal arms: \u0394L = 0', fringePanelCX, H * 0.5 + 12);
    ctx.restore();
  } else {
    /* Normal fringe pattern */
    for (var py = 0; py < H; py++) {
      var intensity = 0.5 * (1 + Math.cos(2 * Math.PI * pathDiff / lambda + py * 0.1));
      var gVal = Math.round(intensity * 220);
      ctx.fillStyle = 'rgb(' + gVal + ',' + gVal + ',' + gVal + ')';
      ctx.fillRect(fringeLeft, py, W - fringeLeft, 1);
    }
  }

  /* Fringe panel overlay frame */
  ctx.save();
  ctx.strokeStyle = 'rgba(82,133,200,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(fringeLeft, 0, W - fringeLeft, H);
  ctx.restore();

  /* Arm ratio label on fringe panel */
  ctx.save();
  ctx.font = 'bold 11px "DM Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(180,180,180,0.8)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Arm ratio: ' + armRatio.toFixed(2), fringePanelCX, 8);
  ctx.restore();

Note: the variable name `g` in the original loop is renamed to `gVal` to avoid shadowing the outer `g` variable (gravity = 9.81 is not in this file, but `g` is used as an abbreviation for the grey channel value — rename to be unambiguous). The path-diff label at the bottom of the panel (lines 551–557 in the original) is kept as-is after this section.
</action>
<verify>
Load stop 026 and click "Interferometer" (mode 3). With the arm-ratio slider at its default value of 1.00: the fringe panel (right half of canvas) must be solid uniform mid-grey with no black/white stripes, and the text "NULL RESULT — no fringe shift" must be centered and clearly visible. Move the arm-ratio slider to any other value (e.g., 1.05 or 0.95) — the fringe panel must switch to alternating dark and bright horizontal bands. Move back to 1.00 — the solid grey null result must reappear.
Alternatively: confirm drawModeInterferometer() contains an isNullResult branch using `Math.abs(armRatio - 1.0) < 0.005` that calls fillRect with 'rgb(128,128,128)' for the full fringe panel area.
</verify>
<done>[ ]</done>
</task>

## Must-Haves

After all tasks complete, the following must be true:

- [ ] `index.html` rotation slider div has `id="rotation-slider-row"`, arm-ratio slider div has `id="arm-ratio-slider-row"`, and a `<p id="mode-hint">` exists in the controls column
- [ ] `setMode()` in `sim.js` sets `rotRow.style.display` and `arRow.style.display` conditionally per mode, and updates `hint.textContent` to a mode-specific description
- [ ] `drawModeInterferometer()` contains an `isNullResult` branch: when `Math.abs(armRatio - 1.0) < 0.005`, fills the fringe panel with `'rgb(128,128,128)'` and draws "NULL RESULT — no fringe shift" centered in white bold text
- [ ] At armRatio=1.00, the fringe panel shows no black/white stripes whatsoever
- [ ] At armRatio != 1.00 (e.g., 1.05), the fringe panel shows the normal alternating stripe pattern
