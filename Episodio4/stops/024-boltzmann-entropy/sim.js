/* sim.js — 024 Boltzmann: gas particles bouncing, velocity histogram — teaser */
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

  var BOX_X = W * 0.05, BOX_Y = H * 0.05, BOX_W = W * 0.52, BOX_H = H * 0.82;
  var N = 40;
  var particles = [];
  for (var i = 0; i < N; i++) {
    var spd = 0.8 + Math.random() * 2;
    var ang = Math.random() * Math.PI * 2;
    particles.push({
      x: BOX_X + 10 + Math.random() * (BOX_W - 20),
      y: BOX_Y + 10 + Math.random() * (BOX_H - 20),
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd
    });
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Box */
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(BOX_X, BOX_Y, BOX_W, BOX_H);

    /* Move particles */
    particles.forEach(function(p) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < BOX_X + 4 || p.x > BOX_X + BOX_W - 4) p.vx *= -1;
      if (p.y < BOX_Y + 4 || p.y > BOX_Y + BOX_H - 4) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(82,133,200,0.7)';
      ctx.fill();
    });

    /* Velocity histogram */
    var histX = W * 0.62, histY = H * 0.06, histW = W * 0.34, histH = H * 0.78;
    var bins = 8;
    var counts = new Array(bins).fill(0);
    particles.forEach(function(p) {
      var spd = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
      var bin = Math.min(bins - 1, Math.floor(spd / 0.5));
      counts[bin]++;
    });
    var maxC = Math.max.apply(null, counts) || 1;
    ctx.strokeStyle = 'rgba(82,133,200,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(histX, histY, histW, histH);
    ctx.fillStyle = 'rgba(82,133,200,0.5)';
    ctx.font = '10px monospace';
    ctx.fillText('speed →', histX, histY + histH + 14);
    ctx.fillText('# particles', histX + histW + 4, histY + histH / 2);
    var binW = histW / bins;
    counts.forEach(function(c, idx) {
      var bh = (c / maxC) * histH * 0.9;
      ctx.fillStyle = 'rgba(82,133,200,0.5)';
      ctx.fillRect(histX + idx * binW + 1, histY + histH - bh, binW - 2, bh);
    });
    /* Maxwell-Boltzmann curve overlay */
    ctx.beginPath();
    ctx.moveTo(histX, histY + histH);
    for (var b = 0; b <= bins; b++) {
      var v = (b + 0.5) * 0.5;
      var mb = v * v * Math.exp(-v * v * 0.8) * 2.5;
      ctx.lineTo(histX + b * binW, histY + histH - Math.min(1, mb) * histH * 0.9);
    }
    ctx.strokeStyle = 'rgba(255,220,80,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

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
