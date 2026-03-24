/* sim.js — 044 Higgs: Mexican hat potential, symmetry breaking — teaser */
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

  var cx = W / 2, cy = H * 0.52;
  var SCALE_X = W * 0.42, SCALE_Y = H * 0.32;
  var CYCLE = 8;
  var ballAngle = 0;
  var ballRadius = 0;

  function potential(x) {
    /* V(φ) = -μ²φ² + λφ⁴ — Mexican hat cross-section */
    return -x * x * 0.5 + x * x * x * x * 0.18;
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.05)';
    ctx.fillRect(0, 0, W, H);

    var phase = (t % CYCLE) / CYCLE;

    /* Draw potential curve */
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var x = (i / 100) * 2 - 1;
      var v = potential(x);
      var sx = cx + x * SCALE_X;
      var sy = cy - v * SCALE_Y;
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* Fill under curve */
    ctx.lineTo(cx + SCALE_X, cy + 80);
    ctx.lineTo(cx - SCALE_X, cy + 80);
    ctx.closePath();
    ctx.fillStyle = 'rgba(200,112,80,0.08)';
    ctx.fill();

    /* Ball rolling on potential */
    if (phase < 0.5) {
      /* High temperature: ball at top (symmetric) */
      ballRadius = 0.02 * Math.sin(t * 3);
      ballAngle += 0.05;
    } else {
      /* Symmetry breaking: ball rolls to minimum */
      ballRadius += (0.69 - ballRadius) * 0.04;
      ballAngle += 0.02;
    }

    var bx = (phase < 0.5 ? ballRadius : 0) * SCALE_X;
    var vb = potential(phase < 0.5 ? ballRadius : ballRadius);
    var ballX = cx + (phase < 0.5 ? ballRadius : ballRadius) * SCALE_X;
    var ballY = cy - potential(phase < 0.5 ? ballRadius : ballRadius) * SCALE_Y;

    ctx.beginPath();
    ctx.arc(ballX, ballY, 9, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,80,0.95)';
    ctx.fill();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Labels */
    ctx.fillStyle = 'rgba(200,112,80,0.7)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    var tempLabel = phase < 0.5 ? 'High T: symmetric' : 'Low T: symmetry broken';
    ctx.fillText(tempLabel, cx, H * 0.9);
    ctx.fillText('Higgs potential V(φ)', cx, H * 0.08);
    ctx.textAlign = 'left';

    ctx.fillStyle = 'rgba(200,112,80,0.5)';
    ctx.font = '10px monospace';
    ctx.fillText('φ', cx + SCALE_X + 8, cy + 5);

    t += 0.016;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = CYCLE * 0.7; ballRadius = 0.69; drawFrame(); t = 0; }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); t = 0; ballRadius = 0; ballAngle = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
