/* sim.js — 017 Coulomb: electric field lines between charges — teaser */
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

  var posX = W * 0.3, negX = W * 0.7, cy = H / 2;

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    var pulse = 0.5 + 0.5 * Math.sin(t * 1.5);

    /* Field lines */
    var lineCount = 8;
    for (var i = 0; i < lineCount; i++) {
      var angle = (i / lineCount) * Math.PI * 2;
      var r = 28;
      var startX = posX + r * Math.cos(angle);
      var startY = cy + r * Math.sin(angle);
      var endX = negX - r * Math.cos(angle);
      var endY = cy - r * Math.sin(angle);
      var cp1x = posX + (negX - posX) * 0.3 + Math.cos(angle) * 40;
      var cp1y = cy + Math.sin(angle) * 80;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(cp1x, cp1y, negX - (negX - posX) * 0.3 + Math.cos(angle) * 40, cy + Math.sin(angle) * 80, endX, endY);
      ctx.strokeStyle = 'rgba(82,133,200,' + (0.3 + 0.4 * pulse) + ')';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    /* Force arrow between charges */
    ctx.strokeStyle = 'rgba(82,133,200,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(posX + 32, cy);
    ctx.lineTo(negX - 32, cy);
    ctx.stroke();
    ctx.fillStyle = COLOR;
    ctx.beginPath();
    ctx.moveTo(posX + 32, cy);
    ctx.lineTo(posX + 20, cy - 6);
    ctx.lineTo(posX + 20, cy + 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(negX - 32, cy);
    ctx.lineTo(negX - 20, cy - 6);
    ctx.lineTo(negX - 20, cy + 6);
    ctx.closePath();
    ctx.fill();

    /* Charge circles */
    ctx.beginPath();
    ctx.arc(posX, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,82,82,0.7)';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+', posX, cy + 6);

    ctx.beginPath();
    ctx.arc(negX, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(82,133,200,0.7)';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('−', negX, cy + 6);
    ctx.textAlign = 'left';

    ctx.fillStyle = 'rgba(82,133,200,0.7)';
    ctx.font = '12px monospace';
    ctx.fillText('F ∝ 1/r²', W * 0.43, cy - 60);

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
