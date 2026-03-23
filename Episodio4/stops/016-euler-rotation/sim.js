/* sim.js — 016 Euler: rotating rigid bodies with different moments of inertia — teaser */
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
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLOR = '#5285c8';

  var TORQUE    = 1.0;   // N·m applied to each shape
  var OMEGA_MAX = 10.0;  // rad/s cap

  // m=1 kg, r=0.1 m, L=0.2 m — representative values for visible speed contrast
  var shapes = [
    { cx: W * 0.2, cy: H * 0.45, label: 'Disk', formula: 'I=½mr²',  I: 0.5 * 1 * 0.1 * 0.1, omega: 0, angle: 0 },
    { cx: W * 0.5, cy: H * 0.45, label: 'Rod',  formula: 'I=⅓mL²', I: (1/3) * 1 * 0.2 * 0.2, omega: 0, angle: 0 },
    { cx: W * 0.8, cy: H * 0.45, label: 'Ring', formula: 'I=mr²',   I: 1 * 0.1 * 0.1, omega: 0, angle: 0 }
  ];

  function drawDisk(cx, cy, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    // Disk body
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(82,133,200,0.2)';
    ctx.fill();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();
    // High-contrast radius spoke so rotation is clearly visible
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(38, 0);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
  function drawRod(cx, cy, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-48, 0); ctx.lineTo(48, 0);
    ctx.stroke();
    ctx.fillStyle = COLOR;
    ctx.beginPath(); ctx.arc(-48, 0, 6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(48, 0, 6, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
  function drawRing(cx, cy, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(82,133,200,0.4)';
    ctx.lineWidth = 1;
    ctx.moveTo(0, 0); ctx.lineTo(40, 0);
    ctx.stroke();
    ctx.restore();
  }

  var DT = 0.016; // seconds per frame

  function stepPhysics() {
    shapes.forEach(function(s) {
      var alpha = TORQUE / s.I;          // angular acceleration rad/s²
      s.omega = Math.min(s.omega + alpha * DT, OMEGA_MAX);
      s.angle += s.omega * DT;
    });
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    shapes.forEach(function(s, i) {
      if (i === 0) drawDisk(s.cx, s.cy, s.angle);
      if (i === 1) drawRod(s.cx, s.cy, s.angle);
      if (i === 2) drawRing(s.cx, s.cy, s.angle);

      ctx.fillStyle = COLOR;
      ctx.font = '13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.label, s.cx, s.cy + 65);
      ctx.fillStyle = 'rgba(82,133,200,0.75)';
      ctx.font = '11px monospace';
      ctx.fillText(s.formula, s.cx, s.cy + 82);
      ctx.textAlign = 'left';
    });

    if (running && !reduced) { stepPhysics(); raf = requestAnimationFrame(drawFrame); }
  }

  function drawStatic() {
    shapes.forEach(function(s) { s.angle = 0.4; });
    drawFrame();
    shapes.forEach(function(s) { s.angle = 0; });
  }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); shapes.forEach(function(s) { s.omega = 0; s.angle = 0; }); drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
