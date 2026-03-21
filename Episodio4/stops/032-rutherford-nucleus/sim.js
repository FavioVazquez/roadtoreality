/* sim.js — 032 Rutherford: alpha particle scattering off nucleus — teaser */
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

  var nucX = W * 0.62, nucY = H / 2;

  var beams = [
    { y0: H * 0.18, deflect: 0, label: 'no deflect' },
    { y0: H * 0.30, deflect: 0.2, label: '' },
    { y0: H * 0.43, deflect: 0.8, label: '' },
    { y0: H * 0.50, deflect: -2.4, label: 'back-scatter' },
    { y0: H * 0.60, deflect: 0.5, label: '' },
    { y0: H * 0.72, deflect: 0, label: '' }
  ];

  function drawBeam(beam) {
    var progress = ((t * 0.4) % 1);
    var pathX = W * 0.08 + progress * (nucX - W * 0.08 - 12);
    var pathY = beam.y0;
    var dist = (pathX - (nucX - 14));

    /* Once past nucleus start deflecting */
    var pastNuc = pathX > nucX - 12;
    var deflected = pastNuc ? beam.deflect * (pathX - nucX) * 0.03 : 0;
    var finalY = pathY + deflected;

    /* Trail */
    ctx.beginPath();
    ctx.moveTo(W * 0.08, beam.y0);
    if (!pastNuc) {
      ctx.lineTo(pathX, pathY);
    } else {
      ctx.lineTo(nucX - 12, beam.y0);
      ctx.lineTo(pathX, finalY);
    }
    ctx.strokeStyle = 'rgba(160,92,200,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Particle dot */
    ctx.beginPath();
    ctx.arc(pathX, pastNuc ? finalY : pathY, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,200,80,0.9)';
    ctx.fill();

    if (beam.label) {
      ctx.fillStyle = 'rgba(160,92,200,0.6)';
      ctx.font = '10px monospace';
      ctx.fillText(beam.label, pathX + 8, (pastNuc ? finalY : pathY) + 4);
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(160,92,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Gold foil line */
    ctx.strokeStyle = 'rgba(255,200,80,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(nucX - 14, 0); ctx.lineTo(nucX - 14, H);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,200,80,0.5)';
    ctx.font = '10px monospace';
    ctx.fillText('gold foil', nucX - 12, 18);

    /* Alpha source */
    ctx.fillStyle = 'rgba(160,92,200,0.5)';
    ctx.fillRect(W * 0.02, H * 0.3, 22, H * 0.4);
    ctx.fillStyle = 'rgba(255,200,80,0.7)';
    ctx.font = '9px monospace';
    ctx.fillText('α', W * 0.04, H * 0.52);

    beams.forEach(drawBeam);

    /* Nucleus */
    ctx.beginPath();
    ctx.arc(nucX, nucY, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,80,80,0.9)';
    ctx.fill();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 1;
    ctx.stroke();

    t += 0.016;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = 0.4; drawFrame(); t = 0; }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
