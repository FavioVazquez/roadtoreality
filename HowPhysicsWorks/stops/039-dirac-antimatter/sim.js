/* sim.js — 039 Dirac: pair annihilation and creation — teaser */
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
  var CYCLE = 5;

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(160,92,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    var phase = (t % CYCLE) / CYCLE;

    if (phase < 0.4) {
      /* Particles approaching */
      var approach = phase / 0.4;
      var eX = cx - (1 - approach) * W * 0.3;
      var pX = cx + (1 - approach) * W * 0.3;

      ctx.beginPath();
      ctx.arc(eX, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(82,133,200,0.9)';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('e⁻', eX, cy + 5);

      ctx.beginPath();
      ctx.arc(pX, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,82,82,0.9)';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText('e⁺', pX, cy + 5);
      ctx.textAlign = 'left';
    } else if (phase < 0.6) {
      /* Annihilation flash */
      var flashR = (phase - 0.4) / 0.2 * 80;
      var alpha = 1 - (phase - 0.4) / 0.2;
      ctx.beginPath();
      ctx.arc(cx, cy, flashR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,220,80,' + alpha + ')';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,220,80,' + (alpha * 0.9) + ')';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('γ γ', cx, cy + 8);
      ctx.textAlign = 'left';
    } else {
      /* Photons departing */
      var depart = (phase - 0.6) / 0.4;
      var gDist = depart * W * 0.35;

      for (var side = -1; side <= 1; side += 2) {
        var gx = cx + side * gDist;
        ctx.beginPath();
        ctx.arc(gx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,220,80,' + (1 - depart * 0.6) + ')';
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('γ', gx, cy + 4);
        ctx.textAlign = 'left';
      }
    }

    ctx.fillStyle = 'rgba(160,92,200,0.6)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('e⁻ + e⁺ → γ + γ', W / 2, H * 0.1);
    ctx.fillText('pair annihilation', W / 2, H * 0.9);
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
