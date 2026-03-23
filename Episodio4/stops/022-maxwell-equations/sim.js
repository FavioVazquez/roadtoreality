/* sim.js — 022 Maxwell: animated EM plane wave — teaser */
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

  var cx = W / 2, cy = H / 2;
  var AMP = H * 0.22;
  var LAMBDA = W * 0.45;

  /* Source charges — oscillating dipole on left side */
  var chargeX = W * 0.08;
  var chargeY = H / 2;
  var CHARGE_R = 8;

  /* Track mouse position for cursor interaction */
  var mouseX = -1000, mouseY = -1000;

  canvas.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top)  * scaleY;

    /* Set pointer cursor when within 20px of either charge */
    var posY = chargeY - AMP * 0.4;
    var negY = chargeY + AMP * 0.4;
    var dPos = Math.hypot(mouseX - chargeX, mouseY - posY);
    var dNeg = Math.hypot(mouseX - chargeX, mouseY - negY);
    if (dPos < 20 || dNeg < 20) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'default';
    }
  });

  canvas.addEventListener('mouseleave', function () {
    mouseX = -1000;
    mouseY = -1000;
    canvas.style.cursor = 'default';
  });

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* --- Panel labels at opacity 0.85 --- */

    /* Left panel: source charges label */
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(82,133,200,1)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Source', W * 0.02, H * 0.08);
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(180,200,240,1)';
    ctx.fillText('oscillating dipole', W * 0.02, H * 0.08 + 14);
    ctx.globalAlpha = 1;

    /* Right panel: wave propagation label */
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(82,133,200,1)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('EM Wave', W * 0.98, H * 0.08);
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(180,200,240,1)';
    ctx.fillText('E \u22a5 B \u22a5 c', W * 0.98, H * 0.08 + 14);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    /* Propagation axis */
    ctx.strokeStyle = 'rgba(82,133,200,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.12, cy);
    ctx.lineTo(W * 0.95, cy);
    ctx.stroke();
    ctx.fillStyle = 'rgba(82,133,200,0.5)';
    ctx.font = '11px monospace';
    ctx.fillText('\u2192 c', W * 0.9, cy - 8);

    /* E field (vertical, blue) */
    ctx.strokeStyle = 'rgba(82,133,200,0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var x = W * 0.12; x <= W * 0.95; x += 2) {
      var phase = (x / LAMBDA) * Math.PI * 2 - t * 3;
      var y = cy - AMP * Math.sin(phase);
      if (x === W * 0.12) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(82,133,200,0.8)';
    ctx.font = '12px monospace';
    ctx.fillText('E', W * 0.12, cy - AMP - 8);

    /* B field (horizontal, using vertical displacement in "B plane" offset) */
    ctx.save();
    ctx.translate(0, 0);
    ctx.strokeStyle = 'rgba(200,82,82,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var x2 = W * 0.12; x2 <= W * 0.95; x2 += 2) {
      var ph2 = (x2 / LAMBDA) * Math.PI * 2 - t * 3;
      var bAmp = AMP * 0.55;
      /* Offset B wave diagonally to suggest 3D */
      var bY = cy + bAmp * Math.sin(ph2) * 0.5;
      var bX = x2 + bAmp * Math.cos(ph2) * 0.45;
      if (x2 === W * 0.12) ctx.moveTo(bX, bY);
      else ctx.lineTo(bX, bY);
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(200,82,82,0.75)';
    ctx.font = '12px monospace';
    ctx.fillText('B', W * 0.12, cy + AMP * 0.5 + 20);

    /* --- Source dipole charges (left panel) --- */
    var oscillation = Math.sin(t * 3);
    var posY = chargeY - AMP * 0.4 * oscillation;
    var negY = chargeY + AMP * 0.4 * oscillation;

    /* Positive charge (+) */
    var dPos = Math.hypot(mouseX - chargeX, mouseY - posY);
    var posGlow = dPos < 20 ? 1.0 : 0.85;
    ctx.beginPath();
    ctx.arc(chargeX, posY, CHARGE_R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(82,133,200,' + posGlow + ')';
    ctx.fill();
    ctx.strokeStyle = 'rgba(82,133,200,0.95)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('+', chargeX, posY + 4);

    /* Negative charge (−) */
    var dNeg = Math.hypot(mouseX - chargeX, mouseY - negY);
    var negGlow = dNeg < 20 ? 1.0 : 0.85;
    ctx.beginPath();
    ctx.arc(chargeX, negY, CHARGE_R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,82,82,' + negGlow + ')';
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,82,82,0.95)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('\u2212', chargeX, negY + 4);
    ctx.textAlign = 'left';

    /* Charge labels at opacity 0.85 with subtitle */
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(82,133,200,1)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('+q', chargeX + CHARGE_R + 12, posY);
    ctx.fillStyle = 'rgba(200,82,82,1)';
    ctx.fillText('\u2212q', chargeX + CHARGE_R + 12, negY);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    /* Separator line between source panel and wave panel */
    ctx.strokeStyle = 'rgba(82,133,200,0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(W * 0.11, H * 0.05);
    ctx.lineTo(W * 0.11, H * 0.95);
    ctx.stroke();
    ctx.setLineDash([]);

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
