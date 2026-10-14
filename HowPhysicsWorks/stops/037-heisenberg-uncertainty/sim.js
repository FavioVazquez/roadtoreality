/* ============================================================
   sim.js — Stop 037: Heisenberg's Uncertainty Principle
   Free electron wave packet (1D, non-relativistic).
   Momentum amplitude φ(k) is set analytically at t = 0 and is constant
   for a free particle; ψ(x,t) = Σ φ(k) exp(i k x − i ħk²t/2m) Δk is summed
   directly. σx(t) and σk are computed numerically from the grids, and
   σx·σp is shown in units of ħ/2 (Kennard's bound: ≥ 1).
   Single-slit tab: 50 keV electrons, landing points drawn from the
   far-field pattern sinc²(π a y / λD), D = 1 m (illustrative geometry);
   first minima at ±λD/a, transverse momentum spread Δp_y ≈ h/a.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var HBAR_OVER_M = 1.054571817e-34 / 9.1093837015e-31 * 1e18 / 1e15;  /* nm²/fs, CODATA 2018 */
  var K0 = 3;                 /* carrier wavenumber, 1/nm */
  var XMIN = -8, XMAX = 16, NX = 320, NK = 256;
  var T_WRAP = 12;            /* fs; the run restarts after this */
  var PLAY_RATE = 1.5;        /* simulated fs per real second */

  var sigma0 = 0.5, shape = 'gauss', tFs = 0;
  var mode = 'packet', slitNm = 100, SNB = 80, S_WIN = 300, S_MAX = 4000, S_RATE = 120;
  var LAM_M = 1239.84198 / Math.sqrt(50000 * 50000 + 2 * 50000 * 510998.95) * 1e-9, H_PL = 6.62607015e-34;
  var sHits = [], sBins = new Array(SNB).fill(0), sAcc = 0;
  var ks = new Float64Array(NK), phR = new Float64Array(NK), phI = new Float64Array(NK), dk = 0;
  var psR = new Float64Array(NX), psI = new Float64Array(NX), xs = new Float64Array(NX);
  var sigK = 0, kMean = 0, sigX = 0, xMean = 0, trace = [];
  for (var i = 0; i < NX; i++) xs[i] = XMIN + (i + 0.5) / NX * (XMAX - XMIN);

  var COL = { era: 'oklch(0.68 0.20 310)', re: 'oklch(0.72 0.14 200)', p: 'oklch(0.80 0.14 60)', text: 'rgba(255,255,255,0.88)', muted: 'rgba(255,255,255,0.55)', faint: 'rgba(255,255,255,0.15)', bound: 'rgba(255,255,255,0.6)' };

  function sepHalf() { return 2.5 * sigma0; }

  function buildMomentum() {
    var sk = 1 / (2 * sigma0), span = 7 * sk;
    dk = 2 * span / NK;
    var a = sepHalf(), s0 = 0, s1 = 0, s2 = 0;
    for (var j = 0; j < NK; j++) {
      var k = K0 - span + (j + 0.5) * dk, q = k - K0;
      var g = Math.exp(-q * q * sigma0 * sigma0);
      var amp = shape === 'gauss' ? g : 2 * Math.cos(q * a) * g;
      ks[j] = k; phR[j] = amp; phI[j] = 0;
      var w = amp * amp; s0 += w; s1 += w * k; s2 += w * k * k;
    }
    kMean = s1 / s0; sigK = Math.sqrt(Math.max(0, s2 / s0 - kMean * kMean));
  }

  function evolve() {
    var a = 0.5 * HBAR_OVER_M * tFs, s0 = 0, s1 = 0, s2 = 0;
    for (var i = 0; i < NX; i++) {
      var x = xs[i], re = 0, im = 0;
      for (var j = 0; j < NK; j++) {
        var k = ks[j], ph = k * x - a * k * k, c = Math.cos(ph), s = Math.sin(ph);
        re += phR[j] * c; im += phR[j] * s;
      }
      psR[i] = re; psI[i] = im;
      var d = re * re + im * im; s0 += d; s1 += d * x; s2 += d * x * x;
    }
    xMean = s1 / s0; sigX = Math.sqrt(Math.max(0, s2 / s0 - xMean * xMean));
    var nrm = Math.sqrt(s0 * (XMAX - XMIN) / NX);
    for (i = 0; i < NX; i++) { psR[i] /= nrm; psI[i] /= nrm; }
  }

  function product() { return 2 * sigX * sigK; }   /* σx σp / (ħ/2) */

  function txt(s, x, y, col, size, align) {
    ctx.fillStyle = col || COL.text; ctx.font = (size || 12) + 'px "DM Sans", sans-serif';
    ctx.textAlign = align || 'left'; ctx.fillText(s, x, y);
  }
  function bracket(xa, xb, y, col, label) {
    ctx.strokeStyle = col; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xa, y - 4); ctx.lineTo(xa, y + 4); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.moveTo(xb, y - 4); ctx.lineTo(xb, y + 4); ctx.stroke();
    txt(label, (xa + xb) / 2, y - 7, col, 11, 'center');
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (mode === 'slit') { drawSlit(); return; }
    var narrow = W < 560, x0 = 16, x1 = W - 16, bw = x1 - x0;
    var pTop = 40, pH = narrow ? 150 : 150, kTop = pTop + pH + 50, kH = narrow ? 110 : 100;
    var gTop = kTop + kH + 50, gH = H - gTop - 18;

    txt('t = ' + tFs.toFixed(2) + ' fs · free electron', x0, 20, COL.text, 13);
    /* position panel */
    var base = pTop + pH, peak = 0;
    for (var i = 0; i < NX; i++) peak = Math.max(peak, psR[i] * psR[i] + psI[i] * psI[i]);
    var ref = 1 / (Math.sqrt(2 * Math.PI) * Math.min(sigma0, 0.5)), sc = (pH - 20) / Math.max(ref, peak);
    function X(x) { return x0 + (x - XMIN) / (XMAX - XMIN) * bw; }
    ctx.fillStyle = 'oklch(0.68 0.20 310 / 0.5)';
    ctx.beginPath(); ctx.moveTo(X(xs[0]), base);
    for (i = 0; i < NX; i++) ctx.lineTo(X(xs[i]), base - (psR[i] * psR[i] + psI[i] * psI[i]) * sc);
    ctx.lineTo(X(xs[NX - 1]), base); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = COL.re; ctx.lineWidth = 1.2; ctx.beginPath();
    var rs = Math.sqrt(sc * (pH - 20)) * 0.5;
    for (i = 0; i < NX; i++) { var y = base - (pH - 20) / 2 - psR[i] * rs; if (i) ctx.lineTo(X(xs[i]), y); else ctx.moveTo(X(xs[i]), y); }
    ctx.globalAlpha = 0.6; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.strokeStyle = COL.faint; ctx.beginPath(); ctx.moveTo(x0, base + 0.5); ctx.lineTo(x1, base + 0.5); ctx.stroke();
    bracket(X(xMean - sigX), X(xMean + sigX), base + 16, COL.text, '2σx = ' + (2 * sigX).toFixed(2) + ' nm');
    txt('Position: |ψ(x)|² (fill), Re ψ (line)', x0, pTop - 4, COL.muted, 11);
    txt((XMAX - XMIN) + ' nm shown', x1, pTop - 4, COL.muted, 11, 'right');

    /* momentum panel */
    var kb = kTop + kH, kspan = 7 / (2 * Math.min(sigma0, 2)), kLo = K0 - Math.max(kspan, 3), kHi = K0 + Math.max(kspan, 3);
    kLo = Math.min(kLo, K0 - 7 / (2 * 0.2)); kHi = Math.max(kHi, K0 + 7 / (2 * 0.2));
    function KX(k) { return x0 + (k - kLo) / (kHi - kLo) * bw; }
    var mk = 0;
    for (var j = 0; j < NK; j++) mk = Math.max(mk, phR[j] * phR[j]);
    ctx.fillStyle = 'oklch(0.80 0.14 60 / 0.5)';
    ctx.beginPath(); ctx.moveTo(KX(ks[0]), kb);
    for (j = 0; j < NK; j++) ctx.lineTo(KX(ks[j]), kb - phR[j] * phR[j] / mk * (kH - 14));
    ctx.lineTo(KX(ks[NK - 1]), kb); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = COL.faint; ctx.beginPath(); ctx.moveTo(x0, kb + 0.5); ctx.lineTo(x1, kb + 0.5); ctx.stroke();
    bracket(KX(kMean - sigK), KX(kMean + sigK), kb + 16, COL.p, '2σp = ' + (2 * sigK).toFixed(2) + ' ħ/nm');
    txt('Momentum: |φ(p)|², p = ħk (does not change for a free particle)', x0, kTop - 4, COL.muted, 11);

    /* product trace */
    var pr = product(), pmax = Math.max(4, pr * 1.2);
    ctx.strokeStyle = COL.faint; ctx.strokeRect(x0 + 0.5, gTop + 0.5, bw - 1, gH - 1);
    var yb = gTop + gH - 1 / pmax * gH;
    ctx.strokeStyle = COL.bound; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke(); ctx.setLineDash([]);
    txt('limit ħ/2', x1 - 6, yb - 5, COL.bound, 11, 'right');
    if (trace.length > 1) {
      ctx.strokeStyle = COL.era; ctx.lineWidth = 2; ctx.beginPath();
      for (var m = 0; m < trace.length; m++) {
        var tx = x0 + trace[m][0] / T_WRAP * bw, ty = gTop + gH - Math.min(trace[m][1], pmax) / pmax * gH;
        if (m) ctx.lineTo(tx, ty); else ctx.moveTo(tx, ty);
      }
      ctx.stroke();
    }
    txt('σx·σp = ' + pr.toFixed(2) + ' × ħ/2 (calculated)', x0 + 6, gTop + 15, COL.text, 12);
    txt('0 – ' + T_WRAP + ' fs', x1 - 6, gTop + gH - 6, COL.muted, 11, 'right');
  }

  function sinc2(u) { if (Math.abs(u) < 1e-9) return 1; var q = Math.sin(u) / u; return q * q; }
  function sProb(yUm) { return sinc2(Math.PI * slitNm * 1e-9 * yUm * 1e-6 / LAM_M); }
  function firstMinUm() { return LAM_M / (slitNm * 1e-9) * 1e6; }
  function sci(x) {
    var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e), sup = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return m.toFixed(1) + '×10' + String(e).split('').map(function (ch) { return sup[ch]; }).join('');
  }
  function sAdd() {
    if (sHits.length >= S_MAX) return;
    for (var k = 0; k < 4000; k++) {
      var y = (Math.random() * 2 - 1) * S_WIN;
      if (Math.random() < sProb(y)) {
        sHits.push([y, Math.random()]);
        var b = Math.floor((y + S_WIN) / (2 * S_WIN) * SNB); if (b >= 0 && b < SNB) sBins[b]++;
        return;
      }
    }
  }
  function sClear() { sHits = []; sBins = new Array(SNB).fill(0); sAcc = 0; }
  function sStep(dt) { sAcc += S_RATE * dt; while (sAcc >= 1) { sAcc -= 1; sAdd(); } }
  function drawSlit() {
    var x0 = 16, x1 = W - 16, bw = x1 - x0, cx = W / 2;
    function YX(y) { return x0 + (y / S_WIN + 1) / 2 * bw; }
    txt('Electrons (50 keV, λ = ' + (LAM_M * 1e12).toFixed(2) + ' pm) through one slit, a = ' + slitNm + ' nm', x0, 20, COL.text, W < 560 ? 11 : 13);
    var wy = 66, gap = 6 + slitNm / 500 * 60;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x0, wy, cx - gap / 2 - x0, 5); ctx.fillRect(cx + gap / 2, wy, x1 - cx - gap / 2, 5);
    ctx.strokeStyle = 'oklch(0.68 0.20 310 / 0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, 32); ctx.lineTo(cx, wy); ctx.stroke();
    var fm = firstMinUm(), spread = Math.min(S_WIN, fm);
    ctx.fillStyle = 'oklch(0.68 0.20 310 / 0.18)';
    ctx.beginPath(); ctx.moveTo(cx - gap / 2, wy + 5); ctx.lineTo(cx + gap / 2, wy + 5); ctx.lineTo(YX(spread), 112); ctx.lineTo(YX(-spread), 112); ctx.closePath(); ctx.fill();
    var sy = 112, sh = W < 560 ? 150 : 130;
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(x0, sy, bw, sh);
    ctx.strokeStyle = COL.faint; ctx.strokeRect(x0 + 0.5, sy + 0.5, bw - 1, sh - 1);
    ctx.fillStyle = 'oklch(0.85 0.14 310)';
    for (var i = 0; i < sHits.length; i++) ctx.fillRect(YX(sHits[i][0]) - 0.8, sy + 3 + sHits[i][1] * (sh - 6), 1.6, 1.6);
    txt('Screen 1 m away: ' + sHits.length + ' electrons · ±' + S_WIN + ' µm shown', x0, sy + sh + 16, COL.muted, 11);
    var hy = sy + sh + 44, hh = H - hy - 44, base = hy + hh, mb = 1, sum = 0, pv = [];
    for (i = 0; i < SNB; i++) { if (sBins[i] > mb) mb = sBins[i]; var yc = -S_WIN + (i + 0.5) / SNB * 2 * S_WIN; pv.push(sProb(yc)); sum += pv[i]; }
    var n = sHits.length, top = Math.max(mb, n * Math.max.apply(null, pv) / sum, 1), cw = bw / SNB;
    ctx.fillStyle = 'oklch(0.68 0.20 310 / 0.55)';
    for (i = 0; i < SNB; i++) { var hgt = sBins[i] / top * (hh - 6); ctx.fillRect(x0 + i * cw + 0.5, base - hgt, cw - 1, hgt); }
    ctx.strokeStyle = 'oklch(0.85 0.15 95)'; ctx.lineWidth = 2; ctx.beginPath();
    for (var j = 0; j <= 300; j++) { var yy = -S_WIN + j / 300 * 2 * S_WIN, v = n > 0 ? n * sProb(yy) / sum / top : sProb(yy), X = YX(yy), Y = base - v * (hh - 6); if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
    ctx.stroke();
    ctx.strokeStyle = COL.faint; ctx.beginPath(); ctx.moveTo(x0, base + 0.5); ctx.lineTo(x1, base + 0.5); ctx.stroke();
    if (fm < S_WIN) bracket(YX(-fm), YX(fm), base + 14, COL.text, '±λD/a = ±' + fm.toFixed(1) + ' µm');
    else txt('first minima ±' + fm.toFixed(0) + ' µm, outside the view', x0, base + 18, COL.text, 11);
    txt('Counts · curve: single-slit pattern (formula)', x0, hy - 6, COL.muted, 11);
    txt('Δp_y ≈ h/a = ' + sci(H_PL / (slitNm * 1e-9)) + ' kg·m/s (calculated)', x0, H - 8, COL.text, 12);
  }

  function recompute() { evolve(); trace.push([tFs, product()]); }
  function rebuild() { tFs = 0; trace = []; buildMomentum(); recompute(); setStatus(); draw(); }

  function setStatus() {
    var el = document.getElementById('sim-status'); if (!el) return;
    if (mode === 'slit') { el.textContent = 'Slit a = ' + slitNm + ' nm: first minima at ±' + firstMinUm().toFixed(1) + ' µm on the screen; Δp_y ≈ h/a = ' + sci(H_PL / (slitNm * 1e-9)) + ' kg·m/s. Narrow the slit and the pattern widens.'; return; }
    el.textContent = (shape === 'gauss' ? 'Gaussian' : 'Two-peak') + ' packet, σx = ' + sigX.toFixed(2) + ' nm at t = ' + tFs.toFixed(1) + ' fs: σx·σp = ' + product().toFixed(2) + ' × ħ/2' + (shape === 'gauss' && tFs === 0 ? ', exactly the minimum.' : ', above the minimum.');
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05); lastTs = ts;
    if (mode === 'slit') { sStep(dt); draw(); rafId = requestAnimationFrame(loop); return; }
    tFs += dt * PLAY_RATE;
    if (tFs > T_WRAP) { tFs = 0; trace = []; }
    recompute(); draw();
    if (Math.floor(tFs * 2) !== Math.floor((tFs - dt * PLAY_RATE) * 2)) setStatus();
    rafId = requestAnimationFrame(loop);
  }
  function setBtn(p) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = p ? '⏸ Pause' : '▶ Play'; btn.dataset.state = p ? 'playing' : 'paused'; }
    var dot = document.querySelector('.sim-caption__dot'); if (dot) dot.classList.toggle('is-running', p);
  }
  function start() {
    if (running) return;
    if (reducedMotion && mode === 'slit') { for (var q = 0; q < 1500; q++) sAdd(); draw(); return; }
    if (reducedMotion) { tFs = Math.min(T_WRAP, tFs + 3); recompute(); setStatus(); draw(); return; }
    running = true; lastTs = null; setBtn(true); rafId = requestAnimationFrame(loop);
  }
  function pause() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; setBtn(false); setStatus(); }
  function reset() { pause(); if (mode === 'slit') { sClear(); setStatus(); draw(); } else rebuild(); }
  function destroy() { pause(); window.removeEventListener('resize', onResize); if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  function onResize() {
    if (!mountEl || !canvas) return;
    var dpr = window.devicePixelRatio || 1;
    W = Math.round(mountEl.getBoundingClientRect().width) || 680;
    H = W < 560 ? 520 : 480;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }

  function init() {
    mountEl = document.getElementById('sim-mount'); if (!mountEl) return;
    canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'A free electron wave packet in position and in momentum, with the product of their spreads plotted against time and the limit h-bar over two');
    canvas.style.display = 'block'; mountEl.appendChild(canvas); ctx = canvas.getContext('2d');
    var sl = document.getElementById('width-slider');
    if (sl) sl.addEventListener('input', function () {
      sigma0 = parseFloat(sl.value);
      document.getElementById('width-val').textContent = sigma0.toFixed(2) + ' nm';
      sl.setAttribute('aria-valuetext', sigma0.toFixed(2) + ' nanometres');
      rebuild();
    });
    ['gauss', 'double'].forEach(function (k) {
      var b = document.getElementById('shape-' + k);
      if (b) b.addEventListener('click', function () {
        shape = k;
        ['gauss', 'double'].forEach(function (q) { var e = document.getElementById('shape-' + q); if (e) e.setAttribute('aria-pressed', String(q === k)); });
        rebuild();
      });
    });
    var ss = document.getElementById('slit-slider');
    if (ss) ss.addEventListener('input', function () {
      slitNm = parseFloat(ss.value); document.getElementById('slit-val').textContent = slitNm + ' nm';
      ss.setAttribute('aria-valuetext', slitNm + ' nanometres'); sClear(); setStatus(); draw();
    });
    ['packet', 'slit'].forEach(function (k) {
      var b = document.getElementById('mode-' + k);
      if (b) b.addEventListener('click', function () {
        mode = k;
        ['packet', 'slit'].forEach(function (q) { var e = document.getElementById('mode-' + q); if (e) e.setAttribute('aria-pressed', String(q === k)); });
        var pc = document.getElementById('packet-controls'), sc = document.getElementById('slit-controls');
        if (pc) pc.style.display = k === 'packet' ? 'contents' : 'none';
        if (sc) sc.style.display = k === 'slit' ? 'contents' : 'none';
        if (k === 'slit') { sClear(); setStatus(); draw(); } else rebuild();
      });
    });
    window.addEventListener('resize', onResize); onResize(); rebuild();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
