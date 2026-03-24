/* sim.js — 029 Time Dilation: two clocks, one slow — teaser */
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

  var c1x = W * 0.28, c2x = W * 0.72, cy = H * 0.48, R = 60;

  function drawClock(cx, cy, angle, label, sublabel) {
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20,15,30,0.8)';
    ctx.fill();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* Tick marks */
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6;
      var r1 = i % 3 === 0 ? R - 8 : R - 5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95);
      ctx.strokeStyle = 'rgba(160,92,200,0.6)';
      ctx.lineWidth = i % 3 === 0 ? 2 : 1;
      ctx.stroke();
    }

    /* Second hand */
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = 'rgba(255,80,80,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 8); ctx.lineTo(0, -R * 0.85);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = COLOR;
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + R + 22);
    ctx.fillStyle = 'rgba(160,92,200,0.6)';
    ctx.font = '11px monospace';
    ctx.fillText(sublabel, cx, cy + R + 36);
    ctx.textAlign = 'left';
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(160,92,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Title */
    ctx.fillStyle = 'rgba(160,92,200,0.5)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Time Dilation: Δt = γΔt₀', W / 2, H * 0.1);
    ctx.textAlign = 'left';

    var gamma = 0.45; /* time dilation factor for moving clock */
    drawClock(c1x, cy, t * 1.8, 'Stationary', 'v = 0');
    drawClock(c2x, cy, t * 1.8 * gamma, 'Moving', 'v = 0.9c  ←');

    /* Speed indicator for moving clock */
    ctx.fillStyle = 'rgba(255,220,80,0.8)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('→', c2x + R + 10, cy);
    ctx.fillText('→', c2x + R + 22, cy);
    ctx.textAlign = 'left';

    t += 0.016;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = 0.5; drawFrame(); t = 0; }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
