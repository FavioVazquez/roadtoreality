/* sim.js — 015 Bernoulli: venturi tube with particle flow — teaser */
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

  /* Venturi geometry */
  var x0 = W * 0.05, x1 = W * 0.35, x2 = W * 0.65, x3 = W * 0.95;
  var cy = H / 2;
  var wideH = H * 0.3, narrowH = H * 0.1;

  /* Particles */
  var particles = [];
  for (var i = 0; i < 24; i++) {
    particles.push({ x: x0 + Math.random() * (x3 - x0), lane: (i % 3) - 1 });
  }

  function tubeYTop(x) {
    if (x < x1) return cy - wideH;
    if (x < x2) {
      var p = (x - x1) / (x2 - x1);
      return cy - (wideH + (narrowH - wideH) * p);
    }
    return cy - narrowH;
  }
  function tubeYBot(x) {
    if (x < x1) return cy + wideH;
    if (x < x2) {
      var p = (x - x1) / (x2 - x1);
      return cy + (wideH + (narrowH - wideH) * p);
    }
    return cy + narrowH;
  }

  function speedAt(x) {
    if (x >= x1 && x <= x2) return 3.5;
    return 1.4;
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Tube outline */
    ctx.beginPath();
    ctx.moveTo(x0, cy - wideH);
    ctx.bezierCurveTo(x1, cy - wideH, x1, cy - narrowH, x2, cy - narrowH);
    ctx.lineTo(x3, cy - narrowH);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, cy + wideH);
    ctx.bezierCurveTo(x1, cy + wideH, x1, cy + narrowH, x2, cy + narrowH);
    ctx.lineTo(x3, cy + narrowH);
    ctx.stroke();

    /* Pressure bars */
    var bars = [{x: x0 + (x1-x0)*0.4, h: 70, label:'High P'}, {x: (x1+x2)/2, h: 28, label:'Low P'}, {x: x2 + (x3-x2)*0.6, h: 70, label:'High P'}];
    bars.forEach(function(b) {
      ctx.fillStyle = 'rgba(82,133,200,0.25)';
      ctx.fillRect(b.x - 10, cy - wideH - b.h - 10, 20, b.h);
      ctx.strokeStyle = COLOR;
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x - 10, cy - wideH - b.h - 10, 20, b.h);
      ctx.fillStyle = 'rgba(82,133,200,0.7)';
      ctx.font = '10px monospace';
      ctx.fillText(b.label, b.x - 18, cy - wideH - b.h - 14);
    });

    /* Particles */
    particles.forEach(function(p) {
      var spd = speedAt(p.x);
      p.x += spd;
      if (p.x > x3) p.x = x0;
      var top = tubeYTop(p.x) + 4;
      var bot = tubeYBot(p.x) - 4;
      var span = bot - top;
      var laneY = top + span * (p.lane + 1) / 3;
      ctx.beginPath();
      ctx.arc(p.x, laneY, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(82,133,200,0.8)';
      ctx.fill();
    });

    t += 0.016;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = 0; drawFrame(); }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); t = 0; particles.forEach(function(p,i){ p.x = x0 + (i/24)*(x3-x0); }); drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
