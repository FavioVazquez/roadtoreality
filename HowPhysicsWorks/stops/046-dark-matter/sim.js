/* ============================================================
   sim.js — Stop 046: Dark Matter
   Rotation-curve builder for the spiral galaxy NGC 3198.
     v(r)² = v_bulge² + v_disk² + v_gas|v_gas| + v_halo²
   Bulge: Hernquist (1990), v² = G M_b r / (r + a)², a = 0.5 kpc.
   Disk: thin exponential disk, Freeman (1970), exact:
     v² = 4πGΣ₀R_d y² [I₀(y)K₀(y) − I₁(y)K₁(y)],  y = r/(2R_d)
   Gas: SPARC's gas curve, computed from the observed H I map
     (Lelli, McGaugh & Schombert 2016), fixed.
   Halo: pseudo-isothermal (cored) or NFW (Navarro, Frenk & White).
   Observed curve: SPARC table for NGC 3198 (43 points), cited.
   Units: kpc, km/s, solar masses; G = 4.30091e-6 kpc (km/s)²/M☉.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false;
  var rafId = null;
  var lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Observed data (cited) ──────────────────────────────
     SPARC, Lelli, McGaugh & Schombert, AJ 152, 157 (2016),
     file MassModels_Lelli2016c.mrt, galaxy NGC3198, D = 13.8 Mpc.
     Columns: R (kpc), Vobs (km/s), e_Vobs (km/s), Vgas (km/s),
     Vdisk (km/s, for M/L = 1 at 3.6 µm, from the observed light). */
  var DATA = [
    [0.32, 24.40, 35.90, 0.00, 63.28], [0.64, 43.30, 16.30, 0.00, 73.66],
    [0.96, 45.50, 16.10, 0.00, 78.98], [1.28, 58.50, 15.40, 0.35, 82.70],
    [1.61, 68.80, 7.61, 0.15, 84.22],  [1.93, 76.90, 10.30, -0.05, 83.17],
    [2.24, 82.00, 8.09, -0.47, 87.04], [2.57, 86.90, 7.60, -0.95, 88.91],
    [2.89, 97.60, 3.03, -1.43, 88.98], [3.21, 100.00, 5.31, -1.14, 93.81],
    [3.54, 107.00, 7.51, -0.39, 101.22], [3.85, 113.00, 7.32, 0.36, 108.53],
    [4.17, 117.00, 5.21, 1.52, 115.51], [4.50, 119.00, 5.67, 3.07, 120.51],
    [4.82, 127.00, 5.39, 4.63, 125.42], [5.15, 132.00, 4.34, 6.02, 129.40],
    [5.46, 134.00, 2.36, 7.16, 133.15], [5.78, 137.00, 0.89, 8.31, 136.45],
    [6.10, 140.00, 2.84, 9.46, 139.41], [6.43, 142.00, 0.88, 10.61, 141.85],
    [6.74, 144.00, 1.23, 11.77, 142.32], [7.06, 146.00, 1.57, 12.87, 140.94],
    [8.04, 147.00, 3.00, 16.39, 135.68], [9.04, 148.00, 3.00, 20.03, 130.79],
    [10.04, 152.00, 2.00, 23.68, 128.10], [11.04, 155.00, 2.00, 27.08, 126.67],
    [12.05, 156.00, 2.00, 30.11, 124.98], [14.05, 157.00, 2.00, 34.48, 118.12],
    [16.07, 153.00, 2.00, 36.43, 108.22], [18.13, 153.00, 2.00, 37.76, 101.10],
    [20.05, 154.00, 2.00, 39.83, 96.40], [22.12, 153.00, 2.00, 40.92, 91.56],
    [24.03, 150.00, 2.00, 41.77, 87.03], [26.10, 149.00, 2.00, 43.71, 82.67],
    [28.16, 148.00, 2.00, 45.41, 79.06], [30.08, 146.00, 2.00, 45.29, 76.07],
    [32.14, 147.00, 2.00, 44.56, 73.27], [34.06, 148.00, 2.00, 44.81, 70.91],
    [36.12, 148.00, 2.00, 45.90, 68.62], [38.19, 149.00, 2.00, 46.75, 66.59],
    [40.10, 150.00, 2.00, 47.48, 64.84], [42.17, 150.00, 3.00, 48.93, 63.10],
    [44.08, 149.00, 3.00, 47.84, 61.63]
  ];
  var N = DATA.length;
  var R_LAST = DATA[N - 1][0];
  /* SPARC Table 1, NGC 3198: L[3.6] = 38.279e9 L☉, R_disk = 3.14 kpc, M_HI = 10.869e9 M☉ */
  var L36 = 38.279e9;
  var RD = 3.14;
  var M_GAS = 1.33 * 10.869e9;            /* H I plus helium, as in SPARC's gas curve */
  var G = 4.30091e-6;                     /* kpc (km/s)² / M☉ */
  var H0 = 73 / 1000;                     /* km/s per kpc (73 km/s/Mpc, as SPARC) */
  var A_BULGE = 0.5;                      /* kpc */
  var V_TOP = 225;                       /* top of the plot, km/s (legend sits above 175) */
  var MYR_PER_SEC = 50;                   /* animation: 1 s on screen = 50 Myr */
  var KMS_KPC_TO_RAD_MYR = 1.02271e-3;    /* (km/s)/kpc in rad/Myr */

  var BOUNDS = {
    iso: [[0, 300], [0.1, 30]],
    nfw: [[10, 300], [1, 40]]
  };

  /* ── State ─────────────────────────────────────────────── */
  var ups = 0.5;          /* stellar M/L at 3.6 µm */
  var mBulge = 0;         /* 10¹⁰ M☉ */
  var halo = 'none';
  var P = { iso: [120, 5], nfw: [100, 10] };
  var showLight = false;
  var tMyr = 0;
  var stars = [];
  var probes = [];

  var COL = {
    era:    'oklch(0.68 0.22 20)',
    text:   'oklch(0.92 0 0)',
    muted:  'oklch(0.62 0 0)',
    faint:  'oklch(1 0 0 / 0.10)',
    grid:   'oklch(1 0 0 / 0.07)',
    gold:   'oklch(0.80 0.14 82)',
    teal:   'oklch(0.75 0.12 190)',
    blue:   'oklch(0.72 0.13 250)',
    violet: 'oklch(0.72 0.14 310)',
    bary:   'oklch(0.80 0.02 250)',
    data:   'oklch(0.95 0 0)'
  };

  /* ── Bessel functions (Abramowitz & Stegun 9.8.1–9.8.8) ─ */
  function besI0(x) {
    if (x < 3.75) {
      var t = (x / 3.75) * (x / 3.75);
      return 1 + t * (3.5156229 + t * (3.0899424 + t * (1.2067492 + t * (0.2659732 + t * (0.0360768 + t * 0.0045813)))));
    }
    var s = 3.75 / x;
    return Math.exp(x) / Math.sqrt(x) * (0.39894228 + s * (0.01328592 + s * (0.00225319 + s * (-0.00157565 + s * (0.00916281 +
      s * (-0.02057706 + s * (0.02635537 + s * (-0.01647633 + s * 0.00392377))))))));
  }
  function besI1(x) {
    if (x < 3.75) {
      var t = (x / 3.75) * (x / 3.75);
      return x * (0.5 + t * (0.87890594 + t * (0.51498869 + t * (0.15084934 + t * (0.02658733 + t * (0.00301532 + t * 0.00032411))))));
    }
    var s = 3.75 / x;
    return Math.exp(x) / Math.sqrt(x) * (0.39894228 + s * (-0.03988024 + s * (-0.00362018 + s * (0.00163801 + s * (-0.01031555 +
      s * (0.02282967 + s * (-0.02895312 + s * (0.01787654 - s * 0.00420059))))))));
  }
  function besK0(x) {
    if (x <= 2) {
      var y = x * x / 4;
      return -Math.log(x / 2) * besI0(x) + (-0.57721566 + y * (0.42278420 + y * (0.23069756 + y * (0.03488590 + y * (0.00262698 + y * (0.00010750 + y * 0.0000074))))));
    }
    var z = 2 / x;
    return Math.exp(-x) / Math.sqrt(x) * (1.25331414 + z * (-0.07832358 + z * (0.02189568 + z * (-0.01062446 + z * (0.00587872 + z * (-0.00251540 + z * 0.00053208))))));
  }
  function besK1(x) {
    if (x <= 2) {
      var y = x * x / 4;
      return Math.log(x / 2) * besI1(x) + (1 / x) * (1 + y * (0.15443144 + y * (-0.67278579 + y * (-0.18156897 + y * (-0.01919402 + y * (-0.00110404 + y * (-0.00004686)))))));
    }
    var z = 2 / x;
    return Math.exp(-x) / Math.sqrt(x) * (1.25331414 + z * (0.23498619 + z * (-0.03655620 + z * (0.01504268 + z * (-0.00780353 + z * (0.00325614 + z * (-0.00068245)))))));
  }

  /* ── Mass components: each returns v² in (km/s)² ───────── */
  function v2Disk(r, M, h) {
    if (r <= 0 || M <= 0) return 0;
    var y = r / (2 * h);
    return 2 * G * M / h * y * y * (besI0(y) * besK0(y) - besI1(y) * besK1(y));
  }
  function v2Bulge(r, M) { return M > 0 ? G * M * r / ((r + A_BULGE) * (r + A_BULGE)) : 0; }
  function v2Iso(r, vinf, rc) {
    if (r <= 0) return 0;
    var x = r / rc;
    return vinf * vinf * (1 - Math.atan(x) / x);
  }
  function muNFW(y) { return Math.log(1 + y) - y / (1 + y); }
  function r200(v200) { return v200 / (10 * H0); }
  function v2NFW(r, v200, c) {
    if (r <= 0) return 0;
    var x = r / r200(v200);
    return v200 * v200 * muNFW(c * x) / (x * muNFW(c));
  }
  function v2Halo(r, kind, p) {
    if (kind === 'iso') return v2Iso(r, p[0], p[1]);
    if (kind === 'nfw') return v2NFW(r, p[0], p[1]);
    return 0;
  }
  /* gas: SPARC's Vgas|Vgas| at the data radii, linear in between */
  function v2Gas(r) {
    if (r <= DATA[0][0]) return DATA[0][3] * Math.abs(DATA[0][3]) * r / DATA[0][0];
    for (var i = 1; i < N; i++) {
      if (r <= DATA[i][0]) {
        var a = DATA[i - 1], b = DATA[i];
        var f = (r - a[0]) / (b[0] - a[0]);
        return a[3] * Math.abs(a[3]) * (1 - f) + b[3] * Math.abs(b[3]) * f;
      }
    }
    var last = DATA[N - 1];
    return last[3] * Math.abs(last[3]) * R_LAST / r;
  }
  function v2Gasi(i) { return DATA[i][3] * Math.abs(DATA[i][3]); }

  function v2Baryons(r, gasV2) {
    return v2Disk(r, ups * L36, RD) + v2Bulge(r, mBulge * 1e10) + gasV2;
  }
  function vModelAt(i, kind, p) {
    var r = DATA[i][0];
    var v2 = v2Baryons(r, v2Gasi(i)) + v2Halo(r, kind, p);
    return Math.sqrt(Math.max(v2, 0));
  }

  function chi2(kind, p) {
    var c = 0, s2 = 0;
    for (var i = 0; i < N; i++) {
      var d = vModelAt(i, kind, p) - DATA[i][1];
      c += (d / DATA[i][2]) * (d / DATA[i][2]);
      s2 += d * d;
    }
    return { chi2: c, rms: Math.sqrt(s2 / N) };
  }

  /* ── Fit the two halo parameters (Nelder–Mead in a box) ─ */
  function clampP(kind, p) {
    var b = BOUNDS[kind];
    return [Math.min(b[0][1], Math.max(b[0][0], p[0])), Math.min(b[1][1], Math.max(b[1][0], p[1]))];
  }
  function nelderMead(f, x0, step, iters) {
    var n = 2, pts = [x0.slice(), [x0[0] + step[0], x0[1]], [x0[0], x0[1] + step[1]]];
    var fv = pts.map(f);
    for (var k = 0; k < iters; k++) {
      var idx = [0, 1, 2].sort(function (a, b) { return fv[a] - fv[b]; });
      pts = idx.map(function (i) { return pts[i]; }); fv = idx.map(function (i) { return fv[i]; });
      if (Math.abs(fv[2] - fv[0]) < 1e-10 * (1 + Math.abs(fv[0])) && k > 50) break;
      var c = [(pts[0][0] + pts[1][0]) / n, (pts[0][1] + pts[1][1]) / n];
      var xr = [c[0] + (c[0] - pts[2][0]), c[1] + (c[1] - pts[2][1])], fr = f(xr);
      if (fr < fv[0]) {
        var xe = [c[0] + 2 * (c[0] - pts[2][0]), c[1] + 2 * (c[1] - pts[2][1])], fe = f(xe);
        if (fe < fr) { pts[2] = xe; fv[2] = fe; } else { pts[2] = xr; fv[2] = fr; }
      } else if (fr < fv[1]) {
        pts[2] = xr; fv[2] = fr;
      } else {
        var xc = [c[0] + 0.5 * (pts[2][0] - c[0]), c[1] + 0.5 * (pts[2][1] - c[1])], fc = f(xc);
        if (fc < fv[2]) { pts[2] = xc; fv[2] = fc; }
        else {
          for (var j = 1; j < 3; j++) {
            pts[j] = [pts[0][0] + 0.5 * (pts[j][0] - pts[0][0]), pts[0][1] + 0.5 * (pts[j][1] - pts[0][1])];
            fv[j] = f(pts[j]);
          }
        }
      }
    }
    var best = fv[0] <= fv[1] && fv[0] <= fv[2] ? 0 : (fv[1] <= fv[2] ? 1 : 2);
    return { x: pts[best], f: fv[best] };
  }
  function fitHalo(kind) {
    var f = function (p) { return chi2(kind, clampP(kind, p)).chi2; };
    var starts = kind === 'iso' ? [[150, 5], [120, 2], [200, 10], [140, 1]] : [[120, 8], [100, 15], [150, 4], [200, 2]];
    var best = null;
    for (var s = 0; s < starts.length; s++) {
      var r = nelderMead(f, starts[s], kind === 'iso' ? [10, 1] : [10, 2], 4000);
      r = nelderMead(f, r.x, kind === 'iso' ? [2, 0.3] : [2, 0.5], 4000);
      if (!best || r.f < best.f) best = r;
    }
    return clampP(kind, best.x);
  }

  /* ── Readouts ──────────────────────────────────────────── */
  function nFree() { return halo === 'none' ? 0 : 2; }
  function stats() {
    var s = chi2(halo, P[halo] || [0, 0]);
    var nu = N - nFree();
    s.nu = nu; s.red = s.chi2 / nu;
    return s;
  }
  function sci(m) {
    var e = Math.floor(Math.log10(m));
    var map = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
    return (m / Math.pow(10, e)).toFixed(1) + ' × 10' + String(e).split('').map(function (c) { return map[c]; }).join('');
  }
  function haloText() {
    if (halo === 'iso') return 'pseudo-isothermal halo, v∞ = ' + P.iso[0].toFixed(1) + ' km/s, r_c = ' + P.iso[1].toFixed(2) + ' kpc';
    if (halo === 'nfw') return 'NFW halo, V₂₀₀ = ' + P.nfw[0].toFixed(1) + ' km/s, c = ' + P.nfw[1].toFixed(2) +
      ' (M₂₀₀ = ' + sci(Math.pow(P.nfw[0], 3) / (10 * G * H0)) + ' M☉, r₂₀₀ = ' + r200(P.nfw[0]).toFixed(0) + ' kpc)';
    return 'no halo';
  }
  function massText() {
    var r = R_LAST;
    var mStars = ups * L36 * (1 - (1 + r / RD) * Math.exp(-r / RD)) + mBulge * 1e10 * r * r / ((r + A_BULGE) * (r + A_BULGE));
    var t = 'Inside ' + r.toFixed(0) + ' kpc: stars ' + sci(mStars) + ' M☉, gas ' + sci(M_GAS) + ' M☉ (SPARC total)';
    if (halo !== 'none') t += ', halo ' + sci(v2Halo(r, halo, P[halo]) * r / G) + ' M☉';
    return t + '.';
  }
  /* smallest data radius beyond which the model lies below every point by more than its error */
  function radiusBelow() {
    var k = null;
    for (var i = N - 1; i >= 0; i--) {
      if (vModelAt(i, halo, P[halo] || [0, 0]) < DATA[i][1] - DATA[i][2]) k = i; else break;
    }
    return k === null ? null : DATA[k][0];
  }
  var lastStatus = '';
  function updateReadouts(note) {
    var s = stats();
    var fr = document.getElementById('fit-readout');
    var line = 'Stellar disk ' + sci(ups * L36) + ' M☉ (Υ★ × L at 3.6 µm). χ² = ' + s.chi2.toFixed(1) + ' for N = ' + N + ' points and ' + nFree() + ' adjustable halo parameters (ν = ' + s.nu + '), χ²/ν = ' +
      s.red.toFixed(2) + ', rms = ' + s.rms.toFixed(1) + ' km/s. Model: Υ★ = ' + ups.toFixed(2) +
      (mBulge > 0 ? ', bulge ' + mBulge.toFixed(1) + ' × 10¹⁰ M☉' : '') + ', ' + haloText() + '. ' + massText();
    if (fr) fr.textContent = line;
    var st = document.getElementById('sim-status');
    var msg;
    if (note) msg = note;
    else if (halo === 'none') {
      var rb = radiusBelow();
      msg = 'Visible matter only, Υ★ = ' + ups.toFixed(2) + ': ' + (rb !== null ? 'beyond ' + rb.toFixed(1) + ' kpc the model is below every observed point, by more than its error bar' : 'the model reaches the observed points') + ' (rms ' + s.rms.toFixed(0) + ' km/s). Add a halo.';
    }
    else msg = 'With the ' + (halo === 'iso' ? 'pseudo-isothermal' : 'NFW') + ' halo: χ²/ν = ' + s.red.toFixed(2) + ', rms ' + s.rms.toFixed(1) + ' km/s. Press "Fit the halo" for the best values at this Υ★.';
    if (st && msg !== lastStatus) { st.textContent = msg; lastStatus = msg; }
  }

  /* ── Galaxy view: tracers orbiting at the model speed ──── */
  function makeStars() {
    stars = [];
    var seed = 46;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var i = 0; i < 420; i++) {
      /* radius drawn from an exponential disk (Gamma(2) in r/R_d), plus a sparse outer gas disk */
      var r = i < 340 ? -RD * Math.log(rnd() * rnd()) : 8 + rnd() * 36;
      if (r > 44) { i--; continue; }
      stars.push({ r: r, th0: rnd() * 2 * Math.PI, a: 0.15 + rnd() * 0.5, gas: i >= 340, w: 0 });
    }
    probes = [18, 26, 30, 35, 42].map(function (i) { return { i: i, r: DATA[i][0], th0: 0 }; });
  }
  function vModelR(r) {
    return Math.sqrt(Math.max(v2Baryons(r, v2Gas(r)) + v2Halo(r, halo, P[halo] || [0, 0]), 0));
  }
  function updateOmegas() {
    for (var i = 0; i < stars.length; i++) stars[i].w = vModelR(stars[i].r) / stars[i].r * KMS_KPC_TO_RAD_MYR;
    for (var j = 0; j < probes.length; j++) {
      var p = probes[j];
      p.wObs = DATA[p.i][1] / p.r * KMS_KPC_TO_RAD_MYR;
      p.wMod = vModelAt(p.i, halo, P[halo] || [0, 0]) / p.r * KMS_KPC_TO_RAD_MYR;
    }
  }

  /* ── Layout and drawing ────────────────────────────────── */
  function layout() {
    var wide = W >= 600;
    if (wide) {
      var gs = Math.min(H - 30, Math.round(W * 0.40));
      return { wide: true, gx: 8 + gs / 2, gy: H / 2 + 6, gR: gs / 2 - 14,
        px0: gs + 58, px1: W - 14, py0: 34, py1: H - 40 };
    }
    var g = Math.min(W - 16, 290);
    return { wide: false, gx: W / 2, gy: g / 2 + 8, gR: g / 2 - 12,
      px0: 46, px1: W - 12, py0: g + 52, py1: H - 40 };
  }

  function label(txt, x, y, align) {
    var w = ctx.measureText(txt).width;
    var left = align === 'right' ? x - w : (align === 'center' ? x - w / 2 : x);
    left = Math.max(3, Math.min(W - w - 3, left));
    ctx.textAlign = 'left';
    ctx.fillText(txt, left, y);
  }

  function drawGalaxy(L) {
    var R = L.gR, cx = L.gx, cy = L.gy, k = R / 44;
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.5);
    g.addColorStop(0, 'oklch(0.85 0.06 82 / 0.30)');
    g.addColorStop(0.25, 'oklch(0.80 0.06 82 / 0.10)');
    g.addColorStop(1, 'oklch(0.80 0.06 82 / 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.5, 0, 2 * Math.PI); ctx.fill();

    ctx.strokeStyle = COL.grid;
    ctx.lineWidth = 1;
    ctx.font = '10px "DM Sans", sans-serif';
    for (var rr = 10; rr <= 40; rr += 10) {
      ctx.beginPath(); ctx.arc(cx, cy, rr * k, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = COL.muted;
      ctx.textAlign = 'left';
      ctx.fillText(rr + ' kpc', cx - rr * k * 0.707 - 30, cy + rr * k * 0.707 + 10);
    }
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], th = s.th0 + s.w * tMyr;
      var x = cx + s.r * k * Math.cos(th), y = cy - s.r * k * Math.sin(th);
      ctx.fillStyle = s.gas ? 'oklch(0.75 0.10 210 / ' + (s.a * 0.7).toFixed(2) + ')' : 'oklch(0.95 0.04 82 / ' + s.a.toFixed(2) + ')';
      ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
    }
    /* probe pairs: hollow = observed speed, filled = model speed */
    for (var j = 0; j < probes.length; j++) {
      var p = probes[j];
      var tO = p.th0 + p.wObs * tMyr, tM = p.th0 + p.wMod * tMyr;
      var rp = p.r * k;
      ctx.strokeStyle = 'oklch(1 0 0 / 0.16)';
      ctx.beginPath(); ctx.arc(cx, cy, rp, -tO, -tM, tM > tO); ctx.stroke();
      ctx.strokeStyle = COL.data;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cx + rp * Math.cos(tO), cy - rp * Math.sin(tO), 5, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = COL.era;
      ctx.beginPath(); ctx.arc(cx + rp * Math.cos(tM), cy - rp * Math.sin(tM), 3.6, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.lineWidth = 1;
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.fillStyle = COL.muted;
    ctx.textAlign = 'left';
    var top = cy - R - (L.wide ? 2 : 0);
    ctx.fillText('NGC 3198 face-on · t = ' + Math.round(tMyr) + ' Myr', Math.max(4, cx - R), Math.max(12, top));
    var by = cy + R + 4;
    if (L.wide) by = Math.min(H - 6, by + 10);
    ctx.strokeStyle = COL.data; ctx.lineWidth = 1.4;
    var lx = Math.max(10, cx - R + 4);
    ctx.beginPath(); ctx.arc(lx, by - 4, 4, 0, 2 * Math.PI); ctx.stroke();
    ctx.fillStyle = COL.muted;
    ctx.fillText('observed speed', lx + 8, by);
    var lx2 = lx + 8 + ctx.measureText('observed speed').width + 14;
    ctx.fillStyle = COL.era;
    ctx.beginPath(); ctx.arc(lx2, by - 4, 3.4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = COL.muted;
    ctx.fillText('model speed', lx2 + 8, by);
  }

  function xMap(L, r) { return L.px0 + (L.px1 - L.px0) * r / 46; }
  function yMap(L, v) { return L.py1 - (L.py1 - L.py0) * v / V_TOP; }

  function curve(L, fn, color, width, dash) {
    ctx.save();
    if (dash) ctx.setLineDash(dash);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (var k = 0; k <= 230; k++) {
      var r = 0.02 + 46 * k / 230;
      var v2 = fn(r);
      var v = v2 >= 0 ? Math.sqrt(v2) : -Math.sqrt(-v2);
      var x = xMap(L, r), y = yMap(L, Math.max(-5, Math.min(V_TOP + 60, v)));
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawPlot(L) {
    /* axes and grid */
    ctx.font = '10px "DM Sans", sans-serif';
    ctx.lineWidth = 1;
    for (var v = 0; v <= 200; v += 50) {
      var y = yMap(L, v);
      ctx.strokeStyle = COL.grid;
      ctx.beginPath(); ctx.moveTo(L.px0, y); ctx.lineTo(L.px1, y); ctx.stroke();
      ctx.fillStyle = COL.muted;
      label(String(v), L.px0 - 6, y + 3, 'right');
    }
    for (var r = 0; r <= 40; r += 10) {
      var x = xMap(L, r);
      ctx.strokeStyle = COL.grid;
      ctx.beginPath(); ctx.moveTo(x, L.py0); ctx.lineTo(x, L.py1); ctx.stroke();
      ctx.fillStyle = COL.muted;
      label(String(r), x, L.py1 + 13, 'center');
    }
    ctx.fillStyle = COL.muted;
    label('radius (kpc)', (L.px0 + L.px1) / 2, L.py1 + 27, 'center');
    ctx.save();
    ctx.translate(L.px0 - 34, (L.py0 + L.py1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('rotation speed (km/s)', 0, 0);
    ctx.restore();

    /* components */
    var pp = P[halo] || [0, 0];
    ctx.save(); ctx.beginPath(); ctx.rect(L.px0, yMap(L, 200) - 2, L.px1 - L.px0, L.py1 - yMap(L, 200) + 2); ctx.clip();
    curve(L, function (r) { return v2Gas(r); }, COL.teal, 1.3, [2, 3]);
    curve(L, function (r) { return v2Disk(r, ups * L36, RD); }, COL.gold, 1.3, [6, 4]);
    if (showLight) {
      curve(L, function (r) {
        if (r < DATA[0][0]) return 0;
        for (var i = 1; i < N; i++) if (r <= DATA[i][0]) {
          var a = DATA[i - 1], b = DATA[i], f = (r - a[0]) / (b[0] - a[0]);
          return ups * (a[4] * a[4] * (1 - f) + b[4] * b[4] * f);
        }
        return ups * DATA[N - 1][4] * DATA[N - 1][4] * R_LAST / r;
      }, 'oklch(0.80 0.14 82 / 0.65)', 1.2, [1, 3]);
    }
    if (mBulge > 0) curve(L, function (r) { return v2Bulge(r, mBulge * 1e10); }, COL.violet, 1.3, [4, 3]);
    if (halo !== 'none') curve(L, function (r) { return v2Halo(r, halo, pp); }, COL.blue, 1.5, [7, 4]);
    curve(L, function (r) { return v2Baryons(r, v2Gas(r)); }, COL.bary, 1.2, null);
    curve(L, function (r) { return v2Baryons(r, v2Gas(r)) + v2Halo(r, halo, pp); }, COL.era, 2.4, null);
    ctx.restore();

    /* observed points with error bars */
    for (var i = 0; i < N; i++) {
      var d = DATA[i], xx = xMap(L, d[0]);
      var y0 = yMap(L, Math.max(0, d[1] - d[2])), y1 = yMap(L, Math.min(V_TOP, d[1] + d[2]));
      ctx.strokeStyle = 'oklch(1 0 0 / 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xx, y0); ctx.lineTo(xx, y1); ctx.stroke();
      ctx.fillStyle = COL.data;
      ctx.beginPath(); ctx.arc(xx, yMap(L, d[1]), 2.3, 0, 2 * Math.PI); ctx.fill();
    }

    /* fit summary */
    var s = stats();
    ctx.font = (L.wide ? '12px' : '11px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.text;
    label('χ²/ν = ' + s.red.toFixed(2) + '   rms = ' + s.rms.toFixed(1) + ' km/s', L.px0, L.py0 - 18, 'left');
    ctx.fillStyle = COL.muted;
    ctx.font = '10px "DM Sans", sans-serif';
    label('points: observed, SPARC (cited) · lines: model', L.px0, L.py0 - 5, 'left');

    /* legend */
    var items = [[COL.era, 'total', null], [COL.bary, 'visible only', null], [COL.gold, 'stars (disk)', [6, 4]], [COL.teal, 'gas', [2, 3]]];
    if (mBulge > 0) items.push([COL.violet, 'bulge', [4, 3]]);
    if (halo !== 'none') items.push([COL.blue, 'halo', [7, 4]]);
    if (showLight) items.push(['oklch(0.80 0.14 82 / 0.65)', 'stars from light', [1, 3]]);
    var colW = (L.px1 - L.px0 - 8) / 3, ly0 = yMap(L, V_TOP) + 12;
    for (var k = 0; k < items.length; k++) {
      var lx = L.px0 + 6 + colW * (k % 3), ly = ly0 + 13 * Math.floor(k / 3);
      ctx.save();
      if (items[k][2]) ctx.setLineDash(items[k][2]);
      ctx.strokeStyle = items[k][0];
      ctx.lineWidth = k === 0 ? 2.2 : 1.4;
      ctx.beginPath(); ctx.moveTo(lx, ly - 3); ctx.lineTo(lx + 16, ly - 3); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = COL.muted;
      ctx.textAlign = 'left';
      ctx.fillText(items[k][1], lx + 20, ly);
    }
  }

  function draw() {
    if (!ctx || !W) return;
    ctx.clearRect(0, 0, W, H);
    var L = layout();
    drawGalaxy(L);
    drawPlot(L);
  }

  /* ── Loop ──────────────────────────────────────────────── */
  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.1);
    lastTs = ts;
    tMyr += dt * MYR_PER_SEC;
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function setPlayUI(on) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = on ? '⏸ Pause' : '▶ Play'; btn.dataset.state = on ? 'playing' : 'paused'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.toggle('is-running', on);
  }

  function start() {
    if (running) return;
    running = true;
    lastTs = null;
    setPlayUI(true);
    if (reducedMotion) { if (tMyr < 400) tMyr = 400; draw(); return; }   /* a still snapshot, no motion */
    rafId = requestAnimationFrame(loop);
  }
  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    setPlayUI(false);
  }
  function reset() {
    pause();
    tMyr = 0;
    draw();
    updateReadouts();
  }
  function destroy() {
    pause();
    window.removeEventListener('resize', onResize);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  window.SimAPI = {
    start: start, pause: pause, reset: reset, destroy: destroy,
    /* pure model functions, exposed so the numbers can be checked independently */
    model: {
      v2Disk: v2Disk, v2Iso: v2Iso, v2NFW: v2NFW, v2Bulge: v2Bulge,
      bessel: { I0: besI0, I1: besI1, K0: besK0, K1: besK1 },
      fit: function (kind, u) { var keep = ups; ups = u; var p = fitHalo(kind); var s = chi2(kind, p); ups = keep; return { p: p, chi2: s.chi2, rms: s.rms }; },
      chi2Baryons: function (u) { var keep = ups; ups = u; var s = chi2('none', [0, 0]); ups = keep; return s; }
    }
  };

  /* ── Controls ──────────────────────────────────────────── */
  function onResize() {
    if (!mountEl || !canvas) return;
    var rect = mountEl.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    W = Math.round(rect.width);
    H = W >= 600 ? 440 : Math.min(W - 16, 290) + 330;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function realign() {
    /* restart the probes together so the drift between observed and model speeds is clear */
    tMyr = 0;
    updateOmegas();
    if (reducedMotion && running) tMyr = 400;
    draw();
  }

  var HALO_LABELS = {
    iso: [['Halo v∞', ' km/s', 'Asymptotic speed of the pseudo-isothermal halo, km/s'], ['Core radius r_c', ' kpc', 'Core radius of the pseudo-isothermal halo, kpc']],
    nfw: [['Halo V₂₀₀', ' km/s', 'Circular speed of the NFW halo at r200, km/s'], ['Concentration c', '', 'Concentration of the NFW halo']]
  };
  var SL_RANGE = { iso: [[0, 300, 1], [0.1, 30, 0.1]], nfw: [[10, 300, 1], [1, 40, 0.1]] };

  function syncHaloControls() {
    var s1 = document.getElementById('halo1-slider'), s2 = document.getElementById('halo2-slider');
    var l1 = document.getElementById('halo1-name'), l2 = document.getElementById('halo2-name');
    var v1 = document.getElementById('halo1-val'), v2 = document.getElementById('halo2-val');
    var fit = document.getElementById('fit-btn');
    var kind = halo === 'none' ? 'iso' : halo;
    var on = halo !== 'none';
    [s1, s2].forEach(function (s, j) {
      if (!s) return;
      var rg = SL_RANGE[kind][j];
      s.min = rg[0]; s.max = rg[1]; s.step = rg[2];
      s.value = String(P[kind][j]);
      s.disabled = !on;
      s.setAttribute('aria-label', HALO_LABELS[kind][j][2]);
      s.setAttribute('aria-valuetext', on ? P[kind][j].toFixed(j ? 2 : 1) + HALO_LABELS[kind][j][1] : 'no halo selected');
      s.parentNode.style.opacity = on ? '' : '0.45';
    });
    if (l1) l1.textContent = HALO_LABELS[kind][0][0];
    if (l2) l2.textContent = HALO_LABELS[kind][1][0];
    if (v1) v1.textContent = on ? P[kind][0].toFixed(1) + HALO_LABELS[kind][0][1] : '—';
    if (v2) v2.textContent = on ? P[kind][1].toFixed(2) + HALO_LABELS[kind][1][1] : '—';
    var btns = document.querySelectorAll('[data-halo]');
    Array.prototype.forEach.call(btns, function (b) {
      var sel = b.getAttribute('data-halo') === halo;
      b.setAttribute('aria-pressed', sel ? 'true' : 'false');
      b.style.borderColor = sel ? 'var(--era-stop-color, var(--color-gold))' : '';
      b.style.color = sel ? 'var(--color-text-primary)' : '';
    });
    if (fit) fit.textContent = halo === 'none' ? 'Fit a pseudo-isothermal halo' : 'Fit the halo';
  }

  function changed(note) {
    realign();
    updateReadouts(note);
  }

  function setup() {
    mountEl = document.getElementById('sim-mount');
    if (!mountEl) return;
    makeStars();
    updateOmegas();
    canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Left: the galaxy NGC 3198 seen face-on, with tracer points orbiting at the observed and the model speeds. Right: its observed rotation curve with the model curve and its components.');
    mountEl.appendChild(canvas);
    ctx = canvas.getContext('2d');
    requestAnimationFrame(function () { onResize(); updateReadouts(); });
    window.addEventListener('resize', onResize);

    var us = document.getElementById('ups-slider'), uv = document.getElementById('ups-val');
    if (us) us.addEventListener('input', function () {
      ups = parseFloat(this.value);
      var txt = ups.toFixed(2);
      if (uv) uv.textContent = txt;
      us.setAttribute('aria-valuetext', ups.toFixed(2) + ' solar masses per solar luminosity, stellar disk ' + sci(ups * L36) + ' solar masses');
      changed();
    });
    var bs = document.getElementById('bulge-slider'), bv = document.getElementById('bulge-val');
    if (bs) bs.addEventListener('input', function () {
      mBulge = parseFloat(this.value);
      var txt = mBulge > 0 ? mBulge.toFixed(1) + ' × 10¹⁰ M☉' : 'none';
      if (bv) bv.textContent = txt;
      bs.setAttribute('aria-valuetext', mBulge > 0 ? mBulge.toFixed(1) + ' times ten to the ten solar masses' : 'no bulge');
      changed();
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-halo]'), function (b) {
      b.addEventListener('click', function () {
        halo = b.getAttribute('data-halo');
        syncHaloControls();
        changed();
      });
    });
    ['halo1-slider', 'halo2-slider'].forEach(function (id, j) {
      var s = document.getElementById(id);
      if (!s) return;
      s.addEventListener('input', function () {
        if (halo === 'none') return;
        P[halo][j] = parseFloat(this.value);
        syncHaloControls();
        changed();
      });
    });
    var fit = document.getElementById('fit-btn');
    if (fit) fit.addEventListener('click', function () {
      if (halo === 'none') halo = 'iso';
      P[halo] = fitHalo(halo);
      syncHaloControls();
      var s = stats();
      changed('Best ' + (halo === 'iso' ? 'pseudo-isothermal' : 'NFW') + ' halo for Υ★ = ' + ups.toFixed(2) + ': ' + haloText() + '; χ²/ν = ' + s.red.toFixed(2) + ', rms ' + s.rms.toFixed(1) + ' km/s.');
    });
    var lt = document.getElementById('light-toggle');
    if (lt) lt.addEventListener('click', function () {
      showLight = !showLight;
      lt.setAttribute('aria-pressed', showLight ? 'true' : 'false');
      lt.textContent = showLight ? 'Hide SPARC’s disk from the light' : 'Compare SPARC’s disk from the light';
      lt.style.borderColor = showLight ? 'var(--era-stop-color, var(--color-gold))' : '';
      draw();
    });
    syncHaloControls();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}());
