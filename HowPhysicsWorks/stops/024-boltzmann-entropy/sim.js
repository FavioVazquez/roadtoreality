/* ============================================================
   sim.js — Stop 024: Boltzmann and Entropy
   TWO-PANEL SIMULATION:
     LEFT  — ~60 elastic-collision particles, temperature slider,
              live Maxwell-Boltzmann speed histogram (EMA-smoothed)
     RIGHT — partition wall that user removes; particles spread
              from one half to both halves; entropy meter climbs.
   Both panels run simultaneously in one rAF loop.
   Squared-distance collision detection — no Math.sqrt in threshold loop.
   ES5 IIFE.
   ============================================================ */
(function () {
  'use strict';

  /* ── Mount ─────────────────────────────────────────────── */
  var mount = document.getElementById('sim-mount');
  if (!mount) return;

  var dpr = window.devicePixelRatio || 1;
  var canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width   = '100%';
  canvas.style.height  = '100%';
  mount.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var W, H;
  var splitX;           /* pixel boundary between left and right panels */

  function resize() {
    var rect = mount.getBoundingClientRect();
    W = Math.max(360, rect.width  || mount.clientWidth  || 640);
    H = Math.max(260, rect.height || mount.clientHeight || 400);
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    splitX = Math.floor(W * 0.46);   /* panel width; recomputed on every resize */
  }
  resize();

  /* ── Shared state ───────────────────────────────────────── */
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Temperature: 0.2–3.0 (scales particle speed) */
  var temperature = 1.0;

  /* ─────────────────────────────────────────────────────────
     LEFT PANEL — Maxwell-Boltzmann gas
  ───────────────────────────────────────────────────────── */
  var N_LEFT = 60;
  var R_LEFT = 4;           /* particle radius px (logical) */
  var leftParticles = [];

  /* EMA-smoothed histogram bins */
  var BINS      = 10;
  var BIN_MAX_V = 4.0;      /* speed axis max (in base units) */
  var histEMA   = [];
  var EMA_ALPHA = 0.06;

  function initLeft() {
    leftParticles = [];
    histEMA = [];
    for (var b = 0; b < BINS; b++) histEMA.push(0);

    for (var i = 0; i < N_LEFT; i++) {
      var spd = baseSpeed() * (0.5 + Math.random() * 1.5);
      var ang = Math.random() * Math.PI * 2;
      leftParticles.push({
        x: 0, y: 0,          /* set in stepLeft with box coords */
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: R_LEFT
      });
    }
  }

  function baseSpeed() { return 1.2 * Math.sqrt(temperature); }

  function rescaleLeftSpeeds(oldT, newT) {
    var factor = Math.sqrt(newT / oldT);
    for (var i = 0; i < leftParticles.length; i++) {
      leftParticles[i].vx *= factor;
      leftParticles[i].vy *= factor;
    }
  }

  /* ─────────────────────────────────────────────────────────
     RIGHT PANEL — Entropy expansion
  ───────────────────────────────────────────────────────── */
  var N_RIGHT    = 50;
  var R_RIGHT    = 4;
  var wallOpen   = false;
  var entropyVal = 0;       /* 0–1 normalized */
  var rightParticles = [];

  function initRight() {
    rightParticles = [];
    wallOpen = false;
    entropyVal = 0;

    var spd = 1.2;
    for (var i = 0; i < N_RIGHT; i++) {
      var ang = Math.random() * Math.PI * 2;
      rightParticles.push({
        x: 0, y: 0,          /* randomised in first right step */
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: R_RIGHT,
        inited: false
      });
    }
  }

  /* ─────────────────────────────────────────────────────────
     WIRE CONTROLS (declared in HTML)
  ───────────────────────────────────────────────────────── */
  var tempSlider  = document.getElementById('temperature-slider');
  var tempVal     = document.getElementById('temperature-readout');
  var wallBtn     = document.getElementById('remove-partition-btn');

  if (tempSlider) {
    tempSlider.addEventListener('input', function () {
      /* slider range 100–1500; map to temperature 0.2–3.0 via /500 */
      var newT = parseInt(tempSlider.value, 10) / 500;
      rescaleLeftSpeeds(temperature, newT);
      temperature = newT;
      if (tempVal) tempVal.textContent = newT.toFixed(1) + ' T';
    });
  }

  if (wallBtn) {
    wallBtn.addEventListener('click', function () {
      wallOpen = true;
      wallBtn.disabled = true;
      wallBtn.style.opacity = '0.5';
    });
  }

  /* Expose wallBtn for reset */
  window._dopplerWallBtn = wallBtn;

  /* ─────────────────────────────────────────────────────────
     PHYSICS HELPERS
  ───────────────────────────────────────────────────────── */

  /* Elastic collision between two particles (equal mass) */
  function collide(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var dist2 = dx * dx + dy * dy;
    var minDist = a.r + b.r;
    if (dist2 >= minDist * minDist || dist2 === 0) return;

    /* Normal vector */
    var dist = Math.sqrt(dist2);
    var nx = dx / dist;
    var ny = dy / dist;

    /* Relative velocity along normal */
    var dvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (dvn > 0) return;  /* already separating */

    /* Exchange velocity along normal (equal mass) */
    a.vx += dvn * nx;
    a.vy += dvn * ny;
    b.vx -= dvn * nx;
    b.vy -= dvn * ny;

    /* Positional separation */
    var overlap = minDist - dist;
    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;
  }

  function bounceBox(p, x0, y0, x1, y1) {
    if (p.x - p.r < x0) { p.x = x0 + p.r; p.vx = Math.abs(p.vx); }
    if (p.x + p.r > x1) { p.x = x1 - p.r; p.vx = -Math.abs(p.vx); }
    if (p.y - p.r < y0) { p.y = y0 + p.r; p.vy = Math.abs(p.vy); }
    if (p.y + p.r > y1) { p.y = y1 - p.r; p.vy = -Math.abs(p.vy); }
  }

  /* ─────────────────────────────────────────────────────────
     STEP FUNCTIONS
  ───────────────────────────────────────────────────────── */

  /* Panel geometry — uses splitX computed once in resize(), not per-frame */
  function leftBox() {
    var pad = 8;
    return { x0: pad, y0: pad + 28, x1: splitX - pad, y1: H - pad - 40 };
  }

  function rightBox() {
    var pad = 8;
    var rx0 = W - splitX + pad;
    return { x0: rx0, y0: pad + 28, x1: W - pad, y1: H - pad - 40 };
  }

  function stepLeft(box) {
    /* Ensure all particles are inside box on first frame */
    for (var i = 0; i < leftParticles.length; i++) {
      var p = leftParticles[i];
      if (p.x === 0 && p.y === 0) {
        p.x = box.x0 + p.r * 2 + Math.random() * (box.x1 - box.x0 - p.r * 4);
        p.y = box.y0 + p.r * 2 + Math.random() * (box.y1 - box.y0 - p.r * 4);
      }
      p.x += p.vx;
      p.y += p.vy;
      bounceBox(p, box.x0, box.y0, box.x1, box.y1);
    }
    /* Pairwise collisions — squared distance threshold, no sqrt in check */
    for (var a = 0; a < leftParticles.length - 1; a++) {
      var pa = leftParticles[a];
      var minSq = (pa.r + R_LEFT) * (pa.r + R_LEFT);
      for (var b = a + 1; b < leftParticles.length; b++) {
        var pb = leftParticles[b];
        var dxab = pb.x - pa.x;
        var dyab = pb.y - pa.y;
        if (dxab * dxab + dyab * dyab < minSq) {
          collide(pa, pb);
        }
      }
    }

    /* Update EMA histogram */
    var rawBins = [];
    for (var c = 0; c < BINS; c++) rawBins.push(0);
    for (var k = 0; k < leftParticles.length; k++) {
      var pk = leftParticles[k];
      var spd = Math.sqrt(pk.vx * pk.vx + pk.vy * pk.vy);
      /* Normalise speed by base speed */
      var normSpd = spd / Math.max(0.01, baseSpeed());
      var bin = Math.min(BINS - 1, Math.floor(normSpd / (BIN_MAX_V / BINS)));
      rawBins[bin]++;
    }
    for (var d = 0; d < BINS; d++) {
      histEMA[d] = histEMA[d] * (1 - EMA_ALPHA) + rawBins[d] * EMA_ALPHA;
    }
  }

  function stepRight(box) {
    var midX = (box.x0 + box.x1) * 0.5;

    /* Constrain to left half if wall is closed */
    var r0 = box.x0;
    var r1 = wallOpen ? box.x1 : midX;

    for (var i = 0; i < rightParticles.length; i++) {
      var p = rightParticles[i];
      if (!p.inited) {
        p.x = box.x0 + p.r * 2 + Math.random() * (midX - box.x0 - p.r * 4);
        p.y = box.y0 + p.r * 2 + Math.random() * (box.y1 - box.y0 - p.r * 4);
        p.inited = true;
      }
      p.x += p.vx;
      p.y += p.vy;
      bounceBox(p, r0, box.y0, r1, box.y1);
    }
    /* Pairwise collision — squared distance threshold */
    for (var a = 0; a < rightParticles.length - 1; a++) {
      var pa = rightParticles[a];
      var minSq = (pa.r + R_RIGHT) * (pa.r + R_RIGHT);
      for (var b = a + 1; b < rightParticles.length; b++) {
        var pb = rightParticles[b];
        var dx = pb.x - pa.x;
        var dy = pb.y - pa.y;
        if (dx * dx + dy * dy < minSq) {
          collide(pa, pb);
        }
      }
    }

    /* Entropy: fraction of particles in right half when wall open */
    if (wallOpen) {
      var inRight = 0;
      for (var j = 0; j < rightParticles.length; j++) {
        if (rightParticles[j].x > midX) inRight++;
      }
      /* Max entropy when half in each side: entropyVal→1 */
      var frac = inRight / rightParticles.length;
      var overlap = frac < 0.5 ? frac : 1 - frac;   /* 0 = all one side, 0.5 = even */
      var target = 1.0 - Math.abs(1.0 - 2.0 * overlap) * (1.0 - overlap);
      /* Smooth approach */
      entropyVal += (target - entropyVal) * 0.015;
      entropyVal = Math.max(0, Math.min(1, entropyVal));
    }
  }

  /* ─────────────────────────────────────────────────────────
     DRAW FUNCTIONS
  ───────────────────────────────────────────────────────── */
  var COLOR_PART  = 'rgba(82,133,200,';
  var COLOR_GOLD  = 'rgba(255,200,60,';
  var COLOR_FRAME = 'rgba(82,133,200,0.35)';
  var COLOR_WALL  = 'rgba(200,120,50,0.85)';
  var COLOR_HIST  = 'rgba(82,133,200,0.55)';
  var COLOR_MB    = 'rgba(255,200,60,0.75)';

  function drawLabel(text, x, y) {
    ctx.fillStyle = 'rgba(130,165,210,0.9)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  function drawLeftPanel(box) {
    /* Frame */
    ctx.strokeStyle = COLOR_FRAME;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);

    drawLabel('Maxwell-Boltzmann Gas', box.x0 + 4, box.y0 - 24);

    /* Particles */
    for (var i = 0; i < leftParticles.length; i++) {
      var p = leftParticles[i];
      var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      var alpha = Math.min(1, 0.4 + spd / (baseSpeed() * 2));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = COLOR_PART + alpha + ')';
      ctx.fill();
    }

    /* Histogram panel below */
    var histX  = box.x0;
    var histY  = box.y1 + 4;
    var histW  = box.x1 - box.x0;
    var histH  = H - histY - 4;
    if (histH < 24) return;

    var binW   = histW / BINS;
    var maxEMA = Math.max.apply(null, histEMA) || 1;

    ctx.strokeStyle = 'rgba(82,133,200,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(histX, histY, histW, histH);

    for (var b = 0; b < BINS; b++) {
      var bh = Math.max(1, (histEMA[b] / maxEMA) * histH * 0.92);
      ctx.fillStyle = COLOR_HIST;
      ctx.fillRect(histX + b * binW + 1, histY + histH - bh, binW - 2, bh);
    }

    /* Maxwell-Boltzmann theory curve:
       f(v) ~ v * exp(-v^2 / (2*T))  (2D Maxwell-Boltzmann) */
    ctx.beginPath();
    var first = true;
    for (var s = 0; s <= BINS * 4; s++) {
      var v = (s / (BINS * 4)) * BIN_MAX_V;
      var vn = v / Math.max(0.01, Math.sqrt(temperature) * 1.2);
      var fv = vn * Math.exp(-vn * vn * 0.5);
      var normFv = fv / 0.6065;   /* normalise peak to ~1 */
      var px = histX + (v / BIN_MAX_V) * histW;
      var py = histY + histH - normFv * histH * 0.92;
      if (first) { ctx.moveTo(px, py); first = false; }
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = COLOR_MB;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    /* axis labels */
    ctx.fillStyle = 'rgba(120,150,190,0.7)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('speed', histX + 2, histY + histH - 12);
    ctx.fillStyle = COLOR_MB;
    ctx.fillText('MB curve', histX + histW - 54, histY + 2);
  }

  function drawRightPanel(box) {
    ctx.strokeStyle = COLOR_FRAME;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);

    drawLabel('Entropy Expansion', box.x0 + 4, box.y0 - 24);

    var midX = (box.x0 + box.x1) * 0.5;

    /* Partition wall */
    if (!wallOpen) {
      ctx.strokeStyle = COLOR_WALL;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(midX, box.y0);
      ctx.lineTo(midX, box.y1);
      ctx.stroke();
      ctx.setLineDash([]);

      /* Wall label */
      ctx.save();
      ctx.translate(midX - 14, (box.y0 + box.y1) * 0.5);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = COLOR_WALL;
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WALL', 0, 0);
      ctx.restore();
    }

    /* Particles */
    for (var i = 0; i < rightParticles.length; i++) {
      var p = rightParticles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = COLOR_PART + '0.75)';
      ctx.fill();
    }

    /* Entropy meter */
    var meterX = box.x0;
    var meterY = box.y1 + 4;
    var meterW = box.x1 - box.x0;
    var meterH = H - meterY - 4;
    if (meterH < 16) return;

    /* Track */
    ctx.fillStyle = 'rgba(82,133,200,0.12)';
    ctx.fillRect(meterX, meterY + 6, meterW, meterH - 12);
    ctx.strokeStyle = 'rgba(82,133,200,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(meterX, meterY + 6, meterW, meterH - 12);

    /* Fill */
    var fillW = entropyVal * (meterW - 2);
    var grad = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
    grad.addColorStop(0, 'rgba(82,133,200,0.6)');
    grad.addColorStop(0.5, 'rgba(120,200,140,0.7)');
    grad.addColorStop(1, 'rgba(240,160,60,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(meterX + 1, meterY + 7, fillW, meterH - 14);

    /* Label */
    ctx.fillStyle = 'rgba(130,165,210,0.9)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('S = k ln \u03A9', meterX + 4, meterY);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,200,60,0.9)';
    ctx.fillText((entropyVal * 100).toFixed(0) + '%', meterX + meterW - 2, meterY);
    ctx.textAlign = 'left';

    /* "max entropy" label when nearly full */
    if (entropyVal > 0.88) {
      ctx.fillStyle = 'rgba(240,160,60,0.85)';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('max \u2191', meterX + meterW * 0.6, meterY);
    }
  }

  /* ─────────────────────────────────────────────────────────
     MAIN LOOP
  ───────────────────────────────────────────────────────── */
  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    /* Faint background */
    ctx.fillStyle = 'rgba(82,133,200,0.03)';
    ctx.fillRect(0, 0, W, H);

    var lb = leftBox();
    var rb = rightBox();

    stepLeft(lb);
    stepRight(rb);

    drawLeftPanel(lb);
    drawRightPanel(rb);

    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.03)';
    ctx.fillRect(0, 0, W, H);
    var lb = leftBox();
    var rb = rightBox();
    drawLeftPanel(lb);
    drawRightPanel(rb);
  }

  /* ── SimAPI ─────────────────────────────────────────────── */
  window.SimAPI = {
    start: function () {
      if (running) return;
      running = true;
      if (reduced) { drawStatic(); return; }
      raf = requestAnimationFrame(drawFrame);
    },
    pause: function () {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    },
    reset: function () {
      window.SimAPI.pause();
      temperature = 1.0;
      initLeft();
      initRight();
      entropyVal = 0;
      if (window._dopplerWallBtn) {
        window._dopplerWallBtn.disabled = false;
        window._dopplerWallBtn.style.opacity = '1';
      }
      drawStatic();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };

  window.addEventListener('resize', function () {
    resize();
    if (!running) drawStatic();
  });

  initLeft();
  initRight();
  drawStatic();
}());
