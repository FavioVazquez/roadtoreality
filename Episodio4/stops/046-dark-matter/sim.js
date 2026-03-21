/* sim.js — 046 Dark Matter: galaxy rotation curves — teaser */
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
  var COLOR = '#c87050';

  var ox = W * 0.1, oy = H * 0.82, gW = W * 0.82, gH = H * 0.66;

  function keplerV(r) { return r > 0.02 ? 0.5 / Math.sqrt(r + 0.08) : 0; }
  function flatV(r) { return r > 0.02 ? 0.32 : 0; }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.05)';
    ctx.fillRect(0, 0, W, H);

    /* Axes */
    ctx.strokeStyle = 'rgba(200,112,80,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy - gH); ctx.lineTo(ox, oy); ctx.lineTo(ox + gW, oy);
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,112,80,0.6)';
    ctx.font = '11px monospace';
    ctx.fillText('distance from center →', ox + gW * 0.5, oy + 14);
    ctx.fillText('velocity', ox - 8, oy - gH + 12);

    /* Dark matter halo region */
    var r0 = 0.3, r1 = 1.0;
    var x0 = ox + r0 * gW, x1 = ox + r1 * gW;
    ctx.fillStyle = 'rgba(200,112,80,0.08)';
    ctx.fillRect(x0, oy - gH, x1 - x0, gH);
    ctx.fillStyle = 'rgba(200,112,80,0.4)';
    ctx.font = '10px monospace';
    ctx.fillText('dark matter halo', x0 + 4, oy - gH + 14);

    /* Keplerian drop-off (dashed) */
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var r = i / 100;
      var v = keplerV(r);
      var x = ox + r * gW;
      var y = oy - v * gH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255,200,80,0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,200,80,0.7)';
    ctx.font = '10px monospace';
    ctx.fillText('expected (visible mass)', ox + gW * 0.55, oy - keplerV(0.55) * gH - 8);

    /* Flat observed curve */
    var pulse = 0.8 + 0.2 * Math.sin(t * 2);
    ctx.beginPath();
    for (var j = 0; j <= 100; j++) {
      var r2 = j / 100;
      var v2 = flatV(r2);
      var x2 = ox + r2 * gW;
      var y2 = oy - v2 * gH;
      if (j === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
    }
    ctx.strokeStyle = 'rgba(200,112,80,' + pulse + ')';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,112,80,0.8)';
    ctx.font = '10px monospace';
    ctx.fillText('observed (flat!)', ox + gW * 0.7, oy - flatV(0.7) * gH - 8);

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
