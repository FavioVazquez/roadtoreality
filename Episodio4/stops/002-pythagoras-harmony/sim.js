/* sim.js — 002 Pythagoras: standing waves in harmonic ratios — teaser */
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
  var COLOR = '#c8953a';

  function drawWave(y, length, freq, amplitude, phase, label) {
    var x0 = W * 0.1;
    var x1 = x0 + length;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    for (var x = x0; x <= x1; x += 1) {
      var progress = (x - x0) / length;
      ctx.lineTo(x, y + amplitude * Math.sin(freq * Math.PI * progress) * Math.cos(phase));
    }
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Fixed endpoints */
    ctx.fillStyle = COLOR;
    ctx.beginPath(); ctx.arc(x0, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x1, y, 4, 0, Math.PI * 2); ctx.fill();

    /* Label */
    ctx.fillStyle = COLOR;
    ctx.font = '13px monospace';
    ctx.fillText(label, x1 + 12, y + 5);
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    /* Title */
    ctx.fillStyle = 'rgba(200,149,58,0.15)';
    ctx.fillRect(0, 0, W, H);

    var amp = 28;
    var len = W * 0.65;

    /* String 1: fundamental frequency f */
    drawWave(H * 0.33, len, 2, amp, t, 'f');

    /* String 2: octave 2f — half the length, double the frequency */
    drawWave(H * 0.67, len * 0.5, 4, amp, 2 * t, '2f');

    ctx.fillStyle = 'rgba(200,149,58,0.6)';
    ctx.font = '12px monospace';
    ctx.fillText('ratio 2:1 — octave', W * 0.1, H * 0.12);

    t += 0.04;
    if (running && !reduced) {
      raf = requestAnimationFrame(drawFrame);
    }
  }

  function drawStatic() {
    t = Math.PI * 0.25;
    drawFrame();
    t = 0;
  }

  window.SimAPI = {
    start: function () {
      if (running) return;
      running = true;
      if (reduced) { drawStatic(); return; }
      raf = requestAnimationFrame(drawFrame);
    },
    pause: function () {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    },
    reset: function () {
      window.SimAPI.pause();
      t = 0;
      drawStatic();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };

  drawStatic();
}());
