/* sim.js — 027 Planck: blackbody spectrum vs Rayleigh-Jeans — teaser */
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

  var ox = W * 0.1, oy = H * 0.85, gW = W * 0.82, gH = H * 0.7;

  function planck(freq) {
    /* Normalized Planck distribution */
    var x = freq * 3;
    if (x < 0.01) return 0;
    return (x * x * x) / (Math.exp(x) - 1) * 0.35;
  }
  function rayleigh(freq) {
    return freq * freq * 0.22;
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(160,92,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Axes */
    ctx.strokeStyle = 'rgba(160,92,200,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy - gH); ctx.lineTo(ox, oy); ctx.lineTo(ox + gW, oy);
    ctx.stroke();
    ctx.fillStyle = 'rgba(160,92,200,0.6)';
    ctx.font = '11px monospace';
    ctx.fillText('frequency →', ox + gW * 0.7, oy + 14);
    ctx.fillText('intensity', ox - 8, oy - gH + 12);

    /* Rayleigh-Jeans (ultraviolet catastrophe) */
    ctx.beginPath();
    for (var i = 0; i <= 80; i++) {
      var freq = i / 80;
      var val = rayleigh(freq);
      var x = ox + freq * gW;
      var y = oy - Math.min(val, 1.2) * gH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(200,80,80,0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(200,80,80,0.7)';
    ctx.font = '11px monospace';
    ctx.fillText('Rayleigh-Jeans (catastrophe)', ox + gW * 0.45, oy - gH * 0.4);

    /* Planck curve */
    var glow = 0.8 + 0.2 * Math.sin(t * 2);
    ctx.beginPath();
    for (var j = 0; j <= 80; j++) {
      var f = j / 80;
      var p = planck(f);
      var px = ox + f * gW;
      var py = oy - Math.min(p, 1.1) * gH;
      if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(255,255,255,' + glow + ')';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '11px monospace';
    ctx.fillText("Planck's law", ox + gW * 0.25, oy - gH * 0.78);

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
