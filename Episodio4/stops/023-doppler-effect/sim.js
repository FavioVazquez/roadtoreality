/* ============================================================
   sim.js — Stop 023: The Doppler Effect
   Moving source emits wave circles at each emission event.
   Source speed slider; observed vs. emitted frequency readout.
   ES5 IIFE, no dependencies.
   ============================================================ */
(function () {
  'use strict';

  /* ── Mount & canvas ──────────────────────────────────────── */
  var mount = document.getElementById('sim-mount');
  if (!mount) return;

  var dpr = window.devicePixelRatio || 1;

  var canvas = document.createElement('canvas');
  canvas.style.display  = 'block';
  canvas.style.width    = '100%';
  canvas.style.height   = '100%';
  mount.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var W, H;

  function resize() {
    var rect = mount.getBoundingClientRect();
    W = Math.max(320, rect.width  || mount.clientWidth  || 600);
    H = Math.max(220, rect.height || mount.clientHeight || 380);
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  /* ── State ───────────────────────────────────────────────── */
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Physics */
  var WAVE_SPEED   = 0.014;     /* fraction of W per frame */
  var EMIT_PERIOD  = 28;        /* frames between emissions */
  var sourceSpeed  = 0.35;      /* fraction of wave speed (0–0.95) */

  var sourceX   = 0.15;         /* fraction of W */
  var emitTimer = 0;
  var waves     = [];           /* {cx:px, r:px} */

  /* ── Build controls ─────────────────────────────────────── */
  var ctrlRow = document.querySelector('.sim-controls .sim-actions');
  if (ctrlRow) {
    var sliderWrap = document.createElement('div');
    sliderWrap.style.cssText = 'display:flex;align-items:center;gap:8px;flex:1;min-width:0;';

    var sliderLabel = document.createElement('label');
    sliderLabel.textContent = 'Source speed:';
    sliderLabel.style.cssText = 'font-size:var(--text-sm,0.85rem);color:var(--color-text-secondary,#aaa);white-space:nowrap;';

    var slider = document.createElement('input');
    slider.type  = 'range';
    slider.min   = '0';
    slider.max   = '95';
    slider.value = '35';
    slider.step  = '1';
    slider.style.cssText = 'flex:1;accent-color:#5285c8;cursor:pointer;';

    var speedVal = document.createElement('span');
    speedVal.style.cssText = 'font-size:var(--text-sm,0.85rem);color:var(--color-text-muted,#888);font-family:var(--font-mono,monospace);min-width:3.5em;text-align:right;';
    speedVal.textContent = '0.35c';

    slider.addEventListener('input', function () {
      sourceSpeed = parseInt(slider.value, 10) / 100;
      speedVal.textContent = sourceSpeed.toFixed(2) + 'c';
    });

    sliderWrap.appendChild(sliderLabel);
    sliderWrap.appendChild(slider);
    sliderWrap.appendChild(speedVal);
    ctrlRow.insertBefore(sliderWrap, ctrlRow.firstChild);
  }

  /* ── Frequency readout ──────────────────────────────────── */
  var readout = document.createElement('div');
  readout.style.cssText = [
    'display:flex;gap:16px;justify-content:center;flex-wrap:wrap;',
    'font-family:var(--font-mono,monospace);font-size:var(--text-sm,0.85rem);',
    'padding:6px 0 2px;color:var(--color-text-secondary,#aaa);'
  ].join('');

  var fEmittedEl  = document.createElement('span');
  var fFrontEl    = document.createElement('span');
  var fBehindEl   = document.createElement('span');

  readout.appendChild(fEmittedEl);
  readout.appendChild(fFrontEl);
  readout.appendChild(fBehindEl);

  var simWrapper = mount.closest('.sim-wrapper') || mount.parentElement;
  var caption = simWrapper && simWrapper.querySelector('.sim-caption');
  if (caption) {
    simWrapper.insertBefore(readout, caption);
  } else if (simWrapper) {
    simWrapper.appendChild(readout);
  }

  /* ── Helpers ────────────────────────────────────────────── */
  var COLOR_WAVE   = 'rgba(82,133,200,';
  var COLOR_SOURCE = 'rgba(255,200,60,';
  var COLOR_OBS_F  = 'rgba(100,220,120,';
  var COLOR_OBS_B  = 'rgba(220,100,80,';
  var FRONT_COL    = 'rgba(100,220,120,0.85)';
  var BACK_COL     = 'rgba(220,100,80,0.85)';

  /* Observed frequency for Doppler (moving source, stationary observer):
       f_obs = f0 / (1 ∓ vs/vw)
       front: denominator = 1 - vs/vw  → higher
       behind: denominator = 1 + vs/vw → lower  */
  function dopplerFront(vs, vw)  { return 1.0 / Math.max(0.01, 1.0 - vs / vw); }
  function dopplerBehind(vs, vw) { return 1.0 / (1.0 + vs / vw); }

  function updateReadout() {
    var vw = WAVE_SPEED;
    var vs = sourceSpeed * vw;
    var f0 = 1.0;
    var ff = dopplerFront(vs, vw);
    var fb = dopplerBehind(vs, vw);

    fEmittedEl.innerHTML  = 'f\u2080 = 1.00';
    fFrontEl.innerHTML    = '<span style="color:' + FRONT_COL + '">f\u2009(ahead) = ' + ff.toFixed(2) + 'f\u2080</span>';
    fBehindEl.innerHTML   = '<span style="color:' + BACK_COL  + '">f\u2009(behind) = ' + fb.toFixed(2) + 'f\u2080</span>';
  }
  updateReadout();

  /* ── Draw ────────────────────────────────────────────────── */
  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    /* Faint tinted background */
    ctx.fillStyle = 'rgba(82,133,200,0.04)';
    ctx.fillRect(0, 0, W, H);

    var vw = WAVE_SPEED * W;
    var vs = sourceSpeed * vw;
    var sx = sourceX * W;
    var sy = H * 0.52;

    /* Advance source */
    sourceX += sourceSpeed * WAVE_SPEED;
    if (sourceX > 0.88) {
      sourceX = 0.12;
      waves   = [];
    }

    /* Emit wave at source position each EMIT_PERIOD frames */
    emitTimer++;
    if (emitTimer >= EMIT_PERIOD) {
      waves.push({ cx: sourceX * W, r: 0 });
      emitTimer = 0;
    }

    /* Expand waves */
    for (var i = 0; i < waves.length; i++) {
      waves[i].r += vw;
    }
    /* Remove waves that have grown off screen */
    waves = waves.filter(function (w) { return w.r < W * 1.4; });

    /* Draw wavefront circles */
    for (var j = 0; j < waves.length; j++) {
      var w = waves[j];
      var fade = Math.max(0, 0.65 - w.r / (W * 0.9));
      ctx.beginPath();
      ctx.arc(w.cx, sy, w.r, 0, Math.PI * 2);
      ctx.strokeStyle = COLOR_WAVE + fade + ')';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    /* Observer icons */
    ctx.font = 'bold ' + Math.round(H * 0.065) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    /* Front observer (right) */
    ctx.fillStyle = COLOR_OBS_F + '0.9)';
    ctx.fillText('\uD83D\uDD0A', W * 0.91, sy);
    /* Behind observer (left) */
    ctx.fillStyle = COLOR_OBS_B + '0.9)';
    ctx.fillText('\uD83D\uDD0A', W * 0.05, sy);

    /* Front / behind labels */
    ctx.font = '10px monospace';
    ctx.fillStyle = FRONT_COL;
    ctx.fillText('higher f', W * 0.91, sy + H * 0.09);
    ctx.fillStyle = BACK_COL;
    ctx.fillText('lower f', W * 0.05, sy + H * 0.09);

    /* Source dot */
    var sx2 = sourceX * W;
    ctx.beginPath();
    ctx.arc(sx2, sy, 9, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_SOURCE + '0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Velocity arrow */
    ctx.beginPath();
    ctx.moveTo(sx2 + 12, sy);
    ctx.lineTo(sx2 + 12 + Math.min(35, W * 0.07), sy);
    ctx.strokeStyle = COLOR_SOURCE + '0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx2 + 12 + Math.min(35, W * 0.07), sy);
    ctx.lineTo(sx2 + 12 + Math.min(35, W * 0.07) - 8, sy - 5);
    ctx.lineTo(sx2 + 12 + Math.min(35, W * 0.07) - 8, sy + 5);
    ctx.closePath();
    ctx.fillStyle = COLOR_SOURCE + '0.7)';
    ctx.fill();

    /* "v_s" label */
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOR_SOURCE + '0.8)';
    ctx.fillText('v\u209B=' + sourceSpeed.toFixed(2) + 'c', sx2 + 14, sy - 14);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    updateReadout();

    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() {
    /* Snapshot: source at 45%, 4 concentric rings */
    sourceX = 0.45;
    waves   = [];
    var sy = H * 0.52;
    for (var i = 0; i < 5; i++) {
      waves.push({ cx: (0.45 - i * 0.075) * W, r: i * 0.075 * W });
    }
    drawFrame();
    sourceX = 0.15;
    waves   = [];
    emitTimer = 0;
  }

  /* ── SimAPI ─────────────────────────────────────────────── */
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
      sourceX   = 0.15;
      waves     = [];
      emitTimer = 0;
      updateReadout();
      drawStatic();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      if (readout.parentNode) readout.parentNode.removeChild(readout);
    }
  };

  /* Resize handler */
  window.addEventListener('resize', function () {
    resize();
    if (!running) drawStatic();
  });

  drawStatic();
}());
