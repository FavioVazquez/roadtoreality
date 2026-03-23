/* sim.js — 026 Michelson-Morley: three-mode narrative interferometer */
(function () {
  'use strict';
  var mount = document.getElementById('sim-mount');
  if (!mount) return;

  var canvas = document.createElement('canvas');
  mount.appendChild(canvas);
  canvas.style.display = 'block';
  canvas.style.width  = '100%';
  canvas.style.height = '100%';
  var ctx = canvas.getContext('2d');

  var W, H;
  var raf    = null;
  var t      = 0;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var currentMode = 1;
  var rotAngle    = 0;   // degrees, manual slider
  var armRatio    = 1.0; // arm2 / arm1, mode 3

  // ── Resize ──────────────────────────────────────────────────────
  function resize() {
    W = mount.clientWidth  || 680;
    H = mount.clientHeight || 380;
    canvas.width  = W;
    canvas.height = H;
  }

  // ── Color palette ───────────────────────────────────────────────
  var C_ARM1  = '#5285c8';
  var C_ARM2  = '#c85252';
  var C_BEAM  = '#ffee66';
  var C_NULL  = '#888888';
  var C_DIM   = 'rgba(255,255,255,0.3)';
  var C_TEXT  = 'rgba(255,255,255,0.85)';
  var C_MUTED = 'rgba(255,255,255,0.4)';

  // ── Drawing primitives ──────────────────────────────────────────
  function text(str, x, y, style, align, size) {
    ctx.fillStyle  = style  || C_TEXT;
    ctx.font       = (size  || 11) + 'px sans-serif';
    ctx.textAlign  = align  || 'left';
    ctx.fillText(str, x, y);
  }
  function boldText(str, x, y, style, align, size) {
    ctx.fillStyle  = style  || C_TEXT;
    ctx.font       = 'bold ' + (size || 11) + 'px sans-serif';
    ctx.textAlign  = align  || 'left';
    ctx.fillText(str, x, y);
  }

  // Draw the interferometer arms centered at (cx,cy), rotated by rad
  // arm1Length, arm2Length in px; beam progress 0–1 along arm1, separate for arm2
  function drawInterferometer(cx, cy, rotRad, arm1, arm2, beamT) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotRad);

    // Beam splitter diagonal
    ctx.strokeStyle = C_BEAM;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -10); ctx.lineTo(10, 10);
    ctx.stroke();

    // Arm 1 (horizontal — blue)
    ctx.strokeStyle = 'rgba(82,133,200,0.35)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(arm1, 0);
    ctx.stroke();
    // Mirror 1
    ctx.strokeStyle = C_ARM1;
    ctx.lineWidth   = 5;
    ctx.beginPath();
    ctx.moveTo(arm1, -14); ctx.lineTo(arm1, 14);
    ctx.stroke();
    boldText('M₁', arm1 + 8, 5, C_ARM1, 'left', 10);

    // Arm 2 (vertical — red)
    ctx.strokeStyle = 'rgba(200,82,82,0.35)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, -arm2);
    ctx.stroke();
    // Mirror 2
    ctx.strokeStyle = C_ARM2;
    ctx.lineWidth   = 5;
    ctx.beginPath();
    ctx.moveTo(-14, -arm2); ctx.lineTo(14, -arm2);
    ctx.stroke();
    boldText('M₂', 8, -arm2 - 6, C_ARM2, 'left', 10);

    // Animated beam — bounces along arm1 (blue dot)
    if (beamT !== null) {
      var b1 = (beamT % 1.0);
      var b1x = b1 < 0.5 ? b1 * 2 * arm1 : (1 - (b1 - 0.5) * 2) * arm1;
      ctx.beginPath();
      ctx.arc(b1x, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = C_ARM1;
      ctx.fill();

      var b2 = ((beamT + 0.25) % 1.0);
      var b2y = b2 < 0.5 ? -b2 * 2 * arm2 : -(1 - (b2 - 0.5) * 2) * arm2;
      ctx.beginPath();
      ctx.arc(0, b2y, 5, 0, Math.PI * 2);
      ctx.fillStyle = C_ARM2;
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw detector square at (dx, dy) showing either fringes or null
  function drawDetector(dx, dy, shift, isNull, label) {
    var dw = 34, dh = 60;
    if (isNull) {
      ctx.fillStyle = 'rgb(120,120,120)';
      ctx.fillRect(dx, dy - dh/2, dw, dh);
      ctx.strokeStyle = C_NULL;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(dx, dy - dh/2, dw, dh);
      boldText('NULL', dx + dw/2, dy + 6, '#ffffff', 'center', 9);
    } else {
      ctx.fillStyle = 'rgba(10,10,20,0.85)';
      ctx.fillRect(dx, dy - dh/2, dw, dh);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(dx, dy - dh/2, dw, dh);
      // Interference fringes
      for (var fi = 0; fi < 8; fi++) {
        var frac = fi / 8;
        var bright = 0.5 + 0.5 * Math.sin((frac + shift) * Math.PI * 5);
        ctx.fillStyle = 'rgba(255,255,255,' + bright.toFixed(2) + ')';
        ctx.fillRect(dx + 2, dy - dh/2 + 2 + fi * (dh-4)/8, dw - 4, (dh-4)/8 - 1);
      }
    }
    // Label below detector
    text('Detector', dx + dw/2, dy + dh/2 + 12, C_MUTED, 'center', 9);
    if (label) text(label, dx + dw/2, dy + dh/2 + 23, isNull ? '#aaffaa' : '#ffaaaa', 'center', 9);
  }

  // ── MODE 1: The Setup ──────────────────────────────────────────
  // Shows the interferometer schematic with beam animation and component labels
  function drawMode1() {
    var cx = W * 0.42, cy = H * 0.48;
    var ARM = Math.min(W, H) * 0.26;
    var beamT = (t * 0.4) % 1.0;

    drawInterferometer(cx, cy, 0, ARM, ARM, beamT);

    // Light source
    ctx.beginPath();
    ctx.arc(cx - ARM * 0.5, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = C_BEAM;
    ctx.fill();
    // Source ray to splitter
    ctx.strokeStyle = 'rgba(255,238,102,0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4,3]);
    ctx.beginPath();
    ctx.moveTo(cx - ARM * 0.5 + 9, cy);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    text('Light', cx - ARM * 0.5, cy - 16, C_BEAM, 'center', 10);
    text('source', cx - ARM * 0.5, cy - 6, C_BEAM, 'center', 10);

    // Detector below splitter
    var detX = cx - 17, detY = cy + ARM * 0.55;
    ctx.strokeStyle = 'rgba(255,238,102,0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4,3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy + 10);
    ctx.lineTo(cx, detY - 30);
    ctx.stroke();
    ctx.setLineDash([]);
    drawDetector(detX, detY, (t * 0.1) % 1, false, '');

    // Beam splitter label
    text('Beam', cx + 12, cy - 2, C_BEAM, 'left', 10);
    text('splitter', cx + 12, cy + 10, C_BEAM, 'left', 10);

    // Arm labels with path lengths
    text('Arm 1', cx + ARM * 0.45, cy + 16, C_ARM1, 'center', 10);
    text('(horizontal)', cx + ARM * 0.45, cy + 27, C_ARM1, 'center', 9);
    text('Arm 2', cx + 16, cy - ARM * 0.50, C_ARM2, 'left', 10);
    text('(vertical)', cx + 16, cy - ARM * 0.50 + 12, C_ARM2, 'left', 9);

    // Right side explanation
    var rx = W * 0.74, ry = H * 0.12;
    boldText('How it works', rx, ry, C_TEXT, 'left', 12);
    var steps = [
      '1. Light enters and hits the beam splitter.',
      '2. Half goes right → bounces off M₁.',
      '3. Half goes up → bounces off M₂.',
      '4. Both beams recombine at detector.',
      '5. If path lengths differ, fringes appear.',
      '   If paths are equal → null result.'
    ];
    var colors = [C_MUTED, C_ARM1, C_ARM2, C_MUTED, C_MUTED, '#aaffaa'];
    steps.forEach(function(s, i) {
      text(s, rx, ry + 18 + i * 16, colors[i], 'left', 10);
    });
  }

  // ── MODE 2: Expected vs Found ──────────────────────────────────
  // Shows what the aether theory predicted (fringe shift on rotation)
  // vs what Michelson actually measured (zero shift at every angle)
  function drawMode2() {
    var autoRot = (rotAngle !== 0) ? rotAngle * Math.PI / 180 : t * 0.25;
    var ARM     = Math.min(W, H) * 0.20;
    var cx      = W * 0.28, cy = H * 0.48;

    // Aether wind arrow
    ctx.save();
    ctx.translate(cx, cy);
    var windLen = ARM * 1.1;
    ctx.strokeStyle = 'rgba(100,200,255,0.35)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(-windLen, 0); ctx.lineTo(windLen, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    // Arrowhead
    ctx.fillStyle = 'rgba(100,200,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(windLen, 0);
    ctx.lineTo(windLen - 10, -5);
    ctx.lineTo(windLen - 10,  5);
    ctx.closePath();
    ctx.fill();
    text('Aether wind (Earth\'s orbital motion)', -windLen, -12, 'rgba(100,200,255,0.4)', 'left', 9);
    ctx.restore();

    drawInterferometer(cx, cy, autoRot, ARM, ARM, t * 0.4);

    // Right panel: two comparison graphs
    var gx = W * 0.52, gw = W * 0.44;
    var topY = H * 0.10, botY = H * 0.55;
    var gh   = H * 0.32;

    // Graph background helper
    function drawGraphBox(gY, title, color) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(gx, gY, gw, gh);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(gx, gY, gw, gh);
      boldText(title, gx + 6, gY + 14, color, 'left', 10);
      // Zero line
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(gx + 4, gY + gh / 2);
      ctx.lineTo(gx + gw - 4, gY + gh / 2);
      ctx.stroke();
      text('0', gx - 10, gY + gh / 2 + 4, C_MUTED, 'right', 9);
      text('fringe shift', gx + gw / 2, gY + gh - 4, C_MUTED, 'center', 9);
      text('↑ Δ', gx + 2, gY + 20, C_MUTED, 'left', 9);
    }

    // Top graph: PREDICTED fringe shift (oscillates with apparatus angle)
    drawGraphBox(topY, 'What aether theory predicted', '#ffaaaa');
    ctx.beginPath();
    ctx.strokeStyle = '#ff6666';
    ctx.lineWidth = 2;
    for (var xi = 0; xi < gw - 8; xi++) {
      var angle  = (xi / (gw - 8)) * Math.PI * 2;
      var shift  = Math.sin(angle * 2 + autoRot * 2) * (gh * 0.35);
      var px2    = gx + 4 + xi;
      var py2    = topY + gh / 2 - shift;
      if (xi === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
    }
    ctx.stroke();
    // Current angle marker on top graph
    var markerX = gx + 4 + ((autoRot % (Math.PI*2)) / (Math.PI*2)) * (gw-8);
    var markerShift = Math.sin(autoRot * 2 + autoRot * 2) * (gh * 0.35);
    ctx.beginPath();
    ctx.arc(markerX, topY + gh/2 - markerShift, 5, 0, Math.PI*2);
    ctx.fillStyle = '#ff6666';
    ctx.fill();
    text('← fringe shift as apparatus rotates', gx + 6, topY + gh - 14, '#ffaaaa', 'left', 9);

    // Bottom graph: MEASURED fringe shift (flat zero line = null result)
    drawGraphBox(botY, 'What Michelson actually measured', '#aaffaa');
    ctx.beginPath();
    ctx.strokeStyle = '#66ff88';
    ctx.lineWidth   = 3;
    ctx.moveTo(gx + 4, botY + gh/2);
    ctx.lineTo(gx + gw - 4, botY + gh/2);
    ctx.stroke();
    // Marker at current angle — stays at zero
    var markerX2 = gx + 4 + ((autoRot % (Math.PI*2)) / (Math.PI*2)) * (gw-8);
    ctx.beginPath();
    ctx.arc(markerX2, botY + gh/2, 5, 0, Math.PI*2);
    ctx.fillStyle = '#66ff88';
    ctx.fill();
    boldText('Zero fringe shift — at every angle', gx + 6, botY + gh - 14, '#aaffaa', 'left', 10);

    // Verdict box
    var vx = gx, vy = botY + gh + 10;
    ctx.fillStyle = 'rgba(100,255,120,0.08)';
    ctx.fillRect(vx, vy, gw, 26);
    boldText('The null result: the aether does not exist.', vx + 8, vy + 17, '#aaffaa', 'left', 11);
  }

  // ── MODE 3: Arm Ratio — Interferometer Sensitivity ─────────────
  // Shows how equal arms → null, unequal arms → visible fringes
  // Teaches HOW the interferometer works as a measuring tool
  function drawMode3() {
    var ARM1 = Math.min(W, H) * 0.24;
    var ARM2 = ARM1 * armRatio;
    var cx   = W * 0.35, cy = H * 0.50;

    drawInterferometer(cx, cy, 0, ARM1, ARM2, null);

    // Arm length labels showing actual path difference
    var pathDiff = 2 * (ARM2 - ARM1); // round-trip difference in display px (visual only)
    text('L₁ (fixed)', cx + ARM1 * 0.5, cy + 16, C_ARM1, 'center', 10);
    text('L₂ = ' + armRatio.toFixed(3) + ' × L₁', cx + 18, cy - ARM2 * 0.55, C_ARM2, 'left', 10);

    // Path difference label
    var pdText = Math.abs(armRatio - 1.0) < 0.003
      ? 'ΔL = 0  →  null result'
      : 'ΔL = ' + ((armRatio - 1).toFixed(3)) + ' × L₁';
    boldText(pdText, cx - ARM1 * 0.3, cy + ARM1 * 0.7 + 14,
      Math.abs(armRatio - 1.0) < 0.003 ? '#aaffaa' : '#ffaa66', 'center', 11);

    // Detector at bottom
    var detX = cx - 17, detY = cy + ARM1 * 0.70;
    var isNull = Math.abs(armRatio - 1.0) < 0.003;
    var fringeShift = (armRatio - 1.0) * 12;
    drawDetector(detX, detY, fringeShift, isNull, isNull ? 'Equal arms' : 'Unequal arms');

    // Right side explanation
    var rx = W * 0.65, ry = H * 0.10;
    boldText('Interferometer sensitivity', rx, ry, C_TEXT, 'left', 12);

    var lines = [
      { t: 'When both arms are equal (ratio 1.000):', c: C_MUTED },
      { t: '  Both beams travel the same total distance.', c: C_MUTED },
      { t: '  They recombine in phase → no fringes.', c: '#aaffaa' },
      { t: '', c: C_MUTED },
      { t: 'When one arm is longer:', c: C_MUTED },
      { t: '  One beam travels a longer path.', c: C_MUTED },
      { t: '  Phase difference → bright/dark fringes appear.', c: '#ffaa66' },
      { t: '', c: C_MUTED },
      { t: 'Michelson could detect a shift of 0.01 fringes.', c: C_MUTED },
      { t: 'Aether theory predicted ~0.4 fringes.', c: '#ff8888' },
      { t: 'They measured: 0.00 fringes.', c: '#aaffaa' }
    ];
    lines.forEach(function(l, i) {
      if (l.t) text(l.t, rx, ry + 20 + i * 15, l.c, 'left', 10);
    });

    // Sensitivity indicator
    var sensY = ry + 20 + lines.length * 15 + 8;
    var expectedShift = 0.4; // theoretical
    boldText('Expected: ~0.4λ  |  Measured: 0.00λ', rx, sensY, C_MUTED, 'left', 10);
  }

  // ── Main draw ───────────────────────────────────────────────────
  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    if      (currentMode === 1) drawMode1();
    else if (currentMode === 2) drawMode2();
    else                        drawMode3();

    if (running && !reduced) {
      t += 0.022;
      raf = requestAnimationFrame(drawFrame);
    }
  }

  function drawStatic() { drawFrame(); }

  // ── Controls wiring ─────────────────────────────────────────────
  var controls    = document.getElementById('sim-controls-026');
  var rotSliderRow = controls ? controls.querySelector('.row-rotation')  : null;
  var armSliderRow = controls ? controls.querySelector('.row-arm-ratio') : null;
  var rotSlider    = document.getElementById('rot-slider');
  var armSlider    = document.getElementById('arm-slider');
  var rotValEl     = document.getElementById('rot-slider-val');
  var armValEl     = document.getElementById('arm-slider-val');
  var hintEl       = document.getElementById('mode-hint');

  var HINTS = {
    1: 'Watch the light beam bounce between the two mirrors and recombine at the detector.',
    2: 'The apparatus rotates continuously. Top graph = what aether theory predicted. Bottom = what was actually measured.',
    3: 'Change the arm ratio. Equal arms (1.000) = null result. Any difference creates fringes.'
  };

  function setMode(m) {
    currentMode = m;
    if (rotSliderRow) rotSliderRow.style.display = (m === 2) ? 'flex' : 'none';
    if (armSliderRow) armSliderRow.style.display = (m === 3) ? 'flex' : 'none';
    if (hintEl) hintEl.textContent = HINTS[m] || '';
    if (controls) {
      controls.querySelectorAll('.mode-btn').forEach(function(btn) {
        btn.classList.toggle('active', parseInt(btn.dataset.mode, 10) === m);
      });
    }
    if (!running) drawStatic();
  }

  if (rotSlider) {
    rotSlider.addEventListener('input', function() {
      rotAngle = parseFloat(rotSlider.value);
      if (rotValEl) rotValEl.textContent = Math.round(rotAngle) + '°';
      if (!running) drawStatic();
    });
  }
  if (armSlider) {
    armSlider.addEventListener('input', function() {
      armRatio = parseFloat(armSlider.value);
      if (armValEl) armValEl.textContent = armRatio.toFixed(3);
      if (!running) drawStatic();
    });
  }
  if (controls) {
    controls.querySelectorAll('.mode-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        setMode(parseInt(btn.dataset.mode, 10));
      });
    });
  }

  resize();
  window.addEventListener('resize', function() { resize(); if (!running) drawStatic(); });

  window.SimAPI = {
    start:   function() { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause:   function() { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset:   function() { window.SimAPI.pause(); t = 0; rotAngle = 0; armRatio = 1.0; if (rotSlider) rotSlider.value = 0; if (armSlider) armSlider.value = 1.0; if (rotValEl) rotValEl.textContent = '0°'; if (armValEl) armValEl.textContent = '1.000'; setMode(1); },
    destroy: function() { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  setMode(1);
}());
