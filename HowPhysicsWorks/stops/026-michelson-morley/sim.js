/* ============================================================
   sim.js — Stop 026: The Michelson-Morley Experiment
   Stationary-ether prediction, to second order in v/c:
     path difference  Δ(θ) = (L v²/c²) cos 2θ
     fringe position  N(θ) = Δ(θ)/λ = (ΔN90/2) cos 2θ
     swing for a 90° turn  ΔN90 = 2 L v² / (λ c²)
   Computed exactly from the round-trip times (no small-β expansion):
     t(θ) = (2L/c) √(1 − β² sin²θ) / (1 − β²),  ΔN(θ) = c[t(θ) − t(θ+90°)]/λ
   With the Lorentz–FitzGerald contraction on, every arm's round trip
   takes 2L/(c√(1−β²)) and ΔN = 0. The 1887 upper bound (< 0.02 fringe,
   Michelson & Morley 1887) is drawn as a band, not a computed curve.
   The pulse race is drawn at an exaggerated β (labelled on screen).
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false;
  var rafId = null;
  var lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var C_LIGHT = 299792458;
  var REPORTED_BOUND = 0.02;           /* cited upper bound on the swing, fringes */
  var TURN_SECONDS = 16;               /* animation: one full turn of the stone   */

  var L = 11, V = 30, LAM = 550;       /* m, km/s, nm */
  var theta = 0;
  var contraction = false, autoRot = true, scrubbing = false;
  var beamPhase = 0;

  var COL = {
    arm1: 'oklch(0.65 0.18 240)',
    arm2: 'oklch(0.72 0.14 200)',
    beam: 'oklch(0.92 0.12 95)',
    text: 'rgba(255,255,255,0.88)',
    muted: 'rgba(255,255,255,0.55)',
    faint: 'rgba(255,255,255,0.18)',
    band: 'rgba(160,175,190,0.28)',
    wind: 'oklch(0.65 0.18 240 / 0.45)'
  };

  function tRound(beta, th) {
    if (contraction) return 2 * L / C_LIGHT / Math.sqrt(1 - beta * beta);
    var s = Math.sin(th);
    return 2 * L / C_LIGHT * Math.sqrt(1 - beta * beta * s * s) / (1 - beta * beta);
  }
  function nAt(th) {
    var beta = V * 1000 / C_LIGHT;
    return C_LIGHT * (tRound(beta, th) - tRound(beta, th + Math.PI / 2)) / (LAM * 1e-9);
  }
  function swing90() { return nAt(0) - nAt(Math.PI / 2); }
  function fringeNow() { return nAt(theta); }
  function betaDisp() { return Math.min(0.45, 0.3 * V / 30); }

  function layout() {
    var narrow = W < 560;
    if (narrow) {
      return { narrow: true, app: { x: 0, y: 0, w: W, h: 250 }, fr: { x: 14, y: 272, w: W - 28, h: 92 }, gr: { x: 14, y: 400, w: W - 28, h: H - 418 } };
    }
    var topH = H - 170;
    return { narrow: false, app: { x: 0, y: 0, w: W * 0.55, h: topH }, fr: { x: W * 0.58, y: 70, w: W * 0.42 - 18, h: 130 }, gr: { x: 18, y: topH + 10, w: W - 36, h: 140 } };
  }

  function txt(s, x, y, col, size, align) {
    ctx.fillStyle = col || COL.text;
    ctx.font = (size || 12) + 'px "DM Sans", sans-serif';
    ctx.textAlign = align || 'left';
    ctx.fillText(s, x, y);
  }

  function drawApparatus(r) {
    var cx = r.x + r.w / 2, cy = r.y + r.h / 2 + 10;
    var arm = Math.min(r.w, r.h) * (W < 560 ? 0.26 : 0.34);
    if (V > 0) {
      ctx.strokeStyle = COL.wind; ctx.lineWidth = 1.2;
      for (var k = -2; k <= 2; k++) {
        var yy = cy + k * arm * 0.55, x0 = r.x + 16, x1 = r.x + r.w - 16;
        var off = (beamPhase * 40) % 40;
        ctx.setLineDash([10, 30]); ctx.lineDashOffset = -off;
        ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x0, yy); ctx.stroke();
      }
      ctx.setLineDash([]);
      txt('← ether wind in the classical model', r.x + 16, r.y + 40, COL.muted, 11);
    }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-theta);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.strokeStyle = COL.faint; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.rect(-arm * 1.25, -arm * 1.25, arm * 2.5, arm * 2.5); ctx.fill(); ctx.stroke();
    /* source → splitter, arms, detector */
    ctx.strokeStyle = COL.beam; ctx.globalAlpha = 0.55; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-arm, 0); ctx.lineTo(0, 0); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = COL.arm1; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(arm, 0); ctx.stroke();
    ctx.strokeStyle = COL.arm2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -arm); ctx.stroke();
    ctx.strokeStyle = COL.beam; ctx.globalAlpha = 0.55; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, arm * 0.8); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 5;
    ctx.strokeStyle = COL.arm1; ctx.beginPath(); ctx.moveTo(arm, -12); ctx.lineTo(arm, 12); ctx.stroke();
    ctx.strokeStyle = COL.arm2; ctx.beginPath(); ctx.moveTo(-12, -arm); ctx.lineTo(12, -arm); ctx.stroke();
    ctx.strokeStyle = COL.beam; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-10, 10); ctx.lineTo(10, -10); ctx.stroke();
    ctx.fillStyle = COL.beam;
    ctx.beginPath(); ctx.arc(-arm, 0, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = COL.muted;
    ctx.fillRect(-8, arm * 0.8, 16, 6);
    /* pulse race at exaggerated β: each pulse's out/back split follows the
       ether-wind picture; a pulse that is home waits at the splitter */
    var bd = betaDisp(), t1 = tRound(bd, theta), t2 = tRound(bd, theta + Math.PI / 2), tm = Math.max(t1, t2);
    var ph = (beamPhase % 1.25) * tm;
    ctx.fillStyle = COL.beam;
    [[t1, theta, 1], [t2, theta + Math.PI / 2, 2]].forEach(function (q) {
      var tt = q[0], c = contraction ? 0 : Math.cos(q[1]), out = tt * (0.5 + bd * c / (2 * Math.sqrt(1 - bd * bd * Math.sin(q[1]) * Math.sin(q[1])))), d;
      if (ph >= tt) d = 0; else if (ph < out) d = ph / out; else d = 1 - (ph - out) / (tt - out);
      if (q[2] === 1) { ctx.beginPath(); ctx.arc(d * arm, 0, 4, 0, 2 * Math.PI); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, -d * arm, 4, 0, 2 * Math.PI); ctx.fill(); }
    });
    ctx.font = '11px "DM Sans", sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = COL.arm1; ctx.fillText('arm 1', arm * 0.55, 16);
    ctx.fillStyle = COL.arm2; ctx.fillText('arm 2', -24, -arm * 0.55);
    ctx.restore();
    var deg = ((theta * 180 / Math.PI) % 360 + 360) % 360;
    txt('Arm 1 at ' + deg.toFixed(0) + '° to the motion', r.x + 16, r.y + 22, COL.text, 13);
    var bdTxt = V === 0 ? 'pulse race: β = 0, both pulses return together' : (contraction ? 'pulse race at β = ' + bd.toFixed(2) + ' (exaggerated), contracted: they return together' : 'pulse race drawn at β = ' + bd.toFixed(2) + ' (exaggerated; real ' + sciTxt(V * 1000 / C_LIGHT) + ')');
    txt(bdTxt, r.x + 16, r.y + r.h - 6, COL.muted, 11);
  }

  function strip(x, y, w, h, shiftFr, period) {
    for (var i = 0; i < w; i += 2) {
      var I = Math.pow(Math.cos(Math.PI * ((i - w / 2) / period - shiftFr)), 2);
      ctx.fillStyle = 'rgba(255,240,180,' + (0.08 + 0.85 * I).toFixed(3) + ')';
      ctx.fillRect(x + i, y, 2, h);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x + w / 2, y - 3); ctx.lineTo(x + w / 2, y + h + 3); ctx.stroke();
  }
  function drawFringes(r, L_) {
    var period = Math.max(26, Math.min(44, r.w / 8)), sh = (r.h - 22) / 2;
    txt('Model (formula): shift ' + fmtSigned(fringeNow()) + ' fringe', r.x, r.y - 4, COL.muted, 11);
    strip(r.x, r.y, r.w, sh, fringeNow(), period);
    txt('1887 observed: no shift above 0.02 (cited)', r.x, r.y + sh + 16, COL.muted, 11);
    strip(r.x, r.y + sh + 22, r.w, sh, 0, period);
    if (!L_.narrow) {
      txt('Model swing for a 90° turn:', r.x, r.y + r.h + 30, COL.muted, 12);
      txt(swing90().toFixed(2) + ' fringe' + (contraction ? ' (with contraction)' : ''), r.x, r.y + r.h + 50, COL.text, 15);
      txt('1887 reported: < 0.02, probably < 0.01 (cited)', r.x, r.y + r.h + 74, COL.muted, 12);
    }
  }

  function syncRot(fromSlider) {
    var deg = ((theta * 180 / Math.PI) % 360 + 360) % 360;
    var rs = document.getElementById('rot-slider'), out = document.getElementById('rot-val');
    if (rs && !fromSlider) rs.value = String(Math.round(deg));
    if (rs) rs.setAttribute('aria-valuetext', Math.round(deg) + ' degrees');
    if (out) out.textContent = Math.round(deg) + '°';
  }
  function sciTxt(x) {
    if (x === 0) return '0';
    var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e), sup = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return m.toFixed(1) + '×10' + String(e).split('').map(function (ch) { return sup[ch]; }).join('');
  }
  function fmtSigned(v) { return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2); }

  function drawGraph(r, L_) {
    var A = Math.abs(swing90()) / 2;
    var yMax = Math.max(0.25, A * 1.15, REPORTED_BOUND);
    var mid = r.y + r.h / 2 + (L_.narrow ? 14 : 6);
    var sy = (r.h / 2 - (L_.narrow ? 22 : 14)) / yMax;
    ctx.strokeStyle = COL.faint; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(r.x, mid); ctx.lineTo(r.x + r.w, mid); ctx.stroke();
    ctx.fillStyle = COL.band;
    var bh = Math.max(2, REPORTED_BOUND / 2 * sy);
    ctx.fillRect(r.x, mid - bh, r.w, 2 * bh);
    ctx.strokeStyle = COL.arm1;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= 180; i++) {
      var th = i / 180 * 2 * Math.PI, x = r.x + i / 180 * r.w, y = mid - nAt(th) * sy;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
    var thw = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    var mx = r.x + thw / (2 * Math.PI) * r.w;
    ctx.fillStyle = COL.beam;
    ctx.beginPath(); ctx.arc(mx, mid - fringeNow() * sy, 4.5, 0, 2 * Math.PI); ctx.fill();
    txt('Fringe position vs angle, 0–360°', r.x, r.y + 2, COL.muted, 11);
    var lbl = 'model, amplitude ' + A.toFixed(2) + ' · band ±0.01 (1887 bound 0.02 on swing, cited)';
    if (L_.narrow) txt('model, amp. ' + A.toFixed(2) + ' · band ±0.01 (swing bound 0.02)', r.x, r.y + 17, COL.muted, 11); else txt(lbl, r.x + r.w, r.y + 2, COL.muted, 11, 'right');
    if (L_.narrow) {
      txt('Model swing, 90° turn: ' + swing90().toFixed(2) + ' fringe · reported < 0.02', r.x, r.y + r.h + 4, COL.text, 12);
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    var L_ = layout();
    drawApparatus(L_.app);
    drawFringes(L_.fr, L_);
    drawGraph(L_.gr, L_);
  }

  function setStatus() {
    var el = document.getElementById('sim-status');
    if (!el) return;
    el.textContent = contraction
      ? 'With the Lorentz–FitzGerald contraction both round trips take the same time: the model shift is ' + swing90().toFixed(2) + ', matching the null result.'
      : 'Ether model (formula): turning by 90° moves the fringes by ' + swing90().toFixed(2) + ' of a fringe for L = ' + L.toFixed(1) + ' m, v = ' + V + ' km/s, λ = ' + LAM + ' nm. Reported in 1887: < 0.02.';
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    if (autoRot && !scrubbing) { theta += dt * 2 * Math.PI / TURN_SECONDS; syncRot(); }
    beamPhase += dt * 0.8;
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function setBtn(playing) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = playing ? '⏸ Pause' : '▶ Play'; btn.dataset.state = playing ? 'playing' : 'paused'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.toggle('is-running', playing);
  }

  function start() {
    if (running) return;
    if (reducedMotion) { theta += Math.PI / 4; draw(); return; }
    running = true; lastTs = null; setBtn(true);
    rafId = requestAnimationFrame(loop);
  }
  function pause() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null; setBtn(false);
  }
  function reset() {
    pause(); theta = 0; beamPhase = 0; syncRot(); draw(); setStatus();
  }
  function destroy() {
    pause();
    window.removeEventListener('resize', onResize);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }
  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  function onResize() {
    if (!mountEl || !canvas) return;
    var dpr = window.devicePixelRatio || 1;
    W = Math.round(mountEl.getBoundingClientRect().width) || 680;
    H = W < 560 ? 560 : 470;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function bindSlider(id, valId, fmt, aria, apply) {
    var el = document.getElementById(id), out = document.getElementById(valId);
    if (!el) return;
    el.addEventListener('input', function () {
      var v = parseFloat(el.value);
      apply(v);
      if (out) out.textContent = fmt(v);
      el.setAttribute('aria-valuetext', aria(v));
      setStatus(); draw();
    });
  }

  function init() {
    mountEl = document.getElementById('sim-mount');
    if (!mountEl) return;
    canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Top view of the interferometer, its fringe pattern, and a graph of fringe position against rotation angle');
    canvas.style.display = 'block';
    mountEl.appendChild(canvas);
    ctx = canvas.getContext('2d');
    bindSlider('len-slider', 'len-val', function (v) { return v.toFixed(1) + ' m'; }, function (v) { return v + ' metres'; }, function (v) { L = v; });
    bindSlider('vel-slider', 'vel-val', function (v) { return v + ' km/s'; }, function (v) { return v + ' kilometres per second'; }, function (v) { V = v; });
    bindSlider('lam-slider', 'lam-val', function (v) { return v + ' nm'; }, function (v) { return v + ' nanometres'; }, function (v) { LAM = v; });
    var rs = document.getElementById('rot-slider');
    if (rs) {
      rs.addEventListener('input', function () { scrubbing = true; theta = parseFloat(rs.value) * Math.PI / 180; syncRot(true); draw(); });
      ['change', 'pointerup', 'blur'].forEach(function (ev) { rs.addEventListener(ev, function () { scrubbing = false; }); });
    }
    var at = document.getElementById('auto-toggle');
    if (at) at.addEventListener('click', function () {
      autoRot = !autoRot; at.setAttribute('aria-pressed', String(autoRot));
      at.textContent = autoRot ? 'Auto-rotate: on' : 'Auto-rotate: off';
    });
    var ct = document.getElementById('contract-toggle');
    if (ct) ct.addEventListener('click', function () {
      contraction = !contraction; ct.setAttribute('aria-pressed', String(contraction));
      ct.textContent = contraction ? 'Lorentz–FitzGerald contraction: on' : 'Lorentz–FitzGerald contraction: off';
      setStatus(); draw();
    });
    window.addEventListener('resize', onResize);
    onResize();
    setStatus();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
