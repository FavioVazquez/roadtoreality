/* ============================================================
   sim.js — Stop 009: Galileo's Inclined Plane
   Ball rolls down a tilted plane. Shows distance ∝ t² graph.
   Physics: a = g·sin(θ), integrated with Euler.
   ============================================================ */
(function () {
  'use strict';

  var G = 9.8;
  var canvas, ctx, W, H;
  var running = false;
  var rafId = null;
  var angleDeg = 20;
  var mass = 1;
  var dropped = false;
  var elapsed = 0;
  var lastTs = null;

  /* Ball state along the incline */
  var ballPos = 0; /* metres along the slope */
  var ballVel = 0;
  var planeLen; /* pixels */
  var ballR = 16;
  var timeHistory = [];
  var distHistory = [];

  function acceleration() {
    return G * Math.sin(angleDeg * Math.PI / 180);
  }

  function planeLengthMetres() {
    return 3.0; /* fixed 3m plane length */
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'oklch(0.09 0.025 285)';
    ctx.fillRect(0, 0, W, H);

    var cx = W * 0.12;
    var baseY = H * 0.80;
    var angleRad = angleDeg * Math.PI / 180;
    var pxPerMetre = (W * 0.72) / planeLengthMetres() * Math.cos(angleRad);
    planeLen = planeLengthMetres() * pxPerMetre / Math.cos(angleRad);

    /* Top of incline */
    var topX = cx;
    var topY = baseY - planeLen * Math.sin(angleRad);

    /* Bottom of incline (right side) */
    var bottomX = cx + planeLen * Math.cos(angleRad);
    var bottomY = baseY;

    /* ── Ground ── */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.35 0.05 60)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(W * 0.90, baseY);
    ctx.stroke();
    ctx.restore();

    /* ── Inclined plane ── */
    ctx.save();
    ctx.fillStyle = 'oklch(0.20 0.04 285)';
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(bottomX, bottomY);
    ctx.lineTo(cx, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'oklch(0.50 0.10 200)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(bottomX, bottomY);
    ctx.stroke();
    ctx.restore();

    /* Angle arc */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.72 0.15 145)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bottomX, bottomY, 30, Math.PI, Math.PI + angleRad, false);
    ctx.stroke();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.72 0.15 145)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(angleDeg + '°', bottomX - 44, bottomY - 20);
    ctx.restore();

    /* ── Ball ── */
    var progress = Math.min(ballPos / planeLengthMetres(), 1);
    var bx = cx + progress * planeLen * Math.cos(angleRad);
    var by = topY + progress * planeLen * Math.sin(angleRad);

    ctx.save();
    ctx.shadowColor = 'oklch(0.72 0.12 60)';
    ctx.shadowBlur = 14;
    var ballGrad = ctx.createRadialGradient(bx - ballR*0.3, by - ballR*0.3, 2, bx, by, ballR);
    ballGrad.addColorStop(0, 'oklch(0.90 0.05 60)');
    ballGrad.addColorStop(0.5, 'oklch(0.72 0.12 60)');
    ballGrad.addColorStop(1, 'oklch(0.40 0.08 60)');
    ctx.beginPath();
    ctx.arc(Math.round(bx), Math.round(by), ballR, 0, Math.PI * 2);
    ctx.fillStyle = 'oklch(0.72 0.12 60)';
    ctx.fill();
    ctx.shadowBlur = 0;

    /* Mass label */
    ctx.fillStyle = 'oklch(0.92 0.01 90)';
    ctx.font = 'bold 10px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mass + 'kg', bx, by);
    ctx.restore();

    /* ── Distance markers on slope ── */
    ctx.save();
    for (var m = 0; m <= planeLengthMetres(); m++) {
      var mpx = cx + (m / planeLengthMetres()) * planeLen * Math.cos(angleRad);
      var mpy = topY + (m / planeLengthMetres()) * planeLen * Math.sin(angleRad);
      ctx.beginPath();
      ctx.arc(mpx, mpy, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'oklch(0.50 0.05 200)';
      ctx.fill();
      ctx.font = '9px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'oklch(0.50 0.05 200)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(m + 'm', mpx, mpy - 4);
    }
    ctx.restore();

    /* ── Info panel ── */
    ctx.save();
    ctx.font = '12px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    var infoX = W * 0.62;
    var infoY = H * 0.12;

    ctx.fillStyle = 'oklch(0.50 0.04 285)';
    ctx.fillText('a = g·sin(' + angleDeg + '°) = ' + acceleration().toFixed(2) + ' m/s²', infoX, infoY);
    ctx.fillText('t = ' + elapsed.toFixed(2) + ' s', infoX, infoY + 20);
    ctx.fillText('d = ' + ballPos.toFixed(2) + ' m', infoX, infoY + 40);
    ctx.fillText('v = ' + ballVel.toFixed(2) + ' m/s', infoX, infoY + 60);

    /* d ∝ t² indicator */
    if (elapsed > 0.3) {
      var predicted = 0.5 * acceleration() * elapsed * elapsed;
      var ratio = Math.abs(ballPos - predicted) < 0.05 ? '✓' : '≈';
      ctx.fillStyle = 'oklch(0.72 0.15 145)';
      ctx.fillText(ratio + '  d = ½at² = ' + predicted.toFixed(2) + ' m', infoX, infoY + 88);
    }
    ctx.restore();

    /* ── Mini distance²/time graph — tucked below info panel ── */
    if (timeHistory.length > 3) {
      var gx = W * 0.62, gy = infoY + 108;
      var gw = Math.min(W * 0.30, 160), gh = 70;
      ctx.save();
      ctx.fillStyle = 'oklch(0.12 0.03 285 / 0.8)';
      ctx.beginPath();
      ctx.roundRect(gx - 4, gy - 20, gw + 8, gh + 30, 6);
      ctx.fill();

      ctx.font = '9px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'oklch(0.50 0.04 285)';
      ctx.textAlign = 'left';
      ctx.fillText('Distance vs Time²', gx, gy - 12);
      ctx.fillStyle = 'oklch(0.35 0.04 285)';
      ctx.fillText('straight line = uniform acceleration', gx, gy - 2);

      /* Axes */
      ctx.strokeStyle = 'oklch(0.30 0.03 285)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh);       /* y-axis */
      ctx.moveTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); /* x-axis */
      ctx.stroke();
      /* Axis labels */
      ctx.fillStyle = 'oklch(0.40 0.03 285)';
      ctx.textAlign = 'center';
      ctx.fillText('t²', gx + gw / 2, gy + gh + 10);
      ctx.textAlign = 'left';
      ctx.fillText('d', gx - 10, gy + 4);

      var maxT2 = timeHistory[timeHistory.length - 1] ** 2;
      var maxD  = distHistory[distHistory.length - 1] || 0.01;
      if (maxT2 > 0 && maxD > 0) {
        ctx.strokeStyle = 'oklch(0.72 0.15 145)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (var i = 0; i < timeHistory.length; i++) {
          var px = gx + (timeHistory[i] ** 2 / maxT2) * gw;
          var py = gy + gh - (distHistory[i] / maxD) * gh;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* ── SimAPI ─────────────────────────────────────────────── */
  function start() {
    if (!dropped) {
      dropped = true;
      ballPos = 0;
      ballVel = 0;
      elapsed = 0;
      timeHistory = [];
      distHistory = [];
    }
    if (running) return;
    running = true;
    lastTs = null;
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '⏸ Pause'; btn.dataset.state = 'playing'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.add('is-running');
    var s = document.getElementById('sim-status');
    if (s) s.textContent = 'Ball released! Watch the distance grow as t².';
    rafId = requestAnimationFrame(loop);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = dropped ? '▶ Resume' : '▶ Release!'; btn.dataset.state = 'paused'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.remove('is-running');
  }

  function reset() {
    pause();
    dropped = false;
    ballPos = 0;
    ballVel = 0;
    elapsed = 0;
    timeHistory = [];
    distHistory = [];
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '▶ Release!'; btn.dataset.state = 'paused'; }
    var s = document.getElementById('sim-status');
    if (s) s.textContent = 'Adjust angle and mass, then release the ball. Does mass matter?';
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

    elapsed += dt;
    var a = acceleration();
    ballVel += a * dt;
    ballPos += ballVel * dt;

    timeHistory.push(elapsed);
    distHistory.push(ballPos);
    if (timeHistory.length > 200) { timeHistory.shift(); distHistory.shift(); }

    if (ballPos >= planeLengthMetres()) {
      ballPos = planeLengthMetres();
      running = false;
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) dot.classList.remove('is-running');
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.textContent = '▶ Again'; btn.dataset.state = 'paused'; }
      dropped = false;
      var s = document.getElementById('sim-status');
      if (s) s.textContent = 'Reached the bottom in ' + elapsed.toFixed(2) + 's. Try a different mass — same time!';
    }

    draw();
    if (running) rafId = requestAnimationFrame(loop);
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
      if (!dropped) { ballPos = 0; ballVel = 0; }
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    var angleSlider = document.getElementById('angle-slider');
    var angleVal    = document.getElementById('angle-val');
    if (angleSlider) {
      angleSlider.addEventListener('input', function () {
        angleDeg = parseInt(this.value, 10);
        if (angleVal) angleVal.textContent = angleDeg + '°';
        if (!dropped) { ballPos = 0; ballVel = 0; draw(); }
      });
    }

    var massSlider = document.getElementById('mass-slider');
    var massVal    = document.getElementById('mass-val');
    if (massSlider) {
      massSlider.addEventListener('input', function () {
        mass = parseInt(this.value, 10);
        if (massVal) massVal.textContent = mass + ' kg';
        if (!dropped) draw();
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
