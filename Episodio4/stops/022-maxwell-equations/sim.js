/* sim.js — 022 Maxwell: animated EM plane wave — teaser */
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
  var AMP = H * 0.22;
  var LAMBDA = W * 0.45;

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Propagation axis */
    ctx.strokeStyle = 'rgba(82,133,200,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.05, cy);
    ctx.lineTo(W * 0.95, cy);
    ctx.stroke();
    ctx.fillStyle = 'rgba(82,133,200,0.5)';
    ctx.font = '11px monospace';
    ctx.fillText('→ c', W * 0.9, cy - 8);

    /* E field (vertical, blue) */
    ctx.strokeStyle = 'rgba(82,133,200,0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var x = W * 0.05; x <= W * 0.95; x += 2) {
      var phase = (x / LAMBDA) * Math.PI * 2 - t * 3;
      var y = cy - AMP * Math.sin(phase);
      if (x === W * 0.05) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(82,133,200,0.8)';
    ctx.font = '12px monospace';
    ctx.fillText('E', W * 0.05, cy - AMP - 8);

    /* B field (horizontal, using vertical displacement in "B plane" offset) */
    /* Draw as a narrower wave at 90 degrees, represented as red sine on offset axis */
    ctx.save();
    ctx.translate(0, 0);
    ctx.strokeStyle = 'rgba(200,82,82,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var x2 = W * 0.05; x2 <= W * 0.95; x2 += 2) {
      var ph2 = (x2 / LAMBDA) * Math.PI * 2 - t * 3;
      var bAmp = AMP * 0.55;
      /* Offset B wave diagonally to suggest 3D */
      var bY = cy + bAmp * Math.sin(ph2) * 0.5;
      var bX = x2 + bAmp * Math.cos(ph2) * 0.45;
      if (x2 === W * 0.05) ctx.moveTo(bX, bY);
      else ctx.lineTo(bX, bY);
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(200,82,82,0.75)';
    ctx.font = '12px monospace';
    ctx.fillText('B', W * 0.05, cy + AMP * 0.5 + 20);

    ctx.fillStyle = 'rgba(82,133,200,0.5)';
    ctx.font = '11px monospace';
    ctx.fillText('E ⊥ B ⊥ c', W * 0.55, H * 0.1);

    t += 0.025;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = 0; drawFrame(); }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
