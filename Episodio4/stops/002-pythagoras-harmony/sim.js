/* ============================================================
   sim.js — Stop 002: Pythagoras and Mathematical Harmony
   Web Audio API sine tones + Canvas 2D standing wave animation.
   ES5 IIFE. AudioContext created lazily on first user gesture.
   ============================================================ */
(function () {
  'use strict';

  var mount, canvas, ctx, dpr, W, H;
  var raf = null;
  var running = false;
  var t = 0;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var audioCtx = null;
  var currentN = 1;
  var currentIntervalName = 'Unison';

  var COLOR_STRING = '#c8953a';
  var COLOR_NODE   = '#e8b86d';
  var COLOR_LABEL  = '#f0e6d3';
  var COLOR_BG     = 'rgba(200,149,58,0.07)';

  /* Ratio data: [numerator, denominator, harmonic_n, interval_name] */
  var RATIOS = [
    [1, 1, 1, 'Unison'],
    [2, 1, 2, 'Octave'],
    [3, 2, 3, 'Perfect Fifth'],
    [4, 3, 4, 'Perfect Fourth'],
    [5, 4, 5, 'Major Third'],
    [9, 8, 9, 'Whole Tone']
  ];

  var omega = 2.5; /* animation angular speed — aesthetic, not audio freq */

  /* ── Audio ──────────────────────────────────────────────── */
  function playTone(freqHz) {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.value = freqHz;
    var now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.81);
    osc.start(now);
    osc.stop(now + 0.85);
  }

  /* ── Drawing ─────────────────────────────────────────────── */
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    /* Background tint */
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, W, H);

    var x0 = W * 0.1;
    var x1 = W * 0.9;
    var L = x1 - x0;
    var midY = H * 0.5;

    /* Reduce amplitude for high harmonics so wave stays visible */
    var amplitude = H * 0.18 / Math.max(1, currentN * 0.35);

    /* ── Rest line (dashed) ── */
    ctx.save();
    ctx.strokeStyle = 'rgba(200,149,58,0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(x0, midY);
    ctx.lineTo(x1, midY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* ── Standing wave ── */
    var cosT = Math.cos(omega * t);
    ctx.save();
    ctx.strokeStyle = COLOR_STRING;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, midY);
    var x;
    for (x = x0; x <= x1; x += 1) {
      var yOff = amplitude * Math.sin(currentN * Math.PI * (x - x0) / L) * cosT;
      ctx.lineTo(x, midY + yOff);
    }
    ctx.stroke();
    ctx.restore();

    /* ── Fixed endpoints ── */
    ctx.save();
    ctx.fillStyle = COLOR_NODE;
    ctx.beginPath();
    ctx.arc(x0, midY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x1, midY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* ── Node dots at zero-crossing positions ── */
    ctx.save();
    ctx.fillStyle = 'rgba(232,184,109,0.6)';
    var i;
    for (i = 0; i <= currentN; i++) {
      var nx = x0 + i * L / currentN;
      ctx.beginPath();
      ctx.arc(nx, midY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    /* ── Labels ── */
    ctx.save();
    ctx.fillStyle = COLOR_LABEL;
    ctx.font = 'bold 14px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('n = ' + currentN + '  —  ' + currentIntervalName, W * 0.5, midY - amplitude - 14);

    ctx.fillStyle = 'rgba(240,230,211,0.55)';
    ctx.font = '12px "DM Sans", system-ui, sans-serif';
    ctx.fillText('f = 220 Hz \u00d7 ' + RATIOS[harmonicIndexFromN(currentN)][0] + '/' + RATIOS[harmonicIndexFromN(currentN)][1], W * 0.5, midY - amplitude - 0);
    ctx.restore();
  }

  /* Return index in RATIOS array for a given harmonic n value */
  function harmonicIndexFromN(n) {
    var i;
    for (i = 0; i < RATIOS.length; i++) {
      if (RATIOS[i][2] === n) return i;
    }
    return 0;
  }

  /* ── Animation loop ─────────────────────────────────────── */
  function loop() {
    if (!running) return;
    t += 0.016;
    draw();
    raf = requestAnimationFrame(loop);
  }

  /* ── SimAPI — assigned synchronously at IIFE body level ──── */
  window.SimAPI = {
    start: function () {
      if (running) return;
      running = true;
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.dataset.state = 'playing'; btn.innerHTML = '&#9646;&#9646; Pause'; }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) dot.classList.add('is-running');
      if (!reduced) loop();
    },
    pause: function () {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.dataset.state = 'paused'; btn.innerHTML = '&#9654; Play'; }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) dot.classList.remove('is-running');
    },
    reset: function () {
      window.SimAPI.pause();
      t = 0;
      currentN = 1;
      currentIntervalName = 'Unison';
      var btns = document.querySelectorAll('[data-ratio]');
      var i;
      for (i = 0; i < btns.length; i++) { btns[i].removeAttribute('data-state'); }
      if (canvas && ctx) draw();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (audioCtx) { audioCtx.close(); audioCtx = null; }
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };

  /* ── Setup ───────────────────────────────────────────────── */
  function setup() {
    mount = document.getElementById('sim-mount');
    if (!mount) return;

    dpr = window.devicePixelRatio || 1;
    var cssW = mount.clientWidth || 600;
    var cssH = mount.clientHeight || 360;

    canvas = document.createElement('canvas');
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.style.display = 'block';
    mount.appendChild(canvas);

    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = cssW;
    H = cssH;

    /* Handle resize */
    function resize() {
      var rect = mount.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      W = Math.round(rect.width) || 600;
      H = Math.max(300, Math.round(rect.height || 360));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    window.addEventListener('resize', resize);

    /* Wire ratio buttons */
    var btns = document.querySelectorAll('[data-ratio]');
    var i;
    for (i = 0; i < btns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var ratioStr = btn.getAttribute('data-ratio');
          var parts = ratioStr.split('/');
          var num = parseInt(parts[0], 10);
          var den = parseInt(parts[1], 10);

          /* Find matching RATIOS entry */
          var j;
          for (j = 0; j < RATIOS.length; j++) {
            if (RATIOS[j][0] === num && RATIOS[j][1] === den) {
              currentN = RATIOS[j][2];
              currentIntervalName = RATIOS[j][3];
              break;
            }
          }

          /* Play tone (lazy AudioContext creation here — user gesture) */
          playTone(220 * num / den);

          /* Mark active button */
          var all = document.querySelectorAll('[data-ratio]');
          var k;
          for (k = 0; k < all.length; k++) { all[k].removeAttribute('data-state'); }
          btn.dataset.state = 'active';

          /* Redraw immediately so wave updates even if paused */
          if (canvas && ctx) draw();
        });
      }(btns[i]));
    }

    /* Initial static draw */
    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}());
