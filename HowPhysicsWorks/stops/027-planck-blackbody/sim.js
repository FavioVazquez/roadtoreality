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
  /* Fixed physical axes: wavelength 0.04-3 um (linear), radiance on a fixed
     log scale relative to the 10,000 K Planck peak (h x 1). Nothing is
     renormalised per curve, so the peak moves and the T^5 growth shows.
     Units: B_rel = hF / (lam^5 (e^x - 1)), x = hF * C2 / (lam T),
     C2 = hc/k_B = 14387.77 um K. The common prefactor 2 h c^2 is dropped. */
  var C2 = 14387.77;          /* um K */
  var WIEN_B = 2897.77;       /* um K, Wien displacement constant */
  var LAM_MIN = 0.04, LAM_MAX = 3.0;   /* um */
  var LOG_MIN = -6.0, LOG_MAX = 0.7;   /* log10 of B_rel / B_ref */

  function planckRaw(lam, T, hF) {
    var x = hF * C2 / (lam * T);
    if (x > 700) return 0;
    return hF / (Math.pow(lam, 5) * (Math.exp(x) - 1));
  }

  /* Rayleigh-Jeans limit (h -> 0): 2 c k T / lam^4, in the same units */
  function rayleighRaw(lam, T) {
    return T / (C2 * Math.pow(lam, 4));
  }

  /* Reference: Planck peak at 10,000 K, h x 1 (lam = 2897.77 / 10000 um) */
  var B_REF = planckRaw(WIEN_B / 10000, 10000, 1);

  function yFrac(B) {
    if (!(B > 0)) return 0;
    var f = (Math.log(B / B_REF) / Math.LN10 - LOG_MIN) / (LOG_MAX - LOG_MIN);
    return Math.max(0, Math.min(1.02, f));
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
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = bgColor(T);
    ctx.fillRect(0, 0, W, H);

    var b = graphBounds();
    var ox = b.ox, oy = b.oy, gW = b.gW, gH = b.gH;
    function xOf(lam) { return ox + (lam - 0) / LAM_MAX * gW; }

    /* Visible band 380-750 nm as a rainbow strip along the axis */
    var grad = ctx.createLinearGradient(xOf(0.38), 0, xOf(0.75), 0);
    grad.addColorStop(0.00, 'rgba(140,60,255,0.55)');
    grad.addColorStop(0.20, 'rgba(60,90,255,0.55)');
    grad.addColorStop(0.40, 'rgba(60,220,255,0.55)');
    grad.addColorStop(0.55, 'rgba(80,230,80,0.55)');
    grad.addColorStop(0.72, 'rgba(255,230,60,0.55)');
    grad.addColorStop(0.86, 'rgba(255,140,40,0.55)');
    grad.addColorStop(1.00, 'rgba(255,50,40,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(xOf(0.38), oy - gH - 6, xOf(0.75) - xOf(0.38), gH + 6);

    /* Gridlines: decades (y) and 0.5 um steps (x) */
    ctx.font = '10px monospace';
    ctx.lineWidth = 1;
    for (var d = 0; d >= -6; d -= 2) {
      var gy = oy - ((d - LOG_MIN) / (LOG_MAX - LOG_MIN)) * gH;
      ctx.strokeStyle = 'rgba(160,92,200,0.18)';
      ctx.beginPath(); ctx.moveTo(ox, gy); ctx.lineTo(ox + gW, gy); ctx.stroke();
      ctx.fillStyle = 'rgba(180,140,230,0.65)';
      ctx.textAlign = 'right';
      ctx.fillText(d === 0 ? '1' : '1e' + d, ox - 4, gy + 3);
    }
    ctx.textAlign = 'center';
    for (var xl = 0.5; xl <= 3.001; xl += 0.5) {
      ctx.fillStyle = 'rgba(180,140,230,0.65)';
      ctx.fillText(xl.toFixed(1), xOf(xl), oy + 12);
    }
    ctx.textAlign = 'left';

    /* ── Rayleigh-Jeans curve (dashed, amber) ── */
    var N = 160;
    ctx.save();
    ctx.beginPath();
    var i, lam, px, py;
    for (i = 0; i <= N; i++) {
      lam = LAM_MIN + (LAM_MAX - LAM_MIN) * i / N;
      px = xOf(lam);
      py = oy - Math.min(yFrac(rayleighRaw(lam, T)), 1.02) * gH;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
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
    var peakRaw = 0, peakX = ox, peakY = oy;
    for (i = 0; i <= N * 2; i++) {
      lam = LAM_MIN + (LAM_MAX - LAM_MIN) * i / (N * 2);
      var pr = planckRaw(lam, T, hF);
      px = xOf(lam);
      py = oy - yFrac(pr) * gH;
      if (pr > peakRaw) { peakRaw = pr; peakX = px; peakY = py; }
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
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

    ctx.fillStyle = 'rgba(180,140,230,0.75)';
    ctx.font      = '11px monospace';
    ctx.fillText('Wavelength (µm) →', ox + gW * 0.50, oy + 26);
    ctx.save();
    ctx.translate(ox - 28, oy - gH * 0.15);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Radiance (log, fixed scale)', 0, 0);
    ctx.restore();

    /* ── Wien's peak marker: lambda_max = hF * 2897.77 um K / T ── */
    var lamMax = hF * WIEN_B / T;
    if (peakRaw > 0 && lamMax >= LAM_MIN && lamMax <= LAM_MAX) {
      var mx = xOf(lamMax);
      ctx.save();
      ctx.strokeStyle = 'rgba(200,160,255,0.7)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(mx, peakY - 4);
      ctx.lineTo(mx, oy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(220,200,255,0.95)';
      ctx.font = '10px monospace';
      var lbl = 'λ_max = ' + (lamMax >= 1 ? lamMax.toFixed(2) + ' µm' : Math.round(lamMax * 1000) + ' nm');
      var tx = mx + 6;
      if (tx + 100 > ox + gW) { ctx.textAlign = 'right'; tx = mx - 6; }
      var ty = Math.max(peakY - 8, oy - gH + 10);
      var infoR = ox + 4 + 120, infoB = oy - gH + 34;   /* the 'T = 10000 K' / 'h x 1.00' box, top left */
      var lw = ctx.measureText(lbl).width, lx = ctx.textAlign === 'right' ? tx - lw : tx;
      if (lx < infoR && ty - 10 < infoB) ty = infoB + 14;
      ctx.fillStyle = 'rgba(8,6,16,0.72)';                /* a backing so the label reads over the curve and the band */
      ctx.fillRect(lx - 3, ty - 10, lw + 6, 14);
      ctx.fillStyle = 'rgba(220,200,255,0.95)';
      ctx.fillText(lbl, tx, ty);
      ctx.textAlign = 'left';
      ctx.restore();
    } else if (hF * WIEN_B / T < LAM_MIN) {
      ctx.fillStyle = 'rgba(220,200,255,0.8)';
      ctx.font = '10px monospace';
      ctx.fillText('peak is left of the window (λ_max < 40 nm)', ox + 8, oy - gH + 46);
    }

    /* ── Legend ── */
    ctx.font = '10px monospace';
    var legW = 26 + ctx.measureText('Rayleigh-Jeans (classical)').width;
    var legX = Math.min(ox + gW * 0.52, ox + gW - legW - 4);
    var legY = oy - gH * 0.92;
    ctx.strokeStyle = planckColor;
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.moveTo(legX, legY);
    ctx.lineTo(legX + 22, legY);
    ctx.stroke();
    ctx.fillStyle = 'rgba(220,220,220,0.85)';
    ctx.font      = '10px monospace';
    ctx.fillText('Planck (quantum)', legX + 26, legY + 4);
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
    ctx.fillText('T = ' + Math.round(T) + ' K', ox + 4, oy - gH + 12);
    ctx.fillStyle = 'rgba(200,200,200,0.75)';
    ctx.font      = '11px monospace';
    ctx.fillText('h × ' + hF.toFixed(2), ox + 4, oy - gH + 28);
  }

  function drawStatic() {
    drawScene(temperature, hFactor);
  }

  /* ── Animation loop: auto temperature sweep ── */
  var holdUntil = 0;
  function drawFrame() {
    /* Oscillate temperature between 1000–10000 K at ~200 K/s (60fps → Δ~3.3 K/frame) */
    /* Hold the slider value while the reader is dragging, so the readout matches the setting */
    var held = performance.now() < holdUntil;
    var T = held ? temperature : Math.min(10000, Math.max(1000, temperature + 1500 * Math.sin(animT * 0.018)));
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
  var sunBtn      = document.getElementById('sun-preset-btn');

  if (tempSlider) {
    tempSlider.addEventListener('input', function () {
      temperature = parseInt(tempSlider.value, 10);
      holdUntil = performance.now() + 3000;
      if (tempReadout) tempReadout.textContent = temperature + ' K';
      drawStatic();
    });
  }

  if (sunBtn) {
    sunBtn.addEventListener('click', function () {
      temperature = 5772;
      holdUntil = performance.now() + 3000;
      if (tempSlider) tempSlider.value = '5772';
      if (tempReadout) tempReadout.textContent = '5772 K';
      drawStatic();
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
