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
    var panelH = H * 0.56;   /* mass panel: upper 56% */
    var velY   = panelH + 8; /* velocity panel starts here */

    drawMassPanel(PAD, 8, W - PAD * 2, panelH - 8, glow);
    drawVelocityPanel(PAD, velY, W - PAD * 2, H - velY - 8, glow);

    if (running && !reduced) {
      glowT += 0.05;
      raf = requestAnimationFrame(drawFrame);
    }
  }

  /* ── Mass-to-energy panel ── */
  function drawMassPanel(x, y, w, h, glow) {
    /* Section title */
    ctx.fillStyle = C_MUTED;
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MASS → ENERGY   ( E = mc\u00b2 )', x, y + 13);

    /* divider */
    ctx.strokeStyle = 'rgba(160,92,200,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 18);
    ctx.lineTo(x + w, y + 18);
    ctx.stroke();

    var barY  = y + 34;
    var barH  = 26;
    var barW  = w;

    /* Logarithmic bar: normalize log10(E) to [J_min=1, EJ] */
    var logEmin = 0;    /* log10(1 J) = 0 */
    var logEmax = 18;   /* log10(1 EJ) */
    var logE    = restEnergyJ > 0 ? Math.log10(restEnergyJ) : 0;
    var frac    = Math.max(0, Math.min(1, (logE - logEmin) / (logEmax - logEmin)));
    var filledW = frac * barW;

    /* Background bar */
    ctx.fillStyle = 'rgba(100,60,140,0.30)';
    ctx.fillRect(x, barY, barW, barH);

    /* Energy bar */
    if (filledW > 0) {
      var glowAlpha = glow;
      var barGrad = ctx.createLinearGradient(x, barY, x + filledW, barY);
      barGrad.addColorStop(0, 'rgba(160,92,200,' + (0.8 + glowAlpha) + ')');
      barGrad.addColorStop(1, 'rgba(240,192,64,' + (0.9 + glowAlpha) + ')');
      ctx.fillStyle = barGrad;
      ctx.fillRect(x, barY, filledW, barH);
    }

    /* Bar border */
    ctx.strokeStyle = 'rgba(160,92,200,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, barY, barW, barH);

    /* Energy label above bar */
    ctx.fillStyle = C_TEXT;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('E = ' + formatEnergy(restEnergyJ), x + barW / 2, barY - 4);
    ctx.textAlign = 'left';

    /* Mass label */
    ctx.fillStyle = C_GOLD;
    ctx.font = '12px monospace';
    ctx.fillText('Mass: ' + formatMass(massKg), x, barY + barH + 16);

    /* Scale references */
    var refY  = barY + barH + 36;
    var lineH = 18;

    ctx.font = '12px monospace';

    ctx.fillStyle = C_GOLD;
    ctx.fillText('\u2248 ' + stableEnergyLabel(restEnergyJ), x, refY);

    ctx.fillStyle = 'rgba(255,120,120,0.9)';
    ctx.fillText('\u2248 ' + bombLabel(restEnergyJ), x, refY + lineH);

    ctx.fillStyle = C_TEAL;
    ctx.fillText('\u2248 ' + cityPowerLabel(restEnergyJ), x, refY + lineH * 2);
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
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    },
    reset: function () {
      window.SimAPI.pause();
      massSliderVal = 300;
      betaVel       = 0;
      glowT         = 0;
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
