/* ============================================================
   sim.js — Stop 039: Dirac and Antimatter
   Annihilation: e⁻ + e⁺ at rest → two photons of m_e c² each, back to back.
   Pair production: γ → e⁻ e⁺ needs E_γ ≥ 2 m_e c² and a nucleus to take up
   momentum: a free photon carries p = E/c, but a pair of total energy E can
   carry at most √(E² − (2 m_e c²)²)/c. The kinetic energy is shown split
   equally (display choice; the real split varies).
   Cloud chamber: r = p/(|q| B); r[m] = p[GeV/c] / (0.2998 B[T]).
   Field strength and the momentum lost in the plate are illustrative.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var MEC2 = 0.51099895069;          /* MeV, CODATA 2022 */
  var B_T = 1.5, PLATE_KEEP = 0.4;   /* illustrative */

  var mode = 'annihilate', t = 0, eGamma = 2.0, nucleus = true, charge = 1, pMeV = 60, axis = 0.6;

  var COL = { era: 'oklch(0.68 0.20 310)', em: 'oklch(0.78 0.14 200)', ep: 'oklch(0.75 0.18 25)', ph: 'oklch(0.88 0.15 95)', text: 'rgba(255,255,255,0.88)', muted: 'rgba(255,255,255,0.55)', faint: 'rgba(255,255,255,0.18)' };

  function txt(s, x, y, col, size, align) {
    ctx.fillStyle = col || COL.text; ctx.font = (size || 12) + 'px "DM Sans", sans-serif';
    ctx.textAlign = align || 'left'; ctx.fillText(s, x, y);
  }
  function dot(x, y, r, col, label) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill();
    if (label) txt(label, x, y - r - 6, col, 12, 'center');
  }
  function wave(x0, y0, x1, y1, col, ph) {
    var L = Math.hypot(x1 - x0, y1 - y0); if (L < 2) return;
    var ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
    for (var s = 0; s <= L; s += 2) { var a = Math.sin(s / 5 - ph) * 5, x = x0 + ux * s - uy * a, y = y0 + uy * s + ux * a; if (s) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
  }
  function bars(x, y, w, items, total, title) {
    txt(title, x, y - 8, COL.muted, 11);
    var cx = x;
    items.forEach(function (it) {
      var bw = it[1] / total * w;
      ctx.fillStyle = it[2]; ctx.fillRect(cx, y, Math.max(0, bw - 1), 18);
      if (bw > 60) txt(it[0], cx + 4, y + 13, 'rgba(0,0,0,0.85)', 11);
      cx += bw;
    });
  }

  function drawAnnihilate() {
    var cy = H * 0.42, cx = W / 2, T = 4, ph = t % T, r = Math.min(W * 0.4, 260);
    txt('Electron and positron, nearly at rest, annihilate', 16, 22, COL.text, 14);
    if (ph < 1.5) {
      var d = (1 - ph / 1.5) * r * 0.5 + 8;
      dot(cx - d, cy, 7, COL.em, 'e⁻'); dot(cx + d, cy, 7, COL.ep, 'e⁺');
    } else {
      var s = (ph - 1.5) / (T - 1.5) * r, ax = Math.cos(axis), ay = Math.sin(axis);
      if (ph < 1.7) { ctx.fillStyle = 'rgba(255,255,255,' + (1 - (ph - 1.5) / 0.2).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 2 * Math.PI); ctx.fill(); }
      wave(cx, cy, cx + ax * s, cy + ay * s, COL.ph, t * 8); wave(cx, cy, cx - ax * s, cy - ay * s, COL.ph, t * 8);
      txt(MEC2 * 1000 > 0 ? (MEC2 * 1000).toFixed(3) + ' keV' : '', cx + ax * s, cy + ay * s - 10, COL.ph, 12, 'center');
      txt((MEC2 * 1000).toFixed(3) + ' keV', cx - ax * s, cy - ay * s - 10, COL.ph, 12, 'center');
    }
    var bw = Math.min(W - 32, 520), bx = (W - bw) / 2, by = H - 120;
    bars(bx, by, bw, [['e⁻ rest energy', MEC2, COL.em], ['e⁺ rest energy', MEC2, COL.ep]], 2 * MEC2, 'Before: 2 × m_e c² = ' + (2 * MEC2 * 1000).toFixed(3) + ' keV');
    bars(bx, by + 50, bw, [['photon 1', MEC2, COL.ph], ['photon 2', MEC2, 'oklch(0.80 0.12 80)']], 2 * MEC2, W < 560 ? 'After: two photons, back to back' : 'After: two photons of m_e c² each, back to back (momentum stays zero)');
  }

  function drawPair() {
    var cy = H * 0.36, nx = W * 0.5, T = 4, ph = t % T, thr = 2 * MEC2, ok = eGamma >= thr && nucleus;
    txt('A photon of ' + eGamma.toFixed(2) + ' MeV ' + (nucleus ? 'passes a nucleus' : 'in empty space'), 16, 22, COL.text, 14);
    if (nucleus) { dot(nx, cy + 26, 9, 'rgba(255,255,255,0.5)'); txt('nucleus', nx, cy + 52, COL.muted, 11, 'center'); }
    var x0 = 16, f = ph / T;
    if (!ok || f < 0.45) {
      var xe = ok ? x0 + (nx - x0) * (f / 0.45) : x0 + (W - 32) * f;
      wave(x0, cy, xe, cy, COL.ph, t * 10);
    } else {
      var g = (f - 0.45) / 0.55, L = (W - nx - 30) * g, ang = 0.35 + 0.25 / (1 + eGamma);
      dot(nx + L * Math.cos(ang), cy - L * Math.sin(ang), 6, COL.em, 'e⁻');
      dot(nx + L * Math.cos(ang), cy + L * Math.sin(ang), 6, COL.ep, 'e⁺');
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(nx, cy); ctx.lineTo(nx + L * Math.cos(ang), cy - L * Math.sin(ang)); ctx.moveTo(nx, cy); ctx.lineTo(nx + L * Math.cos(ang), cy + L * Math.sin(ang)); ctx.stroke();
    }
    var bw = Math.min(W - 32, 520), bx = (W - bw) / 2, by = H - 150, total = Math.max(eGamma, thr);
    if (ok) {
      var ke = (eGamma - thr) / 2;
      bars(bx, by, bw, [['2 m_e c²', thr, COL.era], ['KE e⁻', ke, COL.em], ['KE e⁺', ke, COL.ep]], total, 'E_γ = 2 m_e c² + kinetic energies (split shown equally)');
    } else {
      bars(bx, by, bw, [['photon', eGamma, COL.ph]], total, 'E_γ = ' + eGamma.toFixed(2) + ' MeV; threshold 2 m_e c² = ' + (thr * 1000).toFixed(1) + ' keV');
    }
    var msg = eGamma < thr ? 'Below threshold: not enough energy to make two electron masses.'
      : !nucleus ? 'Above threshold, but no pair: a photon alone cannot conserve energy and momentum.'
      : 'Pair made. The nucleus takes up at least ' + (eGamma - Math.sqrt(eGamma * eGamma - thr * thr)).toFixed(3) + ' MeV/c of momentum.';
    txt(msg, 16, by + 54, COL.text, W < 560 ? 11 : 12);
    if (eGamma >= thr) txt('Photon momentum ' + eGamma.toFixed(2) + ' MeV/c; most a pair of this energy can carry: ' + Math.sqrt(eGamma * eGamma - thr * thr).toFixed(3) + ' MeV/c', 16, by + 74, COL.muted, W < 560 ? 10 : 11);
  }

  function radiusM(p) { return p / 1000 / (0.2998 * B_T); }

  function drawChamber() {
    var narrow = W < 560, ch = Math.min(H - 110, narrow ? 360 : 360), cw = narrow ? W - 32 : Math.min(W * 0.55, 420), x0 = 16, y0 = 34;
    var scale = ch / 0.3;   /* chamber drawn 30 cm tall */
    txt('Cloud chamber, field into the page (B = ' + B_T + ' T, illustrative)', 16, 20, COL.text, narrow ? 11 : 14);
    ctx.strokeStyle = COL.faint; ctx.strokeRect(x0 + 0.5, y0 + 0.5, cw, ch);
    for (var gx = 0; gx < 5; gx++) for (var gy = 0; gy < 6; gy++) txt('×', x0 + cw * (gx + 0.5) / 5, y0 + ch * (gy + 0.5) / 6 + 4, 'rgba(255,255,255,0.12)', 12, 'center');
    var plateY = y0 + ch / 2;
    ctx.fillStyle = 'rgba(200,200,210,0.6)'; ctx.fillRect(x0, plateY - 4, cw, 8);
    txt('6 mm lead plate', x0 + cw - 4, plateY - 8, COL.muted, 11, 'right');
    /* particle enters at the bottom moving up; positive bends left (F = q v × B) */
    var p1 = pMeV, p2 = pMeV * PLATE_KEEP, r1 = radiusM(p1) * scale, r2 = radiusM(p2) * scale;
    var sgn = charge > 0 ? -1 : 1;
    var prog = Math.min(1, (t % 5) / 3.5), sx = x0 + cw / 2, sy = y0 + ch;
    ctx.strokeStyle = charge > 0 ? COL.ep : COL.em; ctx.lineWidth = 2.5; ctx.beginPath();
    var pts = [], x = sx, y = sy, th = -Math.PI / 2, ds = 1.5, crossed = false;
    for (var k = 0; k < 900; k++) {
      var r = crossed ? r2 : r1;
      th += sgn * ds / r; x += Math.cos(th) * ds; y += Math.sin(th) * ds;
      if (!crossed && y <= plateY) crossed = true;
      if (y < y0 || x < x0 || x > x0 + cw || y > y0 + ch) break;
      pts.push([x, y]);
    }
    var nShow = Math.floor(pts.length * prog);
    ctx.moveTo(sx, sy);
    for (k = 0; k < nShow; k++) ctx.lineTo(pts[k][0], pts[k][1]);
    ctx.stroke();
    var tx = narrow ? 16 : x0 + cw + 24, ty = narrow ? y0 + ch + 24 : 60, sz = narrow ? 11 : 12;
    var lines = [
      'Below the plate: p = ' + p1 + ' MeV/c, r = ' + (radiusM(p1) * 100).toFixed(1) + ' cm',
      'Above the plate: p = ' + p2.toFixed(0) + ' MeV/c, r = ' + (radiusM(p2) * 100).toFixed(1) + ' cm',
      'Tighter curl above → it slowed there → it moved up.',
      'Moving up and bending ' + (charge > 0 ? 'left' : 'right') + ' in this field → charge ' + (charge > 0 ? 'positive' : 'negative') + '.',
      'Light enough to curl this much: an electron mass, not a proton.'
    ];
    lines.forEach(function (s, i) { txt(s, tx, ty + i * (narrow ? 16 : 22), i < 2 ? COL.text : COL.muted, sz); });
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (mode === 'annihilate') drawAnnihilate(); else if (mode === 'pair') drawPair(); else drawChamber();
  }

  function setStatus() {
    var el = document.getElementById('sim-status'); if (!el) return;
    if (mode === 'annihilate') el.textContent = 'Annihilation at rest: 2 × ' + (MEC2 * 1000).toFixed(3) + ' keV of rest energy becomes two photons of ' + (MEC2 * 1000).toFixed(3) + ' keV, back to back.';
    else if (mode === 'pair') el.textContent = eGamma < 2 * MEC2 ? 'Photon below the ' + (2 * MEC2).toFixed(3) + ' MeV threshold: no pair.' : nucleus ? 'Photon of ' + eGamma.toFixed(2) + ' MeV near a nucleus: an electron–positron pair with ' + (eGamma - 2 * MEC2).toFixed(3) + ' MeV of kinetic energy between them.' : 'No nucleus: the photon cannot make a pair, because energy and momentum cannot both be conserved.';
    else el.textContent = 'Track of a ' + (charge > 0 ? 'positive' : 'negative') + ' particle of ' + pMeV + ' MeV/c: radius ' + (radiusM(pMeV) * 100).toFixed(1) + ' cm below the plate, ' + (radiusM(pMeV * PLATE_KEEP) * 100).toFixed(1) + ' cm above.';
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05); lastTs = ts;
    var before = Math.floor(t / 4); t += dt;
    if (mode === 'annihilate' && Math.floor(t / 4) !== before) axis = Math.random() * Math.PI;
    draw(); rafId = requestAnimationFrame(loop);
  }
  function setBtn(p) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = p ? '⏸ Pause' : '▶ Play'; btn.dataset.state = p ? 'playing' : 'paused'; }
    var d = document.querySelector('.sim-caption__dot'); if (d) d.classList.toggle('is-running', p);
  }
  function start() {
    if (running) return;
    if (reducedMotion) { t = mode === 'chamber' ? 4 : 3.2; draw(); return; }
    running = true; lastTs = null; setBtn(true); rafId = requestAnimationFrame(loop);
  }
  function pause() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; setBtn(false); }
  function reset() { pause(); t = 0; axis = 0.6; setStatus(); draw(); }
  function destroy() { pause(); window.removeEventListener('resize', onResize); if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

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
    canvas.setAttribute('aria-label', 'Electron–positron annihilation, pair production near a nucleus, and a curved particle track in a cloud chamber');
    canvas.style.display = 'block'; mountEl.appendChild(canvas); ctx = canvas.getContext('2d');
    var groups = { annihilate: null, pair: 'pair-controls', chamber: 'chamber-controls' };
    ['annihilate', 'pair', 'chamber'].forEach(function (k) {
      var b = document.getElementById('mode-' + k);
      if (b) b.addEventListener('click', function () {
        mode = k; t = 0;
        ['annihilate', 'pair', 'chamber'].forEach(function (q) {
          var e = document.getElementById('mode-' + q); if (e) e.setAttribute('aria-pressed', String(q === k));
          if (groups[q]) { var g = document.getElementById(groups[q]); if (g) g.style.display = q === k ? 'contents' : 'none'; }
        });
        setStatus(); draw();
      });
    });
    var es = document.getElementById('egamma-slider');
    if (es) es.addEventListener('input', function () {
      eGamma = parseFloat(es.value); document.getElementById('egamma-val').textContent = eGamma.toFixed(2) + ' MeV';
      es.setAttribute('aria-valuetext', eGamma.toFixed(2) + ' megaelectronvolts'); t = 0; setStatus(); draw();
    });
    var nt = document.getElementById('nucleus-toggle');
    if (nt) nt.addEventListener('click', function () {
      nucleus = !nucleus; nt.setAttribute('aria-pressed', String(nucleus));
      nt.textContent = nucleus ? 'Nucleus nearby: yes' : 'Nucleus nearby: no'; t = 0; setStatus(); draw();
    });
    var ps = document.getElementById('p-slider');
    if (ps) ps.addEventListener('input', function () {
      pMeV = parseFloat(ps.value); document.getElementById('p-val').textContent = pMeV + ' MeV/c';
      ps.setAttribute('aria-valuetext', pMeV + ' MeV per c'); setStatus(); draw();
    });
    var ct = document.getElementById('charge-toggle');
    if (ct) ct.addEventListener('click', function () {
      charge = -charge; ct.setAttribute('aria-pressed', String(charge < 0));
      ct.textContent = charge > 0 ? 'Charge: positive' : 'Charge: negative'; setStatus(); draw();
    });
    window.addEventListener('resize', onResize); onResize(); setStatus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
