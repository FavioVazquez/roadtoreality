/* sim.js — 031 E=mc²: mass converts to energy explosion — teaser */
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

  var energyDots = [];
  for (var i = 0; i < 16; i++) {
    var ang = (i / 16) * Math.PI * 2;
    energyDots.push({ angle: ang, speed: 0.8 + Math.random() * 0.6 });
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(160,92,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    var phase = (t % CYCLE) / CYCLE;

    if (phase < 0.3) {
      /* Mass on left */
      var mAlpha = 1 - phase / 0.3;
      ctx.beginPath();
      ctx.arc(W * 0.28, cy, 28, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(160,92,200,' + mAlpha + ')';
      ctx.fill();
      ctx.strokeStyle = COLOR;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,' + mAlpha + ')';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('m', W * 0.28, cy + 6);
      ctx.textAlign = 'left';
    } else if (phase < 0.6) {
      /* Explosion rings */
      var exPhase = (phase - 0.3) / 0.3;
      for (var r = 1; r <= 4; r++) {
        var ring = exPhase * 120 * r / 4;
        var alpha = Math.max(0, 0.8 - exPhase);
        ctx.beginPath();
        ctx.arc(cx, cy, ring, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,200,80,' + alpha + ')';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,200,80,0.9)';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('c²', cx, cy + 10);
      ctx.textAlign = 'left';
    } else {
      /* Energy dots spreading */
      var ePhase = (phase - 0.6) / 0.4;
      energyDots.forEach(function(d) {
        var dist = ePhase * 150;
        var ex = cx + Math.cos(d.angle) * dist * d.speed;
        var ey = cy + Math.sin(d.angle) * dist * d.speed;
        ctx.beginPath();
        ctx.arc(ex, ey, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,200,80,' + (1 - ePhase * 0.7) + ')';
        ctx.fill();
      });
      ctx.fillStyle = 'rgba(160,92,200,0.7)';
      ctx.font = '13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('E (energy units)', cx, cy + 10);
      ctx.textAlign = 'left';
    }

    /* Formula */
    ctx.fillStyle = COLOR;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('E = mc²', cx, H * 0.12);
    ctx.textAlign = 'left';

    t += 0.025;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = CYCLE * 0.1; drawFrame(); t = 0; }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
