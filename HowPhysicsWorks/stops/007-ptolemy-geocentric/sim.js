/* ============================================================
   sim.js — Stop 007: Ptolemy's Geocentric Model
   The Almagest structure without eccentric or equant: Earth at
   the origin, everything circular, uniform and in one plane.

   Sun:     circles Earth once a year (365.25 d).
   Outer planet (Mars, Jupiter, Saturn):
     deferent angle   λd = 2π t / T_sidereal + π
     epicycle arm     points along the Earth–Sun line (angle λ☉),
                      so it turns once a year
     p = R·u(λd) + r·u(λ☉)
   Inner planet (Mercury, Venus):
     deferent angle   λd = λ☉   (the epicycle's centre goes round the
                                deferent once a year, always on the
                                Earth–mean-Sun line)
     epicycle arm     λ☉ + 2π t / T_synodic + π
     p = R·u(λ☉) + r·u(arm)
   R = 1; r/R from the modern ratios of mean distances.
   The anomaly (arm angle minus deferent angle) turns at the
   synodic rate in both cases:
     1/687 + 1/779.9 = 1/365.25 (Mars), 1/115.88 + 1/365.25 = 1/87.97
     (Mercury), 1/583.92 + 1/365.25 = 1/224.70 (Venus).
   t = 0 is an opposition (outer) or inferior conjunction (inner).
   Longitude seen from Earth: λ = atan2(p_y, p_x).
   ============================================================ */
