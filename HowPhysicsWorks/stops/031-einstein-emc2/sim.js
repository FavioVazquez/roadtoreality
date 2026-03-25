/* sim.js — 031 E = mc²: mass-to-energy slider + relativistic energy panels */
(function () {
  'use strict';

  var mount = document.getElementById('sim-mount');
  if (!mount) return;

  /* ── Physics constants (pre-computed, not recalculated at runtime) ── */
  var C_MS               = 2.998e8;          /* m/s */
  var C2                 = C_MS * C_MS;      /* m²/s² */
  var J_PER_KILOTON_TNT  = 4.184e12;         /* joules per kiloton TNT */
  var J_PER_HIROSHIMA    = 6.276e13;         /* 15 kt * 4.184e12 */
  var J_PER_CITY_HOUR    = 3.6e12;           /* 1 GW city for 1 hour */

  /* ── Canvas setup (DPR pattern) ── */
  var canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width   = '100%';
  canvas.style.height  = '100%';
  mount.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var DPR = window.devicePixelRatio || 1;
  var W, H;

  function resize() {
    var cw = mount.clientWidth  || 600;
    var ch = mount.clientHeight || 400;
    W = Math.max(cw, 360);
    H = Math.max(ch, 300);
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  resize();

  /* ── Reduced-motion check ── */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── State ── */
  var massSliderVal = 300;   /* 0–600 logarithmic scale; 300 = 1g, 600 = 1kg */
  var massKg        = 0;
  var restEnergyJ   = 0;
  var betaVel       = 0;     /* v / c */
  var gammaVel      = 1.0;
  var keJ           = 0;
  var totalEnergyJ  = 0;

  /* Animation state */
  var raf     = null;
  var running = false;
  var glowT   = 0;

  /* Shockwave rings: each { r, alpha } */
  var rings = [];

  /* ── Helpers ── */
  function formatEnergy(j) {
    if (j <= 0)    return '0 J';
    if (j < 1e3)   return j.toFixed(1) + ' J';
    if (j < 1e6)   return (j / 1e3).toFixed(3)  + ' kJ';
    if (j < 1e9)   return (j / 1e6).toFixed(3)  + ' MJ';
    if (j < 1e12)  return (j / 1e9).toFixed(3)  + ' GJ';
    if (j < 1e15)  return (j / 1e12).toFixed(3) + ' TJ';
    if (j < 1e18)  return (j / 1e15).toFixed(3) + ' PJ';
    return (j / 1e18).toFixed(3) + ' EJ';
  }

  function formatMass(kg) {
    if (kg < 1e-6) return (kg * 1e9).toFixed(3) + ' µg';
    if (kg < 1e-3) return (kg * 1e6).toFixed(3) + ' mg';
    if (kg < 1)    return (kg * 1e3).toFixed(4) + ' g';
    return kg.toFixed(4) + ' kg';
  }

  /* ── Stable label formatters (threshold-based, no log10 per frame) ── */
  function stableEnergyLabel(joules) {
    var TON = 4.184e9;   /* 1 ton TNT in joules */
    var tnt = joules / TON;
    if (tnt >= 1e6)  return (tnt / 1e6).toFixed(2) + ' Mt TNT';
    if (tnt >= 1e3)  return (tnt / 1e3).toFixed(2) + ' kt TNT';
    if (tnt >= 1)    return tnt.toFixed(2) + ' t TNT';
    if (tnt >= 1e-3) return (tnt * 1e3).toFixed(2) + ' kg TNT';
    return joules.toFixed(2) + ' J';
  }

  function bombLabel(joules) {
    var HIROSHIMA = 6.3e13;
    var n = joules / HIROSHIMA;
    if (n >= 1000) return Math.round(n / 1000) + 'k Hiroshima bombs';
    if (n >= 1)    return n.toFixed(1) + ' Hiroshima bombs';
    return (n * 100).toFixed(1) + '% of Hiroshima bomb';
  }

  function cityPowerLabel(joules) {
    var CITY_YEAR = 3.15e16;
    var years = joules / CITY_YEAR;
    if (years >= 1)   return years.toFixed(2) + ' city-years of power';
    var hours = joules / (CITY_YEAR / 8760);
    if (hours >= 1)   return hours.toFixed(1) + ' city-hours of power';
    var mins = hours * 60;
    return mins.toFixed(1) + ' city-minutes of power';
  }

  /* ── Compute physics from slider state ── */
  function computePhysics() {
    /* Mass: slider 0–600 → 10^(val/100 - 6) kg
       slider=0 → 10^(-6) kg = 1 µg
       slider=300 → 10^(-3) kg = 1 g
       slider=600 → 10^0 kg = 1 kg */
    massKg       = Math.pow(10, massSliderVal / 100 - 6);
    restEnergyJ  = massKg * C2;

    /* Velocity panel */
    var beta2  = betaVel * betaVel;
    gammaVel   = betaVel < 0.9999 ? 1 / Math.sqrt(1 - beta2) : 1e4;
    var p      = gammaVel * massKg * betaVel * C_MS;   /* relativistic momentum */
    var E2     = p * p * C2 + restEnergyJ * restEnergyJ;
    totalEnergyJ = Math.sqrt(E2);
    keJ          = totalEnergyJ - restEnergyJ;
  }

  computePhysics();

  /* ── Slider wiring ── */
  var massSliderEl = document.getElementById('mass-slider');
  var massReadout  = document.getElementById('mass-readout');
  var velSliderEl  = document.getElementById('velocity-slider');
  var velReadout   = document.getElementById('velocity-readout');

  function updateMassReadout() {
    if (massReadout) massReadout.textContent = formatMass(massKg);
  }

  function updateVelReadout() {
    if (velReadout) velReadout.textContent = 'v = ' + betaVel.toFixed(3) + 'c';
  }

  if (massSliderEl) {
    massSliderEl.addEventListener('input', function () {
      massSliderVal = parseInt(this.value, 10);
      computePhysics();
      updateMassReadout();
      updateVelReadout();
      drawStatic();
    });
  }

  if (velSliderEl) {
    velSliderEl.addEventListener('input', function () {
      betaVel = parseInt(this.value, 10) / 1000;
      computePhysics();
      updateVelReadout();
      drawStatic();
    });
  }

  updateMassReadout();
  updateVelReadout();

  /* ── Color palette ── */
  var C_PURPLE  = '#a05cc8';
  var C_TEAL    = '#3cb8b2';
  var C_GOLD    = '#f0c040';
  var C_TEXT    = 'rgba(255,255,255,0.88)';
  var C_MUTED   = 'rgba(255,255,255,0.50)';
  var C_DIM     = 'rgba(255,255,255,0.30)';

  /* ── Draw ── */
  function drawFrame(ts) {
    ctx.clearRect(0, 0, W, H);

    /* subtle background tint */
    ctx.fillStyle = 'rgba(160,92,200,0.04)';
    ctx.fillRect(0, 0, W, H);

    /* glow pulse for running animation */
    var glow = running ? 0.15 + 0.12 * Math.sin(glowT) : 0;

    var PAD    = 20;
    var panelH = H * 0.60;   /* sphere panel: upper 60% */
    var velY   = panelH + 8; /* velocity panel starts here */

    drawEnergySphere(PAD, 8, W - PAD * 2, panelH - 8, glow);
    drawVelocityPanel(PAD, velY, W - PAD * 2, H - velY - 8, glow);

    if (running && !reduced) {
      glowT += 0.05;

      /* Spawn a new ring every 40 frames (~1.5 s at 60fps / 2 s slower) */
      var frameCount = Math.round(glowT / 0.05);
      if (frameCount % 40 === 0) {
        var sphereAreaTop2 = 8 + 22;
        var labelAreaH2   = 52;
        var sphereAreaH2  = (H * 0.60 - 8) - labelAreaH2 - 22;
        var maxR2 = sphereAreaH2 * 0.38;
        var spawnR = energyToRadius(restEnergyJ, maxR2);
        rings.push({ r: spawnR, alpha: 0.7 });
      }

      /* Draw and advance rings */
      var sphereAreaTop3 = 8 + 22;
      var labelAreaH3    = 52;
      var sphereAreaH3   = (H * 0.60 - 8) - labelAreaH3 - 22;
      var ringCX = PAD + (W - PAD * 2) / 2;
      var ringCY = sphereAreaTop3 + sphereAreaH3 * 0.52;

      for (var ri = rings.length - 1; ri >= 0; ri--) {
        var ring = rings[ri];
        ctx.beginPath();
        ctx.arc(ringCX, ringCY, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,200,80,' + ring.alpha + ')';
        ctx.lineWidth = 2;
        ctx.stroke();
        ring.r += 1.5;
        ring.alpha -= 0.012;
        if (ring.alpha <= 0) rings.splice(ri, 1);
      }

      raf = requestAnimationFrame(drawFrame);
    }
  }

  /* ── Energy sphere panel — replaces the old bar panel ── */
  /* Logarithm mapping is computed once per call (not per frame from Math.log10 on a
     per-pixel basis), so it does not cause flickering. */
  var LOG_MIN = Math.log(1e3);    /* ln(1 kJ) — near-zero mass floor */
  var LOG_MAX = Math.log(9e16);   /* ln(~1 kg rest energy) */

  /* Landmark thresholds in joules */
  var LANDMARKS = [
    { j: 4.184e9,  label: '1 t TNT',      color: 'rgba(240,192,64,0.70)' },
    { j: 4.184e12, label: '1 kt TNT',     color: 'rgba(240,192,64,0.85)' },
    { j: 6.3e13,   label: 'Hiroshima',    color: 'rgba(255,120,120,0.85)' },
    { j: 4.184e15, label: '1 Mt TNT',     color: 'rgba(255,80,80,0.90)' },
    { j: 3.15e16,  label: 'City (1 yr)',  color: 'rgba(60,184,178,0.90)' }
  ];

  function energyToRadius(joules, maxR) {
    var logE = Math.log(Math.max(joules, 1e3));
    var frac = (logE - LOG_MIN) / (LOG_MAX - LOG_MIN);
    frac = Math.max(0, Math.min(1, frac));
    return Math.max(4, frac * maxR);
  }

  function drawEnergySphere(x, y, w, h, glow) {
    /* Section title */
    ctx.fillStyle = C_MUTED;
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MASS \u2192 ENERGY   ( E = mc\u00b2 )', x, y + 13);

    /* divider */
    ctx.strokeStyle = 'rgba(160,92,200,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 18);
    ctx.lineTo(x + w, y + 18);
    ctx.stroke();

    /* Sphere area: upper portion of this panel */
    var sphereAreaTop = y + 22;
    var labelAreaH    = 52;   /* space at bottom for text labels */
    var sphereAreaH   = h - labelAreaH - 22;
    var cx = x + w / 2;
    var cy = sphereAreaTop + sphereAreaH * 0.52;
    var maxR = sphereAreaH * 0.38;

    /* Compute radius for current energy */
    var r = energyToRadius(restEnergyJ, maxR);

    var rDraw = Math.max(4, r);

    /* Draw landmark lines first (behind sphere) */
    var lineX0 = x;
    var lineX1 = x + w;

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;

    for (var i = 0; i < LANDMARKS.length; i++) {
      var lm = LANDMARKS[i];
      var lmR = energyToRadius(lm.j, maxR);
      var lmY = cy - lmR;

      /* Only draw if within sphere area */
      if (lmY < sphereAreaTop || lmY > cy + maxR) continue;

      /* Highlight if sphere has grown past this landmark */
      var reached = r >= lmR;
      ctx.strokeStyle = reached ? lm.color : 'rgba(255,255,255,0.20)';
      ctx.beginPath();
      ctx.moveTo(lineX0, lmY);
      ctx.lineTo(lineX1, lmY);
      ctx.stroke();

      /* Label on the right */
      ctx.fillStyle = reached ? lm.color : 'rgba(255,255,255,0.30)';
      ctx.font = (reached ? 'bold ' : '') + '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(lm.label, lineX1, lmY - 3);
    }

    ctx.restore();

    /* Draw glowing sphere */
    if (rDraw >= 4) {
      var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rDraw);
      var coreAlpha  = Math.min(1, 0.95 + glow * 0.5);
      var innerAlpha = Math.min(1, 0.80 + glow * 0.3);
      var outerAlpha = Math.min(1, 0.50 + glow * 0.2);
      grad.addColorStop(0,   'rgba(255,245,200,' + coreAlpha + ')');
      grad.addColorStop(0.35,'rgba(255,200,80,'  + innerAlpha + ')');
      grad.addColorStop(0.70,'rgba(220,100,40,'  + outerAlpha + ')');
      grad.addColorStop(1,   'rgba(160,50,180,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, rDraw, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    /* Labels below sphere area */
    var labelY = sphereAreaTop + sphereAreaH + 14;

    ctx.textAlign = 'center';
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = C_GOLD;
    ctx.fillText('\u2248 ' + stableEnergyLabel(restEnergyJ), cx, labelY);

    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255,120,120,0.90)';
    ctx.fillText(bombLabel(restEnergyJ), cx, labelY + 16);

    ctx.fillStyle = C_TEAL;
    ctx.fillText(cityPowerLabel(restEnergyJ), cx, labelY + 30);

    ctx.textAlign = 'left';
  }

  /* ── Velocity / SR energy panel ── */
  function drawVelocityPanel(x, y, w, h, glow) {
    /* Section title */
    ctx.fillStyle = C_MUTED;
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('RELATIVISTIC ENERGY   ( E\u00b2 = (pc)\u00b2 + (mc\u00b2)\u00b2 )', x, y + 13);

    ctx.strokeStyle = 'rgba(160,92,200,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 18);
    ctx.lineTo(x + w, y + 18);
    ctx.stroke();

    var barY = y + 32;
    var barH = 22;

    /* Bars are drawn relative to max total energy at 0.99c for normalization */
    var maxBeta    = 0.99;
    var maxGamma   = 1 / Math.sqrt(1 - maxBeta * maxBeta);
    var maxP       = maxGamma * massKg * maxBeta * C_MS;
    var maxE2      = maxP * maxP * C2 + restEnergyJ * restEnergyJ;
    var maxTotalE  = Math.sqrt(maxE2);
    var refEnergy  = Math.max(maxTotalE, restEnergyJ * 1.01);

    var restFrac  = refEnergy > 0 ? Math.min(1, restEnergyJ / refEnergy) : 0;
    var keFrac    = refEnergy > 0 ? Math.min(1, keJ / refEnergy) : 0;
    var restW     = restFrac * w;
    var keW       = keFrac * w;

    /* Background */
    ctx.fillStyle = 'rgba(60,80,60,0.25)';
    ctx.fillRect(x, barY, w, barH);

    /* Rest energy bar (bottom, purple) */
    if (restW > 0) {
      ctx.fillStyle = 'rgba(160,92,200,' + (0.80 + glow) + ')';
      ctx.fillRect(x, barY, restW, barH);
    }

    /* KE bar (stacked on top, teal) */
    if (keW > 0 && restW + keW <= w) {
      ctx.fillStyle = 'rgba(60,184,178,' + (0.85 + glow) + ')';
      ctx.fillRect(x + restW, barY, keW, barH);
    }

    /* Bar border */
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, barY, w, barH);

    /* Labels inside bars (if wide enough) */
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    if (restW > 60) {
      ctx.fillStyle = 'rgba(255,255,255,0.90)';
      ctx.fillText('E\u2080 = mc\u00b2', x + restW / 2, barY + barH / 2 + 4);
    }
    if (keW > 60) {
      ctx.fillStyle = 'rgba(255,255,255,0.90)';
      ctx.fillText('KE = (\u03b3\u22121)mc\u00b2', x + restW + keW / 2, barY + barH / 2 + 4);
    }

    ctx.textAlign = 'left';

    /* Readouts below bar */
    var readY = barY + barH + 16;
    ctx.font = '12px monospace';

    ctx.fillStyle = C_PURPLE;
    ctx.fillText('E\u2080 = mc\u00b2 = ' + formatEnergy(restEnergyJ), x, readY);

    ctx.fillStyle = C_TEAL;
    ctx.fillText('KE = (\u03b3\u22121)mc\u00b2 = ' + formatEnergy(keJ), x, readY + 17);

    ctx.fillStyle = C_TEXT;
    ctx.fillText('Total E = \u03b3mc\u00b2 = ' + formatEnergy(totalEnergyJ), x, readY + 34);

    /* Gamma and velocity readout — right side */
    ctx.textAlign = 'right';
    ctx.fillStyle = C_GOLD;
    ctx.font = '13px monospace';
    ctx.fillText('\u03b3 = ' + gammaVel.toFixed(3), x + w, readY);
    ctx.fillText('v = ' + betaVel.toFixed(3) + 'c', x + w, readY + 17);
    ctx.textAlign = 'left';
  }

  function drawStatic() {
    computePhysics();
    drawFrame(0);
  }

  /* ── Window resize ── */
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      drawStatic();
    }, 100);
  });

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
      rings = [];
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    },
    reset: function () {
      window.SimAPI.pause();
      massSliderVal = 300;
      betaVel       = 0;
      glowT         = 0;
      rings         = [];
      if (massSliderEl) { massSliderEl.value = '300'; }
      if (velSliderEl)  { velSliderEl.value  = '0'; }
      computePhysics();
      updateMassReadout();
      updateVelReadout();
      drawStatic();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };

  drawStatic();
}());
