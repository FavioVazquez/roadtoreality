/* ============================================================
   sim.js — Stop 040: Nuclear Fission
   Chain view: neutron generations drawn at random. Each neutron causes a
   fission with probability p (set by the slider; it stands for capture,
   leakage and control rods together, illustrative). A fission releases
   2 or 3 neutrons with mean ν̄ = 2.4355 (thermal U-235). k = ν̄ p.
   Power curve: one-group point kinetics, β = 0.0065, λ = 0.0768 /s
   (from the 8-group U-235 delayed-neutron data), Λ = 1e-4 s.
     with delayed neutrons, ρ < β (prompt jump):
       P/P0 = β/(β − ρ) · exp(λ ρ t / (β − ρ))
     without them: P/P0 = exp(ρ t / Λ);  ρ = (k − 1)/k
   Energy view: binding energy per nucleon of the most bound nuclide at
   each A, and Q values from atomic masses (AME2020).
   ============================================================ */
(function () {
  'use strict';

  var CURVE = [[2,1.1123],[3,2.8273],[4,7.0739],[5,5.5121],[6,5.3323],[7,5.6064],[8,7.0624],[9,6.4627],[10,6.4976],[11,6.9277],[12,7.6801],[13,7.4698],[14,7.5203],[15,7.6995],[16,7.9762],[17,7.7507],[18,7.7671],[19,7.779],[20,8.0322],[21,7.9717],[22,8.0805],[23,8.1115],[24,8.2607],[25,8.2235],[26,8.3339],[27,8.3316],[28,8.4477],[29,8.4486],[30,8.5207],[31,8.4812],[32,8.4931],[33,8.5138],[34,8.5835],[35,8.5379],[36,8.5754],[37,8.5703],[38,8.6143],[39,8.5626],[40,8.5953],[41,8.5761],[42,8.6166],[43,8.6007],[44,8.6582],[45,8.6305],[46,8.669],[47,8.6651],[48,8.723],[49,8.7112],[50,8.7557],[51,8.7421],[52,8.776],[53,8.7602],[54,8.778],[55,8.765],[56,8.7904],[57,8.7703],[58,8.7923],[59,8.768],[60,8.7808],[61,8.765],[62,8.7946],[63,8.7635],[64,8.7775],[65,8.7571],[66,8.7596],[67,8.7375],[68,8.7557],[69,8.7246],[70,8.7298],[71,8.7176],[72,8.7317],[73,8.705],[74,8.7252],[75,8.7009],[76,8.7115],[77,8.696],[78,8.7178],[79,8.6956],[80,8.7108],[81,8.6959],[82,8.7107],[83,8.6957],[84,8.7174],[85,8.6986],[86,8.712],[87,8.711],[88,8.7326],[89,8.714],[90,8.71],[91,8.6933],[92,8.6927],[93,8.6716],[94,8.6668],[95,8.6487],[96,8.654],[97,8.6351],[98,8.6352],[99,8.6136],[100,8.6194],[101,8.6014],[102,8.6074],[103,8.5844],[104,8.5874],[105,8.5727],[106,8.58],[107,8.5609],[108,8.567],[109,8.5479],[110,8.5513],[111,8.5371],[112,8.5447],[113,8.527],[114,8.5315],[115,8.5165],[116,8.5231],[117,8.5096],[118,8.5165],[119,8.4994],[120,8.5045],[121,8.4852],[122,8.4879],[123,8.4723],[124,8.4733],[125,8.4582],[126,8.4632],[127,8.4461],[128,8.4488],[129,8.436],[130,8.4377],[131,8.4237],[132,8.4276],[133,8.4126],[134,8.4137],[135,8.4013],[136,8.4028],[137,8.3918],[138,8.3934],[139,8.378],[140,8.3763],[141,8.3554],[142,8.3471],[143,8.3305],[144,8.3269],[145,8.3092],[146,8.3041],[147,8.2844],[148,8.2796],[149,8.2635],[150,8.2616],[151,8.244],[152,8.2441],[153,8.2287],[154,8.2268],[155,8.2167],[156,8.2153],[157,8.2035],[158,8.2018],[159,8.1888],[160,8.1841],[161,8.1745],[162,8.1735],[163,8.1618],[164,8.1587],[165,8.147],[166,8.1419],[167,8.1317],[168,8.1296],[169,8.117],[170,8.112],[171,8.1019],[172,8.0974],[173,8.0874],[174,8.0838],[175,8.0709],[176,8.0641],[177,8.0534],[178,8.0494],[179,8.0385],[180,8.0349],[181,8.0234],[182,8.0183],[183,8.0083],[184,8.0051],[185,7.9929],[186,7.9886],[187,7.978],[188,7.9739],[189,7.963],[190,7.9621],[191,7.9506],[192,7.9485],[193,7.9381],[194,7.9359],[195,7.9266],[196,7.9265],[197,7.916],[198,7.9142],[199,7.9069],[200,7.9059],[201,7.8976],[202,7.8969],[203,7.8875],[204,7.8855],[205,7.8784],[206,7.8754],[207,7.8699],[208,7.8675],[209,7.8486],[210,7.836],[211,7.8198],[212,7.8102],[213,7.794],[214,7.7851],[215,7.7682],[216,7.7588],[217,7.7446],[218,7.7388],[219,7.7238],[220,7.7173],[221,7.7033],[222,7.6967],[223,7.6853],[224,7.6799],[225,7.6676],[226,7.662],[227,7.6507],[228,7.6451],[229,7.6347],[230,7.631],[231,7.6201],[232,7.615],[233,7.6049],[234,7.6007],[235,7.5909],[236,7.5865],[237,7.5761],[238,7.5701],[239,7.5606],[240,7.556],[241,7.5464],[242,7.5413],[243,7.531],[244,7.5248],[245,7.5158],[246,7.5115],[247,7.5019],[248,7.4967],[249,7.486],[250,7.48],[251,7.4705],[252,7.4653],[253,7.4548],[254,7.4492],[255,7.4378],[256,7.4318],[257,7.4222],[258,7.4097],[259,7.4],[260,7.3426],[261,7.3714],[262,7.3412],[264,7.2984],[265,7.2962],[266,7.2983],[269,7.2502],[270,7.2538]];
  var M = {"n1":[1.008664916,0.0],"H2":[2.014101778,1.1123],"H3":[3.016049281,2.8273],"He4":[4.002603254,7.0739],"Fe56":[55.934935537,8.7904],"Ni62":[61.928344753,8.7946],"Kr92":[91.926173092,8.5127],"Zr92":[91.905035336,8.6927],"Ba141":[140.914403653,8.3261],"Pr141":[140.907659604,8.354],"U235":[235.043928117,7.5909]};     /* atomic mass (u), binding energy per nucleon (MeV) */

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var NU = 2.4355, P3 = NU - 2, BETA = 0.0065, LAM = 0.0768, GEN_T = 1e-4, U_MEV = 931.49410242;
  var T_CHART = 120, T_RATE = 6, GEN_DT = 0.6, N0 = 40, NMAX = 4000;

  var mode = 'chain', p = 0.4110, noDelayed = false, gens = [N0], genAcc = 0, tSim = 0, pulse = 0;

  var COL = { era: 'oklch(0.68 0.20 310)', n: 'oklch(0.80 0.14 200)', fis: 'oklch(0.78 0.16 40)', fus: 'oklch(0.80 0.14 140)', text: 'rgba(255,255,255,0.88)', muted: 'rgba(255,255,255,0.55)', faint: 'rgba(255,255,255,0.18)', hi: 'oklch(0.88 0.15 95)' };

  function txt(s, x, y, col, size, align) {
    ctx.fillStyle = col || COL.text; ctx.font = (size || 12) + 'px "DM Sans", sans-serif';
    ctx.textAlign = align || 'left'; ctx.fillText(s, x, y);
  }
  function k() { return NU * p; }
  function rho() { return (k() - 1) / k(); }
  function power(t, noDel) {
    var r = rho();
    if (noDel || r >= BETA) return Math.exp((noDel ? r : r - BETA) * t / GEN_T);
    return BETA / (BETA - r) * Math.exp(LAM * r * t / (BETA - r));
  }
  function nextGen(n) {
    var out = 0;
    for (var i = 0; i < n; i++) if (Math.random() < p) out += Math.random() < P3 ? 3 : 2;
    return out;
  }
  function simK() {
    var m = gens.length; if (m < 3) return null;
    var a = Math.max(0, m - 6), num = 0, den = 0;
    for (var i = a; i < m - 1; i++) { num += gens[i + 1]; den += gens[i]; }
    return den ? num / den : null;
  }
  function fmtT(s) { return !isFinite(s) ? '∞' : Math.abs(s) >= 1 ? Math.abs(s).toFixed(1) + ' s' : Math.abs(s) >= 1e-3 ? (Math.abs(s) * 1000).toFixed(1) + ' ms' : (Math.abs(s) * 1e6).toFixed(0) + ' µs'; }

  function drawChain() {
    var narrow = W < 560, x0 = 16, x1 = W - 16, bw = x1 - x0;
    txt('k = ν̄ × p = ' + NU + ' × ' + p.toFixed(3) + ' = ' + k().toFixed(3) + (Math.abs(k() - 1) < 0.0015 ? ' (critical)' : k() > 1 ? ' (supercritical)' : ' (subcritical)'), x0, 20, COL.text, narrow ? 12 : 14);
    var gTop = 36, gH = narrow ? 150 : 150, show = gens.slice(-12), maxN = 1;
    show.forEach(function (n) { maxN = Math.max(maxN, n); });
    var colW = bw / 12, lmax = Math.log10(Math.max(10, maxN * 1.2));
    for (var i = 0; i < show.length; i++) {
      var n = show[i], h = n > 0 ? Math.log10(n + 1) / lmax * (gH - 18) : 0, x = x0 + i * colW;
      ctx.fillStyle = 'oklch(0.80 0.14 200 / 0.55)'; ctx.fillRect(x + 3, gTop + gH - h, colW - 6, h);
      txt(String(n), x + colW / 2, gTop + gH - h - 4, COL.muted, 10, 'center');
    }
    var last = show[show.length - 1];
    ctx.strokeStyle = COL.faint; ctx.beginPath(); ctx.moveTo(x0, gTop + gH + 0.5); ctx.lineTo(x1, gTop + gH + 0.5); ctx.stroke();
    var sk = simK();
    txt('Neutrons per generation (log scale), last 12 · k from the sim\'s generations: ' + (sk === null ? '—' : sk.toFixed(2)), x0, gTop + gH + 16, COL.muted, narrow ? 10 : 11);
    if (last === 0) txt('The chain died out.', x0 + bw / 2, gTop + gH / 2, COL.hi, 13, 'center');
    if (last >= NMAX) txt('Runaway: capped for display', x0 + bw / 2, gTop + gH / 2, COL.hi, 13, 'center');

    var pTop = gTop + gH + 46, pH = H - pTop - 40, lo = -2, hi = 6;
    function X(t) { return x0 + t / T_CHART * bw; }
    function Y(v) { var l = Math.log10(Math.max(v, 1e-9)); l = Math.max(lo, Math.min(hi, l)); return pTop + pH - (l - lo) / (hi - lo) * pH; }
    ctx.strokeStyle = COL.faint; ctx.strokeRect(x0 + 0.5, pTop + 0.5, bw - 1, pH);
    ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x0, Y(1)); ctx.lineTo(x1, Y(1)); ctx.stroke(); ctx.setLineDash([]);
    [[false, COL.era], [true, 'rgba(255,255,255,0.5)']].forEach(function (c) {
      if (c[0] && !noDelayed) return;
      ctx.strokeStyle = c[1]; ctx.lineWidth = 2; ctx.beginPath();
      for (var j = 0; j <= 240; j++) { var t = j / 240 * T_CHART, yy = Y(power(t, c[0])); if (j) ctx.lineTo(X(t), yy); else ctx.moveTo(X(t), yy); }
      ctx.stroke();
    });
    ctx.strokeStyle = COL.hi; ctx.beginPath(); ctx.moveTo(X(tSim), pTop); ctx.lineTo(X(tSim), pTop + pH); ctx.stroke();
    txt('Reactor power P/P₀ over ' + T_CHART + ' s (formula; log scale 10⁻² to 10⁶)', x0, pTop - 6, COL.muted, narrow ? 10 : 11);
    var r = rho(), perD = r >= BETA ? GEN_T / (r - BETA) : (BETA - r) / (LAM * r), perP = GEN_T / r;
    txt('ρ = ' + (r * 100).toFixed(3) + ' % · e-folding time with delayed neutrons: ' + (r === 0 ? '∞' : fmtT(perD)) + (noDelayed ? ' · without: ' + fmtT(perP) : ''), x0, H - 20, COL.text, narrow ? 10 : 12);
    if (r >= BETA) txt('Prompt critical (ρ ≥ β): delayed neutrons no longer help', x0, H - 4, COL.hi, 11);
  }

  function drawEnergy() {
    var narrow = W < 560, x0 = narrow ? 40 : 54, x1 = W - 16, y0 = 40, gh = narrow ? 250 : 280, bw = x1 - x0;
    function X(a) { return x0 + a / 260 * bw; }
    function Y(b) { return y0 + gh - b / 9.2 * gh; }
    txt('Binding energy per nucleon (AME2020)', 16, 22, COL.text, narrow ? 12 : 14);
    ctx.strokeStyle = COL.faint; ctx.strokeRect(x0 + 0.5, y0 + 0.5, bw, gh);
    for (var b = 0; b <= 9; b += 3) txt(b + ' MeV', x0 - 6, Y(b) + 4, COL.muted, 10, 'right');
    for (var a = 0; a <= 250; a += 50) txt(String(a), X(a), y0 + gh + 14, COL.muted, 10, 'center');
    txt('mass number A', x1, y0 + gh + 28, COL.muted, 10, 'right');
    ctx.strokeStyle = COL.era; ctx.lineWidth = 1.6; ctx.beginPath();
    CURVE.forEach(function (c, i) { if (i) ctx.lineTo(X(c[0]), Y(c[1])); else ctx.moveTo(X(c[0]), Y(c[1])); });
    ctx.stroke();
    function mark(key, label, col, dy) {
      var A = parseInt(key.replace(/\D/g, ''), 10), bb = M[key][1];
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(A), Y(bb), 4, 0, 2 * Math.PI); ctx.fill();
      txt(label, X(A), Y(bb) + (dy || -9), col, 11, 'center');
    }
    var s = (Math.sin(pulse * 2) + 1) / 2;
    function arrowTo(k1, k2, col) {
      var A1 = parseInt(k1.replace(/\D/g, ''), 10), A2 = parseInt(k2.replace(/\D/g, ''), 10);
      var xa = X(A1), ya = Y(M[k1][1]), xb = X(A2), yb = Y(M[k2][1]);
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(xa + (xb - xa) * s, ya + (yb - ya) * s, 3, 0, 2 * Math.PI); ctx.fill();
    }
    arrowTo('U235', 'Ba141', COL.fis); arrowTo('U235', 'Kr92', COL.fis); arrowTo('H2', 'He4', COL.fus); arrowTo('H3', 'He4', COL.fus);
    mark('U235', 'U-235', COL.fis, 16); mark('Ba141', 'Ba-141', COL.fis, 16); mark('Kr92', 'Kr-92', COL.fis, -10);
    mark('Ni62', 'Ni-62 (highest)', COL.hi, -10); mark('He4', 'He-4', COL.fus, -9); mark('H2', 'H-2', COL.fus, 16); mark('H3', 'H-3', COL.fus, -9);
    var m = function (kk) { return M[kk][0]; };
    var q1 = (m('U235') + m('n1') - m('Ba141') - m('Kr92') - 3 * m('n1')) * U_MEV;
    var q2 = (m('U235') + m('n1') - m('Pr141') - m('Zr92') - 3 * m('n1')) * U_MEV;
    var qf = (m('H2') + m('H3') - m('He4') - m('n1')) * U_MEV;
    var eKg = 1000 / m('U235') * 6.02214076e23 * 200 * 1.602176634e-13;
    var ty = y0 + gh + 50, sz = narrow ? 10 : 12, dy = narrow ? 17 : 19;
    txt((narrow ? 'U-235 + n → Ba-141 + Kr-92 + 3n: ' : 'U-235 + n → Ba-141 + Kr-92 + 3n: mass lost → ') + q1.toFixed(1) + ' MeV (calculated)', 16, ty, COL.fis, sz);
    txt((narrow ? '…after decay to Pr-141 + Zr-92: ' : '…after the fragments decay to stable Pr-141 + Zr-92: ') + q2.toFixed(1) + ' MeV in all', 16, ty + dy, COL.text, sz);
    txt('H-2 + H-3 → He-4 + n: ' + qf.toFixed(2) + ' MeV (calculated)', 16, ty + 2 * dy, COL.fus, sz);
    txt('1 kg of U-235 at 200 MeV per fission: ' + (eKg / 1e13).toFixed(1) + '×10¹³ J ≈ ' + (eKg / 4.184e12).toFixed(0) + ' kt of TNT', 16, ty + 3 * dy, COL.muted, sz);
  }

  function draw() { if (!ctx) return; ctx.clearRect(0, 0, W, H); if (mode === 'chain') drawChain(); else drawEnergy(); }

  function setStatus() {
    var el = document.getElementById('sim-status'); if (!el) return;
    if (mode === 'energy') { el.textContent = 'Heavy nuclei split and light nuclei fuse toward the peak of the curve; the mass lost in either direction is released as energy.'; return; }
    var r = rho();
    el.textContent = 'k = ' + k().toFixed(3) + ', reactivity ' + (r * 100).toFixed(3) + ' %. ' + (r <= 0 ? 'The chain does not grow.' : r < BETA ? 'Growing, but slowly enough to control because of delayed neutrons.' : 'Prompt critical: growth on the 0.1 ms scale of prompt neutrons.');
  }
  function syncP() {
    var s = document.getElementById('p-slider'), v = document.getElementById('p-val');
    if (s) s.setAttribute('aria-valuetext', (p * 100).toFixed(1) + ' percent, k = ' + k().toFixed(3));
    if (v) v.textContent = (p * 100).toFixed(1) + ' % (k = ' + k().toFixed(3) + ')';
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05); lastTs = ts;
    pulse += dt;
    if (mode === 'chain') {
      tSim += dt * T_RATE; if (tSim > T_CHART) tSim = 0;
      genAcc += dt;
      if (genAcc > GEN_DT) { genAcc = 0; var last = gens[gens.length - 1]; gens.push(last >= NMAX || last === 0 ? last : Math.min(NMAX, nextGen(last))); if (gens.length > 40) gens.shift(); }
    }
    draw(); rafId = requestAnimationFrame(loop);
  }
  function setBtn(pl) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = pl ? '⏸ Pause' : '▶ Play'; btn.dataset.state = pl ? 'playing' : 'paused'; }
    var d = document.querySelector('.sim-caption__dot'); if (d) d.classList.toggle('is-running', pl);
  }
  function start() {
    if (running) return;
    if (reducedMotion) { for (var i = 0; i < 8; i++) { var l = gens[gens.length - 1]; gens.push(Math.min(NMAX, nextGen(l))); } tSim = 60; draw(); return; }
    running = true; lastTs = null; setBtn(true); rafId = requestAnimationFrame(loop);
  }
  function pause() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; setBtn(false); }
  function reset() { pause(); gens = [N0]; genAcc = 0; tSim = 0; pulse = 0; setStatus(); draw(); }
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
    canvas.setAttribute('aria-label', 'Neutron generations of a chain reaction with the reactor power over time, or the binding energy per nucleon curve with fission and fusion marked');
    canvas.style.display = 'block'; mountEl.appendChild(canvas); ctx = canvas.getContext('2d');
    var ps = document.getElementById('p-slider');
    if (ps) ps.addEventListener('input', function () { p = parseFloat(ps.value); gens = [N0]; genAcc = 0; tSim = 0; syncP(); setStatus(); draw(); });
    var dtg = document.getElementById('delayed-toggle');
    if (dtg) dtg.addEventListener('click', function () {
      noDelayed = !noDelayed; dtg.setAttribute('aria-pressed', String(noDelayed));
      dtg.textContent = noDelayed ? 'Hide the no-delayed-neutron curve' : 'Compare: no delayed neutrons'; draw();
    });
    ['chain', 'energy'].forEach(function (kk) {
      var b = document.getElementById('mode-' + kk);
      if (b) b.addEventListener('click', function () {
        mode = kk;
        ['chain', 'energy'].forEach(function (q) { var e = document.getElementById('mode-' + q); if (e) e.setAttribute('aria-pressed', String(q === kk)); });
        var cc = document.getElementById('chain-controls'); if (cc) cc.style.display = kk === 'chain' ? 'contents' : 'none';
        setStatus(); draw();
      });
    });
    window.addEventListener('resize', onResize); onResize(); syncP(); setStatus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
