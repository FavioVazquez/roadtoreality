/* ============================================================
   sim.js — Stop 021: Joule and Conservation of Energy
   Weight-drop apparatus with live PE/KE/heat energy pie chart
   Height and mass sliders
   ES5 IIFE — no const, let, arrow functions, or template literals
   ============================================================ */
(function () {
  'use strict';

  /* ── Top-level state ──────────────────────────────────────── */
  var mount, canvas, ctx, dpr, W, H;
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t = 0;

  /* ── Physics state ────────────────────────────────────────── */
  var g = 9.81;           /* m/s^2 */
  var massWater = 1.0;    /* kg water in container */
  var cWater = 4184.0;    /* J/(kg·K) specific heat of water */

  var m = 2.0;            /* kg, weight mass */
  var h = 1.5;            /* m, drop height */
  var y = 0.0;            /* m, current descent distance (0 = top, h = bottom) */
  var arrived = false;    /* true when weight has reached bottom */

  /* ── Energy quantities (computed each frame) ─────────────── */
  var E_total = 0;
  var PE = 0;
  var KE = 0;
  var heat = 0;
  var deltaT = 0;

  /* ── Recompute energy from current state ─────────────────── */
  function computeEnergy() {
    E_total = m * g * h;
    if (arrived) {
      PE = 0;
      KE = 0;
      heat = E_total;
    } else {
      PE = m * g * (h - y);
      var v = Math.sqrt(2 * g * Math.max(y, 0));
      KE = 0.5 * m * v * v;
      /* Enforce conservation exactly: heat = E_total - PE - KE */
      heat = Math.max(0, E_total - PE - KE);
    }
    deltaT = heat / (massWater * cWater);
  }

  /* ── Apparatus drawing ────────────────────────────────────── */
  function drawApparatus() {
    /* Layout proportions */
    var appTop = H * 0.04;
    var appBottom = H * 0.62;
    var appHeight = appBottom - appTop;
    var appCX = W * 0.35; /* horizontal center of apparatus */

    var shaftW = 20;
    var shaftX = appCX - shaftW * 0.5;

    /* Shaft / guide rail */
    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(appCX, appTop);
    ctx.lineTo(appCX, appBottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* Height bracket on right side */
    var shaftRight = appCX + 30;
    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.4)';
    ctx.lineWidth = 1;
    /* Top tick */
    ctx.beginPath();
    ctx.moveTo(shaftRight - 5, appTop);
    ctx.lineTo(shaftRight + 5, appTop);
    ctx.stroke();
    /* Bottom tick */
    ctx.beginPath();
    ctx.moveTo(shaftRight - 5, appBottom);
    ctx.lineTo(shaftRight + 5, appBottom);
    ctx.stroke();
    /* Vertical bracket */
    ctx.beginPath();
    ctx.moveTo(shaftRight, appTop);
    ctx.lineTo(shaftRight, appBottom);
    ctx.stroke();
    ctx.restore();

    /* Height label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(82,133,200,0.6)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('h = ' + h.toFixed(1) + ' m', shaftRight + 8, (appTop + appBottom) * 0.5);
    ctx.restore();

    /* Current weight Y position on canvas */
    var weightYpx = appTop + (y / h) * appHeight;

    /* Rope above weight (from top) */
    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(appCX, appTop);
    ctx.lineTo(appCX, weightYpx - 10);
    ctx.stroke();
    ctx.restore();

    /* Velocity arrow */
    if (!arrived && y > 0.02) {
      var v = Math.sqrt(2 * g * y);
      var arrowLen = Math.min(v * 10, appHeight * 0.25);
      ctx.save();
      ctx.strokeStyle = 'rgba(82,133,200,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(appCX, weightYpx + 14);
      ctx.lineTo(appCX, weightYpx + 14 + arrowLen);
      ctx.stroke();
      /* Arrowhead */
      ctx.beginPath();
      ctx.moveTo(appCX - 5, weightYpx + 14 + arrowLen - 6);
      ctx.lineTo(appCX, weightYpx + 14 + arrowLen);
      ctx.lineTo(appCX + 5, weightYpx + 14 + arrowLen - 6);
      ctx.strokeStyle = 'rgba(82,133,200,0.7)';
      ctx.stroke();
      ctx.restore();
    }

    /* Weight block */
    var wbW = 40, wbH = 22;
    var wbX = appCX - wbW * 0.5;
    var wbY = weightYpx - wbH;
    ctx.save();
    ctx.fillStyle = arrived ? 'rgba(200,120,50,0.5)' : 'rgba(82,133,200,0.55)';
    ctx.strokeStyle = arrived ? 'rgba(200,120,50,0.9)' : 'rgba(82,133,200,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(wbX, wbY, wbW, wbH, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    /* Weight mass label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(220,220,220,0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(m.toFixed(1) + ' kg', appCX, wbY + wbH * 0.5);
    ctx.restore();

    /* Paddle-wheel container (water box) at bottom of shaft */
    var containerW = 90;
    var containerH = H * 0.12;
    var containerX = appCX - containerW * 0.5;
    var containerY = appBottom;

    /* Water color: lerp from cold blue to warm orange as heat increases */
    var heatFrac = (E_total > 0) ? Math.min(heat / E_total, 1) : 0;
    var rC = Math.round(82 + heatFrac * (220 - 82));
    var gC = Math.round(133 + heatFrac * (120 - 133));
    var bC = Math.round(200 + heatFrac * (50 - 200));
    var waterFill = 'rgba(' + rC + ',' + gC + ',' + bC + ',0.35)';

    ctx.save();
    ctx.fillStyle = waterFill;
    ctx.strokeStyle = 'rgba(82,133,200,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(containerX, containerY, containerW, containerH);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    /* Container label */
    ctx.save();
    ctx.font = '9px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('water', appCX, containerY + 4);
    ctx.restore();

    /* Paddle-wheel (rotating) */
    var paddleCX = appCX;
    var paddleCY = containerY + containerH * 0.55;
    var paddleR = containerH * 0.28;
    var paddleAngle = t * 4;
    ctx.save();
    ctx.translate(paddleCX, paddleCY);
    ctx.rotate(paddleAngle);
    ctx.strokeStyle = 'rgba(82,133,200,0.8)';
    ctx.lineWidth = 2;
    var nBlades = 4;
    for (var i = 0; i < nBlades; i++) {
      var ang = i * Math.PI / nBlades;
      ctx.beginPath();
      ctx.moveTo(-paddleR * Math.cos(ang), -paddleR * Math.sin(ang));
      ctx.lineTo(paddleR * Math.cos(ang), paddleR * Math.sin(ang));
      ctx.stroke();
    }
    /* Hub */
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(82,133,200,0.7)';
    ctx.fill();
    ctx.restore();

    /* Temperature readout beside container */
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = (deltaT > 0.0001) ? 'rgba(200,120,50,0.9)' : 'rgba(200,200,200,0.6)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('\u0394T = ' + deltaT.toFixed(4) + ' \u00b0C', containerX + containerW + 8, containerY + 4);
    ctx.restore();

    /* Top pulley */
    ctx.save();
    ctx.beginPath();
    ctx.arc(appCX - 28, appTop, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(82,133,200,0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(82,133,200,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    /* Arrived label */
    if (arrived) {
      ctx.save();
      ctx.font = 'bold 11px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(200,120,50,0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('All PE converted to heat!', appCX, appBottom - 2);
      ctx.restore();
    }
  }

  /* ── Energy pie chart ─────────────────────────────────────── */
  function drawPieChart() {
    var pieCX = W * 0.72;
    var pieCY = H * 0.34;
    var pieR = Math.min(W * 0.10, H * 0.13, 60);

    /* Background circle */
    ctx.save();
    ctx.beginPath();
    ctx.arc(pieCX, pieCY, pieR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20,20,30,0.4)';
    ctx.fill();
    ctx.restore();

    if (E_total > 0) {
      var peFrac = PE / E_total;
      var keFrac = KE / E_total;
      var heatFrac = heat / E_total;

      /* Clamp fractions to avoid floating-point negatives */
      peFrac  = Math.max(0, peFrac);
      keFrac  = Math.max(0, keFrac);
      heatFrac = Math.max(0, heatFrac);

      var peAngle   = peFrac * Math.PI * 2;
      var keAngle   = keFrac * Math.PI * 2;
      var heatAngle = heatFrac * Math.PI * 2;

      var startAngle = -Math.PI * 0.5; /* start at top */

      /* PE slice — green */
      if (peAngle > 0.001) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pieCX, pieCY);
        ctx.arc(pieCX, pieCY, pieR, startAngle, startAngle + peAngle);
        ctx.closePath();
        ctx.fillStyle = '#61bd67';
        ctx.fill();
        ctx.restore();
      }

      /* KE slice — era blue */
      var keStart = startAngle + peAngle;
      if (keAngle > 0.001) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pieCX, pieCY);
        ctx.arc(pieCX, pieCY, pieR, keStart, keStart + keAngle);
        ctx.closePath();
        ctx.fillStyle = 'rgba(82,133,200,0.9)';
        ctx.fill();
        ctx.restore();
      }

      /* Heat slice — orange */
      var heatStart = keStart + keAngle;
      if (heatAngle > 0.001) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pieCX, pieCY);
        ctx.arc(pieCX, pieCY, pieR, heatStart, heatStart + heatAngle);
        ctx.closePath();
        ctx.fillStyle = 'rgba(200,120,50,0.9)';
        ctx.fill();
        ctx.restore();
      }

      /* Border */
      ctx.save();
      ctx.beginPath();
      ctx.arc(pieCX, pieCY, pieR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(180,180,180,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    /* Legend */
    var legendX = pieCX - pieR - 10;
    var legendY = pieCY + pieR + 14;
    var legendItems = [
      { color: '#61bd67', label: 'PE' },
      { color: 'rgba(82,133,200,0.9)', label: 'KE' },
      { color: 'rgba(200,120,50,0.9)', label: 'Heat' }
    ];
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    for (var j = 0; j < legendItems.length; j++) {
      var lx = legendX + j * 46;
      ctx.fillStyle = legendItems[j].color;
      ctx.fillRect(lx, legendY, 10, 10);
      ctx.fillStyle = 'rgba(200,200,200,0.7)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(legendItems[j].label, lx + 12, legendY);
    }
    ctx.restore();

    /* Readout lines */
    var readX = pieCX - pieR;
    var readY = pieCY - pieR - 50;

    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = 'rgba(200,200,200,0.7)';
    ctx.fillText('E\u209c\u2092\u209c\u2091\u2099 = ' + E_total.toFixed(1) + ' J', readX, readY);

    ctx.fillStyle = '#61bd67';
    ctx.fillText('PE = ' + PE.toFixed(2) + ' J  (' + (E_total > 0 ? (PE / E_total * 100).toFixed(0) : '0') + '%)', readX, readY + 16);

    ctx.fillStyle = 'rgba(82,133,200,0.9)';
    ctx.fillText('KE = ' + KE.toFixed(2) + ' J  (' + (E_total > 0 ? (KE / E_total * 100).toFixed(0) : '0') + '%)', readX, readY + 32);

    ctx.fillStyle = 'rgba(200,120,50,0.9)';
    ctx.fillText('Q = ' + heat.toFixed(2) + ' J  (' + (E_total > 0 ? (heat / E_total * 100).toFixed(0) : '0') + '%)', readX, readY + 48);

    ctx.fillStyle = 'rgba(180,180,180,0.35)';
    ctx.font = '9px "DM Sans", system-ui, sans-serif';
    ctx.fillText('Total energy conserved', readX, readY + 64);

    ctx.restore();

    /* Pie chart title */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Energy distribution', pieCX, pieCY - pieR - 6);
    ctx.restore();
  }

  /* ── Main draw ────────────────────────────────────────────── */
  function draw() {
    if (!W || !H) return;
    computeEnergy();

    /* Clear */
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'oklch(0.09 0.025 285)';
    ctx.fillRect(0, 0, W, H);

    /* Apparatus on left ~55% */
    drawApparatus();

    /* Pie chart on right */
    drawPieChart();

    /* Top label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(82,133,200,0.5)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText("Joule's Weight-Drop Apparatus", 12, 8);
    ctx.restore();
  }

  /* ── Animation loop ───────────────────────────────────────── */
  function loop() {
    if (!running) return;
    var dt = 0.016;
    if (!arrived) {
      var v = Math.sqrt(2 * g * Math.max(y, 0));
      y += v * dt + 0.5 * g * dt * dt;
      if (y >= h) {
        y = h;
        arrived = true;
      }
    }
    t += dt;
    draw();
    raf = requestAnimationFrame(loop);
  }

  /* ── Sync slider labels ───────────────────────────────────── */
  function syncLabels() {
    var hLabel = document.getElementById('drop-height-label');
    if (hLabel) { hLabel.textContent = h.toFixed(1) + ' m'; }
    var mLabel = document.getElementById('mass-label');
    if (mLabel) { mLabel.textContent = m.toFixed(1) + ' kg'; }
  }

  /* ── SimAPI ───────────────────────────────────────────────── */
  window.SimAPI = {
    start: function () {
      if (running) return;
      running = true;
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.dataset.state = 'playing'; btn.innerHTML = '&#9646;&#9646; Pause'; }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) { dot.classList.add('is-running'); }
      if (!reduced) { loop(); } else { draw(); }
    },
    pause: function () {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.dataset.state = 'paused'; btn.innerHTML = '&#9654; Play'; }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) { dot.classList.remove('is-running'); }
    },
    reset: function () {
      window.SimAPI.pause();
      y = 0;
      t = 0;
      arrived = false;
      var slider = document.getElementById('drop-height-slider');
      if (slider) { h = parseFloat(slider.value) || 1.5; }
      var mSlider = document.getElementById('mass-slider');
      if (mSlider) { m = parseFloat(mSlider.value) || 2.0; }
      syncLabels();
      draw();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas && canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
    }
  };

  /* ── Setup ────────────────────────────────────────────────── */
  function setup() {
    mount = document.getElementById('sim-mount');
    if (!mount) return;

    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    mount.appendChild(canvas);
    ctx = canvas.getContext('2d');

    function resize() {
      var rect = mount.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      W = Math.round(rect.width || 600);
      H = Math.max(380, Math.round(rect.height || 400));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    /* Drop height slider */
    var hSlider = document.getElementById('drop-height-slider');
    if (hSlider) {
      hSlider.value = h;
      hSlider.addEventListener('input', function () {
        h = parseFloat(hSlider.value);
        y = 0;
        arrived = false;
        syncLabels();
        if (!running) { draw(); }
      });
    }

    /* Mass slider */
    var mSlider = document.getElementById('mass-slider');
    if (mSlider) {
      mSlider.value = m;
      mSlider.addEventListener('input', function () {
        m = parseFloat(mSlider.value);
        y = 0;
        arrived = false;
        syncLabels();
        if (!running) { draw(); }
      });
    }

    /* Play button */
    var playBtn = document.getElementById('sim-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (playBtn.dataset.state === 'playing') {
          window.SimAPI.pause();
        } else {
          window.SimAPI.start();
        }
      });
    }

    /* Reset button */
    var resetBtn = document.getElementById('sim-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        window.SimAPI.reset();
      });
    }

    syncLabels();
    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

}());
