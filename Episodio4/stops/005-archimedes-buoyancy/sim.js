/* ============================================================
   sim.js — Stop 005: Archimedes and Buoyancy
   Objects dropped into water; float or sink based on density.
   Shows displaced volume and buoyant force readout.
   ============================================================ */
(function () {
  'use strict';

  var OBJECTS = [
    { name: 'Wood',     density: 600,  color: 'oklch(0.65 0.12 55)',  emoji: '🪵' },
    { name: 'Ice',      density: 917,  color: 'oklch(0.82 0.06 220)', emoji: '🧊' },
    { name: 'Stone',    density: 2600, color: 'oklch(0.55 0.04 280)', emoji: '🪨' },
    { name: 'Iron',     density: 7874, color: 'oklch(0.45 0.05 260)', emoji: '⚙️' },
    { name: 'Hollow ship', density: 150, color: 'oklch(0.70 0.10 200)', emoji: '🚢' }
  ];

  var WATER_DENSITY = 1000; /* kg/m³ */
  var G = 9.8;

  var canvas, ctx, W, H;
  var running = false;
  var rafId = null;
  var objIdx = 0;

  /* Object state */
  var obj = null;
  var waterLevel, waterBaseY, tankLeft, tankRight, tankBottom, tankWidth;

  function makeTank() {
    tankLeft   = W * 0.15;
    tankRight  = W * 0.85;
    tankBottom = H - 50;
    tankWidth  = tankRight - tankLeft;
    waterBaseY = tankBottom - 200; /* water surface at rest */
    waterLevel = waterBaseY;
  }

  function makeObject(idx) {
    var def = OBJECTS[idx];
    var volume = 0.003; /* m³ — fixed for visual consistency */
    var mass   = def.density * volume;
    /* Visual radius */
    var r = Math.max(18, Math.min(40, 24));
    return {
      def:      def,
      volume:   volume,
      mass:     mass,
      r:        r,
      x:        (tankLeft + tankRight) / 2,
      y:        waterBaseY - r - 20, /* start just above water */
      vy:       0,
      state:    'falling', /* falling | settling | resting */
      submergedFraction: 0,
      /* Equilibrium depth fraction for floating objects */
      eqFrac:   Math.min(1, def.density / WATER_DENSITY)
    };
  }

  var lastTs = null;

  function update(dt) {
    if (!obj || obj.state === 'resting') return;

    var def  = obj.def;
    var floats = def.density < WATER_DENSITY;

    /* Compute submerged fraction from current position */
    var top    = obj.y - obj.r;
    var bottom = obj.y + obj.r;
    if (bottom <= waterBaseY) {
      obj.submergedFraction = 0;
    } else if (top >= waterBaseY) {
      obj.submergedFraction = 1;
    } else {
      obj.submergedFraction = (bottom - waterBaseY) / (obj.r * 2);
    }

    /* Forces */
    var Fb   = WATER_DENSITY * G * obj.volume * obj.submergedFraction;
    var Fg   = obj.mass * G;
    var Fnet = Fg - Fb;
    var acc  = Fnet / obj.mass;

    /* Strong damping in water — decay oscillations quickly */
    var damping = obj.submergedFraction > 0 ? 0.72 : 1.0;
    obj.vy = (obj.vy + acc * dt) * damping;
    obj.y += obj.vy * dt * 60;

    /* For floaters: hard clamp — never go below equilibrium depth */
    if (floats) {
      var eqY = waterBaseY - obj.r + obj.eqFrac * obj.r * 2;
      if (obj.y >= eqY) {
        obj.y  = eqY;
        obj.vy = 0;
        obj.state = 'resting';
        obj.submergedFraction = obj.eqFrac;
      }
    }

    /* Floor constraint — sinking objects */
    if (obj.y + obj.r >= tankBottom - 2) {
      obj.y  = tankBottom - 2 - obj.r;
      obj.vy = 0;
      obj.state = 'resting';
      obj.submergedFraction = 1;
    }

    /* Settle check */
    if (Math.abs(obj.vy) < 0.15 && obj.state !== 'falling') {
      obj.state = 'resting';
      /* Snap precisely to equilibrium depth for floaters */
      if (floats) {
        obj.y = waterBaseY - obj.r + obj.eqFrac * obj.r * 2;
        obj.submergedFraction = obj.eqFrac;
      }
      obj.vy = 0;
    }

    if (obj.state === 'falling' && obj.submergedFraction > 0) {
      obj.state = 'settling';
    }

    /* Water level rise: visual pixels proportional to submerged fraction */
    /* Tank cross-section in px²; object cross-section ~ pi*r² px² */
    var tankAreaPx   = tankWidth * (tankBottom - waterBaseY);
    var subAreaPx    = Math.PI * obj.r * obj.r * obj.submergedFraction;
    var risePx       = subAreaPx / tankWidth * 2.5; /* visible amplification */
    waterLevel = waterBaseY - risePx;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Background */
    ctx.fillStyle = 'oklch(0.09 0.025 285)';
    ctx.fillRect(0, 0, W, H);

    /* Tank walls */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.50 0.10 200)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tankLeft, waterBaseY - 60);
    ctx.lineTo(tankLeft, tankBottom);
    ctx.lineTo(tankRight, tankBottom);
    ctx.lineTo(tankRight, waterBaseY - 60);
    ctx.stroke();
    ctx.restore();

    /* Water body */
    ctx.save();
    ctx.fillStyle = 'oklch(0.55 0.18 220 / 0.35)';
    ctx.fillRect(tankLeft + 2, waterLevel, tankWidth - 4, tankBottom - waterLevel - 2);

    /* Water surface shimmer */
    ctx.fillStyle = 'oklch(0.72 0.18 210 / 0.4)';
    ctx.fillRect(tankLeft + 2, waterLevel, tankWidth - 4, 4);
    ctx.restore();

    /* Water label */
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.65 0.15 220)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Water (1000 kg/m³)', tankRight + 8, (waterLevel + tankBottom) / 2);
    ctx.restore();

    /* Object */
    if (obj) {
      var def = obj.def;
      /* Glow */
      ctx.save();
      ctx.shadowColor = def.color;
      ctx.shadowBlur  = 20;
      ctx.beginPath();
      ctx.arc(Math.round(obj.x), Math.round(obj.y), obj.r, 0, Math.PI * 2);
      ctx.fillStyle = def.color;
      ctx.fill();
      ctx.restore();

      /* Body */
      ctx.save();
      ctx.beginPath();
      ctx.arc(Math.round(obj.x), Math.round(obj.y), obj.r, 0, Math.PI * 2);
      ctx.fillStyle = def.color;
      ctx.fill();
      ctx.strokeStyle = 'oklch(0.90 0.01 90 / 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      /* Emoji label */
      ctx.save();
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.emoji, obj.x, obj.y);
      ctx.restore();

      /* Force arrows when in water */
      if (obj.submergedFraction > 0.05) {
        var Fb = WATER_DENSITY * G * obj.volume * obj.submergedFraction;
        var Fg = obj.mass * G;
        var arrowScale = 3;

        /* Weight arrow (down) */
        drawArrow(obj.x - 30, obj.y, obj.x - 30, obj.y + Math.min(Fg * arrowScale, 80),
          'oklch(0.68 0.22 20)', '↓ Weight');

        /* Buoyancy arrow (up) */
        drawArrow(obj.x + 30, obj.y, obj.x + 30, obj.y - Math.min(Fb * arrowScale, 80),
          'oklch(0.72 0.15 145)', '↑ Buoyancy');
      }

      /* Info readout */
      var floats = def.density < WATER_DENSITY;
      var status = obj.state === 'resting'
        ? (floats ? '✓ Floats  (density < water)' : '✗ Sinks  (density > water)')
        : 'Falling…';

      ctx.save();
      ctx.font = '13px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = floats ? 'oklch(0.72 0.15 145)' : 'oklch(0.68 0.22 20)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(def.name + '  ' + def.density + ' kg/m³  —  ' + status, W / 2, 12);
      ctx.restore();
    }
  }

  function drawArrow(x1, y1, x2, y2, color, label) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx*dx + dy*dy);
    if (len < 5) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    /* Arrowhead */
    var angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 8 * Math.cos(angle - 0.4), y2 - 8 * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - 8 * Math.cos(angle + 0.4), y2 - 8 * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();

    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = dy < 0 ? 'bottom' : 'top';
    ctx.fillText(label, (x1 + x2) / 2, dy < 0 ? y2 - 4 : y2 + 4);
    ctx.restore();
  }

  /* ── SimAPI ─────────────────────────────────────────────── */
  function start() {
    if (running) return;
    running = true;
    lastTs = null;
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '⏸ Pause'; btn.dataset.state = 'playing'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.add('is-running');
    rafId = requestAnimationFrame(loop);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '▶ Drop it!'; btn.dataset.state = 'paused'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.remove('is-running');
  }

  function reset() {
    pause();
    makeTank();
    obj = makeObject(objIdx);
    draw();
  }

  function destroy() {
    pause();
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    update(dt);
    draw();
    if (obj && obj.state !== 'resting') {
      rafId = requestAnimationFrame(loop);
    } else {
      running = false;
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) dot.classList.remove('is-running');
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.textContent = '▶ Drop it!'; btn.dataset.state = 'paused'; }
      draw();
    }
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
      makeTank();
      obj = makeObject(objIdx);
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    var slider = document.getElementById('obj-slider');
    var nameEl = document.getElementById('obj-name');
    if (slider) {
      slider.addEventListener('input', function () {
        objIdx = parseInt(this.value, 10);
        if (nameEl) nameEl.textContent = OBJECTS[objIdx].name;
        pause();
        makeTank();
        obj = makeObject(objIdx);
        draw();
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
