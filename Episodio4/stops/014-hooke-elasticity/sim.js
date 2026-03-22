/* ============================================================
   sim.js — Stop 014: Hooke's Law and Elasticity
   Split canvas: left = coil spring visual, right = F vs. x graph
   Three material presets: Steel, Rubber, Glass
   Elastic / Plastic / Rupture zones
   ============================================================ */
(function () {
  'use strict';

  /* ── Top-level state ──────────────────────────────────────── */
  var mount, canvas, ctx, dpr, W, H;
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t = 0;

  var splitX;           /* W * 0.5 — divides spring panel from graph panel */
  var ruptured = false; /* boolean — false until spring snaps */
  var snapTimer = 0;    /* integer frames remaining in snap animation (0 = none) */
  var weightFrac = 0.3; /* 0–1 fraction of ruptureX, driven by slider */
  var currentMaterial = 0; /* index into MATERIALS array */
  var weightY = 0;      /* Y position of weight block (for fall animation) */

  /* ── Material presets ─────────────────────────────────────── */
  var MATERIALS = [
    { name: 'Steel',  k: 500, yieldX: 0.04, ruptureX: 0.06  },
    { name: 'Rubber', k: 50,  yieldX: 0.40, ruptureX: 1.20  },
    { name: 'Glass',  k: 800, yieldX: 0.01, ruptureX: 0.015 }
  ];

  function getMaterial() {
    return MATERIALS[currentMaterial];
  }

  /* ── Physics model ────────────────────────────────────────── */
  function getState(frac) {
    var m = getMaterial();
    var yieldFrac = m.yieldX / m.ruptureX;
    var x, F, zone;
    if (frac <= yieldFrac) {
      x = frac * m.ruptureX;
      F = m.k * x;
      zone = 'elastic';
    } else if (frac < 1.0) {
      var t_p = (frac - yieldFrac) / (1.0 - yieldFrac);
      x = m.yieldX + Math.pow(t_p, 0.4) * (m.ruptureX - m.yieldX);
      F = m.k * m.yieldX + m.k * 0.1 * (x - m.yieldX);
      zone = 'plastic';
    } else {
      x = m.ruptureX;
      F = m.k * m.yieldX;
      zone = 'ruptured';
    }
    return { x: x, F: F, zone: zone };
  }

  /* ── Spring drawing ───────────────────────────────────────── */
  function drawSpring(anchorX, anchorY, endY, zone) {
    var coils = 12;
    var step = (endY - anchorY) / (coils * 2 + 2);
    var color;
    if (zone === 'elastic') {
      color = '#61bd67';
    } else if (zone === 'plastic') {
      color = '#7a7a7a';
    } else {
      color = '#e05252';
    }

    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    for (var i = 0; i < coils * 2 + 1; i++) {
      var yy = anchorY + step * (i + 1);
      var coilW;
      if (zone === 'elastic') {
        coilW = 16;
      } else {
        coilW = 16 * (1.0 + 0.5 * Math.abs(Math.sin(i * Math.PI / coils)));
      }
      var xx = anchorX + (i % 2 === 0 ? coilW : -coilW);
      ctx.lineTo(xx, yy);
    }
    ctx.lineTo(anchorX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawRupturedStubs(anchorX, anchorY) {
    /* Top stub */
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.lineTo(anchorX + 14, anchorY + 18);
    ctx.lineTo(anchorX - 14, anchorY + 36);
    ctx.lineTo(anchorX, anchorY + 50);
    ctx.strokeStyle = '#e05252';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Bottom stub — separated gap */
    var gapY = anchorY + 70;
    ctx.beginPath();
    ctx.moveTo(anchorX, gapY);
    ctx.lineTo(anchorX + 14, gapY + 18);
    ctx.lineTo(anchorX - 14, gapY + 36);
    ctx.lineTo(anchorX, gapY + 50);
    ctx.strokeStyle = '#e05252';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /* ── F vs. x graph ────────────────────────────────────────── */
  function drawGraph(currentX, currentF, isRuptured) {
    var m = getMaterial();

    var gx0 = splitX + W * 0.05;
    var gy0 = H * 0.10;
    var gx1 = W * 0.95;
    var gy1 = H * 0.88;

    var maxF = m.k * m.ruptureX;

    function px(x) {
      return gx0 + (x / m.ruptureX) * (gx1 - gx0);
    }
    function py(F) {
      return gy1 - (F / maxF) * (gy1 - gy0);
    }

    /* Axes */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,180,0.4)';
    ctx.lineWidth = 1;

    /* x-axis */
    ctx.beginPath();
    ctx.moveTo(gx0, gy1);
    ctx.lineTo(gx1, gy1);
    ctx.stroke();

    /* y-axis */
    ctx.beginPath();
    ctx.moveTo(gx0, gy0);
    ctx.lineTo(gx0, gy1);
    ctx.stroke();
    ctx.restore();

    /* Axis labels */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.7)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('x (m)', gx1, gy1 + 3);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('F (N)', gx0 + 3, gy0);
    ctx.restore();

    /* Elastic segment: green (#61bd67) from (0,0) to (yieldX, k*yieldX) */
    ctx.save();
    ctx.strokeStyle = '#61bd67';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px(0), py(0));
    ctx.lineTo(px(m.yieldX), py(m.k * m.yieldX));
    ctx.stroke();
    ctx.restore();

    /* Plastic segment: muted gray from yield to rupture */
    var F_yield = m.k * m.yieldX;
    var yieldFrac = m.yieldX / m.ruptureX;
    ctx.save();
    ctx.strokeStyle = '#7a7a7a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px(m.yieldX), py(F_yield));
    for (var i = 1; i <= 20; i++) {
      var frac_p = yieldFrac + (i / 20.0) * (1.0 - yieldFrac);
      var st = getState(frac_p);
      ctx.lineTo(px(st.x), py(st.F));
    }
    ctx.stroke();
    ctx.restore();

    /* Rupture dot: red at (ruptureX, F_yield — note: F at rupture = k*yieldX) */
    var F_rupture = m.k * m.yieldX;
    ctx.save();
    ctx.fillStyle = '#e05252';
    ctx.beginPath();
    ctx.arc(px(m.ruptureX), py(F_rupture), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* Live tracking dot: white at current position */
    if (!isRuptured) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px(currentX), py(currentF), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* Graph title / material name */
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('F vs. x — ' + m.name, (gx0 + gx1) / 2, gy0 - 14);
    ctx.restore();
  }

  /* ── Main draw ────────────────────────────────────────────── */
  function draw() {
    if (!W || !H) return;

    var m = getMaterial();
    var state = getState(weightFrac);

    /* Compute spring visual dimensions */
    var anchorY = H * 0.08;
    var anchorX = splitX * 0.5;
    var naturalH = H * 0.35;
    var maxVisualExt = H * 0.80 - anchorY - naturalH;
    var visualExt = Math.min(state.x / m.ruptureX * maxVisualExt * 2, maxVisualExt);
    var springEndY = anchorY + naturalH + visualExt;

    /* Handle rupture trigger */
    if (state.zone === 'ruptured' && !ruptured) {
      ruptured = true;
      snapTimer = 18;
      weightY = springEndY;
      /* Disable slider */
      var sliderEl = document.getElementById('weight-slider');
      if (sliderEl) { sliderEl.disabled = true; }
      /* Update zone label */
      var labelEl = document.getElementById('weight-label');
      if (labelEl) { labelEl.textContent = 'RUPTURED'; }
    }

    /* Snap animation: apply random translate for shake */
    var shaking = snapTimer > 0;
    if (shaking) {
      ctx.save();
      var shakeX = (Math.random() - 0.5) * 6;
      var shakeY = (Math.random() - 0.5) * 6;
      ctx.translate(shakeX, shakeY);
    }

    /* Clear canvas */
    ctx.clearRect(shaking ? -8 : 0, shaking ? -8 : 0, W + 16, H + 16);

    /* Background */
    ctx.fillStyle = 'oklch(0.09 0.025 285)';
    ctx.fillRect(0, 0, W, H);

    /* Red flash overlay during snap */
    if (shaking) {
      var alpha = snapTimer / 18 * 0.20;
      ctx.fillStyle = 'rgba(200,50,50,' + alpha + ')';
      ctx.fillRect(0, 0, W, H);
    }

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

    /* ── Left panel: spring visual ─────────────────────────── */

    /* Ceiling bar */
    ctx.fillStyle = 'rgba(180,180,180,0.5)';
    ctx.fillRect(anchorX - 40, anchorY - 10, 80, 8);

    /* Anchor attachment line */
    ctx.strokeStyle = 'rgba(180,180,180,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY - 2);
    ctx.lineTo(anchorX, anchorY);
    ctx.stroke();

    if (ruptured) {
      /* Draw broken spring stubs */
      drawRupturedStubs(anchorX, anchorY);

      /* Weight falls */
      weightY += 4;
      var wbW = 44, wbH = 30;
      if (weightY < H + wbH) {
        ctx.save();
        ctx.fillStyle = 'rgba(97,189,103,0.25)';
        ctx.strokeStyle = '#61bd67';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(anchorX - wbW / 2, weightY, wbW, wbH, 4);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      /* RUPTURED label */
      ctx.save();
      ctx.font = 'bold 14px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = '#e05252';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('RUPTURED', anchorX, H * 0.60);
      ctx.restore();

    } else {
      /* Draw spring */
      drawSpring(anchorX, anchorY, springEndY, state.zone);

      /* Weight block */
      var wbW = 44, wbH = 30;
      ctx.save();
      ctx.fillStyle = 'rgba(97,189,103,0.25)';
      ctx.strokeStyle = state.zone === 'elastic' ? '#61bd67' : '#7a7a7a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(anchorX - wbW / 2, springEndY, wbW, wbH, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      /* Mass label */
      var massKg = (state.F / 9.81).toFixed(1);
      ctx.save();
      ctx.font = '10px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(200,200,200,0.8)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('~' + massKg + ' kg', anchorX, springEndY + wbH + 5);
      ctx.restore();

      /* Zone label */
      var zoneColor = state.zone === 'elastic' ? '#61bd67' : '#b0b0b0';
      ctx.save();
      ctx.font = '11px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = zoneColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(state.zone, anchorX, anchorY - 14);
      ctx.restore();

      /* Force readout */
      ctx.save();
      ctx.font = '11px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(200,200,200,0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('F = ' + state.F.toFixed(1) + ' N  |  x = ' + (state.x * 100).toFixed(1) + ' cm', anchorX, H * 0.96);
      ctx.restore();
    }

    /* Left panel label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(m.name + ' spring', anchorX, 6);
    ctx.restore();

    /* ── Right panel: F vs. x graph ────────────────────────── */
    drawGraph(state.x, state.F, ruptured);

    /* End shake transform */
    if (shaking) {
      ctx.restore();
      snapTimer--;
    }

    /* Update zone label in controls */
    if (!ruptured) {
      var labelEl2 = document.getElementById('weight-label');
      if (labelEl2) { labelEl2.textContent = state.zone; }
    }
  }

  /* ── Animation loop ───────────────────────────────────────── */
  function loop() {
    if (!running) return;
    t += 0.016;
    draw();
    raf = requestAnimationFrame(loop);
  }

  /* ── SimAPI (assigned synchronously at IIFE body level) ───── */
  window.SimAPI = {
    start: function () {
      if (running) return;
      running = true;
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.dataset.state = 'playing'; btn.innerHTML = '&#9646;&#9646; Pause'; }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) { dot.classList.add('is-running'); }
      if (!reduced) { loop(); } else { draw(); }
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
      ruptured = false;
      snapTimer = 0;
      weightFrac = 0.3;
      weightY = 0;
      var slider = document.getElementById('weight-slider');
      if (slider) { slider.value = 0.3; slider.disabled = false; }
      var labelEl = document.getElementById('weight-label');
      if (labelEl) { labelEl.textContent = 'elastic'; }
      draw();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas && canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
    }
  };

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
      W = Math.round(rect.width || 600);
      H = Math.max(360, Math.round(rect.height || 380));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      splitX = W * 0.5;
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    /* Weight slider */
    var slider = document.getElementById('weight-slider');
    if (slider) {
      slider.value = 0.3;
      slider.addEventListener('input', function () {
        if (ruptured) return;
        weightFrac = parseFloat(slider.value);
        if (!running) { draw(); }
      });
    }

    /* Material selector */
    var sel = document.getElementById('material-selector');
    if (sel) {
      sel.addEventListener('change', function () {
        currentMaterial = parseInt(sel.value, 10);
        window.SimAPI.reset();
      });
    }

    /* Reset button */
    var resetBtn = document.getElementById('sim-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        window.SimAPI.reset();
      });
    }

    /* Initial draw */
    weightFrac = 0.3;
    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

}());
