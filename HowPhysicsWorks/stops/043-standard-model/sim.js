/* sim.js — 043 Standard Model: particle grid pulsing — teaser */
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

  var particles = [
    /* Quarks */
    { name: 'u', group: 'quark', col: 0, row: 0, color: '#c87050' },
    { name: 'c', group: 'quark', col: 1, row: 0, color: '#c87050' },
    { name: 't', group: 'quark', col: 2, row: 0, color: '#c87050' },
    { name: 'd', group: 'quark', col: 0, row: 1, color: '#c86050' },
    { name: 's', group: 'quark', col: 1, row: 1, color: '#c86050' },
    { name: 'b', group: 'quark', col: 2, row: 1, color: '#c86050' },
    /* Leptons */
    { name: 'e', group: 'lepton', col: 0, row: 2, color: '#5285c8' },
    { name: 'μ', group: 'lepton', col: 1, row: 2, color: '#5285c8' },
    { name: 'τ', group: 'lepton', col: 2, row: 2, color: '#5285c8' },
    { name: 'νₑ', group: 'lepton', col: 0, row: 3, color: '#5285c8' },
    { name: 'νμ', group: 'lepton', col: 1, row: 3, color: '#5285c8' },
    { name: 'ντ', group: 'lepton', col: 2, row: 3, color: '#5285c8' },
    /* Bosons */
    { name: 'γ', group: 'boson', col: 3, row: 0, color: '#a05cc8' },
    { name: 'W', group: 'boson', col: 3, row: 1, color: '#a05cc8' },
    { name: 'Z', group: 'boson', col: 3, row: 2, color: '#a05cc8' },
    { name: 'g', group: 'boson', col: 3, row: 3, color: '#a05cc8' },
    { name: 'H', group: 'boson', col: 4, row: 1, color: '#52a378' }
  ];

  var cellW = W * 0.16, cellH = H * 0.2;
  var ox = W * 0.08, oy = H * 0.08;
  var pulseIdx = 0;

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.05)';
    ctx.fillRect(0, 0, W, H);

    var glowTick = Math.floor(t * 1.5) % particles.length;

    particles.forEach(function(p, i) {
      var px = ox + p.col * cellW + cellW / 2;
      var py = oy + p.row * cellH + cellH / 2;
      var isGlow = i === glowTick;
      var glow = isGlow ? 1 : 0.25 + 0.1 * Math.sin(t * 2 + i);
      var r = isGlow ? 22 : 16;

      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.round(glow * 255).toString(16).padStart(2, '0').slice(-2);
      ctx.fill();
      if (isGlow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = isGlow ? '#fff' : 'rgba(255,255,255,0.6)';
      ctx.font = (p.name.length > 1 ? '9' : '11') + 'px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, px, py + 4);
      ctx.textAlign = 'left';
    });

    ctx.fillStyle = 'rgba(200,112,80,0.6)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Quarks      Leptons     Bosons', W * 0.3, H * 0.92);
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
