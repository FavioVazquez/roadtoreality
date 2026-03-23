/* ============================================================
   sim.js — Stop 026: The Michelson-Morley Experiment
   THREE interactive modes on a single canvas.

   Mode 1 — Expected vs. Found:
     Split-screen: left = predicted fringe shift (sine wave whose
     amplitude varies with rotation angle), right = null result
     (flat line). Rotation slider modulates predicted amplitude.

   Mode 2 — Speed-of-light race:
     Two light beams travel along perpendicular arms. Both ALWAYS
     arrive simultaneously regardless of rotation. Null result
     is unambiguous. Apparatus rotates with rotation slider.

   Mode 3 — Interferometer fringe pattern:
     Per-pixel fringe intensity via Math.cos(2*PI*pathDiff/lambda).
     Equal arms (armRatio=1.0) gives null result (uniform fringes).
     Off-center gives alternating dark/bright fringes.

   Controls:
     mode-1-btn, mode-2-btn, mode-3-btn (tab switching)
     rotation-slider (modes 1 and 2)
     arm-ratio-slider (mode 3)
   ============================================================ */
(function () {
  'use strict';

  /* ── Top-level state ──────────────────────────────────────── */
  var mount, canvas, ctx, dpr, W, H;
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var currentMode = 1;     /* 1, 2, or 3 */
  var rotationAngle = 0;   /* degrees 0–360 */
  var armRatio = 1.0;      /* arm length ratio L1/L2, 0.5–2.0 */
  var t = 0;
  var racePhase = 0.0;     /* 0.0–1.0, for Mode 2 animated beams */

  /* ── Mode tab switching ───────────────────────────────────── */
  var btn1, btn2, btn3;

  function setMode(m) {
    currentMode = m;
    if (btn1) { btn1.style.opacity = (m === 1) ? '1' : '0.45'; }
    if (btn2) { btn2.style.opacity = (m === 2) ? '1' : '0.45'; }
    if (btn3) { btn3.style.opacity = (m === 3) ? '1' : '0.45'; }
    if (!running) { draw(); }
  }

  /* ── MODE 1: Expected vs. Found ─────────────────────────────
     Left panel: predicted fringe shift (aether hypothesis).
     Right panel: actual observed result — flat, no shift.
  ──────────────────────────────────────────────────────────── */
  function drawModeExpected() {
    var splitX = W * 0.5;
    var divColor = 'rgba(180,180,180,0.2)';

    /* Panel background tints */
    ctx.save();
    ctx.fillStyle = 'rgba(82,133,200,0.04)';
    ctx.fillRect(0, 0, splitX, H);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(200,80,80,0.04)';
    ctx.fillRect(splitX, 0, W - splitX, H);
    ctx.restore();

    /* Divider line */
    ctx.save();
    ctx.strokeStyle = divColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, H);
    ctx.stroke();
    ctx.restore();

    /* ── Left sub-panel: expected fringe shift ── */
    var lcx = splitX * 0.5;
    var lcy = H * 0.52;
    var lMaxAmp = H * 0.22;

    /* Panel title */
    ctx.save();
    ctx.font = 'bold 12px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(82,133,200,0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Expected (Aether Hypothesis)', lcx, 10);
    ctx.restore();

    /* Rotation readout */
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,180,180,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Rotation: ' + rotationAngle.toFixed(0) + '\u00b0', lcx, 28);
    ctx.restore();

    /* Axis label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,180,180,0.4)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Fringe position', 6, lcy);
    ctx.restore();

    /* Horizontal axis line */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,180,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, lcy);
    ctx.lineTo(splitX - 16, lcy);
    ctx.stroke();
    ctx.restore();

    /* Predicted amplitude: two-lobe 2-cycle function of rotation angle */
    var rad = rotationAngle * Math.PI / 180;
    var amplitude = 0.25 + 0.25 * Math.cos(2 * rad);

    /* Draw the predicted fringe shift as a sine wave */
    var waveLeft = 16;
    var waveRight = splitX - 16;
    var waveWidth = waveRight - waveLeft;

    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    var first = true;
    for (var px = 0; px <= waveWidth; px += 2) {
      var xi = waveLeft + px;
      var yi = lcy + amplitude * lMaxAmp * Math.sin(px * 2 * Math.PI / waveWidth * 2.5);
      if (first) { ctx.moveTo(xi, yi); first = false; }
      else { ctx.lineTo(xi, yi); }
    }
    ctx.stroke();
    ctx.restore();

    /* Amplitude label */
    var ampPct = (amplitude * 100).toFixed(0);
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(82,133,200,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('shift amplitude: ' + ampPct + '%', lcx, H - 8);
    ctx.restore();

    /* ── Right sub-panel: observed null result ── */
    var rcx = splitX + (W - splitX) * 0.5;
    var rcy = H * 0.52;

    /* Panel title */
    ctx.save();
    ctx.font = 'bold 12px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,160,80,0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Observed (Actual Result)', rcx, 10);
    ctx.restore();

    /* Rotation readout (same angle — no effect) */
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,180,180,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Rotation: ' + rotationAngle.toFixed(0) + '\u00b0', rcx, 28);
    ctx.restore();

    /* Axis line */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,180,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(splitX + 16, rcy);
    ctx.lineTo(W - 16, rcy);
    ctx.stroke();
    ctx.restore();

    /* Flat line — zero shift */
    ctx.save();
    ctx.strokeStyle = 'rgba(200,160,80,0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(splitX + 16, rcy);
    ctx.lineTo(W - 16, rcy);
    ctx.stroke();
    ctx.restore();

    /* No fringe shift label */
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,160,80,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('No fringe shift detected', rcx, H - 8);
    ctx.restore();

    /* Null result annotation */
    ctx.save();
    ctx.font = 'bold 13px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,160,80,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u0394 = 0', rcx, rcy + 28);
    ctx.restore();

    /* Instruction */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,180,180,0.35)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Move the rotation slider \u2014 the right panel never changes', W * 0.5, H - 26);
    ctx.restore();
  }

  /* ── MODE 2: Speed-of-light race ─────────────────────────────
     Two light dots race along perpendicular arms.
     Both always arrive simultaneously — the null result.
  ──────────────────────────────────────────────────────────── */
  function drawModeRace() {
    var cx = W * 0.5;
    var cy = H * 0.5;
    var armLen = Math.min(W, H) * 0.32;

    /* Title */
    ctx.save();
    ctx.font = 'bold 12px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(82,133,200,0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Speed-of-Light Race — Both Beams Always Arrive Together', W * 0.5, 8);
    ctx.restore();

    /* Rotation label */
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,180,180,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Rotation: ' + rotationAngle.toFixed(0) + '\u00b0', W * 0.5, 26);
    ctx.restore();

    var rot = rotationAngle * Math.PI / 180;

    /* Save and apply rotation transform around apparatus center */
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    /* Arm A — horizontal (to the right) */
    ctx.strokeStyle = 'rgba(82,133,200,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(armLen, 0);
    ctx.stroke();

    /* Mirror A */
    ctx.strokeStyle = 'rgba(82,133,200,0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(armLen, -14);
    ctx.lineTo(armLen, 14);
    ctx.stroke();

    /* Arm B — vertical (upward) */
    ctx.strokeStyle = 'rgba(200,160,80,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -armLen);
    ctx.stroke();

    /* Mirror B */
    ctx.strokeStyle = 'rgba(200,160,80,0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-14, -armLen);
    ctx.lineTo(14, -armLen);
    ctx.stroke();

    /* Beam splitter at origin */
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(12, 12);
    ctx.stroke();

    /* ── Animated dots — both use racePhase ── */
    /* Dot A travels: 0→armLen (phase 0→0.5), then armLen→0 (phase 0.5→1.0) */
    var posA;
    if (racePhase < 0.5) {
      posA = racePhase * 2 * armLen;
    } else {
      posA = (1.0 - racePhase) * 2 * armLen;
    }

    /* Dot B travels: 0→-armLen (phase 0→0.5), then -armLen→0 (phase 0.5→1.0) */
    var posB;
    if (racePhase < 0.5) {
      posB = -(racePhase * 2 * armLen);
    } else {
      posB = -((1.0 - racePhase) * 2 * armLen);
    }

    /* Draw dot A (blue) along x-axis */
    ctx.fillStyle = 'rgba(82,133,200,0.95)';
    ctx.beginPath();
    ctx.arc(posA, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    /* Draw dot B (gold) along y-axis */
    ctx.fillStyle = 'rgba(200,160,80,0.95)';
    ctx.beginPath();
    ctx.arc(0, posB, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); /* end rotation transform */

    /* "Simultaneous arrival" flash when dots are near center */
    var nearCenter = (racePhase < 0.04 || racePhase > 0.96);
    if (nearCenter) {
      ctx.save();
      var flashAlpha = 0.0;
      if (racePhase < 0.04) {
        flashAlpha = 1.0 - racePhase / 0.04;
      } else {
        flashAlpha = (racePhase - 0.96) / 0.04;
      }
      ctx.font = 'bold 13px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,' + (flashAlpha * 0.9) + ')';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SIMULTANEOUS ARRIVAL', cx, cy + armLen * 0.62);
      ctx.restore();
    }

    /* Source (light source to the left of center) */
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.fillStyle = 'rgba(255,240,100,0.85)';
    ctx.beginPath();
    ctx.arc(-armLen * 0.55, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* Bottom label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,180,180,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Rotate the apparatus \u2014 both beams always arrive together', W * 0.5, H - 6);
    ctx.restore();
  }

  /* ── MODE 3: Interferometer fringe pattern ──────────────────
     Left: schematic diagram of interferometer.
     Right: per-pixel fringe pattern computed from path difference.
  ──────────────────────────────────────────────────────────── */
  function drawModeInterferometer() {
    var schematicRight = W * 0.55;
    var fringeLeft = W * 0.55;

    /* ── Left: schematic ── */
    var sCx = schematicRight * 0.5;
    var sCy = H * 0.52;
    var sArm = Math.min(schematicRight * 0.32, H * 0.28);

    /* Title */
    ctx.save();
    ctx.font = 'bold 11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(82,133,200,0.8)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Interferometer Schematic', sCx, 8);
    ctx.restore();

    /* Source dot (light source) */
    ctx.save();
    ctx.fillStyle = 'rgba(255,240,100,0.9)';
    ctx.beginPath();
    ctx.arc(sCx - sArm * 0.85, sCy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* Beam to beam splitter */
    ctx.save();
    ctx.strokeStyle = 'rgba(255,240,100,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sCx - sArm * 0.85 + 8, sCy);
    ctx.lineTo(sCx, sCy);
    ctx.stroke();
    ctx.restore();

    /* Beam splitter */
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sCx - 10, sCy - 10);
    ctx.lineTo(sCx + 10, sCy + 10);
    ctx.stroke();
    ctx.restore();

    /* Arm 1 (horizontal, length L1 = armRatio * L_base) */
    var L_base_px = sArm;
    var L1 = L_base_px * armRatio;
    var L2 = L_base_px;

    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sCx, sCy);
    ctx.lineTo(sCx + L1, sCy);
    ctx.stroke();
    ctx.restore();

    /* Mirror 1 */
    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sCx + L1, sCy - 12);
    ctx.lineTo(sCx + L1, sCy + 12);
    ctx.stroke();
    ctx.restore();

    /* L1 label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(82,133,200,0.75)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('L\u2081 = ' + armRatio.toFixed(2) + ' L', sCx + L1 * 0.5, sCy - 4);
    ctx.restore();

    /* Arm 2 (vertical, length L2) */
    ctx.save();
    ctx.strokeStyle = 'rgba(200,160,80,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sCx, sCy);
    ctx.lineTo(sCx, sCy - L2);
    ctx.stroke();
    ctx.restore();

    /* Mirror 2 */
    ctx.save();
    ctx.strokeStyle = 'rgba(200,160,80,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sCx - 12, sCy - L2);
    ctx.lineTo(sCx + 12, sCy - L2);
    ctx.stroke();
    ctx.restore();

    /* L2 label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,160,80,0.75)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('L\u2082 = L', sCx + 5, sCy - L2 * 0.5);
    ctx.restore();

    /* Recombination arrow (down from splitter to screen) */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,180,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(sCx, sCy);
    ctx.lineTo(sCx, sCy + sArm * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* Screen symbol */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,180,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sCx - 14, sCy + sArm * 0.5);
    ctx.lineTo(sCx + 14, sCy + sArm * 0.5);
    ctx.stroke();
    ctx.restore();

    /* Screen label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,180,180,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('screen', sCx, sCy + sArm * 0.5 + 4);
    ctx.restore();

    /* ── Right: fringe pattern computed per pixel row ── */
    var pathDiff = 2 * (L1 - L2);
    var lambda = 40; /* effective wavelength in pixel units */

    /* Draw fringe pattern by scanlines */
    for (var py = 0; py < H; py++) {
      var intensity = 0.5 * (1 + Math.cos(2 * Math.PI * pathDiff / lambda + py * 0.1));
      var g = Math.round(intensity * 220);
      ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
      ctx.fillRect(fringeLeft, py, W - fringeLeft, 1);
    }

    /* Fringe panel overlay frame */
    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(fringeLeft, 0, W - fringeLeft, H);
    ctx.restore();

    /* Arm ratio label on fringe panel */
    ctx.save();
    ctx.font = 'bold 11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,180,180,0.8)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Arm ratio: ' + armRatio.toFixed(2), fringeLeft + (W - fringeLeft) * 0.5, 8);
    ctx.restore();

    /* Null result label (shown when armRatio is very close to 1.0) */
    if (Math.abs(armRatio - 1.0) < 0.05) {
      ctx.save();
      ctx.font = '11px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(200,160,80,0.85)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Equal arms: null result', fringeLeft + (W - fringeLeft) * 0.5, H * 0.5);
      ctx.restore();
    }

    /* Path diff label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,180,180,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('\u0394L = ' + pathDiff.toFixed(1) + ' px', fringeLeft + (W - fringeLeft) * 0.5, H - 6);
    ctx.restore();

    /* Schematic divider */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,180,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(schematicRight, 0);
    ctx.lineTo(schematicRight, H);
    ctx.stroke();
    ctx.restore();
  }

  /* ── Main draw function ────────────────────────────────────── */
  function draw() {
    if (!W || !H) return;

    /* Clear and fill background */
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'oklch(0.09 0.025 285)';
    ctx.fillRect(0, 0, W, H);

    /* Branch on mode */
    if (currentMode === 1) {
      drawModeExpected();
    } else if (currentMode === 2) {
      drawModeRace();
    } else if (currentMode === 3) {
      drawModeInterferometer();
    }
  }

  /* ── Animation loop ───────────────────────────────────────── */
  function loop() {
    if (!running) return;
    t += 0.016;
    racePhase = (racePhase + 0.008) % 1.0;
    draw();
    raf = requestAnimationFrame(loop);
  }

  /* ── SimAPI ───────────────────────────────────────────────── */
  window.SimAPI = {
    start: function () {
      if (running) return;
      running = true;
      var playBtn = document.getElementById('sim-play-btn');
      if (playBtn) { playBtn.dataset.state = 'playing'; playBtn.innerHTML = '&#9646;&#9646; Pause'; }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) { dot.classList.add('is-running'); }
      if (!reduced) { loop(); } else { draw(); }
    },
    pause: function () {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      var playBtn = document.getElementById('sim-play-btn');
      if (playBtn) { playBtn.dataset.state = 'paused'; playBtn.innerHTML = '&#9654; Play'; }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) { dot.classList.remove('is-running'); }
    },
    reset: function () {
      window.SimAPI.pause();
      currentMode = 1;
      rotationAngle = 0;
      armRatio = 1.0;
      racePhase = 0;
      t = 0;

      var rotSlider = document.getElementById('rotation-slider');
      if (rotSlider) { rotSlider.value = 0; }
      var rotLabel = document.getElementById('rotation-label');
      if (rotLabel) { rotLabel.textContent = '0\u00b0'; }

      var arSlider = document.getElementById('arm-ratio-slider');
      if (arSlider) { arSlider.value = 1.0; }
      var arLabel = document.getElementById('arm-ratio-label');
      if (arLabel) { arLabel.textContent = '1.00'; }

      setMode(1);
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
      H = Math.max(340, Math.round(rect.height || 380));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    /* Mode tab buttons */
    btn1 = document.getElementById('mode-1-btn');
    btn2 = document.getElementById('mode-2-btn');
    btn3 = document.getElementById('mode-3-btn');
    if (btn1) { btn1.addEventListener('click', function () { setMode(1); }); }
    if (btn2) { btn2.addEventListener('click', function () { setMode(2); }); }
    if (btn3) { btn3.addEventListener('click', function () { setMode(3); }); }

    /* Rotation slider */
    var rotSlider = document.getElementById('rotation-slider');
    if (rotSlider) {
      rotSlider.addEventListener('input', function () {
        rotationAngle = parseFloat(rotSlider.value);
        var lbl = document.getElementById('rotation-label');
        if (lbl) { lbl.textContent = rotationAngle.toFixed(0) + '\u00b0'; }
        if (!running) { draw(); }
      });
    }

    /* Arm ratio slider */
    var arSlider = document.getElementById('arm-ratio-slider');
    if (arSlider) {
      arSlider.addEventListener('input', function () {
        armRatio = parseFloat(arSlider.value);
        var lbl = document.getElementById('arm-ratio-label');
        if (lbl) { lbl.textContent = armRatio.toFixed(2); }
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

    /* Initial state */
    setMode(1);
    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

}());
