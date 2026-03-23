/* ============================================================
   sim.js — Stop 017: Coulomb's Law
   Split canvas: left = two draggable charges + field lines + force arrows
                 right = live F vs. r graph
   Controls: Q1/Q2 magnitude sliders, sign toggles
   ============================================================ */
(function () {
  'use strict';

  /* ── Top-level state ──────────────────────────────────────── */
  var mount, canvas, ctx, dpr, W, H;
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t = 0;

  var splitX; /* W * 0.5 — divides charge panel from graph panel */

  /* Coulomb constant (N·m²/C²) */
  var K_E = 8.99e9;

  /* Charge state — positions in canvas px, magnitudes in μC */
  var q1 = { x: 0, y: 0, mag: 3.0, sign: +1 }; /* positive charge */
  var q2 = { x: 0, y: 0, mag: 3.0, sign: -1 }; /* negative charge */

  /* Drag state */
  var dragging = null; /* null | q1 | q2 */
  var dragOffX = 0, dragOffY = 0;

  /* Minimum separation in pixels to avoid singularity */
  var MIN_DIST_PX = 30;

  /* ── Physics helpers ──────────────────────────────────────── */
  function pixelsToMeters(px) {
    /* Treat 100px = 1 m for display purposes */
    return px / 100;
  }

  function coulombForce(r_m, mag1, mag2) {
    /* F = K * |Q1| * |Q2| / r² — returns newtons */
    if (r_m < 0.001) r_m = 0.001;
    var Q1 = mag1 * 1e-6;
    var Q2 = mag2 * 1e-6;
    return K_E * Q1 * Q2 / (r_m * r_m);
  }

  function getDistance() {
    var dx = q2.x - q1.x;
    var dy = q2.y - q1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function isAttracting() {
    return q1.sign !== q2.sign;
  }

  /* ── Field lines ──────────────────────────────────────────── */
  function drawFieldLines() {
    /* Draw 16 field lines originating from q1 toward q2 (or away for like charges) */
    var numLines = 16;
    var r0 = 22; /* radius offset from charge center */

    for (var i = 0; i < numLines; i++) {
      var angle = (i / numLines) * Math.PI * 2;
      /* Start near q1 */
      var sx = q1.x + r0 * Math.cos(angle);
      var sy = q1.y + r0 * Math.sin(angle);

      /* Trace field line with small steps */
      var px = sx, py = sy;
      var steps = 80;
      var stepSize = 6;

      ctx.beginPath();
      ctx.moveTo(px, py);

      for (var s = 0; s < steps; s++) {
        /* Electric field at current point (superposition of both charges) */
        var ex = 0, ey = 0;

        /* Contribution from q1 */
        var dx1 = px - q1.x, dy1 = py - q1.y;
        var d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        if (d1 > 1) {
          var mag1 = q1.sign * q1.mag / (d1 * d1 * d1);
          ex += mag1 * dx1;
          ey += mag1 * dy1;
        }

        /* Contribution from q2 */
        var dx2 = px - q2.x, dy2 = py - q2.y;
        var d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (d2 > 1) {
          var mag2 = q2.sign * q2.mag / (d2 * d2 * d2);
          ex += mag2 * dx2;
          ey += mag2 * dy2;
        }

        /* Normalize */
        var eMag = Math.sqrt(ex * ex + ey * ey);
        if (eMag < 0.0001) break;
        ex /= eMag;
        ey /= eMag;

        px += ex * stepSize;
        py += ey * stepSize;

        /* Clip to left panel */
        if (px < 0 || px > splitX || py < 0 || py > H) break;

        /* Stop if very close to a charge */
        var nearQ1 = Math.sqrt(Math.pow(px - q1.x, 2) + Math.pow(py - q1.y, 2));
        var nearQ2 = Math.sqrt(Math.pow(px - q2.x, 2) + Math.pow(py - q2.y, 2));
        if (nearQ1 < 20 || nearQ2 < 20) break;

        ctx.lineTo(px, py);
      }

      /* Color by field direction: positive charge emits, negative absorbs */
      var alpha = 0.35;
      ctx.strokeStyle = 'rgba(90,160,220,' + alpha + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /* ── Force arrows ─────────────────────────────────────────── */
  function drawArrow(fromX, fromY, toX, toY, color) {
    var dx = toX - fromX;
    var dy = toY - fromY;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 5) return;
    var ux = dx / len, uy = dy / len;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    /* Shaft */
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX - ux * 10, toY - uy * 10);
    ctx.stroke();

    /* Head */
    var headLen = 10, headAngle = 0.4;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(-headAngle) * ux + headLen * Math.sin(-headAngle) * uy,
               toY - headLen * Math.sin(-headAngle) * ux - headLen * Math.cos(-headAngle) * uy);
    ctx.lineTo(toX - headLen * Math.cos(headAngle) * ux + headLen * Math.sin(headAngle) * uy,
               toY - headLen * Math.sin(headAngle) * ux - headLen * Math.cos(headAngle) * uy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawForceArrows() {
    var dist = getDistance();
    if (dist < MIN_DIST_PX) return;

    /* Direction vector from q1 to q2 */
    var dx = q2.x - q1.x;
    var dy = q2.y - q1.y;
    var ux = dx / dist, uy = dy / dist;

    /* Arrow length proportional to force, capped for display */
    var r_m = pixelsToMeters(dist);
    var F = coulombForce(r_m, q1.mag, q2.mag);
    var arrowLen = Math.min(50, Math.max(15, F * 2e7));

    var attract = isAttracting();

    if (attract) {
      /* Arrows point toward each other */
      drawArrow(q1.x, q1.y, q1.x + ux * arrowLen, q1.y + uy * arrowLen, 'rgba(200,100,255,0.85)');
      drawArrow(q2.x, q2.y, q2.x - ux * arrowLen, q2.y - uy * arrowLen, 'rgba(200,100,255,0.85)');
    } else {
      /* Arrows point away from each other */
      drawArrow(q1.x, q1.y, q1.x - ux * arrowLen, q1.y - uy * arrowLen, 'rgba(255,160,60,0.85)');
      drawArrow(q2.x, q2.y, q2.x + ux * arrowLen, q2.y + uy * arrowLen, 'rgba(255,160,60,0.85)');
    }
  }

  /* ── Charge circles ───────────────────────────────────────── */
  function drawCharge(charge) {
    var r = 22;
    var isPos = charge.sign > 0;
    var fill = isPos ? 'rgba(200,82,82,0.75)' : 'rgba(82,133,200,0.75)';
    var stroke = isPos ? '#e05252' : '#5285c8';
    var label = isPos ? '+' : '−';

    /* Pulse effect when running */
    if (running && !reduced) {
      var pulseR = r + 3 * Math.sin(t * 3 + (isPos ? 0 : Math.PI));
    } else {
      var pulseR = r;
    }

    ctx.save();
    /* Glow */
    ctx.shadowBlur = 12;
    ctx.shadowColor = stroke;
    ctx.beginPath();
    ctx.arc(charge.x, charge.y, pulseR, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    /* Sign label */
    ctx.save();
    ctx.font = 'bold 18px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, charge.x, charge.y + 1);
    ctx.restore();

    /* Magnitude label below charge */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(220,220,220,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(charge.mag.toFixed(1) + ' μC', charge.x, charge.y + r + 5);
    ctx.restore();
  }

  /* ── F vs r graph ─────────────────────────────────────────── */
  function drawGraph() {
    var gx0 = splitX + W * 0.05;
    var gy0 = H * 0.12;
    var gx1 = W * 0.96;
    var gy1 = H * 0.88;

    /* Max distance for graph = half of left panel width in meters */
    var maxR_m = pixelsToMeters(splitX * 0.85);
    /* Max force at min distance */
    var minR_m = pixelsToMeters(MIN_DIST_PX);
    var maxF = coulombForce(minR_m, Math.max(q1.mag, 10), Math.max(q2.mag, 10));

    function gx(r_m) {
      return gx0 + (r_m / maxR_m) * (gx1 - gx0);
    }
    function gy(F) {
      var logF = Math.log(F + 1);
      var logMax = Math.log(maxF + 1);
      return gy1 - (logF / logMax) * (gy1 - gy0);
    }

    /* Grid and axes */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,180,0.18)';
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
    ctx.fillStyle = 'rgba(200,200,200,0.6)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('r (m)', gx1, gy1 + 3);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('F (N)', gx0 + 3, gy0);
    ctx.restore();

    /* 1/r² theory curve */
    ctx.save();
    ctx.strokeStyle = 'rgba(90,160,220,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    var started = false;
    for (var i = 1; i <= 80; i++) {
      var r_m = minR_m + (i / 80) * (maxR_m - minR_m);
      var F = coulombForce(r_m, q1.mag, q2.mag);
      var gxv = gx(r_m);
      var gyv = gy(F);
      if (!started) { ctx.moveTo(gxv, gyv); started = true; }
      else { ctx.lineTo(gxv, gyv); }
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* Live tracking dot */
    var dist = getDistance();
    if (dist >= MIN_DIST_PX) {
      var cur_r_m = pixelsToMeters(dist);
      var cur_F = coulombForce(cur_r_m, q1.mag, q2.mag);
      var dotX = gx(cur_r_m);
      var dotY = gy(cur_F);

      /* Vertical rule */
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(dotX, gy1);
      ctx.lineTo(dotX, dotY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      /* Dot */
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* Readout */
      ctx.save();
      ctx.font = '10px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(200,200,200,0.75)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('F = ' + cur_F.toFixed(3) + ' N', gx1, gy1 - 3);
      ctx.textBaseline = 'bottom';
      ctx.fillText('r = ' + cur_r_m.toFixed(2) + ' m', gx1, gy1 - 15);
      ctx.restore();
    }

    /* Graph title */
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var title = isAttracting() ? 'F vs. r  —  attraction' : 'F vs. r  —  repulsion';
    ctx.fillText(title, (gx0 + gx1) / 2, gy0 - 14);
    ctx.restore();

    /* Legend */
    ctx.save();
    ctx.font = '9px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(90,160,220,0.7)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('— 1/r² curve', gx0 + 4, gy0 + 4);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('• current', gx0 + 4, gy0 + 16);
    ctx.restore();
  }

  /* ── Distance indicator ───────────────────────────────────── */
  function drawDistanceLabel() {
    var dist = getDistance();
    var r_m = pixelsToMeters(dist);
    var cx = (q1.x + q2.x) / 2;
    var cy = (q1.y + q2.y) / 2 - 14;

    /* Dashed line between charges */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,180,0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(q1.x, q1.y);
    ctx.lineTo(q2.x, q2.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('r = ' + r_m.toFixed(2) + ' m', Math.min(cx, splitX - 50), cy);
    ctx.restore();
  }

  /* ── Main draw ────────────────────────────────────────────── */
  function draw() {
    if (!W || !H) return;

    /* Clear */
    ctx.clearRect(0, 0, W, H);
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

    /* Left panel label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Drag the charges', splitX * 0.5, 6);
    ctx.restore();

    /* Field lines (behind charges) */
    drawFieldLines();

    /* Distance indicator */
    drawDistanceLabel();

    /* Force arrows */
    drawForceArrows();

    /* Charges */
    drawCharge(q1);
    drawCharge(q2);

    /* Right panel: F vs r graph */
    drawGraph();
  }

  /* ── Animation loop ───────────────────────────────────────── */
  function loop() {
    if (!running) return;
    t += 0.016;
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
      window.SimAPI.pause();
      t = 0;
      /* Reset charges to default positions and values */
      q1.mag = 3.0; q1.sign = +1;
      q2.mag = 3.0; q2.sign = -1;
      resetChargePositions();
      syncControls();
      draw();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas && canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
    }
  };

  /* ── Helpers ──────────────────────────────────────────────── */
  function resetChargePositions() {
    if (!W) return;
    q1.x = splitX * 0.33;
    q1.y = H * 0.5;
    q2.x = splitX * 0.67;
    q2.y = H * 0.5;
  }

  function clampChargeToPanel(charge) {
    var margin = 26;
    charge.x = Math.max(margin, Math.min(splitX - margin, charge.x));
    charge.y = Math.max(margin, Math.min(H - margin, charge.y));
  }

  function syncControls() {
    var s1 = document.getElementById('q1-slider');
    if (s1) { s1.value = q1.mag; }
    var v1 = document.getElementById('q1-value');
    if (v1) { v1.textContent = q1.mag.toFixed(1) + ' μC'; }

    var s2 = document.getElementById('q2-slider');
    if (s2) { s2.value = q2.mag; }
    var v2 = document.getElementById('q2-value');
    if (v2) { v2.textContent = q2.mag.toFixed(1) + ' μC'; }

    var t1 = document.getElementById('q1-sign-btn');
    if (t1) { t1.textContent = q1.sign > 0 ? 'Q₁: +' : 'Q₁: −'; }
    var t2 = document.getElementById('q2-sign-btn');
    if (t2) { t2.textContent = q2.sign > 0 ? 'Q₂: +' : 'Q₂: −'; }

    var modeEl = document.getElementById('interaction-mode');
    if (modeEl) {
      modeEl.textContent = isAttracting() ? 'Attraction' : 'Repulsion';
      modeEl.style.color = isAttracting() ? 'rgba(200,100,255,0.9)' : 'rgba(255,160,60,0.9)';
    }
  }

  /* ── Event helpers ────────────────────────────────────────── */
  function canvasPoint(e) {
    var rect = canvas.getBoundingClientRect();
    var cx, cy;
    if (e.touches) {
      cx = e.touches[0].clientX;
      cy = e.touches[0].clientY;
    } else {
      cx = e.clientX;
      cy = e.clientY;
    }
    var scaleX = W / rect.width;
    var scaleY = H / rect.height;
    return {
      x: (cx - rect.left) * scaleX,
      y: (cy - rect.top) * scaleY
    };
  }

  function hitCharge(charge, pt) {
    var d = Math.sqrt(Math.pow(pt.x - charge.x, 2) + Math.pow(pt.y - charge.y, 2));
    return d <= 28;
  }

  function onPointerDown(e) {
    e.preventDefault();
    var pt = canvasPoint(e);
    if (hitCharge(q1, pt)) {
      dragging = q1;
      dragOffX = pt.x - q1.x;
      dragOffY = pt.y - q1.y;
    } else if (hitCharge(q2, pt)) {
      dragging = q2;
      dragOffX = pt.x - q2.x;
      dragOffY = pt.y - q2.y;
    }
  }

  function onPointerMove(e) {
    if (!dragging) return;
    e.preventDefault();
    var pt = canvasPoint(e);
    dragging.x = pt.x - dragOffX;
    dragging.y = pt.y - dragOffY;
    clampChargeToPanel(dragging);

    /* Enforce minimum separation */
    var dx = q2.x - q1.x;
    var dy = q2.y - q1.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < MIN_DIST_PX) {
      var ux = dx / (dist || 1), uy = dy / (dist || 1);
      if (dragging === q2) {
        q2.x = q1.x + ux * MIN_DIST_PX;
        q2.y = q1.y + uy * MIN_DIST_PX;
      } else {
        q1.x = q2.x - ux * MIN_DIST_PX;
        q1.y = q2.y - uy * MIN_DIST_PX;
      }
    }

    if (!running) { draw(); }
    syncControls();
  }

  function onPointerUp() {
    dragging = null;
  }

  /* ── Setup ────────────────────────────────────────────────── */
  function setup() {
    mount = document.getElementById('sim-mount');
    if (!mount) return;

    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.cursor = 'grab';
    canvas.setAttribute('touch-action', 'none');
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
      resetChargePositions();
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    /* Drag events */
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('mouseleave', onPointerUp);
    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    canvas.addEventListener('touchmove', onPointerMove, { passive: false });
    canvas.addEventListener('touchend', onPointerUp);

    /* Q1 slider */
    var q1Slider = document.getElementById('q1-slider');
    if (q1Slider) {
      q1Slider.addEventListener('input', function () {
        q1.mag = parseFloat(q1Slider.value);
        var v = document.getElementById('q1-value');
        if (v) { v.textContent = q1.mag.toFixed(1) + ' μC'; }
        if (!running) { draw(); }
        syncControls();
      });
    }

    /* Q2 slider */
    var q2Slider = document.getElementById('q2-slider');
    if (q2Slider) {
      q2Slider.addEventListener('input', function () {
        q2.mag = parseFloat(q2Slider.value);
        var v = document.getElementById('q2-value');
        if (v) { v.textContent = q2.mag.toFixed(1) + ' μC'; }
        if (!running) { draw(); }
        syncControls();
      });
    }

    /* Q1 sign toggle */
    var q1SignBtn = document.getElementById('q1-sign-btn');
    if (q1SignBtn) {
      q1SignBtn.addEventListener('click', function () {
        q1.sign = -q1.sign;
        syncControls();
        if (!running) { draw(); }
      });
    }

    /* Q2 sign toggle */
    var q2SignBtn = document.getElementById('q2-sign-btn');
    if (q2SignBtn) {
      q2SignBtn.addEventListener('click', function () {
        q2.sign = -q2.sign;
        syncControls();
        if (!running) { draw(); }
      });
    }

    /* Reset button */
    var resetBtn = document.getElementById('sim-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () { window.SimAPI.reset(); });
    }

    /* Initial sync */
    syncControls();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

}());
