---
wave: 1
depends_on: []
gap_closure: true
gaps_addressed: [gap-04, gap-05, gap-06, gap-07, gap-08]
files_modified:
  - Episodio4/stops/021-joule-energy/sim.js
  - Episodio4/stops/022-maxwell-equations/sim.js
autonomous: true
objective: "Fix stop 021 text overlap (energy readout above pie chart, arrived label collision); fix stop 022 cursor hover on charges, panel label opacity and subtitle, and the blocker double-listener that freezes the EM wave after reset+play."
must_haves:
  - "Energy readout block in drawPieChart() starts at readY = pieCY + pieR + 20 (below the pie, not above)"
  - "Arrived label in drawApparatus() draws at appBottom - 28 (not - 2) to clear the water container label"
  - "mousemove listener in 022 sim.js sets canvas.style.cursor = 'pointer' when within 20px of a charge center"
  - "drawPanelLabels() uses opacity 0.85 and draws a subtitle line under each panel title"
  - "The play-button click listener block (lines 529–538) is removed from 022 sim.js entirely"
---

# Plan FIX-02: Stop 021 Text Overlap + Stop 022 UX and Blocker Fixes

## Objective

Five gaps close here across two stops. Stop 021 has two text-overlap issues: the energy readout rows collide with the pie chart from above, and the "All PE converted to heat!" label overlaps the "water" container label at the boundary. Stop 022 has three issues: no cursor change on charge hover (minor UX friction), panel labels too faint with no description of each panel's purpose (major confusion), and a blocker where both sim.js and stop-shell.js register independent click listeners on `#sim-play-btn`, causing Play after Reset to immediately cancel itself.

## Context

**DEC-004**: `window.SimAPI = { start, pause, reset, destroy }` is the interface. stop-shell.js owns the play button. sim.js must not also bind the play button. The double-listener root cause (gap-08) is that `022/sim.js` lines 529–538 wire `#sim-play-btn` directly in `setup()`. Removing that block entirely is the correct fix — stop-shell.js already handles play/pause correctly via SimAPI.

**Stop 021 layout** (computed at runtime): `pieCY = H * 0.34`, `pieR = Math.min(W * 0.10, H * 0.13, 60)`. At H=400 and pieR=52, the current `readY = pieCY - pieR - 50 = 136 - 52 - 50 = 34px`. The five readout lines (16px spacing) end at 34 + 64 = 98px, which overlaps the top of the pie (at pieCY - pieR = 84px). Moving the block below the pie: `readY = pieCY + pieR + 20` places the first line at 208px — fully below the pie circle, clear of the legend (which starts at `pieCY + pieR + 14`). Note: the legend at `legendY = pieCY + pieR + 14` and the readout starting at `pieCY + pieR + 20` will overlap each other. To avoid this, either move the legend further down (`legendY = pieCY + pieR + 90`) or move the readout to the right of the pie using `readX = pieCX + pieR + 12`. The cleaner approach is to keep the readout to the right of the pie with enough x-offset so it does not overlap the circle: set `readX = pieCX + pieR + 12` and keep `readY = pieCY - pieR` (aligning the readout vertically with the top of the pie but to its right). This avoids all collisions.

**Stop 021 arrived label** (line 246): draws at `(appCX, appBottom - 2)` with `textBaseline='bottom'`, placing its baseline at `appBottom - 2`. The "water" label draws at `(appCX, containerY + 4)` with `textBaseline='top'`, where `containerY = appBottom`. Gap between baseline and top is only 6px. Fix: move the arrived label up to `appBottom - 28` — this gives ~28px of vertical clearance above the container top edge.

**Stop 022 cursor** (gap-06): the `mousemove` listener calls only `doDrag(e)`. Add a proximity check inside the mousemove handler. After `doDrag(e)`, iterate charges and check if mouse is within 20px of any charge center; if so set `canvas.style.cursor = 'pointer'`, else set `'default'`. The `doDrag` function already calls `getCanvasPos(e)`, so compute the position once and use it for both the drag and the cursor check.

