---
wave: 1
depends_on: []
gap_closure: true
files_modified:
  - Episodio4/stops/027-planck-blackbody/sim.js
  - Episodio4/stops/040-nuclear-fission/sim.js
autonomous: true
objective: "Fix two teaser animation quality issues: 027 Planck glow-only animation replaced with a temperature sweep that visibly shifts the curve peak; 040 fission chain reaction slowed so each stage is readable (larger spawn distance + slower neutrons + per-nucleus arm delay)."
must_haves:
  - "027 sim.js animates the Planck curve peak visibly shifting — the curve's peak wavelength moves left/right as a temperature parameter oscillates"
  - "027 sim.js the Rayleigh-Jeans dashed line also updates to match the temperature-scaled divergence"
  - "040 sim.js daughter nuclei are spawned at least 60px from the parent nucleus"
  - "040 sim.js neutron speed is 1.2px/frame or slower (was 2.5px/frame)"
  - "040 sim.js each daughter nucleus has an 'armed' delay of at least 30 frames before it can be hit by a neutron"
  - "Both sim.js files preserve the window.SimAPI contract (start/pause/reset/destroy)"
  - "Both sim.js files still call drawStatic() at the end for initial static frame"
---

# Plan 06-05-FIX: Teaser Animation Quality

## Objective

Fix two sim.js files where the animation is not clearly visible to users.

## Root Causes

**027 Planck:** `t` only drives `glow = 0.8 + 0.2 * Math.sin(t * 2)` — a ±0.2 opacity pulse on the Planck curve. The curves' shapes and positions never change, making the animation indistinguishable from a static image.

**040 Fission:** The loop works correctly (reset at `nuclei.length > 20`), but daughter nuclei are spawned only `nuc.r * 0.8 = 16px` from the parent. Neutrons travel at `2.5px/frame`, reaching daughters in ~6 frames (~0.1s at 60fps). The entire chain reaction completes too fast for the eye to follow.

## Tasks

<task id="06-05-01">
<name>Fix 027 Planck: temperature-sweep animation</name>
<files>
- Episodio4/stops/027-planck-blackbody/sim.js
</files>
<action>
Replace the current sim.js for 027 with a version that sweeps a temperature parameter `T` back and forth, causing the Planck curve peak to visibly shift left and right.

Key changes from current implementation:
1. Add a `T` variable that oscillates: `T = 3000 + 2500 * (0.5 + 0.5 * Math.sin(t * 0.4))` — sweeps from ~500K to ~5500K
2. Update the `planck(freq, T)` function to use T: `var x = freq * (6000 / T); return (x*x*x) / (Math.exp(x) - 1) * 0.35;`
3. Update `rayleigh(freq, T)` similarly: `return freq * freq * (T / 6000) * 0.22;`
4. In `drawFrame`, compute `T = 3000 + 2500 * (0.5 + 0.5 * Math.sin(t * 0.4))` and pass to both curve functions
5. Show the current temperature label: e.g. `ctx.fillText('T = ' + Math.round(T) + ' K', ox + gW * 0.6, oy - gH * 0.6)`
6. Add a vertical dashed line at the peak wavelength (where Planck curve is highest) that moves as T changes
7. Keep the axes, labels, "Rayleigh-Jeans" and "Planck's law" text labels from current version

The `drawStatic()` function should render a single frame with `T = 3000` (midpoint temperature).

Full replacement file:

