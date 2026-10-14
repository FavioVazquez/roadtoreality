/* ============================================================
   sim.js — Stop 050: The Open Questions
   A board of six gauges, each built only from cited numbers:
     h0  the Hubble tension: two Gaussians, separation in sigma
     dm  dark matter: the cosmic budget from Planck 2018 Table 2
     de  dark energy: best-fit w(z) from DESI DR2 combinations
     qg  quantum gravity: the length scale probed, hbar c / E
     ba  matter-antimatter: baryons per photon
     nu  neutrino masses: oscillation floor vs upper bounds
   Play tours the board; choosing a card stops the tour.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ORDER = ['h0', 'dm', 'de', 'qg', 'ba', 'nu'];
  var TOUR_SECS = 9;
  var q = 'h0', tourT = 0, intro = 1;   /* intro: 0..1 easing of the current gauge */

  /* ── Cited numbers ─────────────────────────────────────── */
  var PLANCK_H0 = { v: 67.4, e: 0.5, label: 'Planck 2018 (CMB + ΛCDM)' };          /* Planck 2018 VI abstract */
  var LOCAL = {
    shoes: { v: 73.04, e: 1.04, label: 'SH0ES 2022 (Cepheids + SNe Ia)' },            /* Riess et al. 2022 */
    cchp:  { v: 70.39, e: Math.sqrt(1.22 * 1.22 + 1.33 * 1.33 + 0.70 * 0.70), label: 'CCHP 2025 (TRGB + SNe Ia)' } /* Freedman et al. 2025; terms added in quadrature here */
  };
  var localKey = 'shoes', hypo = null;      /* hypothetical local value, or null */

  /* Planck 2018 VI, Table 2 (TT,TE,EE+lowE+lensing) */
  var OBH2 = 0.02237, OCH2 = 0.1200, PL_h = 0.6736, PL_OL = 0.6847;

  /* DESI DR2 (PRD 112, 083515), eqs. 25-28 and Table VI */
  var DESI = {
    cmb:   { w0: -0.42,  wa: -1.75, sig: 3.1, label: 'DESI + CMB' },
    pplus: { w0: -0.838, wa: -0.62, sig: 2.8, label: '+ Pantheon+' },
    union: { w0: -0.667, wa: -1.09, sig: 3.8, label: '+ Union3' },
    desy5: { w0: -0.752, wa: -0.86, sig: 4.2, label: '+ DES-SN5YR' }
  };
  var deKey = 'pplus';

  /* CODATA 2022 (NIST) */
  var HBARC_MEV_FM = 197.3269804, E_PLANCK_GEV = 1.220890e19, L_PLANCK = 1.616255e-35, R_PROTON = 0.84075e-15;
  var E_LHC_GEV = 13600;                    /* CERN, LHC Run 3, 13.6 TeV */
  var logE = Math.log(E_LHC_GEV) / Math.LN10;

  /* PDG 2024 BBN review: eta from Planck Omega_b h^2 */
  var ETA = 6.12e-10, ETA_E = 0.04e-10;
  var logN = 9;

  /* Neutrinos: PDG 2024 Table 14.7 (NuFIT 5.2 column), eV^2 */
  var DM21 = 7.41e-5, DM32_NO = 2.437e-3, DM32_IO = 2.498e-3;
  var SUM_NO = Math.sqrt(DM21) + Math.sqrt(DM32_NO + DM21);
  var SUM_IO = Math.sqrt(DM32_IO) + Math.sqrt(DM32_IO - DM21);
  var KATRIN = 0.45;                         /* m_beta < 0.45 eV, 90 % CL */
  var COSMO = { lcdm: 0.064, w0wa: 0.163 };  /* DESI DR2 + CMB, 95 % */
  var ordering = 'NO', cosmoKey = 'lcdm';

  var COL = {
    era:   'oklch(0.68 0.22 20)',
    gold:  'oklch(0.78 0.14 82)',
    blue:  'oklch(0.75 0.12 250)',
    green: 'oklch(0.72 0.15 150)',
    text:  'oklch(0.92 0 0)',
    muted: 'oklch(0.62 0 0)',
    dim:   'oklch(0.45 0 0)',
    faint: 'oklch(1 0 0 / 0.10)',
    grid:  'oklch(1 0 0 / 0.06)'
  };

  var TITLES = {
    h0: 'How fast is the universe expanding?',
    dm: 'What is dark matter?',
    de: 'Is dark energy constant?',
    qg: 'How does gravity work at the smallest scales?',
    ba: 'Why is there more matter than antimatter?',
    nu: 'How heavy are neutrinos?'
  };
  var SETTLE = {
    h0: 'What would settle it: independent distance ladders (red giants, other stars, masers) and standard sirens from gravitational waves, which need no ladder at all.',
    dm: 'What would settle it: a signal in a direct-detection experiment, at a collider, or in an axion search that matches the cosmological abundance.',
    de: 'What would settle it: more BAO and supernova data with one uniform calibration, from DESI\'s full survey and from the Rubin, Euclid and Roman surveys.',
    qg: 'What would settle it: an effect of quantum gravity that reaches observable scales, for example in the early universe or in black-hole physics. None has been seen.',
    ba: 'What would settle it: CP violation beyond the Standard Model, for example in neutrino oscillations, combined with a mechanism that works in the early universe.',
    nu: 'What would settle it: an absolute mass from tritium decay or cosmology, the mass ordering from oscillation experiments, and neutrinoless double-beta decay.'
  };

  /* ── Helpers ───────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function ease(x) { return reducedMotion ? 1 : 1 - Math.pow(1 - Math.min(1, x), 3); }
  function font(px, w) { ctx.font = (w || '') + ' ' + px + 'px "DM Sans", sans-serif'; }
  function sup(n) {
    var S = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(n).split('').map(function (c) { return S[c] || c; }).join('');
  }
  function sci(v, d) {
    var e = Math.floor(Math.log(Math.abs(v)) / Math.LN10), m = v / Math.pow(10, e);
    if (m >= 9.995) { m /= 10; e += 1; }
    return m.toFixed(d === undefined ? 1 : d) + ' × 10' + sup(e);
  }
  function minus(s) { return String(s).replace(/-/g, '−'); }
  function wrap(text, x, y, maxW, lh) {
    var words = text.split(' '), line = '', n = 0;
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y + n * lh); n++; line = words[i]; }
      else line = test;
    }
    if (line) { ctx.fillText(line, x, y + n * lh); n++; }
    return n;
  }
  function header(big, small) {
    var narrow = W < 520;
    ctx.textAlign = 'left';
    font(narrow ? 15 : 17, '500'); ctx.fillStyle = COL.text;
    var n = wrap(TITLES[q], 16, 26, W - 32, narrow ? 19 : 21);
    var y = 26 + n * (narrow ? 19 : 21) + 6;
    font(narrow ? 26 : 32, '600'); ctx.fillStyle = COL.era;
    ctx.fillText(big, 16, y + (narrow ? 20 : 24));
    font(narrow ? 11 : 12); ctx.fillStyle = COL.muted;
    var m = wrap(small, 16, y + (narrow ? 40 : 48), W - 32, 15);
    return y + (narrow ? 40 : 48) + m * 15 + 8;
  }

  /* ── Gauges ────────────────────────────────────────────── */
  function sigmaSep(a, b) { return Math.abs(a.v - b.v) / Math.sqrt(a.e * a.e + b.e * b.e); }
  function localNow() {
    var L = LOCAL[localKey];
    return hypo === null ? L : { v: hypo, e: L.e, label: 'Hypothetical: ' + hypo.toFixed(1) + ' ± ' + L.e.toFixed(2) };
  }

  function drawH0() {
    var Lm = localNow(), s = sigmaSep(PLANCK_H0, Lm);
    var top = header(s.toFixed(1) + 'σ apart', 'Separation = |difference| / √(σ₁² + σ₂²), computed live from the two published values' + (hypo === null ? '.' : ' (local value moved by you).'));
    var x0 = 30, x1 = W - 20, y1 = H - 40, y0 = top + 10;
    var lo = 62, hi = 80;
    var sx = function (v) { return x0 + (v - lo) / (hi - lo) * (x1 - x0); };
    ctx.strokeStyle = COL.faint; ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
    font(11); ctx.fillStyle = COL.muted; ctx.textAlign = 'center';
    for (var v = 62; v <= 80; v += 2) { ctx.fillText(v, sx(v), y1 + 14); ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.moveTo(sx(v), y0); ctx.lineTo(sx(v), y1); ctx.stroke(); }
    ctx.fillText('H₀ (km/s/Mpc)', (x0 + x1) / 2, y1 + 30);
    var k = ease(intro);
    function gauss(m, col, label, above) {
      var peak = 1 / m.e, scale = (y1 - y0 - 30) / (1 / 0.5) * k;
      ctx.beginPath();
      for (var i = 0; i <= 300; i++) {
        var x = lo + (hi - lo) * i / 300, g = Math.exp(-0.5 * Math.pow((x - m.v) / m.e, 2)) / m.e;
        var px = sx(x), py = y1 - g * scale;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      ctx.globalAlpha = 0.15; ctx.lineTo(sx(hi), y1); ctx.lineTo(sx(lo), y1); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
      font(W < 520 ? 10.5 : 11.5); ctx.fillStyle = col;
      var ly = y1 - peak * scale - 8;
      ctx.textAlign = m.v < (lo + hi) / 2 ? 'left' : 'right';
      var lx = m.v < (lo + hi) / 2 ? sx(m.v) - 6 : Math.min(x1, sx(m.v) + (W < 520 ? 60 : 6));
      ctx.fillText(m.v.toFixed(2) + ' ± ' + m.e.toFixed(2), lx, ly);
      ctx.fillText(W < 520 ? label.replace(/ \(.*\)$/, '') : label, lx, ly - 14);
    }
    gauss(PLANCK_H0, COL.gold, PLANCK_H0.label);
    gauss(Lm, COL.blue, Lm.label);
  }

  function drawDM() {
    var fDark = OCH2 / (OCH2 + OBH2);
    var top = header(Math.round(fDark * 100) + ' % of matter is dark', 'From Planck 2018: Ωc h² = 0.1200, Ωb h² = 0.02237 (shares computed here). No particle has been detected.');
    var x0 = 16, x1 = W - 16, bh = W < 520 ? 34 : 40, k = ease(intro);
    var h2 = PL_h * PL_h, oc = OCH2 / h2, ob = OBH2 / h2;
    function bar(y, parts, title) {
      font(11); ctx.fillStyle = COL.muted; ctx.textAlign = 'left'; ctx.fillText(title, x0, y - 6);
      var x = x0, tot = 0, i;
      for (i = 0; i < parts.length; i++) tot += parts[i][0];
      for (i = 0; i < parts.length; i++) {
        var w = (x1 - x0) * parts[i][0] / tot * k;
        ctx.fillStyle = parts[i][2]; ctx.fillRect(x, y, w, bh);
        font(W < 520 ? 10.5 : 12, '500');
        if (ctx.measureText(parts[i][1]).width + 12 < w) {
          ctx.fillStyle = 'oklch(0.12 0 0)'; ctx.textAlign = 'left';
          ctx.fillText(parts[i][1], x + 6, y + bh / 2 + 4);
        }
        x += w;
      }
    }
    var y = top + 22;
    bar(y, [[OCH2, 'dark ' + (fDark * 100).toFixed(1) + ' %', COL.blue], [OBH2, 'atoms ' + ((1 - fDark) * 100).toFixed(1) + ' %', COL.gold]], 'All matter');
    y += bh + 40;
    bar(y, [[PL_OL, 'dark energy ' + (PL_OL * 100).toFixed(1) + ' %', COL.era], [oc, 'dark matter ' + (oc * 100).toFixed(1) + ' %', COL.blue], [ob, (ob * 100).toFixed(1) + ' %', COL.gold]], 'Energy budget today (Ωc, Ωb from h = 0.6736; ΩΛ = 0.6847)');
    y += bh + 30;
    font(W < 520 ? 11 : 12); ctx.fillStyle = COL.text; ctx.textAlign = 'left';
    wrap('Direct search, LZ (2025): no excess over background. Spin-independent WIMP–nucleon cross-section below 2.2 × 10⁻⁴⁸ cm² at 40 GeV (90 % confidence).', x0, y, x1 - x0, 16);
  }

  function drawDE() {
    var d = DESI[deKey];
    var top = header(d.sig.toFixed(1) + 'σ preference', d.label + ': w₀ = ' + minus(d.w0) + ', wₐ = ' + minus(d.wa) + ' (best fit). The preference over a constant (w = −1) depends on the supernova sample.');
    var x0 = 46, x1 = W - 16, y0 = top + 6, y1 = H - 40;
    var zmax = 2.5, lo = -2, hi = 0;
    var sx = function (z) { return x0 + z / zmax * (x1 - x0); }, sy = function (w) { return y1 - (w - lo) / (hi - lo) * (y1 - y0); };
    font(11); ctx.fillStyle = COL.muted; ctx.textAlign = 'right';
    for (var w = -2; w <= 0.001; w += 0.5) { ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.moveTo(x0, sy(w)); ctx.lineTo(x1, sy(w)); ctx.stroke(); ctx.fillText(minus(w.toFixed(1)), x0 - 5, sy(w) + 3.5); }
    ctx.textAlign = 'center';
    for (var z = 0; z <= zmax + 1e-9; z += 0.5) ctx.fillText(z.toFixed(1), sx(z), y1 + 14);
    ctx.fillText('Redshift z (looking back in time →)', (x0 + x1) / 2, y1 + 30);
    ctx.save(); ctx.translate(12, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('w', 0, 0); ctx.restore();
    ctx.strokeStyle = COL.gold; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(sx(0), sy(-1)); ctx.lineTo(sx(zmax), sy(-1)); ctx.stroke(); ctx.setLineDash([]);
    font(11); ctx.fillStyle = COL.gold; ctx.textAlign = 'right'; ctx.fillText('cosmological constant, w = −1', x1 - 4, sy(-1) - 6);
    var k = ease(intro);
    Object.keys(DESI).forEach(function (key) {
      var m = DESI[key], sel = key === deKey;
      ctx.strokeStyle = sel ? COL.era : COL.dim; ctx.lineWidth = sel ? 2.4 : 1.2;
      ctx.beginPath();
      for (var i = 0; i <= 200 * k; i++) {
        var zz = zmax * i / 200, ww = m.w0 + m.wa * zz / (1 + zz);
        var Y = sy(Math.max(lo, Math.min(hi, ww)));
        if (i === 0) ctx.moveTo(sx(zz), Y); else ctx.lineTo(sx(zz), Y);
      }
      ctx.stroke();
    });
    font(10.5); ctx.fillStyle = COL.muted; ctx.textAlign = 'left';
    wrap('Red: selected combination; grey: the other three. Best-fit curves only: w₀ and wₐ are strongly correlated, so no error band is drawn.', x0 + 4, y0 + 14, x1 - x0 - 8, 13);
  }

  function drawQG() {
    var E = Math.pow(10, logE), L = HBARC_MEV_FM * 1e-15 / (E * 1e3);
    var top = header(sci(E_PLANCK_GEV / E_LHC_GEV, 0) + ' × the LHC', 'Energy needed to probe the Planck length, 1.6 × 10⁻³⁵ m, compared with the LHC\'s 13.6 TeV collisions (ratio computed here).');
    var x0 = 20, x1 = W - 20, y = top + 50;
    var lmin = -36, lmax = -14;
    var sx = function (l) { return x0 + (lmax - l) / (lmax - lmin) * (x1 - x0); };
    ctx.strokeStyle = COL.faint; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    font(10.5); ctx.fillStyle = COL.muted; ctx.textAlign = 'center';
    for (var e = -14; e >= -36; e -= (W < 520 ? 4 : 2)) { ctx.fillText('10' + sup(e), sx(e), y + 18); ctx.beginPath(); ctx.moveTo(sx(e), y - 4); ctx.lineTo(sx(e), y + 4); ctx.strokeStyle = COL.faint; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.fillText('length (m)', (x0 + x1) / 2, y + 34);
    function mark(l, col, label, up) {
      var X = sx(Math.log(l) / Math.LN10);
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X, y, 5, 0, 2 * Math.PI); ctx.fill();
      font(W < 520 ? 10 : 11); ctx.textAlign = X > W * 0.7 ? 'right' : (X < W * 0.3 ? 'left' : 'center');
      ctx.fillText(label, X, up ? y - 12 : y + 52);
    }
    mark(2 * R_PROTON, COL.gold, 'proton', true);
    mark(HBARC_MEV_FM * 1e-15 / (E_LHC_GEV * 1e3), COL.blue, 'LHC, 13.6 TeV', false);
    mark(L_PLANCK, COL.era, 'Planck length', true);
    var X = sx(Math.log(L) / Math.LN10);
    ctx.strokeStyle = COL.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X, y - 26); ctx.lineTo(X, y + 26); ctx.stroke();
    font(W < 520 ? 12 : 13, '500'); ctx.fillStyle = COL.text; ctx.textAlign = 'left';
    var ty = y + 80;
    ctx.fillText('Your energy: ' + sci(E, 2) + ' GeV  →  ħc/E = ' + sci(L, 2) + ' m', 16, ty);
    font(11); ctx.fillStyle = COL.muted;
    wrap('ħc/E is a rough resolution, not a sharp limit; real collisions share the energy among quarks and gluons.', 16, ty + 18, W - 32, 15);
  }

  function drawBA() {
    var N = Math.pow(10, logN), nb = ETA * N;
    var top = header('η = ' + (ETA * 1e10).toFixed(2) + ' × 10⁻¹⁰', 'Baryons per photon in the microwave background (PDG 2024, from Planck). Almost no antimatter is left.');
    var x0 = 20, x1 = W - 20, y = top + 46;
    var lo = 3, hi = 12;
    var sx = function (l) { return x0 + (l - lo) / (hi - lo) * (x1 - x0); };
    ctx.strokeStyle = COL.faint; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    font(10.5); ctx.fillStyle = COL.muted; ctx.textAlign = 'center';
    for (var e = lo; e <= hi; e += (W < 520 ? 2 : 1)) ctx.fillText('10' + sup(e), sx(e), y + 18);
    ctx.fillText('photons counted', (x0 + x1) / 2, y + 34);
    var one = Math.log(1 / ETA) / Math.LN10;
    ctx.fillStyle = COL.gold; ctx.beginPath(); ctx.arc(sx(one), y, 5, 0, 2 * Math.PI); ctx.fill();
    font(11); ctx.textAlign = 'center'; ctx.fillText('1 baryon per ' + sci(1 / ETA, 2) + ' photons', sx(one), y - 12);
    var X = sx(logN);
    ctx.strokeStyle = COL.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X, y - 8); ctx.lineTo(X, y + 8); ctx.stroke();
    font(W < 520 ? 12 : 13, '500'); ctx.fillStyle = COL.text; ctx.textAlign = 'left';
    var ty = y + 72;
    ctx.fillText(sci(N, 1) + ' photons  →  about ' + (nb >= 10 ? Math.round(nb).toLocaleString('en-US') : nb.toPrecision(2)) + ' baryons', 16, ty);
    font(11); ctx.fillStyle = COL.muted;
    wrap('Today: about 411 photons per cubic centimetre at 2.725 K, and about 0.25 protons or neutrons per cubic metre (both computed here). Had matter and antimatter been exactly equal, they would have annihilated almost completely; this small excess is what remains.', 16, ty + 18, W - 32, 15);
  }

  function drawNU() {
    var floor = ordering === 'NO' ? SUM_NO : SUM_IO, cap = COSMO[cosmoKey];
    var open = cap > floor;
    var top = header(open ? (floor.toFixed(3) + '–' + cap.toFixed(3) + ' eV') : 'No window left', open ? 'Allowed range of the sum of the three masses for these choices: oscillation floor (computed from PDG Δm²) to the DESI + CMB bound.' : 'The cosmological bound is below the floor for this ordering: inverted ordering is disfavoured if this cosmological model holds.');
    var x0 = 20, x1 = W - 20, y = top + 56;
    var lo = -2, hi = Math.log(3) / Math.LN10;
    var sx = function (v) { return x0 + (Math.log(v) / Math.LN10 - lo) / (hi - lo) * (x1 - x0); };
    /* excluded regions */
    ctx.fillStyle = 'oklch(0.68 0.22 20 / 0.18)';
    ctx.fillRect(x0, y - 18, sx(floor) - x0, 36);
    ctx.fillStyle = 'oklch(0.75 0.12 250 / 0.18)';
    ctx.fillRect(sx(cap), y - 18, x1 - sx(cap), 36);
    if (open) { ctx.fillStyle = 'oklch(0.72 0.15 150 / 0.55)'; ctx.fillRect(sx(floor), y - 18, sx(cap) - sx(floor), 36); }
    ctx.strokeStyle = COL.faint; ctx.lineWidth = 1; ctx.strokeRect(x0, y - 18, x1 - x0, 36);
    font(10.5); ctx.fillStyle = COL.muted; ctx.textAlign = 'center';
    [0.01, 0.03, 0.1, 0.3, 1, 3].forEach(function (v) { ctx.fillText(v + ' eV', sx(v), y + 32); });
    ctx.fillText('sum of the three neutrino masses (log scale)', (x0 + x1) / 2, y + 48);
    function tick(v, col, label, row) {
      var X = sx(v);
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X, y - 22); ctx.lineTo(X, y + 22); ctx.stroke();
      font(W < 520 ? 10 : 11); ctx.fillStyle = col; ctx.textAlign = X > W * 0.6 ? 'right' : 'left';
      ctx.fillText(label, X + (X > W * 0.6 ? -4 : 4), y - 26 - row * 14);
    }
    tick(floor, COL.era, 'oscillations: ≥ ' + floor.toFixed(4) + ' eV (' + ordering + ')', 2);
    tick(cap, COL.blue, 'DESI + CMB: < ' + cap + ' eV', 1);
    var kat = 3 * KATRIN;
    tick(kat, COL.gold, 'KATRIN: ≈ ' + kat.toFixed(2) + ' eV', 0);
    /* zoom: linear 0.04-0.18 eV */
    var zy = y + 64, zlo = 0.04, zhi = 0.18;
    var zx = function (v) { return x0 + (v - zlo) / (zhi - zlo) * (x1 - x0); };
    font(10.5); ctx.fillStyle = COL.muted; ctx.textAlign = 'left';
    ctx.fillText('Zoom, linear scale:', x0, zy - 6);
    ctx.fillStyle = 'oklch(0.68 0.22 20 / 0.18)'; ctx.fillRect(x0, zy, zx(floor) - x0, 20);
    ctx.fillStyle = 'oklch(0.75 0.12 250 / 0.18)'; ctx.fillRect(Math.min(x1, zx(cap)), zy, Math.max(0, x1 - zx(cap)), 20);
    if (open) { ctx.fillStyle = 'oklch(0.72 0.15 150 / 0.55)'; ctx.fillRect(zx(floor), zy, zx(cap) - zx(floor), 20); }
    ctx.strokeStyle = COL.faint; ctx.strokeRect(x0, zy, x1 - x0, 20);
    [[SUM_NO, 'NO floor'], [SUM_IO, 'IO floor']].forEach(function (p) {
      ctx.strokeStyle = COL.era; ctx.lineWidth = p[0] === floor ? 2 : 1; ctx.setLineDash(p[0] === floor ? [] : [3, 3]);
      ctx.beginPath(); ctx.moveTo(zx(p[0]), zy - 2); ctx.lineTo(zx(p[0]), zy + 22); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = COL.era; ctx.textAlign = 'center'; ctx.fillText(p[1], zx(p[0]), zy + 34);
    });
    ctx.fillStyle = COL.muted;
    [0.05, 0.1, 0.15].forEach(function (v) { ctx.textAlign = 'center'; ctx.fillText(v + ' eV', zx(v), zy + 48); });
    y = zy + 10;
    font(11); ctx.fillStyle = COL.muted; ctx.textAlign = 'left';
    wrap('KATRIN measures one weighted mass, m_β < 0.45 eV (90 %); for nearly equal masses the sum is about three times that, so its mark is approximate. The cosmological bound assumes a model: ' + (cosmoKey === 'lcdm' ? 'ΛCDM' : 'evolving dark energy (w₀wₐ)') + '.', 16, y + 70, W - 32, 15);
  }

  /* ── Draw / update ─────────────────────────────────────── */
  function draw() {
    if (!ctx || !W) return;
    ctx.clearRect(0, 0, W, H);
    ({ h0: drawH0, dm: drawDM, de: drawDE, qg: drawQG, ba: drawBA, nu: drawNU })[q]();
    if (running) {                         /* tour progress */
      ctx.fillStyle = 'oklch(0.68 0.22 20 / 0.6)';
      ctx.fillRect(0, H - 3, W * Math.min(1, tourT / TOUR_SECS), 3);
    }
  }

  function setStatus(t) { var s = $('sim-status'); if (s) s.textContent = t; }

  function select(key, fromTour) {
    q = key; intro = fromTour && !reducedMotion ? 0 : 1;
    ORDER.forEach(function (k) {
      var b = $('q-' + k); if (!b) return;
      b.setAttribute('aria-pressed', k === key ? 'true' : 'false');
    });
    ORDER.forEach(function (k) { var c = $('ctl-' + k); if (c) c.hidden = k !== key; });
    var st = $('gauge-settle'); if (st) st.textContent = SETTLE[key];
    setStatus((running ? 'Touring the board: ' : '') + TITLES[key]);
    draw();
  }

  function update(dt) {
    if (intro < 1) intro = Math.min(1, intro + dt / 0.8);
    tourT += dt;
    if (tourT >= TOUR_SECS) {
      tourT = 0;
      select(ORDER[(ORDER.indexOf(q) + 1) % ORDER.length], true);
    }
  }
  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function setPlayBtn(playing) {
    var btn = $('sim-play-btn');
    if (btn) { btn.textContent = playing ? '⏸ Pause' : '▶ Play'; btn.dataset.state = playing ? 'playing' : 'paused'; btn.setAttribute('aria-label', playing ? 'Pause the tour of the board' : 'Play: tour the six questions'); }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.toggle('is-running', playing);
  }
  function start() {
    if (running) return;
    setPlayBtn(true);
    running = true; lastTs = null; tourT = 0;
    setStatus('Touring the board: ' + TITLES[q]);
    rafId = requestAnimationFrame(loop);
  }
  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    setPlayBtn(false);
    intro = 1;
    setStatus(TITLES[q]);
    if (ctx) draw();
  }
  function reset() {
    pause();
    localKey = 'shoes'; hypo = null; deKey = 'pplus'; ordering = 'NO'; cosmoKey = 'lcdm';
    logE = Math.log(E_LHC_GEV) / Math.LN10; logN = 9;
    syncControls();
    select('h0', false);
  }
  function destroy() {
    pause();
    window.removeEventListener('resize', onResize);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }
  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  /* ── Controls ──────────────────────────────────────────── */
  function pressGroup(ids, on) { ids.forEach(function (id) { var b = $(id); if (b) b.setAttribute('aria-pressed', id === on ? 'true' : 'false'); }); }
  function syncControls() {
    pressGroup(['loc-shoes', 'loc-cchp'], 'loc-' + localKey);
    var L = LOCAL[localKey], hv = hypo === null ? L.v : hypo;
    $('hypo-slider').value = hv;
    $('hypo-val').textContent = hv.toFixed(1) + (hypo === null ? ' (published)' : ' (hypothetical)');
    $('hypo-slider').setAttribute('aria-valuetext', hv.toFixed(1) + ' kilometres per second per megaparsec' + (hypo === null ? ', published value' : ', hypothetical'));
    pressGroup(['de-cmb', 'de-pplus', 'de-union', 'de-desy5'], 'de-' + deKey);
    var E = Math.pow(10, logE);
    $('energy-slider').value = logE;
    $('energy-val').textContent = sci(E, 2) + ' GeV';
    $('energy-slider').setAttribute('aria-valuetext', sci(E, 2) + ' gigaelectronvolts');
    $('count-slider').value = logN;
    $('count-val').textContent = '10' + sup(Math.abs(logN - Math.round(logN)) < 1e-9 ? Math.round(logN) : logN.toFixed(1)) + ' photons';
    $('count-slider').setAttribute('aria-valuetext', '10 to the power ' + logN.toFixed(1) + ' photons');
    pressGroup(['nu-no', 'nu-io'], 'nu-' + ordering.toLowerCase());
    pressGroup(['nu-lcdm', 'nu-w0wa'], 'nu-' + cosmoKey);
  }
  function userAct() { if (running) pause(); syncControls(); draw(); }

  function bind() {
    ORDER.forEach(function (k) { $('q-' + k).addEventListener('click', function () { if (running) pause(); select(k, false); }); });
    $('loc-shoes').addEventListener('click', function () { localKey = 'shoes'; hypo = null; userAct(); });
    $('loc-cchp').addEventListener('click', function () { localKey = 'cchp'; hypo = null; userAct(); });
    $('hypo-slider').addEventListener('input', function () { var v = parseFloat(this.value); hypo = Math.abs(v - LOCAL[localKey].v) < 0.05 ? null : v; userAct(); });
    ['cmb', 'pplus', 'union', 'desy5'].forEach(function (k) { $('de-' + k).addEventListener('click', function () { deKey = k; userAct(); }); });
    $('energy-slider').addEventListener('input', function () { logE = parseFloat(this.value); userAct(); });
    $('count-slider').addEventListener('input', function () { logN = parseFloat(this.value); userAct(); });
    $('nu-no').addEventListener('click', function () { ordering = 'NO'; userAct(); });
    $('nu-io').addEventListener('click', function () { ordering = 'IO'; userAct(); });
    $('nu-lcdm').addEventListener('click', function () { cosmoKey = 'lcdm'; userAct(); });
    $('nu-w0wa').addEventListener('click', function () { cosmoKey = 'w0wa'; userAct(); });
  }

  /* ── Setup ─────────────────────────────────────────────── */
  function onResize() {
    if (!mountEl || !canvas) return;
    var rect = mountEl.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    W = Math.round(rect.width);
    H = W < 520 ? 440 : 400;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function setup() {
    mountEl = $('sim-mount');
    if (!mountEl) return;
    canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Gauge for the selected open question in physics, drawn from published numbers');
    mountEl.appendChild(canvas);
    ctx = canvas.getContext('2d');
    bind();
    syncControls();
    select('h0', false);
    requestAnimationFrame(function () { onResize(); });
    window.addEventListener('resize', onResize);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
}());
