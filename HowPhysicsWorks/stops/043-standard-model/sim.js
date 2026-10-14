/* ============================================================
   sim.js — Stop 043: The Standard Model
   The 17 particles with PDG 2024 masses, charges and spins, the forces
   each one feels, and a log-scale mass axis. Switching a force off lists
   what that would remove from everyday physics.
   Quark masses are MS-bar values (u, d, s at 2 GeV; c, b at their own
   mass scale); the top mass is the direct-measurement average.
   Neutrinos: the summary bound m < 0.8 eV (tritium decay, 90 % CL).
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* id, symbol, name, mass in eV, mass text, charge, spin, forces, column, row, kind */
  var P = [
    ['u', 'u', 'up quark', 2.16e6, '2.16 ± 0.07 MeV', '+2/3', '1/2', 'SEWH', 0, 0, 'q'],
    ['c', 'c', 'charm quark', 1.2730e9, '1.2730 ± 0.0046 GeV', '+2/3', '1/2', 'SEWH', 1, 0, 'q'],
    ['t', 't', 'top quark', 172.57e9, '172.57 ± 0.29 GeV', '+2/3', '1/2', 'SEWH', 2, 0, 'q'],
    ['d', 'd', 'down quark', 4.70e6, '4.70 ± 0.07 MeV', '−1/3', '1/2', 'SEWH', 0, 1, 'q'],
    ['s', 's', 'strange quark', 93.5e6, '93.5 ± 0.8 MeV', '−1/3', '1/2', 'SEWH', 1, 1, 'q'],
    ['b', 'b', 'bottom quark', 4.183e9, '4.183 ± 0.007 GeV', '−1/3', '1/2', 'SEWH', 2, 1, 'q'],
    ['e', 'e', 'electron', 0.51099895e6, '0.51099895 MeV', '−1', '1/2', 'EWH', 0, 2, 'l'],
    ['mu', 'μ', 'muon', 105.6583755e6, '105.6583755 MeV', '−1', '1/2', 'EWH', 1, 2, 'l'],
    ['tau', 'τ', 'tau', 1776.93e6, '1776.93 ± 0.09 MeV', '−1', '1/2', 'EWH', 2, 2, 'l'],
    ['ve', 'νe', 'electron neutrino', 0.8, '< 0.8 eV (bound)', '0', '1/2', 'W', 0, 3, 'n'],
    ['vm', 'νμ', 'muon neutrino', 0.8, '< 0.8 eV (bound)', '0', '1/2', 'W', 1, 3, 'n'],
    ['vt', 'ντ', 'tau neutrino', 0.8, '< 0.8 eV (bound)', '0', '1/2', 'W', 2, 3, 'n'],
    ['g', 'g', 'gluon', 0, '0', '0', '1', 'S', 3, 0, 'b'],
    ['ph', 'γ', 'photon', 0, '0', '0', '1', 'E', 3, 1, 'b'],
    ['Z', 'Z', 'Z boson', 91.1880e9, '91.1880 ± 0.0020 GeV', '0', '1', 'WH', 3, 2, 'b'],
    ['W', 'W', 'W boson', 80.3692e9, '80.3692 ± 0.0133 GeV', '±1', '1', 'EWH', 3, 3, 'b'],
    ['H', 'H', 'Higgs boson', 125.20e9, '125.20 ± 0.11 GeV', '0', '0', 'WH', 4, 0, 'h']
  ];
  var FORCE = { S: ['strong', 'gluon'], E: ['electromagnetic', 'photon'], W: ['weak', 'W and Z'], H: ['Higgs', 'Higgs field'] };
  var LOSS = {
    S: 'Strong off: quarks no longer bind into protons and neutrons, so there are no nuclei.',
    E: 'Electromagnetism off: no light, and electrons are not held to nuclei, so no atoms or chemistry.',
    W: 'Weak off: no beta decay, and the Sun\'s first fusion step (two protons to deuterium) stops.',
    H: 'Higgs off: the electron and the other elementary fermions, and the W and Z, lose their mass terms. A proton would keep most of its mass, which is strong-interaction energy.'
  };
  var on = { S: true, E: true, W: true, H: true };
  var KIND = { q: 'oklch(0.72 0.15 300)', l: 'oklch(0.75 0.13 150)', n: 'oklch(0.75 0.10 170)', b: 'oklch(0.78 0.14 60)', h: 'oklch(0.85 0.15 95)' };
  var COL = { text: 'rgba(255,255,255,0.88)', muted: 'rgba(255,255,255,0.55)', faint: 'rgba(255,255,255,0.18)', off: 'rgba(255,255,255,0.22)' };

  var sel = 6, cycle = 0, pulse = 0, cells = [];

  function txt(s, x, y, col, size, align, bold) {
    ctx.fillStyle = col || COL.text; ctx.font = (bold ? '600 ' : '') + (size || 12) + 'px "DM Sans", sans-serif';
    ctx.textAlign = align || 'left'; ctx.fillText(s, x, y);
  }
  function shortMass(m) {
    var u = m >= 1e9 ? [1e9, ' GeV'] : m >= 1e6 ? [1e6, ' MeV'] : m >= 1e3 ? [1e3, ' keV'] : [1, ' eV'], v = m / u[0];
    return '≈ ' + (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(3)) + u[1];
  }
  function active(p) { for (var i = 0; i < p[7].length; i++) if (on[p[7][i]]) return true; return false; }
  function wrap(s, x, y, maxW, lh, col, size) {
    ctx.font = (size || 12) + 'px "DM Sans", sans-serif';
    var words = s.split(' '), line = '', yy = y;
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { txt(line, x, yy, col, size); line = words[i]; yy += lh; } else line = test;
    }
    if (line) txt(line, x, yy, col, size);
    return yy + lh;
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    var narrow = W < 560, pad = 12, cw = Math.min(92, (W - 2 * pad) / 5 - 6), ch = narrow ? 54 : 62, gx = (W - 5 * (cw + 6)) / 2, gy = 26;
    txt(narrow ? 'Quarks · leptons · bosons' : 'Generation I, II, III · force carriers · Higgs', W / 2, 16, COL.muted, 11, 'center');
    cells = [];
    P.forEach(function (p, i) {
      var x = gx + p[8] * (cw + 6), y = gy + p[9] * (ch + 6), live = active(p);
      cells.push([x, y, cw, ch]);
      ctx.fillStyle = live ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)'; ctx.fillRect(x, y, cw, ch);
      ctx.strokeStyle = i === sel ? 'rgba(255,255,255,' + (0.6 + 0.4 * Math.abs(Math.sin(pulse * 3))).toFixed(2) + ')' : live ? KIND[p[10]] : COL.off;
      ctx.lineWidth = i === sel ? 2.5 : 1.2; ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
      txt(p[1], x + cw / 2, y + ch / 2 + 2, live ? COL.text : COL.off, narrow ? 18 : 22, 'center', true);
      txt(p[5], x + cw - 4, y + 12, live ? COL.muted : COL.off, 9, 'right');
      var ml = p[4].replace(' (bound)', '').replace(/ ± [0-9.]+/, '');
      ctx.font = (narrow ? 8 : 9) + 'px "DM Sans", sans-serif';
      if (ctx.measureText(ml).width > cw - 6) ml = shortMass(p[3]);
      txt(ml, x + cw / 2, y + ch - 6, live ? COL.muted : COL.off, narrow ? 8 : 9, 'center');
    });
    var p = P[sel], iy = gy + 4 * (ch + 6) + 10, ix = pad + 4, iw = W - 2 * pad - 8;
    txt(p[2], ix, iy + 14, KIND[p[10]], narrow ? 15 : 17, 'left', true);
    txt('Mass ' + p[4] + ' · charge ' + p[5] + ' · spin ' + p[6], ix, iy + 34, COL.text, narrow ? 11 : 12);
    var fx = ix, fy = iy + 46;
    txt('Feels:', fx, fy + 13, COL.muted, 11); fx += 40;
    p[7].split('').forEach(function (f) {
      var label = FORCE[f][0], w = ctx.measureText(label).width + 16;
      ctx.strokeStyle = on[f] ? COL.text : COL.off; ctx.strokeRect(fx + 0.5, fy + 0.5, w, 18);
      txt(label, fx + 8, fy + 13, on[f] ? COL.text : COL.off, 11);
      fx += w + 6;
    });
    var ny = fy + 34;
    var offs = Object.keys(on).filter(function (k) { return !on[k]; });
    if (offs.length) offs.forEach(function (k) { ny = wrap(LOSS[k], ix, ny + 4, iw, 15, 'oklch(0.80 0.14 40)', 11); });
    /* log mass axis */
    var ay = H - 34, ax0 = pad + 10, ax1 = W - pad - 10, lo = -1, hi = 12;
    function X(m) { return ax0 + (Math.log10(m) - lo) / (hi - lo) * (ax1 - ax0); }
    ctx.strokeStyle = COL.faint; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax0, ay); ctx.lineTo(ax1, ay); ctx.stroke();
    ['1 eV', '1 keV', '1 MeV', '1 GeV', '1 TeV'].forEach(function (l, k) { var x = X(Math.pow(10, 3 * k)); ctx.beginPath(); ctx.moveTo(x, ay - 4); ctx.lineTo(x, ay + 4); ctx.stroke(); txt(l, x, ay + 16, COL.muted, 9, 'center'); });
    txt('Mass, log scale (massless photon and gluon not shown)', ax0, ay - 22, COL.muted, 10);
    P.forEach(function (q, i) {
      if (!q[3]) return;
      var x = X(q[3]), c = i === sel ? '#fff' : KIND[q[10]];
      ctx.fillStyle = c;
      if (q[10] === 'n') { ctx.beginPath(); ctx.moveTo(x, ay - 6); ctx.lineTo(x - 6, ay); ctx.lineTo(x, ay + 6); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(x, ay, i === sel ? 5 : 3.5, 0, 2 * Math.PI); ctx.fill(); }
    });
    if (p[3]) txt(p[1], X(p[3]), ay - 9, '#fff', 11, 'center', true);
  }

  function setStatus() {
    var el = document.getElementById('sim-status'); if (!el) return;
    var p = P[sel], f = p[7].split('').map(function (k) { return FORCE[k][0]; }).join(', ');
    var offs = Object.keys(on).filter(function (k) { return !on[k]; });
    el.textContent = p[2] + ': mass ' + p[4] + ', charge ' + p[5] + ', spin ' + p[6] + '. Feels ' + f + '.' + (offs.length ? ' ' + offs.map(function (k) { return LOSS[k]; }).join(' ') : '');
  }
  function select(i) {
    sel = i; var s = document.getElementById('particle-select'); if (s) s.value = String(i);
    setStatus(); draw();
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05); lastTs = ts;
    pulse += dt; cycle += dt;
    if (cycle > 2.5) { cycle = 0; select((sel + 1) % P.length); }
    draw(); rafId = requestAnimationFrame(loop);
  }
  function setBtn(pl) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = pl ? '⏸ Pause' : '▶ Play'; btn.dataset.state = pl ? 'playing' : 'paused'; }
    var d = document.querySelector('.sim-caption__dot'); if (d) d.classList.toggle('is-running', pl);
  }
  function start() {
    if (running) return;
    if (reducedMotion) { select((sel + 1) % P.length); return; }
    running = true; lastTs = null; setBtn(true); rafId = requestAnimationFrame(loop);
  }
  function pause() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; setBtn(false); }
  function reset() {
    pause(); cycle = 0; pulse = 0;
    Object.keys(on).forEach(function (k) { on[k] = true; var b = document.getElementById('toggle-' + k); if (b) { b.setAttribute('aria-pressed', 'true'); b.textContent = FORCE[k][0].charAt(0).toUpperCase() + FORCE[k][0].slice(1) + ': on'; } });
    select(6);
  }
  function destroy() { pause(); window.removeEventListener('resize', onResize); if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  function onResize() {
    if (!mountEl || !canvas) return;
    var dpr = window.devicePixelRatio || 1;
    W = Math.round(mountEl.getBoundingClientRect().width) || 680;
    H = W < 560 ? 560 : 520;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }

  function init() {
    mountEl = document.getElementById('sim-mount'); if (!mountEl) return;
    canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Table of the 17 Standard Model particles with the selected particle\'s mass, charge, spin and forces, and a log-scale mass axis');
    canvas.style.display = 'block'; canvas.style.cursor = 'pointer'; mountEl.appendChild(canvas); ctx = canvas.getContext('2d');
    canvas.addEventListener('click', function (ev) {
      var r = canvas.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
      for (var i = 0; i < cells.length; i++) { var c = cells[i]; if (x >= c[0] && x <= c[0] + c[2] && y >= c[1] && y <= c[1] + c[3]) { pause(); select(i); return; } }
    });
    var s = document.getElementById('particle-select');
    if (s) {
      P.forEach(function (p, i) { var o = document.createElement('option'); o.value = String(i); o.textContent = p[2]; s.appendChild(o); });
      s.value = String(sel);
      s.addEventListener('change', function () { pause(); select(parseInt(s.value, 10)); });
    }
    Object.keys(on).forEach(function (k) {
      var b = document.getElementById('toggle-' + k);
      if (b) b.addEventListener('click', function () {
        on[k] = !on[k]; b.setAttribute('aria-pressed', String(on[k]));
        b.textContent = FORCE[k][0].charAt(0).toUpperCase() + FORCE[k][0].slice(1) + (on[k] ? ': on' : ': off');
        setStatus(); draw();
      });
    });
    window.addEventListener('resize', onResize); onResize(); setStatus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
