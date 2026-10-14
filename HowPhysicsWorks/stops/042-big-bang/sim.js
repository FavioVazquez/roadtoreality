/* ============================================================
   sim.js — Stop 042: The Big Bang
   Three views:
   1. Hubble 1929: the 24 nebulae of Hubble's Table 1
      (PNAS 15, 168, p. 169). The reader sets the slope of
      v = H0 d; a calibration slider stretches every distance.
   2. Supernovae today: 150 Hubble-flow type Ia supernovae with
      0.023 < z < 0.05 from the Pantheon+SH0ES data release.
   3. Afterglow: the COBE/FIRAS monopole spectrum (Fixsen et al.
      1996, Table 4) against a Planck curve the reader sets.
   Play runs the movie backwards: galaxies at constant speed in
   the Hubble views, the blackbody heating up in the CMB view.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Constants ─────────────────────────────────────────── */
  var C_KMS = 299792.458;          /* speed of light, km/s                      */
  var HUBBLE_GYR = 977.7922;       /* 1/H0 in Gyr = 977.7922 / (H0 in km/s/Mpc) */
  var H_PL = 6.62607015e-34, K_B = 1.380649e-23, C_MS = 299792458;
  var M_B_SH0ES = -19.253;         /* Riess et al. 2022, Table 5 baseline        */
  var Z_STAR = 1089.92;            /* Planck 2018 VI, Table 2: last scattering   */
  var T_FIXSEN = 2.72548;          /* Fixsen 2009                                */
  /* Planck 2018 VI, Table 2 (TT,TE,EE+lowE+lensing) for the age-at-z readout   */
  var PL_H0 = 67.36, PL_OM = 0.3153;
  var PL_OR = 4.1837e-5 / Math.pow(PL_H0 / 100, 2);   /* photons + 3.046 massless neutrinos, T = 2.7255 K */

  /* Hubble 1929, Table 1: [name, r (Mpc), v (km/s)] — velocities as printed (not corrected for solar motion) */
  var HUBBLE = [
    ['SMC', 0.032, 170], ['LMC', 0.034, 290], ['NGC 6822', 0.214, -130], ['NGC 598', 0.263, -70],
    ['NGC 221', 0.275, -185], ['NGC 224', 0.275, -220], ['NGC 5457', 0.45, 200], ['NGC 4736', 0.5, 290],
    ['NGC 5194', 0.5, 270], ['NGC 4449', 0.63, 200], ['NGC 4214', 0.8, 300], ['NGC 3031', 0.9, -30],
    ['NGC 3627', 0.9, 650], ['NGC 4826', 0.9, 150], ['NGC 5236', 0.9, 500], ['NGC 1068', 1.0, 920],
    ['NGC 5055', 1.1, 450], ['NGC 7331', 1.1, 500], ['NGC 4258', 1.4, 500], ['NGC 4151', 1.7, 960],
    ['NGC 4382', 2.0, 500], ['NGC 4472', 2.0, 850], ['NGC 4486', 2.0, 800], ['NGC 4649', 2.0, 1090]
  ];

  /* Pantheon+SH0ES (Scolnic et al. 2022; Brout et al. 2022; Riess et al. 2022), file
     Pantheon+SH0ES.dat: rows with USED_IN_SH0ES_HF = 1 and zHD < 0.05; columns [zHD, MU_SH0ES].
     Supernovae observed by more than one survey appear on several rows; their MU_SH0ES values
     are averaged here (28 of the 150). */
  var PPLUS = [
    [0.02343,34.8582],[0.02344,34.8331],[0.02352,34.8391],[0.02357,34.5715],[0.02357,34.9958],[0.02365,34.9543],[0.02369,34.9430],[0.02388,34.9949],[0.02391,34.8993],[0.02411,35.1049],
    [0.02412,34.8782],[0.02417,35.0131],[0.02432,34.9701],[0.02432,35.2317],[0.02434,35.0102],[0.02453,35.0106],[0.02457,35.1784],[0.02466,34.8112],[0.02491,35.0862],[0.02494,35.1973],
    [0.02509,35.2152],[0.02510,34.8980],[0.02510,35.0790],[0.02513,34.4583],[0.02517,34.9117],[0.02517,35.1989],[0.02525,34.9063],[0.02534,35.1974],[0.02556,35.1828],[0.02557,35.0621],
    [0.02591,35.1181],[0.02598,35.0787],[0.02598,35.3111],[0.02669,35.3080],[0.02691,35.2790],[0.02713,35.2513],[0.02730,35.2892],[0.02731,35.2275],[0.02731,35.2673],[0.02736,35.3130],
    [0.02748,35.1262],[0.02805,35.1306],[0.02816,35.3613],[0.02819,35.3174],[0.02820,35.2874],[0.02823,35.5401],[0.02844,35.3571],[0.02849,35.3624],[0.02866,35.3449],[0.02873,34.9487],
    [0.02902,35.0558],[0.02913,35.5152],[0.02915,35.6948],[0.02917,35.2391],[0.02938,35.4720],[0.02947,35.0939],[0.02949,35.6079],[0.02950,35.3638],[0.02978,35.5015],[0.02990,35.4354],
    [0.03012,35.4931],[0.03031,35.5542],[0.03083,35.4648],[0.03091,35.4926],[0.03114,35.6055],[0.03116,35.5877],[0.03120,35.5197],[0.03143,35.5602],[0.03143,35.6461],[0.03148,35.7017],
    [0.03148,35.7070],[0.03162,35.6660],[0.03166,35.7279],[0.03192,35.4592],[0.03201,35.4896],[0.03236,35.6746],[0.03255,35.5760],[0.03264,35.8808],[0.03264,35.9082],[0.03282,35.6329],
    [0.03289,35.8381],[0.03290,35.7248],[0.03296,35.8115],[0.03333,35.7268],[0.03335,35.8159],[0.03341,35.8581],[0.03371,35.7797],[0.03373,35.8290],[0.03375,36.0229],[0.03378,35.8276],
    [0.03393,35.9089],[0.03428,35.9283],[0.03437,35.7837],[0.03459,35.7348],[0.03479,35.8566],[0.03512,35.8816],[0.03515,35.8937],[0.03529,35.8610],[0.03568,36.2340],[0.03576,35.9591],
    [0.03583,35.9325],[0.03585,35.5515],[0.03599,35.9909],[0.03616,35.8586],[0.03624,36.1845],[0.03682,35.9059],[0.03705,35.9637],[0.03707,36.0475],[0.03725,35.9997],[0.03730,35.8698],
    [0.03740,35.9789],[0.03753,35.9490],[0.03756,36.2759],[0.03796,36.0889],[0.03818,35.8777],[0.03828,36.1141],[0.03848,36.2564],[0.03873,36.0125],[0.03884,36.0260],[0.04014,36.2840],
    [0.04035,36.5486],[0.04056,36.0493],[0.04089,36.1263],[0.04099,36.0403],[0.04101,36.3153],[0.04222,36.2101],[0.04258,36.5106],[0.04268,36.2931],[0.04285,36.2296],[0.04289,36.2018],
    [0.04369,36.2594],[0.04408,36.3298],[0.04438,36.5469],[0.04439,36.2916],[0.04440,36.5510],[0.04545,36.4541],[0.04575,36.4886],[0.04625,36.2636],[0.04643,36.3247],[0.04656,36.5081],
    [0.04682,36.4822],[0.04691,36.7582],[0.04760,36.6009],[0.04777,36.5627],[0.04777,36.5946],[0.04837,36.3735],[0.04860,36.3303],[0.04940,36.4691],[0.04944,36.5828],[0.04989,36.4714]
  ];

  /* COBE/FIRAS monopole, Fixsen et al. 1996, Table 4 (LAMBDA file firas_monopole_spec_v1.txt):
     [frequency (cm^-1), intensity (MJy/sr), 1-sigma uncertainty (kJy/sr)] */
  var FIRAS = [
    [2.27,200.723,14],[2.72,249.508,19],[3.18,293.024,25],[3.63,327.770,23],[4.08,354.081,22],[4.54,372.079,21],
    [4.99,381.493,18],[5.45,383.478,18],[5.90,378.901,16],[6.35,368.833,14],[6.81,354.063,13],[7.26,336.278,12],
    [7.71,316.076,11],[8.17,293.924,10],[8.62,271.432,11],[9.08,248.239,12],[9.53,225.940,14],[9.98,204.327,16],
    [10.44,183.262,18],[10.89,163.830,22],[11.34,145.750,22],[11.80,128.835,23],[12.25,113.568,23],[12.71,99.451,23],
    [13.16,87.036,22],[13.61,75.876,21],[14.07,65.766,20],[14.52,57.008,19],[14.97,49.223,19],[15.43,42.267,19],
    [15.88,36.352,21],[16.34,31.062,23],[16.79,26.580,26],[17.24,22.644,28],[17.70,19.255,30],[18.15,16.391,32],
    [18.61,13.811,33],[19.06,11.716,35],[19.51,9.921,41],[19.97,8.364,55],[20.42,7.087,88],[20.87,5.801,155],
    [21.33,4.523,282]
  ];
  /* Penzias and Wilson: excess antenna temperature 3.4 ± 1 K at 7.35 cm (4.08 GHz),
     R. W. Wilson, Nobel lecture 1978, Fig. 10 ("old throat") */
  var PW = { nuGHz: C_MS / 0.0735 / 1e9, T: 3.4, dT: 1.0 };

  var COL = {
    era:    'oklch(0.68 0.22 20)',
    eraDim: 'oklch(0.68 0.22 20 / 0.30)',
    gold:   'oklch(0.78 0.14 82)',
    blue:   'oklch(0.75 0.12 250)',
    text:   'oklch(0.92 0 0)',
    muted:  'oklch(0.62 0 0)',
    faint:  'oklch(1 0 0 / 0.10)',
    grid:   'oklch(1 0 0 / 0.06)'
  };

  /* ── State ─────────────────────────────────────────────── */
  var view = 'h1929';                       /* h1929 | today | cmb */
  var H1929 = 500, Htoday = 70;             /* the reader's slope in each view */
  var corr1929 = 0;                         /* distance-scale correction, magnitudes */
  var dMB = 0;                              /* shift of the SN absolute magnitude, magnitudes */
  var showFit = false;
  var Tcmb = 2.725;
  var rew = 0;                              /* rewind progress 0..1 */
  var HOLD = 2.0, holdT = 0;
  var dragging = false;

  /* ── Data helpers ──────────────────────────────────────── */
  function pts1929() {
    var f = Math.pow(10, corr1929 / 5);
    return HUBBLE.map(function (h) { return { d: h[1] * f, v: h[2], name: h[0] }; });
  }
  /* distance now (proper distance) = luminosity distance / (1 + z); velocity = c z */
  function ptsToday() {
    return PPLUS.map(function (p) {
      var mu = p[1] - dMB;                         /* MU_SH0ES = m_corr + 19.253; M_B -> M_B + dMB shifts mu by -dMB */
      var dl = Math.pow(10, (mu - 25) / 5);
      return { d: dl / (1 + p[0]), v: C_KMS * p[0] };
    });
  }
  function lsSlope(P) {               /* least squares through the origin, vertical residuals */
    var sxy = 0, sxx = 0;
    for (var i = 0; i < P.length; i++) { sxy += P[i].v * P[i].d; sxx += P[i].d * P[i].d; }
    return sxy / sxx;
  }
  function rms(P, Hs) {
    var s = 0;
    for (var i = 0; i < P.length; i++) { var r = P[i].v - Hs * P[i].d; s += r * r; }
    return Math.sqrt(s / P.length);
  }

  /* Planck law, MJy/sr, nu in GHz */
  function planck(nuGHz, T) {
    var nu = nuGHz * 1e9;
    var x = H_PL * nu / (K_B * T);
    if (x > 700) return 0;
    return 2 * H_PL * nu * nu * nu / (C_MS * C_MS) / Math.expm1(x) * 1e20;
  }
  function firasGHz(i) { return FIRAS[i][0] * C_MS * 100 / 1e9; }
  function firasResidRms(T) {
    var s = 0;
    for (var i = 0; i < FIRAS.length; i++) { var r = (FIRAS[i][1] - planck(firasGHz(i), T)) * 1000; s += r * r; }
    return Math.sqrt(s / FIRAS.length);            /* kJy/sr */
  }
  function firasBestT() {                            /* chi-square minimum by golden section */
    function chi(T) {
      var s = 0;
      for (var i = 0; i < FIRAS.length; i++) { var r = (FIRAS[i][1] - planck(firasGHz(i), T)) * 1000 / FIRAS[i][2]; s += r * r; }
      return s;
    }
    var a = 2.70, b = 2.75, g = (Math.sqrt(5) - 1) / 2;
    var c = b - g * (b - a), d = a + g * (b - a);
    for (var k = 0; k < 80; k++) {
      if (chi(c) < chi(d)) b = d; else a = c;
      c = b - g * (b - a); d = a + g * (b - a);
    }
    return { T: (a + b) / 2, chi2: chi((a + b) / 2) };
  }
  var FIRAS_FIT = null;

  /* Age of the universe at redshift z for the Planck 2018 parameters, years */
  function ageAt(z) {
    var amax = 1 / (1 + z), OL = 1 - PL_OM - PL_OR, N = 400, s = 0;
    /* substitute a = amax * u^2, da = 2 amax u du; integrand da / (a H) */
    for (var i = 0; i <= N; i++) {
      var u = i / N, a = amax * u * u;
      var f;
      if (i === 0) f = 0;
      else {
        var E = Math.sqrt(PL_OR / (a * a * a * a) + PL_OM / (a * a * a) + OL);
        f = 2 * amax * u / (a * E);
      }
      s += f * (i === 0 || i === N ? 1 : (i % 2 ? 4 : 2));
    }
    return s / (3 * N) * HUBBLE_GYR / PL_H0 * 1e9;
  }

  /* ── Formatting ────────────────────────────────────────── */
  function fmtYears(y) {
    if (y >= 1e9) return (y / 1e9).toFixed(2) + ' billion years';
    if (y >= 1e6) return (y / 1e6).toFixed(0) + ' million years';
    return Math.round(y / 1000).toLocaleString('en-US') + ',000 years';
  }
  function niceStep(range, n) {
    var raw = range / n, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }
  function fmtTick(v, step) {
    var dec = Math.max(0, -Math.floor(Math.log(step) / Math.LN10 + 1e-9));
    return Number(v.toFixed(dec)).toLocaleString('en-US');
  }

  /* ── Layout ────────────────────────────────────────────── */
  function plotBox() {
    var narrow = W < 520;
    var l = narrow ? 52 : 66, r = 14, t = narrow ? 92 : 84, b = 44;
    return { x0: l, x1: W - r, y0: t, y1: H - b, narrow: narrow };
  }

  function axes(B, xmin, xmax, ymin, ymax, xlab, ylab) {
    var sx = function (x) { return B.x0 + (x - xmin) / (xmax - xmin) * (B.x1 - B.x0); };
    var sy = function (y) { return B.y1 - (y - ymin) / (ymax - ymin) * (B.y1 - B.y0); };
    ctx.lineWidth = 1;
    ctx.font = (B.narrow ? '10px' : '11px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.muted;
    var xs = niceStep(xmax - xmin, B.narrow ? 4 : 6), ys = niceStep(ymax - ymin, 5), v;
    ctx.textAlign = 'center';
    for (v = Math.ceil(xmin / xs) * xs; v <= xmax + 1e-9; v += xs) {
      ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.moveTo(sx(v), B.y0); ctx.lineTo(sx(v), B.y1); ctx.stroke();
      ctx.fillText(fmtTick(v, xs), sx(v), B.y1 + 14);
    }
    ctx.textAlign = 'right';
    for (v = Math.ceil(ymin / ys) * ys; v <= ymax + 1e-9; v += ys) {
      ctx.strokeStyle = Math.abs(v) < 1e-9 ? COL.faint : COL.grid;
      ctx.beginPath(); ctx.moveTo(B.x0, sy(v)); ctx.lineTo(B.x1, sy(v)); ctx.stroke();
      ctx.fillText(fmtTick(v, ys), B.x0 - 5, sy(v) + 3.5);
    }
    ctx.strokeStyle = COL.faint;
    ctx.strokeRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0);
    ctx.textAlign = 'center';
    ctx.fillText(xlab, (B.x0 + B.x1) / 2, H - 10);
    ctx.save();
    ctx.translate(12, (B.y0 + B.y1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(ylab, 0, 0);
    ctx.restore();
    return { sx: sx, sy: sy, xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax };
  }

  /* ── Hubble views ──────────────────────────────────────── */
  var lastAx = null;

  function rewindGyr(Hs) { return rew * 1.15 * HUBBLE_GYR / Hs; }

  function drawHubble() {
    var is29 = view === 'h1929';
    var P = is29 ? pts1929() : ptsToday();
    var Hs = is29 ? H1929 : Htoday;
    var f = Math.pow(10, corr1929 / 5);
    var B = plotBox();
    var xmax = is29 ? 2.3 * f : 230, ymin = is29 ? -300 : 0, ymax = is29 ? 1200 : 13000;
    var ax = axes(B, 0, xmax, ymin, ymax, is29 ? 'Distance (Mpc), Hubble 1929' + (corr1929 > 0 ? ' × ' + f.toFixed(2) : '') : 'Distance now (Mpc), from the supernova brightness',
      is29 ? 'Velocity (km/s)' : 'Velocity c·z (km/s)');
    lastAx = ax;

    var tG = rewindGyr(Hs);                      /* Gyr rewound */
    ctx.save();
    ctx.beginPath(); ctx.rect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0); ctx.clip();

    /* reader's line, steepened by the rewind: v = H d / (1 - H t) */
    var k = 1 - tG * Hs / HUBBLE_GYR;
    var slope = k > 0.002 ? Hs / k : 1e9;
    ctx.strokeStyle = COL.era; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ax.sx(0), ax.sy(0));
    var xe = Math.min(xmax, ymax / slope);
    ctx.lineTo(ax.sx(xe), ax.sy(slope * xe)); ctx.stroke();

    if (showFit && rew === 0) {
      var Kf = lsSlope(P);
      ctx.setLineDash([6, 5]); ctx.strokeStyle = COL.gold; ctx.lineWidth = 1.5;
      var xf = Math.min(xmax, ymax / Kf);
      ctx.beginPath(); ctx.moveTo(ax.sx(0), ax.sy(0)); ctx.lineTo(ax.sx(xf), ax.sy(Kf * xf)); ctx.stroke();
      ctx.setLineDash([]);
    }

    /* points; in the rewind each moves at its own constant velocity: d(t) = d - v t */
    var rad = is29 ? (B.narrow ? 4 : 5) : (B.narrow ? 2.4 : 3);
    for (var i = 0; i < P.length; i++) {
      var d = P[i].d - P[i].v * tG / HUBBLE_GYR;
      ctx.fillStyle = is29 ? COL.text : COL.blue;
      ctx.globalAlpha = is29 ? 0.95 : 0.75;
      ctx.beginPath(); ctx.arc(ax.sx(d), ax.sy(P[i].v), rad, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    /* readouts */
    var narrow = B.narrow, x = 14, y = 20, lh = narrow ? 15 : 16;
    ctx.textAlign = 'left';
    ctx.font = (narrow ? '13px' : '14px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.text;
    ctx.fillText('Your line: H₀ = ' + (is29 ? Math.round(Hs) : Hs.toFixed(1)) + ' km/s/Mpc', x, y);
    ctx.font = (narrow ? '11px' : '12px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.muted;
    ctx.fillText('1/H₀ = ' + (HUBBLE_GYR / Hs).toFixed(2) + ' billion years   ·   rms scatter ' + Math.round(rms(P, Hs)) + ' km/s', x, y + lh);
    if (showFit) {
      ctx.fillStyle = COL.gold;
      ctx.fillText('Least-squares line through the origin: ' + lsSlope(P).toFixed(is29 ? 0 : 1) + ' km/s/Mpc', x, y + 2 * lh);
    }
    if (rew > 0) {
      ctx.fillStyle = COL.era;
      ctx.fillText('Rewound ' + tG.toFixed(2) + ' billion years at constant speeds', x, y + 3 * lh);
    } else if (is29 && corr1929 > 0) {
      ctx.fillStyle = COL.muted;
      ctx.fillText('Distances stretched × ' + f.toFixed(2) + ' (' + corr1929.toFixed(1) + ' mag)', x, y + 3 * lh);
    } else if (!is29 && Math.abs(dMB) > 1e-9) {
      ctx.fillStyle = COL.muted;
      ctx.fillText('Supernova absolute magnitude ' + (M_B_SH0ES + dMB).toFixed(3).replace('-', '−') + ' (SH0ES: −19.253)', x, y + 3 * lh);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = COL.muted;
    ctx.fillText(is29 ? 'Hubble 1929, Table 1 (24 nebulae)' : 'Pantheon+SH0ES, 150 SNe Ia, z < 0.05', W - 14, B.y0 - 8);
  }

  /* ── CMB view ──────────────────────────────────────────── */
  function cmbZ() { return Math.exp(rew * Math.log(1 + Z_STAR)) - 1; }

  function drawCMB() {
    var narrow = W < 520;
    var l = narrow ? 52 : 66, r = 14, t = narrow ? 92 : 84;
    var stripH = narrow ? 78 : 92;
    var z = cmbZ(), s = 1 + z;
    var Tz = Tcmb * s;
    var B = { x0: l, x1: W - r, y0: t, y1: H - 44 - (rew === 0 ? stripH + 18 : 0), narrow: narrow };
    var xmax = 700 * s, ymax = 420 * s * s * s;
    var unitX = s >= 1000 ? 1000 : 1, unitY = s >= 10 ? Math.pow(10, Math.floor(Math.log(s * s * s) / Math.LN10)) : 1;
    var xlab = unitX === 1000 ? 'Frequency (THz)' : 'Frequency (GHz)';
    var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    var ylab = 'Intensity (MJy/sr' + (unitY > 1 ? ' × 10' + String(Math.round(Math.log(unitY) / Math.LN10)).split('').map(function (ch) { return SUP[ch]; }).join('') : '') + ')';
    var axl = axes(B, 0, xmax / unitX, 0, ymax / unitY, xlab, ylab);
    var sx = function (nu) { return axl.sx(nu / unitX); }, sy = function (I) { return axl.sy(I / unitY); };

    ctx.save();
    ctx.beginPath(); ctx.rect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0); ctx.clip();
    /* Planck curve at T(z) */
    ctx.strokeStyle = COL.era; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= 300; i++) {
      var nu = xmax * i / 300 + 1e-6;
      var y = sy(planck(nu, Tz));
      if (i === 0) ctx.moveTo(sx(nu), y); else ctx.lineTo(sx(nu), y);
    }
    ctx.stroke();

    var alpha = Math.max(0, 1 - rew * 12);
    if (alpha > 0) {
      ctx.globalAlpha = alpha;
      /* FIRAS points, error bars x400 */
      for (i = 0; i < FIRAS.length; i++) {
        var nx = sx(firasGHz(i)), ny = sy(FIRAS[i][1]);
        var e = FIRAS[i][2] / 1000 * 400;
        ctx.strokeStyle = COL.text; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(nx, sy(FIRAS[i][1] - e)); ctx.lineTo(nx, sy(FIRAS[i][1] + e)); ctx.stroke();
        ctx.fillStyle = COL.text;
        ctx.beginPath(); ctx.arc(nx, ny, narrow ? 2.2 : 2.6, 0, 2 * Math.PI); ctx.fill();
      }
      /* Penzias and Wilson 1965: Rayleigh-Jeans intensity of the excess antenna temperature */
      var Ipw = function (T) { return 2 * K_B * T * Math.pow(PW.nuGHz * 1e9, 2) / (C_MS * C_MS) * 1e20; };
      var px = sx(PW.nuGHz);
      ctx.strokeStyle = COL.gold; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px, sy(Ipw(PW.T - PW.dT))); ctx.lineTo(px, sy(Ipw(PW.T + PW.dT))); ctx.stroke();
      ctx.fillStyle = COL.gold;
      ctx.fillRect(px - 3.5, sy(Ipw(PW.T)) - 3.5, 7, 7);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    if (alpha > 0) {
      ctx.globalAlpha = alpha;
      ctx.font = (narrow ? '10px' : '11px') + ' "DM Sans", sans-serif';
      ctx.fillStyle = COL.gold; ctx.textAlign = 'left';
      ctx.fillText('◂ Penzias & Wilson 1965, 4.08 GHz', sx(PW.nuGHz) + 8, sy(Ipw(PW.T)) - 8);
      ctx.fillStyle = COL.muted; ctx.textAlign = 'right';
      ctx.fillText('COBE/FIRAS, 43 points (error bars × 400)', W - 14, B.y0 - 8);
      ctx.globalAlpha = 1;
    }

    /* residual strip (today only) */
    if (rew === 0) {
      var r0 = H - 44 - stripH, r1 = H - 44 + 0;
      var top = r0 + 4, bot = r1 - 16, mid = (top + bot) / 2;
      /* scale set by the points with uncertainties below 100 kJy/sr; the two noisiest
         high-frequency points may fall outside the strip and are clipped */
      var resid = [], rmax = 60;
      for (i = 0; i < FIRAS.length; i++) {
        var rr = (FIRAS[i][1] - planck(firasGHz(i), Tcmb)) * 1000;
        resid.push(rr);
        if (FIRAS[i][2] < 100) rmax = Math.max(rmax, 1.15 * Math.abs(rr));
      }
      ctx.fillStyle = 'oklch(0.13 0 0)';
      ctx.fillRect(B.x0, top, B.x1 - B.x0, bot - top);
      ctx.strokeStyle = COL.faint; ctx.beginPath(); ctx.moveTo(B.x0, mid); ctx.lineTo(B.x1, mid); ctx.stroke();
      var ry = function (v) { return Math.max(top + 1, Math.min(bot - 1, mid - v / rmax * (bot - top) / 2 * 0.92)); };
      for (i = 0; i < FIRAS.length; i++) {
        var qx = sx(firasGHz(i));
        ctx.strokeStyle = COL.muted; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(qx, ry(resid[i] - FIRAS[i][2])); ctx.lineTo(qx, ry(resid[i] + FIRAS[i][2])); ctx.stroke();
        ctx.fillStyle = COL.text;
        ctx.beginPath(); ctx.arc(qx, ry(resid[i]), 2, 0, 2 * Math.PI); ctx.fill();
      }
      ctx.font = (narrow ? '10px' : '11px') + ' "DM Sans", sans-serif';
      ctx.fillStyle = COL.muted; ctx.textAlign = 'left';
      ctx.fillText('FIRAS minus your curve (kJy/sr), true error bars, ±' + Math.round(rmax).toLocaleString('en-US'), B.x0 + 4, bot + 12);
    }

    /* readouts */
    var x = 14, y = 20, lh = narrow ? 15 : 16;
    ctx.textAlign = 'left';
    ctx.font = (narrow ? '13px' : '14px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.text;
    ctx.fillText('Blackbody at T = ' + (rew > 0 ? Math.round(Tz).toLocaleString('en-US') : Tcmb.toFixed(3)) + ' K', x, y);
    ctx.font = (narrow ? '11px' : '12px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.muted;
    var peak = 2.821439372 * K_B * Tz / H_PL / 1e9;
    ctx.fillText('Peak at ' + (peak >= 1000 ? (peak / 1000).toFixed(1) + ' THz' : peak.toFixed(1) + ' GHz') +
      (rew === 0 ? '   ·   rms off FIRAS ' + firasResidRms(Tcmb).toFixed(1) + ' kJy/sr' : ''), x, y + lh);
    if (rew > 0) {
      ctx.fillStyle = COL.era;
      ctx.fillText('Rewound to z = ' + Math.round(z).toLocaleString('en-US') + ': the universe was ' + fmtYears(ageAt(z)) + ' old', x, y + 2 * lh);
      ctx.fillStyle = COL.muted;
      ctx.fillText('Axes rescaled by 1 + z: the shape never changes', x, y + 3 * lh);
    } else {
      ctx.fillText('Best fit to these 43 points: ' + FIRAS_FIT.T.toFixed(4) + ' K', x, y + 2 * lh);
    }
  }

  /* ── Draw / update ─────────────────────────────────────── */
  function draw() {
    if (!ctx || !W) return;
    ctx.clearRect(0, 0, W, H);
    if (view === 'cmb') drawCMB(); else drawHubble();
  }

  function setStatus(txt) {
    var st = document.getElementById('sim-status');
    if (st) st.textContent = txt;
  }

  function idleStatus() {
    if (view === 'h1929') setStatus('Drag on the plot or use the slider to set the slope. Press play to run the galaxies backwards.');
    else if (view === 'today') setStatus('The same law, 75 to 215 Mpc away. Drag the line, then shift the supernova calibration.');
    else setStatus('Set the temperature and compare with FIRAS. Press play to run the spectrum back to the time it was released.');
  }

  var RUN_SECS = 7;
  function update(dt) {
    if (rew >= 1) {
      holdT += dt;
      if (holdT > HOLD) { rew = 0; holdT = 0; idleStatus(); }
      return;
    }
    rew = Math.min(1, rew + dt / RUN_SECS);
    if (rew >= 1) {
      if (view === 'cmb') setStatus('Last scattering, z ≈ 1090: the gas was about 3,000 K and became transparent. This light has been travelling ever since.');
      else setStatus('Run back at constant speed, everything reaches zero distance after about 1/H₀. Galaxies off the line are moving with their own local speeds.');
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

  /* ── SimAPI ────────────────────────────────────────────── */
  function setPlayBtn(playing) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = playing ? '⏸ Pause' : '▶ Play'; btn.dataset.state = playing ? 'playing' : 'paused'; btn.setAttribute('aria-label', playing ? 'Pause the rewind' : 'Play: run the expansion backwards'); }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.toggle('is-running', playing);
  }

  function start() {
    if (running) return;
    setPlayBtn(true);
    if (reducedMotion) {
      rew = 1; holdT = 0;
      update(0);
      draw();
      return;
    }
    running = true;
    lastTs = null;
    rafId = requestAnimationFrame(loop);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    setPlayBtn(false);
  }

  function reset() {
    pause();
    rew = 0; holdT = 0;
    idleStatus();
    draw();
  }

  function destroy() {
    pause();
    window.removeEventListener('resize', onResize);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  /* ── Controls ──────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }

  function syncControls() {
    var is29 = view === 'h1929', isT = view === 'today', isC = view === 'cmb';
    ['view-1929', 'view-today', 'view-cmb'].forEach(function (id) {
      var b = $(id); if (!b) return;
      var on = (id === 'view-1929' && is29) || (id === 'view-today' && isT) || (id === 'view-cmb' && isC);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-active', on);
    });
    $('ctl-h0').hidden = isC;
    $('ctl-fit').hidden = isC;
    $('ctl-corr').hidden = !is29;
    $('ctl-mb').hidden = !isT;
    $('ctl-temp').hidden = !isC;
    var sl = $('h0-slider');
    if (is29) { sl.min = 100; sl.max = 1000; sl.step = 1; sl.value = H1929; }
    else if (isT) { sl.min = 40; sl.max = 110; sl.step = 0.1; sl.value = Htoday; }
    updateReadouts();
  }

  function updateReadouts() {
    var is29 = view === 'h1929';
    var Hs = is29 ? H1929 : Htoday;
    var sl = $('h0-slider');
    if (view !== 'cmb') {
      $('h0-val').textContent = (is29 ? Math.round(Hs) : Hs.toFixed(1)) + ' km/s/Mpc';
      $('age-val').textContent = (HUBBLE_GYR / Hs).toFixed(2) + ' billion years';
      sl.setAttribute('aria-valuetext', (is29 ? Math.round(Hs) : Hs.toFixed(1)) + ' kilometres per second per megaparsec');
      var P = is29 ? pts1929() : ptsToday();
      $('fit-val').textContent = showFit ? lsSlope(P).toFixed(is29 ? 0 : 1) + ' km/s/Mpc' : '—';
    }
    var f = Math.pow(10, corr1929 / 5);
    $('corr-val').textContent = corr1929.toFixed(1) + ' mag (× ' + f.toFixed(2) + ')';
    $('corr-slider').setAttribute('aria-valuetext', corr1929.toFixed(1) + ' magnitudes, distances times ' + f.toFixed(2));
    $('mb-val').textContent = (dMB >= 0 ? '+' : '−') + Math.abs(dMB).toFixed(2) + ' mag';
    $('mb-slider').setAttribute('aria-valuetext', (dMB >= 0 ? 'plus ' : 'minus ') + Math.abs(dMB).toFixed(2) + ' magnitudes');
    $('temp-val').textContent = Tcmb.toFixed(3) + ' K';
    $('temp-slider').setAttribute('aria-valuetext', Tcmb.toFixed(3) + ' kelvin');
    var fb = $('fit-btn');
    fb.setAttribute('aria-pressed', showFit ? 'true' : 'false');
    fb.textContent = showFit ? 'Hide least-squares line' : 'Show least-squares line';
  }

  function setView(v) {
    view = v;
    rew = 0; holdT = 0;
    syncControls();
    idleStatus();
    draw();
  }

  function setH(Hs) {
    if (view === 'h1929') H1929 = Math.max(100, Math.min(1000, Hs));
    else if (view === 'today') Htoday = Math.max(40, Math.min(110, Hs));
    $('h0-slider').value = view === 'h1929' ? H1929 : Htoday;
    updateReadouts();
    draw();
  }

  function pointerToH(e) {
    if (!lastAx || view === 'cmb') return;
    var rect = canvas.getBoundingClientRect();
    var px = e.clientX - rect.left, py = e.clientY - rect.top;
    var B = plotBox();
    if (px < B.x0 || px > B.x1 || py < B.y0 || py > B.y1) return false;
    var d = lastAx.xmin + (px - B.x0) / (B.x1 - B.x0) * (lastAx.xmax - lastAx.xmin);
    var v = lastAx.ymin + (B.y1 - py) / (B.y1 - B.y0) * (lastAx.ymax - lastAx.ymin);
    if (d <= (lastAx.xmax * 0.02) || v <= 0) return false;
    if (rew > 0) { rew = 0; holdT = 0; }
    setH(view === 'h1929' ? Math.round(v / d) : Math.round(v / d * 10) / 10);
    return true;
  }

  function bindControls() {
    $('view-1929').addEventListener('click', function () { setView('h1929'); });
    $('view-today').addEventListener('click', function () { setView('today'); });
    $('view-cmb').addEventListener('click', function () { setView('cmb'); });
    $('h0-slider').addEventListener('input', function () { if (rew > 0) { rew = 0; holdT = 0; } setH(parseFloat(this.value)); });
    $('fit-btn').addEventListener('click', function () { showFit = !showFit; updateReadouts(); draw(); });
    $('corr-slider').addEventListener('input', function () { corr1929 = parseFloat(this.value); rew = 0; updateReadouts(); draw(); });
    $('mb-slider').addEventListener('input', function () { dMB = parseFloat(this.value); rew = 0; updateReadouts(); draw(); });
    $('temp-slider').addEventListener('input', function () { Tcmb = parseFloat(this.value); rew = 0; updateReadouts(); draw(); });
    $('temp-fit-btn').addEventListener('click', function () {
      Tcmb = Math.round(FIRAS_FIT.T * 1000) / 1000;
      $('temp-slider').value = Tcmb; rew = 0; updateReadouts(); draw();
    });
    canvas.addEventListener('pointerdown', function (e) {
      if (pointerToH(e)) { dragging = true; try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
    });
    canvas.addEventListener('pointermove', function (e) { if (dragging) pointerToH(e); });
    canvas.addEventListener('pointerup', function () { dragging = false; });
    canvas.addEventListener('pointercancel', function () { dragging = false; });
  }

  /* ── Setup ─────────────────────────────────────────────── */
  function onResize() {
    if (!mountEl || !canvas) return;
    var rect = mountEl.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    W = Math.round(rect.width);
    H = Math.max(460, Math.round(Math.min(W * 0.62, 560)));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function setup() {
    mountEl = document.getElementById('sim-mount');
    if (!mountEl) return;
    FIRAS_FIT = firasBestT();
    canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Hubble diagram of velocity against distance with a line whose slope you set, or the cosmic microwave background spectrum against a blackbody curve');
    mountEl.appendChild(canvas);
    ctx = canvas.getContext('2d');
    bindControls();
    syncControls();
    idleStatus();
    requestAnimationFrame(function () { onResize(); });
    window.addEventListener('resize', onResize);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
}());
