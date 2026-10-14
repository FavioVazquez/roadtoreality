/* ============================================================
   sim.js — Stop 041: Feynman and Quantum Electrodynamics
   Mirror: one amplitude arrow per strip of mirror, angle 2π l/λ where l is
   the path length source → strip → detector; arrows of equal length added
   head to tail (no obliquity or 1/r factors). The wavelength is drawn far
   larger than real light relative to the mirror so the turning is visible.
   Glass layer: two-arrow rule, front reflection −r and back reflection
   r·e^{iδ}, r = (n − 1)/(n + 1) = 0.2 for n = 1.5, δ = 4π n d / λ;
   multiple reflections ignored. R = 2r²(1 − cos δ), from 0 to 16 %.
   g-factor: digits of g/2 from Dirac, Schwinger's α/2π, the full theory
   and the measurement, compared digit by digit.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var NSTRIP = 41, LAM = 0.22, R_GLASS = 0.2, N_GLASS = 1.5;
  var ALPHA = 1 / 137.035999177;                      /* CODATA 2022 */
  var ROWS = [
    ['Dirac (1928): g = 2', '1.000000000000000', ''],
    ['+ Schwinger (1948): α/2π', (1 + ALPHA / (2 * Math.PI)).toFixed(15), ''],
    ['Full theory (2018)', '1.001159652182032', '± 0.000000000000720'],
    ['Measured (2023)', '1.00115965218059', '± 0.00000000000013']
  ];

  var mode = 'mirror', t = 0, shown = NSTRIP, det = 0, noMiddle = false, grating = false, dNm = 300, autoD = true;

  var COL = { era: 'oklch(0.70 0.18 190)', text: 'rgba(255,255,255,0.88)', muted: 'rgba(255,255,255,0.55)', faint: 'rgba(255,255,255,0.18)', hi: 'oklch(0.88 0.15 95)', ok: 'oklch(0.80 0.15 150)', bad: 'oklch(0.70 0.15 25)' };

  function txt(s, x, y, col, size, align, font) {
    ctx.fillStyle = col || COL.text; ctx.font = (size || 12) + 'px ' + (font || '"DM Sans", sans-serif');
    ctx.textAlign = align || 'left'; ctx.fillText(s, x, y);
  }
  function arrowLine(x0, y0, x1, y1, col, w) {
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w || 1.6;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    var a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), hs = Math.min(7, L * 0.4);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - hs * Math.cos(a - 0.4), y1 - hs * Math.sin(a - 0.4)); ctx.lineTo(x1 - hs * Math.cos(a + 0.4), y1 - hs * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
  }
  function hue(i) { return 'hsl(' + Math.round(i / (NSTRIP - 1) * 300) + ',70%,62%)'; }

  /* geometry in units where the mirror runs from −1 to 1 */
  function strips() {
    var S = [-0.55, 0.5], P = [0.55 + det, 0.5], out = [], lmin = Infinity, i;
    for (i = 0; i < NSTRIP; i++) {
      var x = -1 + (i + 0.5) * 2 / NSTRIP, l = Math.hypot(x - S[0], S[1]) + Math.hypot(P[0] - x, P[1]);
      out.push({ x: x, l: l }); lmin = Math.min(lmin, l);
    }
    out.forEach(function (s) { s.ph = 2 * Math.PI * (s.l - lmin) / LAM; s.on = true; });
    if (noMiddle) out.forEach(function (s) { if (Math.abs(s.x - (S[0] + P[0]) / 2) < 0.25) s.on = false; });
    if (grating) out.forEach(function (s) { if (Math.cos(s.ph) < 0) s.on = false; });
    return { S: S, P: P, list: out };
  }

  function drawMirror() {
    var narrow = W < 560, g = strips(), gx = 16, gw = narrow ? W - 32 : W * 0.48, gy = 40, gh = narrow ? 170 : 300;
    function X(x) { return gx + (x + 1) / 2 * gw; }
    function Y(y) { return gy + gh - 20 - y / 0.6 * (gh - 50); }
    txt('Light from S to P by every point of the mirror', 16, 22, COL.text, narrow ? 12 : 14);
    ctx.fillStyle = 'rgba(200,210,220,0.5)'; ctx.fillRect(gx, Y(0), gw, 4);
    g.list.forEach(function (s, i) {
      if (i >= shown) return;
      ctx.strokeStyle = s.on ? hue(i) : 'rgba(255,255,255,0.08)'; ctx.globalAlpha = s.on ? 0.55 : 1; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(g.S[0]), Y(g.S[1])); ctx.lineTo(X(s.x), Y(0)); ctx.lineTo(X(g.P[0]), Y(g.P[1])); ctx.stroke();
      ctx.globalAlpha = 1;
      if (!s.on) { ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(X(s.x) - gw / NSTRIP / 2 + 1, Y(0), gw / NSTRIP - 2, 4); }
    });
    ctx.fillStyle = COL.hi; ctx.beginPath(); ctx.arc(X(g.S[0]), Y(g.S[1]), 5, 0, 2 * Math.PI); ctx.fill(); txt('S', X(g.S[0]), Y(g.S[1]) - 9, COL.hi, 12, 'center');
    ctx.fillStyle = COL.text; ctx.beginPath(); ctx.arc(X(g.P[0]), Y(g.P[1]), 5, 0, 2 * Math.PI); ctx.fill(); txt('P', X(g.P[0]), Y(g.P[1]) - 9, COL.text, 12, 'center');
    /* arrow sum */
    var ax = narrow ? 16 : gx + gw + 24, ay = narrow ? gy + gh + 20 : gy, aw = narrow ? W - 32 : W - ax - 16, ah = narrow ? H - ay - 40 : gh + 40;
    ctx.strokeStyle = COL.faint; ctx.strokeRect(ax + 0.5, ay + 0.5, aw, ah);
    var vs = [], sx = 0, sy = 0;
    g.list.forEach(function (s, i) { if (i < shown && s.on) { vs.push([sx, sy, i]); sx += Math.cos(s.ph); sy += Math.sin(s.ph); } });
    var pts = [[0, 0]], cx = 0, cy = 0;
    vs.forEach(function (v) { var s = g.list[v[2]]; cx += Math.cos(s.ph); cy += Math.sin(s.ph); pts.push([cx, cy]); });
    var minx = 0, maxx = 0, miny = 0, maxy = 0;
    pts.forEach(function (q) { minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]); miny = Math.min(miny, q[1]); maxy = Math.max(maxy, q[1]); });
    var span = Math.max(maxx - minx, maxy - miny, 4), sc = Math.min(aw, ah - 30) * 0.85 / span;
    var ox = ax + aw / 2 - (minx + maxx) / 2 * sc, oy = ay + (ah + 10) / 2 + (miny + maxy) / 2 * sc;
    vs.forEach(function (v) { var s = g.list[v[2]]; arrowLine(ox + v[0] * sc, oy - v[1] * sc, ox + (v[0] + Math.cos(s.ph)) * sc, oy - (v[1] + Math.sin(s.ph)) * sc, hue(v[2]), 1.4); });
    if (vs.length) arrowLine(ox, oy, ox + sx * sc, oy - sy * sc, COL.hi, 2.6);
    var amp = Math.hypot(sx, sy);
    txt('Arrows head to tail · final length ' + amp.toFixed(2), ax + 6, ay + 16, COL.muted, 11);
  }

  function reflect(lamNm, d) { var dl = 4 * Math.PI * N_GLASS * d / lamNm; return 2 * R_GLASS * R_GLASS * (1 - Math.cos(dl)); }

  function drawGlass() {
    var narrow = W < 560, d = dNm;
    txt('Partial reflection from a glass layer ' + d.toFixed(0) + ' nm thick (n = 1.5)', 16, 22, COL.text, narrow ? 12 : 14);
    var cx = narrow ? W * 0.3 : W * 0.2, cy = narrow ? 130 : 150, L = narrow ? 230 : 300, dl = 4 * Math.PI * N_GLASS * d / 550;
    var x1 = cx - R_GLASS * L, ex = x1 + Math.cos(dl) * R_GLASS * L, ey = cy - Math.sin(dl) * R_GLASS * L;
    arrowLine(cx, cy, x1, cy, 'oklch(0.78 0.14 200)', 2);
    arrowLine(x1, cy, ex, ey, 'oklch(0.78 0.16 40)', 2);
    arrowLine(cx, cy, ex, ey, COL.hi, 2.6);
    txt('front surface', cx - 10, cy + 20, 'oklch(0.78 0.14 200)', 11, 'right');
    txt('back surface', ex, ey - 8, 'oklch(0.78 0.16 40)', 11, 'center');
    txt('at 550 nm: R = ' + (reflect(550, d) * 100).toFixed(1) + ' %', 16, cy + 70, COL.text, 12);
    var gx = narrow ? 30 : W * 0.42, gy = narrow ? 270 : 50, gw = narrow ? W - 46 : W - gx - 20, gh = narrow ? 150 : 220;
    ctx.strokeStyle = COL.faint; ctx.strokeRect(gx + 0.5, gy + 0.5, gw, gh);
    for (var i = 0; i < gw; i += 2) {
      var lam = 400 + i / gw * 300, r = reflect(lam, d), h = r / 0.17 * gh;
      ctx.fillStyle = spec(lam, 0.8); ctx.fillRect(gx + i, gy + gh - h, 2, h);
    }
    txt('Reflected fraction vs wavelength, 400–700 nm (max 16 %)', gx, gy - 8, COL.muted, 11);
    var rr = reflect(610, d) / 0.16, gg = reflect(550, d) / 0.16, bb = reflect(465, d) / 0.16;
    var sw = 'rgb(' + Math.round(255 * rr) + ',' + Math.round(255 * gg) + ',' + Math.round(255 * bb) + ')';
    var swx = narrow ? 16 : 16, swy = narrow ? gy + gh + 22 : cy + 92;
    ctx.fillStyle = sw; ctx.fillRect(swx, swy, 60, 30); ctx.strokeStyle = COL.faint; ctx.strokeRect(swx + 0.5, swy + 0.5, 60, 30);
    txt('approximate colour of the reflection', swx + 70, swy + 19, COL.muted, 11);
  }
  function spec(l, a) {
    var h = l < 440 ? 270 : l < 490 ? 270 - (l - 440) / 50 * 60 : l < 510 ? 210 - (l - 490) / 20 * 60 : l < 580 ? 150 - (l - 510) / 70 * 90 : l < 645 ? 60 - (l - 580) / 65 * 60 : 0;
    return 'hsla(' + h.toFixed(0) + ',80%,58%,' + a + ')';
  }

  function drawG() {
    var narrow = W < 560, x0 = 16, y0 = 50, rowH = narrow ? 92 : 74, exp = ROWS[3][1];
    txt('The electron\'s magnetic moment, g/2, digit by digit', 16, 22, COL.text, narrow ? 12 : 14);
    var nShow = Math.min(4, 1 + Math.floor(t / 1.6));
    for (var r = 0; r < nShow; r++) {
      var row = ROWS[r], y = y0 + r * rowH;
      txt(row[0], x0, y + 14, COL.muted, 12);
      var digits = row[1], fs = narrow ? 17 : 24, cw = fs * 0.62, xs = x0, yy = y + 18 + fs, match = true;
      for (var i = 0; i < digits.length; i++) {
        var ch = digits[i];
        if (r < 3 && match && ch !== exp[i]) match = false;
        txt(ch, xs, yy, r === 3 ? COL.text : (i >= exp.length || !match) ? COL.bad : COL.ok, fs, 'left', 'monospace');
        xs += cw;
      }
      if (row[2]) txt(row[2], xs + 8, yy, COL.muted, narrow ? 10 : 12);
    }
    if (nShow === 4) txt('Green: digits that agree with the measurement. They agree to about 1 part in 10¹²; the theory needs α, whose measured values disagree at that level.', x0, H - 24, COL.muted, narrow ? 10 : 11);
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (mode === 'mirror') drawMirror(); else if (mode === 'glass') drawGlass(); else drawG();
  }

  function setStatus() {
    var el = document.getElementById('sim-status'); if (!el) return;
    if (mode === 'mirror') el.textContent = grating ? 'Grating: strips whose arrows point backwards are scraped off, so the rest add up even away from the mirror angle.' : noMiddle ? 'Middle strips removed: the arrows that lined up are gone, and the end strips mostly cancel.' : 'Strips near the middle have almost equal path lengths, so their arrows line up; the ends spin round and cancel.';
    else if (mode === 'glass') el.textContent = 'Glass layer ' + dNm.toFixed(0) + ' nm thick: reflects ' + (reflect(550, dNm) * 100).toFixed(1) + ' % of 550 nm light. Two arrows, one from each surface; the layer thickness sets the angle between them.';
    else el.textContent = 'g/2: Dirac gives 1, Schwinger\'s first correction gets three more digits, and the full calculation matches the 2023 measurement to about one part in 10¹².';
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05); lastTs = ts;
    t += dt;
    if (mode === 'mirror') shown = Math.min(NSTRIP, Math.floor((t % 9) / 0.15) + 1);
    if (mode === 'glass' && autoD) { dNm = 500 + 450 * Math.sin(t * 0.25 - Math.PI / 2); syncD(); }
    draw(); rafId = requestAnimationFrame(loop);
  }
  function syncD() {
    var s = document.getElementById('d-slider'), v = document.getElementById('d-val');
    if (s) { s.value = String(Math.round(dNm)); s.setAttribute('aria-valuetext', Math.round(dNm) + ' nanometres'); }
    if (v) v.textContent = Math.round(dNm) + ' nm';
  }
  function setBtn(p) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = p ? '⏸ Pause' : '▶ Play'; btn.dataset.state = p ? 'playing' : 'paused'; }
    var d = document.querySelector('.sim-caption__dot'); if (d) d.classList.toggle('is-running', p);
  }
  function start() {
    if (running) return;
    if (reducedMotion) { t = 10; shown = NSTRIP; draw(); return; }
    running = true; lastTs = null; setBtn(true); rafId = requestAnimationFrame(loop);
  }
  function pause() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; setBtn(false); setStatus(); }
  function reset() { pause(); t = 0; shown = NSTRIP; if (mode === 'glass') { dNm = 300; syncD(); } setStatus(); draw(); }
  function destroy() { pause(); window.removeEventListener('resize', onResize); if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  function onResize() {
    if (!mountEl || !canvas) return;
    var dpr = window.devicePixelRatio || 1;
    W = Math.round(mountEl.getBoundingClientRect().width) || 680;
    H = W < 560 ? 500 : 420;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }

  function toggle(id, getter, setter, onTxt, offTxt) {
    var b = document.getElementById(id); if (!b) return;
    b.addEventListener('click', function () { setter(!getter()); b.setAttribute('aria-pressed', String(getter())); b.textContent = getter() ? onTxt : offTxt; setStatus(); draw(); });
  }

  function init() {
    mountEl = document.getElementById('sim-mount'); if (!mountEl) return;
    canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Feynman arrows for light reflecting from a mirror or a glass layer, and a digit-by-digit comparison of the electron magnetic moment');
    canvas.style.display = 'block'; mountEl.appendChild(canvas); ctx = canvas.getContext('2d');
    var groups = { mirror: 'mirror-controls', glass: 'glass-controls', g: null };
    ['mirror', 'glass', 'g'].forEach(function (k) {
      var b = document.getElementById('mode-' + k);
      if (b) b.addEventListener('click', function () {
        mode = k; t = 0; shown = NSTRIP;
        ['mirror', 'glass', 'g'].forEach(function (q) {
          var e = document.getElementById('mode-' + q); if (e) e.setAttribute('aria-pressed', String(q === k));
          if (groups[q]) { var gEl = document.getElementById(groups[q]); if (gEl) gEl.style.display = q === k ? 'contents' : 'none'; }
        });
        setStatus(); draw();
      });
    });
    var ds = document.getElementById('det-slider');
    if (ds) ds.addEventListener('input', function () { det = parseFloat(ds.value); document.getElementById('det-val').textContent = (det >= 0 ? '+' : '') + det.toFixed(2); ds.setAttribute('aria-valuetext', det.toFixed(2) + ' mirror half-widths from the mirror image position'); draw(); });
    toggle('middle-toggle', function () { return noMiddle; }, function (v) { noMiddle = v; }, 'Put the middle back', 'Remove the middle strips');
    toggle('grating-toggle', function () { return grating; }, function (v) { grating = v; }, 'Restore the full mirror', 'Make a grating');
    var dsl = document.getElementById('d-slider');
    if (dsl) dsl.addEventListener('input', function () { autoD = false; dNm = parseFloat(dsl.value); syncD(); setStatus(); draw(); });
    window.addEventListener('resize', onResize); onResize(); setStatus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
