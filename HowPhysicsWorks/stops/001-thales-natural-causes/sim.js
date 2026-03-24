/* ============================================================
   sim.js — Stop 001: Thales and Natural Causes
   Event: Earthquake. Thales said Earth floats on water;
   earthquakes are water waves — not Poseidon.
   Play auto-sweeps perspective so contrast is self-evident.
   Slider manual override also works.
   ============================================================ */
(function () {
  'use strict';

  /* perspective: 0 = fully supernatural, 100 = fully natural */
  var perspective = 0;
  var sweepDir    = 1;   /* +1 = sweeping toward natural, -1 = back */
  var SWEEP_SPEED = 0.4; /* perspective units per frame */

  var canvas, ctx, W, H;
  var animT    = 0;
  var rafId    = null;
  var running  = false;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var waveT    = 0;  /* wave animation phase */
  var shakeT   = 0;  /* shake offset for supernatural */
  var shakeAmp = 0;

  /* ── Supernatural panel: Poseidon strikes the ground ────── */
  function drawSupernaturalPanel(x, y, w, h, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;

    /* Deep crimson/purple background */
    ctx.fillStyle = 'oklch(0.10 0.04 310)';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = 'oklch(0.68 0.22 310 / 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = 'oklch(0.68 0.22 310)';
    ctx.font = '600 10px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('THE OLD ANSWER', x + w / 2, y + 10);

    /* Poseidon figure with trident — shakes when running */
    var cx  = x + w / 2 + shakeAmp;
    var figY = y + h * 0.62;
    ctx.strokeStyle = 'oklch(0.80 0.10 310)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    /* Head */
    ctx.beginPath(); ctx.arc(cx, figY - 78, 13, 0, Math.PI * 2); ctx.stroke();
    /* Body */
    ctx.beginPath(); ctx.moveTo(cx, figY - 65); ctx.lineTo(cx, figY - 18); ctx.stroke();
    /* Legs */
    ctx.beginPath(); ctx.moveTo(cx, figY - 18); ctx.lineTo(cx - 14, figY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, figY - 18); ctx.lineTo(cx + 14, figY); ctx.stroke();
    /* Arm up holding trident */
    ctx.beginPath(); ctx.moveTo(cx, figY - 52); ctx.lineTo(cx + 22, figY - 72); ctx.stroke();
    /* Arm low */
    ctx.beginPath(); ctx.moveTo(cx, figY - 52); ctx.lineTo(cx - 18, figY - 38); ctx.stroke();

    /* Trident */
    var tx = cx + 22, ty = figY - 72;
    ctx.strokeStyle = 'oklch(0.75 0.18 310)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty + 44); ctx.stroke();
    /* Three prongs */
    ctx.beginPath();
    ctx.moveTo(tx - 8, ty + 10); ctx.lineTo(tx - 8, ty);
    ctx.moveTo(tx,     ty + 6);  ctx.lineTo(tx,     ty - 8);
    ctx.moveTo(tx + 8, ty + 10); ctx.lineTo(tx + 8, ty);
    ctx.stroke();

    /* Ground crack lines radiating from feet */
    var gx = x + w / 2 + shakeAmp, gy = y + h * 0.68;
    ctx.strokeStyle = 'oklch(0.55 0.18 310 / 0.8)';
    ctx.lineWidth = 1.5;
    for (var i = 0; i < 5; i++) {
      var angle = (Math.PI * 0.6) + i * (Math.PI * 0.2);
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + Math.cos(angle) * 36, gy + Math.sin(angle) * 18);
      ctx.stroke();
    }

    ctx.fillStyle  = 'oklch(0.62 0.10 310)';
    ctx.font       = '12px "DM Sans", system-ui, sans-serif';
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('"Poseidon strikes the ground."', x + w / 2, y + h - 50);
    ctx.fillText('His wrath shakes the world.', x + w / 2, y + h - 32);
    ctx.fillStyle = 'oklch(0.60 0.18 310)';
    ctx.font = 'bold 11px "DM Sans", sans-serif';
    ctx.fillText('✗  no prediction possible', x + w / 2, y + h - 14);

    ctx.restore();
  }

  /* ── Natural panel: Earth floating on water (Thales) ────── */
  function drawNaturalPanel(x, y, w, h, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'oklch(0.08 0.03 220)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'oklch(0.62 0.18 220 / 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = 'oklch(0.62 0.18 220)';
    ctx.font = '600 10px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('THALES\u2019 ANSWER', x + w / 2, y + 10);

    var cx  = x + w / 2;
    var waterY = y + h * 0.58;
    var earthR = Math.min(w, h) * 0.20;

    /* Water surface — animated waves */
    ctx.strokeStyle = 'oklch(0.55 0.16 220)';
    ctx.lineWidth = 1.5;
    for (var row = 0; row < 4; row++) {
      var wy = waterY + row * 14;
      ctx.beginPath();
      for (var wx = x + 6; wx < x + w - 6; wx += 2) {
        var wamp = 3 + row;
        var wy2 = wy + wamp * Math.sin((wx - x) * 0.12 + waveT + row * 0.8);
        if (wx === x + 6) ctx.moveTo(wx, wy2); else ctx.lineTo(wx, wy2);
      }
      ctx.stroke();
    }

    /* Earth disk floating on water */
    var earthY = waterY - earthR * 0.6;
    /* Earth fill */
    ctx.fillStyle = 'oklch(0.35 0.08 145)';
    ctx.beginPath(); ctx.ellipse(cx, earthY, earthR, earthR * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    /* Earth top highlight */
    ctx.fillStyle = 'oklch(0.50 0.10 145)';
    ctx.beginPath(); ctx.ellipse(cx, earthY - 3, earthR * 0.7, earthR * 0.18, 0, Math.PI, Math.PI * 2); ctx.fill();
    /* Earth label */
    ctx.fillStyle = 'oklch(0.85 0.04 90)';
    ctx.font = 'bold 10px "DM Sans", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('EARTH', cx, earthY);

    /* Ripple lines from Earth edges into water */
    ctx.strokeStyle = 'oklch(0.62 0.18 220 / 0.5)';
    ctx.lineWidth = 1;
    for (var s = 1; s <= 3; s++) {
      var rScale = 1 + s * 0.28 + (waveT * 0.015) % 0.28;
      ctx.beginPath();
      ctx.ellipse(cx, earthY, earthR * rScale, earthR * 0.38 * rScale * 0.6, 0, 0, Math.PI);
      ctx.stroke();
    }

    /* Tiny person on top for scale */
    var px = cx + earthR * 0.3, py = earthY - earthR * 0.38 - 2;
    ctx.strokeStyle = 'oklch(0.85 0.04 90)';
    ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(px, py - 5, 3, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px, py - 2); ctx.lineTo(px, py + 6);
    ctx.moveTo(px, py + 2); ctx.lineTo(px - 4, py + 5);
    ctx.moveTo(px, py + 2); ctx.lineTo(px + 4, py + 5);
    ctx.stroke();

    ctx.fillStyle  = 'oklch(0.50 0.12 220)';
    ctx.font       = '12px "DM Sans", system-ui, sans-serif';
    ctx.textAlign  = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Earth floats on water.', x + w / 2, y + h - 50);
    ctx.fillText('Quakes are waves — testable!', x + w / 2, y + h - 32);
    ctx.fillStyle = 'oklch(0.72 0.15 145)';
    ctx.font = 'bold 11px "DM Sans", sans-serif';
    ctx.fillText('✓  leads to a prediction', x + w / 2, y + h - 14);

    ctx.restore();
  }

  /* ── Main draw ──────────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    var gap    = 12;
    var panelW = Math.floor((W - gap * 3) / 2);
    var panelH = H - 16;
    var leftX  = gap;
    var rightX = gap * 2 + panelW;
    var panelY = 8;

    /* perspective 0→100: supernatural fades out, natural fades in */
    /* Wide contrast: active=1.0, inactive=0.08 so difference is unmistakable */
    var t      = perspective / 100;
    var natA   = 0.08 + t * 0.92;
    var superA = 0.08 + (1 - t) * 0.92;

    drawSupernaturalPanel(leftX,  panelY, panelW, panelH, superA);
    drawNaturalPanel     (rightX, panelY, panelW, panelH, natA);

    /* Arrow pointing to dominant side */
    var midX = W / 2;
    var midY = H / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (perspective < 40) {
      /* Arrow pointing left */
      ctx.fillStyle = 'oklch(0.68 0.22 310)';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('◄', midX, midY - 12);
      ctx.font = '10px "DM Sans", sans-serif';
      ctx.fillStyle = 'oklch(0.68 0.22 310)';
      ctx.fillText('SUPERNATURAL', midX, midY + 10);
    } else if (perspective > 60) {
      /* Arrow pointing right */
      ctx.fillStyle = 'oklch(0.65 0.20 240)';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('►', midX, midY - 12);
      ctx.font = '10px "DM Sans", sans-serif';
      ctx.fillStyle = 'oklch(0.65 0.20 240)';
      ctx.fillText('NATURAL', midX, midY + 10);
    } else {
      ctx.fillStyle = 'oklch(0.45 0.02 90)';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('VS', midX, midY - 8);
      ctx.font = '9px "DM Sans", sans-serif';
      ctx.fillStyle = 'oklch(0.40 0.02 90)';
      ctx.fillText('drag slider', midX, midY + 8);
    }
    ctx.restore();

    /* Advance animation */
    if (running) {
      animT++;
      waveT += 0.06;

      /* Auto-sweep perspective back and forth */
      perspective += sweepDir * SWEEP_SPEED;
      if (perspective >= 100) { perspective = 100; sweepDir = -1; }
      if (perspective <= 0)   { perspective = 0;   sweepDir =  1; }

      /* Sync slider position to sweep */
      var sl = document.getElementById('perspective-slider');
      if (sl) sl.value = Math.round(perspective);
      var lbl = document.getElementById('perspective-label');
      if (lbl) lbl.textContent = Math.round(perspective);

      /* Shake supernatural figure when on that side */
      shakeAmp = perspective < 30 ? Math.sin(animT * 0.4) * 3 : 0;
    }
  }

  /* ── SimAPI ─────────────────────────────────────────────── */
  function start() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  function reset() {
    pause();
    animT = 0; waveT = 0; shakeAmp = 0;
    perspective = 0; sweepDir = 1;
    var sl = document.getElementById('perspective-slider');
    if (sl) sl.value = 0;
    var lbl = document.getElementById('perspective-label');
    if (lbl) lbl.textContent = '0';
    draw();
  }

  function destroy() {
    pause();
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  /* ── Loop ─────────────────────────────────────────────────── */
  function loop() {
    if (!running) return;
    draw();
    rafId = requestAnimationFrame(loop);
  }

  /* ── Setup ────────────────────────────────────────────────── */
  function setup() {
    var mount = document.getElementById('sim-mount');
    if (!mount) return;

    canvas = document.createElement('canvas');
    canvas.style.width  = '100%';
    canvas.style.height = '100%';
    mount.appendChild(canvas);
    ctx = canvas.getContext('2d');

    function resize() {
      var rect = mount.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      W = Math.round(rect.width);
      H = Math.max(340, Math.round(rect.height || 360));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    /* Slider wiring — perspective dial */
    var sl = document.getElementById('perspective-slider');
    var lbl = document.getElementById('perspective-label');
    if (sl) {
      sl.addEventListener('input', function () {
        perspective = parseInt(this.value, 10);
        if (lbl) lbl.textContent = perspective;
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
