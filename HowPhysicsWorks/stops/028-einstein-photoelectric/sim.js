/* sim.js — 028 Einstein: photoelectric effect with frequency/intensity sliders */
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

  var W = CW;
  var H = CH;

  /* ── Physics constants (normalized units) ── */
  var FREQ_THRESHOLD = 0.5;  /* normalized; slider maps 0.3–1.0 */
  var KE_SCALE       = 10.0; /* so KE_max at freq=1.0 is (1.0-0.5)*10 = 5 eV */
  var PHI_LABEL      = '2.3'; /* eV label only */

  /* ── State ── */
  var freq      = 0.40; /* initial below threshold */
  var intensity = 0.50;
  var aboveThreshold = false;
  var keEV = 0;

  var photons   = [];
  var electrons = [];
  var flashes   = [];

  var raf     = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Layout ── */
  /* Left 55% = simulation area; right 45% = KE readout panel */
  function simArea() {
    return { x: 0, y: 0, w: W * 0.55, h: H };
  }
  function panelArea() {
    return { x: W * 0.55, y: 0, w: W * 0.45, h: H };
  }

  /* Metal plate: bottom 28% of sim area height */
  function metalPlate() {
    var sa = simArea();
    var plateH = sa.h * 0.28;
    return { x: sa.x, y: sa.h - plateH, w: sa.w, h: plateH };
  }

  /* ── Particle helpers ── */
  function photonColor() {
    /* Interpolate from red (low freq) to violet (high freq) */
    var t = Math.max(0, Math.min(1, (freq - 0.3) / 0.7));
    var r = Math.round(255 * (1 - t) + 130 * t);
    var g = Math.round(80  * (1 - t) + 0   * t);
    var b = Math.round(40  * (1 - t) + 255 * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function spawnPhoton() {
    var sa  = simArea();
    var mp  = metalPlate();
    /* Start from top-left region, aim at a random point on the plate top edge */
    var targetX = sa.x + Math.random() * sa.w * 0.85 + sa.w * 0.05;
    var startX  = sa.x + Math.random() * sa.w * 0.3;
    var startY  = 0;
    var dx = targetX - startX;
    var dy = mp.y    - startY;
    var len = Math.sqrt(dx * dx + dy * dy);
    var speed = 3.5;
    photons.push({
      x:  startX,
      y:  startY,
      vx: dx / len * speed,
      vy: dy / len * speed,
      tx: targetX,
      active: true
    });
  }

  function spawnElectron(x, y) {
    var angle = -(Math.PI * 0.25 + Math.random() * Math.PI * 0.5); /* upward spread */
    var speed = 2.0 + Math.sqrt(Math.max(0, keEV)) * 0.8;
    electrons.push({
      x:    x,
      y:    y,
      vx:   Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      vy:   Math.sin(angle) * speed,
      life: 1.0
    });
  }

  function spawnFlash(x, y) {
    flashes.push({ x: x, y: y, r: 6, life: 1.0 });
  }

  /* ── Update logic ── */
  function updateParticles() {
    /* Photon spawning: up to (round(intensity*8)+1) active at once */
    var maxPhotons = Math.round(intensity * 8) + 1;
    if (photons.length < maxPhotons && Math.random() < 0.25) {
      spawnPhoton();
    }

    var mp = metalPlate();

    /* Update photons */
    photons = photons.filter(function (p) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y >= mp.y) {
        /* Hit the plate */
        if (aboveThreshold) {
          if (electrons.length < 20) spawnElectron(p.x, mp.y);
        } else {
          spawnFlash(p.x, mp.y);
        }
        return false;
      }
      var sa = simArea();
      return p.x >= 0 && p.x <= sa.w && p.y >= 0;
    });

    /* Update electrons */
    electrons = electrons.filter(function (e) {
      e.x  += e.vx;
      e.y  += e.vy;
      e.vy += 0.05; /* slight gravity */
      e.life -= 0.012;
      return e.life > 0 && e.y < H && e.x > -20 && e.x < W + 20;
    });

    /* Update flashes */
    flashes = flashes.filter(function (f) {
      f.r    += 0.8;
      f.life -= 0.08;
      return f.life > 0;
    });
  }

  /* ── Draw ── */
  function drawSim() {
    var sa = simArea();
    var mp = metalPlate();
    var pa = panelArea();

    /* Background */
    ctx.fillStyle = 'rgb(10,10,18)';
    ctx.fillRect(0, 0, W, H);

    /* Sim area bg */
    ctx.fillStyle = 'rgb(14,12,22)';
    ctx.fillRect(sa.x, sa.y, sa.w, sa.h);

    /* ── Frequency bar at top ── */
    var barH  = Math.max(10, H * 0.03);
    var barY  = 8;
    var barX  = sa.x + 8;
    var barW  = sa.w - 16;
    /* gradient red→violet */
    var grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0,   'rgb(255,60,60)');
    grad.addColorStop(0.33,'rgb(255,180,60)');
    grad.addColorStop(0.55,'rgb(60,200,60)');
    grad.addColorStop(1,   'rgb(130,0,255)');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, barW, barH);

    /* Threshold marker on bar */
    var threshX = barX + (FREQ_THRESHOLD - 0.3) / 0.7 * barW;
    ctx.strokeStyle = 'rgba(255,80,80,0.9)';
    ctx.lineWidth   = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(threshX, barY - 4);
    ctx.lineTo(threshX, barY + barH + 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,120,120,0.85)';
    ctx.font      = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('\u03c6', threshX, barY + barH + 14);
    ctx.textAlign = 'left';

    /* Current freq indicator on bar */
    var curFreqX = barX + (freq - 0.3) / 0.7 * barW;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(curFreqX - 5, barY - 6);
    ctx.lineTo(curFreqX + 5, barY - 6);
    ctx.lineTo(curFreqX,     barY);
    ctx.closePath();
    ctx.fill();

    /* ── Metal plate ── */
    var mpGrad = ctx.createLinearGradient(mp.x, mp.y, mp.x, mp.y + mp.h);
    mpGrad.addColorStop(0, 'rgb(110,110,130)');
    mpGrad.addColorStop(1, 'rgb(60,60,75)');
    ctx.fillStyle = mpGrad;
    ctx.fillRect(mp.x, mp.y, mp.w, mp.h);

    /* Metal surface highlight line */
    ctx.strokeStyle = 'rgba(180,180,200,0.55)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(mp.x, mp.y);
    ctx.lineTo(mp.x + mp.w, mp.y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(180,180,210,0.5)';
    ctx.font      = '10px monospace';
    ctx.fillText('metal (sodium,  \u03c6 = ' + PHI_LABEL + ' eV)', mp.x + 8, mp.y + mp.h * 0.45);

    /* ── Photons ── */
    var pColor = photonColor();
    photons.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = pColor;
      ctx.fill();
      /* glow */
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = pColor.replace('rgb', 'rgba').replace(')', ',0.2)');
      ctx.fill();
    });

    /* ── Electrons ── */
    electrons.forEach(function (e) {
      ctx.beginPath();
      ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(82,160,240,' + e.life.toFixed(2) + ')';
      ctx.fill();
    });

    /* ── Flashes (hit indicators) ── */
    flashes.forEach(function (f) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,80,60,' + f.life.toFixed(2) + ')';
      ctx.lineWidth   = 2;
      ctx.stroke();
      /* X mark */
      ctx.strokeStyle = 'rgba(255,60,60,' + f.life.toFixed(2) + ')';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(f.x - 4, f.y - 4); ctx.lineTo(f.x + 4, f.y + 4);
      ctx.moveTo(f.x + 4, f.y - 4); ctx.lineTo(f.x - 4, f.y + 4);
      ctx.stroke();
    });

    /* ── HIGH INTENSITY / NO EJECTION banner ── */
    if (intensity > 0.7 && !aboveThreshold) {
      ctx.save();
      ctx.font      = 'bold 13px monospace';
      ctx.textAlign = 'center';
      /* Semi-transparent background pill */
      var bannerText = 'HIGH INTENSITY \u2014 NO EJECTION';
      var bw = ctx.measureText(bannerText).width + 20;
      var bx = sa.w / 2 - bw / 2;
      var by = sa.h * 0.48;
      ctx.fillStyle = 'rgba(30,0,0,0.7)';
      ctx.fillRect(bx, by, bw, 24);
      ctx.fillStyle = 'rgba(255,60,60,0.95)';
      ctx.fillText(bannerText, sa.w / 2, by + 17);
      ctx.restore();
    }

    /* ── Divider ── */
    ctx.strokeStyle = 'rgba(160,92,200,0.25)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(pa.x, 0);
    ctx.lineTo(pa.x, H);
    ctx.stroke();

    /* ── KE Readout panel ── */
    var px0 = pa.x + 12;
    var py0 = H * 0.18;

    ctx.fillStyle = 'rgba(160,92,200,0.7)';
    ctx.font      = 'bold 11px monospace';
    ctx.fillText('KINETIC ENERGY', px0, py0);

    ctx.fillStyle = 'rgba(180,180,220,0.8)';
    ctx.font      = '10px monospace';
    ctx.fillText('KE = hf \u2212 \u03c6', px0, py0 + 18);

    /* KE value */
    var keText  = keEV.toFixed(2) + ' eV';
    var keColor = aboveThreshold ? 'rgba(80,220,120,0.95)' : 'rgba(255,100,100,0.95)';
    ctx.fillStyle = keColor;
    ctx.font      = 'bold 22px monospace';
    ctx.fillText(keText, px0, py0 + 52);

    /* Status line */
    ctx.font = '10px monospace';
    if (aboveThreshold) {
      ctx.fillStyle = 'rgba(80,220,120,0.85)';
      ctx.fillText('Electrons ejected', px0, py0 + 70);
    } else {
      ctx.fillStyle = 'rgba(255,100,100,0.85)';
      ctx.fillText('No ejection \u2014 raise frequency', px0, py0 + 70);
    }

    /* Frequency bar mini */
    ctx.fillStyle = 'rgba(140,100,200,0.55)';
    ctx.font      = '9px monospace';
    ctx.fillText('freq: ' + freq.toFixed(2) + (aboveThreshold ? '  >\u03c6' : '  <\u03c6'), px0, py0 + 90);
    ctx.fillText('intensity: ' + Math.round(intensity * 100) + '%', px0, py0 + 104);
    ctx.fillText('threshold: ' + FREQ_THRESHOLD.toFixed(2), px0, py0 + 118);

    /* Note about intensity */
    ctx.fillStyle = 'rgba(140,140,170,0.65)';
    ctx.font      = '9px monospace';
    var noteLines = ['More photons,', 'not more energy', 'per photon.'];
    for (var i = 0; i < noteLines.length; i++) {
      ctx.fillText(noteLines[i], px0, py0 + 148 + i * 13);
    }
  }

  function drawStatic() {
    photons = []; electrons = []; flashes = [];
    drawSim();
  }

  /* ── Animation loop ── */
  function drawFrame() {
    updateParticles();
    drawSim();
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
  var freqSlider      = document.getElementById('frequency-slider');
  var intSlider       = document.getElementById('intensity-slider');
  var freqReadout     = document.getElementById('frequency-readout');
  var intReadout      = document.getElementById('intensity-readout');

  function updateState() {
    aboveThreshold = (freq >= FREQ_THRESHOLD);
    keEV           = aboveThreshold ? (freq - FREQ_THRESHOLD) * KE_SCALE : 0;
  }

  if (freqSlider) {
    freqSlider.addEventListener('input', function () {
      /* slider 1–100 maps to freq 0.30–1.00 */
      freq = 0.30 + (parseInt(freqSlider.value, 10) - 1) / 99 * 0.70;
      updateState();
      if (freqReadout) {
        freqReadout.textContent = aboveThreshold
          ? 'Above threshold (' + keEV.toFixed(2) + ' eV KE)'
          : 'Below threshold';
      }
      if (!running) drawStatic();
    });
  }

  if (intSlider) {
    intSlider.addEventListener('input', function () {
      intensity = parseInt(intSlider.value, 10) / 100;
      if (intReadout) intReadout.textContent = Math.round(intensity * 100) + '%';
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
      freq      = 0.40;
      intensity = 0.50;
      photons   = [];
      electrons = [];
      flashes   = [];
      updateState();
      if (freqSlider)  freqSlider.value  = '34'; /* 0.30 + 33/99*0.70 ≈ 0.53 → use 34 for 0.40 */
      if (intSlider)   intSlider.value   = '50';
      if (freqReadout) freqReadout.textContent  = 'Below threshold';
      if (intReadout)  intReadout.textContent   = '50%';
      drawStatic();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };

  /* ── Init ── */
  updateState();
  drawStatic();
}());
