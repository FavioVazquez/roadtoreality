/* sim.js — 034 General Relativity: spacetime grid curved by mass — teaser */
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

  var cx = W / 2, cy = H / 2;
  var GRID = 9;
  var MASS_R = 26;

  function deform(gx, gy) {
    var dx = gx - cx, dy = gy - cy;
    var d2 = dx * dx + dy * dy;
    var pull = 2400 / (d2 + 200);
    return { x: gx - dx * pull / (Math.sqrt(d2) + 1), y: gy - dy * pull / (Math.sqrt(d2) + 1) };
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(160,92,200,0.05)';
    ctx.fillRect(0, 0, W, H);

    var margin = 30;
    var cellW = (W - margin * 2) / (GRID - 1);
    var cellH = (H - margin * 2) / (GRID - 1);

    /* Grid lines */
    ctx.strokeStyle = 'rgba(160,92,200,0.35)';
    ctx.lineWidth = 1;

    /* Horizontal lines */
    for (var row = 0; row < GRID; row++) {
      ctx.beginPath();
      for (var col = 0; col < GRID; col++) {
        var gx = margin + col * cellW;
        var gy = margin + row * cellH;
        var d = deform(gx, gy);
        if (col === 0) ctx.moveTo(d.x, d.y); else ctx.lineTo(d.x, d.y);
      }
      ctx.stroke();
    }
    /* Vertical lines */
    for (var col2 = 0; col2 < GRID; col2++) {
      ctx.beginPath();
      for (var row2 = 0; row2 < GRID; row2++) {
        var gx2 = margin + col2 * cellW;
        var gy2 = margin + row2 * cellH;
        var d2 = deform(gx2, gy2);
        if (row2 === 0) ctx.moveTo(d2.x, d2.y); else ctx.lineTo(d2.x, d2.y);
      }
      ctx.stroke();
    }

    /* Central mass */
    ctx.beginPath();
    ctx.arc(cx, cy, MASS_R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(50,30,80,0.9)';
    ctx.fill();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Orbiting test mass */
    var orbitR = 80;
    var ox = cx + Math.cos(t * 0.6) * orbitR;
    var oy = cy + Math.sin(t * 0.6) * orbitR * 0.55;
    ctx.beginPath();
    ctx.arc(ox, oy, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,80,0.9)';
    ctx.fill();

    ctx.fillStyle = 'rgba(160,92,200,0.5)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Gμν = 8πG/c⁴ Tμν', W / 2, H * 0.08);
    ctx.textAlign = 'left';

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
