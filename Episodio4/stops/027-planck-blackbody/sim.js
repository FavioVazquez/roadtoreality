/* sim.js — 027 Planck: blackbody spectrum, temperature sweep — teaser */
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

  var ox = W * 0.12, oy = H * 0.82, gW = W * 0.80, gH = H * 0.65;

  function planck(freq, T) {
    var scale = T / 4000;
    var x = freq * 3 / scale;
    if (x < 0.01) return 0;
    return (x * x * x) / (Math.exp(Math.min(x, 20)) - 1) * 0.32 * scale;
  }

  function rayleigh(freq, T) {
    return freq * freq * (T / 4000) * 0.20;
  }

  function drawScene(T) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'oklch(0.10 0.01 285)';
    ctx.fillRect(0, 0, W, H);

    /* Axes */
    ctx.strokeStyle = 'rgba(160,92,200,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy - gH); ctx.lineTo(ox, oy); ctx.lineTo(ox + gW, oy);
    ctx.stroke();

    ctx.fillStyle = 'rgba(160,92,200,0.6)';
    ctx.font = '11px monospace';
    ctx.fillText('frequency →', ox + gW * 0.68, oy + 14);
    ctx.fillText('intensity', ox - 8, oy - gH + 12);

    /* Rayleigh-Jeans: diverges at high frequency */
    ctx.beginPath();
    for (var i = 0; i <= 90; i++) {
      var freq = i / 90;
      var val = rayleigh(freq, T);
      var x = ox + freq * gW;
      var y = oy - Math.min(val, 1.1) * gH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(220,80,80,0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(220,80,80,0.75)';
    ctx.fillText('Rayleigh-Jeans →∞', ox + gW * 0.42, oy - gH * 0.88);

    /* Planck curve */
    var peakFreq = 0;
    var peakVal = 0;
    ctx.beginPath();
    for (var j = 0; j <= 90; j++) {
      var f = j / 90;
      var p = planck(f, T);
      if (p > peakVal) { peakVal = p; peakFreq = f; }
      var px = ox + f * gW;
      var py = oy - Math.min(p, 1.05) * gH;
      if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText("Planck's law ✓", ox + gW * 0.18, oy - gH * 0.78);

    /* Moving peak marker */
    var peakX = ox + peakFreq * gW;
    ctx.strokeStyle = 'rgba(160,92,200,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(peakX, oy - Math.min(peakVal, 1.05) * gH - 6);
    ctx.lineTo(peakX, oy);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Temperature label */
    ctx.fillStyle = 'rgba(200,160,255,0.9)';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('T = ' + Math.round(T) + ' K', ox + gW * 0.62, oy - gH * 0.55);
  }

  function drawFrame() {
    var T = 3000 + 2500 * (0.5 + 0.5 * Math.sin(t * 0.4));
    drawScene(T);
    t += 0.025;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = 0; drawScene(3000); }

  window.SimAPI = {
    start:   function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause:   function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset:   function () { window.SimAPI.pause(); t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
