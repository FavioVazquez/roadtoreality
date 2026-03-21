/* sim.js — 028 Photoelectric: photons hitting metal, electrons ejected — teaser */
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

  var METAL_Y = H * 0.72;
  var photons = [];
  var electrons = [];
  var emitTimer = 0;

  function spawnPhoton() {
    photons.push({ x: Math.random() * W * 0.8 + W * 0.1, y: 0, vy: 3.5, high: Math.random() > 0.3 });
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(160,92,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Metal surface */
    ctx.fillStyle = 'rgba(100,100,120,0.7)';
    ctx.fillRect(0, METAL_Y, W, H - METAL_Y);
    ctx.fillStyle = 'rgba(160,92,200,0.5)';
    ctx.font = '11px monospace';
    ctx.fillText('metal surface', W * 0.4, METAL_Y + 20);

    /* Threshold label */
    ctx.strokeStyle = 'rgba(255,80,80,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, METAL_Y - 5);
    ctx.lineTo(W, METAL_Y - 5);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,80,80,0.7)';
    ctx.font = '10px monospace';
    ctx.fillText('threshold φ', W * 0.02, METAL_Y - 9);

    emitTimer++;
    if (emitTimer % 30 === 0) spawnPhoton();

    /* Photons */
    photons.forEach(function(p) { p.y += p.vy; });
    photons = photons.filter(function(p) {
      if (p.y >= METAL_Y - 5) {
        if (p.high) {
          electrons.push({ x: p.x, y: METAL_Y - 8, vx: (Math.random() - 0.5) * 3, vy: -4 });
        }
        return false;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = p.high ? 'rgba(255,230,60,0.9)' : 'rgba(255,130,60,0.7)';
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.high ? 'hf>φ' : 'hf<φ', p.x, p.y - 10);
      ctx.textAlign = 'left';
      return true;
    });

    /* Electrons */
    electrons.forEach(function(e) { e.x += e.vx; e.y += e.vy; e.vy += 0.12; });
    electrons = electrons.filter(function(e) {
      if (e.y > H || e.x < 0 || e.x > W) return false;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(82,133,200,0.9)';
      ctx.fill();
      return true;
    });

    ctx.fillStyle = 'rgba(160,92,200,0.7)';
    ctx.font = '12px monospace';
    ctx.fillText('E = hf − φ', W * 0.7, H * 0.15);

    t += 0.025;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { photons = []; electrons = []; t = 0; drawFrame(); }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); photons = []; electrons = []; t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
