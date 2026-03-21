/* sim.js — 019 Faraday: magnet moving through coil, galvanometer deflects — teaser */
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

  var coilX = W * 0.5, coilY = H * 0.42;
  var galX = W * 0.78, galY = H * 0.58;

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Magnet oscillates left-right */
    var magX = W * 0.25 + Math.sin(t * 1.2) * W * 0.18;
    var magY = coilY - 10;

    /* Magnet body */
    ctx.fillStyle = 'rgba(200,82,82,0.8)';
    ctx.fillRect(magX - 40, magY - 20, 40, 40);
    ctx.fillStyle = 'rgba(82,133,200,0.8)';
    ctx.fillRect(magX, magY - 20, 40, 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', magX - 20, magY + 5);
    ctx.fillText('S', magX + 20, magY + 5);
    ctx.textAlign = 'left';

    /* Coil — overlapping ellipses */
    for (var i = 0; i < 5; i++) {
      var ex = coilX + (i - 2) * 10;
      ctx.beginPath();
      ctx.ellipse(ex, coilY, 15, 30, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(82,133,200,0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    /* Wire to galvanometer */
    ctx.beginPath();
    ctx.moveTo(coilX + 30, coilY);
    ctx.lineTo(galX, galY);
    ctx.strokeStyle = 'rgba(82,133,200,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Galvanometer */
    ctx.beginPath();
    ctx.arc(galX, galY, 24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20,20,30,0.7)';
    ctx.fill();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();
    /* Needle */
    var needleAngle = -Math.PI/2 + Math.sin(t * 1.2) * 0.9;
    ctx.save();
    ctx.translate(galX, galY);
    ctx.rotate(needleAngle);
    ctx.strokeStyle = 'rgba(255,80,80,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -18);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(82,133,200,0.7)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('G', galX, galY + 38);
    ctx.textAlign = 'left';

    t += 0.025;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = Math.PI * 0.3; drawFrame(); t = 0; }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
