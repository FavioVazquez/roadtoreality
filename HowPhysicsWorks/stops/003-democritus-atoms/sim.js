/* ============================================================
   sim.js — Stop 003: Democritus and the Atom
   Zoom simulation: macroscopic → molecular → atomic → nuclear
   ============================================================ */
(function () {
  'use strict';

  var LEVELS = [
    { label: 'Grain of sand', scale: '1 mm', desc: 'A grain of sand — visible to the naked eye.', color: 'oklch(0.72 0.12 60)', particleR: 60, count: 1 },
    { label: 'Molecules',     scale: '1 nm',  desc: 'Zoom in 1 million times: you see molecules — clusters of atoms bonded together.', color: 'oklch(0.72 0.15 145)', particleR: 22, count: 7 },
    { label: 'Atoms',         scale: '0.1 nm', desc: 'Each molecule is made of atoms. Carbon, oxygen, silicon — all different sizes.', color: 'oklch(0.65 0.18 240)', particleR: 14, count: 19 },
    { label: 'Nucleus',       scale: '10 fm',  desc: 'Inside the atom: a tiny dense nucleus surrounded by an electron cloud. The nucleus is 10,000 to 100,000 times smaller than the atom (a few femtometres against a tenth of a nanometre).', color: 'oklch(0.68 0.20 310)', particleR: 6, count: 9 },
    { label: 'Quarks',        scale: '<1 fm',  desc: 'Protons and neutrons are made of quarks. Quarks and electrons are the smallest constituents we know; whether anything is truly indivisible is still an open question. Democritus\' atom turned out to be very divisible.', color: 'oklch(0.68 0.22 20)', particleR: 3, count: 3 }
  ];

  var canvas, ctx, W, H;
  var currentLevel = 0;
  var targetLevel  = 0;
  var animProgress = 1; /* 0 = transitioning in, 1 = fully shown */
  var running = false;
  var rafId = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var autoZoomT = 0;
  var tAnim = 0; /* gentle thermal wobble, so a running sim visibly moves */

  /* Seeded arrangement so particles don't jump on resize */
  function getPositions(count, seed, r) {
    var positions = [];
    var rng = seed;
    function rand() { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return (rng >>> 0) / 0xffffffff; }

    if (count === 1) {
      positions.push({ x: 0, y: 0 });
      return positions;
    }

    /* Hex packing for larger counts */
    var cols = Math.ceil(Math.sqrt(count));
    var idx = 0;
    for (var row = 0; row < cols && idx < count; row++) {
      for (var col = 0; col < cols && idx < count; col++) {
        var offsetX = (row % 2) * 0.5;
        var nx = (col - cols / 2 + offsetX) * 2.2;
        var ny = (row - cols / 2) * 1.9;
        positions.push({
          x: nx * r + (rand() - 0.5) * r * 0.3,
          y: ny * r + (rand() - 0.5) * r * 0.3
        });
        idx++;
      }
    }
    return positions;
  }

  function draw() {
    if (!ctx || !isFinite(W) || !isFinite(H) || W <= 0 || H <= 0) return;
    ctx.clearRect(0, 0, W, H);

    var level = LEVELS[currentLevel];
    var alpha = animProgress;

    /* Dark background vignette */
    var grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(0, Math.max(W, H) * 0.6));
    grad.addColorStop(0, 'oklch(0.12 0.03 285)');
    grad.addColorStop(1, 'oklch(0.07 0.02 285)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2;
    var cy = H / 2 - 30;

    /* Glow ring */
    ctx.save();
    ctx.globalAlpha = 0.15 * alpha;
    var ringGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(0, level.particleR * 4));
    ringGrad.addColorStop(0, level.color);
    ringGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, level.particleR * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* Particles */
    var positions = getPositions(level.count, currentLevel * 31 + 7, level.particleR * 2.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    for (var i = 0; i < positions.length; i++) {
      var wob = level.particleR * 0.12;
      var px = cx + positions[i].x + Math.sin(tAnim * 1.3 + i * 1.7) * wob;
      var py = cy + positions[i].y + Math.cos(tAnim * 1.1 + i * 2.3) * wob;
      var r  = level.particleR;

      /* Particle body */
      ctx.beginPath();
      ctx.arc(Math.round(px), Math.round(py), r, 0, Math.PI * 2);

      ctx.fillStyle = level.color;
      ctx.fill();

      /* Glow */
      ctx.shadowColor = level.color;
      ctx.shadowBlur  = r * 1.2;
      ctx.beginPath();
      ctx.arc(Math.round(px), Math.round(py), r * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.globalAlpha = 0.15 * alpha;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = alpha;
    }
    ctx.restore();

    /* Special: electron orbits for atom level */
    if (currentLevel === 2) {
      ctx.save();
      ctx.globalAlpha = 0.2 * alpha;
      ctx.strokeStyle = level.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      for (var o = 0; o < 2; o++) {
        var orbitR = level.particleR * (2.5 + o * 2);
        ctx.beginPath();
        ctx.ellipse(cx, cy, orbitR, orbitR * 0.4, o * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        /* electron travelling along the orbit */
        var ea = tAnim * (1.6 - o * 0.5) + o * 2;
        var ex = orbitR * Math.cos(ea), ey = orbitR * 0.4 * Math.sin(ea);
        var cr = Math.cos(o * 0.8), sr = Math.sin(o * 0.8);
        ctx.save();
        ctx.setLineDash([]);
        ctx.fillStyle = level.color;
        ctx.beginPath();
        ctx.arc(cx + ex * cr - ey * sr, cy + ex * sr + ey * cr, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    /* Level info panel */
    var panelY = H - 110;
    ctx.save();
    ctx.globalAlpha = 0.85 * alpha;

    /* Scale badge */
    ctx.fillStyle = level.color;
    ctx.font = '700 11px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.beginPath();
    var bw = 80, bh = 22;
    ctx.roundRect(cx - bw/2, panelY - bh/2, bw, bh, 11);
    ctx.fill();
    ctx.fillStyle = 'oklch(0.1 0.02 82)';
    ctx.fillText('Scale: ' + level.scale, cx, panelY);
    ctx.restore();

    /* Description */
    ctx.save();
    ctx.globalAlpha = 0.9 * alpha;
    ctx.font = '13px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.75 0.02 90)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var words = level.desc.split(' ');
    var line = '';
    var lineY = panelY + 20;
    for (var w = 0; w < words.length; w++) {
      var test = line + (line ? ' ' : '') + words[w];
      if (ctx.measureText(test).width > W - 60 && line) {
        ctx.fillText(line, cx, lineY);
        lineY += 20;
        line = words[w];
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, cx, lineY);
    ctx.restore();

    /* Level dots */
    var dotY = H - 20;
    var dotSpacing = 20;
    var dotsStartX = cx - (LEVELS.length - 1) * dotSpacing / 2;
    for (var d = 0; d < LEVELS.length; d++) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(dotsStartX + d * dotSpacing, dotY, d === currentLevel ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = d === currentLevel ? level.color : 'oklch(0.35 0.02 285)';
      ctx.fill();
      ctx.restore();
    }
  }

  /* ── SimAPI ─────────────────────────────────────────── */
  function start() {
    if (running) return;
    running = true;
    autoZoomT = 0;
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '\u23f8 Pause'; btn.dataset.state = 'playing'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.add('is-running');
    if (!reducedMotion) rafId = requestAnimationFrame(loop);
    else draw();
  }

  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '▶ Auto-zoom'; btn.dataset.state = 'paused'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.remove('is-running');
  }

  function reset() {
    pause();
    currentLevel = 0;
    targetLevel  = 0;
    animProgress = 1;
    autoZoomT = 0;
    var slider = document.getElementById('zoom-slider');
    if (slider) { slider.value = 0; }
    var lbl = document.getElementById('zoom-label');
    if (lbl) lbl.textContent = LEVELS[0].label;
    draw();
  }

  function destroy() {
    pause();
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  function loop() {
    if (!running) return;

    /* Auto-advance level every ~3 seconds */
    autoZoomT++;
    tAnim += 0.04;
    if (autoZoomT % 180 === 0) {
      var next = (currentLevel + 1) % LEVELS.length;
      currentLevel = next;
      animProgress = 0.1;
      var slider = document.getElementById('zoom-slider');
      if (slider) slider.value = next;
      var lbl = document.getElementById('zoom-label');
      if (lbl) lbl.textContent = LEVELS[next].label;
    }

    if (animProgress < 1) animProgress = Math.min(1, animProgress + 0.04);

    draw();
    rafId = requestAnimationFrame(loop);
  }

  /* ── Setup ──────────────────────────────────────────── */
  function setup() {
    var mount = document.getElementById('sim-mount');
    if (!mount) return;
    canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    mount.appendChild(canvas);
    ctx = canvas.getContext('2d');

    function resize() {
      var rect = mount.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      W = Math.round(rect.width);
      H = Math.max(360, Math.round(rect.height || 380));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    var slider = document.getElementById('zoom-slider');
    var lbl    = document.getElementById('zoom-label');
    if (slider) {
      slider.addEventListener('input', function () {
        currentLevel = parseInt(this.value, 10);
        animProgress = 0.2;
        if (lbl) lbl.textContent = LEVELS[currentLevel].label;
        if (!running) draw();
      });
    }

    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}());
