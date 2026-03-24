/* ============================================================
   sim.js — Stop 025: Hertz and Radio Waves
   Oscillating dipole antenna with radiating EM wavefronts.
   sin²θ angular radiation pattern (72 segments per ring).
   Alternating red/blue E-field colors per half-cycle.
   Controls: dipole-frequency-slider, wave-speed-slider.
   ============================================================ */
(function () {
  'use strict';

  /* ── Top-level state ──────────────────────────────────────── */
  var mount, canvas, ctx, dpr, W, H;
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var t = 0;
  var dipoleFreq = 1.2;        /* Hz — oscillation frequency */
  var v_wave = 100;             /* px/s — wavefront expansion speed */
  var emitInterval = 0.5 / dipoleFreq; /* seconds per half-cycle */
  var timeSinceEmit = 0;        /* seconds since last wavefront emitted */
  var wavefronts = [];          /* array of {age, phase} objects */
  var N_SEGS = 72;              /* number of arc segments per ring */
  var MAX_WAVEFRONTS = 30;

  /* ── Physics helpers ──────────────────────────────────────── */
  function getDipoleOffset() {
    return 20 * Math.sin(2 * Math.PI * dipoleFreq * t);
  }

  /* ── Wavefront drawing ────────────────────────────────────── */
  function drawWavefront(wf) {
    var cx = W * 0.5;
    var cy = H * 0.5;
    var radius = v_wave * wf.age;
    if (radius <= 0) return;

    /* Color: red for phase 0, blue for phase 1 */
    var r, g, b;
    if (wf.phase === 0) {
      r = 200; g = 80; b = 80;
    } else {
      r = 82; g = 133; b = 200;
    }

    var TWO_PI = Math.PI * 2;
    var segAngle = TWO_PI / N_SEGS;

    for (var i = 0; i < N_SEGS; i++) {
      /* Angle measured from 0 (right), going counter-clockwise */
      var midAngle = i * segAngle;

      /* theta_i: angle from the dipole axis (vertical = +Y direction).
         Dipole axis is vertical, so we compute angle from vertical:
         angleFromVertical = midAngle - PI/2
         sin(angleFromVertical) = cos(midAngle) when 0 is to the right.
         Actually: if dipole axis = vertical (y), theta = angle from y-axis.
         For a point at standard angle phi from x-axis:
           x = cos(phi), y = sin(phi)
           theta (from y-axis) = atan2(|x|, |y|) but for radiation:
           I ∝ sin²(theta) where theta is from dipole axis.
           With dipole along y: sin(theta) = cos(phi - PI/2) = sin(phi) no...
           sin²θ pattern: zero along dipole axis (y), max perpendicular (x).
           So sinTheta = Math.abs(Math.cos(midAngle)) — but that gives max along x.
           Wait: theta from y-axis: sinTheta = sin(theta) = |component perpendicular to y|
                 = |cos(midAngle)| where midAngle is measured from x-axis.
           Actually for dipole along y: sinTheta for point at angle phi from x-axis:
             the component along x of unit vector = cos(phi)
             theta from y-axis: cos(theta) = sin(phi), sin(theta) = cos(phi)
             So sin²(theta) = cos²(phi).
           But visually this gives zero on x-axis sides which is wrong.
           Correct: dipole along y means radiation zero ALONG y (theta=0,180).
             At phi=0 (pointing right, perpendicular to dipole), intensity = max.
             At phi=90 (pointing up, along dipole), intensity = 0.
           sin²(theta from y-axis) = cos²(phi from x-axis)?
             No. Let phi = angle from x-axis.
             Vector direction: (cos phi, sin phi).
             Angle from y-axis (dipole axis): theta = angle between (cos phi, sin phi) and (0,1).
             cos(theta) = sin(phi).
             sin²(theta) = 1 - cos²(theta) = 1 - sin²(phi) = cos²(phi).
           So at phi=0 (right): sin²θ = 1 (max) — correct.
           At phi=90 (up): sin²θ = 0 (zero) — correct.
      */
      var sinTheta = Math.abs(Math.cos(midAngle));
      var alpha = sinTheta * sinTheta * 0.65;

      if (alpha < 0.01) continue;

      ctx.save();
      ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, midAngle - segAngle * 0.5, midAngle + segAngle * 0.5);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ── Dipole drawing ───────────────────────────────────────── */
  function drawDipole(dipoleOffset) {
    var cx = W * 0.5;
    var cy = H * 0.5;

    var topY = cy - dipoleOffset;
    var botY = cy + dipoleOffset;

    /* Dashed connecting line (antenna body) */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,180,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx, botY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* Charge colors depend on sign of dipoleOffset */
    var topColor, botColor;
    if (dipoleOffset >= 0) {
      topColor = 'rgba(200,80,80,0.95)';  /* positive (red) on top */
      botColor  = 'rgba(82,133,200,0.95)'; /* negative (blue) on bottom */
    } else {
      topColor = 'rgba(82,133,200,0.95)';  /* negative (blue) on top */
      botColor  = 'rgba(200,80,80,0.95)';  /* positive (red) on bottom */
    }

    /* Top charge */
    ctx.save();
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.arc(cx, topY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* Bottom charge */
    ctx.save();
    ctx.fillStyle = botColor;
    ctx.beginPath();
    ctx.arc(cx, botY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* Label */
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,180,180,0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Hz dipole', cx, Math.max(botY, topY) + 10);
    ctx.restore();
  }

  /* ── Legend ───────────────────────────────────────────────── */
  function drawLegend() {
    var x0 = 12;
    var y0 = H - 44;
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,80,80,0.8)';
    ctx.fillText('+ half-cycle (E up)', x0 + 14, y0);
    ctx.fillStyle = 'rgba(82,133,200,0.8)';
    ctx.fillText('\u2212 half-cycle (E down)', x0 + 14, y0 + 16);
    /* Color dots */
    ctx.fillStyle = 'rgba(200,80,80,0.8)';
    ctx.beginPath();
    ctx.arc(x0 + 5, y0 - 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(82,133,200,0.8)';
    ctx.beginPath();
    ctx.arc(x0 + 5, y0 + 14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ── Readout ──────────────────────────────────────────────── */
  function drawReadout() {
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,180,180,0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('f = ' + dipoleFreq.toFixed(1) + ' Hz  |  v = ' + v_wave + ' px/s', W - 10, 8);
    ctx.restore();
  }

  /* ── Main draw ────────────────────────────────────────────── */
  function draw() {
    if (!W || !H) return;

    /* Background */
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'oklch(0.09 0.025 285)';
    ctx.fillRect(0, 0, W, H);

    /* Draw all wavefronts */
    for (var i = 0; i < wavefronts.length; i++) {
      drawWavefront(wavefronts[i]);
    }

    /* Draw dipole */
    var offset = getDipoleOffset();
    drawDipole(offset);

    drawLegend();
    drawReadout();
  }

  /* ── Animation loop ───────────────────────────────────────── */
  function loop() {
    if (!running) return;

    var dt = 0.016;
    t += dt;
    timeSinceEmit += dt;

    /* Emit wavefront every half-cycle */
    if (timeSinceEmit >= emitInterval) {
      timeSinceEmit -= emitInterval;
      var halfCycleIndex = Math.floor(t * 2 * dipoleFreq);
      wavefronts.push({ age: 0, phase: halfCycleIndex % 2 });
      if (wavefronts.length > MAX_WAVEFRONTS) {
        wavefronts.shift();
      }
    }

    /* Advance all wavefront ages */
    var maxDim = Math.max(W, H);
    var nextWavefronts = [];
    for (var j = 0; j < wavefronts.length; j++) {
      wavefronts[j].age += dt;
      if (v_wave * wavefronts[j].age < maxDim + 50) {
        nextWavefronts.push(wavefronts[j]);
      }
    }
    wavefronts = nextWavefronts;

    draw();
    raf = requestAnimationFrame(loop);
  }

  /* ── SimAPI ───────────────────────────────────────────────── */
  window.SimAPI = {
    start: function () {
      if (running) return;
      running = true;
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.dataset.state = 'playing'; btn.innerHTML = '&#9646;&#9646; Pause'; }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) { dot.classList.add('is-running'); }
      if (!reduced) { loop(); } else { draw(); }
    },
    pause: function () {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.dataset.state = 'paused'; btn.innerHTML = '&#9654; Play'; }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) { dot.classList.remove('is-running'); }
    },
    reset: function () {
      window.SimAPI.pause();
      wavefronts = [];
      t = 0;
      timeSinceEmit = 0;
      dipoleFreq = 1.2;
      v_wave = 100;
      emitInterval = 0.5 / dipoleFreq;

      var freqSlider = document.getElementById('dipole-frequency-slider');
      if (freqSlider) { freqSlider.value = 1.2; }
      var freqLabel = document.getElementById('dipole-frequency-label');
      if (freqLabel) { freqLabel.textContent = '1.2'; }

      var speedSlider = document.getElementById('wave-speed-slider');
      if (speedSlider) { speedSlider.value = 100; }
      var speedLabel = document.getElementById('wave-speed-label');
      if (speedLabel) { speedLabel.textContent = '100'; }

      draw();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas && canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
    }
  };

  /* ── Setup ────────────────────────────────────────────────── */
  function setup() {
    mount = document.getElementById('sim-mount');
    if (!mount) return;

    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    mount.appendChild(canvas);
    ctx = canvas.getContext('2d');

    function resize() {
      var rect = mount.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      W = Math.round(rect.width || 600);
      H = Math.max(320, Math.round(rect.height || 360));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    /* Dipole frequency slider */
    var freqSlider = document.getElementById('dipole-frequency-slider');
    if (freqSlider) {
      freqSlider.addEventListener('input', function () {
        dipoleFreq = parseFloat(freqSlider.value);
        emitInterval = 0.5 / dipoleFreq;
        var lbl = document.getElementById('dipole-frequency-label');
        if (lbl) { lbl.textContent = dipoleFreq.toFixed(1); }
        if (!running) { draw(); }
      });
    }

    /* Wave speed slider */
    var speedSlider = document.getElementById('wave-speed-slider');
    if (speedSlider) {
      speedSlider.addEventListener('input', function () {
        v_wave = parseInt(speedSlider.value, 10);
        var lbl = document.getElementById('wave-speed-label');
        if (lbl) { lbl.textContent = v_wave; }
        if (!running) { draw(); }
      });
    }

    /* Reset button */
    var resetBtn = document.getElementById('sim-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        window.SimAPI.reset();
      });
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
