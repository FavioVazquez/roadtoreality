/* ============================================================
   sim.js — Stop 007: Ptolemy's Geocentric Model
   Earth at center, planets on deferents + epicycles.
   Trails show the looping retrograde paths.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H;
  var running = false;
  var rafId = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t = 0;
  var speed = 2;
  var showTrails = true;

  /* Planet definitions: deferent radius, epicycle radius, speeds (rad/frame) */
  var PLANETS = [
    { name: 'Mercury', color: 'oklch(0.80 0.10 60)',   dR: 0.22, eR: 0.10, dSpeed: 0.025, eSpeed: 0.10,  trail: [] },
    { name: 'Venus',   color: 'oklch(0.82 0.12 80)',   dR: 0.34, eR: 0.14, dSpeed: 0.015, eSpeed: 0.07,  trail: [] },
    { name: 'Mars',    color: 'oklch(0.68 0.22 20)',   dR: 0.55, eR: 0.18, dSpeed: 0.007, eSpeed: 0.03,  trail: [] },
    { name: 'Jupiter', color: 'oklch(0.72 0.15 50)',   dR: 0.72, eR: 0.12, dSpeed: 0.003, eSpeed: 0.015, trail: [] }
  ];

  var MAX_TRAIL = 800;

  function getPlanetPos(p, time, cx, cy, scale) {
    var dAngle = p.dSpeed * time;
    var eAngle = p.eSpeed * time;
    var defX = cx + Math.cos(dAngle) * p.dR * scale;
    var defY = cy + Math.sin(dAngle) * p.dR * scale;
    var px   = defX + Math.cos(eAngle) * p.eR * scale;
    var py   = defY + Math.sin(eAngle) * p.eR * scale;
    return { px: px, py: py, defX: defX, defY: defY };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'oklch(0.05 0.02 260)';
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2, cy = H / 2;
    var scale = Math.min(W, H) * 0.43;

    /* Stars */
    ctx.save();
    ctx.fillStyle = 'oklch(0.70 0 0 / 0.5)';
    for (var s = 0; s < 80; s++) {
      var sx = ((s * 137.508 * W) % W + W) % W;
      var sy = ((s * 97.331 * H) % H + H) % H;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    /* Deferent circles */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.30 0.03 285)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    for (var i = 0; i < PLANETS.length; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, PLANETS[i].dR * scale, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    /* Trails */
    if (showTrails) {
      for (var i = 0; i < PLANETS.length; i++) {
        var p = PLANETS[i];
        if (p.trail.length < 2) continue;
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var k = 0; k < p.trail.length; k++) {
          var pt = p.trail[k];
          var alpha = k / p.trail.length;
          if (k === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.globalAlpha = 0.35;
        ctx.stroke();
        ctx.restore();
      }
    }

    /* Planets + epicycle circles */
    for (var i = 0; i < PLANETS.length; i++) {
      var p = PLANETS[i];
      var pos = getPlanetPos(p, t, cx, cy, scale);

      /* Epicycle circle */
      ctx.save();
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(pos.defX, pos.defY, p.eR * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      /* Deferent arm */
      ctx.save();
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = 0.20;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(pos.defX, pos.defY);
      ctx.stroke();
      ctx.restore();

      /* Epicycle arm */
      ctx.save();
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pos.defX, pos.defY);
      ctx.lineTo(pos.px, pos.py);
      ctx.stroke();
      ctx.restore();

      /* Planet dot */
      ctx.save();
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(Math.round(pos.px), Math.round(pos.py), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* Planet name */
      ctx.save();
      ctx.font = '10px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = p.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(p.name, pos.px, pos.py - 8);
      ctx.restore();

      /* Update trail */
      p.trail.push({ x: pos.px, y: pos.py });
      if (p.trail.length > MAX_TRAIL) p.trail.shift();
    }

    /* Earth at center */
    ctx.save();
    ctx.shadowColor = 'oklch(0.55 0.18 220)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'oklch(0.55 0.18 220)';
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '700 11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.55 0.18 220)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Earth', cx, cy + 14);
    ctx.restore();

    /* Label */
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.45 0.04 285)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Ptolemaic (geocentric) model — Earth at center, planets on epicycles', W / 2, H - 8);
    ctx.restore();
  }

  /* ── SimAPI ─────────────────────────────────────────────── */
  function start() {
    if (running) return;
    running = true;
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '⏸ Pause'; btn.dataset.state = 'playing'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.add('is-running');
    if (!reducedMotion) rafId = requestAnimationFrame(loop);
    else draw();
  }

  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '▶ Play'; btn.dataset.state = 'paused'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.remove('is-running');
  }

  function reset() {
    pause();
    t = 0;
    PLANETS.forEach(function (p) { p.trail = []; });
    draw();
  }

  function destroy() {
    pause();
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  function loop() {
    if (!running) return;
    t += speed;
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function setup() {
    var mount = document.getElementById('sim-mount');
    if (!mount) return;
    canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    mount.appendChild(canvas);
    ctx = canvas.getContext('2d');

    function resize() {
      var rect = mount.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      W = Math.round(rect.width);
      H = Math.max(420, Math.round(rect.height || 420));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      PLANETS.forEach(function (p) { p.trail = []; });
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    var speedSlider = document.getElementById('speed-slider');
    var speedVal    = document.getElementById('speed-val');
    if (speedSlider) {
      speedSlider.addEventListener('input', function () {
        speed = parseInt(this.value, 10);
        if (speedVal) speedVal.textContent = speed + '×';
      });
    }

    var trailSlider = document.getElementById('trail-toggle');
    var trailVal    = document.getElementById('trail-val');
    if (trailSlider) {
      trailSlider.addEventListener('input', function () {
        showTrails = parseInt(this.value, 10) === 1;
        if (trailVal) trailVal.textContent = showTrails ? 'On' : 'Off';
        if (!showTrails) PLANETS.forEach(function (p) { p.trail = []; });
      });
    }

    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}());
