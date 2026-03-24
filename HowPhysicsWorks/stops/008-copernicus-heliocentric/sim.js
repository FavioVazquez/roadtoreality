/* ============================================================
   sim.js — Stop 008: Copernicus — Heliocentric vs Geocentric
   Heliocentric mode: true orbits from above.
   Geocentric mode: paths as seen from Earth (with loops).
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H;
  var running = false;
  var rafId = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t = 0;
  var speed = 2;
  var geocentric = false; /* false = heliocentric view */

  /* True orbital data (simplified circular, relative radii & speeds) */
  var PLANETS = [
    { name: 'Mercury', color: 'oklch(0.75 0.08 60)',   r: 0.18, period: 88,   trail: [] },
    { name: 'Venus',   color: 'oklch(0.82 0.12 75)',   r: 0.28, period: 225,  trail: [] },
    { name: 'Earth',   color: 'oklch(0.55 0.18 220)',  r: 0.40, period: 365,  trail: [] },
    { name: 'Mars',    color: 'oklch(0.68 0.22 20)',   r: 0.55, period: 687,  trail: [] },
    { name: 'Jupiter', color: 'oklch(0.72 0.15 50)',   r: 0.75, period: 4333, trail: [] }
  ];
  var MAX_TRAIL = 600;

  function getHelioPos(planet, time, cx, cy, scale) {
    var angle = (2 * Math.PI * time) / planet.period;
    return {
      x: cx + Math.cos(angle) * planet.r * scale,
      y: cy + Math.sin(angle) * planet.r * scale
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'oklch(0.05 0.02 260)';
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2, cy = H / 2;
    var scale = Math.min(W, H) * 0.44;

    /* Stars */
    ctx.save();
    ctx.fillStyle = 'oklch(0.65 0 0 / 0.5)';
    for (var s = 0; s < 90; s++) {
      ctx.beginPath();
      ctx.arc(
        ((s * 127.3 * W + 17) % W + W) % W,
        ((s * 83.7  * H + 31) % H + H) % H,
        0.8, 0, Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();

    /* Compute true positions */
    var positions = PLANETS.map(function (p) {
      return getHelioPos(p, t, cx, cy, scale);
    });
    var earthPos = positions[2]; /* Earth is index 2 */

    /* If geocentric: shift all positions relative to Earth */
    var drawPositions = positions.map(function (pos, i) {
      if (!geocentric) return { x: pos.x, y: pos.y };
      /* Geocentric: pos - earth + center */
      return {
        x: cx + (pos.x - earthPos.x),
        y: cy + (pos.y - earthPos.y)
      };
    });

    /* Orbit guide circles (heliocentric only) */
    if (!geocentric) {
      ctx.save();
      ctx.strokeStyle = 'oklch(0.25 0.03 285)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      PLANETS.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(cx, cy, p.r * scale, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.restore();
    }

    /* Trails */
    PLANETS.forEach(function (p, i) {
      if (p.name === 'Earth' && geocentric) return; /* Earth stays at center */
      var dp = drawPositions[i];
      p.trail.push({ x: dp.x, y: dp.y });
      if (p.trail.length > MAX_TRAIL) p.trail.shift();

      if (p.trail.length > 2) {
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        p.trail.forEach(function (pt, k) {
          if (k === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.restore();
      }
    });

    /* Sun / Earth center */
    if (!geocentric) {
      /* Sun at center */
      ctx.save();
      ctx.shadowColor = 'oklch(0.90 0.20 82)';
      ctx.shadowBlur = 30;
      ctx.fillStyle = 'oklch(0.90 0.20 82)';
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '700 10px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'oklch(0.90 0.20 82)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('Sun', cx, cy + 17);
      ctx.restore();
    } else {
      /* Earth at center */
      ctx.save();
      ctx.shadowColor = 'oklch(0.55 0.18 220)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = 'oklch(0.55 0.18 220)';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '700 10px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'oklch(0.55 0.18 220)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('Earth', cx, cy + 13);
      ctx.restore();
    }

    /* Planets */
    PLANETS.forEach(function (p, i) {
      if (p.name === 'Earth' && geocentric) return;
      var dp = drawPositions[i];
      ctx.save();
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(Math.round(dp.x), Math.round(dp.y), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '10px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = p.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(p.name, dp.x, dp.y - 8);
      ctx.restore();
    });

    /* Mode label */
    ctx.save();
    ctx.font = '700 12px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = geocentric ? 'oklch(0.68 0.20 310)' : 'oklch(0.72 0.15 145)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
      geocentric
        ? 'Geocentric view — paths as seen from Earth'
        : 'Heliocentric view — true orbits around the Sun',
      W / 2, 10
    );
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

    var modelSlider = document.getElementById('model-toggle');
    var modelVal    = document.getElementById('model-val');
    if (modelSlider) {
      modelSlider.addEventListener('input', function () {
        geocentric = parseInt(this.value, 10) === 1;
        if (modelVal) modelVal.textContent = geocentric
          ? 'Geocentric (from Earth)'
          : 'Heliocentric (from above)';
        PLANETS.forEach(function (p) { p.trail = []; });
        if (!running) draw();
      });
    }

    var speedSlider = document.getElementById('speed-slider2');
    var speedVal    = document.getElementById('speed-val2');
    if (speedSlider) {
      speedSlider.addEventListener('input', function () {
        speed = parseInt(this.value, 10);
        if (speedVal) speedVal.textContent = speed + '×';
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
