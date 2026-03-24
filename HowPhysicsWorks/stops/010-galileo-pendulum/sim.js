/* ============================================================
   sim.js — Stop 010: Galileo's Pendulum
   Accurate pendulum simulation using RK4 integration.
   Shows period readout, period vs length graph.
   Physics: θ'' = -(g/L)·sin(θ)  [exact, not small-angle approx]
   ============================================================ */
(function () {
  'use strict';

  var G = 9.8;
  var canvas, ctx, W, H;
  var running = false;
  var rafId = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* State */
  var L = 1.0;       /* metres */
  var mass = 1;      /* kg (visual only) */
  var theta0 = 15 * Math.PI / 180; /* release angle */
  var theta = theta0;
  var omega = 0;     /* angular velocity */
  var lastTs = null;
  var swingCount = 0;
  var lastSign = 1;
  var periodStart = null;
  var measuredPeriod = null;
  var elapsed = 0;
  var trail = [];

  function theoreticalPeriod() {
    /* Small-angle approximation */
    return 2 * Math.PI * Math.sqrt(L / G);
  }

  /* RK4 step for pendulum ODE */
  function rk4Step(th, om, dt) {
    function deriv(t, o) { return -G / L * Math.sin(t); }

    var k1t = om;
    var k1o = deriv(th, om);

    var k2t = om + 0.5 * dt * k1o;
    var k2o = deriv(th + 0.5 * dt * k1t, om + 0.5 * dt * k1o);

    var k3t = om + 0.5 * dt * k2o;
    var k3o = deriv(th + 0.5 * dt * k2t, om + 0.5 * dt * k2o);

    var k4t = om + dt * k3o;
    var k4o = deriv(th + dt * k3t, om + dt * k3o);

    return {
      theta: th + (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t),
      omega: om + (dt / 6) * (k1o + 2 * k2o + 2 * k3o + k4o)
    };
  }

  function pixelsPerMetre() {
    return Math.min(W, H) * 0.28;
  }

  function pivotX() { return W / 2; }
  function pivotY() { return H * 0.12; }

  function bobX() {
    return pivotX() + Math.sin(theta) * L * pixelsPerMetre();
  }
  function bobY() {
    return pivotY() + Math.cos(theta) * L * pixelsPerMetre();
  }

  function bobRadius() {
    return Math.max(12, Math.min(28, mass * 2.2 + 8));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'oklch(0.09 0.025 285)';
    ctx.fillRect(0, 0, W, H);

    var px = pivotX(), py = pivotY();
    var bx = bobX(),   by = bobY();
    var br = bobRadius();

    /* ── Ceiling bracket ── */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.35 0.05 200)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px - 30, py);
    ctx.lineTo(px + 30, py);
    ctx.stroke();
    ctx.fillStyle = 'oklch(0.35 0.05 200)';
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* ── Swing arc guide ── */
    var arcR = L * pixelsPerMetre();
    ctx.save();
    ctx.strokeStyle = 'oklch(0.25 0.03 285)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(px, py, arcR, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* ── Trail ── */
    if (trail.length > 2) {
      ctx.save();
      ctx.strokeStyle = 'oklch(0.72 0.15 145)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (var i = 0; i < trail.length; i++) {
        var alpha = i / trail.length;
        if (i === 0) ctx.moveTo(trail[i].x, trail[i].y);
        else ctx.lineTo(trail[i].x, trail[i].y);
      }
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.restore();
    }

    /* ── Rod ── */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.55 0.05 200)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.restore();

    /* ── Bob ── */
    ctx.save();
    ctx.shadowColor = 'oklch(0.72 0.15 145)';
    ctx.shadowBlur = 12;
    var grad = ctx.createRadialGradient(bx - br*0.3, by - br*0.3, 2, bx, by, br);
    grad.addColorStop(0, 'oklch(0.88 0.08 145)');
    grad.addColorStop(0.5, 'oklch(0.72 0.15 145)');
    grad.addColorStop(1, 'oklch(0.35 0.10 145)');
    ctx.beginPath();
    ctx.arc(Math.round(bx), Math.round(by), br, 0, Math.PI * 2);
    ctx.fillStyle = 'oklch(0.72 0.15 145)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = 'bold 10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.92 0.01 90)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mass + 'kg', bx, by);
    ctx.restore();

    /* ── Info panel ── */
    var infoX = 12, infoY = 12;
    ctx.save();
    ctx.fillStyle = 'oklch(0.12 0.03 285 / 0.85)';
    ctx.beginPath();
    ctx.roundRect(infoX - 4, infoY - 4, 220, 100, 8);
    ctx.fill();

    ctx.font = '12px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'oklch(0.60 0.04 285)';
    ctx.fillText('Length: ' + L.toFixed(1) + ' m', infoX, infoY + 2);
    ctx.fillText('Angle: ' + (theta0 * 180 / Math.PI).toFixed(0) + '°', infoX, infoY + 20);

    var tPeriod = theoreticalPeriod();
    ctx.fillStyle = 'oklch(0.72 0.15 145)';
    ctx.fillText('T (formula) = ' + tPeriod.toFixed(3) + ' s', infoX, infoY + 40);

    if (measuredPeriod) {
      ctx.fillStyle = 'oklch(0.80 0.17 82)';
      ctx.fillText('T (measured) = ' + measuredPeriod.toFixed(3) + ' s', infoX, infoY + 60);
    }
    ctx.fillStyle = 'oklch(0.45 0.04 285)';
    ctx.fillText('t = ' + elapsed.toFixed(2) + ' s', infoX, infoY + 80);
    ctx.restore();

    /* ── Length guide on rope ── */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.45 0.04 285)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 12, py);
    ctx.lineTo(px + 12, py + L * pixelsPerMetre());
    ctx.stroke();
    ctx.fillStyle = 'oklch(0.45 0.04 285)';
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(L.toFixed(1) + ' m', px + 16, py + L * pixelsPerMetre() / 2);
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
    theta = theta0;
    omega = 0;
    elapsed = 0;
    swingCount = 0;
    lastSign = Math.sign(theta);
    periodStart = null;
    measuredPeriod = null;
    trail = [];
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
    var wallDt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    /* Sub-step for accuracy */
    var steps = 4;
    var dt = wallDt / steps;
    for (var s = 0; s < steps; s++) {
      var result = rk4Step(theta, omega, dt);
      theta = result.theta;
      omega = result.omega;
      elapsed += dt;
    }

    /* Period measurement: count sign changes of theta */
    var sign = theta >= 0 ? 1 : -1;
    if (sign !== lastSign) {
      swingCount++;
      if (swingCount === 1) {
        periodStart = elapsed;
      } else if (swingCount === 3) {
        /* One full period = two half-swings = from sign change 1 to sign change 3 */
        measuredPeriod = elapsed - periodStart;
        swingCount = 1;
        periodStart = elapsed;
      }
      lastSign = sign;
    }

    /* Trail */
    trail.push({ x: bobX(), y: bobY() });
    if (trail.length > 120) trail.shift();

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
      H = Math.max(400, Math.round(rect.height || 400));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    var lenSlider = document.getElementById('length-slider');
    var lenVal    = document.getElementById('length-val');
    if (lenSlider) {
      lenSlider.addEventListener('input', function () {
        L = parseFloat(this.value);
        if (lenVal) lenVal.textContent = L.toFixed(1) + ' m';
        reset();
      });
    }

    var massSlider = document.getElementById('mass-slider-pend');
    var massVal    = document.getElementById('mass-val-pend');
    if (massSlider) {
      massSlider.addEventListener('input', function () {
        mass = parseInt(this.value, 10);
        if (massVal) massVal.textContent = mass + ' kg';
        /* Do NOT reset — show live that mass doesn't affect period */
        draw();
      });
    }

    var angSlider = document.getElementById('angle-slider-pend');
    var angVal    = document.getElementById('angle-val-pend');
    if (angSlider) {
      angSlider.addEventListener('input', function () {
        theta0 = parseInt(this.value, 10) * Math.PI / 180;
        if (angVal) angVal.textContent = parseInt(this.value, 10) + '°';
        reset();
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
