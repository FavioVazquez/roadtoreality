/* ============================================================
   sim.js — Stop 045: Black Holes
   Light rays past a Schwarzschild black hole.
   Units: G = c = 1 and M = 1, so lengths are in GM/c²
   (the Schwarzschild radius r_s = 2). The orbit of a light
   ray, with u = 1/r and φ the polar angle, obeys the exact
   null-geodesic equation (Binet form)
       d²u/dφ² = −u + 3u²        (i.e. −u + 3GMu²/c²)
   integrated with fourth-order Runge–Kutta in φ from u = 0
   (the ray arrives from infinity), du/dφ = 1/b.
   A ray is captured when u passes 1/3 (the photon sphere,
   r = 3GM/c²) while still moving inward; that happens exactly
   when b < b_c = √27 GM/c².
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false;
  var rafId = null;
  var lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Constants (lengths in GM/c²) ───────────────────────── */
  var R_S = 2;                      /* Schwarzschild radius            */
  var R_PH = 3;                     /* photon sphere                   */
  var B_C = Math.sqrt(27);          /* critical impact parameter       */
  var DEG = 180 / Math.PI;

  /* Physical scales. GM values: IAU 2015 Resolution B3 nominal
     constants (Sun, Earth). Sgr A*: mass ~4×10⁶ M☉ (EHT 2022),
     distance 8178 pc (GRAVITY 2019). M87*: 6.5×10⁹ M☉ at 16.8 Mpc
     (EHT 2019). */
  var C_LIGHT = 299792458;              /* m/s                           */
  var GM_SUN = 1.3271244e20;            /* m³/s², IAU 2015 nominal       */
  var GM_EARTH = 3.986004e14;           /* m³/s², IAU 2015 nominal       */
  var PC = 3.0856775814913673e16;       /* m                             */
  var AU = 1.495978707e11;              /* m                             */
  var UAS = Math.PI / 180 / 3600 / 1e6; /* rad per microarcsecond        */
  var BODIES = {
    sun:   { name: 'the Sun', gm: GM_SUN },
    earth: { name: 'the Earth', gm: GM_EARTH },
    sgra:  { name: 'Sgr A*', gm: 4.0e6 * GM_SUN, dist: 8178 * PC, ring: '51.8 ± 2.3 µas', approx: true },
    m87:   { name: 'M87*', gm: 6.5e9 * GM_SUN, dist: 16.8e6 * PC, ring: '42 ± 3 µas' }
  };

  /* ── State ─────────────────────────────────────────────── */
  var bRs = 3.0;          /* impact parameter in units of r_s */
  var beamOn = false;
  var bodyKey = null;
  var ray = null;         /* traced single ray */
  var beam = null;        /* traced beam of rays */
  var tAnim = 0;          /* seconds since the current shot started */
  var HOLD = 1.4;         /* pause at the end of a shot before re-firing */

  var COL = {
    era:     'oklch(0.68 0.22 20)',
    eraDim:  'oklch(0.68 0.22 20 / 0.45)',
    gold:    'oklch(0.80 0.14 82)',
    goldDim: 'oklch(0.80 0.14 82 / 0.55)',
    text:    'oklch(0.92 0 0)',
    muted:   'oklch(0.62 0 0)',
    faint:   'oklch(1 0 0 / 0.12)',
    ray:     'oklch(0.88 0.06 230)',
    rayDim:  'oklch(0.88 0.06 230 / 0.55)',
    capt:    'oklch(0.62 0.16 25 / 0.75)',
    teal:    'oklch(0.75 0.12 190)'
  };

  /* ── Physics ───────────────────────────────────────────── */
  /* Trace one ray with impact parameter b (GM/c² units).
     Returns the orbit as (φ, u) samples plus the outcome. */
  function traceRay(b, opts) {
    opts = opts || {};
    var h = opts.h || 0.002;
    var maxPhi = opts.maxPhi || 12 * Math.PI;
    var keep = opts.keep !== false;
    var phis = [], us = [];
    if (b < 1e-9) {
      /* head-on: straight radial fall along the axis */
      return { b: b, phis: [0, 0], us: [1e-4, 0.5], captured: true, phiEnd: 0, radial: true };
    }
    var phi = 0, u = 0, w = 1 / b;
    var captured = false, phiEnd = null, orbiting = false;
    var uMax = 0;
    if (keep) { phis.push(0); us.push(0); }
    for (var n = 0; n < 2e6; n++) {
      /* RK4 for u' = w, w' = −u + 3u² */
      var k1u = w,                 k1w = -u + 3 * u * u;
      var u2 = u + 0.5 * h * k1u,  w2 = w + 0.5 * h * k1w;
      var k2u = w2,                k2w = -u2 + 3 * u2 * u2;
      var u3 = u + 0.5 * h * k2u,  w3 = w + 0.5 * h * k2w;
      var k3u = w3,                k3w = -u3 + 3 * u3 * u3;
      var u4 = u + h * k3u,        w4 = w + h * k3w;
      var k4u = w4,                k4w = -u4 + 3 * u4 * u4;
      var uN = u + h / 6 * (k1u + 2 * k2u + 2 * k3u + k4u);
      var wN = w + h / 6 * (k1w + 2 * k2w + 2 * k3w + k4w);
      var phiN = phi + h;
      if (uN > uMax) uMax = uN;
      if (!captured && uN > 1 / 3 && wN > 0) captured = true;
      if (uN >= 0.5) {
        /* reached the horizon: interpolate to u = 1/2 */
        var f = (0.5 - u) / (uN - u);
        phiEnd = phi + f * h;
        if (keep) { phis.push(phiEnd); us.push(0.5); }
        captured = true;
        break;
      }
      if (uN <= 0 && wN < 0) {
        /* back at infinity: u'' = 0 at u = 0, so linear interpolation is accurate */
        phiEnd = phi + h * u / (u - uN);
        if (keep) { phis.push(phiEnd); us.push(0); }
        break;
      }
      phi = phiN; u = uN; w = wN;
      if (keep) { phis.push(phi); us.push(u); }
      if (phi > maxPhi) { orbiting = true; phiEnd = phi; break; }
    }
    return {
      b: b, phis: phis, us: us, captured: captured, orbiting: orbiting,
      phiEnd: phiEnd, uMax: uMax,
      deflection: (!captured && !orbiting) ? phiEnd - Math.PI : null
    };
  }

  /* Closest approach for an escaping ray: largest root of
     r³ − b² r + 2b² = 0 (from b² = r³/(r − 2)), b > b_c. */
  function closestApproach(b) {
    if (b <= B_C) return null;
    var p = b * b;
    /* trigonometric solution of the depressed cubic r³ − p r + 2p = 0 */
    var m = 2 * Math.sqrt(p / 3);
    var arg = (3 * 2 * p / (-p * m)) ;          /* 3q/(p'm) with p' = −p, q = 2p */
    arg = Math.max(-1, Math.min(1, arg));
    var th = Math.acos(arg) / 3;
    return m * Math.cos(th);
  }

  /* Weak-field deflection 4GM/(c² b) and the next term of the
     series, (15π/4)(GM/(c² b))² (Keeton & Petters 2005). */
  function weakField(b) { return 4 / b; }
  function secondOrder(b) { return 4 / b + 15 * Math.PI / 4 / (b * b); }

  /* Capture threshold found from the integrator alone (bisection). */
  function captureThreshold(tol) {
    var lo = 4.5, hi = 6.0;
    tol = tol || 1e-10;
    while (hi - lo > tol) {
      var mid = 0.5 * (lo + hi);
      var r = traceRay(mid, { keep: false, maxPhi: 80 });
      if (r.captured) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
  }

  /* ── Geometry for drawing ─────────────────────────────── */
  /* A ray coming in from the left at height +b (moving +x).
     Position angle θ = π − φ, so x = −r cos φ, y = r sin φ. */
  function toXY(rec, sign) {
    var pts = [];
    if (rec.radial) {
      pts.push([-1e4, 0], [-R_S, 0]);
      return pts;
    }
    for (var i = 0; i < rec.phis.length; i++) {
      var u = rec.us[i];
      if (u < 1e-4) continue;             /* beyond 10⁴ GM/c²: straight line */
      var r = 1 / u, p = rec.phis[i];
      pts.push([-r * Math.cos(p), sign * r * Math.sin(p)]);
    }
    /* extend the arriving and departing straight lines */
    if (pts.length) {
      var b = rec.b;
      pts.unshift([-1e4, sign * b]);
      if (!rec.captured && !rec.orbiting) {
        var pe = rec.phiEnd;
        /* outgoing asymptote direction: continues at angle φ_end */
        var last = pts[pts.length - 1];
        pts.push([last[0] - 1e4 * Math.cos(pe), last[1] + sign * 1e4 * Math.sin(pe)]);
      }
    }
    return pts;
  }

  /* far rays: frame the band between the hole and the ray, so the small bend is visible */
  function farMode() { return !beamOn && bRs > 6; }
  function viewRadius() {
    if (beamOn) return 8.5 * R_S;
    if (farMode()) return 0.8 * bRs * R_S;
    return Math.max(9 * R_S, 1.45 * bRs * R_S);
  }

  function layout() {
    var narrow = W < 520;
    var top = narrow ? 86 : 0;
    var bottom = narrow ? 52 : 40;
    var cx = W / 2;
    var half = Math.min(W / 2 - 8, (H - top - bottom) / 2);
    var scale = half / viewRadius();
    var cy = top + (H - top - bottom) / 2 + (farMode() ? 0.6 * bRs * R_S * scale : 0);
    return { cx: cx, cy: cy, scale: scale, top: top, bottom: bottom, narrow: narrow };
  }

  /* Convert a ray to screen points, clipped to the visible region,
     with cumulative length for animation. */
  function screenPath(pts, L) {
    var out = [], cum = [];
    var xMax = W / 2 + 40, yMax = H;
    var started = false, total = 0;
    for (var i = 0; i < pts.length; i++) {
      var sx = L.cx + pts[i][0] * L.scale, sy = L.cy - pts[i][1] * L.scale;
      var inside = Math.abs(sx - L.cx) < xMax && Math.abs(sy - L.cy) < yMax;
      if (!started) {
        if (!inside) {
          /* keep the last outside point as the entry point, clipped to x = −xMax */
          var nx = (i + 1 < pts.length) ? pts[i + 1] : null;
          if (nx) {
            var nsx = L.cx + nx[0] * L.scale;
            if (Math.abs(nsx - L.cx) < xMax) {
              var ny = L.cy - nx[1] * L.scale;
              var t = (L.cx - xMax - sx) / (nsx - sx);
              out.push([L.cx - xMax, sy + t * (ny - sy)]); cum.push(0);
              started = true;
            }
          }
          continue;
        }
        started = true;
        out.push([sx, sy]); cum.push(0);
        continue;
      }
      var prev = out[out.length - 1];
      var dx = sx - prev[0], dy = sy - prev[1];
      var d = Math.sqrt(dx * dx + dy * dy);
      if (!inside) {
        /* leaving the view: clip this segment to 1.5× the canvas and stop */
        var lim = Math.max(W, H) * 1.2;
        if (d > lim) { sx = prev[0] + dx / d * lim; sy = prev[1] + dy / d * lim; d = lim; }
        total += d; out.push([sx, sy]); cum.push(total);
        break;
      }
      if (d < 0.6 && i < pts.length - 1) continue;   /* thin out sub-pixel steps */
      total += d; out.push([sx, sy]); cum.push(total);
    }
    return { p: out, c: cum, len: total };
  }

  function rebuild() {
    var b = bRs * R_S;
    ray = traceRay(b);
    ray.xy = toXY(ray, 1);
    beam = null;
    if (beamOn) {
      beam = [];
      var bs = [];
      for (var k = 0; k < 12; k++) bs.push(0.25 + 0.5 * k);       /* 0.25 … 5.75 r_s */
      bs.push(B_C / R_S * (1 + 1e-4));                            /* skims the photon sphere */
      bs.push(B_C / R_S * (1 - 1e-4));                            /* just captured        */
      for (var j = 0; j < bs.length; j++) {
        for (var s = -1; s <= 1; s += 2) {
          var rec = traceRay(bs[j] * R_S);
          rec.xy = toXY(rec, s);
          rec.edge = j >= 12;
          beam.push(rec);
        }
      }
    }
    tAnim = 0;
  }

  /* ── Readouts ──────────────────────────────────────────── */
  function fmtDeg(rad) {
    var d = rad * DEG;
    if (Math.abs(d) >= 100) return d.toFixed(1) + '°';
    if (Math.abs(d) >= 1) return d.toFixed(2) + '°';
    return d.toFixed(3) + '°';
  }
  function fmtB(x) {
    if (x >= 10) return x.toFixed(1);
    if (Math.abs(x - B_C / R_S) < 1e-3) return x.toFixed(5);
    return x.toFixed(2);
  }

  function outcomeText() {
    var b = bRs * R_S;
    var parts = [];
    parts.push('b = ' + fmtB(bRs) + ' r_s = ' + (bRs / (B_C / R_S)).toFixed(bRs < 10 ? 4 : 2) + ' b_c.');
    if (ray.captured) {
      parts.push('Captured: b is below b_c = ' + (B_C / R_S).toFixed(3) + ' r_s, so the ray crosses the photon sphere and falls through the horizon.');
    } else if (ray.orbiting) {
      parts.push('So close to b_c that the ray is still circling the photon sphere when the integration stops.');
    } else {
      var r0 = closestApproach(b);
      var defl = ray.deflection;
      parts.push('Escapes; closest approach ' + (r0 / R_S).toFixed(3) + ' r_s.');
      parts.push('Deflection of the integrated ray: ' + fmtDeg(defl) + '.');
      parts.push('Weak-field formula 4GM/(c²b): ' + fmtDeg(weakField(b)) + ' (ray / formula = ' + (defl / weakField(b)).toFixed(4) + ').');
      if (defl > 2 * Math.PI) { var nw = Math.floor(defl / (2 * Math.PI)); parts.push('The ray wraps ' + (nw === 1 ? 'once' : nw + ' full times') + ' around the hole before leaving.'); }
    }
    return parts.join(' ');
  }

  function updateReadouts() {
    var st = document.getElementById('sim-status');
    if (st) st.textContent = beamOn
      ? 'Beam: rays with b below b_c = ' + (B_C / R_S).toFixed(3) + ' r_s are captured (red); the rest are bent and escape. ' + outcomeText()
      : outcomeText();
    var bv = document.getElementById('b-val');
    if (bv) bv.textContent = fmtB(bRs) + ' r_s';
    var sl = document.getElementById('b-slider');
    if (sl) sl.setAttribute('aria-valuetext', fmtB(bRs) + ' Schwarzschild radii, ' + (ray.captured ? 'captured' : 'escapes'));
    var sc = document.getElementById('scale-readout');
    if (sc) sc.textContent = scaleText();
  }

  function fmtLen(m) {
    if (m < 1) return (m * 1000).toFixed(2) + ' mm';
    if (m < 1e3) return m.toFixed(1) + ' m';
    if (m < 1e7) return (m / 1000).toFixed(2) + ' km';
    var au = m / AU;
    var km = m / 1000;
    var e = Math.floor(Math.log10(km));
    return (km / Math.pow(10, e)).toFixed(2) + ' × 10' + sup(e) + ' km (' + (au < 10 ? au.toFixed(2) : au.toFixed(0)) + ' au)';
  }
  function sup(n) {
    var map = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
    return String(n).split('').map(function (c) { return map[c]; }).join('');
  }

  function scaleText() {
    if (!bodyKey) return 'Pick a body to put kilometres on the picture.';
    var B = BODIES[bodyKey];
    var gmc2 = B.gm / (C_LIGHT * C_LIGHT);          /* GM/c² in metres */
    var txt = 'For ' + B.name + ': r_s = ' + fmtLen(2 * gmc2) +
      ', photon sphere radius ' + fmtLen(3 * gmc2) +
      ', shadow (capture) radius ' + fmtLen(B_C * gmc2) + '.';
    if (B.dist) {
      var theta = 2 * B_C * gmc2 / B.dist / UAS;
      txt += ' Seen from Earth the shadow would be ' + (B.approx ? 'about ' + theta.toFixed(0) : theta.toFixed(1)) +
        ' µas across (computed); the ring the EHT imaged is ' + B.ring + ' (cited).';
      if (bodyKey === 'm87') txt += ' The EHT inferred this mass from the ring itself, so here the match is a consistency check.';
      if (bodyKey === 'sgra') txt += ' Here the mass comes from stars orbiting Sgr A*, independent of the image.';
    }
    return txt;
  }

  /* ── Drawing ───────────────────────────────────────────── */
  var stars = [];
  function makeStars() {
    stars = [];
    var seed = 45;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var i = 0; i < 110; i++) stars.push([rnd(), rnd(), rnd() * 0.9 + 0.3, rnd() * 0.3 + 0.06]);
  }

  function label(txt, x, y, align) {
    var w = ctx.measureText(txt).width;
    var left = align === 'right' ? x - w : (align === 'center' ? x - w / 2 : x);
    left = Math.max(4, Math.min(W - w - 4, left));
    ctx.textAlign = 'left';
    ctx.fillText(txt, left, y);
  }

  function strokePath(sp, upto, color, width) {
    if (!sp.p.length) return null;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(sp.p[0][0], sp.p[0][1]);
    var head = sp.p[0];
    for (var i = 1; i < sp.p.length; i++) {
      if (sp.c[i] <= upto) {
        ctx.lineTo(sp.p[i][0], sp.p[i][1]);
        head = sp.p[i];
      } else {
        var seg = sp.c[i] - sp.c[i - 1];
        var f = seg > 0 ? (upto - sp.c[i - 1]) / seg : 0;
        var hx = sp.p[i - 1][0] + f * (sp.p[i][0] - sp.p[i - 1][0]);
        var hy = sp.p[i - 1][1] + f * (sp.p[i][1] - sp.p[i - 1][1]);
        ctx.lineTo(hx, hy);
        head = [hx, hy];
        break;
      }
    }
    ctx.stroke();
    return head;
  }

  function photon(x, y, color) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, 9);
    g.addColorStop(0, 'oklch(1 0 0 / 0.95)');
    g.addColorStop(0.35, color);
    g.addColorStop(1, 'oklch(1 0 0 / 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, 2 * Math.PI);
    ctx.fill();
  }

  function speedPx() { return Math.max(W, 400) * 0.42; }   /* px per second along the path */

  function draw() {
    if (!ctx || !W) return;
    var L = layout();
    ctx.clearRect(0, 0, W, H);

    for (var s = 0; s < stars.length; s++) {
      ctx.fillStyle = 'oklch(1 0 0 / ' + stars[s][3].toFixed(2) + ')';
      ctx.fillRect(stars[s][0] * W, stars[s][1] * H, stars[s][2], stars[s][2]);
    }

    var sc = L.scale;
    var rH = Math.max(R_S * sc, 3), rP = Math.max(R_PH * sc, 4.5), rC = B_C * sc;

    /* capture band: incoming rays inside |y| < b_c never come back */
    ctx.fillStyle = 'oklch(0.62 0.16 25 / 0.07)';
    ctx.fillRect(0, L.cy - rC, L.cx, 2 * rC);
    ctx.save();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'oklch(0.62 0.16 25 / 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, L.cy - rC); ctx.lineTo(L.cx, L.cy - rC);
    ctx.moveTo(0, L.cy + rC); ctx.lineTo(L.cx, L.cy + rC);
    ctx.stroke();
    ctx.restore();

    /* optical axis */
    ctx.strokeStyle = COL.faint;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, L.cy); ctx.lineTo(W, L.cy);
    ctx.stroke();

    /* photon sphere */
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = COL.goldDim;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, rP, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();

    var dist = tAnim * speedPx();
    if (reducedMotion) dist = 1e9;

    if (beamOn && beam) {
      for (var i = 0; i < beam.length; i++) {
        var rec = beam[i];
        if (!rec.sp) rec.sp = screenPath(rec.xy, L);
        var col = rec.captured ? COL.capt : (rec.edge ? COL.gold : COL.rayDim);
        var hd = strokePath(rec.sp, dist, col, rec.edge ? 1.6 : 1.1);
        if (hd && dist < rec.sp.len && !reducedMotion) {
          ctx.fillStyle = rec.captured ? 'oklch(0.75 0.16 25)' : 'oklch(0.95 0.03 230)';
          ctx.beginPath(); ctx.arc(hd[0], hd[1], 2.2, 0, 2 * Math.PI); ctx.fill();
        }
      }
    } else if (ray) {
      if (!ray.sp) ray.sp = screenPath(ray.xy, L);
      drawStraightGuide(L);
      var head = strokePath(ray.sp, dist, ray.captured ? COL.capt : COL.ray, 2);
      if (head && dist < ray.sp.len && !reducedMotion) photon(head[0], head[1], ray.captured ? 'oklch(0.70 0.18 25 / 0.8)' : 'oklch(0.85 0.08 230 / 0.8)');
      if (!ray.captured && !ray.orbiting && dist >= ray.sp.len) drawDeflectionMark(L);
    }

    /* horizon */
    var g = ctx.createRadialGradient(L.cx, L.cy, rH * 0.6, L.cx, L.cy, rH * 1.25);
    g.addColorStop(0, 'oklch(0 0 0)');
    g.addColorStop(1, 'oklch(0 0 0 / 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(L.cx, L.cy, rH * 1.25, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = 'oklch(0 0 0)';
    ctx.beginPath(); ctx.arc(L.cx, L.cy, rH, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = COL.era;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(L.cx, L.cy, rH, 0, 2 * Math.PI); ctx.stroke();

    drawPanel(L);
    drawLegend(L);
  }

  /* dashed straight line the ray would follow without gravity */
  function drawStraightGuide(L) {
    if (ray.radial) return;
    var y = L.cy - bRs * R_S * L.scale;
    ctx.save();
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = 'oklch(1 0 0 / 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    ctx.restore();
  }

  /* mark the outgoing direction and the deflection angle */
  function drawDeflectionMark(L) {
    var d = ray.deflection;
    if (d === null) return;
    var sp = ray.sp;
    if (sp.p.length < 2) return;
    /* find where the ray leaves the frame; draw the angle there against the incoming direction */
    var n = sp.p.length;
    var pA = sp.p[n - 2], pB = sp.p[n - 1];
    var ang = Math.atan2(pB[1] - pA[1], pB[0] - pA[0]);
    var Lb = layout();
    var ax = Math.min(W - 60, Math.max(30, pA[0])), ay = Math.min(H - Lb.bottom - 50, Math.max(Lb.top + 80, pA[1]));
    var R = 34;
    var far = farMode();
    if (far) {
      /* the incoming line and the outgoing asymptote cross above the hole */
      ax = L.cx; ay = L.cy - bRs * R_S * L.scale; R = Math.min(W / 2 - 40, 220);
      ang = Math.atan2(Math.sin(d), Math.cos(d));   /* screen angle of the outgoing direction */
    }
    ctx.save();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = 'oklch(1 0 0 / 0.35)';
    if (d < 0.95 * Math.PI) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + R * 1.1, ay); ctx.stroke(); }
    if (far) {
      ctx.strokeStyle = 'oklch(0.75 0.12 190 / 0.6)';
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + R * 1.1 * Math.cos(ang), ay + R * 1.1 * Math.sin(ang)); ctx.stroke();
    }
    ctx.restore();
    if (d < 0.95 * Math.PI) {
      ctx.strokeStyle = COL.teal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ax, ay, R, 0, ang, ang < 0);
      ctx.stroke();
    }
    ctx.fillStyle = COL.teal;
    ctx.font = '12px "DM Sans", sans-serif';
    if (far) label('bent ' + fmtDeg(d) + '  (4GM/c²b: ' + fmtDeg(weakField(bRs * R_S)) + ')', ax + 10, ay + 24, 'left');
    else label('bent ' + fmtDeg(d), ax + 8, ay + (ang > 0 ? -R - 6 : R + 16), 'left');
  }

  function drawPanel(L) {
    var x = 12, y = 20, lh = 17;
    var nar = L.narrow;
    ctx.fillStyle = 'oklch(0.09 0 0 / 0.72)';
    ctx.fillRect(0, 0, Math.min(W, nar ? W : 380), y + (bodyKey ? 3 : 2) * lh + 12);
    ctx.font = (nar ? '11px' : '12px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.muted;
    ctx.textAlign = 'left';
    ctx.fillText(beamOn ? 'Beam of parallel rays, b from 0 to 5.75 r_s' : 'Impact parameter b = ' + fmtB(bRs) + ' r_s  (b_c = 2.598 r_s)', x, y);
    var b = bRs * R_S;
    ctx.font = (nar ? '13px' : '14px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.text;
    var line2, line3 = '';
    if (beamOn) {
      line2 = 'Red rays are captured: |b| < b_c';
      line3 = 'From far away this capture disk is the shadow';
    } else if (ray.captured) {
      line2 = 'Captured';
      line3 = 'b < b_c: inside the photon sphere, then the horizon';
    } else if (ray.orbiting) {
      line2 = 'Circling the photon sphere';
      line3 = 'b is extremely close to b_c';
    } else {
      line2 = 'Bent ' + fmtDeg(ray.deflection) + ' (integrated)';
      line3 = '4GM/(c²b) gives ' + fmtDeg(weakField(b)) + ';  closest approach ' + (closestApproach(b) / R_S).toFixed(2) + ' r_s';
    }
    ctx.fillText(line2, x, y + lh + 2);
    ctx.font = (nar ? '11px' : '12px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.muted;
    ctx.fillText(line3, x, y + 2 * lh + 4);
    if (bodyKey) {
      var B = BODIES[bodyKey];
      var rs = 2 * B.gm / (C_LIGHT * C_LIGHT);
      ctx.fillText('1 r_s = ' + fmtLen(rs).replace(/ \(.*\)/, '') + ' for ' + B.name, x, y + 3 * lh + 4);
    }
  }

  function drawLegend(L) {
    var y = H - (L.narrow ? 32 : 14);
    ctx.fillStyle = 'oklch(0.09 0 0 / 0.72)';
    ctx.fillRect(0, y - 16, W, H - y + 16);
    ctx.font = '11px "DM Sans", sans-serif';
    var items = [
      [COL.era, 'horizon r_s', false],
      [COL.goldDim, 'photon sphere 1.5 r_s', true],
      ['oklch(0.62 0.16 25 / 0.8)', 'capture radius b_c ≈ 2.6 r_s', true]
    ];
    var x = 12;
    for (var i = 0; i < items.length; i++) {
      var w = ctx.measureText(items[i][1]).width + 34;
      if (x + w > W - 8) { x = 12; y += 16; }
      ctx.save();
      if (items[i][2]) ctx.setLineDash([4, 3]);
      ctx.strokeStyle = items[i][0];
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 20, y - 4); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = COL.muted;
      ctx.textAlign = 'left';
      ctx.fillText(items[i][1], x + 25, y);
      x += w;
    }
  }

  /* ── Loop ──────────────────────────────────────────────── */
  function shotLength() {
    var L = layout();
    var len = 0;
    if (beamOn && beam) {
      for (var i = 0; i < beam.length; i++) {
        if (!beam[i].sp) beam[i].sp = screenPath(beam[i].xy, L);
        len = Math.max(len, beam[i].sp.len);
      }
    } else if (ray) {
      if (!ray.sp) ray.sp = screenPath(ray.xy, L);
      len = ray.sp.len;
    }
    return len / speedPx();
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.1);
    lastTs = ts;
    tAnim += dt;
    if (tAnim > shotLength() + HOLD) tAnim = 0;
    draw();
    rafId = requestAnimationFrame(loop);
  }

  /* ── SimAPI ────────────────────────────────────────────── */
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
    if (reducedMotion) { draw(); return; }   /* full rays drawn at once, no motion */
    rafId = requestAnimationFrame(loop);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    setPlayUI(false);
  }

  function reset() {
    pause();
    tAnim = 0;
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
    /* pure physics, exposed so the numbers can be checked independently */
    physics: {
      traceRay: function (b, opts) { var r = traceRay(b, opts); return { captured: r.captured, orbiting: r.orbiting, phiEnd: r.phiEnd, deflection: r.deflection }; },
      captureThreshold: captureThreshold,
      closestApproach: closestApproach,
      B_C: B_C
    }
  };

  /* ── Controls ──────────────────────────────────────────── */
  /* slider value v: 0–1000 → b = 0.01 v r_s; 1000–1500 → b = 10 + 0.1 (v − 1000) */
  function sliderToB(v) { return v <= 1000 ? v * 0.01 : 10 + (v - 1000) * 0.1; }
  function bToSlider(b) { return b <= 10 ? Math.round(b * 100) : Math.round(1000 + (b - 10) * 10); }

  function invalidate() {
    if (ray) ray.sp = null;
    if (beam) for (var i = 0; i < beam.length; i++) beam[i].sp = null;
  }

  function onResize() {
    if (!mountEl || !canvas) return;
    var rect = mountEl.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    W = Math.round(rect.width);
    H = W < 520 ? 540 : Math.max(460, Math.round(Math.min(W * 0.72, 540)));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    invalidate();
    draw();
  }

  function setToggle(btn, on, onText, offText) {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? onText : offText;
    btn.style.borderColor = on ? 'var(--era-stop-color, var(--color-gold))' : '';
    btn.style.color = on ? 'var(--color-text-primary)' : '';
  }

  function applyB(b, moveSlider) {
    bRs = b;
    if (moveSlider) {
      var sl = document.getElementById('b-slider');
      if (sl) sl.value = String(bToSlider(b));
    }
    rebuild();
    draw();
    updateReadouts();
  }

  function setup() {
    mountEl = document.getElementById('sim-mount');
    if (!mountEl) return;
    makeStars();
    rebuild();
    canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Light rays passing a black hole: the horizon, the photon sphere at 1.5 Schwarzschild radii, and the capture radius at 2.6 Schwarzschild radii');
    mountEl.appendChild(canvas);
    ctx = canvas.getContext('2d');
    requestAnimationFrame(function () { onResize(); updateReadouts(); });
    window.addEventListener('resize', onResize);

    var sl = document.getElementById('b-slider');
    if (sl) {
      sl.value = String(bToSlider(bRs));
      sl.addEventListener('input', function () {
        if (beamOn) { beamOn = false; var bb = document.getElementById('beam-toggle'); if (bb) setToggle(bb, false, 'Showing a beam of rays', 'Show a beam of rays'); }
        applyB(sliderToB(parseInt(this.value, 10)), false);
      });
    }
    var gz = document.getElementById('graze-btn');
    if (gz) gz.addEventListener('click', function () {
      if (beamOn) { beamOn = false; var bb = document.getElementById('beam-toggle'); if (bb) setToggle(bb, false, 'Showing a beam of rays', 'Show a beam of rays'); }
      applyB(B_C / R_S * (1 + 1e-5), true);
    });
    var far = document.getElementById('far-btn');
    if (far) far.addEventListener('click', function () {
      if (beamOn) { beamOn = false; var bb = document.getElementById('beam-toggle'); if (bb) setToggle(bb, false, 'Showing a beam of rays', 'Show a beam of rays'); }
      applyB(50, true);
    });
    var bm = document.getElementById('beam-toggle');
    if (bm) {
      setToggle(bm, beamOn, 'Showing a beam of rays', 'Show a beam of rays');
      bm.addEventListener('click', function () {
        beamOn = !beamOn;
        setToggle(bm, beamOn, 'Showing a beam of rays', 'Show a beam of rays');
        rebuild();
        draw();
        updateReadouts();
      });
    }
    var bodyBtns = document.querySelectorAll('[data-body]');
    Array.prototype.forEach.call(bodyBtns, function (btn) {
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', function () {
        var k = btn.getAttribute('data-body');
        bodyKey = (bodyKey === k) ? null : k;
        Array.prototype.forEach.call(bodyBtns, function (o) {
          var on = o.getAttribute('data-body') === bodyKey;
          o.setAttribute('aria-pressed', on ? 'true' : 'false');
          o.style.borderColor = on ? 'var(--era-stop-color, var(--color-gold))' : '';
          o.style.color = on ? 'var(--color-text-primary)' : '';
        });
        draw();
        updateReadouts();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}());
