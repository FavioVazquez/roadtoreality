/* ============================================================
   sim.js — Stop 019: Faraday's Electromagnetic Induction
   Galvanometer driven by dΦ/dt (NOT flux magnitude).
   Magnet position slider + Auto Oscillate button.
   Lenz's law direction reversal visible.
   ES5 IIFE, no const/let/arrow functions/template literals.
   ============================================================ */
(function () {
  'use strict';

  /* ── Mount & canvas setup ─────────────────────────────────── */
  var mount = document.getElementById('sim-mount');
  if (!mount) return;

  var canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width  = '100%';
  canvas.style.height = '100%';
  mount.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var W, H;
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Layout constants (recomputed in resize) ──────────────── */
  var coilX, coilY, galX, galY;

  /* ── Physics state ────────────────────────────────────────── */
  var magnetX = 0;          /* pixel position, set in resize */
  var prevFlux = 0;
  var currentFlux = 0;
  var inducedCurrent = 0;   /* signed, drives needle */
  var autoOscillate = false;
  var oscillateT = 0;
  var t = 0;

  /* Magnet orientation: +1 = N-right, -1 = N-left */
  var magnetDir = 1;

  /* Flux model constants */
  var K_FLUX = 50000;
  var MIN_DIST = 20;

  /* Galvanometer needle display */
  var MAX_NEEDLE_ANGLE = Math.PI / 3;     /* 60 degrees */
  var CURRENT_SCALE = 0.00025;            /* tuning: maps inducedCurrent → needle radians */
  var CURRENT_THRESHOLD = 2000;          /* below this abs value → no Lenz arrow */

  /* ── Controls ─────────────────────────────────────────────── */
  var sliderEl = document.getElementById('magnet-position-slider');
  var oscillateBtnEl = document.getElementById('auto-oscillate-btn');
  var posLabelEl = document.getElementById('magnet-position-label');

  /* ── Resize ───────────────────────────────────────────────── */
  function resize() {
    var w = mount.clientWidth  || 640;
    var h = mount.clientHeight || 360;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w;
    H = h;
    coilX = W * 0.50;
    coilY = H * 0.45;
    galX  = W * 0.72;
    galY  = H * 0.72;
    /* Default magnet start position */
    magnetX = W * 0.22;
  }

  /* ── Flux calculation ─────────────────────────────────────── */
  function calcFlux(mx) {
    var dist = Math.abs(mx - coilX);
    dist = Math.max(dist, MIN_DIST);
    return magnetDir * K_FLUX / (dist * dist);
  }

  /* ── Clamp helper ─────────────────────────────────────────── */
  function clamp(val, lo, hi) {
    return val < lo ? lo : val > hi ? hi : val;
  }

  /* ── Drawing helpers ──────────────────────────────────────── */

  function drawMagnet(mx, my) {
    var mW = 84, mH = 30;
    var half = mW / 2;

    /* South pole (red) */
    var sLabel, nLabel, sColor, nColor;
    if (magnetDir === 1) {
      sColor = 'rgba(200,60,60,0.85)';
      nColor = 'rgba(60,100,200,0.85)';
      sLabel = 'S';
      nLabel = 'N';
    } else {
      sColor = 'rgba(60,100,200,0.85)';
      nColor = 'rgba(200,60,60,0.85)';
      sLabel = 'N';
      nLabel = 'S';
    }

    /* Left half */
    ctx.fillStyle = sColor;
    ctx.fillRect(mx - half, my - mH / 2, half, mH);
    /* Right half */
    ctx.fillStyle = nColor;
    ctx.fillRect(mx, my - mH / 2, half, mH);

    /* Border */
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx - half, my - mH / 2, mW, mH);

    /* Labels */
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + Math.round(H * 0.038) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sLabel, mx - half / 2, my + 5);
    ctx.fillText(nLabel, mx + half / 2, my + 5);
    ctx.textAlign = 'left';
  }

  function drawCoil() {
    var turns = 5;
    var rx = 28, ry = H * 0.14;
    ctx.lineWidth = 2;
    for (var i = 0; i < turns; i++) {
      var ex = coilX + (i - 2) * 14;
      ctx.beginPath();
      ctx.ellipse(ex, coilY, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(82,133,200,0.75)';
      ctx.stroke();
    }
    /* Coil leads */
    ctx.beginPath();
    ctx.moveTo(coilX - rx, coilY);
    ctx.lineTo(coilX - rx, coilY + ry + 10);
    ctx.moveTo(coilX + rx, coilY);
    ctx.lineTo(galX, galY);
    ctx.strokeStyle = 'rgba(82,133,200,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawLenzArrow(dir) {
    /* dir: +1 = counterclockwise, -1 = clockwise */
    var r = H * 0.09;
    var startAngle = -Math.PI * 0.1;
    var endAngle   =  Math.PI * 1.9;
    if (dir < 0) {
      startAngle = Math.PI * 0.1;
      endAngle   = -Math.PI * 1.9;
    }

    ctx.beginPath();
    ctx.arc(coilX, coilY, r, startAngle, endAngle, dir < 0);
    ctx.strokeStyle = 'rgba(255,200,50,0.85)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* Arrowhead */
    var headAngle = dir > 0 ? endAngle : endAngle;
    var ax = coilX + r * Math.cos(headAngle);
    var ay = coilY + r * Math.sin(headAngle);
    var tangentDir = dir > 0 ? 1 : -1;
    var tx = -Math.sin(headAngle) * tangentDir;
    var ty =  Math.cos(headAngle) * tangentDir;
    var arrSize = 10;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - tx * arrSize - ty * arrSize * 0.5, ay - ty * arrSize + tx * arrSize * 0.5);
    ctx.lineTo(ax - tx * arrSize + ty * arrSize * 0.5, ay - ty * arrSize - tx * arrSize * 0.5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,200,50,0.85)';
    ctx.fill();
  }

  function drawGalvanometer() {
    var r = Math.round(H * 0.14);

    /* Gauge body */
    ctx.beginPath();
    ctx.arc(galX, galY, r, Math.PI, 0, false);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15,18,28,0.80)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(82,133,200,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Tick marks on gauge arc */
    var ticks = 7;
    for (var i = 0; i <= ticks; i++) {
      var angle = Math.PI + (Math.PI * i / ticks);
      var x1 = galX + (r - 5)  * Math.cos(angle);
      var y1 = galY + (r - 5)  * Math.sin(angle);
      var x2 = galX + (r + 2)  * Math.cos(angle);
      var y2 = galY + (r + 2)  * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(82,133,200,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* − and + labels */
    var labelR = r + 16;
    ctx.fillStyle = 'rgba(82,133,200,0.85)';
    ctx.font = 'bold ' + Math.round(H * 0.038) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u2212', galX - labelR * 0.95, galY - 2);
    ctx.fillText('+', galX + labelR * 0.95, galY - 2);
    ctx.textAlign = 'left';

    /* Needle */
    var needleAngle;
    var needleRad = clamp(inducedCurrent * CURRENT_SCALE, -MAX_NEEDLE_ANGLE, MAX_NEEDLE_ANGLE);
    needleAngle = Math.PI + Math.PI / 2 + needleRad; /* starts pointing up */

    ctx.save();
    ctx.translate(galX, galY);
    ctx.rotate(needleAngle - Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -(r - 8));
    ctx.strokeStyle = 'rgba(255,80,80,0.95)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    /* Center dot */
    ctx.beginPath();
    ctx.arc(galX, galY, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,80,80,0.8)';
    ctx.fill();

    /* Label */
    ctx.fillStyle = 'rgba(82,133,200,0.7)';
    ctx.font = Math.round(H * 0.033) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Galvanometer', galX, galY + r + 18);
    ctx.textAlign = 'left';
  }

  function drawReadout() {
    var absI = Math.abs(inducedCurrent);
    var dirLabel = '';
    if (absI > CURRENT_THRESHOLD) {
      dirLabel = inducedCurrent > 0 ? '  [induced: \u2192]' : '  [induced: \u2190]';
    }
    var emfStr = (inducedCurrent * 0.001).toFixed(2);
    ctx.fillStyle = 'rgba(82,133,200,0.70)';
    ctx.font = Math.round(H * 0.033) + 'px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('d\u03A6/dt \u2248 ' + emfStr + dirLabel, W * 0.03, H * 0.10);
  }

  /* ── Main frame ───────────────────────────────────────────── */
  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    /* Background tint */
    ctx.fillStyle = 'rgba(82,133,200,0.04)';
    ctx.fillRect(0, 0, W, H);

    /* Era label */
    ctx.fillStyle = 'rgba(82,133,200,0.25)';
    ctx.font = Math.round(H * 0.03) + 'px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Classical Physics \u00B7 1831', W - 12, H - 8);
    ctx.textAlign = 'left';

    /* Update flux & induced current */
    currentFlux = calcFlux(magnetX);
    inducedCurrent = (currentFlux - prevFlux) / 0.016;
    prevFlux = currentFlux;

    /* Auto-oscillate update */
    if (autoOscillate) {
      var amplitude = coilX * 0.75;
      var freq = 0.5;
      magnetX = coilX + amplitude * Math.sin(2 * Math.PI * freq * oscillateT);
      oscillateT += 0.016;
      /* Sync slider visually */
      if (sliderEl) {
        var norm = (magnetX - W * 0.05) / (W * 0.90 - W * 0.05);
        sliderEl.value = clamp(norm, 0, 1);
      }
    }

    /* Draw coil */
    drawCoil();

    /* Draw magnet */
    drawMagnet(magnetX, coilY);

    /* Draw Lenz arrow if current strong enough */
    if (Math.abs(inducedCurrent) > CURRENT_THRESHOLD) {
      drawLenzArrow(inducedCurrent > 0 ? 1 : -1);
    }

    /* Draw galvanometer */
    drawGalvanometer();

    /* Draw readout */
    drawReadout();

    /* Update position label */
    if (posLabelEl) {
      var pct = Math.round(((magnetX - W * 0.05) / (W * 0.85)) * 100);
      posLabelEl.textContent = pct + '%';
    }

    t += 0.016;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() {
    /* One frame to set up a useful preview */
    prevFlux = calcFlux(magnetX * 0.9);
    drawFrame();
  }

  /* ── Control wiring ───────────────────────────────────────── */
  if (sliderEl) {
    sliderEl.addEventListener('input', function () {
      autoOscillate = false;
      if (oscillateBtnEl) oscillateBtnEl.textContent = 'Auto Oscillate';
      var val = parseFloat(sliderEl.value);
      magnetX = W * 0.05 + val * (W * 0.90 - W * 0.05);
      if (!running) drawFrame();
    });
  }

  if (oscillateBtnEl) {
    oscillateBtnEl.addEventListener('click', function () {
      autoOscillate = !autoOscillate;
      oscillateBtnEl.textContent = autoOscillate ? 'Stop Oscillation' : 'Auto Oscillate';
      if (autoOscillate && !running) {
        /* Start animation if paused */
        running = true;
        raf = requestAnimationFrame(drawFrame);
      }
    });
  }

  /* ── SimAPI ───────────────────────────────────────────────── */
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
      magnetX = W * 0.22;
      prevFlux = 0;
      currentFlux = 0;
      inducedCurrent = 0;
      autoOscillate = false;
      oscillateT = 0;
      t = 0;
      if (oscillateBtnEl) oscillateBtnEl.textContent = 'Auto Oscillate';
      if (sliderEl) sliderEl.value = 0.2;
      if (posLabelEl) posLabelEl.textContent = 'far left';
      drawStatic();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };

  /* ── Init ─────────────────────────────────────────────────── */
  resize();
  window.addEventListener('resize', function () {
    resize();
    if (!running) drawStatic();
  });
  drawStatic();
}());
