/* sim.js — 030 Length Contraction: ruler compresses when moving — teaser */
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

  var FULL_W = W * 0.62;
  var RULER_X0 = W * 0.19;
  var TICKS = 10;

  function drawRuler(x0, y, width, label, color, alpha) {
    var h = 28;
    ctx.fillStyle = 'rgba(100,80,140,' + alpha + ')';
    ctx.fillRect(x0, y - h/2, width, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x0, y - h/2, width, h);

    for (var i = 0; i <= TICKS; i++) {
      var tx = x0 + (i / TICKS) * width;
      var th = i % 5 === 0 ? h * 0.7 : h * 0.4;
      ctx.beginPath();
      ctx.moveTo(tx, y - th/2);
      ctx.lineTo(tx, y + th/2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = color;
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x0 + width / 2, y + h/2 + 16);
    ctx.textAlign = 'left';
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(160,92,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Stationary ruler */
    drawRuler(RULER_X0, H * 0.3, FULL_W, 'L₀ (rest length)', COLOR, 0.5);

    /* Moving ruler — contracts */
    var beta = 0.8; /* v/c */
    var gamma = 1 / Math.sqrt(1 - beta * beta);
    var contracted = FULL_W / gamma;

    /* Moving animation: ruler slides left-right + contract */
    var offset = Math.sin(t * 0.6) * W * 0.08;
    var contractFactor = 1 / gamma;
    var movW = FULL_W * contractFactor;
    var movX = RULER_X0 + offset + (FULL_W - movW) / 2;

    drawRuler(movX, H * 0.62, movW, "L = L₀/γ  (v=0.8c)", 'rgba(255,220,80,0.9)', 0.7);

    /* Arrows showing direction */
    ctx.fillStyle = 'rgba(255,220,80,0.8)';
    ctx.font = '18px sans-serif';
    ctx.fillText('→', movX + movW + 8, H * 0.64);

    ctx.fillStyle = 'rgba(160,92,200,0.6)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('L = L₀ √(1 − v²/c²)', W / 2, H * 0.12);
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
