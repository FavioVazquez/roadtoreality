/* sim.js — 037 Heisenberg: uncertainty bars — Δx·Δp ≥ ℏ/2 — teaser */
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
  var COLOR = '#a05cc8';

  function drawBar(x, y, w, h, label, value, color) {
    ctx.fillStyle = 'rgba(160,92,200,0.08)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, value, h);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = COLOR;
    ctx.font = '13px monospace';
    ctx.fillText(label, x, y - 8);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '11px monospace';
    ctx.fillText(Math.round(value / w * 100) + '%', x + value + 4, y + h / 2 + 4);
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(160,92,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    var BAR_X = W * 0.12, BAR_W = W * 0.72, BAR_H = 38;
    var oscil = 0.5 + 0.48 * Math.sin(t * 0.8);

    var dxFrac = oscil;
    var dpFrac = 1 - oscil + 0.02; /* product stays ~constant */

    drawBar(BAR_X, H * 0.28, BAR_W, BAR_H, 'Δx  (position uncertainty)', dxFrac * BAR_W, 'rgba(82,133,200,0.7)');
    drawBar(BAR_X, H * 0.55, BAR_W, BAR_H, 'Δp  (momentum uncertainty)', dpFrac * BAR_W, 'rgba(200,82,82,0.7)');

    /* Product */
    var product = dxFrac * dpFrac;
    ctx.fillStyle = 'rgba(255,220,80,0.8)';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Δx · Δp ≥ ℏ/2', W / 2, H * 0.78);
    ctx.fillStyle = 'rgba(160,92,200,0.5)';
    ctx.font = '11px monospace';
    ctx.fillText('product: ' + product.toFixed(2) + ' (const)', W / 2, H * 0.88);
    ctx.textAlign = 'left';

    /* Wave packet hint */
    var wcy = H * 0.13;
    ctx.beginPath();
    for (var x = BAR_X; x < BAR_X + BAR_W; x += 2) {
      var rel = (x - BAR_X) / BAR_W;
      var envelope = Math.exp(-Math.pow((rel - 0.5) / (dxFrac * 0.5 + 0.05), 2) * 3);
      var wave = envelope * Math.sin(rel * 60);
      var wy = wcy - wave * 18;
      if (x === BAR_X) ctx.moveTo(x, wy); else ctx.lineTo(x, wy);
    }
    ctx.strokeStyle = 'rgba(82,133,200,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    t += 0.016;
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
