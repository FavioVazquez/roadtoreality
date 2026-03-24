/* sim.js — 042 Big Bang: expansion from central point — teaser */
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

  var cx = W / 2, cy = H / 2;
  var PARTICLES = 80;
  var particles = [];

  function initParticles() {
    particles = [];
    for (var i = 0; i < PARTICLES; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 0.3 + Math.random() * 1.2;
      particles.push({ ang: ang, spd: spd, dist: 0, hue: Math.floor(Math.random() * 60) });
    }
  }
  initParticles();

  var GRID_DIV = 8;

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.04)';
    ctx.fillRect(0, 0, W, H);

    /* Expanding grid lines */
    var gridScale = Math.min(t * 0.08, 1);
    ctx.strokeStyle = 'rgba(200,112,80,0.12)';
    ctx.lineWidth = 1;
    var spacing = W * 0.14 * (1 + gridScale * 0.5);
    for (var i = -3; i <= 3; i++) {
      var lx = cx + i * spacing;
      var ly = cy + i * spacing;
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
    }

    /* Particles */
    particles.forEach(function(p) {
      p.dist += p.spd;
      var px = cx + Math.cos(p.ang) * p.dist;
      var py = cy + Math.sin(p.ang) * p.dist;
      if (px < -10 || px > W + 10 || py < -10 || py > H + 10) {
        p.dist = 0;
      }
      var alpha = Math.max(0, 1 - p.dist / (W * 0.5));
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + (200 + p.hue) + ',' + (80 + p.hue / 2) + ',80,' + alpha + ')';
      ctx.fill();
    });

    /* Central glow */
    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
    glow.addColorStop(0, 'rgba(255,220,100,0.9)');
    glow.addColorStop(1, 'rgba(200,112,80,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.fillStyle = 'rgba(200,112,80,0.7)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('t = 0: everything emerges from a single point', W / 2, H * 0.06);
    ctx.textAlign = 'left';

    t += 0.016;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { initParticles(); t = 30; drawFrame(); t = 0; }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); initParticles(); t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
