/* sim.js — 041 Feynman QED: Feynman diagram with animated virtual photon — teaser */
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

  function drawWavy(x0, y0, x1, y1, amp, freq) {
    var dx = x1 - x0, dy = y1 - y0;
    var len = Math.sqrt(dx * dx + dy * dy);
    var nx = -dy / len, ny = dx / len;
    var steps = Math.floor(len / 3);
    ctx.beginPath();
    for (var i = 0; i <= steps; i++) {
      var p = i / steps;
      var wave = amp * Math.sin(p * freq * Math.PI * 2 + t * 4);
      var px = x0 + p * dx + nx * wave;
      var py = y0 + p * dy + ny * wave;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
  }

  function drawArrow(x0, y0, x1, y1, color, label) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.stroke();
    var dx = x1 - x0, dy = y1 - y0;
    var len = Math.sqrt(dx*dx + dy*dy);
    var mx = x1 - (dx/len) * 12, my = y1 - (dy/len) * 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(mx - dy/len * 5, my + dx/len * 5);
    ctx.lineTo(mx + dy/len * 5, my - dx/len * 5);
    ctx.closePath();
    ctx.fill();
    if (label) {
      ctx.fillStyle = color;
      ctx.font = '12px monospace';
      ctx.fillText(label, (x0 + x1)/2 + 8, (y0 + y1)/2);
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Vertical time axis */
    ctx.strokeStyle = 'rgba(200,112,80,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(W * 0.04, H * 0.1);
    ctx.lineTo(W * 0.04, H * 0.9);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(200,112,80,0.5)';
    ctx.font = '10px monospace';
    ctx.fillText('time →', W * 0.04, H * 0.08);

    /* Electron 1: top-left to top-right, bending at vertex */
    drawArrow(W * 0.12, H * 0.22, cx - 20, H * 0.45, 'rgba(82,133,200,0.9)', 'e⁻');
    drawArrow(cx + 20, H * 0.45, W * 0.88, H * 0.22, 'rgba(82,133,200,0.9)', '');

    /* Electron 2: bottom-left to bottom-right */
    drawArrow(W * 0.12, H * 0.78, cx - 20, H * 0.55, 'rgba(82,133,200,0.9)', 'e⁻');
    drawArrow(cx + 20, H * 0.55, W * 0.88, H * 0.78, 'rgba(82,133,200,0.9)', '');

    /* Virtual photon (wavy line) between vertices */
    drawWavy(cx - 20, H * 0.45, cx + 20, H * 0.55, 8, 3);
    ctx.strokeStyle = 'rgba(255,220,80,0.9)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,220,80,0.8)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('γ (virtual)', cx + 30, H * 0.5);
    ctx.textAlign = 'left';

    /* Vertices */
    [{ x: cx - 20, y: H * 0.45 }, { x: cx + 20, y: H * 0.55 }].forEach(function(v) {
      ctx.beginPath();
      ctx.arc(v.x, v.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = COLOR;
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(200,112,80,0.6)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Feynman diagram: e⁻e⁻ scattering', W / 2, H * 0.92);
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
