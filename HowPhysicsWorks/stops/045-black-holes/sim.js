/* sim.js — 045 Black Holes: light rays bending, accretion disk — teaser */
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
  var EH = 38; /* event horizon radius */
  var DISK_RX = 130, DISK_RY = 22;

  var rays = [
    { startY: H * 0.1, impact: 0.3 },
    { startY: H * 0.25, impact: 0.7 },
    { startY: H * 0.42, impact: 1.1 },
    { startY: H * 0.58, impact: 1.1 },
    { startY: H * 0.75, impact: 0.7 },
    { startY: H * 0.9, impact: 0.3 }
  ];

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.04)';
    ctx.fillRect(0, 0, W, H);

    /* Accretion disk (behind BH) */
    ctx.beginPath();
    ctx.ellipse(cx, cy, DISK_RX, DISK_RY, 0, 0, Math.PI * 2);
    var grad = ctx.createRadialGradient(cx, cy, EH, cx, cy, DISK_RX);
    grad.addColorStop(0, 'rgba(255,180,60,0.8)');
    grad.addColorStop(0.5, 'rgba(200,100,50,0.5)');
    grad.addColorStop(1, 'rgba(100,40,20,0)');
    ctx.fillStyle = grad;
    ctx.fill();
    /* Rotating disk hint */
    for (var i = 0; i < 3; i++) {
      var ang = t * 0.4 + i * Math.PI / 1.5;
      var bx = cx + Math.cos(ang) * DISK_RX * 0.7;
      var by = cy + Math.sin(ang) * DISK_RY * 0.7;
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,200,80,0.6)';
      ctx.fill();
    }

    /* Light rays (curved paths) */
    rays.forEach(function(ray) {
      var b = (H / 2 - ray.startY) * ray.impact;
      ctx.beginPath();
      ctx.moveTo(0, ray.startY);
      var captured = Math.abs(ray.startY - cy) < EH * 1.5;
      for (var x = 0; x <= W; x += 3) {
        var dx = x - cx;
        var dy = ray.startY - cy;
        var d = Math.sqrt(dx * dx + dy * dy);
        var deflect = d > 5 ? b * EH * EH / (d * d + EH * EH) * 40 : 0;
        var ry = ray.startY + deflect * Math.sign(cy - ray.startY);
        if (Math.abs(ry - cy) < EH && Math.abs(x - cx) < EH) { ctx.strokeStyle = 'rgba(255,255,255,0.0)'; break; }
        ctx.lineTo(x, ry);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    /* Event horizon (black circle) */
    ctx.beginPath();
    ctx.arc(cx, cy, EH, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,112,80,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(200,112,80,0.6)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Event horizon: Rs = 2GM/c²', W / 2, H * 0.06);
    ctx.textAlign = 'left';

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
