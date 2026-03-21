/* sim.js — 047 Dark Energy: two expansion timelines — teaser */
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

  var ox = W * 0.1, gW = W * 0.82;
  var topOY = H * 0.4, botOY = H * 0.82;
  var gH = H * 0.26;

  function drawPanel(oy, label, fn, color) {
    ctx.strokeStyle = 'rgba(200,112,80,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, oy - gH); ctx.lineTo(ox, oy); ctx.lineTo(ox + gW, oy);
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,112,80,0.5)';
    ctx.font = '11px monospace';
    ctx.fillText(label, ox + 4, oy - gH - 6);

    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var tx = i / 100;
      var v = fn(tx);
      var sx = ox + tx * gW;
      var sy = oy - v * gH;
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* Present marker */
    var nowX = ox + gW * 0.55;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(nowX, oy - gH); ctx.lineTo(nowX, oy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '9px monospace';
    ctx.fillText('now', nowX + 2, oy - gH + 10);
  }

  function decelerating(tx) { return tx * (1 - tx * 0.3) * 0.9; }
  function accelerating(tx) { return tx * tx * 1.2; }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.05)';
    ctx.fillRect(0, 0, W, H);

    drawPanel(topOY, 'Without Λ: expansion decelerates', decelerating, 'rgba(82,133,200,0.9)');
    drawPanel(botOY, 'With Λ: expansion accelerates', accelerating, 'rgba(200,112,80,0.9)');

    ctx.fillStyle = 'rgba(200,112,80,0.6)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Dark energy drives the accelerating expansion of the universe', W / 2, H * 0.06);
    ctx.textAlign = 'left';

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
