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
  var currentNum = 1;
  var currentDen = 1;
  var BASE_HZ = 220;
  var currentIntervalName = 'Unison';

  var COLOR_STRING = '#c8953a';
  var COLOR_NODE   = '#e8b86d';
  var COLOR_LABEL  = '#f0e6d3';
  var COLOR_BG     = 'rgba(200,149,58,0.07)';

  /* Ratio data: [numerator, denominator, unused, interval_name] */
  var RATIOS = [
    [1, 1, 1, 'Unison'],
    [2, 1, 2, 'Octave'],
    [3, 2, 3, 'Perfect Fifth'],
    [4, 3, 4, 'Perfect Fourth'],
    [5, 4, 5, 'Major Third (just, later)'],
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
    gain.gain.linearRampToValueAtTime(0.28, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.81);
    osc.start(now);
    osc.stop(now + 0.85);
  }

  /* ── Drawing ─────────────────────────────────────────────── */
  /* Two strings, each in its fundamental. Reference string: length L, 220 Hz.
     Second string: length L * den/num, so f = 220 * L / L2 = 220 * num/den (f ∝ 1/L). */
  function freqRef() { return BASE_HZ; }
  function freqSecond() { return BASE_HZ * currentNum / currentDen; }

  function drawString(x0, len, midY, amplitude, phase, label, sub) {
    ctx.save();
    ctx.strokeStyle = 'rgba(200,149,58,0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(x0, midY);
    ctx.lineTo(x0 + len, midY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = COLOR_STRING;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, midY);
    var x;
    for (x = 0; x <= len; x += 1) {
      ctx.lineTo(x0 + x, midY + amplitude * Math.sin(Math.PI * x / len) * phase);
    }
    ctx.stroke();
    ctx.fillStyle = COLOR_NODE;
    ctx.beginPath(); ctx.arc(x0, midY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x0 + len, midY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = COLOR_LABEL;
    ctx.font = 'bold 13px "DM Sans", system-ui, sans-serif';
    ctx.fillText(label, x0, midY - amplitude - 22);
    ctx.fillStyle = 'rgba(240,230,211,0.65)';
    ctx.font = '12px "DM Sans", system-ui, sans-serif';
    ctx.fillText(sub, x0, midY - amplitude - 6);
    ctx.restore();
  }

  function fmtHz(f) { return (Math.round(f * 10) / 10) + ' Hz'; }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, W, H);

    var x0 = W * 0.1;
    var L = W * 0.8;
    var L2 = L * currentDen / currentNum;
    var amplitude = H * 0.07;
    var ratio = currentNum / currentDen;

    /* Animation speed is aesthetic, but the relative speed of the two strings is true: f2/f1 = num/den */
    drawString(x0, L, H * 0.30, amplitude, Math.cos(omega * t),
      'Reference string, length L', 'f = ' + fmtHz(freqRef()));
    drawString(x0, L2, H * 0.68, amplitude, Math.cos(omega * ratio * t),
      currentIntervalName + ': length L \u00d7 ' + currentDen + '/' + currentNum,
      'f = 220 Hz \u00d7 ' + currentNum + '/' + currentDen + ' = ' + fmtHz(freqSecond()));
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
      currentNum = 1;
      currentDen = 1;
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
              currentNum = num;
              currentDen = den;
              currentIntervalName = RATIOS[j][3];
              break;
            }
          }

          /* Play tone (lazy AudioContext creation here — user gesture) */
          playTone(freqRef());
          playTone(freqSecond());

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
