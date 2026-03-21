/* sim.js — 038 Pauli: electrons filling shells with spin up/down — teaser */
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

  var cx = W / 2, cy = H * 0.5;
  var SHELLS = [{ r: 32, max: 2 }, { r: 68, max: 8 }, { r: 104, max: 8 }];
  var fillTimer = 0;
  var filledCount = 0;
  var MAX_FILL = 18;
  var FILL_INTERVAL = 40;

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(160,92,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Fill animation */
    fillTimer++;
    if (fillTimer > FILL_INTERVAL) {
      fillTimer = 0;
      filledCount = (filledCount + 1) % (MAX_FILL + 1);
    }

    /* Nucleus */
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,80,80,0.9)';
    ctx.fill();

    /* Shell rings */
    SHELLS.forEach(function(s) {
      ctx.beginPath();
      ctx.arc(cx, cy, s.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(160,92,200,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    /* Place electrons in shells */
    var placed = 0;
    SHELLS.forEach(function(shell) {
      for (var i = 0; i < shell.max && placed < filledCount; i++, placed++) {
        var ang = (i / shell.max) * Math.PI * 2 - Math.PI / 2;
        var ex = cx + Math.cos(ang) * shell.r;
        var ey = cy + Math.sin(ang) * shell.r;
        var spinUp = i % 2 === 0;
        ctx.beginPath();
        ctx.arc(ex, ey, 6, 0, Math.PI * 2);
        ctx.fillStyle = spinUp ? 'rgba(82,133,200,0.9)' : 'rgba(200,82,82,0.9)';
        ctx.fill();
        /* Spin arrow */
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ex, ey + (spinUp ? 3 : -3));
        ctx.lineTo(ex, ey + (spinUp ? -3 : 3));
        ctx.stroke();
        /* Arrow head */
        var dir = spinUp ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(ex, ey + dir * 3);
        ctx.lineTo(ex - 2, ey + dir * 3 - dir * 3);
        ctx.lineTo(ex + 2, ey + dir * 3 - dir * 3);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
    });

    ctx.fillStyle = COLOR;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Z = ' + filledCount + '  (atomic number)', W / 2, H * 0.88);
    ctx.fillText('No two electrons share the same quantum state', W / 2, H * 0.95);
    ctx.textAlign = 'left';

    t += 0.016;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = 0; filledCount = 10; drawFrame(); }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); t = 0; filledCount = 0; fillTimer = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
