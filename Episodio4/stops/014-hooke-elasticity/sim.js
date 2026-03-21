/* sim.js — 014 Hooke: spring-mass oscillation — teaser */
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
  var COLOR = '#52a378';

  var REST = H * 0.35;
  var AMP  = H * 0.2;
  var OMEGA = 2.2;
  var cx = W / 2;

  function drawSpring(fromY, toY) {
    var coils = 12;
    var coilW = 18;
    var step = (toY - fromY) / (coils * 2 + 2);
    ctx.beginPath();
    ctx.moveTo(cx, fromY);
    for (var i = 0; i < coils * 2 + 1; i++) {
      var yy = fromY + step * (i + 1);
      var xx = cx + (i % 2 === 0 ? coilW : -coilW);
      ctx.lineTo(xx, yy);
    }
    ctx.lineTo(cx, toY);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,163,120,0.08)';
    ctx.fillRect(0, 0, W, H);

    /* Ceiling */
    ctx.fillStyle = COLOR;
    ctx.fillRect(cx - 40, 20, 80, 10);

    var weightY = REST + AMP * Math.sin(OMEGA * t);

    drawSpring(30, weightY - 20);

    /* Weight */
    ctx.beginPath();
    ctx.arc(cx, weightY + 10, 22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(82,163,120,0.3)';
    ctx.fill();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Force arrow */
    var ext = weightY - REST;
    var arrowLen = ext * 0.6;
    ctx.strokeStyle = 'rgba(82,163,120,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 40, weightY + 10);
    ctx.lineTo(cx + 40, weightY + 10 - arrowLen);
    ctx.stroke();
    if (Math.abs(arrowLen) > 5) {
      var dir = arrowLen > 0 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + 40, weightY + 10 - arrowLen);
      ctx.lineTo(cx + 35, weightY + 10 - arrowLen + dir * 8);
      ctx.lineTo(cx + 45, weightY + 10 - arrowLen + dir * 8);
      ctx.closePath();
      ctx.fillStyle = COLOR;
      ctx.fill();
    }

    ctx.fillStyle = COLOR;
    ctx.font = '12px monospace';
    ctx.fillText('F = -kx', cx + 52, weightY + 14);

    t += 0.03;
    if (running && !reduced) {
      raf = requestAnimationFrame(drawFrame);
    }
  }

  function drawStatic() {
    t = Math.PI * 0.5;
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
