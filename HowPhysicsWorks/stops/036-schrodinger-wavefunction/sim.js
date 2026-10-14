/* ============================================================
   sim.js — Stop 036: Schrödinger's Wave Equation
   Electron in a 1 nm infinite square well (1D, non-relativistic).
   Eigenstates ψn = √(2/L) sin(nπx/L), En = n² h²/(8 m L²).
   ψ(x,t) = Σ cn ψn(x) exp(−i En t/ħ): each mode evolves exactly,
   so there is no time-stepping error; the only approximation is
   keeping NMODES modes (the captured fraction Σ|cn|² is shown).
   Hydrogen tab: exact non-relativistic 1s, 2s, 2p₀ states (a₀ units),
   E_n = −Ry/n²; image brightness ∝ √density (display choice).
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var H_PLANCK = 6.62607015e-34, M_E = 9.1093837015e-31, EV = 1.602176634e-19;  /* CODATA 2018 */
  var BOX = 1e-9;
  var E1_J = H_PLANCK * H_PLANCK / (8 * M_E * BOX * BOX);
  var E1_EV = E1_J / EV;
  var T1_FS = H_PLANCK / E1_J * 1e15;          /* revival time h/E1, fs */
  var NX = 300, NMODES = 80;

  var S = [];                                   /* S[n-1][i] = ψn(x_i) in units of 1/√L */
  for (var n = 1; n <= NMODES; n++) {
    var row = new Float64Array(NX + 1);
    for (var i = 0; i <= NX; i++) row[i] = Math.SQRT2 * Math.sin(n * Math.PI * i / NX);
    S.push(row);
  }

  var cRe = new Float64Array(NMODES), cIm = new Float64Array(NMODES);
  var psiRe = new Float64Array(NX + 1), psiIm = new Float64Array(NX + 1);
  var preset = 'packet', tFs = 0, speed = 0.1, showParts = true;
  var captured = 1, densMax = 1, trace = [];

  var PRESET_SPEED = { one: 1.0, two: 1.0, packet: 0.1 };
  var mode = 'box', nState = 1, hState = '1s';
  var RY_EV = 13.605693, HBAR_EVFS = 0.6582119569, A0_NM = 0.0529177, H_EXT = 12, HG = 150;
  var hPsi = null, hMax = 1, hOff = null, hOffCtx = null;
  var COL = { era: 'oklch(0.68 0.20 310)', re: 'oklch(0.72 0.14 200)', im: 'oklch(0.80 0.14 60)', text: 'rgba(255,255,255,0.88)', muted: 'rgba(255,255,255,0.55)', faint: 'rgba(255,255,255,0.15)' };

  function setCoeffs(p) {
    cRe.fill(0); cIm.fill(0);
    if (p === 'one') cRe[nState - 1] = 1;
    else if (p === 'two') { cRe[0] = Math.SQRT1_2; cRe[1] = Math.SQRT1_2; }
    else {
      var x0 = 0.3, sig = 0.07, k0 = 20, gr = [], gi = [], norm = 0;
      for (var i = 0; i <= NX; i++) {
        var x = i / NX, g = Math.exp(-(x - x0) * (x - x0) / (4 * sig * sig));
        gr.push(g * Math.cos(k0 * x)); gi.push(g * Math.sin(k0 * x)); norm += g * g / NX;
      }
      norm = Math.sqrt(norm);
      for (var m = 0; m < NMODES; m++) {
        var sr = 0, si = 0;
        for (i = 0; i <= NX; i++) { sr += S[m][i] * gr[i]; si += S[m][i] * gi[i]; }
        cRe[m] = sr / NX / norm; cIm[m] = si / NX / norm;
      }
    }
    captured = 0;
    for (var k = 0; k < NMODES; k++) captured += cRe[k] * cRe[k] + cIm[k] * cIm[k];
  }

  function evolve() {
    psiRe.fill(0); psiIm.fill(0);
    var w = 2 * Math.PI * tFs / T1_FS;           /* E1 t / ħ */
    for (var m = 0; m < NMODES; m++) {
      var a = cRe[m], b = cIm[m];
      if (a === 0 && b === 0) continue;
      var ph = -(m + 1) * (m + 1) * w, c = Math.cos(ph), s = Math.sin(ph);
      var re = a * c - b * s, im = a * s + b * c, row = S[m];
      for (var i = 0; i <= NX; i++) { psiRe[i] += re * row[i]; psiIm[i] += im * row[i]; }
    }
  }
  function expX() {
    var num = 0, den = 0;
    for (var i = 0; i <= NX; i++) { var d = psiRe[i] * psiRe[i] + psiIm[i] * psiIm[i]; num += d * i / NX; den += d; }
    return den ? num / den : 0.5;
  }
  function expE() {
    var e = 0;
    for (var m = 0; m < NMODES; m++) e += (cRe[m] * cRe[m] + cIm[m] * cIm[m]) * (m + 1) * (m + 1);
    return e / captured * E1_EV;
  }

  function txt(s, x, y, col, size, align) {
    ctx.fillStyle = col || COL.text; ctx.font = (size || 12) + 'px "DM Sans", sans-serif';
    ctx.textAlign = align || 'left'; ctx.fillText(s, x, y);
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (mode === 'hyd') { drawHydrogen(); return; }
    var narrow = W < 560, x0 = 22, x1 = W - 22, bw = x1 - x0;
    var partsTop = 44, partsH = narrow ? 120 : 110;
    var densTop = partsTop + partsH + 22, densH = narrow ? 170 : 160;
    var trTop = densTop + densH + (narrow ? 56 : 44), trH = H - trTop - 26;
    function X(i) { return x0 + i / NX * bw; }

    txt('t = ' + tFs.toFixed(2) + ' fs   (revival time h/E₁ = ' + T1_FS.toFixed(1) + ' fs)', x0, 22, COL.text, 13);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x0 - 4, partsTop - 6, 3, densTop + densH - partsTop + 6);
    ctx.fillRect(x1 + 1, partsTop - 6, 3, densTop + densH - partsTop + 6);

    if (showParts) {
      var mid = partsTop + partsH / 2, sc = (partsH / 2 - 4) / Math.sqrt(densMax);
      ctx.strokeStyle = COL.faint; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, mid); ctx.lineTo(x1, mid); ctx.stroke();
      [[psiRe, COL.re], [psiIm, COL.im]].forEach(function (p) {
        ctx.strokeStyle = p[1]; ctx.lineWidth = 1.6; ctx.beginPath();
        for (var i = 0; i <= NX; i++) { var y = mid - p[0][i] * sc; if (i) ctx.lineTo(X(i), y); else ctx.moveTo(X(i), y); }
        ctx.stroke();
      });
      txt('Re ψ', x0 + 4, partsTop + 6, COL.re, 11);
      txt('Im ψ', x0 + 44, partsTop + 6, COL.im, 11);
    } else {
      txt('Re ψ and Im ψ hidden', x0 + 4, partsTop + 6, COL.muted, 11);
    }

    var base = densTop + densH, dsc = (densH - 8) / densMax, step = bw / NX;
    for (var i = 0; i < NX; i++) {
      var d = psiRe[i] * psiRe[i] + psiIm[i] * psiIm[i];
      var hue = (Math.atan2(psiIm[i], psiRe[i]) * 180 / Math.PI + 360) % 360;
      ctx.fillStyle = 'hsla(' + hue.toFixed(0) + ',70%,62%,0.85)';
      ctx.fillRect(X(i), base - d * dsc, step + 0.6, d * dsc);
    }
    ctx.strokeStyle = COL.faint; ctx.beginPath(); ctx.moveTo(x0, base + 0.5); ctx.lineTo(x1, base + 0.5); ctx.stroke();
    txt('|ψ|²: probability density (colour = phase of ψ)', x0 + 4, densTop + 2, COL.muted, 11);
    txt('0', x0, base + 14, COL.muted, 10, 'center');
    txt('1 nm', x1, base + 14, COL.muted, 10, 'center');

    var ex = expX();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x0 + ex * bw, densTop + 10); ctx.lineTo(x0 + ex * bw, base); ctx.stroke(); ctx.setLineDash([]);

    var rd = '⟨x⟩ = ' + ex.toFixed(2) + ' nm · ⟨E⟩ = ' + expE().toFixed(2) + ' eV', md = 'modes kept: ' + NMODES + ' (' + (captured * 100).toFixed(2) + '% of the state)';
    if (narrow) { txt(rd, x0, trTop - 26, COL.text, 11); txt(md, x0, trTop - 10, COL.muted, 11); }
    else txt(rd + ' · ' + md, x0, trTop - 14, COL.text, 12);
    ctx.strokeStyle = COL.faint; ctx.strokeRect(x0 + 0.5, trTop + 0.5, bw - 1, trH - 1);
    if (trace.length > 1) {
      ctx.strokeStyle = COL.era; ctx.lineWidth = 1.5; ctx.beginPath();
      var tEnd = trace[trace.length - 1][0], span = Math.max(T1_FS / 2, 1);
      for (var k = 0; k < trace.length; k++) {
        var tx = x1 - (tEnd - trace[k][0]) / span * bw, ty = trTop + trH - trace[k][1] * trH;
        if (tx < x0) continue;
        if (k && tx >= x0) ctx.lineTo(tx, ty); else ctx.moveTo(tx, ty);
      }
      ctx.stroke();
    }
    txt('⟨x⟩ over the last ' + (T1_FS / 2).toFixed(1) + ' fs', x0 + 6, trTop + 14, COL.muted, 11);
  }

  function setMode(k) {
    mode = k; tFs = 0;
    ['box', 'hyd'].forEach(function (q) { var e = document.getElementById('mode-' + q); if (e) e.setAttribute('aria-pressed', String(q === k)); });
    var bc = document.getElementById('box-controls'), hc = document.getElementById('hyd-controls'), pt = document.getElementById('parts-toggle');
    if (bc) bc.style.display = k === 'box' ? 'contents' : 'none';
    if (hc) hc.style.display = k === 'hyd' ? 'flex' : 'none';
    if (pt) pt.style.display = k === 'box' ? '' : 'none';
    if (k === 'hyd') { if (!hPsi) buildHydrogen(); setSpeed(0.1); setStatus(); draw(); }
    else applyPreset(preset);
  }

  function hydPsi(x, z) {
    var r = Math.sqrt(x * x + z * z);
    if (hState === '1s') return Math.exp(-r);
    if (hState === '2s') return (2 - r) * Math.exp(-r / 2) / (4 * Math.SQRT2);
    return z * Math.exp(-r / 2) / (4 * Math.SQRT2);
  }
  function hydRadial(r) {
    if (hState === '1s') return 4 * r * r * Math.exp(-2 * r);
    if (hState === '2s') { var a = (1 - r / 2); return r * r * a * a * Math.exp(-r) / 2; }
    return r * r * r * r * Math.exp(-r) / 24;
  }
  function buildHydrogen() {
    hPsi = new Float32Array(HG * HG); hMax = 0;
    for (var j = 0; j < HG; j++) for (var i = 0; i < HG; i++) {
      var x = (i + 0.5) / HG * 2 * H_EXT - H_EXT, z = H_EXT - (j + 0.5) / HG * 2 * H_EXT, p = hydPsi(x, z);
      hPsi[j * HG + i] = p; if (p * p > hMax) hMax = p * p;
    }
    if (!hOff) { hOff = document.createElement('canvas'); hOff.width = HG; hOff.height = HG; hOffCtx = hOff.getContext('2d'); }
  }
  function hsl2rgb(h, s, l) {
    var a = s * Math.min(l, 1 - l);
    function f(n) { var k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  }
  function drawHydrogen() {
    var narrow = W < 560, n = hState === '1s' ? 1 : 2, E = -RY_EV / (n * n);
    var phase = -E * tFs / HBAR_EVFS, hue = ((phase * 180 / Math.PI) % 360 + 360) % 360;
    var cp = hsl2rgb(hue, 0.7, 0.62), cn = hsl2rgb((hue + 180) % 360, 0.7, 0.62);
    var img = hOffCtx.createImageData(HG, HG), d = img.data;
    for (var k = 0; k < HG * HG; k++) {
      var p = hPsi[k], b = Math.sqrt(p * p / hMax), c = p >= 0 ? cp : cn;
      d[4 * k] = c[0] * b; d[4 * k + 1] = c[1] * b; d[4 * k + 2] = c[2] * b; d[4 * k + 3] = 255;
    }
    hOffCtx.putImageData(img, 0, 0);
    var size = narrow ? Math.min(W - 28, 260) : Math.min(W * 0.48, H - 70), ix = narrow ? (W - size) / 2 : 16, iy = 34;
    ctx.imageSmoothingEnabled = true; ctx.drawImage(hOff, ix, iy, size, size);
    ctx.strokeStyle = COL.faint; ctx.strokeRect(ix + 0.5, iy + 0.5, size - 1, size - 1);
    txt('Hydrogen ' + hState + (hState === '2p' ? ' (m = 0)' : '') + ': E = −' + (-E).toFixed(2) + ' eV', 16, 20, COL.text, 13);
    txt('slice through the nucleus, ' + (2 * H_EXT) + ' a₀ ≈ ' + (2 * H_EXT * A0_NM).toFixed(2) + ' nm across', ix, iy + size + 16, COL.muted, 11);
    var bohr = n * n, bx = ix + size / 2, by = iy + size / 2, rpx = bohr / H_EXT * size / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(bx, by, rpx, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
    var gx = narrow ? 16 : ix + size + 30, gy = narrow ? iy + size + 44 : iy + 20, gw = narrow ? W - 32 : W - gx - 16, gh = narrow ? H - gy - 30 : size - 60;
    var rmax = H_EXT, pmax = 0, j;
    for (j = 0; j <= 200; j++) pmax = Math.max(pmax, hydRadial(j / 200 * rmax));
    ctx.strokeStyle = COL.faint; ctx.beginPath(); ctx.moveTo(gx, gy + gh + 0.5); ctx.lineTo(gx + gw, gy + gh + 0.5); ctx.stroke();
    ctx.strokeStyle = COL.era; ctx.lineWidth = 2; ctx.beginPath();
    for (j = 0; j <= 200; j++) { var rr = j / 200 * rmax, X = gx + rr / rmax * gw, Y = gy + gh - hydRadial(rr) / pmax * (gh - 6); if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
    ctx.stroke();
    var bxp = gx + bohr / rmax * gw;
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(bxp, gy); ctx.lineTo(bxp, gy + gh); ctx.stroke(); ctx.setLineDash([]);
    txt('Bohr orbit, ' + bohr + ' a₀', bxp + 4, gy + 12, COL.muted, 11);
    txt('Radial probability r²|R(r)|² (formula)', gx, gy - 6, COL.muted, 11);
    txt('0', gx, gy + gh + 14, COL.muted, 10, 'center'); txt(rmax + ' a₀', gx + gw, gy + gh + 14, COL.muted, 10, 'right');
  }

  function pushTrace() {
    trace.push([tFs, expX()]);
    var cutoff = tFs - T1_FS / 2;
    while (trace.length && trace[0][0] < cutoff) trace.shift();
  }

  function recompute() { evolve(); pushTrace(); }

  function applyPreset(p) {
    preset = p; tFs = 0; trace = [];
    setCoeffs(p); evolve();
    densMax = 0;
    for (var i = 0; i <= NX; i++) densMax = Math.max(densMax, psiRe[i] * psiRe[i] + psiIm[i] * psiIm[i]);
    densMax = Math.max(densMax * 1.15, 2.2);
    pushTrace();
    ['one', 'two', 'packet'].forEach(function (k) {
      var b = document.getElementById('preset-' + k);
      if (b) { b.setAttribute('aria-pressed', String(k === p)); b.classList.toggle('is-active', k === p); }
    });
    setSpeed(PRESET_SPEED[p]);
    setStatus(); draw();
  }

  function setSpeed(v) {
    speed = v;
    var sl = document.getElementById('speed-slider'), out = document.getElementById('speed-val');
    if (sl) { sl.value = String(v); sl.setAttribute('aria-valuetext', v.toFixed(2) + ' femtoseconds per second'); }
    if (out) out.textContent = v.toFixed(2) + ' fs/s';
  }

  function setStatus() {
    var el = document.getElementById('sim-status'); if (!el) return;
    var msg = {
      one: 'State n = ' + nState + ': ' + (nState - 1) + ' node' + (nState === 2 ? '' : 's') + ', E = ' + (nState * nState * E1_EV).toFixed(3) + ' eV. |ψ|² never changes; only the phase (colour) turns.',
      two: 'Equal mix of n = 1 and n = 2: |ψ|² sloshes with period h/(E₂ − E₁) = ' + (T1_FS / 3).toFixed(2) + ' fs.',
      packet: 'Wave packet: it bounces, spreads, and comes back to its starting shape at t = h/E₁ = ' + T1_FS.toFixed(1) + ' fs.'
    };
    if (mode === 'hyd') { var nn = hState === '1s' ? 1 : 2; el.textContent = 'Hydrogen ' + hState + ': E = −' + (RY_EV / (nn * nn)).toFixed(2) + ' eV. A stationary state: the cloud never changes; only its phase (colour) turns.'; return; }
    el.textContent = msg[preset];
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05); lastTs = ts;
    tFs += dt * speed; if (mode === 'box') recompute(); draw();
    rafId = requestAnimationFrame(loop);
  }
  function setBtn(p) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = p ? '⏸ Pause' : '▶ Play'; btn.dataset.state = p ? 'playing' : 'paused'; }
    var dot = document.querySelector('.sim-caption__dot'); if (dot) dot.classList.toggle('is-running', p);
  }
  function start() {
    if (running) return;
    if (reducedMotion) { tFs += T1_FS / 8; recompute(); draw(); return; }
    running = true; lastTs = null; setBtn(true); rafId = requestAnimationFrame(loop);
  }
  function pause() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; setBtn(false); }
  function reset() { pause(); if (mode === 'hyd') { tFs = 0; setStatus(); draw(); } else applyPreset(preset); }
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
    canvas.setAttribute('aria-label', 'Wavefunction of an electron in a one-nanometre box: real and imaginary parts, probability density coloured by phase, and the average position over time');
    canvas.style.display = 'block'; mountEl.appendChild(canvas); ctx = canvas.getContext('2d');
    ['one', 'two', 'packet'].forEach(function (k) {
      var b = document.getElementById('preset-' + k);
      if (b) b.addEventListener('click', function () { var was = running; pause(); applyPreset(k); if (was) start(); });
    });
    var ns = document.getElementById('n-slider');
    if (ns) ns.addEventListener('input', function () {
      nState = parseInt(ns.value, 10);
      document.getElementById('n-val').textContent = 'n = ' + nState + ' (' + (nState - 1) + ' node' + (nState === 2 ? '' : 's') + ')';
      ns.setAttribute('aria-valuetext', 'n = ' + nState + ', ' + (nState - 1) + ' nodes');
      var was = running; pause(); applyPreset('one'); if (was) start();
    });
    ['box', 'hyd'].forEach(function (k) {
      var b = document.getElementById('mode-' + k);
      if (b) b.addEventListener('click', function () { setMode(k); });
    });
    ['1s', '2s', '2p'].forEach(function (k) {
      var b = document.getElementById('h-' + k);
      if (b) b.addEventListener('click', function () {
        hState = k; buildHydrogen(); tFs = 0;
        ['1s', '2s', '2p'].forEach(function (q) { var e = document.getElementById('h-' + q); if (e) e.setAttribute('aria-pressed', String(q === k)); });
        setStatus(); draw();
      });
    });
    var sl = document.getElementById('speed-slider');
    if (sl) sl.addEventListener('input', function () { setSpeed(parseFloat(sl.value)); });
    var pt = document.getElementById('parts-toggle');
    if (pt) pt.addEventListener('click', function () {
      showParts = !showParts; pt.setAttribute('aria-pressed', String(!showParts));
      pt.textContent = showParts ? 'Hide Re ψ and Im ψ' : 'Show Re ψ and Im ψ'; draw();
    });
    window.addEventListener('resize', onResize); onResize();
    applyPreset('packet');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
