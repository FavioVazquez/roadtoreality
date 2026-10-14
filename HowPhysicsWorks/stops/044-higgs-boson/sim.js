/* ============================================================
   sim.js — Stop 044: The Higgs Boson
   View 1: the potential V = mu^2 |phi|^2 + lambda |phi|^4 (lambda = 1,
   model units). For mu^2 < 0 the symmetric point is a maximum and a
   damped ball rolls to the ring of minima at |phi| = sqrt(-mu^2 / 2).
   View 2: a diphoton mass histogram filled one event at a time.
   Background: exponential, slope 25 GeV, 100-160 GeV. Signal: Gaussian
   at 125.20 GeV, width 1.6 GeV (display choice). The signal fraction is
   set so the expected window significance S/sqrt(B) reaches 5 at the end
   of the run; it is an illustration, not the 2012 data.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COL = { text: 'rgba(255,255,255,0.88)', muted: 'rgba(255,255,255,0.55)', faint: 'rgba(255,255,255,0.16)', hat: 'oklch(0.72 0.12 300)', ball: 'oklch(0.85 0.15 95)', sig: 'oklch(0.80 0.14 40)', bg: 'oklch(0.75 0.10 220)' };

  var mode = 'pot';
  /* potential */
  var m2 = -0.8, bx = 0, by = 0, vx = 0, vy = 0, az = 0;
  /* histogram */
  var M0 = 100, M1 = 160, BIN = 2, NB = 30, MH = 125.2, SIG = 1.6, TAU = 25, NTOT = 40000;
  var WLO = 122, WHI = 128, rate = 1000, bgOnly = false;
  var bins = [], nEv = 0, carry = 0, fs = 0, fbw = 0, fsw = 0;
  var seed = 12345;

  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed + 0.5) / 4294967296; }
  function gauss() { var u = rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function cdfExp(m) { return (Math.exp(-(m - M0) / TAU)); }
  function erf(x) { var t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
  function setup() {
    var norm = cdfExp(M0) - cdfExp(M1);
    fbw = (cdfExp(WLO) - cdfExp(WHI)) / norm;
    fsw = 0.5 * (erf((WHI - MH) / (SIG * Math.SQRT2)) - erf((WLO - MH) / (SIG * Math.SQRT2)));
    var k = 5 / (fsw * Math.sqrt(NTOT) / Math.sqrt(fbw)), k2 = k * k;
    fs = (-k2 + Math.sqrt(k2 * k2 + 4 * k2)) / 2;
  }
  function sampleBg() { var norm = cdfExp(M0) - cdfExp(M1), u = rnd(); return M0 - TAU * Math.log(1 - u * norm); }
  function addEvents(n) {
    for (var i = 0; i < n && nEv < NTOT; i++) {
      var m = (!bgOnly && rnd() < fs) ? MH + SIG * gauss() : sampleBg();
      if (m >= M0 && m < M1) bins[Math.floor((m - M0) / BIN)]++;
      nEv++;
    }
  }
  function expBg(lo, hi, n) { var norm = cdfExp(M0) - cdfExp(M1); return n * (bgOnly ? 1 : 1 - fs) * (cdfExp(lo) - cdfExp(hi)) / norm; }
  function windowStats() {
    var N = 0; for (var i = 0; i < NB; i++) { var lo = M0 + i * BIN; if (lo >= WLO && lo + BIN <= WHI) N += bins[i]; }
    var B = expBg(WLO, WHI, nEv), Z = B > 0 ? (N - B) / Math.sqrt(B) : 0;
    return { N: N, B: B, Z: Z };
  }

  function txt(s, x, y, col, size, align, bold) {
    ctx.fillStyle = col || COL.text; ctx.font = (bold ? '600 ' : '') + (size || 12) + 'px "DM Sans", sans-serif';
    ctx.textAlign = align || 'left'; ctx.fillText(s, x, y);
  }
  function V(r) { return m2 * r * r + r * r * r * r; }
  function rmin() { return m2 < 0 ? Math.sqrt(-m2 / 2) : 0; }

  var FERM = [['t', 172.57], ['b', 4.183], ['τ', 1.77693], ['c', 1.2730], ['μ', 0.1056583755], ['e', 0.00051099895]];

  function drawPot() {
    var narrow = W < 560, cx = narrow ? W / 2 : W * 0.35, s = narrow ? W * 0.36 : W * 0.26, cy = narrow ? 230 : 270, k = narrow ? 130 : 160, flat = 0.32, ytop = 40;
    txt(narrow ? 'V = μ²|φ|² + λ|φ|⁴' : 'Potential V = μ²|φ|² + λ|φ|⁴  (λ = 1, model units)', narrow ? W / 2 : 16, 22, COL.muted, 12, narrow ? 'center' : 'left');
    for (var r = 0.06; r <= 1.1001; r += 0.06) {
      var y = cy - V(r) * k; if (y < ytop) break;
      ctx.strokeStyle = 'rgba(180,140,255,' + (0.18 + 0.5 * (1 - r / 1.1)).toFixed(2) + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, y, r * s, r * s * flat, 0, 0, 2 * Math.PI); ctx.stroke();
    }
    ctx.strokeStyle = COL.hat; ctx.lineWidth = 2; ctx.beginPath();
    var pen = false; for (var i = -110; i <= 110; i++) { var rr = i / 100, xx = cx + rr * s, yy = cy - V(Math.abs(rr)) * k; if (yy < ytop) { pen = false; continue; } if (!pen) { ctx.moveTo(xx, yy); pen = true; } else ctx.lineTo(xx, yy); }
    ctx.stroke();
    if (m2 < 0) { var rm = rmin(); ctx.strokeStyle = COL.ball; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.ellipse(cx, cy - V(rm) * k, rm * s, rm * s * flat, 0, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]); }
    var ca = Math.cos(az), sa = Math.sin(az), px = bx * ca - by * sa, py = bx * sa + by * ca, br = Math.hypot(bx, by);
    var sx = cx + px * s, sy = cy - V(br) * k + py * s * flat - 8;
    ctx.fillStyle = COL.ball; ctx.beginPath(); ctx.arc(sx, sy, 8, 0, 2 * Math.PI); ctx.fill();
    var ty = narrow ? cy + 90 : cy + 100;
    var line1 = m2 < 0 ? 'μ² = ' + m2.toFixed(2) + ' < 0: the centre is a hilltop; minima form a ring at |φ| = ' + rmin().toFixed(2) : 'μ² = ' + m2.toFixed(2) + ' ≥ 0: the centre is the only minimum; the symmetry is unbroken';
    if (narrow) { txt(m2 < 0 ? 'μ² = ' + m2.toFixed(2) + ' < 0: ring of minima' : 'μ² = ' + m2.toFixed(2) + ' ≥ 0: symmetric minimum', W / 2, ty, COL.text, 12, 'center'); txt('Ball at |φ| = ' + br.toFixed(2) + (m2 < 0 ? ', ring at ' + rmin().toFixed(2) : ''), W / 2, ty + 18, COL.muted, 11, 'center'); }
    else { txt(line1, 16, ty, COL.text, 12); txt('Ball at |φ| = ' + br.toFixed(2) + '. In nature the minimum sits at v = 246.22 GeV.', 16, ty + 18, COL.muted, 11); }
    /* couplings */
    var gx = narrow ? 18 : W * 0.70, gy = narrow ? ty + 46 : 60, gw = narrow ? W - 36 : W * 0.27, rowH = narrow ? 20 : 26;
    txt('Higgs coupling to fermion f = m_f / v', gx, gy, COL.muted, 11);
    txt('(bar length: log scale)', gx, gy + 14, COL.muted, 10);
    FERM.forEach(function (f, j) {
      var c = f[1] / 246.22, y = gy + 30 + j * rowH, L = (Math.log10(c) + 6) / 6 * (gw - 90);
      ctx.fillStyle = COL.sig; ctx.fillRect(gx + 22, y - 9, Math.max(2, L), 10);
      txt(f[0], gx, y, COL.text, 12, 'left', true);
      txt(c >= 0.01 ? c.toFixed(3) : c.toExponential(1).replace('e-', '×10⁻').replace(/⁻(\d)/, function (a, d) { return '⁻' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; }), gx + 28 + Math.max(2, L), y, COL.muted, 10);
    });
  }

  function drawHist() {
    var narrow = W < 560, x0 = narrow ? 40 : 56, x1 = W - 16, y0 = 40, y1 = H - (narrow ? 170 : 120);
    var st = windowStats(), maxC = 0;
    for (var i = 0; i < NB; i++) maxC = Math.max(maxC, bins[i]);
    var bExp0 = expBg(M0, M0 + BIN, Math.max(nEv, 1)), top = Math.max(10, maxC, bExp0) * 1.15;
    txt('Diphoton mass, events per 2 GeV (illustrative)', narrow ? W / 2 : x0, 22, COL.muted, 12, narrow ? 'center' : 'left');
    var X = function (m) { return x0 + (m - M0) / (M1 - M0) * (x1 - x0); }, Y = function (c) { return y1 - c / top * (y1 - y0); };
    ctx.fillStyle = 'rgba(255,200,120,0.07)'; ctx.fillRect(X(WLO), y0, X(WHI) - X(WLO), y1 - y0);
    for (i = 0; i < NB; i++) {
      var c = bins[i], lo = M0 + i * BIN;
      ctx.fillStyle = (lo >= WLO && lo + BIN <= WHI) ? COL.sig : COL.bg;
      ctx.fillRect(X(lo) + 1, Y(c), X(lo + BIN) - X(lo) - 2, y1 - Y(c));
    }
    ctx.strokeStyle = COL.text; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.beginPath();
    for (i = 0; i <= 60; i++) { var m = M0 + i, e = expBg(m - BIN / 2, m + BIN / 2, nEv); if (i === 0) ctx.moveTo(X(m), Y(e)); else ctx.lineTo(X(m), Y(e)); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = COL.faint; ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.stroke();
    for (m = 100; m <= 160; m += narrow ? 20 : 10) txt(String(m), X(m), y1 + 14, COL.muted, 10, 'center');
    txt('m(γγ), GeV', (x0 + x1) / 2, y1 + 28, COL.muted, 10, 'center');
    txt(String(Math.round(top / 1.15)), x0 - 4, Y(top / 1.15) + 4, COL.muted, 9, 'right');
    var frac = nEv / NTOT, ry = y1 + (narrow ? 52 : 50);
    ctx.fillStyle = COL.faint; ctx.fillRect(x0, ry - 8, x1 - x0, 6); ctx.fillStyle = COL.ball; ctx.fillRect(x0, ry - 8, (x1 - x0) * frac, 6);
    txt('Share of the run recorded: ' + Math.round(frac * 100) + ' %' + (bgOnly ? ' (background only)' : ''), x0, ry + 10, COL.muted, 11);
    var zl = 'Window ' + WLO + '–' + WHI + ' GeV: N = ' + st.N + ', expected background B = ' + st.B.toFixed(0);
    var zl2 = 'Excess (N − B)/√B = ' + st.Z.toFixed(1) + ' σ' + (st.Z >= 5 ? '  — past 5σ' : '');
    if (narrow) { txt('Window ' + WLO + '–' + WHI + ' GeV: N = ' + st.N + ', B = ' + st.B.toFixed(0), x0, ry + 30, COL.text, 11); txt(zl2, x0, ry + 48, st.Z >= 5 ? COL.ball : COL.text, 12, 'left', true); }
    else { txt(zl, x0, ry + 30, COL.text, 12); txt(zl2, x0, ry + 50, st.Z >= 5 ? COL.ball : COL.text, 13, 'left', true); }
  }

  function draw() { if (!ctx) return; ctx.clearRect(0, 0, W, H); if (mode === 'pot') drawPot(); else drawHist(); }

  function setStatus() {
    var el = document.getElementById('sim-status'); if (!el) return;
    if (mode === 'pot') el.textContent = m2 < 0 ? 'μ² < 0: the ball leaves the symmetric top and settles somewhere on the ring of minima at |φ| = ' + rmin().toFixed(2) + '.' : 'μ² ≥ 0: the symmetric point is the minimum, so the ball stays at φ = 0.';
    else { var st = windowStats(); el.textContent = nEv + ' events. In the 122–128 GeV window: ' + st.N + ' observed, ' + st.B.toFixed(0) + ' expected from background, excess ' + st.Z.toFixed(1) + ' σ.'; }
  }

  var statusT = 0;
  function step(dt) {
    if (mode === 'pot') {
      az += 0.25 * dt;
      var sub = 8, h = dt / sub;
      for (var i = 0; i < sub; i++) {
        var r2 = bx * bx + by * by, f = -(2 * m2 + 4 * r2);
        if (r2 < 1e-8 && m2 < 0) { bx += (rnd() - 0.5) * 2e-3; by += (rnd() - 0.5) * 2e-3; }
        vx += (f * bx - 1.4 * vx) * h * 3; vy += (f * by - 1.4 * vy) * h * 3;
        bx += vx * h * 3; by += vy * h * 3;
      }
    } else {
      carry += rate * dt; var n = Math.floor(carry); carry -= n; addEvents(n);
      if (nEv >= NTOT) { pause(); }
    }
    statusT += dt; if (statusT > 0.25) { statusT = 0; setStatus(); }
  }
  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05); lastTs = ts;
    step(dt); draw(); if (running) rafId = requestAnimationFrame(loop);
  }
  function setBtn(pl) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = pl ? '⏸ Pause' : '▶ Play'; btn.dataset.state = pl ? 'playing' : 'paused'; }
    var d = document.querySelector('.sim-caption__dot'); if (d) d.classList.toggle('is-running', pl);
  }
  function start() {
    if (running) return;
    if (mode === 'hist' && nEv >= NTOT) resetHist();
    if (reducedMotion) {
      if (mode === 'pot') { bx = rmin() * 0.6; by = rmin() * 0.8; vx = vy = 0; } else addEvents(Math.round(NTOT / 4));
      setStatus(); draw(); return;
    }
    running = true; lastTs = null; setBtn(true); rafId = requestAnimationFrame(loop);
  }
  function pause() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; setBtn(false); setStatus(); }
  function resetHist() { bins = []; for (var i = 0; i < NB; i++) bins.push(0); nEv = 0; carry = 0; seed = (Date.now() ^ (Math.random() * 4294967296)) >>> 0; }
  function resetBall() { bx = by = vx = vy = 0; }
  function reset() { pause(); resetBall(); az = 0; resetHist(); setStatus(); draw(); }
  function destroy() { pause(); window.removeEventListener('resize', onResize); if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  function setMode(m) {
    mode = m;
    var a = document.getElementById('mode-pot'), b = document.getElementById('mode-hist');
    if (a) a.setAttribute('aria-pressed', String(m === 'pot')); if (b) b.setAttribute('aria-pressed', String(m === 'hist'));
    var pc = document.getElementById('pot-controls'), hc = document.getElementById('hist-controls');
    if (pc) pc.style.display = m === 'pot' ? 'contents' : 'none'; if (hc) hc.style.display = m === 'hist' ? 'contents' : 'none';
    setStatus(); draw();
  }

  function onResize() {
    if (!mountEl || !canvas) return;
    var dpr = window.devicePixelRatio || 1;
    W = Math.round(mountEl.getBoundingClientRect().width) || 680;
    H = W < 560 ? 520 : 460;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }

  function init() {
    mountEl = document.getElementById('sim-mount'); if (!mountEl) return;
    setup(); resetHist();
    canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Either the Higgs potential with a rolling ball and the Higgs couplings to fermions, or a diphoton mass histogram filling up event by event');
    canvas.style.display = 'block'; mountEl.appendChild(canvas); ctx = canvas.getContext('2d');
    var sl = document.getElementById('mu2-slider'), sv = document.getElementById('mu2-val');
    if (sl) sl.addEventListener('input', function () {
      m2 = parseFloat(sl.value); var t = (m2 >= 0 ? '+' : '') + m2.toFixed(2);
      if (sv) sv.textContent = t; sl.setAttribute('aria-valuetext', t + (m2 < 0 ? ', broken symmetry' : ', symmetric'));
      setStatus(); draw();
    });
    var top = document.getElementById('ball-top');
    if (top) top.addEventListener('click', function () { resetBall(); setStatus(); draw(); });
    var rs = document.getElementById('rate-slider'), rv = document.getElementById('rate-val');
    if (rs) rs.addEventListener('input', function () { rate = parseFloat(rs.value); if (rv) rv.textContent = rate + ' /s'; rs.setAttribute('aria-valuetext', rate + ' events per second'); });
    var bg = document.getElementById('bg-only');
    if (bg) bg.addEventListener('click', function () { bgOnly = !bgOnly; bg.setAttribute('aria-pressed', String(bgOnly)); resetHist(); setStatus(); draw(); });
    var a = document.getElementById('mode-pot'), b = document.getElementById('mode-hist');
    if (a) a.addEventListener('click', function () { setMode('pot'); });
    if (b) b.addEventListener('click', function () { setMode('hist'); });
    window.addEventListener('resize', onResize); onResize(); setMode('pot');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