(function () {
  'use strict';

  var YEAR = 365.25;
  var TAU = Math.PI * 2;
  var PLANETS = {
    Mercury: { inner: true,  r: 0.387, syn: 115.88,  col: 'oklch(0.80 0.05 60)' },
    Venus:   { inner: true,  r: 0.723, syn: 583.92,  col: 'oklch(0.88 0.08 90)' },
    Mars:    { inner: false, r: 0.656, sid: 686.98,  col: 'oklch(0.68 0.19 32)' },
    Jupiter: { inner: false, r: 0.192, sid: 4332.59, col: 'oklch(0.78 0.10 60)' },
    Saturn:  { inner: false, r: 0.105, sid: 10759.22, col: 'oklch(0.82 0.09 85)' }
  };
  var SPEEDS = [5, 10, 20, 40, 80];          /* days of model time per second */
  var SPEED_DEFAULT = 2;
  var COL = {
    bg:     'oklch(0.07 0.01 260)',
    earth:  'oklch(0.70 0.12 240)',
    sun:    'oklch(0.88 0.16 90)',
    sunDim: 'oklch(0.88 0.16 90 / 0.45)',
    def:    'oklch(0.55 0.03 260)',
    epi:    'oklch(0.72 0.12 60)',
    retro:  'oklch(0.70 0.20 350)',
    retroBg:'oklch(0.70 0.20 350 / 0.16)',
    text:   'oklch(0.92 0 0)',
    muted:  'oklch(0.64 0 0)',
    faint:  'oklch(1 0 0 / 0.10)'
  };

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var name = 'Mars', P = PLANETS.Mars;
  var t = 0;                    /* model time, days (0 = opposition / inferior conjunction) */
  var tStart = 0;
  var speedIdx = SPEED_DEFAULT;
  var showTrail = true;
  var stats = null;             /* retrograde duration and arc from the model */
  var yLo = null, yHi = null;   /* smoothed strip range, degrees */

  /* ── Model ─────────────────────────────────────────────── */
  function synodic(p) { return p.inner ? p.syn : 1 / (1 / YEAR - 1 / p.sid); }
  function sunAngle(tt) { return TAU * tt / YEAR; }
  function defAngle(p, tt) { return p.inner ? sunAngle(tt) : TAU * tt / p.sid + Math.PI; }
  function armAngle(p, tt) { return p.inner ? sunAngle(tt) + TAU * tt / p.syn + Math.PI : sunAngle(tt); }
  function position(p, tt) {
    var d = defAngle(p, tt), a = armAngle(p, tt);
    return { cx: Math.cos(d), cy: Math.sin(d), x: Math.cos(d) + p.r * Math.cos(a), y: Math.sin(d) + p.r * Math.sin(a) };
  }
  function lon(p, tt) { var q = position(p, tt); return Math.atan2(q.y, q.x); }
  function wrapPi(a) { return a - TAU * Math.round(a / TAU); }
  function deg(a) { return a * 180 / Math.PI; }
  function norm360(dg) { return ((dg % 360) + 360) % 360; }
  /* dλ/dt sign: retrograde when the longitude decreases */
  function isRetro(p, tt) { return wrapPi(lon(p, tt + 0.05) - lon(p, tt - 0.05)) < 0; }

  /* Scan one synodic period around t = 0 for the retrograde interval */
  function computeStats(p) {
    var S = synodic(p), dt = 0.02;
    var t0 = null, t1 = null, lamStart = 0, lam = 0, prev = lon(p, -S / 2);
    for (var tt = -S / 2 + dt; tt <= S / 2; tt += dt) {
      var a = lon(p, tt);
      var d = wrapPi(a - prev);
      prev = a;
      lam += d;
      if (d < 0 && t0 === null) { t0 = tt; lamStart = lam - d; }
      if (d >= 0 && t0 !== null && t1 === null) { t1 = tt; return { syn: S, start: t0, dur: t1 - t0, arc: deg(lamStart - lam + d) }; }
    }
    return { syn: S, start: 0, dur: 0, arc: 0 };
  }

  function windowDays() {
    var S = synodic(P);
    return { Mercury: 0.55, Venus: 0.25, Mars: 0.3, Jupiter: 0.8, Saturn: 0.8 }[name] * S;
  }
  function trailDays() { return 1.5 * synodic(P); }

  /* ── Layout ────────────────────────────────────────────── */
  function layout() {
    var stripH = W < 520 ? 170 : 180;
    var orbitH = H - stripH;
    var extent = P.inner ? sunRadius() : 1 + P.r;
    var ring = extent + 0.12;
    var scale = (Math.min(W, orbitH) / 2 - 34) / ring;
    return { orbitH: orbitH, cx: W / 2, cy: orbitH / 2 + 4, scale: scale, ring: ring, stripY: orbitH, stripH: stripH };
  }
  /* The Sun's distance is not set by the model; draw it in Ptolemy's
     order (inside Mars, Jupiter, Saturn; outside Mercury and Venus). */
  function sunRadius() { return P.inner ? (1 + P.r) * 1.12 : 0.6 * (1 - P.r); }

  function text(s, x, y, col, size, align, weight, base) {
    ctx.fillStyle = col;
    ctx.font = (weight || '500') + ' ' + size + 'px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = base || 'middle';
    ctx.fillText(s, x, y);
  }

  /* ── Drawing ───────────────────────────────────────────── */
  function draw() {
    if (!ctx || !W) return;
    var L = layout();
    var s = L.scale;
    function X(x) { return L.cx + x * s; }
    function Y(y) { return L.cy - y * s; }
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, W, H);

    var q = position(P, t);
    var ls = sunAngle(t);
    var sunR = sunRadius();
    var lam = Math.atan2(q.y, q.x);

    /* zodiac ring with 30° ticks */
    ctx.strokeStyle = COL.faint; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(L.cx, L.cy, L.ring * s, 0, TAU); ctx.stroke();
    for (var k = 0; k < 12; k++) {
      var ang = k * TAU / 12;
      var r1 = L.ring * s, r2 = r1 + (k % 3 === 0 ? 9 : 5);
      ctx.beginPath();
      ctx.moveTo(L.cx + Math.cos(ang) * r1, L.cy - Math.sin(ang) * r1);
      ctx.lineTo(L.cx + Math.cos(ang) * r2, L.cy - Math.sin(ang) * r2);
      ctx.stroke();
      if (k % 3 === 0) {
        var r3 = r1 + 16;
        text(k * 30 + '°', L.cx + Math.cos(ang) * r3, L.cy - Math.sin(ang) * r3, COL.muted, 9, 'center');
      }
    }

    /* deferent, Sun's circle */
    ctx.save();
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = COL.def;
    ctx.beginPath(); ctx.arc(L.cx, L.cy, s, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'oklch(0.88 0.16 90 / 0.25)';
    ctx.beginPath(); ctx.arc(L.cx, L.cy, sunR * s, 0, TAU); ctx.stroke();
    ctx.restore();

    /* trail: geocentric path over the last 1.5 synodic periods */
    if (showTrail) {
      var td = trailDays(), N = 600;
      ctx.lineWidth = 1.4;
      var prevP = null, prevRetro = null;
      ctx.beginPath();
      for (var i = 0; i <= N; i++) {
        var tt = t - td + td * i / N;
        var pp = position(P, tt);
        var rr = isRetro(P, tt);
        if (prevP && rr !== prevRetro) {
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(X(prevP.x), Y(prevP.y));
        }
        ctx.strokeStyle = rr ? COL.retro : 'oklch(0.72 0.12 60 / 0.55)';
        if (!prevP) ctx.moveTo(X(pp.x), Y(pp.y)); else ctx.lineTo(X(pp.x), Y(pp.y));
        prevP = pp; prevRetro = rr;
      }
      ctx.stroke();
    }

    /* Earth–Sun line, and its parallel through the epicycle centre */
    var sx = Math.cos(ls), sy = Math.sin(ls);
    ctx.strokeStyle = COL.sunDim; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(sx * sunR), Y(sy * sunR)); ctx.stroke();
    if (!P.inner) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(X(q.cx - sx * P.r * 1.6), Y(q.cy - sy * P.r * 1.6)); ctx.lineTo(X(q.cx + sx * P.r * 1.6), Y(q.cy + sy * P.r * 1.6)); ctx.stroke();
      ctx.restore();
    }

    /* deferent radius, epicycle, arm */
    ctx.strokeStyle = COL.def; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(q.cx), Y(q.cy)); ctx.stroke();
    ctx.strokeStyle = COL.epi; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(X(q.cx), Y(q.cy), P.r * s, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(q.cx), Y(q.cy)); ctx.lineTo(X(q.x), Y(q.y)); ctx.stroke();
    ctx.fillStyle = COL.epi;
    ctx.beginPath(); ctx.arc(X(q.cx), Y(q.cy), 2.5, 0, TAU); ctx.fill();

    /* line of sight from Earth through the planet to the zodiac ring */
    ctx.save();
    ctx.strokeStyle = 'oklch(1 0 0 / 0.22)'; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(Math.cos(lam) * L.ring), Y(Math.sin(lam) * L.ring)); ctx.stroke();
    ctx.restore();
    var retroNow = isRetro(P, t);
    ctx.fillStyle = retroNow ? COL.retro : COL.text;
    ctx.beginPath(); ctx.arc(X(Math.cos(lam) * L.ring), Y(Math.sin(lam) * L.ring), 3.5, 0, TAU); ctx.fill();

    /* Sun */
    var g = ctx.createRadialGradient(X(sx * sunR), Y(sy * sunR), 2, X(sx * sunR), Y(sy * sunR), 18);
    g.addColorStop(0, 'oklch(0.92 0.15 95 / 0.8)'); g.addColorStop(1, 'oklch(0.92 0.15 95 / 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(X(sx * sunR), Y(sy * sunR), 18, 0, TAU); ctx.fill();
    ctx.fillStyle = COL.sun;
    ctx.beginPath(); ctx.arc(X(sx * sunR), Y(sy * sunR), 7, 0, TAU); ctx.fill();

    /* Earth */
    ctx.fillStyle = COL.earth;
    ctx.beginPath(); ctx.arc(X(0), Y(0), 6, 0, TAU); ctx.fill();

    /* planet */
    ctx.fillStyle = P.col;
    ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), 6, 0, TAU); ctx.fill();
    text(name, X(q.x) + 9, Y(q.y) - 9, COL.text, 11, 'left', '600');

    /* labels */
    var day = Math.round(t - tStart);
    text(name.toUpperCase() + (P.inner ? ' (INNER)' : ' (OUTER)'), 12, 16, COL.muted, 10, 'left', '600');
    text('day ' + day.toLocaleString('en-US') + ' of model time', 12, 32, COL.muted, 10, 'left');
    text('λ = ' + norm360(deg(lam)).toFixed(1) + '°', 12, 48, retroNow ? COL.retro : COL.text, 12, 'left', '600');
    if (retroNow) text('retrograde', 12, 64, COL.retro, 11, 'left', '600');
    text('Sun and distances', W - 12, 16, COL.muted, 10, 'right');
    text('not to scale', W - 12, 30, COL.muted, 10, 'right');

    drawStrip(L);
  }

  function niceStep(span) {
    var steps = [1, 2, 5, 10, 15, 30, 45, 60, 90];
    for (var i = 0; i < steps.length; i++) if (span / steps[i] <= 5) return steps[i];
    return 90;
  }

  function drawStrip(L) {
    var y0 = L.stripY, h = L.stripH;
    var padL = 40, padR = 12, padT = 24, padB = 22;
    var x0 = padL, x1 = W - padR, yt = y0 + padT, yb = y0 + h - padB;
    ctx.fillStyle = 'oklch(0.10 0.01 260)';
    ctx.fillRect(0, y0, W, h);
    ctx.fillStyle = COL.faint; ctx.fillRect(0, y0, W, 1);
    text('LONGITUDE SEEN FROM EARTH (model)', padL, y0 + 12, COL.muted, 10, 'left', '600');

    var Wd = windowDays();
    var N = Math.max(200, Math.round(x1 - x0));
    var ta = t - Wd / 2;
    var lamU = [], times = [], retro = [];
    var prev = lon(P, ta), acc = deg(prev), accNow = null;
    var mn = Infinity, mx = -Infinity;
    for (var i = 0; i <= N; i++) {
      var tt = ta + Wd * i / N;
      var a = lon(P, tt);
      if (i > 0) acc += deg(wrapPi(a - prev));
      prev = a;
      lamU.push(acc); times.push(tt);
      if (accNow === null && tt >= t) accNow = acc;
      retro.push(isRetro(P, tt));
      if (acc < mn) mn = acc;
      if (acc > mx) mx = acc;
    }
    if (accNow === null) accNow = acc;
    /* keep the current point's longitude in [0, 360) on the axis */
    var shift = norm360(accNow) - accNow;
    mn += shift; mx += shift;
    var pad = Math.max(2, (mx - mn) * 0.08);
    var tLo = mn - pad, tHi = mx + pad;
    if (tHi - tLo < 20) { var mid = (tHi + tLo) / 2; tLo = mid - 10; tHi = mid + 10; }
    if (yLo === null || Math.abs(yLo - tLo) > 180) { yLo = tLo; yHi = tHi; }
    else { yLo += (tLo - yLo) * 0.15; yHi += (tHi - yHi) * 0.15; }
    yLo = Math.min(yLo, mn); yHi = Math.max(yHi, mx);
    function Xs(tt) { return x0 + (tt - ta) / Wd * (x1 - x0); }
    function Ys(v) { return yb - (v - yLo) / (yHi - yLo) * (yb - yt); }

    /* retrograde bands */
    var inR = false, rs = 0;
    for (i = 0; i <= N; i++) {
      if (retro[i] && !inR) { inR = true; rs = i; }
      if ((!retro[i] || i === N) && inR) {
        inR = false;
        var xa = Xs(times[rs]), xb = Xs(times[i]);
        ctx.fillStyle = COL.retroBg;
        ctx.fillRect(xa, yt, xb - xa, yb - yt);
        if (xb - xa > 3 && stats) {
          var lbl = 'retrograde ' + Math.round(stats.dur) + ' d, ' + stats.arc.toFixed(1) + '°';
          var lx = Math.min(Math.max((xa + xb) / 2, x0 + 70), x1 - 70);
          text(lbl, lx, yt + 3, COL.retro, 10, 'center', '600', 'top');
        }
      }
    }

    /* axes and gridlines */
    var step = niceStep(yHi - yLo);
    ctx.strokeStyle = COL.faint; ctx.lineWidth = 1;
    for (var v = Math.ceil(yLo / step) * step; v <= yHi; v += step) {
      ctx.beginPath(); ctx.moveTo(x0, Ys(v)); ctx.lineTo(x1, Ys(v)); ctx.stroke();
      text(norm360(v).toFixed(0) + '°', x0 - 4, Ys(v), COL.muted, 9, 'right');
    }
    /* opposition (outer) or inferior conjunction (inner) markers */
    var S = synodic(P);
    var kFirst = Math.ceil(ta / S);
    for (var k = kFirst; k * S <= ta + Wd; k++) {
      var xm = Xs(k * S);
      ctx.save();
      ctx.strokeStyle = COL.sunDim; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(xm, yt); ctx.lineTo(xm, yb); ctx.stroke();
      ctx.restore();
      text(P.inner ? 'inferior conj.' : 'opposition', Math.min(Math.max(xm, x0 + 34), x1 - 34), yb + 4, COL.sun, 9, 'center', '500', 'top');
    }
    /* time ticks */
    var tickStep = Wd > 600 ? 200 : Wd > 250 ? 100 : Wd > 120 ? 50 : 20;
    for (var tk = -Math.floor(Wd / 2 / tickStep) * tickStep; tk <= Wd / 2; tk += tickStep) {
      var xt = Xs(t + tk);
      ctx.fillStyle = COL.faint; ctx.fillRect(xt, yb, 1, 4);
      text(tk === 0 ? 'now' : (tk > 0 ? '+' : '\u2212') + Math.abs(tk) + ' d', xt, yb + 14, tk === 0 ? COL.text : COL.muted, 9, 'center', '500', 'top');
    }
    /* now line; the part to the right is what the model predicts next */
    ctx.fillStyle = 'oklch(1 0 0 / 0.25)';
    ctx.fillRect(Xs(t), yt, 1, yb - yt);
    text('model ahead \u2192', x1, yt - 12, COL.muted, 9, 'right');

    /* the curve */
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    var curRetro = retro[0];
    ctx.strokeStyle = curRetro ? COL.retro : COL.epi;
    var future = false;
    for (i = 0; i <= N; i++) {
      var px = Xs(times[i]), py = Ys(lamU[i] + shift);
      if (i === 0) { ctx.moveTo(px, py); continue; }
      ctx.lineTo(px, py);
      if (!future && times[i] >= t) {
        ctx.stroke();
        future = true;
        ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.moveTo(px, py);
      }
      if (retro[i] !== curRetro) {
        ctx.stroke();
        curRetro = retro[i];
        ctx.strokeStyle = curRetro ? COL.retro : COL.epi;
        ctx.beginPath(); ctx.moveTo(px, py);
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.col;
    ctx.beginPath(); ctx.arc(Xs(t), Ys(accNow + shift), 4, 0, TAU); ctx.fill();
  }

  /* ── Readouts ──────────────────────────────────────────── */
  function updateReadout() {
    stats = computeStats(P);
    var el = document.getElementById('model-readout');
    if (!el) return;
    var per = P.inner
      ? 'Epicycle centre: round the deferent once a year, always on the line to the mean Sun. Planet: round the epicycle once every ' + P.syn.toLocaleString('en-US') + ' days (synodic period). r/R = ' + P.r + '.'
      : 'Epicycle centre: round the deferent once every ' + P.sid.toLocaleString('en-US') + ' days (sidereal period). Planet: round the epicycle once a year, the arm parallel to the Earth–Sun line. r/R = ' + P.r + '.';
    el.textContent = per + ' From the model: a retrograde loop every ' + Math.round(stats.syn).toLocaleString('en-US') + ' days (' +
      (stats.syn / YEAR).toFixed(2) + ' years), each lasting ' + Math.round(stats.dur) + ' days and spanning ' + stats.arc.toFixed(1) + '° of longitude.';
  }

  /* ── Animation ─────────────────────────────────────────── */
  function setPlayBtn(playing) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) {
      btn.textContent = playing ? '⏸ Pause' : '▶ Play';
      btn.dataset.state = playing ? 'playing' : 'paused';
      btn.setAttribute('aria-label', playing ? 'Pause the model' : 'Play the model');
    }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.toggle('is-running', playing);
  }

  function loop(ts) {
    if (!running) return;
    if (lastTs === null) lastTs = ts;
    var dt = Math.min(0.1, (ts - lastTs) / 1000);
    lastTs = ts;
    t += dt * SPEEDS[speedIdx];
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    setPlayBtn(true);
    if (reducedMotion) {
      /* no animation: step a quarter of a synodic period and redraw */
      t += synodic(P) / 4;
      draw();
      setTimeout(function () { setPlayBtn(false); }, 0);
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

  function startTime() {
    var st = computeStats(P);
    return Math.max(-0.45 * st.syn, st.start - 60);
  }

  function reset() {
    pause();
    speedIdx = SPEED_DEFAULT;
    var sl = document.getElementById('speed-slider');
    if (sl) { sl.value = SPEED_DEFAULT; }
    setSpeedLabel();
    showTrail = true;
    var tb = document.getElementById('trail-btn');
    if (tb) { tb.setAttribute('aria-pressed', 'true'); tb.textContent = 'Trail: on'; }
    tStart = t = startTime();
    yLo = yHi = null;
    draw();
  }

  function destroy() {
    pause();
    window.removeEventListener('resize', onResize);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  /* ── Controls ──────────────────────────────────────────── */
  function setSpeedLabel() {
    var v = SPEEDS[speedIdx];
    var val = document.getElementById('speed-val');
    if (val) val.textContent = v + ' d/s';
    var sl = document.getElementById('speed-slider');
    if (sl) sl.setAttribute('aria-valuetext', v + ' days of model time per second');
  }

  function selectPlanet(n) {
    name = n; P = PLANETS[n];
    var btns = document.querySelectorAll('[data-planet]');
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute('data-planet') === n;
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      btns[i].classList.toggle('sim-btn-play', on);
    }
    updateReadout();
    tStart = t = startTime();
    yLo = yHi = null;
    if (reducedMotion) t = 0;
    draw();
  }

  /* ── Setup ─────────────────────────────────────────────── */
  function onResize() {
    if (!mountEl || !canvas) return;
    var rect = mountEl.getBoundingClientRect();
    if (!rect.width) return;
    var dpr = window.devicePixelRatio || 1;
    W = Math.round(rect.width);
    H = W < 520 ? Math.round(W + 170) : 640;
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
    canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Earth at the centre; the selected planet rides an epicycle on its deferent while the Sun circles Earth once a year. Below, a strip plots the planet’s longitude seen from Earth against time, with retrograde stretches shaded.');
    mountEl.appendChild(canvas);
    ctx = canvas.getContext('2d');

    var btns = document.querySelectorAll('[data-planet]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () { selectPlanet(this.getAttribute('data-planet')); });
    }
    var sl = document.getElementById('speed-slider');
    if (sl) {
      sl.addEventListener('input', function () {
        speedIdx = parseInt(this.value, 10);
        setSpeedLabel();
      });
    }
    var tb = document.getElementById('trail-btn');
    if (tb) {
      tb.addEventListener('click', function () {
        showTrail = !showTrail;
        tb.setAttribute('aria-pressed', showTrail ? 'true' : 'false');
        tb.textContent = showTrail ? 'Trail: on' : 'Trail: off';
        draw();
      });
    }
    setSpeedLabel();
    selectPlanet('Mars');
    if (reducedMotion) t = 0;
    requestAnimationFrame(function () { onResize(); });
    window.addEventListener('resize', onResize);
  }

  /* exposed read-only for checks: the model's longitude in degrees */
  window.PtolemyModel = {
    longitude: function (n, tt) { return norm360(deg(lon(PLANETS[n], tt))); },
    stats: function (n) { return computeStats(PLANETS[n]); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}());
