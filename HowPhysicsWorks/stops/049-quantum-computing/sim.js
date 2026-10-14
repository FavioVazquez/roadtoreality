/* ============================================================
   sim.js — Stop 049: Quantum Computing
   Exact state-vector arithmetic for one and two qubits.
   View 1: Bloch sphere with H, X, Z, T gates; repeated measurement of
   fresh copies of the current state.
   View 2: H then CNOT makes (|00> + |11>)/sqrt2; shots in the Z or X basis.
   View 3: Deutsch's algorithm, amplitudes after each step.
   Qubit order: index = 2*a + b, qubit a first.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null, animOnly = false;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COL = { text: 'rgba(255,255,255,0.88)', muted: 'rgba(255,255,255,0.55)', faint: 'rgba(255,255,255,0.16)', vec: 'oklch(0.85 0.15 95)', a: 'oklch(0.75 0.13 220)', b: 'oklch(0.80 0.14 40)', pos: 'oklch(0.75 0.13 150)', neg: 'oklch(0.70 0.17 25)' };
  var R2 = Math.SQRT1_2;

  var mode = 'one';
  var q = { re: [1, 0], im: [0, 0] }, counts1 = [0, 0];
  var anim = null; /* {from:[x,y,z], axis:[x,y,z], ang, t} */
  var cnotOn = true, basisX = false, counts2 = [0, 0, 0, 0];
  var fIdx = 2, stage = 0, stageT = 0;
  var FN = [['constant 0', [0, 0]], ['constant 1', [1, 1]], ['balanced, f(x) = x', [0, 1]], ['balanced, f(x) = NOT x', [1, 0]]];
  var shotT = 0, seed = 2024;

  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed + 0.5) / 4294967296; }
  function txt(s, x, y, col, size, align, bold) {
    ctx.fillStyle = col || COL.text; ctx.font = (bold ? '600 ' : '') + (size || 12) + 'px "DM Sans", sans-serif';
    ctx.textAlign = align || 'left'; ctx.fillText(s, x, y);
  }
  function fmtC(re, im) {
    if (Math.abs(re) < 5e-4) re = 0; if (Math.abs(im) < 5e-4) im = 0;
    if (!im) return re.toFixed(3); if (!re) return im.toFixed(3) + 'i';
    return re.toFixed(3) + (im < 0 ? ' − ' : ' + ') + Math.abs(im).toFixed(3) + 'i';
  }

  /* ---------- one qubit ---------- */
  function bloch() {
    var ar = q.re[0], ai = q.im[0], br = q.re[1], bi = q.im[1];
    return [2 * (ar * br + ai * bi), 2 * (ar * bi - ai * br), ar * ar + ai * ai - br * br - bi * bi];
  }
  var GATE = {
    H: { axis: [R2, 0, R2], ang: Math.PI },
    X: { axis: [1, 0, 0], ang: Math.PI },
    Z: { axis: [0, 0, 1], ang: Math.PI },
    T: { axis: [0, 0, 1], ang: Math.PI / 4 }
  };
  function applyGate(g) {
    var a = [q.re[0], q.im[0]], b = [q.re[1], q.im[1]];
    if (g === 'H') { q.re = [R2 * (a[0] + b[0]), R2 * (a[0] - b[0])]; q.im = [R2 * (a[1] + b[1]), R2 * (a[1] - b[1])]; }
    else if (g === 'X') { q.re = [b[0], a[0]]; q.im = [b[1], a[1]]; }
    else if (g === 'Z') { q.re = [a[0], -b[0]]; q.im = [a[1], -b[1]]; }
    else if (g === 'T') { q.re = [a[0], R2 * (b[0] - b[1])]; q.im = [a[1], R2 * (b[0] + b[1])]; }
  }
  function rot(v, n, t) {
    var c = Math.cos(t), s = Math.sin(t), d = v[0] * n[0] + v[1] * n[1] + v[2] * n[2];
    var cx = n[1] * v[2] - n[2] * v[1], cy = n[2] * v[0] - n[0] * v[2], cz = n[0] * v[1] - n[1] * v[0];
    return [v[0] * c + cx * s + n[0] * d * (1 - c), v[1] * c + cy * s + n[1] * d * (1 - c), v[2] * c + cz * s + n[2] * d * (1 - c)];
  }
  function gate(g) {
    var from = bloch(); applyGate(g); counts1 = [0, 0];
    if (!reducedMotion) { anim = { from: from, axis: GATE[g].axis, ang: GATE[g].ang, t: 0 }; kick(); }
    setStatus(); draw();
  }
  function proj(v, cx, cy, R) {
    var A = -0.55, E = 0.32, x = v[0], y = v[1], z = v[2];
    var depth = x * Math.sin(A) + y * Math.cos(A);
    return [cx + R * (x * Math.cos(A) - y * Math.sin(A)), cy - R * (z * Math.cos(E) - depth * Math.sin(E)), depth];
  }
  function drawOne() {
    var narrow = W < 560, R = narrow ? 105 : 130, cx = narrow ? W / 2 : W * 0.30, cy = narrow ? 150 : H / 2 - 10;
    ctx.strokeStyle = COL.faint; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
    [[0, 1], [1, 0]].forEach(function (pl) {
      ctx.beginPath();
      for (var k = 0; k <= 72; k++) {
        var t = k / 72 * 2 * Math.PI, v = pl[0] ? [Math.cos(t), Math.sin(t), 0] : [Math.cos(t), 0, Math.sin(t)], p = proj(v, cx, cy, R);
        if (k === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
      }
      ctx.stroke();
    });
    var L = [[[0, 0, 1], '|0⟩'], [[0, 0, -1], '|1⟩'], [[1, 0, 0], '|+⟩'], [[-1, 0, 0], '|−⟩'], [[0, 1, 0], '|+i⟩']];
    L.forEach(function (l) { var p = proj(l[0], cx, cy, R * 1.15); txt(l[1], p[0], p[1] + 4, COL.muted, 12, 'center'); });
    var v = bloch();
    if (anim) v = rot(anim.from, anim.axis, anim.ang * Math.min(1, anim.t));
    var o = proj([0, 0, 0], cx, cy, R), p = proj(v, cx, cy, R);
    ctx.strokeStyle = COL.vec; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
    ctx.fillStyle = COL.vec; ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, 2 * Math.PI); ctx.fill();
    var px = narrow ? 18 : W * 0.58, py = narrow ? cy + R + 46 : 70;
    var p0 = q.re[0] * q.re[0] + q.im[0] * q.im[0], p1 = 1 - p0;
    txt('State α|0⟩ + β|1⟩', px, py, COL.muted, 12);
    txt('α = ' + fmtC(q.re[0], q.im[0]), px, py + 22, COL.text, 13);
    txt('β = ' + fmtC(q.re[1], q.im[1]), px, py + 42, COL.text, 13);
    txt('P(0) = |α|² = ' + p0.toFixed(3) + '   P(1) = ' + p1.toFixed(3), px, py + 64, COL.text, 12);
    var n = counts1[0] + counts1[1], by = py + 92, bw = narrow ? W - 36 : W * 0.38;
    txt('Measuring ' + n + ' fresh copies', px, by, COL.muted, 11);
    for (var i = 0; i < 2; i++) {
      var f = n ? counts1[i] / n : 0, y = by + 14 + i * 26;
      ctx.fillStyle = COL.faint; ctx.fillRect(px + 22, y, bw - 70, 16);
      ctx.fillStyle = i ? COL.b : COL.a; ctx.fillRect(px + 22, y, (bw - 70) * f, 16);
      txt(String(i), px, y + 13, COL.text, 12, 'left', true);
      txt((f * 100).toFixed(0) + ' %', px + bw - 40, y + 13, COL.muted, 11);
    }
    if (!narrow) txt('Each measurement gives 0 or 1, never both.', px, by + 80, COL.muted, 11);
  }

  /* ---------- two qubits ---------- */
  function bellState() {
    var re = [1, 0, 0, 0], im = [0, 0, 0, 0];
    function h(pairBit) { for (var i = 0; i < 4; i++) if (!(i & pairBit)) { var j = i | pairBit, a = re[i], b = re[j], c = im[i], d = im[j]; re[i] = R2 * (a + b); re[j] = R2 * (a - b); im[i] = R2 * (c + d); im[j] = R2 * (c - d); } }
    h(2);
    if (cnotOn) { var t = re[2]; re[2] = re[3]; re[3] = t; t = im[2]; im[2] = im[3]; im[3] = t; }
    if (basisX) { h(2); h(1); }
    return re.map(function (r, i) { return r * r + im[i] * im[i]; });
  }
  function shot2() { var p = bellState(), u = rnd(), acc = 0; for (var i = 0; i < 4; i++) { acc += p[i]; if (u < acc) { counts2[i]++; return; } } counts2[3]++; }
  function shot1() { var p0 = q.re[0] * q.re[0] + q.im[0] * q.im[0]; counts1[rnd() < p0 ? 0 : 1]++; }
  function drawBell() {
    var narrow = W < 560, x0 = narrow ? 34 : 70, x1 = W - (narrow ? 20 : 60), ya = 50, yb = 100;
    txt('a', x0 - 22, ya + 4, COL.text, 13, 'left', true); txt('b', x0 - 22, yb + 4, COL.text, 13, 'left', true);
    txt('|0⟩', x0, ya - 12, COL.muted, 11); txt('|0⟩', x0, yb - 12, COL.muted, 11);
    ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, ya); ctx.lineTo(x1, ya); ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
    var gx = x0 + (x1 - x0) * 0.25, cxp = x0 + (x1 - x0) * 0.5, mx = x0 + (x1 - x0) * 0.8;
    function box(x, y, s) { ctx.fillStyle = '#111'; ctx.fillRect(x - 15, y - 15, 30, 30); ctx.strokeStyle = COL.text; ctx.strokeRect(x - 15, y - 15, 30, 30); txt(s, x, y + 5, COL.text, 13, 'center', true); }
    box(gx, ya, 'H');
    if (cnotOn) {
      ctx.strokeStyle = COL.text; ctx.fillStyle = COL.text; ctx.beginPath(); ctx.arc(cxp, ya, 5, 0, 2 * Math.PI); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cxp, ya); ctx.lineTo(cxp, yb + 11); ctx.stroke(); ctx.beginPath(); ctx.arc(cxp, yb, 11, 0, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cxp - 11, yb); ctx.lineTo(cxp + 11, yb); ctx.stroke();
    } else txt('(no CNOT)', cxp, (ya + yb) / 2 + 4, COL.muted, 11, 'center');
    if (basisX) { box(mx - 34, ya, 'H'); box(mx - 34, yb, 'H'); }
    box(mx, ya, 'M'); box(mx, yb, 'M');
    var lab = basisX ? ['++', '+−', '−+', '−−'] : ['00', '01', '10', '11'];
    var n = counts2[0] + counts2[1] + counts2[2] + counts2[3], p = bellState();
    var hy0 = 150, hy1 = H - (narrow ? 130 : 110), bw = (W - 2 * x0) / 4;
    txt(cnotOn ? 'State (|00⟩ + |11⟩)/√2' : 'State (|00⟩ + |10⟩)/√2 = |+⟩|0⟩, not entangled', W / 2, hy0 - 12, COL.muted, narrow ? 11 : 12, 'center');
    for (var i = 0; i < 4; i++) {
      var f = n ? counts2[i] / n : 0, x = x0 + i * bw + bw * 0.15, w = bw * 0.7, h = (hy1 - hy0 - 20) * f;
      ctx.fillStyle = (i === 0 || i === 3) ? COL.pos : COL.neg; ctx.fillRect(x, hy1 - h, w, h);
      ctx.strokeStyle = COL.faint; ctx.strokeRect(x, hy0 + 4, w, hy1 - hy0 - 4);
      var ey = hy1 - (hy1 - hy0 - 20) * p[i]; ctx.strokeStyle = COL.text; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(x - 3, ey); ctx.lineTo(x + w + 3, ey); ctx.stroke(); ctx.setLineDash([]);
      txt(lab[i], x + w / 2, hy1 + 16, COL.text, 13, 'center', true);
      txt((f * 100).toFixed(0) + ' %', x + w / 2, hy1 + 32, COL.muted, 11, 'center');
    }
    var same = n ? (counts2[0] + counts2[3]) / n : 0, a0 = n ? (counts2[0] + counts2[1]) / n : 0;
    var ty = hy1 + (narrow ? 56 : 54);
    txt(n + ' shots. Same result on a and b: ' + (same * 100).toFixed(0) + ' %', x0, ty, COL.text, 12);
    txt('Qubit a alone: ' + (a0 * 100).toFixed(0) + ' % ' + (basisX ? '+' : '0') + ', ' + ((1 - a0) * 100).toFixed(0) + ' % ' + (basisX ? '−' : '1') + (narrow ? '' : '. Dashed lines: predicted.'), x0, ty + 18, COL.muted, 11);
  }

  /* ---------- Deutsch ---------- */
  function deutschAmps(st) {
    var f = FN[fIdx][1], a = [0, 1, 0, 0];
    if (st >= 1) a = [0.5, -0.5, 0.5, -0.5];
    if (st >= 2) a = a.map(function (v, i) { return f[i >> 1] ? -v : v; });
    if (st >= 3) { var b = a.slice(); a = [R2 * (b[0] + b[2]), R2 * (b[1] + b[3]), R2 * (b[0] - b[2]), R2 * (b[1] - b[3])]; }
    return a;
  }
  var STG = ['Start: a = |0⟩, b = |1⟩.', 'Hadamard on both: four amplitudes of ±1/2.', 'One query of f: each x picks up the sign (−1)^f(x).', 'Hadamard on a: the amplitudes interfere.', 'Measure a: 0 means constant, 1 means balanced.'];
  function drawDeutsch() {
    var narrow = W < 560, x0 = narrow ? 30 : 70, x1 = W - (narrow ? 16 : 60), ya = 48, yb = 92;
    txt('a', x0 - 20, ya + 4, COL.text, 13, 'left', true); txt('b', x0 - 20, yb + 4, COL.text, 13, 'left', true);
    ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, ya); ctx.lineTo(x1, ya); ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
    var xs = [0.12, 0.3, 0.55, 0.78, 0.94].map(function (t) { return x0 + (x1 - x0) * t; });
    function box(x, y, s, w) { w = w || 30; ctx.fillStyle = '#111'; ctx.fillRect(x - w / 2, y - 14, w, 28); ctx.strokeStyle = COL.text; ctx.strokeRect(x - w / 2, y - 14, w, 28); txt(s, x, y + 5, COL.text, 12, 'center', true); }
    box(xs[1], ya, 'H'); box(xs[1], yb, 'H');
    ctx.fillStyle = '#111'; ctx.fillRect(xs[2] - 22, ya - 14, 44, yb - ya + 28); ctx.strokeStyle = COL.vec; ctx.strokeRect(xs[2] - 22, ya - 14, 44, yb - ya + 28); txt('U_f', xs[2], (ya + yb) / 2 + 5, COL.vec, 12, 'center', true);
    box(xs[3], ya, 'H'); box(xs[4], ya, 'M');
    var mk = [xs[0], (xs[1] + xs[2]) / 2, (xs[2] + xs[3]) / 2, (xs[3] + xs[4]) / 2, Math.min(xs[4] + 22, W - 6)][stage];
    ctx.strokeStyle = COL.vec; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mk, ya - 24); ctx.lineTo(mk, yb + 22); ctx.stroke();
    var amps = deutschAmps(Math.min(stage, 3)), hy = narrow ? 250 : 240, hs = narrow ? 80 : 90, bw = (W - 2 * x0) / 4;
    txt('f: ' + FN[fIdx][0] + (narrow ? '' : '   (f(0), f(1)) = (' + FN[fIdx][1].join(', ') + ')'), W / 2, 140, COL.muted, 12, 'center');
    ctx.strokeStyle = COL.faint; ctx.beginPath(); ctx.moveTo(x0, hy); ctx.lineTo(W - x0, hy); ctx.stroke();
    ['|00⟩', '|01⟩', '|10⟩', '|11⟩'].forEach(function (l, i) {
      var v = amps[i], x = x0 + i * bw + bw * 0.2, w = bw * 0.6;
      ctx.fillStyle = v >= 0 ? COL.pos : COL.neg; ctx.fillRect(x, v >= 0 ? hy - v * hs : hy, w, Math.abs(v) * hs);
      txt(l, x + w / 2, hy + hs + 22, COL.text, 12, 'center', true);
      txt((Math.abs(v) < 1e-9 ? 0 : v).toFixed(3), x + w / 2, hy + hs + 38, COL.muted, 11, 'center');
    });
    var ty = hy + hs + 64;
    txt(STG[stage], narrow ? x0 - 14 : x0, ty, COL.text, narrow ? 11 : 12);
    if (stage >= 3) {
      var pa1 = amps[2] * amps[2] + amps[3] * amps[3];
      txt('P(a = 1) = ' + pa1.toFixed(2) + ' → ' + (pa1 > 0.5 ? 'balanced' : 'constant') + ', after one query of f.', narrow ? x0 - 14 : x0, ty + 20, COL.vec, 12, 'left', true);
    } else txt('A classical test must evaluate f(0) and f(1): two queries.', narrow ? x0 - 14 : x0, ty + 20, COL.muted, 11);
  }

  function draw() { if (!ctx) return; ctx.clearRect(0, 0, W, H); if (mode === 'one') drawOne(); else if (mode === 'bell') drawBell(); else drawDeutsch(); }

  function setStatus() {
    var el = document.getElementById('sim-status'); if (!el) return;
    if (mode === 'one') { var p0 = q.re[0] * q.re[0] + q.im[0] * q.im[0], n = counts1[0] + counts1[1]; el.textContent = 'α = ' + fmtC(q.re[0], q.im[0]) + ', β = ' + fmtC(q.re[1], q.im[1]) + '. P(0) = ' + p0.toFixed(3) + '. ' + n + ' copies measured: ' + counts1[0] + ' gave 0, ' + counts1[1] + ' gave 1.'; }
    else if (mode === 'bell') { var m = counts2.reduce(function (s, v) { return s + v; }, 0); el.textContent = (cnotOn ? 'Bell state' : 'Product state, no CNOT') + ', ' + (basisX ? 'X' : 'Z') + ' basis. ' + m + ' shots: ' + counts2.join(', ') + ' for ' + (basisX ? '++, +−, −+, −−' : '00, 01, 10, 11') + '.'; }
    else el.textContent = 'Deutsch, f ' + FN[fIdx][0] + '. Step ' + stage + ': ' + STG[stage];
  }

  function step(dt) {
    if (anim) { anim.t += dt / 0.6; if (anim.t >= 1) anim = null; }
    if (!running) return;
    shotT += dt;
    if (mode === 'one') { while (shotT > 0.08) { shotT -= 0.08; shot1(); } }
    else if (mode === 'bell') { while (shotT > 0.08) { shotT -= 0.08; shot2(); } }
    else { stageT += dt; if (stageT > (stage === 4 ? 2.6 : 1.6)) { stageT = 0; stage = (stage + 1) % 5; } shotT = 0; }
  }
  var statT = 0;
  function loop(ts) {
    if (!running && !anim) { rafId = null; draw(); setStatus(); return; }
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05); lastTs = ts;
    step(dt); draw(); statT += dt; if (statT > 0.25) { statT = 0; setStatus(); }
    rafId = requestAnimationFrame(loop);
  }
  function kick() { if (!rafId) { lastTs = null; rafId = requestAnimationFrame(loop); } }
  function setBtn(pl) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = pl ? '⏸ Pause' : '▶ Play'; btn.dataset.state = pl ? 'playing' : 'paused'; }
    var d = document.querySelector('.sim-caption__dot'); if (d) d.classList.toggle('is-running', pl);
  }
  function start() {
    if (running) return;
    if (reducedMotion) {
      var i; if (mode === 'one') for (i = 0; i < 200; i++) shot1(); else if (mode === 'bell') for (i = 0; i < 200; i++) shot2(); else stage = (stage + 1) % 5;
      setStatus(); draw(); return;
    }
    running = true; setBtn(true); kick();
  }
  function pause() { running = false; setBtn(false); setStatus(); }
  function reset() {
    pause(); anim = null; q = { re: [1, 0], im: [0, 0] }; counts1 = [0, 0]; counts2 = [0, 0, 0, 0]; stage = 0; stageT = 0; shotT = 0; seed = 2024;
    setStatus(); draw();
  }
  function destroy() { running = false; anim = null; if (rafId) cancelAnimationFrame(rafId); rafId = null; window.removeEventListener('resize', onResize); if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  var IDS = { one: 'q1-controls', bell: 'bell-controls', deutsch: 'deutsch-controls' };
  function setMode(m) {
    mode = m;
    Object.keys(IDS).forEach(function (k) {
      var b = document.getElementById('mode-' + k); if (b) b.setAttribute('aria-pressed', String(k === m));
      var c = document.getElementById(IDS[k]); if (c) c.style.display = k === m ? 'contents' : 'none';
    });
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
    canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'One of three views: a Bloch sphere with measurement counts, a two-qubit Bell-state circuit with shot statistics, or Deutsch\'s algorithm with the amplitudes after each step');
    canvas.style.display = 'block'; mountEl.appendChild(canvas); ctx = canvas.getContext('2d');
    ['H', 'X', 'Z', 'T'].forEach(function (g) { var b = document.getElementById('gate-' + g); if (b) b.addEventListener('click', function () { gate(g); }); });
    var c = document.getElementById('bell-cnot');
    if (c) c.addEventListener('click', function () { cnotOn = !cnotOn; c.setAttribute('aria-pressed', String(cnotOn)); c.textContent = cnotOn ? 'CNOT: on' : 'CNOT: off'; counts2 = [0, 0, 0, 0]; setStatus(); draw(); });
    var bx = document.getElementById('bell-basis');
    if (bx) bx.addEventListener('click', function () { basisX = !basisX; bx.setAttribute('aria-pressed', String(basisX)); counts2 = [0, 0, 0, 0]; setStatus(); draw(); });
    var fs = document.getElementById('deutsch-f');
    if (fs) fs.addEventListener('change', function () { fIdx = parseInt(fs.value, 10); setStatus(); draw(); });
    Object.keys(IDS).forEach(function (k) { var b = document.getElementById('mode-' + k); if (b) b.addEventListener('click', function () { setMode(k); }); });
    window.addEventListener('resize', onResize); onResize(); setMode('one');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
