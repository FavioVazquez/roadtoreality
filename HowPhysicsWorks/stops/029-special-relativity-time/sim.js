/* sim.js — 029 Special Relativity: Time Dilation — twin paradox interactive */
(function () {
  'use strict';

  var mount = document.getElementById('sim-mount');
  if (!mount) return;

  /* DPR canvas setup */
  var dpr = window.devicePixelRatio || 1;
  var CW = Math.max(mount.clientWidth || 600, 360);
  var CH = Math.max(mount.clientHeight || 340, 260);

  var canvas = document.createElement('canvas');
  canvas.width  = CW * dpr;
  canvas.height = CH * dpr;
  canvas.style.display = 'block';
  canvas.style.width  = '100%';
  canvas.style.height = '100%';
  mount.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  var W = CW;
  var H = CH;

  /* Resize handler */
  function resize() {
    dpr = window.devicePixelRatio || 1;
    CW = Math.max(mount.clientWidth || 600, 360);
    CH = Math.max(mount.clientHeight || 340, 260);
    canvas.width  = CW * dpr;
    canvas.height = CH * dpr;
    canvas.style.width  = '100%';
    canvas.style.height = '100%';
    ctx.scale(dpr, dpr);
    W = CW; H = CH;
    drawStatic();
  }
  window.addEventListener('resize', resize);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* State */
  var beta       = 0.0;   /* v/c */
  var gamma      = 1.0;   /* Lorentz factor */
  var earthTime  = 0.0;   /* accumulated Earth proper time (arbitrary units) */
  var travelTime = 0.0;   /* traveling twin proper time */
  var raf        = null;
  var running    = false;

  /* Colors */
  var COL_EARTH   = '#7ec8e3';  /* blue-ish for Earth twin */
  var COL_TRAVEL  = '#f0a860';  /* amber for traveling twin */
  var COL_ACCENT  = '#a05cc8';  /* purple accent */
  var COL_DIM     = 'rgba(200,200,220,0.45)';

  /* Velocity slider wiring */
  var slider  = document.getElementById('velocity-slider');
  var readout = document.getElementById('velocity-readout');

  function updateFromSlider() {
    if (!slider) return;
    var raw = parseInt(slider.value, 10) || 0;
    beta = Math.min(raw / 1000, 0.9999);
    if (beta < 0.001) {
      gamma = 1.0;
    } else {
      gamma = 1 / Math.sqrt(1 - beta * beta);
    }
    if (readout) {
      readout.textContent = 'v\u00a0=\u00a0' + beta.toFixed(3) + 'c\u00a0\u00a0\u00a0\u03b3\u00a0=\u00a0' + gamma.toFixed(3);
    }
    if (!running) drawStatic();
  }

  if (slider) {
    slider.addEventListener('input', updateFromSlider);
    updateFromSlider();
  }

  /* Draw a simple figure (head circle + body line + arms + legs) */
  function drawFigure(cx, cy, color) {
    var headR = Math.min(W, H) * 0.042;
    var bodyH = headR * 2.8;
    var legH  = headR * 2.2;
    var armW  = headR * 1.8;

    /* Body */
    ctx.beginPath();
    ctx.moveTo(cx, cy + headR);
    ctx.lineTo(cx, cy + headR + bodyH);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* Arms */
    ctx.beginPath();
    ctx.moveTo(cx - armW, cy + headR + bodyH * 0.35);
    ctx.lineTo(cx + armW, cy + headR + bodyH * 0.35);
    ctx.stroke();

    /* Left leg */
    ctx.beginPath();
    ctx.moveTo(cx, cy + headR + bodyH);
    ctx.lineTo(cx - headR * 1.2, cy + headR + bodyH + legH);
    ctx.stroke();

    /* Right leg */
    ctx.beginPath();
    ctx.moveTo(cx, cy + headR + bodyH);
    ctx.lineTo(cx + headR * 1.2, cy + headR + bodyH + legH);
    ctx.stroke();

    /* Head */
    ctx.beginPath();
    ctx.arc(cx, cy, headR, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.25;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /* Draw a simple rocket triangle pointing right */
  function drawRocket(cx, cy, size, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COL_TRAVEL;
    ctx.beginPath();
    ctx.moveTo(cx + size, cy);
    ctx.lineTo(cx - size * 0.6, cy - size * 0.5);
    ctx.lineTo(cx - size * 0.6, cy + size * 0.5);
    ctx.closePath();
    ctx.fill();
    /* Exhaust */
    ctx.fillStyle = 'rgba(255,120,30,0.7)';
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.6, cy - size * 0.25);
    ctx.lineTo(cx - size * 1.3, cy);
    ctx.lineTo(cx - size * 0.6, cy + size * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* Draw a small gamma-vs-beta curve in a corner panel */
  function drawGammaGraph(gx, gy, gw, gh) {
    /* Background */
    ctx.fillStyle = 'rgba(20,10,35,0.7)';
    ctx.strokeStyle = 'rgba(160,92,200,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(gx, gy, gw, gh);
    ctx.fill();
    ctx.stroke();

    /* Axis labels */
    ctx.fillStyle = COL_DIM;
    ctx.font = Math.round(gw * 0.09) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('v/c', gx + gw / 2, gy + gh + 12);
    ctx.save();
    ctx.translate(gx - 10, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('\u03b3', 0, 0);
    ctx.restore();

    /* Curve */
    ctx.beginPath();
    var steps = 60;
    for (var i = 0; i <= steps; i++) {
      var bv = i / steps * 0.999;
      var gv = 1 / Math.sqrt(1 - bv * bv);
      var maxGamma = 10;
      var px = gx + (bv / 0.999) * gw;
      var py = gy + gh - Math.min(gv / maxGamma, 1) * gh;
      if (i === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
    }
    ctx.strokeStyle = 'rgba(160,92,200,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Current position dot */
    var curBeta = Math.min(beta, 0.999);
    var curGamma = gamma > 10 ? 10 : gamma;
    var dotX = gx + (curBeta / 0.999) * gw;
    var dotY = gy + gh - (curGamma / 10) * gh;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffdd55';
    ctx.fill();

    ctx.textAlign = 'left';
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    /* Background */
    ctx.fillStyle = 'rgba(10,5,20,1)';
    ctx.fillRect(0, 0, W, H);

    /* Dividing line */
    ctx.beginPath();
    ctx.moveTo(W / 2, H * 0.05);
    ctx.lineTo(W / 2, H * 0.95);
    ctx.strokeStyle = 'rgba(160,92,200,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    /* Layout */
    var midY   = H * 0.38;
    var earthX = W * 0.25;
    var travX  = W * 0.75;

    /* Earth twin */
    drawFigure(earthX, midY, COL_EARTH);

    /* Traveling twin (right side) */
    drawFigure(travX, midY, COL_TRAVEL);

    /* Rocket animation on right side */
    var rocketAnim = (earthTime % 3.0) / 3.0;  /* 0..1 */
    var rocketY    = midY + H * 0.22;
    var rocketX    = W * 0.55 + (W * 0.4) * rocketAnim;
    var rocketSize = Math.max(8, W * 0.018);
    /* Wrap around */
    if (rocketX > W * 0.97) { rocketX = W * 0.55; }
    var rocketAlpha = beta < 0.001 ? 0.15 : 0.85;
    drawRocket(rocketX, rocketY, rocketSize, rocketAlpha);

    /* Labels */
    ctx.font = 'bold ' + Math.max(11, Math.round(W * 0.022)) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = COL_EARTH;
    ctx.fillText('Earth Twin', earthX, H * 0.13);

    ctx.fillStyle = COL_TRAVEL;
    ctx.fillText('Traveling Twin', travX, H * 0.13);
    ctx.font = Math.max(9, Math.round(W * 0.018)) + 'px monospace';
    ctx.fillStyle = 'rgba(240,168,96,0.7)';
    ctx.fillText('v\u00a0=\u00a0' + beta.toFixed(3) + 'c', travX, H * 0.18);

    /* Age readouts */
    var ageFont = 'bold ' + Math.max(14, Math.round(W * 0.032)) + 'px monospace';
    ctx.font = ageFont;

    ctx.fillStyle = COL_EARTH;
    ctx.textAlign = 'center';
    ctx.fillText('Age: ' + (30 + earthTime * 0.5).toFixed(2) + ' yr', earthX, H * 0.75);

    ctx.fillStyle = COL_TRAVEL;
    ctx.fillText('Age: ' + (30 + travelTime * 0.5).toFixed(2) + ' yr', travX, H * 0.75);

    /* Age gap readout panel */
    var ageGap = (earthTime - travelTime) * 0.5;
    var panelX = W * 0.5 - Math.min(W * 0.22, 120);
    var panelW = Math.min(W * 0.44, 240);
    var panelY = H * 0.82;
    var panelH = H * 0.12;

    ctx.fillStyle = 'rgba(20,10,35,0.8)';
    ctx.strokeStyle = 'rgba(160,92,200,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(panelX, panelY, panelW, panelH);
    ctx.fill();
    ctx.stroke();

    ctx.font = Math.max(9, Math.round(W * 0.018)) + 'px monospace';
    ctx.textAlign = 'center';
    var panelMidX = panelX + panelW / 2;

    if (beta < 0.001) {
      ctx.fillStyle = COL_DIM;
      ctx.fillText('Age gap: essentially zero at this speed', panelMidX, panelY + panelH * 0.4);
      ctx.fillStyle = 'rgba(160,92,200,0.6)';
      ctx.fillText('\u03b3 = 1.000    v = 0.000c', panelMidX, panelY + panelH * 0.78);
    } else {
      ctx.fillStyle = '#ffdd55';
      ctx.fillText('Age gap: ' + ageGap.toFixed(3) + ' yr', panelMidX, panelY + panelH * 0.4);
      ctx.fillStyle = 'rgba(160,92,200,0.9)';
      ctx.fillText('\u03b3 = ' + gamma.toFixed(3) + '    v = ' + beta.toFixed(3) + 'c', panelMidX, panelY + panelH * 0.78);
    }

    /* Gamma graph — lower right corner */
    var ghW = Math.max(60, Math.round(W * 0.15));
    var ghH = Math.max(44, Math.round(H * 0.18));
    var ghX = W - ghW - 10;
    var ghY = H * 0.05;
    drawGammaGraph(ghX, ghY, ghW, ghH);

    ctx.textAlign = 'left';

    /* Animate */
    if (running) {
      earthTime  += 0.02;
      travelTime += 0.02 / gamma;
    }

    if (running && !reduced) {
      raf = requestAnimationFrame(drawFrame);
    }
  }

  function drawStatic() {
    drawFrame();
  }

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
      beta       = 0.0;
      gamma      = 1.0;
      earthTime  = 0.0;
      travelTime = 0.0;
      if (slider) { slider.value = 0; }
      if (readout) { readout.textContent = 'v\u00a0=\u00a00.000c\u00a0\u00a0\u00a0\u03b3\u00a0=\u00a01.000'; }
      drawStatic();
    },
    destroy: function () {
      window.SimAPI.pause();
      window.removeEventListener('resize', resize);
      if (canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
    }
  };

  drawStatic();
}());
