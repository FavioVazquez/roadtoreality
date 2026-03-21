/* sim.js — 021 Joule: falling weight heats water via paddle — teaser */
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

  var weightY0 = H * 0.12;
  var weightYMax = H * 0.68;
  var boxX = W * 0.5, boxW = W * 0.28, boxH = H * 0.34, boxY = H * 0.42;
  var PERIOD = 6;

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    var cycle = (t % PERIOD) / PERIOD;
    var weightY = weightY0 + cycle * (weightYMax - weightY0);
    var temp = 20 + cycle * 8; /* °C rise */

    /* Pulley */
    ctx.beginPath();
    ctx.arc(W * 0.28, weightY0 + 10, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(82,133,200,0.4)';
    ctx.fill();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Rope */
    ctx.strokeStyle = 'rgba(82,133,200,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.28, weightY0 + 22);
    ctx.lineTo(W * 0.28, weightY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W * 0.28 + 12, weightY0 + 10);
    ctx.lineTo(boxX, weightY0 + 10);
    ctx.lineTo(boxX, boxY + boxH * 0.4);
    ctx.stroke();

    /* Weight */
    ctx.fillStyle = 'rgba(82,133,200,0.7)';
    ctx.fillRect(W * 0.28 - 18, weightY, 36, 24);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W * 0.28 - 18, weightY, 36, 24);

    /* Water box */
    var waterColor = 'rgba(' + Math.round(82 + cycle * 80) + ',' + Math.round(133) + ',' + Math.round(200 - cycle * 100) + ',0.3)';
    ctx.fillStyle = waterColor;
    ctx.fillRect(boxX - boxW/2, boxY, boxW, boxH);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX - boxW/2, boxY, boxW, boxH);

    /* Paddle (rotating) */
    ctx.save();
    ctx.translate(boxX, boxY + boxH * 0.5);
    ctx.rotate(t * 3);
    ctx.strokeStyle = 'rgba(82,133,200,0.9)';
    ctx.lineWidth = 3;
    for (var a = 0; a < 4; a++) {
      var ang = a * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang) * 20, Math.sin(ang) * 20);
      ctx.stroke();
    }
    ctx.restore();

    /* Temperature readout */
    ctx.fillStyle = COLOR;
    ctx.font = '14px monospace';
    ctx.fillText('T = ' + temp.toFixed(1) + ' °C', boxX + boxW/2 + 10, boxY + 30);

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