**Stop 022 panel labels** (gap-07): `drawPanelLabels()` renders two labels at `rgba(200,200,200,0.4)` — 40% opacity. Change fillStyle to `rgba(200,200,200,0.85)`. Add a second `fillText` call under each label (offset by 14px in y) with a brief subtitle: `'Drag charges — field lines update live'` under "Electric Field" and `'Independent demo — adjust frequency & amplitude'` under "Electromagnetic Wave". Use a smaller font (9px) and a slightly lower opacity (0.55) for the subtitles.

## Tasks

<task id="09-FIX-02-01">
<name>Move energy readout to the right of the pie chart</name>
<files>
- Episodio4/stops/021-joule-energy/sim.js
</files>
<action>
In `drawPieChart()` (lines 350–375), change the readout anchor point so the text block appears to the right of the pie circle instead of above it.

Current lines 351–352:
  var readX = pieCX - pieR;
  var readY = pieCY - pieR - 50;

Replace with:
  var readX = pieCX + pieR + 12;
  var readY = pieCY - pieR;

This places the leftmost edge of the readout text 12px to the right of the pie's rightmost edge, and aligns the top of the text block with the top of the pie circle. The five readout lines (at readY, readY+16, readY+32, readY+48, readY+64) now run alongside the pie on its right side — no spatial overlap with the circle.

No other changes to the readout content or formatting. The `textAlign = 'left'` and `textBaseline = 'top'` remain the same.
</action>
<verify>
Load stop 021 in a browser and press Play. The energy readout (E_total, PE, KE, Q, "Total energy conserved") must appear to the right of the pie chart with no text overlapping the colored slices. At default canvas width the text must be fully within the canvas bounds.
Alternatively: confirm that `readX = pieCX + pieR + 12` and `readY = pieCY - pieR` in sim.js drawPieChart().
</verify>
<done>[ ]</done>
</task>

<task id="09-FIX-02-02">
<name>Separate arrived label from water container label</name>
<files>
- Episodio4/stops/021-joule-energy/sim.js
</files>
<action>
In `drawApparatus()`, find the arrived label block (around line 239–248):

  if (arrived) {
    ctx.save();
    ctx.font = 'bold 11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,120,50,0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('All PE converted to heat!', appCX, appBottom - 2);
    ctx.restore();
  }

Change the y coordinate from `appBottom - 2` to `appBottom - 28`:

    ctx.fillText('All PE converted to heat!', appCX, appBottom - 28);

This moves the label's baseline 28px above appBottom. Since the "water" container label draws at `containerY + 4` with `textBaseline='top'` (where containerY = appBottom), the gap between the arrived label baseline and the water label top is now approximately 24px — sufficient clearance to prevent overlap.

No other changes.
</action>
<verify>
Load stop 021 in a browser, press Play, and wait for the weight to reach the bottom. When arrived=true, the "All PE converted to heat!" label must appear clearly above the water container box with no overlap with the "water" text label drawn at the top of the container.
Alternatively: confirm the fillText y argument is `appBottom - 28` in the arrived label block of drawApparatus().
</verify>
<done>[ ]</done>
</task>

<task id="09-FIX-02-03">
<name>Add cursor pointer on charge hover in stop 022</name>
<files>
- Episodio4/stops/022-maxwell-equations/sim.js
</files>
<action>
In `setup()`, find the mousemove event listener (line 497):
  canvas.addEventListener('mousemove', function (e) { doDrag(e); });

Replace it with an expanded handler that also performs cursor detection:

  canvas.addEventListener('mousemove', function (e) {
    doDrag(e);
    var p = getCanvasPos(e);
    var overCharge = false;
    for (var ci = 0; ci < charges.length; ci++) {
      var dx = p.x - charges[ci].x;
      var dy = p.y - charges[ci].y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        overCharge = true;
        break;
      }
    }
    canvas.style.cursor = overCharge ? 'pointer' : 'default';
  });

