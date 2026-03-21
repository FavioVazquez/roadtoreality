/* sim.js — 048 Gravitational Waves: merging masses with ripples and strain — teaser */
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

  var cx = W * 0.5, cy = H * 0.42;
  var rings = [];
  var emitTimer = 0;
  var orbitR = 50;
  var chirpRate = 0.0008;

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.04)';
    ctx.fillRect(0, 0, W, H);

    /* Spiraling orbit */
    var omega = 1 + t * chirpRate * 40;
    orbitR = Math.max(6, 50 - t * 0.08);
    var m1x = cx + Math.cos(t * omega) * orbitR;
    var m1y = cy + Math.sin(t * omega) * orbitR * 0.5;
    var m2x = cx - Math.cos(t * omega) * orbitR;
    var m2y = cy - Math.sin(t * omega) * orbitR * 0.5;

    /* Emit ripple rings from center of orbit */
    emitTimer++;
    if (emitTimer % 12 === 0) {
      rings.push({ r: 0 });
    }
    rings.forEach(function(r) { r.r += 1.5; });
    rings = rings.filter(function(r) { return r.r < Math.max(W, H); });

    rings.forEach(function(ring) {
      var alpha = Math.max(0, 0.6 - ring.r / (W * 0.5));
      ctx.beginPath();
      ctx.ellipse(cx, cy, ring.r, ring.r * 0.55, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200,112,80,' + alpha + ')';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    /* Masses */
    [{ x: m1x, y: m1y }, { x: m2x, y: m2y }].forEach(function(m) {
      ctx.beginPath();
      ctx.arc(m.x, m.y, Math.max(4, orbitR * 0.28), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(50,30,20,0.95)';
      ctx.fill();
      ctx.strokeStyle = COLOR;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    /* Strain readout at bottom */
    var strainY = H * 0.82;
    var strainH = 25;
    ctx.strokeStyle = 'rgba(200,112,80,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.06, strainY);
    ctx.lineTo(W * 0.94, strainY);
    ctx.stroke();
    ctx.beginPath();
    var strainAmp = Math.min(strainH, strainH * t * 0.004 + 4);
    for (var x = W * 0.06; x <= W * 0.94; x += 2) {
      var age = (x - W * 0.06) / (W * 0.88);
      var freq = 1 + age * 4;
      var sv = strainAmp * Math.sin(age * freq * 12) * Math.exp(-Math.pow(age - 0.9, 2) * 8);
      if (x === W * 0.06) ctx.moveTo(x, strainY - sv); else ctx.lineTo(x, strainY - sv);
    }
    ctx.strokeStyle = 'rgba(200,112,80,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,112,80,0.5)';
    ctx.font = '10px monospace';
    ctx.fillText('h(t) strain', W * 0.06, strainY - strainH - 4);

    if (orbitR <= 6) { t = 0; orbitR = 50; rings = []; }

    t += 0.025;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { rings = []; t = 50; drawFrame(); t = 0; }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); t = 0; orbitR = 50; rings = []; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
