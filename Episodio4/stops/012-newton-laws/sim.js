/* ============================================================
   sim.js — Stop 012: Newton's Laws of Motion
   A block on a surface. Apply force → watch F=ma.
   Shows: inertia (keeps moving), F=ma readout, wall reaction.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H;
  var running = false;
  var rafId   = null;
  var lastTs  = null;

  var FRICTION_LABELS = ['None', 'Low', 'Medium', 'High'];
  var FRICTION_COEFF  = [0, 0.03, 0.08, 0.18];

  var forceN   = 10;  /* applied force, Newtons */
  var massKg   = 5;
  var frictionLevel = 1;
  var applyingForce = false;

  /* Block physics */
  var blockX, blockY;
  var blockW = 64, blockH = 48;
  var vel = 0;      /* px/s */
  var acc = 0;      /* px/s² */
  var floorY = 300;
  var wallX   = 600;
  var hitWall = false;
  var hitWallTimer = 0;
  var WALL_BOUNCE_TIMER = 30;

  /* Trails / momentum viz */
  var velHistory = [];
  var timeElapsed = 0;

  function pxPerMetre() { return W * 0.06; }

  function netForce() {
    if (!applyingForce && Math.abs(vel) < 0.5) return 0;
    var applied = applyingForce ? forceN : 0;
    var friction = FRICTION_COEFF[frictionLevel] * massKg * 9.8;
    /* Friction opposes velocity */
    var fDir = vel > 0 ? -1 : (vel < 0 ? 1 : 0);
    if (Math.abs(vel) < 0.5 && !applyingForce) return 0;
    return applied + fDir * friction;
  }

  function initBlock() {
    blockX = W * 0.15;
    blockY = floorY - blockH;
    vel = 0;
    acc = 0;
    hitWall = false;
    hitWallTimer = 0;
    velHistory = [];
    timeElapsed = 0;
  }

  function drawBackground() {
    /* Sky gradient */
    var grad = ctx.createLinearGradient(0, 0, 0, floorY);
    grad.addColorStop(0, 'oklch(0.09 0.025 285)');
    grad.addColorStop(1, 'oklch(0.12 0.03 260)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, floorY);

    /* Floor */
    ctx.fillStyle = 'oklch(0.18 0.04 240)';
    ctx.fillRect(0, floorY, W, H - floorY);

    /* Floor texture lines */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.25 0.04 240)';
    ctx.lineWidth = 1;
    for (var tx = 0; tx < W; tx += 30) {
      ctx.beginPath();
      ctx.moveTo(tx, floorY);
      ctx.lineTo(tx + 15, H);
      ctx.stroke();
    }
    ctx.restore();

    /* Wall on the right */
    ctx.save();
    ctx.fillStyle = 'oklch(0.22 0.04 285)';
    ctx.fillRect(wallX, floorY - 160, 20, 160);
    /* Brick pattern */
    ctx.strokeStyle = 'oklch(0.30 0.04 285)';
    ctx.lineWidth = 1;
    for (var wy = floorY - 160; wy < floorY; wy += 20) {
      ctx.beginPath();
      ctx.moveTo(wallX, wy); ctx.lineTo(wallX + 20, wy);
      ctx.stroke();
    }
    ctx.restore();

    /* Wall label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.45 0.04 285)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Wall', wallX + 10, floorY + 4);
    ctx.restore();
  }

  function drawBlock() {
    var bx = Math.round(blockX);
    var by = Math.round(blockY);

    /* Shadow */
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(bx + blockW/2, floorY + 2, blockW * 0.45, 5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    /* Block body */
    ctx.save();
    var grad = ctx.createLinearGradient(bx, by, bx, by + blockH);
    grad.addColorStop(0, 'oklch(0.60 0.12 240)');
    grad.addColorStop(1, 'oklch(0.35 0.08 240)');
    ctx.fillStyle = 'oklch(0.50 0.10 240)';
    ctx.strokeStyle = 'oklch(0.70 0.12 240)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, blockW, blockH, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    /* Mass label */
    ctx.save();
    ctx.font = 'bold 13px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.92 0.01 90)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(massKg + ' kg', bx + blockW/2, by + blockH/2);
    ctx.restore();

    /* Force arrow */
    if (applyingForce && forceN > 0) {
      var arrowLen = Math.min(forceN * 3, 80);
      drawArrow(bx - 8, by + blockH/2, bx - 8 - arrowLen, by + blockH/2,
        'oklch(0.80 0.17 82)', forceN + ' N');
    }

    /* Velocity arrow */
    if (Math.abs(vel) > 2) {
      var vDir = vel > 0 ? 1 : -1;
      var vLen = Math.min(Math.abs(vel) * 0.3, 60);
      drawArrow(
        bx + blockW/2, by - 8,
        bx + blockW/2 + vDir * vLen, by - 8,
        'oklch(0.72 0.15 145)', vel > 0 ? '→' : '←'
      );
    }

    /* Reaction force when hitting wall */
    if (hitWall && hitWallTimer > 0) {
      var reactLen = 50;
      drawArrow(wallX, by + blockH/2 - 10, wallX - reactLen, by + blockH/2 - 10,
        'oklch(0.68 0.22 20)', '← Reaction (3rd Law)');
    }
  }

  function drawArrow(x1, y1, x2, y2, color, label) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx*dx + dy*dy);
    if (len < 4) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    var angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 10*Math.cos(angle-0.4), y2 - 10*Math.sin(angle-0.4));
    ctx.lineTo(x2 - 10*Math.cos(angle+0.4), y2 - 10*Math.sin(angle+0.4));
    ctx.closePath();
    ctx.fill();
    if (label) {
      ctx.font = '10px "DM Sans", system-ui, sans-serif';
      ctx.textAlign = dx < 0 ? 'right' : 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, (x1+x2)/2, Math.min(y1, y2) - 3);
    }
    ctx.restore();
  }

  function drawInfoPanel() {
    var F = netForce();
    var a = F / massKg;
    var infoX = W * 0.60, infoY = 16;
    var infoW = W * 0.36;

    ctx.save();
    ctx.fillStyle = 'oklch(0.12 0.03 285 / 0.88)';
    ctx.beginPath();
    ctx.roundRect(infoX, infoY, infoW, 110, 8);
    ctx.fill();

    ctx.font = '700 11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.72 0.15 145)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('F = m × a', infoX + 10, infoY + 10);

    ctx.font = '12px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.70 0.04 285)';
    ctx.fillText('F_net = ' + F.toFixed(1) + ' N', infoX + 10, infoY + 30);
    ctx.fillText('m = ' + massKg + ' kg', infoX + 10, infoY + 48);
    ctx.fillStyle = 'oklch(0.80 0.17 82)';
    ctx.font = '700 12px "DM Sans", system-ui, sans-serif';
    ctx.fillText('a = ' + a.toFixed(2) + ' m/s²', infoX + 10, infoY + 66);
    ctx.fillStyle = 'oklch(0.70 0.04 285)';
    ctx.font = '12px "DM Sans", system-ui, sans-serif';
    ctx.fillText('v = ' + (vel / pxPerMetre()).toFixed(1) + ' m/s', infoX + 10, infoY + 86);
    ctx.restore();

    /* Velocity graph strip */
    if (velHistory.length > 3) {
      var gx = 10, gy = 16, gw = Math.min(W * 0.35, 200), gh = 50;
      ctx.save();
      ctx.fillStyle = 'oklch(0.12 0.03 285 / 0.88)';
      ctx.beginPath();
      ctx.roundRect(gx, gy, gw, gh + 20, 8);
      ctx.fill();
      ctx.font = '9px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'oklch(0.45 0.04 285)';
      ctx.textAlign = 'left';
      ctx.fillText('Velocity over time', gx + 4, gy + 4);

      var maxV = Math.max(...velHistory.map(Math.abs), 1);
      ctx.strokeStyle = 'oklch(0.72 0.15 145)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (var i = 0; i < velHistory.length; i++) {
        var px2 = gx + (i / velHistory.length) * gw;
        var py2 = gy + 14 + gh/2 - (velHistory[i] / maxV) * (gh/2 - 4);
        if (i === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
      }
      ctx.stroke();

      /* zero line */
      ctx.strokeStyle = 'oklch(0.30 0.03 285)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(gx, gy + 14 + gh/2);
      ctx.lineTo(gx + gw, gy + 14 + gh/2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function draw() {
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawBlock();
    drawInfoPanel();
  }

  /* ── SimAPI ─────────────────────────────────────────────── */
  function start() {
    if (!applyingForce) {
      applyingForce = true;
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.textContent = '⏸ Release Force'; btn.dataset.state = 'playing'; }
      var s = document.getElementById('sim-status');
      if (s) s.textContent = 'Force applied! Watch acceleration, then release to see inertia.';
    } else {
      applyingForce = false;
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.textContent = '▶ Apply Force'; btn.dataset.state = 'paused'; }
      var s = document.getElementById('sim-status');
      if (s) s.textContent = 'Force released. Block keeps moving — that\'s the 1st Law!';
    }
    if (!running) {
      running = true;
      lastTs = null;
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) dot.classList.add('is-running');
      rafId = requestAnimationFrame(loop);
    }
  }

  function pause() {
    applyingForce = false;
    running = false;
    cancelAnimationFrame(rafId);
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '▶ Apply Force'; btn.dataset.state = 'paused'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.remove('is-running');
  }

  function reset() {
    pause();
    initBlock();
    draw();
    var s = document.getElementById('sim-status');
    if (s) s.textContent = 'Set force and mass, then apply. Watch F = ma in action.';
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
    timeElapsed += dt;

    var F = netForce();
    acc = F / massKg;
    vel += acc * pxPerMetre() * dt;
    blockX += vel * dt;

    /* Wall collision */
    if (blockX + blockW >= wallX) {
      blockX = wallX - blockW;
      vel = -vel * 0.5;
      hitWall = true;
      hitWallTimer = WALL_BOUNCE_TIMER;
    }

    /* Left boundary */
    if (blockX < 0) { blockX = 0; vel = Math.abs(vel) * 0.5; }

    /* Friction brings to halt */
    if (!applyingForce) {
      var friction = FRICTION_COEFF[frictionLevel] * massKg * 9.8 * pxPerMetre();
      if (vel > 0) { vel -= friction * dt; if (vel < 0) vel = 0; }
      if (vel < 0) { vel += friction * dt; if (vel > 0) vel = 0; }
    }

    if (hitWallTimer > 0) hitWallTimer--;
    else hitWall = false;

    velHistory.push(vel / pxPerMetre());
    if (velHistory.length > 200) velHistory.shift();

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
      H = Math.max(380, Math.round(rect.height || 380));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      floorY = H * 0.72;
      wallX  = W * 0.82;
      initBlock();
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    var fSlider = document.getElementById('force-slider');
    var fVal    = document.getElementById('force-val');
    if (fSlider) fSlider.addEventListener('input', function () {
      forceN = parseInt(this.value, 10);
      if (fVal) fVal.textContent = forceN + ' N';
    });

    var mSlider = document.getElementById('mass-slider-n');
    var mVal    = document.getElementById('mass-val-n');
    if (mSlider) mSlider.addEventListener('input', function () {
      massKg = parseInt(this.value, 10);
      if (mVal) mVal.textContent = massKg + ' kg';
      if (!running) draw();
    });

    var frSlider = document.getElementById('friction-slider');
    var frVal    = document.getElementById('friction-val');
    if (frSlider) frSlider.addEventListener('input', function () {
      frictionLevel = parseInt(this.value, 10);
      if (frVal) frVal.textContent = FRICTION_LABELS[frictionLevel];
    });

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}());