The proximity threshold of 20px matches the drag-start radius used in `startDrag()` (which uses < 22px). No changes to any other function.
</action>
<verify>
Load stop 022 in a browser. Move the mouse over one of the two charge circles. The cursor must change to a hand/pointer icon. Moving the mouse away from both charges must restore the default arrow cursor. The drag behavior must be unchanged.
Alternatively: confirm the mousemove listener in setup() contains a loop over charges checking distance < 20 and setting canvas.style.cursor.
</verify>
<done>[ ]</done>
</task>

<task id="09-FIX-02-04">
<name>Increase panel label visibility and add subtitles in stop 022</name>
<files>
- Episodio4/stops/022-maxwell-equations/sim.js
</files>
<action>
In `drawPanelLabels()` (lines 357–367), make the following changes:

1. Change the title fillStyle from `'rgba(200,200,200,0.4)'` to `'rgba(200,200,200,0.85)'`.

2. After the two existing `ctx.fillText` title calls, add subtitle lines. Insert the following after the two title fillText calls and before `ctx.restore()`:

  ctx.font = '9px "DM Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(200,200,200,0.55)';
  ctx.fillText('Drag charges \u2014 field lines update live', splitX * 0.5, 22);
  ctx.fillText('Independent demo \u2014 adjust frequency & amplitude', splitX + (W - splitX) * 0.5, 22);

The y position of 22 places the subtitle approximately 14px below the title (which draws at y=8). The `textAlign = 'center'` and `textBaseline = 'top'` already set above apply to these lines too.

No changes outside drawPanelLabels().
</action>
<verify>
Load stop 022 in a browser. Both panel title labels ("Electric Field" and "Electromagnetic Wave") must be clearly readable at the top of each panel — not faint. Under each title, a one-line subtitle describing the panel's purpose must be visible in a smaller font.
Alternatively: confirm drawPanelLabels() in sim.js uses `'rgba(200,200,200,0.85)'` for the title fillStyle and has two additional fillText calls at y=22 with the subtitle strings.
</verify>
<done>[ ]</done>
</task>

<task id="09-FIX-02-05">
<name>Remove duplicate play-button listener from stop 022 sim.js — blocker</name>
<files>
- Episodio4/stops/022-maxwell-equations/sim.js
</files>
<action>
In `setup()`, find and remove the entire play button click listener block. Currently lines 528–538:

  /* Play button */
  var playBtn = document.getElementById('sim-play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', function () {
      if (playBtn.dataset.state === 'playing') {
        window.SimAPI.pause();
      } else {
        window.SimAPI.start();
      }
    });
  }

Delete these 9 lines entirely. Do not replace them with anything. stop-shell.js already registers its own listener on `#sim-play-btn` via `_bindPlayButton()` and calls `SimAPI.start()` / `SimAPI.pause()` correctly. Having both listeners active causes the state to toggle twice on every click: sim.js fires first (sets state to 'playing', starts loop), then stop-shell.js fires (reads state='playing', calls SimAPI.pause(), stops loop). After reset this produces a static frozen wave.

The reset button listener immediately below (lines 540–546) must be kept — only the play button block is removed.
</action>
<verify>
Load stop 022 in a browser. Press Play — the EM wave must animate. Press Pause — it must stop. Press Reset — it must return to t=0. Press Play again — the EM wave must animate again (not be frozen). This sequence must work at least three times in a row without the wave becoming static.
Alternatively: confirm that setup() in 022/sim.js contains no addEventListener call referencing 'sim-play-btn' or any click handler calling SimAPI.start() or SimAPI.pause().
</verify>
<done>[ ]</done>
</task>

## Must-Haves

After all tasks complete, the following must be true:

- [ ] `readX = pieCX + pieR + 12` and `readY = pieCY - pieR` in `drawPieChart()` of `021/sim.js`
- [ ] Arrived label y is `appBottom - 28` in `drawApparatus()` of `021/sim.js`
- [ ] mousemove handler in `022/sim.js` setup() contains proximity check and sets `canvas.style.cursor = 'pointer'` when within 20px of a charge
- [ ] `drawPanelLabels()` fillStyle for titles is `'rgba(200,200,200,0.85)'` and two subtitle fillText calls exist at y=22
- [ ] `setup()` in `022/sim.js` contains no `addEventListener('click', ...)` block referencing `#sim-play-btn`
