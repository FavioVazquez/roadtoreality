/* ============================================================
   sim.js — Stop 016: Euler and Rigid Body Rotation
   Split canvas: left = three rotating bodies (disk, rod, ring),
                 right = angular-velocity graph over time
   Controls: torque slider, mass slider
   Physics: τ = I·α, I differs per shape
   ============================================================ */
(function () {
  'use strict';

  /* ── Top-level state ──────────────────────────────────────── */
  var mount, canvas, ctx, dpr, W, H;
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t = 0;

  var splitX;   /* W * 0.60 — bodies panel vs graph panel */

  /* ── Physics parameters driven by sliders ─────────────────── */
  var torque = 5.0;   /* N·m, range 1–20 */
  var mass   = 2.0;   /* kg,  range 0.5–5 */
  var radius = 0.4;   /* m, fixed display radius */

  /* ── Angular state per shape ──────────────────────────────── */
  /* Shapes: 0=Disk, 1=Rod, 2=Ring */
  var SHAPE_COUNT = 3;
  var angles  = [0, 0, 0];    /* radians */
  var omegas  = [0, 0, 0];    /* rad/s */

  /* Moment of inertia for each shape */
  function momentOfInertia(shapeIdx) {
    var m = mass;
    var r = radius;
    switch (shapeIdx) {
      case 0: return 0.5 * m * r * r;       /* Disk:  I = ½mr² */
      case 1: return (1 / 3) * m * r * r;   /* Rod:   I = ⅓mL² (L=r, pivot at end) */
      case 2: return m * r * r;              /* Ring:  I = mr² */
    }
    return 1;
  }

  /* ── Angular velocity history for graph ───────────────────── */
  var HISTORY_LEN = 200;
  var omegaHistory = [[], [], []];
  var historyT     = [];

  function initHistory() {
    for (var i = 0; i < SHAPE_COUNT; i++) {
      omegaHistory[i] = [];
    }
    historyT = [];
  }

  /* ── Body layout (computed in resize) ─────────────────────── */
  var bodyPositions = [];

  function computeBodyLayout() {
    var panelW = splitX;
    var spacing = panelW / 4;
    bodyPositions = [
      { cx: spacing,         cy: H * 0.46 },   /* Disk  */
      { cx: spacing * 2,     cy: H * 0.46 },   /* Rod   */
      { cx: spacing * 3,     cy: H * 0.46 }    /* Ring  */
    ];
  }

  /* ── Shape drawing ────────────────────────────────────────── */
  var SHAPE_COLORS = ['#5285c8', '#61bd85', '#c88752'];
  var SHAPE_LABELS = ['Disk',  'Rod',  'Ring'];
  var SHAPE_FORMULAS = ['I = \u00bdmr\u00b2', 'I = \u2153mL\u00b2', 'I = mr\u00b2'];

  /* visual radius in pixels */
  function vRadius() {
    return Math.min(splitX / 5, H * 0.18);
  }

  function drawDisk(cx, cy, angle, color, vr) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    /* filled disk */
    ctx.beginPath();
    ctx.arc(0, 0, vr, 0, Math.PI * 2);
    ctx.fillStyle = color.replace(')', ',0.15)').replace('rgb', 'rgba');
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    /* radius line marker */
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(vr - 2, 0);
    ctx.stroke();
    /* center dot */
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawRod(cx, cy, angle, color, vr) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    /* rod body */
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(vr, 0);
    ctx.stroke();
    /* pivot dot */
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    /* mass blob at end */
    ctx.beginPath();
    ctx.arc(vr, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = color.replace(')', ',0.30)').replace('rgb', 'rgba');
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawRing(cx, cy, angle, color, vr) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    /* ring */
    ctx.beginPath();
    ctx.arc(0, 0, vr, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.stroke();
    /* spoke markers at 0 and 90 degrees */
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = color.replace(')', ',0.45)').replace('rgb', 'rgba');
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(vr, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, -vr);
    ctx.stroke();
    /* center */
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawBody(idx, angle) {
    var pos   = bodyPositions[idx];
    var color = SHAPE_COLORS[idx];
    var vr    = vRadius();

    if (idx === 0) drawDisk(pos.cx, pos.cy, angle, color, vr);
    if (idx === 1) drawRod (pos.cx, pos.cy, angle, color, vr);
    if (idx === 2) drawRing(pos.cx, pos.cy, angle, color, vr);

    /* Shape label */
    ctx.save();
    ctx.font = '12px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(SHAPE_LABELS[idx], pos.cx, pos.cy + vr + 8);
    ctx.restore();

    /* I formula */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(SHAPE_FORMULAS[idx], pos.cx, pos.cy + vr + 24);
    ctx.restore();

    /* omega readout */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.65)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('\u03c9 = ' + omegas[idx].toFixed(2) + ' rad/s', pos.cx, pos.cy + vr + 38);
    ctx.restore();
  }

  /* ── Torque arrow drawn per shape ─────────────────────────── */
  function drawTorqueArrow(idx) {
    var pos = bodyPositions[idx];
    var vr  = vRadius();
    var color = SHAPE_COLORS[idx];
    /* arc arrow above the shape to show torque direction */
    var arcR = vr + 18;
    ctx.save();
    ctx.translate(pos.cx, pos.cy);
    ctx.strokeStyle = color.replace(')', ',0.50)').replace('rgb', 'rgba');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, arcR, -Math.PI * 0.7, Math.PI * 0.3);
    ctx.stroke();
    /* arrowhead at end of arc */
    var endAngle = Math.PI * 0.3;
    var ex = arcR * Math.cos(endAngle);
    var ey = arcR * Math.sin(endAngle);
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(endAngle + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-4, 2);
    ctx.lineTo(4, 2);
    ctx.closePath();
    ctx.fillStyle = color.replace(')', ',0.50)').replace('rgb', 'rgba');
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  /* ── Angular velocity graph ───────────────────────────────── */
  function drawGraph() {
    var gx0 = splitX + W * 0.04;
    var gy0 = H * 0.10;
    var gx1 = W * 0.97;
    var gy1 = H * 0.88;
    var gW  = gx1 - gx0;
    var gH  = gy1 - gy0;

    /* Title */
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.60)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Angular Velocity \u03c9 vs. Time', gx0 + gW / 2, gy0 - 14);
    ctx.restore();

    /* Axes */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,180,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gx0, gy1); ctx.lineTo(gx1, gy1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx0, gy0); ctx.lineTo(gx0, gy1); ctx.stroke();
    ctx.restore();

    /* Axis labels */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.55)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('t \u2192', gx1, gy1 + 3);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('\u03c9', gx0 + 3, gy0);
    ctx.restore();

    /* Find max omega across all history for y-scaling */
    var maxOmega = 0.5;
    for (var s = 0; s < SHAPE_COUNT; s++) {
      for (var h = 0; h < omegaHistory[s].length; h++) {
        if (omegaHistory[s][h] > maxOmega) maxOmega = omegaHistory[s][h];
      }
    }

    /* Plot each shape's omega history */
    for (var si = 0; si < SHAPE_COUNT; si++) {
      var hist = omegaHistory[si];
      if (hist.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = SHAPE_COLORS[si];
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      for (var hi = 0; hi < hist.length; hi++) {
        var frac = hi / (HISTORY_LEN - 1);
        var gxp = gx0 + frac * gW;
        var gyp = gy1 - (hist[hi] / maxOmega) * gH;
        if (hi === 0) ctx.moveTo(gxp, gyp); else ctx.lineTo(gxp, gyp);
      }
      ctx.stroke();
      ctx.restore();

      /* Legend dot at right edge */
      if (hist.length > 0) {
        var lastOmega = hist[hist.length - 1];
        var ly = gy1 - (lastOmega / maxOmega) * gH;
        ctx.save();
        ctx.beginPath();
        ctx.arc(gx1 - 4, ly, 3, 0, Math.PI * 2);
        ctx.fillStyle = SHAPE_COLORS[si];
        ctx.fill();
        ctx.restore();
      }
    }

    /* Legend */
    for (var li = 0; li < SHAPE_COUNT; li++) {
      ctx.save();
      ctx.font = '9px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = SHAPE_COLORS[li];
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(SHAPE_LABELS[li], gx0 + 4, gy0 + li * 13 + 4);
      ctx.restore();
    }
  }

  /* ── Physics update ───────────────────────────────────────── */
  var DT = 0.016;  /* seconds per frame */

  function physicsStep() {
    /* Record history every frame (scroll left) */
    for (var i = 0; i < SHAPE_COUNT; i++) {
      var I = momentOfInertia(i);
      var alpha = torque / I;          /* α = τ / I */
      omegas[i] += alpha * DT;
      angles[i] += omegas[i] * DT;

      /* Push to history */
      if (omegaHistory[i].length >= HISTORY_LEN) {
        omegaHistory[i].shift();
      }
      omegaHistory[i].push(omegas[i]);
    }
  }

  /* ── Main draw ────────────────────────────────────────────── */
  function draw() {
    if (!W || !H) return;

    computeBodyLayout();

    ctx.clearRect(0, 0, W, H);

    /* Background */
    ctx.fillStyle = 'oklch(0.09 0.025 285)';
    ctx.fillRect(0, 0, W, H);

    /* Vertical divider */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,180,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* Panel label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.40)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Rigid Bodies — same \u03c4, different I', splitX / 2, 6);
    ctx.restore();

    /* Torque readout */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('\u03c4 = ' + torque.toFixed(1) + ' N\u00b7m   m = ' + mass.toFixed(1) + ' kg', splitX / 2, H * 0.96);
    ctx.restore();

    /* Torque arrows */
    for (var ti = 0; ti < SHAPE_COUNT; ti++) {
      drawTorqueArrow(ti);
    }

    /* Bodies */
    for (var bi = 0; bi < SHAPE_COUNT; bi++) {
      drawBody(bi, angles[bi]);
    }

    /* Graph */
    drawGraph();
  }

  /* ── Animation loop ───────────────────────────────────────── */
  function loop() {
    if (!running) return;
    t += DT;
    physicsStep();
    draw();
    raf = requestAnimationFrame(loop);
  }

  /* ── SimAPI ───────────────────────────────────────────────── */
  window.SimAPI = {
    start: function () {
      if (running) return;
      running = true;
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.dataset.state = 'playing'; btn.innerHTML = '&#9646;&#9646; Pause'; }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) { dot.classList.add('is-running'); }
      if (!reduced) { loop(); } else { physicsStep(); draw(); }
    },
    pause: function () {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.dataset.state = 'paused'; btn.innerHTML = '&#9654; Play'; }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) { dot.classList.remove('is-running'); }
    },
    reset: function () {
      window.SimAPI.pause();
      t = 0;
      torque = 5.0;
      mass   = 2.0;
      for (var i = 0; i < SHAPE_COUNT; i++) {
        angles[i] = 0;
        omegas[i] = 0;
      }
      initHistory();
      var torqueSlider = document.getElementById('torque-slider');
      if (torqueSlider) { torqueSlider.value = 5.0; }
      var massSlider = document.getElementById('mass-slider');
      if (massSlider) { massSlider.value = 2.0; }
      updateSliderLabels();
      draw();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas && canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
    }
  };

  /* ── Slider label helpers ─────────────────────────────────── */
  function updateSliderLabels() {
    var tl = document.getElementById('torque-label');
    if (tl) { tl.textContent = torque.toFixed(1) + ' N\u00b7m'; }
    var ml = document.getElementById('mass-label');
    if (ml) { ml.textContent = mass.toFixed(1) + ' kg'; }
  }

  /* ── Setup ────────────────────────────────────────────────── */
  function setup() {
    mount = document.getElementById('sim-mount');
    if (!mount) return;

    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    mount.appendChild(canvas);
    ctx = canvas.getContext('2d');

    function resize() {
      var rect = mount.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      W = Math.round(rect.width || 640);
      H = Math.max(340, Math.round(rect.height || 360));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      splitX = W * 0.60;
      computeBodyLayout();
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    /* Torque slider */
    var torqueSlider = document.getElementById('torque-slider');
    if (torqueSlider) {
      torqueSlider.value = torque;
      torqueSlider.addEventListener('input', function () {
        torque = parseFloat(torqueSlider.value);
        updateSliderLabels();
        if (!running) { draw(); }
      });
    }

    /* Mass slider */
    var massSlider = document.getElementById('mass-slider');
    if (massSlider) {
      massSlider.value = mass;
      massSlider.addEventListener('input', function () {
        mass = parseFloat(massSlider.value);
        /* Reset omegas so we start fresh with new I values */
        for (var i = 0; i < SHAPE_COUNT; i++) {
          omegas[i] = 0;
          angles[i] = 0;
        }
        initHistory();
        updateSliderLabels();
        if (!running) { draw(); }
      });
    }

    /* Reset button */
    var resetBtn = document.getElementById('sim-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        window.SimAPI.reset();
      });
    }

    initHistory();
    updateSliderLabels();
    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

}());
