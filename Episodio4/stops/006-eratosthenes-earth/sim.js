/* ============================================================
   sim.js — Stop 006: Eratosthenes Measures the Earth
   Shows two sticks on a curved Earth with sunlight rays.
   Animates the angle measurement and circumference calculation.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H;
  var running = false;
  var rafId   = null;
  var animT   = 0;
  var distanceKm = 800;
  var showResult = false;

  /* The shadow angle is fixed by physics: 7.2° for Syene/Alexandria.
     We derive circumference from user's distance input. */
  var SHADOW_ANGLE_DEG = 7.2;

  function circumference() {
    return Math.round((360 / SHADOW_ANGLE_DEG) * distanceKm);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'oklch(0.08 0.02 240)';
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2;
    var cy = H * 0.62;
    var earthR = Math.min(W, H) * 0.28;

    /* ── Stars ── */
    ctx.save();
    ctx.fillStyle = 'oklch(0.85 0 0 / 0.6)';
    var starPositions = [[0.05,0.08],[0.12,0.18],[0.22,0.05],[0.78,0.10],[0.88,0.06],[0.95,0.20],[0.08,0.35],[0.92,0.35]];
    for (var s = 0; s < starPositions.length; s++) {
      ctx.beginPath();
      ctx.arc(W * starPositions[s][0], H * starPositions[s][1], 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    /* ── Sun (top-left) ── */
    var sunX = W * 0.12;
    var sunY = H * 0.10;
    ctx.save();
    ctx.shadowColor = 'oklch(0.90 0.20 82)';
    ctx.shadowBlur  = 30;
    ctx.fillStyle   = 'oklch(0.90 0.20 82)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    /* ── Earth ── */
    var earthGrad = ctx.createRadialGradient(cx - earthR*0.3, cy - earthR*0.3, earthR*0.1, cx, cy, earthR);
    earthGrad.addColorStop(0, 'oklch(0.45 0.20 145)');
    earthGrad.addColorStop(0.5,'oklch(0.35 0.15 230)');
    earthGrad.addColorStop(1,  'oklch(0.20 0.10 240)');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
    ctx.fillStyle = earthGrad;
    ctx.fill();
    /* Edge glow */
    ctx.strokeStyle = 'oklch(0.55 0.18 210 / 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    /* ── City positions on Earth ──
       Syene: ~23.5° N  → on a circle, place at top-ish
       Alexandria: ~31° N → slightly further north
       We'll place them both on the sunlit side */
    var syeneAngle = -Math.PI / 2 + 0.05;        /* near top */
    var alexAngle  = syeneAngle - (SHADOW_ANGLE_DEG * Math.PI / 180);

    var syeneX = cx + Math.cos(syeneAngle) * earthR;
    var syeneY = cy + Math.sin(syeneAngle) * earthR;
    var alexX  = cx + Math.cos(alexAngle)  * earthR;
    var alexY  = cy + Math.sin(alexAngle)  * earthR;

    /* Normal vectors (pointing away from Earth center) */
    var syeneNX = Math.cos(syeneAngle), syeneNY = Math.sin(syeneAngle);
    var alexNX  = Math.cos(alexAngle),  alexNY  = Math.sin(alexAngle);

    /* ── Sun rays (parallel) ── */
    var rayLen = 90;
    var rayDir = { x: syeneNX, y: syeneNY }; /* Syene: ray goes straight down */

    ctx.save();
    ctx.strokeStyle = 'oklch(0.88 0.18 82 / 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);

    /* Ray to Syene — goes straight to the surface */
    var syeneRayStartX = syeneX - rayDir.x * rayLen;
    var syeneRayStartY = syeneY - rayDir.y * rayLen;
    ctx.beginPath();
    ctx.moveTo(syeneRayStartX, syeneRayStartY);
    ctx.lineTo(syeneX, syeneY);
    ctx.stroke();

    /* Ray to Alexandria — same direction */
    var alexRayStartX = alexX - rayDir.x * rayLen;
    var alexRayStartY = alexY - rayDir.y * rayLen;
    ctx.beginPath();
    ctx.moveTo(alexRayStartX, alexRayStartY);
    ctx.lineTo(alexX, alexY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* ── Sticks ── */
    var stickLen = 24;

    /* Syene stick: aligned with normal → no shadow */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.80 0.12 60)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(syeneX, syeneY);
    ctx.lineTo(syeneX + syeneNX * stickLen, syeneY + syeneNY * stickLen);
    ctx.stroke();

    /* Syene shadow = 0 */
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.70 0.10 60)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Syene: 0° shadow', syeneX + syeneNX * 40, syeneY + syeneNY * 40);
    ctx.restore();

    /* Alexandria stick: perpendicular to surface normal */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.72 0.15 145)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(alexX, alexY);
    ctx.lineTo(alexX + alexNX * stickLen, alexY + alexNY * stickLen);
    ctx.stroke();

    /* Shadow line for Alexandria stick */
    var alexShadowAngle = alexAngle + Math.PI / 2; /* tangent direction */
    var shadowLen = stickLen * Math.tan(SHADOW_ANGLE_DEG * Math.PI / 180);
    ctx.strokeStyle = 'oklch(0.55 0.10 145 / 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(alexX, alexY);
    ctx.lineTo(alexX + Math.cos(alexShadowAngle) * shadowLen, alexY + Math.sin(alexShadowAngle) * shadowLen);
    ctx.stroke();

    /* Angle arc */
    ctx.strokeStyle = 'oklch(0.72 0.15 145)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(alexX, alexY, 14, alexAngle + Math.PI / 2, alexAngle + Math.PI / 2 + SHADOW_ANGLE_DEG * Math.PI / 180, false);
    ctx.stroke();

    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.72 0.15 145)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Alexandria: 7.2°', alexX + alexNX * 50, alexY + alexNY * 50);
    ctx.restore();

    /* ── Arc between cities ── */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.72 0.15 145 / 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, earthR + 8, alexAngle, syeneAngle, false);
    ctx.stroke();
    /* Label */
    var midAngle = (alexAngle + syeneAngle) / 2;
    ctx.fillStyle = 'oklch(0.80 0.10 145)';
    ctx.font = 'bold 11px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(distanceKm + ' km', cx + Math.cos(midAngle) * (earthR + 28), cy + Math.sin(midAngle) * (earthR + 28));
    ctx.restore();

    /* ── Angle at center ── */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.80 0.17 82 / 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, alexAngle, syeneAngle, false);
    ctx.stroke();
    ctx.fillStyle = 'oklch(0.80 0.17 82)';
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('7.2°', cx + Math.cos((alexAngle+syeneAngle)/2) * 42, cy + Math.sin((alexAngle+syeneAngle)/2) * 42);
    ctx.restore();

    /* ── Result panel ── */
    if (showResult) {
      var circ = circumference();
      var pctError = Math.abs(circ - 40075) / 40075 * 100;

      ctx.save();
      var panX = W * 0.55, panY = H * 0.05, panW = W * 0.40, panH = 100;
      ctx.fillStyle = 'oklch(0.12 0.03 285 / 0.92)';
      ctx.beginPath();
      ctx.roundRect(panX, panY, panW, panH, 10);
      ctx.fill();
      ctx.strokeStyle = 'oklch(0.72 0.15 145 / 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = 'oklch(0.72 0.15 145)';
      ctx.font = '700 11px "DM Sans", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Eratosthenes\' calculation:', panX + 12, panY + 10);

      ctx.fillStyle = 'oklch(0.90 0.01 90)';
      ctx.font = '12px "DM Sans", system-ui, sans-serif';
      ctx.fillText('360° ÷ 7.2° = 50', panX + 12, panY + 30);
      ctx.fillText('50 × ' + distanceKm + ' km = ' + circ.toLocaleString() + ' km', panX + 12, panY + 50);

      ctx.fillStyle = pctError < 5 ? 'oklch(0.72 0.15 145)' : 'oklch(0.80 0.17 82)';
      ctx.font = '700 12px "DM Sans", system-ui, sans-serif';
      ctx.fillText('Error: ' + pctError.toFixed(1) + '%  (actual: 40,075 km)', panX + 12, panY + 72);
      ctx.restore();
    }

    /* ── Animate call ── */
    if (running) {
      animT++;
      if (animT > 60 && !showResult) {
        showResult = true;
      }
    }
  }

  /* ── SimAPI ─────────────────────────────────────────────── */
  function start() {
    if (running) return;
    running = true;
    animT = 0;
    showResult = false;
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
    if (btn) { btn.textContent = '▶ Measure!'; btn.dataset.state = 'paused'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.remove('is-running');
  }

  function reset() {
    pause();
    animT = 0;
    showResult = false;
    draw();
  }

  function destroy() {
    pause();
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  function loop() {
    if (!running) return;
    draw();
    if (running && animT < 180) {
      rafId = requestAnimationFrame(loop);
    } else {
      running = false;
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) dot.classList.remove('is-running');
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.textContent = '▶ Measure!'; btn.dataset.state = 'paused'; }
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

    var slider = document.getElementById('distance-slider');
    var valEl  = document.getElementById('distance-val');
    if (slider) {
      slider.addEventListener('input', function () {
        distanceKm = parseInt(this.value, 10);
        if (valEl) valEl.textContent = distanceKm + ' km';
        draw(); /* always redraw so arc label updates */
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
