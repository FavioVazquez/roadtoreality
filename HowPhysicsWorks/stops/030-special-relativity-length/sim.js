/* sim.js — 030 Special Relativity: Length Contraction — train car */
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

  /* Base width of car body at rest (pixels) */
  function baseWidth() { return W * 0.68; }

  /* Rounded rectangle path helper (ES5) */
  function roundedRect(x, y, w, h, r) {
    var rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    if (rr < 0) { rr = 0; }
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  /* Draw a train car silhouette.
   *   cx, cy  — centre of the car body
   *   w       — current width (contracted or rest)
   *   h       — fixed body height (never changes)
   *   isGhost — if true: dashed outline only, no fill
   */
  function drawCar(cx, cy, w, h, isGhost) {
    var x0 = cx - w / 2;  /* left edge of body */
    var y0 = cy - h / 2;  /* top edge of body */

    var bodyRadius = Math.min(8, h * 0.15);
    var roofH      = h * 0.18;
    var roofInset  = w * 0.06;
    var roofW      = w - 2 * roofInset;
    var roofY      = y0 - roofH;

    /* Wheel geometry (does not scale with w on radius, but x positions do) */
    var wheelR      = Math.max(5, h * 0.18);
    var wheelY      = cy + h / 2 + wheelR * 0.55;
    var wheelPositions = [x0 + w * 0.15, x0 + w * 0.35, x0 + w * 0.65, x0 + w * 0.85];

    /* Undercarriage bar */
    var underH = Math.max(3, h * 0.06);
    var underW = w * 0.82;
    var underX = cx - underW / 2;
    var underY = cy + h / 2 - 1;

    /* Window geometry (scales with w) */
    var winW    = Math.max(2, w * 0.18);
    var winH    = h * 0.30;
    var winY    = cy - h * 0.05 - winH / 2;
    var winR    = Math.min(3, winW * 0.15, winH * 0.15);
    var winPositions = [cx - w * 0.25, cx + w * 0.25];

    if (isGhost) {
      /* Ghost: dashed outline only */
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = 'rgba(160,92,200,0.55)';
      ctx.lineWidth = 1.5;

      /* Body outline */
      roundedRect(x0, y0, w, h, bodyRadius);
      ctx.stroke();

      /* Roof outline */
      if (roofW > 4) {
        roundedRect(x0 + roofInset, roofY, roofW, roofH, Math.min(3, roofH * 0.3));
        ctx.stroke();
      }

      /* Window outlines */
      for (var gi = 0; gi < winPositions.length; gi++) {
        var gwx = winPositions[gi] - winW / 2;
        if (winW > 3) {
          roundedRect(gwx, winY, winW, winH, winR);
          ctx.stroke();
        }
      }

      /* Undercarriage */
      ctx.beginPath();
      ctx.rect(underX, underY, underW, underH);
      ctx.stroke();

      /* Wheels */
      for (var gw = 0; gw < wheelPositions.length; gw++) {
        ctx.beginPath();
        ctx.arc(wheelPositions[gw], wheelY, wheelR, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.setLineDash([]);
      ctx.restore();
      return;
    }

    /* --- Filled car --- */

    /* Body gradient */
    var grad = ctx.createLinearGradient(x0, y0, x0, y0 + h);
    grad.addColorStop(0,   'rgba(52, 48, 90, 0.95)');
    grad.addColorStop(0.45,'rgba(70, 60, 115, 0.98)');
    grad.addColorStop(1,   'rgba(35, 30, 65, 0.95)');

    roundedRect(x0, y0, w, h, bodyRadius);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(220,180,255,0.75)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Roof panel */
    if (roofW > 4) {
      var roofGrad = ctx.createLinearGradient(x0 + roofInset, roofY, x0 + roofInset, roofY + roofH);
      roofGrad.addColorStop(0, 'rgba(80, 70, 130, 0.95)');
      roofGrad.addColorStop(1, 'rgba(55, 48, 100, 0.95)');
      roundedRect(x0 + roofInset, roofY, roofW, roofH, Math.min(3, roofH * 0.3));
      ctx.fillStyle = roofGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,160,255,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* Windows */
    for (var wi = 0; wi < winPositions.length; wi++) {
      var wx = winPositions[wi] - winW / 2;
      if (winW > 3) {
        roundedRect(wx, winY, winW, winH, winR);
        ctx.fillStyle = 'rgba(160,210,255,0.35)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(180,230,255,0.65)';
        ctx.lineWidth = 1;
        ctx.stroke();
        /* Window reflection glint */
        if (winW > 8) {
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fillRect(wx + winW * 0.1, winY + winH * 0.1, winW * 0.25, winH * 0.25);
        }
      }
    }

    /* Undercarriage bar */
    ctx.fillStyle = 'rgba(30, 25, 55, 0.9)';
    ctx.fillRect(underX, underY, underW, underH);
    ctx.strokeStyle = 'rgba(180,140,240,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(underX, underY, underW, underH);

    /* Wheels */
    for (var wh = 0; wh < wheelPositions.length; wh++) {
      var wxp = wheelPositions[wh];
      /* Wheel body */
      ctx.beginPath();
      ctx.arc(wxp, wheelY, wheelR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(45, 38, 70, 1)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(180,140,240,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      /* Wheel hub */
      ctx.beginPath();
      ctx.arc(wxp, wheelY, wheelR * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(160,92,200,0.6)';
      ctx.fill();
    }
  }

  function drawScene(offsetX) {
    ctx.clearRect(0, 0, W, H);

    /* Background */
    ctx.fillStyle = 'rgba(8,4,18,1)';
    ctx.fillRect(0, 0, W, H);

    var bw   = baseWidth();
    var carH = Math.max(28, H * 0.13);
    var contracted = bw * (L / L0);  /* contracted pixel width */

    /* Car centre positions */
    var ghostCY = H * 0.38;
    var carCY   = H * 0.62;
    var ghostCX = W / 2;

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

    /* Ghost label */
    ctx.font = Math.max(9, Math.round(W * 0.018)) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(160,92,200,0.6)';
    ctx.fillText('L\u2080 = ' + L0 + ' m  (rest length)', ghostCX, ghostCY - carH / 2 - 10);

    /* Ghost outline — rest length car (does NOT move) */
    drawCar(ghostCX, ghostCY, bw, carH, true);

    /* Contracted car — uses horizontal offset for animation */
    var carCX = W / 2 + offsetX;
    drawCar(carCX, carCY, contracted, carH, false);

    /* Car label */
    var wheelR = Math.max(5, carH * 0.18);
    var labelY = carCY + carH / 2 + wheelR * 1.3 + 14;
    ctx.font = Math.max(9, Math.round(W * 0.018)) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(220,180,255,0.9)';
    ctx.fillText('L = ' + L.toFixed(1) + ' m', carCX, labelY);

    /* L readout panel */
    var ratioStr = (L / L0).toFixed(3);
    var panelH  = Math.max(32, H * 0.1);
    var panelY  = H * 0.88;
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
