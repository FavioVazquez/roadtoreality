/* ============================================================
   sim.js — Stop 001: Thales and Natural Causes
   Thales' pyramid-shadow measurement (Diogenes Laertius I.27;
   Plutarch, Moralia 147a), in side view.

   The Sun's rays are parallel, so a stick and the pyramid cast
   shadows in proportion to their heights:
       S_stick   = h / tan(altitude)
       S_pyramid = H / tan(altitude)   measured from the centre
                                       of the base, under the apex
       H = h × S_pyramid / S_stick
   Only the part of the pyramid's shadow beyond the base can be
   seen, so S_pyramid = half the base (115.2 m) + visible shadow.

   Second tab: the saros, 223 synodic months = 6585.32 days.
   Dates and greatest-eclipse points are from the NASA Five
   Millennium Catalog of Solar Eclipses (Espenak & Meeus).
   ============================================================ */
(function () {
  'use strict';

  /* ── Constants (cited on the page) ─────────────────────── */
  var H_PYR     = 146.6;   /* original height, m (Lehner 1997)        */
  var HALF_BASE = 115.2;   /* half of the 230.3 m base side, m         */
  var H_STICK   = 2.0;     /* the stick: an illustrative 2 m staff     */
  var ALT_MIN = 20, ALT_MAX = 60, ALT_DEFAULT = 45;
  var FACE_DEG = Math.atan(H_PYR / HALF_BASE) * 180 / Math.PI;   /* 51.8° */
  var ANIM_SECS = 4;
  var RULER_STICK0 = 1.0, RULER_PYR0 = 100;

  var COL = {
    era:     'oklch(0.72 0.12 60)',
    eraDim:  'oklch(0.72 0.12 60 / 0.35)',
    sun:     'oklch(0.88 0.16 90)',
    sky:     'oklch(0.14 0.03 250)',
    sky2:    'oklch(0.09 0.01 250)',
    ground:  'oklch(0.50 0.07 75)',
    lit:     'oklch(0.70 0.09 80)',
    shade:   'oklch(0.42 0.06 70)',
    shadow:  'oklch(0.13 0.01 70)',
    ruler:   'oklch(0.85 0.14 95)',
    text:    'oklch(0.92 0 0)',
    muted:   'oklch(0.66 0 0)',
    faint:   'oklch(1 0 0 / 0.12)',
    truth:   'oklch(0.78 0.15 150)',
    blue:    'oklch(0.72 0.12 240)'
  };

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var alt = ALT_DEFAULT;        /* target altitude from the slider, deg */
  var altShown = ALT_DEFAULT;   /* altitude being drawn (animates on Play) */
  var animFrom = ALT_MIN, animT = 0;
  var rulerStick = RULER_STICK0, rulerPyr = RULER_PYR0;
  var revealed = false;
  var drag = null;              /* 'stick' | 'pyr' | null */
  var autoPlayed = false;       /* the shell's scroll-in autostart animates only once */
  var userPlay = false;         /* set when the reader presses Play */

  function rad(d) { return d * Math.PI / 180; }
  function stickShadow(a) { return H_STICK / Math.tan(rad(a)); }
  function pyrShadowFromCentre(a) { return H_PYR / Math.tan(rad(a)); }
  function visibleShadow(a) { return Math.max(0, pyrShadowFromCentre(a) - HALF_BASE); }
  function estimate() { return rulerStick > 0 ? H_STICK * rulerPyr / rulerStick : NaN; }
  function fmt(v, d) { return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

  /* ── Layout ────────────────────────────────────────────── */
  function layout() {
    var pad = 16;
    var topH = Math.round(H * 0.60);
    var yG = topH - 52;
    var spanM = 20 + HALF_BASE + pyrShadowFromCentre(ALT_MIN) + 12;
    var sx = Math.min((W - 2 * pad) / spanM, (yG - 64) / H_PYR);
    var cx = pad + (20 + HALF_BASE) * sx;
    var yG2 = H - 50;
    var x0 = pad + 44;
    var sx2 = Math.min((W - x0 - pad - 8) / (stickShadow(ALT_MIN) + 0.25), (yG2 - topH - 46) / H_STICK);
    return { pad: pad, topH: topH, yG: yG, sx: sx, cx: cx, yG2: yG2, x0: x0, sx2: sx2,
             rulerY: yG + 18, rulerY2: yG2 + 18 };
  }

  /* ── Drawing helpers ───────────────────────────────────── */
  function text(s, x, y, col, size, align, weight) {
    ctx.fillStyle = col;
    ctx.font = (weight || '500') + ' ' + size + 'px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }

  function drawSun(x, y) {
    var g = ctx.createRadialGradient(x, y, 4, x, y, 30);
    g.addColorStop(0, 'oklch(0.92 0.15 95 / 0.9)');
    g.addColorStop(1, 'oklch(0.92 0.15 95 / 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 30, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = COL.sun;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, 2 * Math.PI); ctx.fill();
  }

  /* Point where a ray from (x, y) heading up-left at altitude a meets the box */
  function sunPoint(x, y, a, minX, minY) {
    var dx = -Math.cos(rad(a)), dy = -Math.sin(rad(a));
    var t1 = (minX - x) / dx, t2 = (minY - y) / dy;
    var t = Math.min(t1, t2);
    return { x: x + dx * t, y: y + dy * t };
  }

  function drawRuler(x0, y, lenPx, scale, minorM, majorM, labelM, unitDigits, value, label) {
    var maxX = x0 + lenPx;
    ctx.save();
    ctx.strokeStyle = COL.ruler;
    ctx.fillStyle = 'oklch(0.85 0.14 95 / 0.16)';
    ctx.fillRect(x0, y - 5, lenPx, 10);
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 0.5, y - 5 + 0.5, Math.max(0, lenPx - 1), 9);
    var n = Math.floor(value / minorM + 1e-6);
    for (var i = 0; i <= n; i++) {
      var m = i * minorM;
      var x = x0 + m * scale;
      var major = Math.abs(m / majorM - Math.round(m / majorM)) < 1e-6;
      ctx.beginPath();
      ctx.moveTo(x, y - 5);
      ctx.lineTo(x, y - 5 + (major ? 9 : 4));
      ctx.stroke();
      if (Math.abs(m / labelM - Math.round(m / labelM)) < 1e-6 && i > 0 && x < maxX - 14) {
        text(String(Math.round(m)), x, y + 12, COL.muted, 9, 'center');
      }
    }
    /* alignment hairline and handle */
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(maxX, y - 5); ctx.lineTo(maxX, y - 22); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COL.ruler;
    ctx.beginPath(); ctx.arc(maxX, y, 8, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = 'oklch(0.2 0 0)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(maxX - 3, y); ctx.lineTo(maxX + 3, y); ctx.stroke();
    var lx = Math.min(Math.max(maxX, x0 + 40), W - 50);
    text(label + ' = ' + fmt(value, unitDigits) + ' m', lx, y + 25, COL.ruler, 11, 'center', '600');
    ctx.restore();
  }

  /* ── Main draw: shadow tab ─────────────────────────────── */
  function draw() {
    if (!ctx || !W) return;
    var L = layout();
    var a = altShown;
    ctx.clearRect(0, 0, W, H);

    /* ---------- top panel: pyramid ---------- */
    var sky = ctx.createLinearGradient(0, 0, 0, L.yG);
    sky.addColorStop(0, COL.sky2); sky.addColorStop(1, COL.sky);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, L.yG);
    ctx.fillStyle = 'oklch(0.10 0.01 70)'; ctx.fillRect(0, L.yG, W, L.topH - L.yG);

    var apexX = L.cx, apexY = L.yG - H_PYR * L.sx;
    var leftX = L.cx - HALF_BASE * L.sx, rightX = L.cx + HALF_BASE * L.sx;
    var tipM = pyrShadowFromCentre(a);
    var tipX = L.cx + tipM * L.sx;
    var hasShadow = a < FACE_DEG;

    /* Sun along the ray through the apex */
    var sp = sunPoint(apexX, apexY, a, L.pad + 14, 18);
    /* shaded air region below the grazing ray */
    if (hasShadow) {
      ctx.fillStyle = 'oklch(0 0 0 / 0.28)';
      ctx.beginPath(); ctx.moveTo(apexX, apexY); ctx.lineTo(tipX, L.yG); ctx.lineTo(rightX, L.yG); ctx.closePath(); ctx.fill();
    }
    /* grazing ray from the Sun past the apex to the tip */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.88 0.16 90 / 0.55)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(hasShadow ? tipX : apexX, hasShadow ? L.yG : apexY); ctx.stroke();
    ctx.restore();
    drawSun(sp.x, sp.y);

    /* pyramid faces: the sunward face is lit; the far face is in its own
       shade while the Sun is lower than the face slope */
    ctx.fillStyle = COL.lit;
    ctx.beginPath(); ctx.moveTo(leftX, L.yG); ctx.lineTo(apexX, apexY); ctx.lineTo(apexX, L.yG); ctx.closePath(); ctx.fill();
    ctx.fillStyle = hasShadow ? COL.shade : COL.lit;
    ctx.beginPath(); ctx.moveTo(apexX, L.yG); ctx.lineTo(apexX, apexY); ctx.lineTo(rightX, L.yG); ctx.closePath(); ctx.fill();

    /* sunlit sand and the shadow on it */
    ctx.fillStyle = COL.ground;
    ctx.fillRect(0, L.yG, W, 8);
    if (hasShadow) {
      ctx.fillStyle = COL.shadow;
      ctx.fillRect(rightX, L.yG, tipX - rightX, 8);
    }
    /* hidden half base under the pyramid */
    ctx.save();
    ctx.strokeStyle = COL.blue; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(L.cx, L.yG - 3); ctx.lineTo(rightX, L.yG - 3); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = COL.blue;
    ctx.beginPath(); ctx.arc(L.cx, L.yG, 3, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = 'oklch(0.10 0 0 / 0.7)';
    ctx.fillRect((L.cx + rightX) / 2 - 42, L.yG - 20, 84, 16);
    text('½ base 115.2 m', (L.cx + rightX) / 2, L.yG - 12, COL.blue, 10, 'center', '600');
    if (hasShadow && tipX - rightX > 46) {
      text('visible shadow', (rightX + tipX) / 2, L.yG - 12, COL.muted, 10, 'center');
    }

    if (revealed) {
      ctx.save();
      ctx.strokeStyle = COL.truth; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(apexX, apexY); ctx.lineTo(apexX, L.yG); ctx.stroke();
      ctx.restore();
      text('true height 146.6 m (cited)', apexX + 8, apexY + 8, COL.truth, 11, 'left', '600');
      var est = estimate();
      if (isFinite(est) && est > 0) {
        var ey = L.yG - est * L.sx;
        if (ey > 4) {
          ctx.save();
          ctx.strokeStyle = COL.ruler; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
          var lx = Math.max(apexX - 30, 74);   /* keep the label on the canvas at phone widths */
          ctx.beginPath(); ctx.moveTo(lx + 4, ey); ctx.lineTo(apexX + 26, ey); ctx.stroke();
          ctx.restore();
          text('your estimate', lx, ey, COL.ruler, 10, 'right', '600');
        }
      }
    }

    drawRuler(L.cx, L.rulerY, rulerPyr * L.sx, L.sx, 10, 50, 100, 1, rulerPyr, 'S');

    text('GREAT PYRAMID, SIDE VIEW TO SCALE', W - L.pad, 14, COL.muted, 10, 'right', '600');
    text('Sun altitude ' + Math.round(a) + '°', W - L.pad, 30, COL.sun, 12, 'right', '600');
    if (!hasShadow) {
      text('No shadow beyond the base: the Sun is higher', W - L.pad, 48, COL.text, 11, 'right');
      text('than the faces’ slope (51.8°). Lower it to measure.', W - L.pad, 63, COL.text, 11, 'right');
    }

    /* panel divider */
    ctx.fillStyle = COL.faint; ctx.fillRect(0, L.topH, W, 1);

    /* ---------- bottom panel: stick, magnified ---------- */
    var y0 = L.topH + 1;
    var sky2 = ctx.createLinearGradient(0, y0, 0, L.yG2);
    sky2.addColorStop(0, COL.sky2); sky2.addColorStop(1, COL.sky);
    ctx.fillStyle = sky2; ctx.fillRect(0, y0, W, L.yG2 - y0);
    ctx.fillStyle = 'oklch(0.10 0.01 70)'; ctx.fillRect(0, L.yG2, W, H - L.yG2);

    ctx.save();
    ctx.beginPath(); ctx.rect(0, y0, W, H - y0); ctx.clip();
    var stTopY = L.yG2 - H_STICK * L.sx2;
    var stTipX = L.x0 + stickShadow(a) * L.sx2;
    /* parallel rays across the panel, all at the same altitude */
    ctx.strokeStyle = 'oklch(0.88 0.16 90 / 0.14)';
    ctx.lineWidth = 1;
    var dxr = Math.cos(rad(a)), dyr = Math.sin(rad(a));
    for (var k = -6; k <= 10; k++) {
      var bx = stTipX + k * 46;
      ctx.beginPath();
      ctx.moveTo(bx - dxr * 400, L.yG2 - dyr * 400);
      ctx.lineTo(bx, L.yG2);
      ctx.stroke();
    }
    ctx.fillStyle = 'oklch(0 0 0 / 0.28)';
    ctx.beginPath(); ctx.moveTo(L.x0, stTopY); ctx.lineTo(stTipX, L.yG2); ctx.lineTo(L.x0, L.yG2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'oklch(0.88 0.16 90 / 0.55)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(L.x0 - dxr * 300, stTopY - dyr * 300); ctx.lineTo(stTipX, L.yG2); ctx.stroke();
    ctx.restore();

    ctx.fillStyle = COL.ground;
    ctx.fillRect(0, L.yG2, W, 8);
    ctx.fillStyle = COL.shadow;
    ctx.fillRect(L.x0, L.yG2, stTipX - L.x0, 8);
    ctx.strokeStyle = COL.lit; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(L.x0, L.yG2); ctx.lineTo(L.x0, stTopY); ctx.stroke();
    ctx.lineCap = 'butt';
    text('stick h = 2.00 m', L.x0 + 8, stTopY - 2, COL.text, 11, 'left', '600');

    drawRuler(L.x0, L.rulerY2, rulerStick * L.sx2, L.sx2, 0.1, 0.5, 1, 2, rulerStick, 's');

    var mag = L.sx2 / L.sx;
    text('STICK, MAGNIFIED ×' + Math.round(mag), W - L.pad, y0 + 14, COL.muted, 10, 'right', '600');
    text('same Sun, same moment', W - L.pad, y0 + 30, COL.muted, 10, 'right');
  }

  /* ── Readouts in the DOM ───────────────────────────────── */
  function updateReadouts() {
    var est = estimate();
    var out = document.getElementById('height-estimate');
    if (out) {
      out.textContent = isFinite(est)
        ? 'H ≈ 2.00 m × ' + fmt(rulerPyr, 1) + ' m ÷ ' + fmt(rulerStick, 2) + ' m = ' + fmt(est, 1) + ' m'
        : 'Set the stick ruler above zero.';
    }
    var res = document.getElementById('reveal-result');
    if (res) {
      if (revealed && isFinite(est)) {
        var err = est - H_PYR;
        res.textContent = 'Original height (cited): 146.6 m. Your estimate is ' + fmt(est, 1) + ' m, off by ' +
          (err >= 0 ? '+' : '−') + fmt(Math.abs(err), 1) + ' m (' + (err >= 0 ? '+' : '−') +
          fmt(Math.abs(err) / H_PYR * 100, 1) + ' %).';
      } else {
        res.textContent = '';
      }
    }
    var si = document.getElementById('stick-ruler');
    if (si && document.activeElement !== si) si.value = rulerStick.toFixed(2);
    var pi = document.getElementById('pyr-ruler');
    if (pi && document.activeElement !== pi) pi.value = rulerPyr.toFixed(1);
  }

  function setStatus(s) {
    var el = document.getElementById('sim-status');
    if (el) el.textContent = s;
  }

  function statusForAltitude() {
    if (altShown >= FACE_DEG) {
      setStatus('Sun at ' + Math.round(altShown) + '°: higher than the faces’ slope, so no shadow reaches past the base. Lower the Sun.');
    } else {
      setStatus('Sun at ' + Math.round(altShown) + '°. Drag the yellow ruler ends to the shadow tips, then compare your estimate with the true height.');
    }
  }

  /* ── Animation: Play raises the Sun to the chosen altitude ─ */
  function setPlayBtn(playing) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) {
      btn.textContent = playing ? '⏸ Pause' : '▶ Play';
      btn.dataset.state = playing ? 'playing' : 'paused';
      btn.setAttribute('aria-label', playing ? 'Pause the rising Sun' : 'Play: raise the Sun to the chosen altitude');
    }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.toggle('is-running', playing);
  }

  function finish() {
    running = false;
    cancelAnimationFrame(rafId);
    altShown = alt;
    draw();
    statusForAltitude();
    setPlayBtn(false);
  }

  function loop(ts) {
    if (!running) return;
    if (lastTs === null) lastTs = ts;
    var dt = Math.min(0.1, (ts - lastTs) / 1000);
    lastTs = ts;
    animT += dt;
    var f = Math.min(1, animT / ANIM_SECS);
    var e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
    altShown = animFrom + (alt - animFrom) * e;
    draw();
    if (f >= 1) { finish(); return; }
    rafId = requestAnimationFrame(loop);
  }

  /* ── SimAPI ────────────────────────────────────────────── */
  function start() {
    if (running) return;
    setPlayBtn(true);
    var replay = userPlay || !autoPlayed;
    userPlay = false;
    autoPlayed = true;
    if (reducedMotion || !replay) {
      /* no animation (reduced motion, or the sim scrolled back into view):
         show the chosen altitude and return to the paused state */
      setTimeout(finish, 0);
      return;
    }
    if (Math.abs(altShown - alt) < 0.01) {
      animFrom = alt > ALT_MIN + 5 ? ALT_MIN : ALT_MAX - 10;
    } else {
      animFrom = altShown;
    }
    altShown = animFrom;
    animT = 0;
    running = true;
    lastTs = null;
    setStatus('The Sun climbs: both shadows shrink together, always in the same ratio.');
    rafId = requestAnimationFrame(loop);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    setPlayBtn(false);
  }

  function reset() {
    pause();
    alt = altShown = ALT_DEFAULT;
    rulerStick = RULER_STICK0; rulerPyr = RULER_PYR0;
    revealed = false;
    var sl = document.getElementById('alt-slider');
    if (sl) { sl.value = ALT_DEFAULT; sl.setAttribute('aria-valuetext', ALT_DEFAULT + ' degrees'); }
    var v = document.getElementById('alt-val');
    if (v) v.textContent = ALT_DEFAULT + '°';
    var rb = document.getElementById('reveal-btn');
    if (rb) { rb.setAttribute('aria-pressed', 'false'); rb.textContent = 'Reveal the true height'; }
    var si = document.getElementById('stick-ruler'); if (si) si.value = rulerStick.toFixed(2);
    var pi = document.getElementById('pyr-ruler'); if (pi) pi.value = rulerPyr.toFixed(1);
    updateReadouts();
    statusForAltitude();
    draw();
    drawSaros();
  }

  function destroy() {
    pause();
    window.removeEventListener('resize', onResize);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    if (sarosCanvas && sarosCanvas.parentNode) sarosCanvas.parentNode.removeChild(sarosCanvas);
  }

  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  /* ── Pointer dragging of the ruler ends ────────────────── */
  function canvasPos(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function hitRuler(p) {
    var L = layout();
    var hp = { x: L.cx + rulerPyr * L.sx, y: L.rulerY };
    var hs = { x: L.x0 + rulerStick * L.sx2, y: L.rulerY2 };
    if (Math.hypot(p.x - hp.x, p.y - hp.y) <= 22) return 'pyr';
    if (Math.hypot(p.x - hs.x, p.y - hs.y) <= 22) return 'stick';
    /* anywhere on the ruler's band also grabs it */
    if (Math.abs(p.y - L.rulerY) <= 16 && p.x >= L.cx - 10) return 'pyr';
    if (Math.abs(p.y - L.rulerY2) <= 16 && p.x >= L.x0 - 10) return 'stick';
    return null;
  }

  function dragTo(p) {
    var L = layout();
    if (drag === 'pyr') {
      var maxP = (W - L.pad - L.cx) / L.sx;
      rulerPyr = Math.max(0, Math.min(maxP, (p.x - L.cx) / L.sx));
      rulerPyr = Math.round(rulerPyr * 10) / 10;
    } else if (drag === 'stick') {
      var maxS = (W - L.pad - L.x0) / L.sx2;
      rulerStick = Math.max(0, Math.min(maxS, (p.x - L.x0) / L.sx2));
      rulerStick = Math.round(rulerStick * 100) / 100;
    }
    updateReadouts();
    draw();
  }

  function bindPointer() {
    canvas.addEventListener('pointerdown', function (e) {
      var p = canvasPos(e);
      drag = hitRuler(p);
      if (!drag) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      dragTo(p);
    });
    canvas.addEventListener('pointermove', function (e) {
      var p = canvasPos(e);
      if (drag) { dragTo(p); return; }
      canvas.style.cursor = hitRuler(p) ? 'ew-resize' : 'default';
    });
    function end(e) {
      if (!drag) return;
      drag = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
    }
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }

  /* ── Saros tab ─────────────────────────────────────────── */
  /* NASA Five Millennium Catalog of Solar Eclipses: calendar date,
     latitude and longitude of greatest eclipse (all total eclipses). */
  var SAROS = {
    145: [
      ['1963-07-20', 61.7, -119.6, 'northern Canada'],
      ['1981-07-31', 53.3, 134.1, 'eastern Siberia'],
      ['1999-08-11', 45.1, 24.3, 'Romania'],
      ['2017-08-21', 37.0, -87.7, 'Kentucky, USA'],
      ['2035-09-02', 29.1, 158.0, 'western Pacific'],
      ['2053-09-12', 21.5, 41.7, 'Saudi Arabia']
    ],
    139: [
      ['1952-02-25', 15.6, 32.7, 'Sudan'],
      ['1970-03-07', 18.2, -94.7, 'southern Mexico'],
      ['1988-03-18', 20.7, 140.0, 'western Pacific'],
      ['2006-03-29', 23.2, 16.7, 'Libya'],
      ['2024-04-08', 25.3, -104.1, 'Durango, Mexico'],
      ['2042-04-20', 27.0, 137.3, 'western Pacific'],
      ['2060-04-30', 28.0, 20.9, 'Libya']
    ]
  };
  var SAROS_COL = { 145: 'oklch(0.80 0.15 82)', 139: 'oklch(0.72 0.13 240)' };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var sarosCanvas, sctx, SW, SH, sarosMount;

  function dayNum(iso) {
    var p = iso.split('-');
    return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000;
  }
  function fmtDate(iso) {
    var p = iso.split('-');
    return p[0] + ' ' + MONTHS[+p[1] - 1] + ' ' + (+p[2]);
  }
  function fmtLatLon(lat, lon) {
    return fmt(Math.abs(lat), 1) + '°' + (lat >= 0 ? 'N' : 'S') + ' ' + fmt(Math.abs(lon), 1) + '°' + (lon >= 0 ? 'E' : 'W');
  }

  function buildSarosTable() {
    var tb = document.getElementById('saros-rows');
    if (!tb) return;
    var html = '';
    [145, 139].forEach(function (s) {
      SAROS[s].forEach(function (r, i) {
        var gap = i > 0 ? dayNum(r[0]) - dayNum(SAROS[s][i - 1][0]) : null;
        var shift = null;
        if (i > 0) {
          shift = r[2] - SAROS[s][i - 1][2];
          while (shift > 180) shift -= 360;
          while (shift < -180) shift += 360;
        }
        var td = '<td style="padding:0.3rem 0.6rem 0.3rem 0;vertical-align:top;">';
        html += '<tr>' + td + s + '</td>' + td + fmtDate(r[0]) + '</td>' + td + fmtLatLon(r[1], r[2]) + ' (' + r[3] + ')</td>' + td +
          (gap === null ? '—' : gap.toLocaleString('en-US') + ' d, ' + fmt(Math.abs(shift), 0) + '° ' + (shift < 0 ? 'W' : 'E')) + '</td></tr>';
      });
    });
    tb.innerHTML = html;
  }

  function drawSaros() {
    if (!sctx || !SW) return;
    var c = sctx;
    c.clearRect(0, 0, SW, SH);
    c.fillStyle = 'oklch(0.09 0 0)';
    c.fillRect(0, 0, SW, SH);
    var padL = 34, padR = 12, padT = 34, padB = 26;
    var LAT0 = 0, LAT1 = 70;
    function X(lon) { return padL + (lon + 180) / 360 * (SW - padL - padR); }
    function Y(lat) { return padT + (LAT1 - lat) / (LAT1 - LAT0) * (SH - padT - padB); }
    /* graticule */
    c.strokeStyle = 'oklch(1 0 0 / 0.08)'; c.lineWidth = 1;
    c.font = '9px "DM Sans", system-ui, sans-serif'; c.fillStyle = 'oklch(0.6 0 0)';
    c.textBaseline = 'top'; c.textAlign = 'center';
    for (var lon = -180; lon <= 180; lon += 60) {
      c.beginPath(); c.moveTo(X(lon), padT); c.lineTo(X(lon), SH - padB); c.stroke();
      c.fillText(lon === 0 ? '0°' : Math.abs(lon) + '°' + (lon < 0 ? 'W' : 'E'), X(lon), SH - padB + 6);
    }
    c.textAlign = 'right'; c.textBaseline = 'middle';
    for (var lat = 0; lat <= 60; lat += 30) {
      c.beginPath(); c.moveTo(padL, Y(lat)); c.lineTo(SW - padR, Y(lat)); c.stroke();
      c.fillText(lat + '°N', padL - 4, Y(lat));
    }
    c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillStyle = 'oklch(0.66 0 0)';
    c.font = '600 10px "DM Sans", system-ui, sans-serif';
    c.fillText('WHERE EACH ECLIPSE WAS GREATEST (longitude, latitude)', padL, 14);

    [145, 139].forEach(function (s) {
      var rows = SAROS[s];
      c.strokeStyle = SAROS_COL[s]; c.fillStyle = SAROS_COL[s];
      c.lineWidth = 1.2; c.setLineDash([3, 3]);
      for (var i = 1; i < rows.length; i++) {
        var a = rows[i - 1], b = rows[i];
        var d = b[2] - a[2];
        if (d > 0) d -= 360;   /* each step moves west */
        var mid = a[2] + d;
        if (mid >= -180) {
          c.beginPath(); c.moveTo(X(a[2]), Y(a[1])); c.lineTo(X(b[2]), Y(b[1])); c.stroke();
        } else {
          /* wraps past 180°: split the segment at the map edge */
          var f = (a[2] + 180) / (-d);
          var latE = a[1] + (b[1] - a[1]) * f;
          c.beginPath(); c.moveTo(X(a[2]), Y(a[1])); c.lineTo(X(-180), Y(latE)); c.stroke();
          c.beginPath(); c.moveTo(X(180), Y(latE)); c.lineTo(X(b[2]), Y(b[1])); c.stroke();
        }
      }
      c.setLineDash([]);
      rows.forEach(function (r) {
        c.beginPath(); c.arc(X(r[2]), Y(r[1]), 4.5, 0, 2 * Math.PI); c.fill();
        c.font = '600 10px "DM Sans", system-ui, sans-serif';
        c.textAlign = 'center';
        /* series 145 labelled above its points, 139 below, to keep them apart */
        c.textBaseline = s === 145 ? 'bottom' : 'top';
        c.fillText(r[0].slice(0, 4), X(r[2]), Y(r[1]) + (s === 145 ? -7 : 7));
      });
    });
    /* legend */
    c.textBaseline = 'middle'; c.textAlign = 'left';
    c.font = '600 10px "DM Sans", system-ui, sans-serif';
    c.textAlign = 'right';
    c.fillStyle = SAROS_COL[139]; c.fillText('\u25CF saros 139', SW - padR - 6, Y(4));
    c.fillStyle = SAROS_COL[145]; c.fillText('\u25CF saros 145', SW - padR - 84, Y(4));
  }

  function sizeSaros() {
    if (!sarosMount || !sarosCanvas) return;
    var rect = sarosMount.getBoundingClientRect();
    if (!rect.width) return;
    var dpr = window.devicePixelRatio || 1;
    SW = Math.round(rect.width);
    SH = Math.round(Math.max(220, Math.min(SW * 0.5, 320)));
    sarosCanvas.width = Math.round(SW * dpr);
    sarosCanvas.height = Math.round(SH * dpr);
    sarosCanvas.style.width = SW + 'px';
    sarosCanvas.style.height = SH + 'px';
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSaros();
  }

  function bindTabs() {
    var tabs = [document.getElementById('tab-shadow'), document.getElementById('tab-saros')];
    var panels = [document.getElementById('panel-shadow'), document.getElementById('panel-saros')];
    if (!tabs[0] || !tabs[1] || !panels[0] || !panels[1]) return;
    function select(i, focus) {
      for (var k = 0; k < 2; k++) {
        var on = k === i;
        tabs[k].setAttribute('aria-selected', on ? 'true' : 'false');
        tabs[k].tabIndex = on ? 0 : -1;
        tabs[k].classList.toggle('sim-btn-play', on);
        panels[k].hidden = !on;
      }
      if (i === 1) { pause(); sizeSaros(); } else { onResize(); }
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          e.stopPropagation();
          select(1 - i, true);
        }
      });
    });
  }

  /* ── Setup ─────────────────────────────────────────────── */
  function onResize() {
    if (mountEl && canvas) {
      var rect = mountEl.getBoundingClientRect();
      if (rect.width) {
        var dpr = window.devicePixelRatio || 1;
        W = Math.round(rect.width);
        H = W < 520 ? 470 : 480;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        /* keep rulers inside the drawable range */
        var L = layout();
        rulerPyr = Math.min(rulerPyr, (W - L.pad - L.cx) / L.sx);
        rulerStick = Math.min(rulerStick, (W - L.pad - L.x0) / L.sx2);
        draw();
      }
    }
    sizeSaros();
  }

  function bindNumber(id, which, digits) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function () {
      var v = parseFloat(this.value);
      if (!isFinite(v) || v < 0) return;
      var L = layout();
      if (which === 'pyr') rulerPyr = Math.min(v, (W - L.pad - L.cx) / L.sx);
      else rulerStick = Math.min(v, (W - L.pad - L.x0) / L.sx2);
      updateReadouts();
      draw();
    });
    el.addEventListener('change', function () {
      this.value = (which === 'pyr' ? rulerPyr : rulerStick).toFixed(digits);
    });
  }

  function setup() {
    mountEl = document.getElementById('sim-mount');
    if (!mountEl) return;
    canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Side view of the Great Pyramid and a 2 metre stick under the same Sun, each with its shadow and a ruler you can drag to measure it');
    mountEl.appendChild(canvas);
    ctx = canvas.getContext('2d');
    bindPointer();

    sarosMount = document.getElementById('saros-mount');
    if (sarosMount) {
      sarosCanvas = document.createElement('canvas');
      sarosCanvas.style.width = '100%';
      sarosCanvas.setAttribute('role', 'img');
      sarosCanvas.setAttribute('aria-label', 'Map grid of longitude and latitude with the points of greatest eclipse for saros series 145 and 139; each eclipse in a series falls about a third of the way round the world west of the previous one. The table below lists the same data.');
      sarosMount.appendChild(sarosCanvas);
      sctx = sarosCanvas.getContext('2d');
      buildSarosTable();
    }

    requestAnimationFrame(function () { onResize(); });
    window.addEventListener('resize', onResize);

    var sl = document.getElementById('alt-slider');
    var val = document.getElementById('alt-val');
    if (sl) {
      sl.addEventListener('input', function () {
        alt = parseInt(this.value, 10);
        if (running) pause();
        altShown = alt;
        if (val) val.textContent = alt + '°';
        sl.setAttribute('aria-valuetext', alt + ' degrees');
        statusForAltitude();
        draw();
      });
    }
    bindNumber('stick-ruler', 'stick', 2);
    bindNumber('pyr-ruler', 'pyr', 1);

    var pb = document.getElementById('sim-play-btn');
    if (pb) {
      pb.addEventListener('pointerdown', function () { userPlay = true; });
      pb.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') userPlay = true; });
    }

    var rb = document.getElementById('reveal-btn');
    if (rb) {
      rb.addEventListener('click', function () {
        revealed = !revealed;
        rb.setAttribute('aria-pressed', revealed ? 'true' : 'false');
        rb.textContent = revealed ? 'Hide the true height' : 'Reveal the true height';
        updateReadouts();
        draw();
      });
    }
    bindTabs();
    updateReadouts();
    statusForAltitude();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}());
