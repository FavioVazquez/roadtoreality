/* sim.js — 027 Planck: blackbody spectrum with Rayleigh-Jeans comparison, h slider */
(function () {
  'use strict';

  var mount = document.getElementById('sim-mount');
  if (!mount) return;

  /* ── DPR-aware canvas setup ── */
  var dpr = window.devicePixelRatio || 1;
  var CW = Math.max(mount.clientWidth  || 600, 360);
  var CH = Math.max(mount.clientHeight || 340, 260);

  var canvas = document.createElement('canvas');
  canvas.width  = CW * dpr;
  canvas.height = CH * dpr;
  canvas.style.display = 'block';
  canvas.style.width  = '100%';
  canvas.style.height = '100%';
  mount.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  /* Working dimensions (CSS pixels) */
  var W = CW;
  var H = CH;

  /* ── State ── */
  var temperature = 4000;   /* Kelvin, 1000–10000 */
  var hFactor     = 1.0;    /* dimensionless multiplier on h, 0.01–1.0 */
  var raf         = null;
  var running     = false;
  var animT       = 0;      /* time counter for auto-sweep */
  var reduced     = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Graph layout */
  var PAD_L = 0.12, PAD_B = 0.15, PAD_T = 0.08, PAD_R = 0.04;

  function graphBounds() {
    return {
      ox: W * PAD_L,
      oy: H * (1 - PAD_B),
      gW: W * (1 - PAD_L - PAD_R),
      gH: H * (1 - PAD_B - PAD_T)
    };
  }

  /* ── Physics ── */
  /* Planck spectral radiance (dimensionless): x = hFactor * freq / T_norm */
  /* B_planck(x) = x^3 / (exp(x) - 1), clamped to avoid overflow */
  function planckVal(normFreq) {
    var T_norm = temperature / 4000;
    var x = hFactor * normFreq / T_norm;
    if (x < 1e-6) return 0;
    if (x > 30) return 0;
    return (x * x * x) / (Math.exp(x) - 1);
  }

  /* Rayleigh-Jeans (classical): same normalization axis */
  /* B_rj(x) = x^2 (limit of Planck as x->0), same x = hFactor * freq / T_norm */
  function rayleighVal(normFreq) {
    var T_norm = temperature / 4000;
    var x = hFactor * normFreq / T_norm;
    if (x < 1e-6) return 0;
    return x * x;
  }

  /* Find peak of Planck curve across 200 sample points */
  function findPlanckPeak() {
    var peak = 0;
    for (var i = 1; i <= 200; i++) {
      var v = planckVal(i / 200);
      if (v > peak) peak = v;
    }
    return peak;
  }

  /* ── Background color lerp by temperature ── */
  function bgColor(T) {
    var t = (T - 1000) / 9000; /* 0=1000K, 1=10000K */
    t = Math.max(0, Math.min(1, t));
    var r = Math.round(40 + (10 - 40) * t);
    var g = Math.round(8  + (14 - 8)  * t);
    var b = Math.round(2  + (28 - 2)  * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* ── Draw ── */
  function drawScene(T, hF) {
    /* Temporarily override globals for animation sweep */
    var savedT = temperature;
    var savedH = hFactor;
    temperature = T;
    hFactor     = hF;

    ctx.clearRect(0, 0, W, H);

    /* Background */
    ctx.fillStyle = bgColor(T);
    ctx.fillRect(0, 0, W, H);

    var b = graphBounds();
    var ox = b.ox, oy = b.oy, gW = b.gW, gH = b.gH;

    /* Peak normalization: scale both curves so Planck peak is at ~80% of gH */
    var peakP = findPlanckPeak();
    var scale = (peakP > 0) ? (gH * 0.80 / peakP) : 1;

    /* ── Rayleigh-Jeans curve (dashed, amber) ── */
    ctx.save();
    ctx.beginPath();
    var N = 120;
    var firstRJ = true;
    for (var i = 1; i <= N; i++) {
      var freq = i / N;
      var rjRaw = rayleighVal(freq);
      var rjY   = oy - Math.min(rjRaw * scale, gH * 1.05);
      var px    = ox + freq * gW;
      if (firstRJ) { ctx.moveTo(px, rjY); firstRJ = false; }
      else         { ctx.lineTo(px, rjY); }
    }
    ctx.strokeStyle = 'rgba(255,180,60,0.80)';
    ctx.lineWidth   = 2;
    ctx.setLineDash([7, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* ── Planck curve (solid, temperature-tinted) ── */
    var planckColor = T < 3000 ? 'rgba(255,140,60,0.95)'
                    : T < 6000 ? 'rgba(255,240,200,0.95)'
                               : 'rgba(160,200,255,0.95)';
    ctx.save();
    ctx.beginPath();
    var firstP = true;
    var peakX  = ox;
    var peakY  = oy;
    var peakRaw = 0;
    for (var j = 1; j <= N; j++) {
      var f   = j / N;
      var pRaw = planckVal(f);
      var pY   = oy - Math.min(pRaw * scale, gH * 1.05);
      var qx   = ox + f * gW;
      if (pRaw > peakRaw) { peakRaw = pRaw; peakX = qx; peakY = pY; }
      if (firstP) { ctx.moveTo(qx, pY); firstP = false; }
      else        { ctx.lineTo(qx, pY); }
    }
    ctx.strokeStyle = planckColor;
    ctx.lineWidth   = 2.5;
    ctx.stroke();
    ctx.restore();

    /* ── Axes ── */
    ctx.strokeStyle = 'rgba(160,92,200,0.45)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy - gH - 10);
    ctx.lineTo(ox, oy);
    ctx.lineTo(ox + gW + 10, oy);
    ctx.stroke();

    /* Axis labels */
    ctx.fillStyle = 'rgba(180,140,230,0.75)';
    ctx.font      = '11px monospace';
    ctx.fillText('Frequency \u2192', ox + gW * 0.55, oy + 14);
    ctx.save();
    ctx.translate(ox - 10, oy - gH * 0.45);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Radiance', 0, 0);
    ctx.restore();

    /* ── Wien's peak marker ── */
    if (peakRaw > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(160,92,200,0.4)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(peakX, peakY - 4);
      ctx.lineTo(peakX, oy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    /* ── Legend ── */
    var legX = ox + gW * 0.50;
    var legY = oy - gH * 0.92;
    /* Planck solid line */
    ctx.strokeStyle = planckColor;
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.moveTo(legX, legY);
    ctx.lineTo(legX + 22, legY);
    ctx.stroke();
    ctx.fillStyle = 'rgba(220,220,220,0.85)';
    ctx.font      = '10px monospace';
    ctx.fillText('Planck (quantum)', legX + 26, legY + 4);
    /* Rayleigh-Jeans dashed */
    ctx.strokeStyle = 'rgba(255,180,60,0.80)';
    ctx.lineWidth   = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(legX, legY + 16);
    ctx.lineTo(legX + 22, legY + 16);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(220,220,220,0.75)';
    ctx.fillText('Rayleigh-Jeans (classical)', legX + 26, legY + 20);

    /* ── Info labels ── */
    ctx.font      = 'bold 12px monospace';
    ctx.fillStyle = 'rgba(200,160,255,0.9)';
    ctx.fillText('T = ' + Math.round(T) + ' K', ox + 4, oy + 14);
    ctx.fillStyle = 'rgba(200,200,200,0.75)';
    ctx.font      = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('h \u00d7 ' + hF.toFixed(2), ox + gW, oy + 14);
    ctx.textAlign = 'left';

    /* Restore overridden globals */
    temperature = savedT;
    hFactor     = savedH;
  }

  function drawStatic() {
    drawScene(temperature, hFactor);
  }

  /* ── Animation loop: auto temperature sweep ── */
  function drawFrame() {
    /* Oscillate temperature between 1000–10000 K at ~200 K/s (60fps → Δ~3.3 K/frame) */
    var T = 5500 + 4500 * Math.sin(animT * 0.018);
    drawScene(T, hFactor);
    animT += 1;
    if (running && !reduced) {
      raf = requestAnimationFrame(drawFrame);
    }
  }

  /* ── Resize ── */
  function resize() {
    dpr = window.devicePixelRatio || 1;
    CW  = Math.max(mount.clientWidth  || 600, 360);
    CH  = Math.max(mount.clientHeight || 340, 260);
    canvas.width  = CW * dpr;
    canvas.height = CH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = CW;
    H = CH;
  }

  window.addEventListener('resize', function () {
    resize();
    if (!running) drawStatic();
  });

  /* ── Slider wiring ── */
  var tempSlider = document.getElementById('temperature-slider');
  var hSlider    = document.getElementById('h-slider');
  var tempReadout = document.getElementById('temperature-readout');
  var hReadout    = document.getElementById('h-readout');

  if (tempSlider) {
    tempSlider.addEventListener('input', function () {
      temperature = parseInt(tempSlider.value, 10);
      if (tempReadout) tempReadout.textContent = temperature + ' K';
      if (!running) drawStatic();
    });
  }

  if (hSlider) {
    hSlider.addEventListener('input', function () {
      /* slider 1–100 maps to hFactor 0.01–1.0 */
      hFactor = parseInt(hSlider.value, 10) / 100;
      if (hReadout) hReadout.textContent = hFactor.toFixed(2);
      if (!running) drawStatic();
    });
  }

  /* ── SimAPI ── */
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
      temperature = 4000;
      hFactor     = 1.0;
      animT       = 0;
      if (tempSlider)   tempSlider.value = '4000';
      if (hSlider)      hSlider.value    = '100';
      if (tempReadout)  tempReadout.textContent = '4000 K';
      if (hReadout)     hReadout.textContent    = '1.00';
      drawStatic();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };

  drawStatic();
}());
