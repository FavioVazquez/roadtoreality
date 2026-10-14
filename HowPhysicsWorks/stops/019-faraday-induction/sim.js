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
  var K_FLUX = 500000;
  var FLUX_A2 = 1600;                     /* a = 40 px: smooth bell, peak at coil centre */
  var dotPhase = 0;                       /* drift of the current dots along the leads */

  /* Galvanometer needle display */
  var MAX_NEEDLE_ANGLE = Math.PI / 3;     /* 60 degrees */
  var CURRENT_SCALE = 0.00025;            /* tuning: maps inducedCurrent → needle radians */
  var CURRENT_THRESHOLD = 150;           /* below this abs value → no current dots / pole labels */

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
    var dist = mx - coilX;
    return magnetDir * K_FLUX / (dist * dist + FLUX_A2);
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

  /* Lead polylines. A runs from the coil's right-top to the galvanometer's
     + terminal; B runs from the galvanometer's - terminal to the coil's
     left-bottom. Positive EMF drives charge along A toward the meter and
     along B away from it. */
  function leadPaths() {
    var rx = 28, ry = H * 0.14;
    var r = Math.round(H * 0.14);
    var topY = coilY - ry - 30;
    var botY = coilY + ry + 14;
    return {
      a: [[coilX + 28, coilY - ry], [coilX + 28, topY], [galX + r + 16, topY],
          [galX + r + 16, galY], [galX + r, galY]],
      b: [[galX - r, galY], [galX - r - 16, galY], [galX - r - 16, botY],
          [coilX - 28, botY], [coilX - 28, coilY + ry]]
    };
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
    /* Coil leads to the galvanometer */
    var lp = leadPaths();
    var lists = [lp.a, lp.b];
    ctx.strokeStyle = 'rgba(82,133,200,0.45)';
    ctx.lineWidth = 1.5;
    for (var k = 0; k < 2; k++) {
      var p = lists[k];
      ctx.beginPath();
      ctx.moveTo(p[0][0], p[0][1]);
      for (var m = 1; m < p.length; m++) ctx.lineTo(p[m][0], p[m][1]);
      ctx.stroke();
    }
  }

  /* Dots drifting along a polyline; sign gives direction of travel. */
  function dotsAlong(pts, offset) {
    var spacing = 20;
    var total = 0, seg = [];
    for (var i = 1; i < pts.length; i++) {
      var l = Math.sqrt(Math.pow(pts[i][0] - pts[i - 1][0], 2) + Math.pow(pts[i][1] - pts[i - 1][1], 2));
      seg.push(l);
      total += l;
    }
    ctx.fillStyle = 'rgba(255,200,50,0.95)';
    for (var d = ((offset % spacing) + spacing) % spacing; d < total; d += spacing) {
      var acc = 0;
      for (var s2 = 0; s2 < seg.length; s2++) {
        if (d <= acc + seg[s2]) {
          var f = seg[s2] > 0 ? (d - acc) / seg[s2] : 0;
          var x = pts[s2][0] + (pts[s2 + 1][0] - pts[s2][0]) * f;
          var y = pts[s2][1] + (pts[s2 + 1][1] - pts[s2][1]) * f;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        acc += seg[s2];
      }
    }
  }

  /* Induced current as moving dots on the leads, plus the coil's induced
     poles (Lenz): rising flux along +x -> induced field along -x -> the
     coil's left face is N and its right face is S; falling flux reverses. */
  function drawInduced() {
    var emf = -inducedCurrent;
    var dirSign = emf > 0 ? 1 : -1;
    var lp = leadPaths();
    dotPhase += dirSign * Math.min(Math.abs(emf) * 0.004 + 0.8, 3.5);
    dotsAlong(lp.a, dotPhase);
    dotsAlong(lp.b, dotPhase);

    var ry = H * 0.14;
    var leftPole  = inducedCurrent > 0 ? 'N' : 'S';
    var rightPole = inducedCurrent > 0 ? 'S' : 'N';
    ctx.fillStyle = 'rgba(255,200,50,0.95)';
    ctx.font = 'bold ' + Math.round(H * 0.042) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(leftPole,  coilX - 66, coilY - ry - 6);
    ctx.fillText(rightPole, coilX + 66, coilY - ry - 6);
    ctx.font = Math.round(H * 0.028) + 'px sans-serif';
    ctx.fillText('induced poles', coilX, coilY + ry + 40);
    ctx.textAlign = 'left';
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
    var needleRad = clamp(-inducedCurrent * CURRENT_SCALE, -MAX_NEEDLE_ANGLE, MAX_NEEDLE_ANGLE);
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
      dirLabel = inducedCurrent > 0 ? '  [flux rising]' : '  [flux falling]';
    }
    var emfStr = (-inducedCurrent * 0.001).toFixed(2);
    ctx.fillStyle = 'rgba(82,133,200,0.70)';
    ctx.font = Math.round(H * 0.033) + 'px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('\u2130 \u221D \u2212d\u03A6/dt = ' + emfStr + ' (arbitrary units)' + dirLabel, W * 0.03, H * 0.10);
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

    /* Induced current (moving dots) and induced poles, if strong enough */
    if (Math.abs(inducedCurrent) > CURRENT_THRESHOLD) {
      drawInduced();
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
    prevFlux = calcFlux(magnetX);
    drawFrame();
  }

  /* ── Oscillation / play-state helpers ─────────────────────── */
  function setOscillate(on) {
    autoOscillate = on;
    if (on) {
      /* continue from where the magnet is, no jump */
      var amp = coilX * 0.75;
      oscillateT = Math.asin(clamp((magnetX - coilX) / amp, -1, 1)) / (2 * Math.PI * 0.5);
    }
    if (oscillateBtnEl) oscillateBtnEl.textContent = on ? 'Stop Oscillation' : 'Auto Oscillate';
  }

  /* Keep the shell's Play/Pause button in step when the sim starts itself */
  function syncPlayBtn() {
    var btn = document.getElementById('sim-play-btn');
    if (!btn) return;
    btn.dataset.state = running ? 'playing' : 'paused';
    btn.textContent = running ? '\u23F8 Pause' : '\u25B6 Play';
  }

  /* ── Control wiring ───────────────────────────────────────── */
  if (sliderEl) {
    sliderEl.addEventListener('input', function () {
      setOscillate(false);
      var val = parseFloat(sliderEl.value);
      magnetX = W * 0.05 + val * (W * 0.90 - W * 0.05);
      if (!running) drawFrame();
    });
  }

  if (oscillateBtnEl) {
    oscillateBtnEl.addEventListener('click', function () {
      setOscillate(!autoOscillate);
      if (autoOscillate && !running) {
        /* Start animation if paused */
        running = true;
        if (reduced) { drawStatic(); } else { raf = requestAnimationFrame(drawFrame); }
        syncPlayBtn();
      }
    });
  }

  /* ── SimAPI ───────────────────────────────────────────────── */
  window.SimAPI = {
    start: function () {
      if (running) return;
      running = true;
      /* Playing means the magnet moves: start the idle swing
         (pausing keeps the position; the slider takes over by hand). */
      if (!autoOscillate) setOscillate(true);
      syncPlayBtn();
      if (reduced) { drawStatic(); return; }
      raf = requestAnimationFrame(drawFrame);
    },
    pause: function () {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      syncPlayBtn();
    },
    reset: function () {
      window.SimAPI.pause();
      magnetX = W * 0.22;
      prevFlux = 0;
      currentFlux = 0;
      inducedCurrent = 0;
      setOscillate(false);
      oscillateT = 0;
      t = 0;
      if (sliderEl) sliderEl.value = 0.2;
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