```javascript
/* sim.js — 027 Planck: blackbody spectrum, temperature sweep — teaser */
(function () {
  'use strict';
  var mount = document.getElementById('sim-mount');
  if (!mount) return;

  var canvas = document.createElement('canvas');
  canvas.width  = mount.clientWidth  || 600;
  canvas.height = mount.clientHeight || 360;
  canvas.style.display = 'block';
  canvas.style.width  = '100%';
  canvas.style.height = '100%';
  mount.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var W = canvas.width;
  var H = canvas.height;
  var raf = null;
  var t = 0;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ox = W * 0.12, oy = H * 0.82, gW = W * 0.80, gH = H * 0.65;

  function planck(freq, T) {
    var scale = T / 4000;
    var x = freq * 3 / scale;
    if (x < 0.01) return 0;
    return (x * x * x) / (Math.exp(Math.min(x, 20)) - 1) * 0.32 * scale;
  }

  function rayleigh(freq, T) {
    return freq * freq * (T / 4000) * 0.20;
  }

  function drawScene(T) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'oklch(0.10 0.01 285)';
    ctx.fillRect(0, 0, W, H);

    /* Axes */
    ctx.strokeStyle = 'rgba(160,92,200,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy - gH); ctx.lineTo(ox, oy); ctx.lineTo(ox + gW, oy);
    ctx.stroke();

    ctx.fillStyle = 'rgba(160,92,200,0.6)';
    ctx.font = '11px monospace';
    ctx.fillText('frequency →', ox + gW * 0.68, oy + 14);
    ctx.fillText('intensity', ox - 8, oy - gH + 12);

    /* Rayleigh-Jeans: diverges at high frequency */
    ctx.beginPath();
    for (var i = 0; i <= 90; i++) {
      var freq = i / 90;
      var val = rayleigh(freq, T);
      var x = ox + freq * gW;
      var y = oy - Math.min(val, 1.1) * gH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(220,80,80,0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(220,80,80,0.75)';
    ctx.fillText('Rayleigh-Jeans →∞', ox + gW * 0.42, oy - gH * 0.88);

    /* Planck curve */
    var peakFreq = 0;
    var peakVal = 0;
    ctx.beginPath();
    for (var j = 0; j <= 90; j++) {
      var f = j / 90;
      var p = planck(f, T);
      if (p > peakVal) { peakVal = p; peakFreq = f; }
      var px = ox + f * gW;
      var py = oy - Math.min(p, 1.05) * gH;
      if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText("Planck's law ✓", ox + gW * 0.18, oy - gH * 0.78);

    /* Moving peak marker */
    var peakX = ox + peakFreq * gW;
    ctx.strokeStyle = 'rgba(160,92,200,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(peakX, oy - Math.min(peakVal, 1.05) * gH - 6);
    ctx.lineTo(peakX, oy);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Temperature label */
    ctx.fillStyle = 'rgba(200,160,255,0.9)';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('T = ' + Math.round(T) + ' K', ox + gW * 0.62, oy - gH * 0.55);
  }

  function drawFrame() {
    var T = 3000 + 2500 * (0.5 + 0.5 * Math.sin(t * 0.4));
    drawScene(T);
    t += 0.025;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = 0; drawScene(3000); }

  window.SimAPI = {
    start:   function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause:   function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset:   function () { window.SimAPI.pause(); t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
```
</action>
<verify>
- `grep "T = 3000" Episodio4/stops/027-planck-blackbody/sim.js` returns the temperature sweep line
- `grep "Math.sin(t \* 0.4)" Episodio4/stops/027-planck-blackbody/sim.js` returns one result (temperature oscillation)
- `grep "window.SimAPI" Episodio4/stops/027-planck-blackbody/sim.js` returns the SimAPI assignment
- `grep "drawStatic" Episodio4/stops/027-planck-blackbody/sim.js` returns at least 3 results (definition, reset call, final call)
</verify>
<done>[ ]</done>
</task>

<task id="06-05-02">
<name>Fix 040 Fission: slow chain reaction so each stage is visible</name>
<files>
- Episodio4/stops/040-nuclear-fission/sim.js
</files>
<action>
Replace the current sim.js for 040 with a version where the chain reaction unfolds slowly enough to see each stage.

Key changes from current implementation:
1. Increase spawn distance: `dist = nuc.r * 3.5` (was `nuc.r * 0.8`) so daughters spawn ~70px from parent
2. Slow neutron speed: `vx: Math.cos(a) * 1.2` (was `2.5`) — takes ~58 frames (~1s) to reach daughters
3. Add `armed` flag to each nucleus: daughters start with `armed: false` and become `armed: true` after 20 frames
4. Collision check only triggers on `armed` nuclei
5. Limit chain depth: daughters of daughters spawn only 2 products (not 4) to keep canvas readable
6. After reset, add a 1.5s pause before the next neutron fires (use a `countdown` variable)

Full replacement file:

