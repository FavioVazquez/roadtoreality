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
  var raf     = null;
  var t       = 0;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var currentMode = 1;
  var rotAngle    = 0;
  var armRatio    = 1.0;

  function resize() {
    W = mount.clientWidth  || 680;
    H = mount.clientHeight || 380;
    canvas.width  = W;
    canvas.height = H;
  }

  var C_ARM1  = '#5285c8';
  var C_ARM2  = '#c85252';
  var C_BEAM  = '#ffee66';
  var C_NULL  = '#888888';
  var C_TEXT  = 'rgba(255,255,255,0.85)';
  var C_MUTED = 'rgba(255,255,255,0.45)';

  function t_(str, x, y, color, align, size) {
    ctx.fillStyle = color || C_TEXT;
    ctx.font      = (size || 12) + 'px sans-serif';
    ctx.textAlign = align || 'left';
    ctx.fillText(str, x, y);
  }
  function b_(str, x, y, color, align, size) {
    ctx.fillStyle = color || C_TEXT;
    ctx.font      = 'bold ' + (size || 12) + 'px sans-serif';
    ctx.textAlign = align || 'left';
    ctx.fillText(str, x, y);
  }

  // ── Interferometer schematic ─────────────────────────────────────
  function drawInterferometer(cx, cy, rotRad, arm1, arm2, beamT, showLabels) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotRad);

    // Arms
    ctx.strokeStyle = 'rgba(82,133,200,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(arm1, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(200,82,82,0.4)';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -arm2); ctx.stroke();

    // Mirrors
    ctx.strokeStyle = C_ARM1; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(arm1, -13); ctx.lineTo(arm1, 13); ctx.stroke();
    ctx.strokeStyle = C_ARM2;
    ctx.beginPath(); ctx.moveTo(-13, -arm2); ctx.lineTo(13, -arm2); ctx.stroke();

    // Beam splitter
    ctx.strokeStyle = C_BEAM; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(9, 9); ctx.stroke();

    if (showLabels) {
      b_('M₁', arm1 + 7, 4, C_ARM1, 'left', 11);
      b_('M₂', 7, -arm2 - 5, C_ARM2, 'left', 11);
    }

    // Animated beam dots
    if (beamT !== null) {
      var b1 = beamT % 1;
      var b1x = b1 < 0.5 ? b1 * 2 * arm1 : (1 - (b1 - 0.5) * 2) * arm1;
      ctx.beginPath(); ctx.arc(b1x, 0, 5, 0, Math.PI*2);
      ctx.fillStyle = C_ARM1; ctx.fill();
      var b2 = (beamT + 0.25) % 1;
      var b2y = b2 < 0.5 ? -b2 * 2 * arm2 : -(1 - (b2-0.5) * 2) * arm2;
      ctx.beginPath(); ctx.arc(0, b2y, 5, 0, Math.PI*2);
      ctx.fillStyle = C_ARM2; ctx.fill();
    }
    ctx.restore();
  }

  // ── Detector box ─────────────────────────────────────────────────
  function drawDetector(dx, dy, shift, isNull, sublabel) {
    var dw = 32, dh = 56;
    if (isNull) {
      ctx.fillStyle = 'rgb(120,120,120)';
      ctx.fillRect(dx - dw/2, dy - dh/2, dw, dh);
      ctx.strokeStyle = '#aaaaaa'; ctx.lineWidth = 1.5;
      ctx.strokeRect(dx - dw/2, dy - dh/2, dw, dh);
      b_('NULL', dx, dy + 4, '#ffffff', 'center', 9);
    } else {
      ctx.fillStyle = 'rgba(10,10,25,0.9)';
      ctx.fillRect(dx - dw/2, dy - dh/2, dw, dh);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
      ctx.strokeRect(dx - dw/2, dy - dh/2, dw, dh);
      for (var fi = 0; fi < 8; fi++) {
        var bright = 0.5 + 0.5 * Math.sin((fi / 8 + shift) * Math.PI * 5);
        ctx.fillStyle = 'rgba(255,255,255,' + bright.toFixed(2) + ')';
        ctx.fillRect(dx - dw/2 + 2, dy - dh/2 + 2 + fi * (dh-4)/8, dw-4, (dh-4)/8 - 1);
      }
    }
    t_('Detector', dx, dy + dh/2 + 13, C_MUTED, 'center', 10);
    if (sublabel) t_(sublabel, dx, dy + dh/2 + 25, isNull ? '#aaffaa' : '#ffaa66', 'center', 10);
  }

  // ── MODE 1: The Setup ────────────────────────────────────────────
  function drawMode1() {
    var ARM = Math.min(W * 0.24, H * 0.34);
    var cx  = W * 0.30, cy = H * 0.46;
    var beamT = (t * 0.4) % 1;

    drawInterferometer(cx, cy, 0, ARM, ARM, beamT, true);

    // Light source
    ctx.beginPath(); ctx.arc(cx - ARM * 0.55, cy, 8, 0, Math.PI*2);
    ctx.fillStyle = C_BEAM; ctx.fill();
    ctx.strokeStyle = 'rgba(255,238,102,0.4)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(cx - ARM * 0.55 + 8, cy); ctx.lineTo(cx, cy); ctx.stroke();
    ctx.setLineDash([]);
    t_('Source', cx - ARM * 0.55, cy - 14, C_BEAM, 'center', 11);

    // Beam splitter label (right side of splitter, not overlapping arms)
    t_('Splitter', cx + 12, cy + 14, C_BEAM, 'left', 11);

    // Arm labels — positioned mid-arm, below/beside
    t_('Arm 1', cx + ARM * 0.42, cy + 14, C_ARM1, 'center', 11);
    t_('Arm 2', cx + 14, cy - ARM * 0.55, C_ARM2, 'left', 11);

    // Detector below splitter
    var detY = cy + ARM * 0.65;
    ctx.strokeStyle = 'rgba(255,238,102,0.35)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx, detY - 28); ctx.stroke();
    ctx.setLineDash([]);
    drawDetector(cx, detY, (t * 0.1) % 1, false, '');

    // Right panel — explanation list
    var rx = W * 0.56, ry = H * 0.08, maxW = W - rx - 10;
    b_('How it works', rx, ry, C_TEXT, 'left', 13);
    var steps = [
      ['1. Light hits the beam splitter.', C_MUTED],
      ['2. Half travels right → bounces off M₁.', C_ARM1],
      ['3. Half travels up → bounces off M₂.', C_ARM2],
      ['4. Beams recombine at the detector.', C_MUTED],
      ['5. Equal paths → uniform (null result).', '#aaffaa'],
      ['   Unequal paths → fringe pattern.', '#ffaa66']
    ];
    steps.forEach(function(s, i) {
      t_(s[0], rx, ry + 22 + i * 19, s[1], 'left', 11);
    });
  }

  // ── MODE 2: Expected vs Found ────────────────────────────────────
  function drawMode2() {
    var autoRot = (rotAngle !== 0) ? rotAngle * Math.PI / 180 : t * 0.25;
    var ARM     = Math.min(W * 0.18, H * 0.26);
    var cx      = W * 0.20, cy = H * 0.50;

    // Aether wind arrow (in world space)
    var wLen = ARM * 1.3;
    ctx.strokeStyle = 'rgba(100,200,255,0.3)'; ctx.lineWidth = 1;
    ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(cx - wLen, cy); ctx.lineTo(cx + wLen, cy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(100,200,255,0.3)';
    ctx.beginPath(); ctx.moveTo(cx + wLen, cy); ctx.lineTo(cx + wLen - 9, cy - 5); ctx.lineTo(cx + wLen - 9, cy + 5); ctx.closePath(); ctx.fill();
    t_('Aether wind →', cx - wLen, cy - 10, 'rgba(100,200,255,0.35)', 'left', 10);

    drawInterferometer(cx, cy, autoRot, ARM, ARM, t * 0.4, false);

    // Two stacked graphs on the right
    var pad  = 8;
    var gx   = W * 0.42;
    var gw   = W - gx - pad;
    var gh   = H * 0.36;
    var topY = H * 0.05;
    var botY = topY + gh + 14;

    function graphBox(gY, title, titleColor) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(gx, gY, gw, gh);
      ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1;
      ctx.strokeRect(gx, gY, gw, gh);
      b_(title, gx + 6, gY + 14, titleColor, 'left', 11);
      // zero line
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx + 2, gY + gh/2); ctx.lineTo(gx + gw - 2, gY + gh/2); ctx.stroke();
      t_('Δ=0', gx - 2, gY + gh/2 + 4, C_MUTED, 'right', 10);
    }

    // Top: predicted (oscillating)
    graphBox(topY, 'Predicted (aether theory)', '#ffaaaa');
    ctx.beginPath(); ctx.strokeStyle = '#ff6666'; ctx.lineWidth = 2;
    for (var xi = 0; xi < gw - 4; xi++) {
      var ang = (xi / (gw - 4)) * Math.PI * 2;
      var sh  = Math.sin(ang * 2 + autoRot * 2) * (gh * 0.34);
      var px  = gx + 2 + xi, py = topY + gh/2 - sh;
      if (xi === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    var mx = gx + 2 + ((autoRot % (Math.PI*2)) / (Math.PI*2)) * (gw - 4);
    var my = topY + gh/2 - Math.sin(autoRot * 4) * (gh * 0.34);
    ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI*2); ctx.fillStyle = '#ff6666'; ctx.fill();
    t_('Fringes should shift as device rotates', gx + 4, topY + gh - 5, '#ffaaaa', 'left', 10);

    // Bottom: measured (flat zero)
    graphBox(botY, 'Measured (actual result)', '#aaffaa');
    ctx.beginPath(); ctx.strokeStyle = '#66ff88'; ctx.lineWidth = 3;
    ctx.moveTo(gx + 2, botY + gh/2); ctx.lineTo(gx + gw - 2, botY + gh/2); ctx.stroke();
    var mx2 = gx + 2 + ((autoRot % (Math.PI*2)) / (Math.PI*2)) * (gw - 4);
    ctx.beginPath(); ctx.arc(mx2, botY + gh/2, 5, 0, Math.PI*2); ctx.fillStyle = '#66ff88'; ctx.fill();
    b_('No shift — at any angle', gx + 4, botY + gh - 5, '#aaffaa', 'left', 11);

    // Verdict banner
    var vy = botY + gh + 6;
    if (vy + 26 < H) {
      ctx.fillStyle = 'rgba(100,255,120,0.07)';
      ctx.fillRect(gx, vy, gw, 22);
      b_('Null result: the aether does not exist.', gx + 8, vy + 15, '#aaffaa', 'left', 12);
    }
  }

  // ── MODE 3: Arm Ratio ────────────────────────────────────────────
  function drawMode3() {
    var ARM1 = Math.min(W * 0.22, H * 0.30);
    var ARM2 = ARM1 * armRatio;
    var cx   = W * 0.28, cy = H * 0.48;

    drawInterferometer(cx, cy, 0, ARM1, ARM2, null, true);

    // Arm length labels — avoid overlap with mirrors
    t_('L₁', cx + ARM1 * 0.45, cy + 16, C_ARM1, 'center', 11);
    t_('L₂ = ' + armRatio.toFixed(3) + '×', cx + 14, cy - ARM2 * 0.55, C_ARM2, 'left', 11);

    // Path difference
    var isNull = Math.abs(armRatio - 1.0) < 0.003;
    var pdText = isNull ? 'ΔL = 0  →  null result' : 'ΔL = ' + (armRatio - 1).toFixed(3) + ' × L₁';
    b_(pdText, cx, cy + ARM1 * 0.80 + 10, isNull ? '#aaffaa' : '#ffaa66', 'center', 11);

    // Detector
    var detY = cy + ARM1 * 0.80;
    drawDetector(cx, detY, (armRatio - 1) * 12, isNull, isNull ? 'Equal arms' : 'Unequal arms');

    // Right panel
    var rx = W * 0.56, ry = H * 0.08, rw = W - rx - 10;
    b_('Interferometer sensitivity', rx, ry, C_TEXT, 'left', 13);

    var lines = [
      ['Equal arms (1.000):', C_MUTED],
      ['  Same path length → no phase shift.', '#aaffaa'],
      ['  Detector shows uniform grey.', '#aaffaa'],
      ['', C_MUTED],
      ['Unequal arms:', C_MUTED],
      ['  Path difference → interference fringes.', '#ffaa66'],
      ['  Brighter difference = bigger shift.', '#ffaa66'],
      ['', C_MUTED],
      ['Michelson sensitivity: 0.01 fringes.', C_MUTED],
      ['Aether prediction: ~0.4 fringes.', '#ff8888'],
      ['Measured: 0.00 fringes.', '#aaffaa']
    ];
    lines.forEach(function(l, i) {
      if (l[0]) t_(l[0], rx, ry + 22 + i * 17, l[1], 'left', 11);
    });
  }

  // ── Main draw ────────────────────────────────────────────────────
  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    // Clip everything to canvas bounds
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    if      (currentMode === 1) drawMode1();
    else if (currentMode === 2) drawMode2();
    else                        drawMode3();
    ctx.restore();

    if (running && !reduced) { t += 0.022; raf = requestAnimationFrame(drawFrame); }
  }

  function drawStatic() { drawFrame(); }

  // ── Controls ─────────────────────────────────────────────────────
  var controls     = document.getElementById('sim-controls-026');
  var rotSliderRow = controls ? controls.querySelector('.row-rotation')  : null;
  var armSliderRow = controls ? controls.querySelector('.row-arm-ratio') : null;
  var rotSlider    = document.getElementById('rot-slider');
  var armSlider    = document.getElementById('arm-slider');
  var rotValEl     = document.getElementById('rot-slider-val');
  var armValEl     = document.getElementById('arm-slider-val');
  var hintEl       = document.getElementById('mode-hint');

  var HINTS = {
    1: 'Watch the light beam bounce between mirrors and recombine at the detector.',
    2: 'Apparatus rotates automatically. Top = aether prediction. Bottom = actual measurement.',
    3: 'Drag the arm ratio. At 1.000 (equal arms) the result is null. Any difference creates fringes.'
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
      btn.addEventListener('click', function() { setMode(parseInt(btn.dataset.mode, 10)); });
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
