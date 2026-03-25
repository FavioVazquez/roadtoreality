/* sim.js — 030 Special Relativity: Length Contraction — interactive ruler */
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
    if (!running) drawStatic();
  }
  window.addEventListener('resize', resize);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Constants */
  var L0 = 100;   /* rest length in meters (display only) */

  /* State */
  var beta    = 0.0;
  var gamma   = 1.0;
  var L       = L0;   /* contracted length in meters */
  var raf     = null;
  var running = false;
  var carX    = 0;    /* horizontal position offset for animation */

  /* Colors */
  var COL_ACCENT  = '#a05cc8';
  var COL_DIM     = 'rgba(200,200,220,0.45)';

  /* Slider wiring */
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
    L = L0 / gamma;
    if (readout) {
      readout.textContent = 'v\u00a0=\u00a0' + beta.toFixed(3) + 'c\u00a0\u00a0\u00a0L\u00a0=\u00a0' + L.toFixed(1) + '\u00a0m';
    }
    if (!running) drawStatic();
  }

  if (slider) {
    slider.addEventListener('input', updateFromSlider);
    updateFromSlider();
  }

  /* Base width of ruler at rest (pixels) */
  function baseWidth() { return W * 0.68; }

  /* Draw tick marks on a ruler */
  function drawTicks(x0, y, pxWidth, n, h, color) {
    var spacing = pxWidth / n;
    for (var i = 0; i <= n; i++) {
      var tx = x0 + i * spacing;
      var th = (i % (n / 2) === 0) ? h * 0.65 : (i % (n / 10) === 0 ? h * 0.45 : h * 0.28);
      ctx.beginPath();
      ctx.moveTo(tx, y - th / 2);
      ctx.lineTo(tx, y + th / 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawScene(offsetX) {
    ctx.clearRect(0, 0, W, H);

    /* Background */
    ctx.fillStyle = 'rgba(8,4,18,1)';
    ctx.fillRect(0, 0, W, H);

    var bw   = baseWidth();
    var carH = Math.max(22, H * 0.095);
    var contracted = bw * (L / L0);  /* contracted pixel width */

    /* Center baseline */
    var ghostY = H * 0.42;
    var carY   = H * 0.62;

    /* Ghost outline — rest length (does NOT move) */
    var ghostX = (W - bw) / 2;

    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = 'rgba(160,92,200,0.55)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ghostX, ghostY - carH / 2, bw, carH);
    ctx.setLineDash([]);
    ctx.restore();

    /* Ghost tick marks */
    ctx.save();
    ctx.globalAlpha = 0.4;
    drawTicks(ghostX, ghostY, bw, 10, carH, 'rgba(160,92,200,0.8)');
    ctx.restore();

    /* Ghost label */
    ctx.font = Math.max(9, Math.round(W * 0.018)) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(160,92,200,0.6)';
    ctx.fillText('L\u2080 = ' + L0 + ' m  (rest length)', ghostX + bw / 2, ghostY - carH / 2 - 7);

    /* Direction of motion arrow */
    var arrY = H * 0.1;
    var arrLen = Math.max(30, W * 0.12) * (0.3 + 0.7 * beta);
    var arrX0 = W / 2 - arrLen / 2;
    ctx.beginPath();
    ctx.moveTo(arrX0, arrY);
    ctx.lineTo(arrX0 + arrLen, arrY);
    ctx.strokeStyle = beta < 0.001 ? 'rgba(160,92,200,0.2)' : 'rgba(255,220,80,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
    /* Arrowhead */
    ctx.beginPath();
    ctx.moveTo(arrX0 + arrLen, arrY);
    ctx.lineTo(arrX0 + arrLen - 8, arrY - 5);
    ctx.lineTo(arrX0 + arrLen - 8, arrY + 5);
    ctx.closePath();
    ctx.fillStyle = beta < 0.001 ? 'rgba(160,92,200,0.2)' : 'rgba(255,220,70,0.85)';
    ctx.fill();

    /* v label near arrow */
    ctx.font = Math.max(9, Math.round(W * 0.018)) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,220,80,0.7)';
    ctx.fillText('v = ' + beta.toFixed(3) + 'c', W / 2, arrY - 10);

    /* Contracted train car — uses horizontal offset for animation */
    var carX0 = (W - contracted) / 2 + offsetX;

    /* Gradient fill */
    var grad = ctx.createLinearGradient(carX0, carY, carX0 + contracted, carY);
    grad.addColorStop(0, 'rgba(140,110,180,0.75)');
    grad.addColorStop(0.5, 'rgba(180,150,220,0.85)');
    grad.addColorStop(1, 'rgba(100,80,140,0.65)');

    /* Rounded rect helper (ES5) */
    var rr = Math.min(5, carH * 0.2, contracted * 0.1);
    ctx.beginPath();
    ctx.moveTo(carX0 + rr, carY - carH / 2);
    ctx.lineTo(carX0 + contracted - rr, carY - carH / 2);
    ctx.quadraticCurveTo(carX0 + contracted, carY - carH / 2, carX0 + contracted, carY - carH / 2 + rr);
    ctx.lineTo(carX0 + contracted, carY + carH / 2 - rr);
    ctx.quadraticCurveTo(carX0 + contracted, carY + carH / 2, carX0 + contracted - rr, carY + carH / 2);
    ctx.lineTo(carX0 + rr, carY + carH / 2);
    ctx.quadraticCurveTo(carX0, carY + carH / 2, carX0, carY + carH / 2 - rr);
    ctx.lineTo(carX0, carY - carH / 2 + rr);
    ctx.quadraticCurveTo(carX0, carY - carH / 2, carX0 + rr, carY - carH / 2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(220,180,255,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Tick marks on contracted car */
    var tickN = Math.max(2, Math.round(10 * (contracted / bw)));
    drawTicks(carX0, carY, contracted, tickN, carH, 'rgba(255,255,255,0.5)');

    /* Car label */
    ctx.font = Math.max(9, Math.round(W * 0.018)) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(220,180,255,0.9)';
    ctx.fillText('L = ' + L.toFixed(1) + ' m', carX0 + contracted / 2, carY + carH / 2 + 16);

    /* L readout panel */
    var ratioStr = (L / L0).toFixed(3);
    var panelH  = Math.max(32, H * 0.1);
    var panelY  = H * 0.83;
    var panelX  = W * 0.5 - Math.min(W * 0.33, 190);
    var panelW  = Math.min(W * 0.66, 380);

    ctx.fillStyle = 'rgba(20,10,35,0.8)';
    ctx.strokeStyle = 'rgba(160,92,200,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(panelX, panelY, panelW, panelH);
    ctx.fill();
    ctx.stroke();

    ctx.font = Math.max(10, Math.round(W * 0.02)) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(220,180,255,0.9)';
    ctx.fillText(
      'L\u00a0=\u00a0' + L.toFixed(1) + '\u00a0m\u00a0\u00a0\u00a0(L\u2080\u00a0=\u00a0100\u00a0m)\u00a0\u00a0\u00a0L/L\u2080\u00a0=\u00a0' + ratioStr,
      panelX + panelW / 2,
      panelY + panelH * 0.62
    );

    ctx.textAlign = 'left';
  }

  function drawFrame() {
    /* Advance animation offset */
    if (running) {
      var speed = beta * 4;   /* px/frame proportional to beta */
      carX += speed;
      if (carX > W * 0.5) { carX = -W * 0.5; }
    }
    drawScene(running ? carX : 0);

    if (running && !reduced) {
      raf = requestAnimationFrame(drawFrame);
    }
  }

  function drawStatic() {
    carX = 0;
    drawScene(0);
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
      beta  = 0.0;
      gamma = 1.0;
      L     = L0;
      carX  = 0;
      if (slider) { slider.value = 0; }
      if (readout) { readout.textContent = 'v\u00a0=\u00a00.000c\u00a0\u00a0\u00a0L\u00a0=\u00a0100.0\u00a0m'; }
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
