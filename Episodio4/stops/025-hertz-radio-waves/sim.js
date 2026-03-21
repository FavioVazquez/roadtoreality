/* sim.js — 025 Hertz: oscillating dipole antenna radiating wavefronts — teaser */
(function () {
  'use strict';
  var mount = document.getElementById('sim-mount');
  if (!mount) return;

  var canvas = document.createElement('canvas');
  canvas.width  = mount.clientWidth  || 600;
  canvas.height = mount.clientHeight || 360;
  canvas.style.display = 'block';
  canvas.style.width  = '100%';
  canvas.style.height = '100%';
  mount.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var W = canvas.width;
  var H = canvas.height;
  var raf = null;
  var t = 0;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLOR = '#5285c8';

  var cx = W / 2, cy = H / 2;
  var WAVE_SPEED = 1.8;
  var EMIT_INTERVAL = 22;
  var emitTimer = 0;
  var rings = [];

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    emitTimer++;
    if (emitTimer % EMIT_INTERVAL === 0) {
      rings.push({ r: 0, phase: Math.floor(emitTimer / EMIT_INTERVAL) % 2 });
    }
    rings.forEach(function(ring) { ring.r += WAVE_SPEED; });
    rings = rings.filter(function(ring) { return ring.r < Math.max(W, H); });

    rings.forEach(function(ring) {
      var alpha = Math.max(0, 0.7 - ring.r / (W * 0.6));
      var hue = ring.phase === 0 ? '200,100,100' : '82,133,200';
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(' + hue + ',' + alpha + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    /* Antenna */
    var dipoleLen = 30 + 10 * Math.sin(t * 4);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy - dipoleLen);
    ctx.lineTo(cx, cy + dipoleLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - dipoleLen, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,100,100,0.9)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + dipoleLen, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(82,133,200,0.9)';
    ctx.fill();

    ctx.fillStyle = 'rgba(82,133,200,0.6)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('oscillating dipole', cx, cy + dipoleLen + 20);
    ctx.textAlign = 'left';

    t += 0.025;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() {
    rings = [];
    for (var i = 1; i <= 4; i++) rings.push({ r: i * 45, phase: i % 2 });
    t = 0; drawFrame();
  }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); rings = []; t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
