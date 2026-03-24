/* sim.js — 035 Wave-Particle Duality: double-slit interference pattern built dot by dot — teaser */
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

  var screenX = W * 0.82;
  var SLIT_Y1 = H * 0.38, SLIT_Y2 = H * 0.62;
  var dots = [];
  var emitTimer = 0;

  function interferenceProb(y) {
    var d = 30; /* slit separation half in pixels */
    var L = screenX - W * 0.38;
    var k = 0.08;
    var theta = Math.atan2(y - H / 2, L);
    var delta = d * Math.sin(theta) * k;
    var val = Math.cos(delta * 8);
    return val * val;
  }

  function spawnDot() {
    /* Sample position on screen according to interference probability */
    var y;
    for (var tries = 0; tries < 20; tries++) {
      y = H * 0.1 + Math.random() * H * 0.8;
      if (Math.random() < interferenceProb(y)) break;
    }
    dots.push({ x: W * 0.12, y: y, targetX: screenX, speed: 4 + Math.random() * 3 });
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(160,92,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Double slit barrier */
    ctx.fillStyle = 'rgba(80,60,110,0.8)';
    ctx.fillRect(W * 0.38, 0, 8, SLIT_Y1 - 15);
    ctx.fillRect(W * 0.38, SLIT_Y1 + 15, 8, SLIT_Y2 - SLIT_Y1 - 30);
    ctx.fillRect(W * 0.38, SLIT_Y2 + 15, 8, H - SLIT_Y2 - 15);

    /* Screen */
    ctx.fillStyle = 'rgba(60,40,80,0.8)';
    ctx.fillRect(screenX, 0, 8, H);

    emitTimer++;
    if (emitTimer % 4 === 0) spawnDot();

    /* Landed dots on screen */
    dots = dots.filter(function(d) {
      d.x += d.speed;
      if (d.x >= screenX) {
        /* Leave a mark on screen */
        ctx.fillStyle = 'rgba(160,92,200,0.7)';
        ctx.fillRect(screenX + 10, d.y - 1, 3, 3);
        return false;
      }
      ctx.beginPath();
      ctx.arc(d.x, d.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,220,80,0.7)';
      ctx.fill();
      return true;
    });

    ctx.fillStyle = 'rgba(160,92,200,0.5)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('double slit', W * 0.39, H * 0.05);
    ctx.fillText('detector', screenX + 4, H * 0.05);
    ctx.fillText('interference pattern', screenX + 16, H / 2);
    ctx.textAlign = 'left';

    t += 0.016;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { dots = []; t = 0; drawFrame(); }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); dots = []; t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
