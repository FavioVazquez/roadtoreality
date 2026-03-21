/* sim.js — 026 Michelson-Morley: interferometer schematic, null result — teaser */
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

  var cx = W * 0.45, cy = H * 0.52;
  var ARM = W * 0.28;
  var rotAngle = 0;

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    rotAngle = t * 0.3;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotAngle);

    /* Arm 1 */
    ctx.strokeStyle = 'rgba(82,133,200,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(ARM, 0);
    ctx.stroke();
    /* Mirror 1 */
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ARM, -12); ctx.lineTo(ARM, 12);
    ctx.stroke();

    /* Arm 2 */
    ctx.strokeStyle = 'rgba(200,82,82,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, -ARM);
    ctx.stroke();
    /* Mirror 2 */
    ctx.strokeStyle = 'rgba(200,82,82,0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-12, -ARM); ctx.lineTo(12, -ARM);
    ctx.stroke();

    /* Beam splitter */
    ctx.strokeStyle = 'rgba(255,220,80,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -12); ctx.lineTo(12, 12);
    ctx.stroke();

    /* Beams traveling on arms */
    var beamPos = (t * 0.5) % ARM;
    ctx.fillStyle = 'rgba(82,133,200,0.9)';
    ctx.beginPath();
    ctx.arc(beamPos, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,82,82,0.9)';
    ctx.beginPath();
    ctx.arc(0, -beamPos, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    /* Source */
    ctx.fillStyle = 'rgba(255,220,80,0.9)';
    ctx.beginPath();
    ctx.arc(cx - ARM * 0.5, cy, 8, 0, Math.PI * 2);
    ctx.fill();

    /* Detector + fringes (null result — no shift) */
    var detX = W * 0.82, detY = cy;
    ctx.fillStyle = 'rgba(20,20,30,0.8)';
    ctx.fillRect(detX, detY - 30, 30, 60);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(detX, detY - 30, 30, 60);
    for (var i = 0; i < 5; i++) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.6 + 0.4 * ((i % 2))) + ')';
      ctx.fillRect(detX + 2, detY - 28 + i * 12, 26, 6);
    }
    ctx.fillStyle = 'rgba(82,133,200,0.7)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Δ = 0', detX + 15, detY + 46);
    ctx.fillText('null result', detX + 15, detY + 58);
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
