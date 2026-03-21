/* sim.js — 050 Frontiers: open questions hexagon network — teaser */
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
  var HEX_R = Math.min(W, H) * 0.3;

  var questions = [
    'Dark Energy',
    'Quantum Gravity',
    'Matter Asymmetry',
    'Consciousness?',
    'Unification',
    'Arrow of Time'
  ];

  var nodes = questions.map(function(q, i) {
    var ang = i * Math.PI / 3 - Math.PI / 2;
    return { x: cx + Math.cos(ang) * HEX_R, y: cy + Math.sin(ang) * HEX_R, label: q, ang: ang };
  });

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.05)';
    ctx.fillRect(0, 0, W, H);

    /* Connecting lines — pulse sequentially */
    var glowConn = Math.floor(t * 0.8) % (nodes.length * 2);
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var edgeIdx = i * 2 + j;
        var alpha = edgeIdx === glowConn ? 0.7 : 0.12 + 0.06 * Math.sin(t + i + j);
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = 'rgba(200,112,80,' + alpha + ')';
        ctx.lineWidth = edgeIdx === glowConn ? 2 : 1;
        ctx.stroke();
      }
    }

    /* Center node */
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(50,30,20,0.9)';
    ctx.fill();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('?', cx, cy + 4);
    ctx.textAlign = 'left';

    /* Question nodes */
    nodes.forEach(function(n, i) {
      var pulse = 0.4 + 0.35 * Math.sin(t * 1.5 + i * Math.PI / 3);
      ctx.beginPath();
      ctx.arc(n.x, n.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,112,80,' + pulse + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,112,80,' + (pulse + 0.2) + ')';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      /* Label */
      var off = 22;
      var lx = n.x + Math.cos(n.ang) * off;
      var ly = n.y + Math.sin(n.ang) * off;
      ctx.fillStyle = 'rgba(200,112,80,0.85)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, lx, ly + 3);
      ctx.textAlign = 'left';
    });

    ctx.fillStyle = 'rgba(200,112,80,0.5)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('The greatest questions in physics remain open', W / 2, H * 0.06);
    ctx.textAlign = 'left';

    t += 0.016;
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
