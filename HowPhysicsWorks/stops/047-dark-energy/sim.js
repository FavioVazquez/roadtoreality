/* ============================================================
   sim.js — Stop 047: Dark Energy
   Expansion-history calculator. The Friedmann equation
     H^2 = H0^2 [ Ωr a^-4 + Ωm a^-3 + Ωk a^-2 + ΩΛ ],  Ωk = 1 − Ωr − Ωm − ΩΛ
   gives a(t):
     - the past by quadrature, t(a) = ∫ da / (a H), when H^2 > 0 on (0, 1];
     - the future (and a bouncing past) by RK4 on the second-order form
       ä = −(H0^2 / 2) [ 2Ωr a^-3 + Ωm a^-2 − 2ΩΛ a ],
       which passes through turnarounds where ȧ = 0.
   Lower panel: distance modulus relative to an empty (Ω = 0) universe,
   against the 40 redshift bins of the Pantheon sample (Scolnic et al. 2018),
   with one additive offset fitted per model (it absorbs the supernova
   absolute magnitude and H0, which enter only in that combination).
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Constants ─────────────────────────────────────────── */
  var KMSMPC_PER_GYR = 1 / 977.7922;   /* 1 km/s/Mpc in 1/Gyr                          */
  var ORH2 = 4.1837e-5;                /* Ωr h^2: photons at 2.7255 K + 3.046 massless ν */
  var T_PAST = -16, T_FUT = 30;        /* plotted window, Gyr from today                */

  /* Pantheon binned (Scolnic et al. 2018), file Binned_data/lcparam_DS17f.txt: [zcmb, mb, dmb] */
  var SN = [
    [0.014,14.5700,0.0311],[0.0194,15.2280,0.0265],[0.0264,15.9341,0.0231],[0.0329,16.4218,0.0235],[0.0396,16.8364,0.0284],
    [0.0475,17.2346,0.0334],[0.056,17.5758,0.0321],[0.064,17.9105,0.0439],[0.0721,18.1780,0.0386],[0.0811,18.5544,0.0423],
    [0.0889,18.7007,0.0364],[0.1001,19.0388,0.0352],[0.1071,19.1720,0.0336],[0.1195,19.3711,0.0260],[0.1278,19.5555,0.0263],
    [0.1396,19.8186,0.0233],[0.1519,19.9445,0.0237],[0.1635,20.0643,0.0259],[0.1778,20.3389,0.0197],[0.1906,20.5047,0.0221],
    [0.2067,20.6854,0.0214],[0.2216,20.8610,0.0233],[0.2405,21.0518,0.0222],[0.2558,21.2038,0.0203],[0.2762,21.3636,0.0221],
    [0.2972,21.5790,0.0216],[0.3215,21.8133,0.0214],[0.3453,21.9666,0.0234],[0.3708,22.1429,0.0215],[0.4049,22.3799,0.0323],
    [0.4355,22.5579,0.0254],[0.4738,22.7974,0.0294],[0.5174,23.0012,0.0268],[0.5742,23.3004,0.0245],[0.6299,23.5036,0.0310],
    [0.724,23.8666,0.0270],[0.821,24.2446,0.0248],[0.9511,24.6411,0.0276],[1.2336,25.3040,0.0563],[1.6123,25.9260,0.0735]
  ];

  var COL = {
    era:    'oklch(0.68 0.22 20)',
    gold:   'oklch(0.78 0.14 82)',
    blue:   'oklch(0.75 0.12 250)',
    text:   'oklch(0.92 0 0)',
    muted:  'oklch(0.62 0 0)',
    dim:    'oklch(0.50 0 0)',
    faint:  'oklch(1 0 0 / 0.10)',
    grid:   'oklch(1 0 0 / 0.06)'
  };

  /* ── State ─────────────────────────────────────────────── */
  var Om = 0.315, OL = 0, H0 = 67.4, flat = true;
  var M;            /* current model */
  var REF = {};     /* reference models */
  var tPlay = 0;    /* animation time, Gyr from today */
  var HOLD = 1.5, holdT = 0;

  /* ── Cosmology ─────────────────────────────────────────── */
  function makeModel(om, ol, h0, isFlat) {
    var orad = ORH2 / Math.pow(h0 / 100, 2);
    if (isFlat) ol = 1 - om - orad;
    var ok = 1 - om - ol - orad;
    var m = { Om: om, OL: ol, Or: orad, Ok: ok, H0: h0, Hg: h0 * KMSMPC_PER_GYR };
    m.E2 = function (a) { return orad / (a * a * a * a) + om / (a * a * a) + ok / (a * a) + ol; };
    m.q0 = orad + om / 2 - ol;
    analyse(m);
    return m;
  }

  function analyse(m) {
    var i, a;
    /* Big Bang? H^2 must stay positive all the way back */
    m.bounce = null;
    for (i = 0; i <= 3000; i++) {
      a = Math.pow(10, -5 + 5 * i / 3000);
      if (m.E2(a) <= 0) { m.bounce = a; }
    }
    if (m.bounce !== null) {
      /* largest a < 1 with E2 <= 0: refine */
      var lo = m.bounce, hi = 1;
      for (i = 0; i < 60; i++) { var mid = (lo + hi) / 2; if (m.E2(mid) <= 0) lo = mid; else hi = mid; }
      m.bounce = hi;
    }
    /* age by quadrature, a = u^2 */
    m.age = null;
    if (m.bounce === null) {
      var N = 2000, s = 0;
      for (i = 0; i <= N; i++) {
        var u = i / N; a = u * u;
        var f = i === 0 ? 0 : 2 * u / (a * Math.sqrt(m.E2(a)));
        s += f * (i === 0 || i === N ? 1 : (i % 2 ? 4 : 2));
      }
      m.age = s / (3 * N) / m.Hg;
    }
    /* future turnaround: E2 = 0 at some a > 1 */
    m.amax = null;
    var prev = 1;
    for (i = 1; i <= 4000; i++) {
      a = Math.pow(10, 6 * i / 4000);
      if (m.E2(a) <= 0) {
        var l2 = prev, h2 = a;
        for (var k = 0; k < 60; k++) { var md = (l2 + h2) / 2; if (m.E2(md) > 0) l2 = md; else h2 = md; }
        m.amax = l2; break;
      }
      prev = a;
    }
    /* acceleration onset (ä = 0) in the past, if accelerating today */
    m.zacc = null;
    if (m.q0 < 0 && m.bounce === null) {
      var acc = function (x) { return m.OL * x - m.Om / (2 * x * x) - m.Or / (x * x * x); };
      var lo3 = 1e-4, hi3 = 1;
      if (acc(lo3) < 0) {
        for (i = 0; i < 80; i++) { var mm = (lo3 + hi3) / 2; if (acc(mm) < 0) lo3 = mm; else hi3 = mm; }
        m.zacc = 1 / hi3 - 1;
      }
    }
    /* fate */
    if (m.bounce !== null) m.fate = 'No Big Bang: run backwards, this universe stops shrinking at a = ' + m.bounce.toFixed(2) + ' and bounces';
    else if (m.amax !== null) m.fate = 'Stops expanding at a = ' + m.amax.toFixed(2) + ', then recollapses';
    else if (m.OL > 1e-9) m.fate = 'Expands forever' + (m.q0 < 0 ? ', accelerating now' : ', will accelerate later');
    else if (m.Ok > 1e-6) m.fate = 'Expands forever, slowing toward a constant coasting rate';
    else m.fate = 'Expands forever, ever more slowly';
    buildCurve(m);
    buildMu(m);
  }

  /* a(t) samples, t in Gyr from today */
  function buildCurve(m) {
    var pts = [], i;
    var Hg = m.Hg;
    function accel(a) { return -0.5 * Hg * Hg * (2 * m.Or / (a * a * a) + m.Om / (a * a) - 2 * m.OL * a); }
    function rk(a, v, dt, nmax, tlim) {
      var out = [], t = 0;
      for (var n = 0; n < nmax; n++) {
        var k1a = v, k1v = accel(a);
        var k2a = v + 0.5 * dt * k1v, k2v = accel(a + 0.5 * dt * k1a);
        var k3a = v + 0.5 * dt * k2v, k3v = accel(a + 0.5 * dt * k2a);
        var k4a = v + dt * k3v, k4v = accel(a + dt * k3a);
        a += dt / 6 * (k1a + 2 * k2a + 2 * k3a + k4a);
        v += dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
        t += dt;
        if (!(a > 0.004)) break;
        out.push([t, a]);
        if ((dt > 0 && t >= tlim) || (dt < 0 && t <= tlim)) break;
      }
      return out;
    }
    /* past */
    if (m.bounce === null) {
      var N = 400;
      for (i = 0; i <= N; i++) {
        var a = i / N; if (a === 0) a = 1e-6;
        /* t(a) - t0 = -∫_a^1 da/(aH) */
        var s = 0, n2 = 60;
        for (var j = 0; j <= n2; j++) {
          var x = a + (1 - a) * j / n2;
          var f = 1 / (x * Math.sqrt(m.E2(x)));
          s += f * (j === 0 || j === n2 ? 1 : (j % 2 ? 4 : 2));
        }
        s *= (1 - a) / (3 * n2) / Hg;
        pts.push([-s, a]);
      }
      pts[0] = [-m.age, 0];
    } else {
      var back = rk(1, Hg, -0.01, 20000, T_PAST - 1);
      back.reverse();
      pts = back;
      pts.push([0, 1]);
    }
    var fwd = rk(1, Hg, 0.02, 20000, T_FUT + 1);
    m.curve = pts.concat(fwd);
    m.crunch = (m.amax !== null && fwd.length && fwd[fwd.length - 1][0] < T_FUT) ? fwd[fwd.length - 1][0] : null;
  }

  function aAt(m, t) {
    var c = m.curve;
    if (t <= c[0][0]) return m.bounce === null ? 0 : c[0][1];
    for (var i = 1; i < c.length; i++) {
      if (c[i][0] >= t) { var f = (t - c[i - 1][0]) / (c[i][0] - c[i - 1][0]); return c[i - 1][1] + f * (c[i][1] - c[i - 1][1]); }
    }
    return null;
  }

  /* luminosity distances on a z grid, in units of c/H0 */
  var ZMAX = 1.7, NZ = 340;
  function buildMu(m) {
    var dl = [], chi = 0, ok = m.Ok, prevE = 1, valid = true;
    dl.push(0);
    for (var i = 1; i <= NZ; i++) {
      var z = ZMAX * i / NZ, a = 1 / (1 + z), e2 = m.E2(a);
      if (!(e2 > 0) || !valid) { valid = false; dl.push(null); continue; }
      var E = Math.sqrt(e2), zm = ZMAX * (i - 0.5) / NZ, em = Math.sqrt(Math.max(1e-12, m.E2(1 / (1 + zm))));
      chi += ZMAX / NZ / 6 * (1 / prevE + 4 / em + 1 / E);
      prevE = E;
      var r;
      if (Math.abs(ok) < 1e-8) r = chi;
      else if (ok > 0) r = Math.sinh(Math.sqrt(ok) * chi) / Math.sqrt(ok);
      else r = Math.sin(Math.sqrt(-ok) * chi) / Math.sqrt(-ok);
      dl.push(r > 0 ? (1 + z) * r : null);
    }
    m.dl = dl;
    /* fit the offset to the binned data */
    var sw = 0, swr = 0, used = [];
    for (i = 0; i < SN.length; i++) {
      var d = dlAt(m, SN[i][0]);
      if (d === null) continue;
      var w = 1 / (SN[i][2] * SN[i][2]);
      sw += w; swr += w * (SN[i][1] - 5 * Math.log(d) / Math.LN10);
      used.push(i);
    }
    m.offset = sw ? swr / sw : null;
    var c2 = 0;
    for (i = 0; i < used.length; i++) {
      var k = used[i], r2 = (SN[k][1] - 5 * Math.log(dlAt(m, SN[k][0])) / Math.LN10 - m.offset) / SN[k][2];
      c2 += r2 * r2;
    }
    m.chi2 = c2; m.nfit = used.length;
  }
  function dlAt(m, z) {
    var x = z / ZMAX * NZ, i = Math.floor(x);
    if (i >= NZ) return m.dl[NZ];
    var a = m.dl[i], b = m.dl[i + 1];
    if (a === null || b === null) return null;
    return a + (b - a) * (x - i);
  }
  function dlEmpty(z) { return z * (1 + z / 2); }
  function dmu(m, z) { var d = dlAt(m, z); return d === null || z === 0 ? (z === 0 ? 0 : null) : 5 * Math.log(d / dlEmpty(z)) / Math.LN10; }

  /* ── Drawing helpers ───────────────────────────────────── */
  function niceStep(range, n) {
    var raw = range / n, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), q = raw / p;
    return (q < 1.5 ? 1 : q < 3.5 ? 2 : q < 7.5 ? 5 : 10) * p;
  }
  function fmt(v, step) {
    var dec = Math.max(0, -Math.floor(Math.log(step) / Math.LN10 + 1e-9));
    var s = Number(v.toFixed(dec)).toString();
    return s.replace('-', '−');
  }
  function frame(B, xmin, xmax, ymin, ymax, xlab, ylab, xfmt) {
    var sx = function (x) { return B.x0 + (x - xmin) / (xmax - xmin) * (B.x1 - B.x0); };
    var sy = function (y) { return B.y1 - (y - ymin) / (ymax - ymin) * (B.y1 - B.y0); };
    var narrow = W < 520, v;
    ctx.font = (narrow ? '10px' : '11px') + ' "DM Sans", sans-serif';
    ctx.lineWidth = 1;
    var xs = niceStep(xmax - xmin, narrow ? 5 : 8), ys = niceStep(ymax - ymin, 4);
    ctx.textAlign = 'center'; ctx.fillStyle = COL.muted;
    for (v = Math.ceil(xmin / xs) * xs; v <= xmax + 1e-9; v += xs) {
      ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.moveTo(sx(v), B.y0); ctx.lineTo(sx(v), B.y1); ctx.stroke();
      ctx.fillText(xfmt ? xfmt(v) : fmt(v, xs), sx(v), B.y1 + 13);
    }
    ctx.textAlign = 'right';
    for (v = Math.ceil(ymin / ys) * ys; v <= ymax + 1e-9; v += ys) {
      ctx.strokeStyle = Math.abs(v) < 1e-9 ? COL.faint : COL.grid;
      ctx.beginPath(); ctx.moveTo(B.x0, sy(v)); ctx.lineTo(B.x1, sy(v)); ctx.stroke();
      ctx.fillText(fmt(v, ys), B.x0 - 5, sy(v) + 3.5);
    }
    ctx.strokeStyle = COL.faint; ctx.strokeRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0);
    ctx.textAlign = 'center'; ctx.fillStyle = COL.muted;
    ctx.fillText(xlab, (B.x0 + B.x1) / 2, B.y1 + 28);
    ctx.save(); ctx.translate(B.x0 - (narrow ? 34 : 40), (B.y0 + B.y1) / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText(ylab, 0, 0); ctx.restore();
    return { sx: sx, sy: sy };
  }
  function polyline(pts, sx, sy, col, width, dash) {
    ctx.strokeStyle = col; ctx.lineWidth = width; ctx.setLineDash(dash || []);
    ctx.beginPath();
    var started = false;
    for (var i = 0; i < pts.length; i++) {
      if (pts[i] === null) { started = false; continue; }
      var X = sx(pts[i][0]), Y = sy(pts[i][1]);
      if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
    }
    ctx.stroke(); ctx.setLineDash([]);
  }

  /* ── Panels ────────────────────────────────────────────── */
  function layout() {
    var narrow = W < 520;
    var l = narrow ? 50 : 58, r = 12;
    var top1 = narrow ? 66 : 58, h1 = Math.round((H - top1 - 40 - 64) * 0.5);
    var top2 = top1 + h1 + 64;
    return { narrow: narrow, a: { x0: l, x1: W - r, y0: top1, y1: top1 + h1 }, m: { x0: l, x1: W - r, y0: top2, y1: H - 40 } };
  }

  function drawExpansion(L) {
    var B = L.a, narrow = L.narrow;
    var ax = frame(B, T_PAST, T_FUT, 0, 3, 'Time from today (billion years)', 'Scale factor a', function (v) { return v === 0 ? 'now' : (v > 0 ? '+' : '−') + Math.abs(v); });
    ctx.save(); ctx.beginPath(); ctx.rect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0); ctx.clip();
    polyline(REF.eds.curve, ax.sx, ax.sy, COL.dim, 1.2, [3, 4]);
    polyline(REF.empty.curve, ax.sx, ax.sy, COL.dim, 1.2, [1, 3]);
    polyline(REF.planck.curve, ax.sx, ax.sy, COL.gold, 1.4, [6, 5]);
    polyline(M.curve, ax.sx, ax.sy, COL.era, 2.4);
    /* today */
    ctx.strokeStyle = COL.faint; ctx.beginPath(); ctx.moveTo(ax.sx(0), B.y0); ctx.lineTo(ax.sx(0), B.y1); ctx.stroke();
    /* animated marker */
    var aNow = aAt(M, tPlay);
    if (aNow !== null) {
      ctx.fillStyle = COL.text;
      ctx.beginPath(); ctx.arc(ax.sx(tPlay), ax.sy(aNow), 4.5, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.restore();
    /* inset: a patch of galaxies whose spacing is a(t) */
    var gs = narrow ? 52 : 66, gx = B.x0 + 8, gy = B.y0 + 8;
    ctx.fillStyle = 'oklch(0.09 0 0 / 0.85)'; ctx.fillRect(gx, gy, gs, gs);
    ctx.strokeStyle = COL.faint; ctx.strokeRect(gx, gy, gs, gs);
    var sp = (aNow === null ? 0 : aNow) * gs / 4.2;
    ctx.fillStyle = COL.blue;
    for (var i = -3; i <= 3; i++) for (var j = -3; j <= 3; j++) {
      var px = gx + gs / 2 + i * sp, py = gy + gs / 2 + j * sp;
      if (px > gx + 2 && px < gx + gs - 2 && py > gy + 2 && py < gy + gs - 2) { ctx.beginPath(); ctx.arc(px, py, 1.6, 0, 2 * Math.PI); ctx.fill(); }
    }
    /* legend */
    ctx.font = (narrow ? '10px' : '11px') + ' "DM Sans", sans-serif';
    ctx.textAlign = 'right';
    var lx = B.x1 - 6, ly = B.y0 + 14, lh = 13;
    ctx.fillStyle = COL.era; ctx.fillText('your model', lx, ly);
    ctx.fillStyle = COL.gold; ctx.fillText('Planck 2018 ΛCDM', lx, ly + lh);
    ctx.fillStyle = COL.dim; ctx.fillText('matter only (Ωm = 1)  ·  empty', lx, ly + 2 * lh);
  }

  function drawMu(L) {
    var B = L.m, narrow = L.narrow;
    var ylo = -0.8, yhi = 0.4, i0, d0;
    for (i0 = 1; i0 <= NZ; i0 += 4) { d0 = dmu(M, ZMAX * i0 / NZ); if (d0 !== null) { yhi = Math.max(yhi, d0 + 0.1); ylo = Math.min(ylo, d0 - 0.1); } }
    if (M.offset !== null) for (i0 = 0; i0 < SN.length; i0++) { d0 = SN[i0][1] - M.offset - 5 * Math.log(dlEmpty(SN[i0][0])) / Math.LN10; yhi = Math.max(yhi, d0 + 0.1); ylo = Math.min(ylo, d0 - 0.1); }
    yhi = Math.min(yhi, 3); ylo = Math.max(ylo, -3);
    var ax = frame(B, 0, ZMAX, ylo, yhi, 'Redshift z', 'Δμ vs empty (mag)');
    ctx.save(); ctx.beginPath(); ctx.rect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0); ctx.clip();
    function curve(m) {
      var p = [];
      for (var i = 1; i <= NZ; i++) { var z = ZMAX * i / NZ, d = dmu(m, z); p.push(d === null ? null : [z, d]); }
      p.unshift([0, 0]);
      return p;
    }
    polyline(curve(REF.eds), ax.sx, ax.sy, COL.dim, 1.2, [3, 4]);
    polyline(curve(REF.planck), ax.sx, ax.sy, COL.gold, 1.4, [6, 5]);
    polyline(curve(M), ax.sx, ax.sy, COL.era, 2.4);
    if (M.offset !== null) {
      for (var i = 0; i < SN.length; i++) {
        var y = SN[i][1] - M.offset - 5 * Math.log(dlEmpty(SN[i][0])) / Math.LN10;
        var X = ax.sx(SN[i][0]);
        ctx.strokeStyle = COL.text; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X, ax.sy(y - SN[i][2])); ctx.lineTo(X, ax.sy(y + SN[i][2])); ctx.stroke();
        ctx.fillStyle = COL.text; ctx.beginPath(); ctx.arc(X, ax.sy(y), narrow ? 2.2 : 2.6, 0, 2 * Math.PI); ctx.fill();
      }
    }
    ctx.restore();
    ctx.font = (narrow ? '10px' : '11px') + ' "DM Sans", sans-serif';
    ctx.textAlign = 'left'; ctx.fillStyle = COL.muted;
    ctx.fillText('fainter (farther) than empty ↑', B.x0 + 6, B.y0 + 13);
    ctx.fillText('brighter (nearer) ↓', B.x0 + 6, B.y1 - 6);
    ctx.textAlign = 'right';
    ctx.fillText('Pantheon 2018, 40 bins · χ² ' + (M.offset === null ? '—' : M.chi2.toFixed(0)) + ' (stat. only)', B.x1, B.y0 - 8);
  }

  function drawReadout(L) {
    var narrow = L.narrow, x = 14, y = 20;
    ctx.textAlign = 'left';
    ctx.font = (narrow ? '12px' : '13px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.text;
    var line1 = 'Ωm ' + M.Om.toFixed(3) + '  ΩΛ ' + M.OL.toFixed(3) + '  Ωk ' + (Math.abs(M.Ok) < 5e-4 ? '0' : M.Ok.toFixed(3)).replace('-', '−') + '  ·  age ' + (M.age === null ? '—' : M.age.toFixed(2) + ' Gyr');
    ctx.fillText(line1, x, y);
    ctx.font = (narrow ? '10.5px' : '11.5px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = M.q0 < 0 ? COL.era : COL.muted;
    var t = M.fate;
    if (narrow && t.length > 52) t = t.slice(0, 50) + '…';
    ctx.fillText(t, x, y + 16);
    if (tPlay !== 0 && running) {
      var aNow = aAt(M, tPlay);
      ctx.textAlign = 'right'; ctx.fillStyle = COL.muted;
      ctx.fillText((tPlay >= 0 ? '+' : '−') + Math.abs(tPlay).toFixed(1) + ' Gyr, a = ' + (aNow === null ? '—' : aNow.toFixed(2)), L.a.x1 - 6, L.a.y1 - 8);
    }
  }

  function draw() {
    if (!ctx || !W) return;
    ctx.clearRect(0, 0, W, H);
    var L = layout();
    drawExpansion(L);
    drawMu(L);
    drawReadout(L);
  }

  /* ── DOM readouts ──────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function setText(id, s) { var e = $(id); if (e) e.textContent = s; }
  function updateReadouts() {
    setText('om-val', M.Om.toFixed(3));
    setText('ol-val', M.OL.toFixed(3));
    setText('h0-val', H0.toFixed(1) + ' km/s/Mpc');
    setText('age-out', M.age === null ? 'no Big Bang' : M.age.toFixed(2) + ' billion years');
    setText('q0-out', M.q0.toFixed(3).replace('-', '−') + (M.q0 < 0 ? ' (accelerating)' : ' (decelerating)'));
    setText('ok-out', (Math.abs(M.Ok) < 5e-4 ? '0 (flat)' : M.Ok.toFixed(3).replace('-', '−') + (M.Ok > 0 ? ' (open)' : ' (closed)')));
    setText('zacc-out', M.zacc === null ? '—' : 'z = ' + M.zacc.toFixed(2));
    setText('chi-out', M.offset === null ? '—' : M.chi2.toFixed(1) + ' for ' + M.nfit + ' bins');
    setText('fate-out', M.fate);
    $('om-slider').setAttribute('aria-valuetext', 'Omega matter ' + M.Om.toFixed(3));
    $('ol-slider').setAttribute('aria-valuetext', 'Omega lambda ' + M.OL.toFixed(3));
    $('h0-slider').setAttribute('aria-valuetext', H0.toFixed(1) + ' kilometres per second per megaparsec');
    var fb = $('flat-btn');
    fb.setAttribute('aria-pressed', flat ? 'true' : 'false');
    fb.textContent = flat ? 'Flat: on (ΩΛ follows Ωm)' : 'Flat: off (curvature allowed)';
    $('ol-slider').disabled = flat;
    if (flat) $('ol-slider').value = M.OL.toFixed(3);
  }

  function recompute() {
    M = makeModel(Om, flat ? 0 : OL, H0, flat);
    if (flat) OL = M.OL;
    updateReadouts();
  }

  function setStatus(txt) { var st = $('sim-status'); if (st) st.textContent = txt; }

  /* ── Animation ─────────────────────────────────────────── */
  var SPEED = 7;   /* Gyr per second */
  function startT() {
    if (M.bounce === null) return Math.max(T_PAST, -M.age);
    return T_PAST;
  }
  function update(dt) {
    var end = M.crunch !== null ? M.crunch : T_FUT;
    if (tPlay >= end) {
      holdT += dt;
      if (holdT > HOLD) { holdT = 0; tPlay = startT(); }
      return;
    }
    tPlay = Math.min(end, tPlay + SPEED * dt);
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
    if (btn) { btn.textContent = playing ? '⏸ Pause' : '▶ Play'; btn.dataset.state = playing ? 'playing' : 'paused'; btn.setAttribute('aria-label', playing ? 'Pause the expansion' : 'Play the expansion history'); }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.toggle('is-running', playing);
  }
  function start() {
    if (running) return;
    setPlayBtn(true);
    if (reducedMotion) { tPlay = 0; draw(); return; }
    if (tPlay === 0) tPlay = startT();
    running = true; lastTs = null;
    rafId = requestAnimationFrame(loop);
  }
  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    setPlayBtn(false);
  }
  function reset() {
    pause();
    tPlay = 0; holdT = 0;
    draw();
  }
  function destroy() {
    pause();
    window.removeEventListener('resize', onResize);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }
  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  /* ── Controls ──────────────────────────────────────────── */
  function describe() {
    if (M.bounce !== null) setStatus('This combination has no Big Bang: going back in time the expansion turns around. Supernovae at high redshift rule it out.');
    else if (M.amax !== null) setStatus('Enough matter to stop the expansion: this universe recollapses. Its supernovae would look brighter than observed.');
    else if (M.q0 < 0) setStatus('Accelerating today: distant supernovae look fainter than in an empty universe. Acceleration began at z ≈ ' + (M.zacc === null ? '?' : M.zacc.toFixed(2)) + '.');
    else setStatus('Decelerating today: distant supernovae would look brighter than in an empty universe, which is not what is observed.');
  }
  function preset(om, ol, h0, isFlat) {
    Om = om; OL = ol; H0 = h0; flat = isFlat;
    $('om-slider').value = Om; $('ol-slider').value = OL; $('h0-slider').value = H0;
    recompute(); describe(); draw();
  }
  function bind() {
    $('om-slider').addEventListener('input', function () { Om = parseFloat(this.value); recompute(); describe(); draw(); });
    $('ol-slider').addEventListener('input', function () { OL = parseFloat(this.value); recompute(); describe(); draw(); });
    $('h0-slider').addEventListener('input', function () { H0 = parseFloat(this.value); recompute(); draw(); });
    $('flat-btn').addEventListener('click', function () { flat = !flat; if (!flat) OL = M.OL; recompute(); describe(); draw(); });
    $('preset-planck').addEventListener('click', function () { preset(0.315, 0, 67.4, true); });
    $('preset-1999').addEventListener('click', function () { preset(0.28, 0, 67.4, true); });
    $('preset-matter').addEventListener('click', function () { preset(1 - ORH2 / Math.pow(0.674, 2), 0, 67.4, false); });   /* flat: Ωm + Ωr = 1 */
    $('preset-empty').addEventListener('click', function () { preset(0, 0, 67.4, false); });
    $('preset-closed').addEventListener('click', function () { preset(3, 0, 67.4, false); });
  }

  /* ── Setup ─────────────────────────────────────────────── */
  function onResize() {
    if (!mountEl || !canvas) return;
    var rect = mountEl.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    W = Math.round(rect.width);
    H = W < 520 ? 660 : 640;
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
    REF.planck = makeModel(0.315, 0, 67.4, true);
    REF.eds = makeModel(1 - ORH2 / Math.pow(0.674, 2), 0, 67.4, false);   /* flat: Ωm + Ωr = 1 */
    REF.empty = makeModel(0, 0, 67.4, false);
    recompute();
    canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Upper panel: the scale factor of the universe against time for your choice of matter and dark energy. Lower panel: supernova distance moduli relative to an empty universe, with your model.');
    mountEl.appendChild(canvas);
    ctx = canvas.getContext('2d');
    bind();
    describe();
    requestAnimationFrame(function () { onResize(); });
    window.addEventListener('resize', onResize);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
}());
