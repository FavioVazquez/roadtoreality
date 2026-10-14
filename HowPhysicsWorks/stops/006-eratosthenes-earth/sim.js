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
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animT   = 0;
  var showResult = false;

  /* Syene is fixed (24.1 N, Sun overhead at the solstice). The slider moves the
     northern city; the shadow angle there is the latitude difference, and the
     distance is read off the true Earth (meridian circumference 40,008 km). */
  var SYENE_LAT = 24.1;
  var northLat  = 31.3; /* Alexandria is at about 31.2 N: 7.2 degrees north of Syene */
  var MERIDIAN_KM = 40008;

  function thetaDeg() { return northLat - SYENE_LAT; }
  function distanceKm() { return MERIDIAN_KM * thetaDeg() / 360; }
  function circumference() {
    var th = thetaDeg();
    return th < 0.3 ? 0 : Math.round((360 / th) * distanceKm());
  }

  function draw() {
    if (!(W > 0 && H > 0)) return; /* not laid out yet */
    ctx.clearRect(0, 0, W, H);
    var THETA = thetaDeg() * Math.PI / 180;
    ctx.fillStyle = 'oklch(0.08 0.02 240)';
    ctx.fillRect(0, 0, W, H);

    var narrow = W < 600;
    var cx = narrow ? W * 0.68 : W * 0.4;
    var cy = H * 0.64;
    var earthR = Math.max(10, Math.min(W, H) * 0.28);

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
    var syeneAngle = -Math.PI / 2;               /* top: the Sun is overhead */
    var alexAngle  = syeneAngle - THETA;         /* north = to the left */

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

    /* ── Sun: placed on the ray direction above Syene (rays drawn parallel) ── */
    var sunDist = Math.max(60, Math.min(260, syeneY - 34));
    var sunX = syeneX + rayDir.x * sunDist;
    var sunY = syeneY + rayDir.y * sunDist;
    ctx.save();
    ctx.shadowColor = 'oklch(0.90 0.20 82)';
    ctx.shadowBlur  = 30;
    ctx.fillStyle   = 'oklch(0.90 0.20 82)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'oklch(0.88 0.18 82 / 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sunX, sunY + 20);
    ctx.lineTo(syeneX, syeneY);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'oklch(0.88 0.18 82 / 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.lineDashOffset = -animT * 0.8; /* rays stream toward the Earth while running */

    /* Ray to Syene — goes straight to the surface */
    var syeneRayStartX = syeneX + rayDir.x * rayLen;
    var syeneRayStartY = syeneY + rayDir.y * rayLen;
    ctx.beginPath();
    ctx.moveTo(syeneRayStartX, syeneRayStartY);
    ctx.lineTo(syeneX, syeneY);
    ctx.stroke();

    /* Ray to Alexandria — same direction */
    var alexRayStartX = alexX + rayDir.x * rayLen;
    var alexRayStartY = alexY + rayDir.y * rayLen;
    ctx.beginPath();
    ctx.moveTo(alexRayStartX, alexRayStartY);
    ctx.lineTo(alexX, alexY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* ── Sticks ── */
    var stickLen = 40; /* drawn far larger than life so the shadow is visible */

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
    ctx.textAlign = 'left';
    ctx.fillText('Syene: no shadow', syeneX + 10, syeneY - stickLen * 0.5);
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
    var alexShadowAngle = alexAngle - Math.PI / 2; /* tangent, away from Syene: the noon shadow points north */
    var shadowLen = stickLen * Math.tan(THETA);
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
    /* angle between the stick and the Sun's rays (the rays run along the Syene vertical) */
    ctx.arc(alexX, alexY, 26, alexAngle, syeneAngle, false);
    ctx.stroke();
    /* ray through the top of the Alexandria stick, parallel to Syene's */
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(alexX, alexY);
    ctx.lineTo(alexX + Math.cos(syeneAngle) * (stickLen + 30), alexY + Math.sin(syeneAngle) * (stickLen + 30));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.72 0.15 145)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.fillText('Northern city: θ = ' + thetaDeg().toFixed(1) + '°', alexX - 12, alexY - stickLen * 0.7);
    ctx.fillText('tan θ = shadow ÷ stick = ' + Math.tan(THETA).toFixed(3), alexX - 12, alexY - stickLen * 0.7 + 14);
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
    ctx.fillText(Math.round(distanceKm()).toLocaleString() + ' km', cx + Math.cos(midAngle) * (earthR - 24), cy + Math.sin(midAngle) * (earthR - 24));
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
    ctx.fillText(thetaDeg().toFixed(1) + '°', cx + Math.cos((alexAngle+syeneAngle)/2) * 42, cy + Math.sin((alexAngle+syeneAngle)/2) * 42);
    ctx.restore();

    /* ── Result panel ── */
    if (showResult) {
      var circ = circumference();

      ctx.save();
      var panW = narrow ? 225 : 240, panH = 138;
      var panX = narrow ? 8 : W - panW - 16, panY = narrow ? H - panH - 8 : H * 0.08;
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
      var th = thetaDeg();
      if (circ === 0) {
        ctx.fillText('Same latitude: no angle,', panX + 12, panY + 30);
        ctx.fillText('nothing to divide.', panX + 12, panY + 48);
      } else {
        ctx.fillText('360° ÷ ' + th.toFixed(1) + '° = ' + (360 / th).toFixed(1), panX + 12, panY + 30);
        ctx.fillText((360 / th).toFixed(1) + ' × ' + Math.round(distanceKm()).toLocaleString() + ' km', panX + 12, panY + 48);
        ctx.fillText('= ' + circ.toLocaleString() + ' km', panX + 12, panY + 66);
      }
      ctx.fillStyle = 'oklch(0.80 0.17 82)';
      ctx.font = '11px "DM Sans", system-ui, sans-serif';
      ctx.fillText('Ancient inputs: 1/50 circle,', panX + 12, panY + 84);
      ctx.fillText('5,000 stadia = 250,000 stadia', panX + 12, panY + 98);
      ctx.fillStyle = 'oklch(0.72 0.15 145)';
      ctx.font = '700 11px "DM Sans", system-ui, sans-serif';
      ctx.fillText('(distance taken from the real Earth, so the', panX + 12, panY + 112);
      ctx.fillText('division must return its 40,008 km)', panX + 12, panY + 126);
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
    if (!reducedMotion) rafId = requestAnimationFrame(loop);
    else draw();
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
        northLat = parseFloat(this.value);
        if (valEl) valEl.textContent = northLat.toFixed(1) + '° N';
        draw(); /* always redraw so the shadow, arc and distance update */
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