```javascript
/* sim.js — 040 Nuclear Fission: chain reaction, slowed for visibility — teaser */
(function () {
  'use strict';
  var mount = document.getElementById('sim-mount');
  if (!mount) return;

  var canvas = document.createElement('canvas');
  canvas.width  = mount.clientWidth  || 600;
  canvas.height = mount.clientHeight || 360;
  canvas.style.display = 'block';
  canvas.style.width  = '100%';
  canvas.style.height = '100%';
  mount.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var W = canvas.width;
  var H = canvas.height;
  var raf = null;
  var t = 0;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLOR = '#c87050';

  var nuclei = [];
  var neutrons = [];
  var countdown = 0; /* frames before next reset fires neutron */

  function resetScene() {
    nuclei = [{ x: W/2, y: H/2, split: false, r: 22, armed: true, gen: 0 }];
    neutrons = [];
    countdown = 60; /* 1s pause before neutron fires */
  }
  resetScene();

  function spawnNeutron() {
    neutrons = [{ x: W * 0.06, y: H / 2, vx: 1.4, vy: 0 }];
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.05)';
    ctx.fillRect(0, 0, W, H);

    /* Countdown before firing */
    if (countdown > 0) {
      countdown--;
      if (countdown === 0) spawnNeutron();
    }

    /* Arm daughters after delay */
    nuclei.forEach(function (nuc) {
      if (!nuc.armed) {
        nuc.armTimer = (nuc.armTimer || 0) + 1;
        if (nuc.armTimer >= 25) nuc.armed = true;
      }
    });

    /* Move neutrons */
    neutrons.forEach(function (n) {
      if (n.vx === 0 && n.vy === 0) return;
      n.x += n.vx;
      n.y += n.vy;

      nuclei.forEach(function (nuc) {
        if (nuc.split || !nuc.armed) return;
        var dx = n.x - nuc.x, dy = n.y - nuc.y;
        if (dx * dx + dy * dy < nuc.r * nuc.r) {
          nuc.split = true;
          n.vx = 0; n.vy = 0;
          /* Spawn daughters */
          var count = nuc.gen === 0 ? 4 : 2;
          for (var i = 0; i < count; i++) {
            var a = (Math.PI * 2 / count) * i + (nuc.gen * 0.5);
            var dist = nuc.r * 3.2;
            nuclei.push({ x: nuc.x + Math.cos(a) * dist, y: nuc.y + Math.sin(a) * dist,
              split: false, r: nuc.gen === 0 ? 14 : 9,
              armed: false, armTimer: 0, gen: nuc.gen + 1 });
            neutrons.push({ x: nuc.x, y: nuc.y,
              vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2 });
          }
        }
      });
    });

    /* Draw nuclei */
    nuclei.forEach(function (nuc) {
      ctx.beginPath();
      ctx.arc(nuc.x, nuc.y, nuc.r, 0, Math.PI * 2);
      ctx.fillStyle = nuc.split ? 'rgba(200,112,80,0.25)' : (nuc.armed ? 'rgba(200,112,80,0.80)' : 'rgba(200,112,80,0.45)');
      ctx.fill();
      ctx.strokeStyle = COLOR;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    /* Draw neutrons */
    neutrons.forEach(function (n) {
      if (n.vx === 0 && n.vy === 0) return;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,220,80,0.95)';
      ctx.fill();
    });

    /* Label */
    ctx.fillStyle = 'rgba(200,112,80,0.75)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('U-235 + n → fragments + 2–3n + energy', W / 2, H * 0.06);
    ctx.textAlign = 'left';

    /* Reset when chain is done */
    var allSplit = nuclei.length > 1 && nuclei.every(function (n) { return n.split; });
    var allGone = neutrons.length > 0 && neutrons.every(function (n) {
      return (n.vx === 0 && n.vy === 0) || n.x > W + 20 || n.x < -20 || n.y > H + 20 || n.y < -20;
    });
    if (nuclei.length > 15 || (allSplit && allGone)) {
      resetScene();
    }

    t += 0.016;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() {
    resetScene();
    spawnNeutron();
    t = 0;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.05)';
    ctx.fillRect(0, 0, W, H);
    /* Draw initial state: one nucleus at center, neutron at left */
    ctx.beginPath();
    ctx.arc(W/2, H/2, 22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,112,80,0.80)';
    ctx.fill();
    ctx.strokeStyle = COLOR; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath();
    ctx.arc(W * 0.06, H / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,80,0.95)';
    ctx.fill();
    ctx.fillStyle = 'rgba(200,112,80,0.75)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('U-235 + n → fragments + 2–3n + energy', W / 2, H * 0.06);
    ctx.textAlign = 'left';
  }

  window.SimAPI = {
    start:   function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause:   function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset:   function () { window.SimAPI.pause(); resetScene(); t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
```
</action>
<verify>
- `grep "dist = nuc.r \* 3" Episodio4/stops/040-nuclear-fission/sim.js` returns the larger spawn distance
- `grep "vx: 1\." Episodio4/stops/040-nuclear-fission/sim.js` returns the slower neutron speed
- `grep "armed" Episodio4/stops/040-nuclear-fission/sim.js | wc -l` returns at least 4 (flag definition + arming logic + collision guard + spawn)
- `grep "countdown" Episodio4/stops/040-nuclear-fission/sim.js | wc -l` returns at least 3
- `grep "window.SimAPI" Episodio4/stops/040-nuclear-fission/sim.js` returns the contract
</verify>
<done>[ ]</done>
</task>

## Must-Haves

- [ ] 027 sim.js: Planck curve peak visibly shifts as temperature sweeps 500K–5500K
- [ ] 027 sim.js: temperature label "T = XXXX K" updates on screen each frame
- [ ] 040 sim.js: daughters spawn ~70px from parent (nuc.r * 3.2)
- [ ] 040 sim.js: neutron speed ≤ 1.4px/frame
- [ ] 040 sim.js: armed flag prevents instant second-generation hits
- [ ] Both files: window.SimAPI contract preserved
