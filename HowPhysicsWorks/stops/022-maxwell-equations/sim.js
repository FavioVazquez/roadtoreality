/* sim.js — 022 Maxwell: two-panel — draggable field lines + EM wave */
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

  var W, H, splitX;
  var raf = null;
  var t = 0;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // EM wave params (slider-driven)
  var waveFreq = 1.0;
  var waveAmp  = 0.6;

  // Charges for left panel (positions in canvas coords)
  var charges = [
    { q: +1, x: 0, y: 0, color: '#5285c8', label: '+' },
    { q: -1, x: 0, y: 0, color: '#c85252', label: '−' }
  ];

  var dragging   = null; // which charge is being dragged
  var CHARGE_R   = 12;
  var FIELD_LINES = 16;  // lines per charge
  var STEP       = 3;    // integration step px
  var MAX_STEPS  = 600;

  function resize() {
    W = mount.clientWidth  || 680;
    H = mount.clientHeight || 360;
    canvas.width  = W;
    canvas.height = H;
    splitX = Math.floor(W * 0.48);
    // Default charge positions
    if (!charges[0].placed) {
      charges[0].x = splitX * 0.38; charges[0].y = H * 0.42;
      charges[1].x = splitX * 0.62; charges[1].y = H * 0.58;
      charges[0].placed = true;
    }
  }

  // Electric field at (px, py) from all charges — returns {ex, ey}
  function eField(px, py) {
    var ex = 0, ey = 0;
    for (var i = 0; i < charges.length; i++) {
      var c  = charges[i];
      var dx = px - c.x;
      var dy = py - c.y;
      var r2 = dx * dx + dy * dy;
      if (r2 < 1) continue;
      var r  = Math.sqrt(r2);
      var f  = c.q / (r2 * r); // 1/r² magnitude, times unit vector
      ex += f * dx;
      ey += f * dy;
    }
    return { ex: ex, ey: ey };
  }

  // Trace one field line starting at (sx, sy) in direction dir (+1 or -1)
  function traceLine(sx, sy, dir) {
    var pts = [{ x: sx, y: sy }];
    var x = sx, y = sy;
    for (var s = 0; s < MAX_STEPS; s++) {
      var e = eField(x, y);
      var mag = Math.sqrt(e.ex * e.ex + e.ey * e.ey);
      if (mag < 1e-10) break;
      var nx = x + dir * STEP * e.ex / mag;
      var ny = y + dir * STEP * e.ey / mag;
      // Stop at boundary of left panel
      if (nx < 4 || nx > splitX - 4 || ny < 4 || ny > H - 4) break;
      // Stop near negative charge
      for (var ci = 0; ci < charges.length; ci++) {
        if (charges[ci].q < 0) {
          var dd = Math.hypot(nx - charges[ci].x, ny - charges[ci].y);
          if (dd < CHARGE_R + 2) { pts.push({ x: nx, y: ny }); return pts; }
        }
      }
      x = nx; y = ny;
      pts.push({ x: x, y: y });
    }
    return pts;
  }

  // Draw field lines emanating from positive charge
  function drawFieldLines() {
    var pc = charges[0]; // positive
    for (var i = 0; i < FIELD_LINES; i++) {
      var angle = (i / FIELD_LINES) * Math.PI * 2;
      var sx = pc.x + (CHARGE_R + 3) * Math.cos(angle);
      var sy = pc.y + (CHARGE_R + 3) * Math.sin(angle);
      var pts = traceLine(sx, sy, +1);
      if (pts.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var p = 1; p < pts.length; p++) ctx.lineTo(pts[p].x, pts[p].y);
      ctx.strokeStyle = 'rgba(140,170,220,0.55)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Arrow in the middle
      var mid = Math.floor(pts.length * 0.55);
      if (mid > 0 && mid < pts.length) {
        var ax = pts[mid].x, ay = pts[mid].y;
        var bx = pts[mid - 1].x, by = pts[mid - 1].y;
        var adx = ax - bx, ady = ay - by;
        var am = Math.hypot(adx, ady);
        if (am > 0) {
          var ux = adx / am, uy = ady / am;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - ux * 7 + uy * 4, ay - uy * 7 - ux * 4);
          ctx.lineTo(ax - ux * 7 - uy * 4, ay - uy * 7 + ux * 4);
          ctx.closePath();
          ctx.fillStyle = 'rgba(140,170,220,0.65)';
          ctx.fill();
        }
      }
    }
  }

  // Draw left panel: field lines + draggable charges
  function drawLeftPanel() {
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, 0, splitX, H);

    drawFieldLines();

    // Charges
    for (var i = 0; i < charges.length; i++) {
      var c = charges[i];
      var grd = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, CHARGE_R * 1.8);
      grd.addColorStop(0, c.color + 'cc');
      grd.addColorStop(1, c.color + '11');
      ctx.beginPath();
      ctx.arc(c.x, c.y, CHARGE_R * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(c.x, c.y, CHARGE_R, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(c.label, c.x, c.y + 5);
    }

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Electric Field Lines', 8, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px sans-serif';
    ctx.fillText('drag charges to reshape field', 8, 32);

    // Charge labels
    ctx.font = '10px sans-serif';
    ctx.fillStyle = charges[0].color;
    ctx.fillText('+q', charges[0].x + CHARGE_R + 4, charges[0].y - CHARGE_R - 4);
    ctx.fillStyle = charges[1].color;
    ctx.fillText('−q', charges[1].x + CHARGE_R + 4, charges[1].y - CHARGE_R - 4);

    ctx.textAlign = 'left';
  }

  // Draw right panel: propagating EM wave with E (blue) and B (red) fields
  function drawRightPanel() {
    var rx  = splitX + 10;
    var rw  = W - splitX - 16;
    var cy  = H * 0.50;

    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(splitX, 0, W - splitX, H);

    // Propagation axis
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx, cy);
    ctx.lineTo(rx + rw, cy);
    ctx.stroke();

    // Arrow on axis showing propagation direction
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('→ c', rx + rw - 2, cy - 6);

    var amp     = waveAmp * H * 0.20;
    var lambda  = rw / (waveFreq * 1.2);
    var omega   = waveFreq * 2.5;
    var nArrows = Math.floor(rw / 28);

    // E field: vertical (blue) — sinusoidal arrows along propagation axis
    var eColor = 'rgba(100,160,255,0.9)';
    ctx.strokeStyle = eColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var xi = 0; xi <= rw; xi += 2) {
      var xpos   = rx + xi;
      var phase  = (xi / lambda) * Math.PI * 2 - t * omega;
      var yoffset = amp * Math.sin(phase);
      if (xi === 0) ctx.moveTo(xpos, cy - yoffset);
      else          ctx.lineTo(xpos, cy - yoffset);
    }
    ctx.stroke();

    // E arrows
    for (var ai = 0; ai <= nArrows; ai++) {
      var axp   = rx + (ai / nArrows) * rw;
      var axi2  = (ai / nArrows) * rw;
      var aph   = (axi2 / lambda) * Math.PI * 2 - t * omega;
      var ey    = amp * Math.sin(aph);
      if (Math.abs(ey) < 4) continue;
      var ay1 = cy, ay2 = cy - ey;
      drawArrow(axp, ay1, axp, ay2, eColor, 2);
    }

    // B field: horizontal (into/out of screen shown as dots & crosses)
    // Use a second sinusoidal curve offset 90° in z — drawn as perspective squish
    var bColor = 'rgba(220,140,80,0.85)';
    var bAmp   = amp * 0.65;
    ctx.strokeStyle = bColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var xi2 = 0; xi2 <= rw; xi2 += 2) {
      var xp2   = rx + xi2;
      var ph2   = (xi2 / lambda) * Math.PI * 2 - t * omega;
      // B is 90° shifted in z — show as squished horizontal oscillation
      var bOff  = bAmp * Math.cos(ph2);
      var bY    = cy + bOff * 0.35;
      var bX    = xp2 + bOff * 0.20;
      if (xi2 === 0) ctx.moveTo(bX, bY);
      else           ctx.lineTo(bX, bY);
    }
    ctx.stroke();

    // B dots/crosses at arrow positions
    for (var bi = 0; bi <= nArrows; bi++) {
      var bxi   = (bi / nArrows) * rw;
      var bph   = (bxi / lambda) * Math.PI * 2 - t * omega;
      var bval  = Math.cos(bph);
      var bxPos = rx + bxi + bval * bAmp * 0.20;
      var byPos = cy + bval * bAmp * 0.35;
      if (Math.abs(bval) < 0.15) continue;
      drawDotCross(bxPos, byPos, bval > 0, bColor);
    }

    // Field labels
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = eColor;
    ctx.textAlign = 'left';
    ctx.fillText('E', rx + 4, cy - amp - 10);
    ctx.fillStyle = bColor;
    ctx.fillText('B', rx + 4, cy + bAmp * 0.35 + bAmp + 4);

    // Panel title
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Propagating EM Wave', splitX + 8, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px sans-serif';
    ctx.fillText('E ⊥ B ⊥ c — adjust frequency & amplitude', splitX + 8, 32);

    // Wavelength label
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('freq: ' + waveFreq.toFixed(1) + '×', W - 6, H - 8);
  }

  function drawArrow(x1, y1, x2, y2, color, lw) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.hypot(dx, dy);
    if (len < 4) return;
    var ux = dx / len, uy = dy / len;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    var hs = Math.min(7, len * 0.35);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * hs + uy * hs * 0.5, y2 - uy * hs - ux * hs * 0.5);
    ctx.lineTo(x2 - ux * hs - uy * hs * 0.5, y2 - uy * hs + ux * hs * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  function drawDotCross(x, y, outOfScreen, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 1.5;
    var r = 5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    if (outOfScreen) {
      // dot = out of screen
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // cross = into screen
      ctx.beginPath();
      ctx.moveTo(x - r * 0.6, y - r * 0.6); ctx.lineTo(x + r * 0.6, y + r * 0.6);
      ctx.moveTo(x + r * 0.6, y - r * 0.6); ctx.lineTo(x - r * 0.6, y + r * 0.6);
      ctx.stroke();
    }
  }

  function drawDivider() {
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, H);
    ctx.stroke();
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    drawLeftPanel();
    drawRightPanel();
    drawDivider();
    if (running && !reduced) {
      t += 0.025;
      raf = requestAnimationFrame(drawFrame);
    }
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    drawLeftPanel();
    drawRightPanel();
    drawDivider();
  }

  // ── Mouse/touch drag for charges ──────────────────────────────
  function getPos(e) {
    var rect   = canvas.getBoundingClientRect();
    var scaleX = canvas.width  / rect.width;
    var scaleY = canvas.height / rect.height;
    var src    = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY
    };
  }

  function hitCharge(px, py) {
    for (var i = 0; i < charges.length; i++) {
      if (px < splitX && Math.hypot(px - charges[i].x, py - charges[i].y) < CHARGE_R + 8) return i;
    }
    return -1;
  }

  canvas.addEventListener('mousedown', function (e) {
    var p = getPos(e);
    var h = hitCharge(p.x, p.y);
    if (h >= 0) { dragging = h; e.preventDefault(); }
  });
  canvas.addEventListener('mousemove', function (e) {
    var p = getPos(e);
    var h = hitCharge(p.x, p.y);
    canvas.style.cursor = (h >= 0) ? 'grab' : 'default';
    if (dragging !== null) {
      canvas.style.cursor = 'grabbing';
      charges[dragging].x = Math.max(CHARGE_R, Math.min(splitX - CHARGE_R, p.x));
      charges[dragging].y = Math.max(CHARGE_R, Math.min(H - CHARGE_R, p.y));
      if (!running) drawStatic();
      e.preventDefault();
    }
  });
  canvas.addEventListener('mouseup',    function () { dragging = null; });
  canvas.addEventListener('mouseleave', function () { dragging = null; canvas.style.cursor = 'default'; });

  canvas.addEventListener('touchstart', function (e) {
    var p = getPos(e);
    var h = hitCharge(p.x, p.y);
    if (h >= 0) { dragging = h; e.preventDefault(); }
  }, { passive: false });
  canvas.addEventListener('touchmove', function (e) {
    if (dragging === null) return;
    var p = getPos(e);
    charges[dragging].x = Math.max(CHARGE_R, Math.min(splitX - CHARGE_R, p.x));
    charges[dragging].y = Math.max(CHARGE_R, Math.min(H - CHARGE_R, p.y));
    if (!running) drawStatic();
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', function () { dragging = null; });

  // ── Sliders ───────────────────────────────────────────────────
  var freqSlider  = document.getElementById('em-frequency-slider');
  var freqLabel   = document.getElementById('em-frequency-label');
  var ampSlider   = document.getElementById('em-amplitude-slider');
  var ampLabel    = document.getElementById('em-amplitude-label');

  if (freqSlider) {
    freqSlider.addEventListener('input', function () {
      waveFreq = parseFloat(freqSlider.value);
      if (freqLabel) freqLabel.textContent = waveFreq.toFixed(1);
      if (!running) drawStatic();
    });
  }
  if (ampSlider) {
    ampSlider.addEventListener('input', function () {
      waveAmp = parseFloat(ampSlider.value);
      if (ampLabel) ampLabel.textContent = waveAmp.toFixed(2);
      if (!running) drawStatic();
    });
  }

  // ── Resize ────────────────────────────────────────────────────
  resize();
  window.addEventListener('resize', function () { resize(); if (!running) drawStatic(); });

  // ── SimAPI ────────────────────────────────────────────────────
  window.SimAPI = {
    start:   function () {
      if (running) return;
      running = true;
      if (reduced) { drawStatic(); return; }
      raf = requestAnimationFrame(drawFrame);
    },
    pause:   function () {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    },
    reset:   function () {
      window.SimAPI.pause();
      t = 0;
      drawStatic();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };

  drawStatic();
}());
