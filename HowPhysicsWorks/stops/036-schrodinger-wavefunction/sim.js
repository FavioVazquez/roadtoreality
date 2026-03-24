/* sim.js — 036 Schrödinger: probability wavefunction in a box — teaser */
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

  var boxX = W * 0.08, boxY = H * 0.1, boxW = W * 0.84, boxH = H * 0.72;
  var level = 1;
  var levelTimer = 0;
  var LEVEL_INTERVAL = 200;

  function psi2(x, n) {
    var L = boxW;
    var rel = (x - boxX) / L;
    if (rel < 0 || rel > 1) return 0;
    var s = Math.sin(n * Math.PI * rel);
    return s * s;
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(160,92,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Potential well walls */
    ctx.fillStyle = 'rgba(80,60,110,0.9)';
    ctx.fillRect(boxX - 8, boxY, 8, boxH);
    ctx.fillRect(boxX + boxW, boxY, 8, boxH);
    ctx.fillStyle = 'rgba(80,60,110,0.5)';
    ctx.fillRect(boxX, boxY + boxH, boxW, 8);

    /* Wavefunction |ψ|² filled area */
    var amp = boxH * 0.85;
    var phase = t * (level * level * 0.5);
    ctx.beginPath();
    var pts = [];
    for (var x = boxX; x <= boxX + boxW; x += 2) {
      var p2 = psi2(x, level);
      var osc = Math.abs(Math.cos(phase)) * 0.3 + 0.7;
      var y = boxY + boxH - p2 * amp * osc;
      pts.push({ x: x, y: y });
    }
    ctx.moveTo(boxX, boxY + boxH);
    pts.forEach(function(p) { ctx.lineTo(p.x, p.y); });
    ctx.lineTo(boxX + boxW, boxY + boxH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(160,92,200,0.3)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(function(p) { ctx.lineTo(p.x, p.y); });
    ctx.strokeStyle = 'rgba(160,92,200,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Level label */
    ctx.fillStyle = COLOR;
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('|ψ(x)|²   n = ' + level, W / 2, H * 0.06);
    var nodes = level - 1;
    ctx.fillStyle = 'rgba(160,92,200,0.6)';
    ctx.font = '11px monospace';
    ctx.fillText('nodes: ' + nodes, W / 2, H * 0.94);
    ctx.textAlign = 'left';

    levelTimer++;
    if (levelTimer > LEVEL_INTERVAL) { levelTimer = 0; level = (level % 3) + 1; }

    t += 0.025;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = 0; level = 2; drawFrame(); }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); t = 0; level = 1; levelTimer = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
