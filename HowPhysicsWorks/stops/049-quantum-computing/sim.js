/* sim.js — 049 Quantum Computing: Bloch sphere with rotating qubit vector — teaser */
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

  var cx = W / 2, cy = H / 2;
  var R = Math.min(W, H) * 0.32;

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.05)';
    ctx.fillRect(0, 0, W, H);

    /* Sphere outline */
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200,112,80,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Latitude circle (equator) */
    ctx.beginPath();
    ctx.ellipse(cx, cy, R, R * 0.25, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200,112,80,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    /* Meridian */
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * 0.25, R, 0, 0, Math.PI * 2);
    ctx.stroke();

    /* Axes */
    ctx.strokeStyle = 'rgba(200,112,80,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - R - 12); ctx.lineTo(cx, cy + R + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - R - 12, cy); ctx.lineTo(cx + R + 12, cy);
    ctx.stroke();

    /* Pole labels */
    ctx.fillStyle = COLOR;
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('|0⟩', cx, cy - R - 16);
    ctx.fillText('|1⟩', cx, cy + R + 26);
    ctx.textAlign = 'left';

    /* Qubit state vector (rotating) */
    var theta = Math.PI * 0.35 + Math.sin(t * 0.5) * 0.2;
    var phi = t * 0.7;
    var vx = R * Math.sin(theta) * Math.cos(phi);
    var vy = -R * Math.cos(theta);
    var vz = R * Math.sin(theta) * Math.sin(phi) * 0.3; /* perspective */

    var tip = { x: cx + vx + vz, y: cy + vy };

    ctx.strokeStyle = 'rgba(255,220,80,0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,80,0.9)';
    ctx.fill();

    /* Shadow on equator */
    ctx.strokeStyle = 'rgba(200,112,80,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + vx + vz, cy);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(200,112,80,0.6)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('|ψ⟩ = α|0⟩ + β|1⟩', cx, H * 0.06);
    ctx.fillText('Bloch sphere', cx, H * 0.93);
    ctx.textAlign = 'left';

    t += 0.016;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = 0.5; drawFrame(); t = 0; }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
