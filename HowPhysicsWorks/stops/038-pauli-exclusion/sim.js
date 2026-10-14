/* ============================================================
   sim.js — Stop 038: The Pauli Exclusion Principle
   Atom view: electrons fill (n, l, m_l, m_s) states one at a time in
   Madelung order, one electron per state; Hund's rule within a subshell.
   Real ground states of Cr (Z = 24) and Cu (Z = 29) differ; noted on screen.
   Star view: ideal degenerate electron gas at T = 0 (μe = 2):
     x = p_F / (m_e c),  p_F = ħ (3π² n_e)^{1/3}
     P = (π m_e⁴ c⁵ / 3h³) [x(2x² − 3)√(1 + x²) + 3 asinh x]
   which goes as n^{5/3} at low density and n^{4/3} at high density.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var SYM = ['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr'];
  var SUB = [[1,0],[2,0],[2,1],[3,0],[3,1],[4,0],[3,2],[4,1]];   /* Madelung order up to Kr */
  var LCH = 'spdf';
  var statusAcc = 0;
  var CLOSED = { 2: 1, 10: 1, 18: 1, 36: 1 };
  var REAL = { 24: '[Ar] 3d⁵ 4s¹', 29: '[Ar] 3d¹⁰ 4s¹' };

  var HBAR = 1.054571817e-34, HPL = 6.62607015e-34, ME = 9.1093837015e-31, C = 299792458, MU = 1.66053906660e-27, MEC2_KEV = 510.99895069;
  var MU_E = 2;

  var mode = 'atom', Z = 1, pauliOn = true, addAcc = 0, pulse = 0;
  var logRho = 6, jig = [];
  for (var j = 0; j < 40; j++) jig.push([Math.random(), Math.random(), Math.random() * 2 * Math.PI]);

  var COL = { era: 'oklch(0.68 0.20 310)', up: 'oklch(0.80 0.14 200)', dn: 'oklch(0.80 0.14 60)', text: 'rgba(255,255,255,0.88)', muted: 'rgba(255,255,255,0.55)', faint: 'rgba(255,255,255,0.18)', closed: 'oklch(0.85 0.15 95)' };

  function txt(s, x, y, col, size, align) {
    ctx.fillStyle = col || COL.text; ctx.font = (size || 12) + 'px "DM Sans", sans-serif';
    ctx.textAlign = align || 'left'; ctx.fillText(s, x, y);
  }

  /* electrons per (subshell, m_l, spin) for the first z electrons */
  function fill(z) {
    var occ = [], left = z, newest = null;
    SUB.forEach(function (s, si) {
      var nb = 2 * s[1] + 1, boxes = [];
      for (var b = 0; b < nb; b++) boxes.push([0, 0]);
      var take = Math.min(left, 2 * nb);
      for (var k = 0; k < take; k++) {
        var b2 = k < nb ? k : k - nb, sp = k < nb ? 0 : 1;
        boxes[b2][sp] = 1;
        if (left - k === 1) newest = { si: si, b: b2, sp: sp, n: s[0], l: s[1], ml: b2 - s[1], ms: sp ? '−½' : '+½' };
      }
      left -= take; occ.push(boxes);
    });
    return { occ: occ, newest: newest };
  }
  function config(z) {
    var left = z, out = [];
    SUB.forEach(function (s) { var t = Math.min(left, 2 * (2 * s[1] + 1)); if (t > 0) out.push(s[0] + LCH[s[1]] + sup(t)); left -= t; });
    return out.join(' ');
  }
  function sup(k) { var m = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }; return String(k).split('').map(function (d) { return m[d]; }).join(''); }

  function arrow(x, y, up, col, h) {
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2;
    var y0 = up ? y + h / 2 : y - h / 2, y1 = up ? y - h / 2 : y + h / 2, d = up ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x - 4, y1 + 6 * d); ctx.lineTo(x + 4, y1 + 6 * d); ctx.closePath(); ctx.fill();
  }

  function drawAtom() {
    var narrow = W < 560, f = fill(Z), bx = narrow ? 14 : 24, top = 52;
    txt('Z = ' + Z + ' · ' + SYM[Z - 1], bx, 24, COL.text, 15);
    txt(pauliOn ? config(Z) : 'exclusion switched off: all ' + Z + ' in 1s', bx + (narrow ? 0 : 130), narrow ? 42 : 24, CLOSED[Z] && pauliOn ? COL.closed : COL.muted, 12);
    var bw = narrow ? 30 : 38, bh = narrow ? 30 : 34, gap = 4, rowH = bh + 8;
    if (narrow) top = 58;
    var energyOrder = SUB.map(function (s, i) { return i; });
    energyOrder.forEach(function (si, row) {
      var s = SUB[si], nb = 2 * s[1] + 1, y = top + (SUB.length - 1 - row) * rowH;
      txt(s[0] + LCH[s[1]], bx, y + bh / 2 + 4, COL.muted, 12);
      for (var b = 0; b < nb; b++) {
        var x = bx + 34 + b * (bw + gap);
        ctx.strokeStyle = COL.faint; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, bw, bh);
        if (!pauliOn) continue;
        var occ = f.occ[si][b];
        var isNew = f.newest && f.newest.si === si && f.newest.b === b;
        if (occ[0]) arrow(x + bw * 0.33, y + bh / 2, true, isNew && f.newest.sp === 0 ? glow() : COL.up, bh * 0.62);
        if (occ[1]) arrow(x + bw * 0.67, y + bh / 2, false, isNew && f.newest.sp === 1 ? glow() : COL.dn, bh * 0.62);
      }
      if (!narrow) txt(s[1] ? 'l = ' + s[1] + ', m_l = −' + s[1] + ' … +' + s[1] : 'l = 0, m_l = 0', bx + 34 + nb * (bw + gap) + 8, y + bh / 2 + 4, COL.muted, 11);
    });
    if (!pauliOn) {
      var y1 = top + (SUB.length - 1) * rowH, x1 = bx + 34;
      for (var k = 0; k < Z; k++) arrow(x1 + 6 + (k % 12) * 3, y1 + bh / 2 - Math.floor(k / 12) * 3, k % 2 === 0, k % 2 ? COL.dn : COL.up, bh * 0.5);
    }
    var by = top + SUB.length * rowH + 6;
    txt('↑ energy order used (Madelung): 1s 2s 2p 3s 3p 4s 3d 4p', bx, by, COL.muted, 11);
    if (pauliOn && f.newest) txt('Newest electron: n = ' + f.newest.n + ', l = ' + f.newest.l + ', m_l = ' + f.newest.ml + ', m_s = ' + f.newest.ms, bx, by + 20, COL.text, 12);
    if (pauliOn && REAL[Z]) txt('Real ' + SYM[Z - 1] + ' is ' + REAL[Z] + ': an exception to this simple order', bx, by + 40, COL.closed, 12);
    else if (pauliOn && CLOSED[Z]) txt('Outer s and p full: ' + SYM[Z - 1] + ' is a noble gas', bx, by + 40, COL.closed, 12);
    if (!narrow) {
      var tx = W - 210, ty = 60;
      txt('Shell capacity 2n²', tx, ty, COL.muted, 11);
      for (var n = 1; n <= 4; n++) {
        var cnt = 0, left = pauliOn ? Z : 0;
        SUB.forEach(function (s) { var t = Math.min(left, 2 * (2 * s[1] + 1)); if (s[0] === n) cnt += t; left -= t; });
        txt('n = ' + n + ': ' + cnt + ' of ' + (2 * n * n), tx, ty + 20 * n, COL.text, 12);
      }
    }
  }
  function glow() { return 'rgba(255,255,255,' + (0.55 + 0.45 * Math.abs(Math.sin(pulse * 3))).toFixed(2) + ')'; }

  function gasP(rhoCgs) {
    var ne = rhoCgs * 1000 / (MU_E * MU), pf = HBAR * Math.pow(3 * Math.PI * Math.PI * ne, 1 / 3), x = pf / (ME * C);
    var P = Math.PI * Math.pow(ME, 4) * Math.pow(C, 5) / (3 * Math.pow(HPL, 3)) * (x * (2 * x * x - 3) * Math.sqrt(1 + x * x) + 3 * Math.asinh(x));
    if (x < 1e-3) P = Math.pow(HBAR, 2) / (5 * ME) * Math.pow(3 * Math.PI * Math.PI, 2 / 3) * Math.pow(ne, 5 / 3);
    return { ne: ne, x: x, P: P, ef: MEC2_KEV * (Math.sqrt(1 + x * x) - 1) };
  }

  function drawStar() {
    var narrow = W < 560, g = gasP(Math.pow(10, logRho));
    txt('Electron gas squeezed to ρ = 10^' + logRho.toFixed(1) + ' g/cm³ (μe = 2, T = 0)', 16, 22, COL.text, narrow ? 12 : 14);
    var bxW = narrow ? W - 32 : W * 0.36, bxH = narrow ? 150 : 250, bx0 = 16, by0 = 40;
    var side = bxW * (0.35 + 0.65 * (10 - logRho) / 7);
    ctx.strokeStyle = COL.faint; ctx.strokeRect(bx0 + 0.5, by0 + 0.5, bxW, bxH);
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(bx0 + side, by0, bxW - side, bxH);
    txt('piston', bx0 + side + 6, by0 + 16, COL.muted, 11);
    var spd = Math.min(1, g.x / (1 + g.x)) * 6 + 0.4;
    ctx.fillStyle = COL.up;
    for (var k = 0; k < jig.length; k++) {
      var q = jig[k], px = bx0 + 6 + q[0] * (side - 12) + Math.sin(pulse * spd + q[2]) * 4, py = by0 + 6 + q[1] * (bxH - 12) + Math.cos(pulse * spd * 1.3 + q[2]) * 4;
      ctx.beginPath(); ctx.arc(px, py, 2.5, 0, 2 * Math.PI); ctx.fill();
    }
    var gx = narrow ? 44 : bx0 + bxW + 64, gy = narrow ? by0 + bxH + 30 : by0 + 10, gw = narrow ? W - 60 : W - gx - 20, gh = narrow ? H - gy - 96 : bxH - 20;
    var lo = 3, hi = 10, pLo = Math.log10(gasP(Math.pow(10, lo)).P), pHi = Math.log10(gasP(Math.pow(10, hi)).P);
    function X(lr) { return gx + (lr - lo) / (hi - lo) * gw; }
    function Y(lp) { return gy + gh - (lp - pLo) / (pHi - pLo) * gh; }
    ctx.strokeStyle = COL.faint; ctx.strokeRect(gx + 0.5, gy + 0.5, gw, gh);
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    var nr0 = gasP(1e3), ur0 = gasP(1e10);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(X(lo), Y(Math.log10(nr0.P))); ctx.lineTo(X(hi), Y(Math.log10(nr0.P) + 5 / 3 * (hi - lo))); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(lo), Y(Math.log10(ur0.P) - 4 / 3 * (hi - lo))); ctx.lineTo(X(hi), Y(Math.log10(ur0.P))); ctx.stroke();
    ctx.setLineDash([]);
    ctx.save(); ctx.beginPath(); ctx.rect(gx, gy, gw, gh); ctx.clip();
    ctx.strokeStyle = COL.era; ctx.lineWidth = 2; ctx.beginPath();
    for (var i = 0; i <= 140; i++) { var lr = lo + i / 140 * (hi - lo), yy = Y(Math.log10(gasP(Math.pow(10, lr)).P)); if (i) ctx.lineTo(X(lr), yy); else ctx.moveTo(X(lr), yy); }
    ctx.stroke(); ctx.restore();
    ctx.fillStyle = COL.closed; ctx.beginPath(); ctx.arc(X(logRho), Y(Math.log10(g.P)), 5, 0, 2 * Math.PI); ctx.fill();
    txt('log pressure vs log density (formula)', gx, gy - 6, COL.muted, 11);
    txt('dashed: n^5/3 and n^4/3 limits', gx + gw / 2, gy + gh + 14, COL.muted, 10, 'center');
    txt('10³', gx, gy + gh + 14, COL.muted, 10, 'center'); txt('10¹⁰ g/cm³', gx + gw, gy + gh + 14, COL.muted, 10, 'right');
    var d = 0.01, s1 = (Math.log10(gasP(Math.pow(10, logRho + d)).P) - Math.log10(gasP(Math.pow(10, logRho - d)).P)) / (2 * d);
    var ry = narrow ? H - 58 : by0 + bxH + 32;
    txt('n_e = ' + sci(g.ne) + ' m⁻³ · Fermi energy = ' + fmtE(g.ef) + ' · P = ' + sci(g.P) + ' Pa', 16, ry, COL.text, narrow ? 11 : 12);
    txt('local slope d ln P / d ln n = ' + s1.toFixed(2) + (s1 > 1.6 ? ' (non-relativistic, 5/3)' : s1 < 1.37 ? ' (relativistic, 4/3)' : ' (in between)'), 16, ry + 18, COL.muted, 11);
  }
  function fmtE(kev) { return kev >= 1000 ? (kev / 1000).toFixed(2) + ' MeV' : kev >= 1 ? kev.toFixed(1) + ' keV' : (kev * 1000).toFixed(0) + ' eV'; }
  function sci(x) {
    var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e);
    return m.toFixed(1) + '×10' + sup2(e);
  }
  function sup2(e) { var m = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }; return String(e).split('').map(function (d) { return m[d]; }).join(''); }

  function draw() { if (!ctx) return; ctx.clearRect(0, 0, W, H); if (mode === 'atom') drawAtom(); else drawStar(); }

  function setStatus() {
    var el = document.getElementById('sim-status'); if (!el) return;
    if (mode === 'star') {
      var g = gasP(Math.pow(10, logRho));
      el.textContent = 'Degenerate electron gas at 10^' + logRho.toFixed(1) + ' g/cm³: Fermi energy ' + fmtE(g.ef) + '. Squeeze harder and the pressure rises; at high density it rises more slowly (n^4/3), which is what sets the Chandrasekhar limit.';
      return;
    }
    el.textContent = pauliOn
      ? SYM[Z - 1] + ' (Z = ' + Z + '): ' + config(Z) + (CLOSED[Z] ? '. Outer s and p full.' : '.') + (REAL[Z] ? ' (Real ' + SYM[Z - 1] + ': ' + REAL[Z] + '.)' : '')
      : 'Exclusion switched off: every electron would drop into 1s, and there would be no shells and no periodic table.';
  }
  function syncZ() {
    var s = document.getElementById('z-slider'), v = document.getElementById('z-val');
    if (s) { s.value = String(Z); s.setAttribute('aria-valuetext', 'Z = ' + Z + ', ' + SYM[Z - 1]); }
    if (v) v.textContent = Z + ' (' + SYM[Z - 1] + ')';
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05); lastTs = ts;
    pulse += dt;
    if (mode === 'atom' && pauliOn) {
      addAcc += dt;
      if (addAcc > 0.7 && Z < 36) { addAcc = 0; Z++; syncZ(); setStatus(); }
    } else if (mode === 'star') {
      statusAcc += dt; if (statusAcc > 0.5) { statusAcc = 0; setStatus(); }
      logRho = 6.5 + 3.5 * Math.sin(pulse * 0.25 - Math.PI / 2 + 0.15);
      var rs = document.getElementById('rho-slider'); if (rs) rs.value = logRho.toFixed(1);
      var rv = document.getElementById('rho-val'); if (rv) rv.textContent = '10^' + logRho.toFixed(1) + ' g/cm³';
    }
    draw();
    rafId = requestAnimationFrame(loop);
  }
  function setBtn(p) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = p ? '⏸ Pause' : '▶ Play'; btn.dataset.state = p ? 'playing' : 'paused'; }
    var dot = document.querySelector('.sim-caption__dot'); if (dot) dot.classList.toggle('is-running', p);
  }
  function start() {
    if (running) return;
    if (reducedMotion) { if (mode === 'atom') { Z = Math.min(36, Z + 8); syncZ(); } setStatus(); draw(); return; }
    running = true; lastTs = null; setBtn(true); rafId = requestAnimationFrame(loop);
  }
  function pause() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; setBtn(false); setStatus(); }
  function reset() { pause(); if (mode === 'atom') { Z = 1; syncZ(); } else { logRho = 6; pulse = 0; } addAcc = 0; setStatus(); draw(); }
  function destroy() { pause(); window.removeEventListener('resize', onResize); if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  function onResize() {
    if (!mountEl || !canvas) return;
    var dpr = window.devicePixelRatio || 1;
    W = Math.round(mountEl.getBoundingClientRect().width) || 680;
    H = W < 560 ? 540 : 480;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }

  function init() {
    mountEl = document.getElementById('sim-mount'); if (!mountEl) return;
    canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Electron states of an atom filled one at a time, or the pressure of a squeezed electron gas against its density');
    canvas.style.display = 'block'; mountEl.appendChild(canvas); ctx = canvas.getContext('2d');
    var zs = document.getElementById('z-slider');
    if (zs) zs.addEventListener('input', function () { Z = parseInt(zs.value, 10); syncZ(); setStatus(); draw(); });
    var pt = document.getElementById('pauli-toggle');
    if (pt) pt.addEventListener('click', function () {
      pauliOn = !pauliOn; pt.setAttribute('aria-pressed', String(!pauliOn));
      pt.textContent = pauliOn ? 'Switch off exclusion' : 'Switch exclusion back on'; setStatus(); draw();
    });
    var rs = document.getElementById('rho-slider');
    if (rs) rs.addEventListener('input', function () {
      var was = running; pause(); logRho = parseFloat(rs.value);
      document.getElementById('rho-val').textContent = '10^' + logRho.toFixed(1) + ' g/cm³';
      rs.setAttribute('aria-valuetext', '10 to the ' + logRho.toFixed(1) + ' grams per cubic centimetre'); setStatus(); draw();
      if (was) { pulse = Math.asin(Math.max(-1, Math.min(1, (logRho - 6.5) / 3.5))) / 0.25 + Math.PI * 2 - 0.6; }
    });
    ['atom', 'star'].forEach(function (k) {
      var b = document.getElementById('mode-' + k);
      if (b) b.addEventListener('click', function () {
        mode = k;
        ['atom', 'star'].forEach(function (q) { var e = document.getElementById('mode-' + q); if (e) e.setAttribute('aria-pressed', String(q === k)); });
        var ac = document.getElementById('atom-controls'), sc = document.getElementById('star-controls');
        if (ac) ac.style.display = k === 'atom' ? 'contents' : 'none';
        if (sc) sc.style.display = k === 'star' ? 'contents' : 'none';
        setStatus(); draw();
      });
    });
    window.addEventListener('resize', onResize); onResize(); syncZ(); setStatus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
