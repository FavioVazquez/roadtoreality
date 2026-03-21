/* sim.js — 040 Nuclear Fission: chain reaction — teaser */
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

  var nuclei = [];
  var neutrons = [];

  function reset() {
    nuclei = [{ x: W/2, y: H/2, split: false, r: 20, timer: 60 }];
    neutrons = [{ x: W*0.1, y: H/2, vx: 3, vy: 0 }];
  }
  reset();

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Move neutrons */
    neutrons.forEach(function(n) {
      n.x += n.vx;
      n.y += n.vy;

      /* Check hit on unsplit nuclei */
      nuclei.forEach(function(nuc) {
        if (nuc.split) return;
        var dx = n.x - nuc.x, dy = n.y - nuc.y;
        if (dx*dx + dy*dy < nuc.r * nuc.r) {
          nuc.split = true;
          /* Spawn 2 daughter nuclei + 2-3 neutrons */
          var angles = [0.4, -0.4, Math.PI + 0.3, Math.PI - 0.3];
          angles.forEach(function(a) {
            var dist = nuc.r * 0.8;
            nuclei.push({ x: nuc.x + Math.cos(a) * dist, y: nuc.y + Math.sin(a) * dist, split: false, r: 13, timer: 80 + Math.random() * 60 });
            neutrons.push({ x: nuc.x, y: nuc.y, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5 });
          });
          n.vx = 0; n.vy = 0;
        }
      });
    });

    /* Draw nuclei */
    nuclei.forEach(function(nuc) {
      ctx.beginPath();
      ctx.arc(nuc.x, nuc.y, nuc.r, 0, Math.PI * 2);
      ctx.fillStyle = nuc.split ? 'rgba(200,112,80,0.3)' : 'rgba(200,112,80,0.8)';
      ctx.fill();
      ctx.strokeStyle = COLOR;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    /* Draw neutrons */
    neutrons.forEach(function(n) {
      if (n.vx === 0 && n.vy === 0) return;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,220,80,0.9)';
      ctx.fill();
    });

    /* Reset if too crowded or all off screen */
    if (nuclei.length > 20 || neutrons.every(function(n) { return n.x > W || n.y > H || n.x < 0; })) {
      reset();
    }

    ctx.fillStyle = 'rgba(200,112,80,0.7)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('U-235 + n → fragments + 2–3n + energy', W/2, H * 0.06);
    ctx.textAlign = 'left';

    t += 0.016;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { reset(); t = 0; drawFrame(); }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); reset(); t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
