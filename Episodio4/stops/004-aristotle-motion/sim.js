/* ============================================================
   sim.js — Stop 004: Aristotle's Theory of Motion
   Two balls dropped simultaneously. Sliders: mass, air resistance.
   Physics: constant gravity g=9.8, optional drag F=-b*v
   Integration: Euler (fast enough for this simple case)
   ============================================================ */
(function () {
  'use strict';

  var GRAVITY = 9.8;    /* m/s² */
  var SCALE   = 60;     /* pixels per metre at 1x */
  var AIR_LABELS = ['None', 'Light', 'Medium', 'Heavy'];
  var AIR_COEFF  = [0, 0.08, 0.25, 0.6];

  var canvas, ctx, W, H;
  var running = false;
  var rafId   = null;
  var dropped = false;

  var ball1 = null, ball2 = null;
  var mass1 = 1, mass2 = 10, airLevel = 0;
  var floorY; /* canvas y for the ground */
  var startY; /* canvas y for the drop point */

  function Ball(x, mass, color) {
    this.x    = x;
    this.mass = mass;
    this.color= color;
    this.r    = Math.max(12, Math.min(30, mass * 2.5 + 8));
    this.vy   = 0;
    /* metre position (0 = start, positive = downward) */
    this.posM = 0;
    this.landed = false;
    this.landTime = null;
  }

  Ball.prototype.update = function (dt) {
    if (this.landed) return;
    var b = AIR_COEFF[airLevel];
    /* Drag force proportional to v² / mass (so heavier = less drag) */
    var drag = b * this.vy * this.vy / this.mass * (this.vy > 0 ? 1 : -1);
    var acc = GRAVITY - drag;
    this.vy += acc * dt;
    this.posM += this.vy * dt;

    var canvasY = startY + this.posM * SCALE;
    if (canvasY + this.r >= floorY) {
      this.posM  = (floorY - startY - this.r) / SCALE;
      this.vy    = 0;
      this.landed = true;
      this.landTime = elapsed;
    }
  };

  Ball.prototype.canvasY = function () {
    return startY + this.posM * SCALE;
  };

  var elapsed = 0; /* seconds since drop */
  var startTime = null;

  function initBalls() {
    if (!W || !H) return;
    floorY = H - 50;
    startY = 80;
    ball1 = new Ball(W * 0.3, mass1, 'oklch(0.72 0.12 60)');
    ball2 = new Ball(W * 0.7, mass2, 'oklch(0.68 0.20 310)');
    elapsed = 0;
    startTime = null;
    dropped = false;
  }

  function drawBackground() {
    ctx.fillStyle = 'oklch(0.09 0.025 285)';
    ctx.fillRect(0, 0, W, H);

    /* Floor */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.35 0.05 60)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(W, floorY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'oklch(0.35 0.05 60)';
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Ground', W - 8, floorY - 4);
    ctx.restore();

    /* Drop line */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.30 0.03 285)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.lineTo(W, startY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* Height markers */
    var dropH = (floorY - startY) / SCALE;
    ctx.save();
    ctx.fillStyle = 'oklch(0.40 0.03 285)';
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (var m = 1; m <= Math.floor(dropH); m++) {
      var my = startY + m * SCALE;
      if (my < floorY) {
        ctx.beginPath();
        ctx.moveTo(0, my); ctx.lineTo(8, my);
        ctx.strokeStyle = 'oklch(0.30 0.03 285)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillText(m + 'm', 10, my);
      }
    }
    ctx.restore();
  }

  function drawBall(ball, label) {
    var cy = ball.canvasY();

    /* Drop shadow */
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(ball.x, floorY - 3, ball.r * 0.8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* Ball glow */
    if (!ball.landed) {
      ctx.save();
      ctx.shadowColor  = ball.color;
      ctx.shadowBlur   = 16;
      ctx.beginPath();
      ctx.arc(Math.round(ball.x), Math.round(cy), ball.r, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();
      ctx.restore();
    }

    /* Ball body */
    if (!W || !H || !isFinite(ball.x) || !isFinite(cy) || ball.r <= 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(Math.round(ball.x), Math.round(cy), ball.r, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.restore();

    /* Label */
    ctx.save();
    ctx.font = 'bold 11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.9 0.01 90)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, ball.x, cy);
    ctx.restore();

    /* Velocity trail when falling */
    if (!ball.landed && dropped && ball.vy > 2) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = ball.color;
      ctx.lineWidth = ball.r * 0.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ball.x, cy - ball.r);
      ctx.lineTo(ball.x, cy - ball.r - Math.min(ball.vy * 3, 40));
      ctx.stroke();
      ctx.restore();
    }

    /* Land time badge */
    if (ball.landed && ball.landTime !== null) {
      ctx.save();
      ctx.fillStyle = ball.color;
      ctx.font = '700 11px "DM Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(ball.landTime.toFixed(2) + 's', ball.x, floorY - ball.r - 8);
      ctx.restore();
    }
  }

  function drawAristotelePrediction() {
    if (!dropped) return;
    /* Aristotle's prediction badge */
    ctx.save();
    ctx.font = '12px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    var bothLanded = ball1 && ball1.landed && ball2 && ball2.landed;
    var text, color;

    if (bothLanded) {
      var diff = Math.abs(ball1.landTime - ball2.landTime);
      if (diff < 0.05) {
        text = 'Same time! Aristotle was wrong.';
        color = 'oklch(0.72 0.15 145)';
      } else {
        text = 'Different times (' + diff.toFixed(2) + 's gap) — air resistance at work.';
        color = 'oklch(0.72 0.12 60)';
      }
    } else {
      if (airLevel === 0) {
        text = 'Aristotle predicted: heavier ball lands first.';
        color = 'oklch(0.68 0.20 310)';
      } else {
        text = 'Air resistance is ON — watch for the difference.';
        color = 'oklch(0.72 0.12 60)';
      }
    }

    ctx.fillStyle = color;
    ctx.fillText(text, W / 2, 8);
    ctx.restore();
  }

  function drawTimer() {
    if (!dropped) return;
    ctx.save();
    ctx.font = '700 20px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.60 0.03 285)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(elapsed.toFixed(2) + 's', W - 10, 28);
    ctx.restore();
  }

  function draw() {
    if (!W || !H || !ball1) return;
    drawBackground();
    if (ball1) drawBall(ball1, mass1 + 'kg');
    if (ball2) drawBall(ball2, mass2 + 'kg');
    drawAristotelePrediction();
    drawTimer();
  }

  /* ── SimAPI ─────────────────────────────────────────────── */
  function start() {
    /* Re-init if canvas wasn't sized yet at setup time (W===0) */
    if (!W || !H || !ball1 || ball1.x === 0) {
      var mount = document.getElementById('sim-mount');
      if (mount) {
        var rect = mount.getBoundingClientRect();
        W = canvas.width  = Math.round(rect.width)  || 600;
        H = canvas.height = Math.max(400, Math.round(rect.height || 400));
        canvas.style.height = H + 'px';
        initBalls();
        draw();
      }
    }
    if (!dropped) {
      /* First press = drop */
      dropped = true;
      running = true;
      lastTimestamp = null;
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.textContent = '⏸ Pause'; btn.dataset.state = 'playing'; }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) dot.classList.add('is-running');
      var status = document.getElementById('sim-status');
      if (status) status.textContent = 'Balls released simultaneously!';
      rafId = requestAnimationFrame(loop);
    } else if (!running) {
      running = true;
      lastTimestamp = null;
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.textContent = '⏸ Pause'; btn.dataset.state = 'playing'; }
      rafId = requestAnimationFrame(loop);
    }
  }

  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = dropped ? '▶ Resume' : '▶ Drop!'; btn.dataset.state = 'paused'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.remove('is-running');
  }

  function reset() {
    pause();
    initBalls();
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '▶ Drop!'; btn.dataset.state = 'paused'; }
    var status = document.getElementById('sim-status');
    if (status) status.textContent = 'Press Drop to release both balls simultaneously.';
    draw();
  }

  function destroy() {
    pause();
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  /* ── Loop ───────────────────────────────────────────────── */
  var lastTimestamp = null;
  function loop(ts) {
    if (!running) return;
    if (!lastTimestamp) lastTimestamp = ts;
    var dt = Math.min((ts - lastTimestamp) / 1000, 0.05);
    lastTimestamp = ts;

    if (dropped) {
      elapsed += dt;
      if (ball1) ball1.update(dt);
      if (ball2) ball2.update(dt);

      /* Stop when both landed */
      if (ball1 && ball2 && ball1.landed && ball2.landed) {
        running = false;
        var dot = document.querySelector('.sim-caption__dot');
        if (dot) dot.classList.remove('is-running');
        var btn = document.getElementById('sim-play-btn');
        if (btn) { btn.textContent = '↺ Done'; btn.dataset.state = 'paused'; }
      }
    }

    draw();
    if (running) rafId = requestAnimationFrame(loop);
  }

  /* ── Setup ──────────────────────────────────────────────── */
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
      initBalls();
      draw();
    }
    /* Defer first resize by one frame so CSS layout settles */
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', function () { if (!dropped) resize(); });

    /* Slider wiring */
    var m1s = document.getElementById('mass1-slider');
    var m2s = document.getElementById('mass2-slider');
    var airs = document.getElementById('air-slider');

    if (m1s) m1s.addEventListener('input', function () {
      mass1 = parseInt(this.value, 10);
      var v = document.getElementById('mass1-val');
      if (v) v.textContent = mass1 + ' kg';
      if (!dropped) { initBalls(); draw(); }
    });
    if (m2s) m2s.addEventListener('input', function () {
      mass2 = parseInt(this.value, 10);
      var v = document.getElementById('mass2-val');
      if (v) v.textContent = mass2 + ' kg';
      if (!dropped) { initBalls(); draw(); }
    });
    if (airs) airs.addEventListener('input', function () {
      airLevel = parseInt(this.value, 10);
      var v = document.getElementById('air-val');
      if (v) v.textContent = AIR_LABELS[airLevel];
      if (!dropped) { initBalls(); draw(); }
    });

    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}());
