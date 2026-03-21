/* sim.js — 023 Doppler: moving source with compressed/stretched wavefronts — teaser */
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

  var sourceV = W * 0.006; /* source velocity */
  var waveV   = W * 0.012; /* wave velocity */
  var source = { x: W * 0.1 };
  var waves = [];

  function emitWave() {
    waves.push({ cx: source.x, cy: H / 2, r: 0 });
  }
  var emitTimer = 0;

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Observers */
    ctx.fillStyle = 'rgba(82,133,200,0.8)';
    ctx.font = '22px sans-serif';
    ctx.fillText('👂', W * 0.04, H / 2 + 10);
    ctx.fillText('👂', W * 0.88, H / 2 + 10);
    ctx.font = '11px monospace';
    ctx.fillText('high f', W * 0.03, H / 2 - 20);
    ctx.fillText('low f', W * 0.87, H / 2 - 20);

    /* Move source */
    source.x += sourceV;
    if (source.x > W * 0.85) { source.x = W * 0.1; waves = []; }

    /* Emit waves */
    emitTimer++;
    if (emitTimer % 18 === 0) emitWave();

    /* Expand waves */
    waves.forEach(function(w) { w.r += waveV; });
    waves = waves.filter(function(w) { return w.r < W; });

    waves.forEach(function(w) {
      ctx.beginPath();
      ctx.arc(w.cx, w.cy, w.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(82,133,200,' + Math.max(0, 0.7 - w.r / W) + ')';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    /* Source */
    ctx.beginPath();
    ctx.arc(source.x, H / 2, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,80,0.9)';
    ctx.fill();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    t += 0.016;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() {
    source.x = W * 0.45;
    waves = [];
    for (var i = 0; i < 5; i++) {
      waves.push({ cx: W * 0.45 - i * 35, cy: H / 2, r: i * 35 });
    }
    t = 0;
    drawFrame();
    source.x = W * 0.1;
    waves = [];
  }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); source.x = W * 0.1; waves = []; t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
