/* sim.js — 020 Carnot: PV diagram with traversing cycle — teaser */
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

  var ox = W * 0.12, oy = H * 0.85;
  var gW = W * 0.78, gH = H * 0.72;

  /* Carnot cycle: 4 corners in PV space [0..1] */
  var pts = [
    {v: 0.12, p: 0.82}, /* A: high P, low V */
    {v: 0.55, p: 0.55}, /* B: isothermal expansion */
    {v: 0.85, p: 0.18}, /* C: low P, high V */
    {v: 0.42, p: 0.42}  /* D: isothermal compression */
  ];

  function toScreen(v, p) { return { x: ox + v * gW, y: oy - p * gH }; }

  /* Get position along cycle [0..1] */
  function cyclePos(prog) {
    var n = pts.length;
    var seg = Math.floor(prog * n) % n;
    var frac = (prog * n) % 1;
    var a = pts[seg], b = pts[(seg + 1) % n];
    /* Curved interpolation via easing */
    var t2 = frac * frac * (3 - 2 * frac);
    return { v: a.v + (b.v - a.v) * t2, p: a.p + (b.p - a.p) * t2 };
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Axes */
    ctx.strokeStyle = 'rgba(82,133,200,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy - gH); ctx.lineTo(ox, oy); ctx.lineTo(ox + gW, oy);
    ctx.stroke();
    ctx.fillStyle = 'rgba(82,133,200,0.7)';
    ctx.font = '12px monospace';
    ctx.fillText('P', ox - 18, oy - gH + 10);
    ctx.fillText('V', ox + gW + 6, oy + 4);

    /* Cycle path */
    ctx.beginPath();
    var a0 = toScreen(pts[0].v, pts[0].p);
    ctx.moveTo(a0.x, a0.y);
    for (var i = 1; i <= pts.length; i++) {
      var p = pts[i % pts.length];
      var s = toScreen(p.v, p.p);
      var prev = pts[(i - 1)];
      var ps = toScreen(prev.v, prev.p);
      /* Bezier for curved appearance */
      var cpx = (ps.x + s.x) / 2;
      var cpy = i % 2 === 0 ? Math.min(ps.y, s.y) - 20 : Math.max(ps.y, s.y) + 20;
      ctx.quadraticCurveTo(cpx, cpy, s.x, s.y);
    }
    ctx.closePath();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(82,133,200,0.1)';
    ctx.fill();

    /* Moving dot */
    var pos = cyclePos((t * 0.12) % 1);
    var sc = toScreen(pos.v, pos.p);
    ctx.beginPath();
    ctx.arc(sc.x, sc.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,80,0.9)';
    ctx.fill();

    ctx.fillStyle = 'rgba(82,133,200,0.8)';
    ctx.font = '11px monospace';
    ctx.fillText('W = enclosed area', ox + gW * 0.3, oy - gH + 20);

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
