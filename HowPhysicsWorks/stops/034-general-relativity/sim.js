/* ============================================================
   sim.js — Stop 034: General Relativity and Mercury's Perihelion
   Mercury around the Sun, RK4 in AU and years (GM_sun = 4π²).
   Planetary pulls: each planet smeared into a ring (secular
   average), ring strengths scaled so their total matches the
   cited 532.3″/century. GR: the 1PN Schwarzschild term
     a = −(GM/r³)(1 + 3h²/(c²r²)) r
   which gives Δϖ = 6πGM/(a(1−e²)c²) per orbit.
   Both effects are multiplied by an exaggeration factor so the
   motion is visible; every readout divides it back out.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H;
  var running = false;
  var rafId   = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastTs  = null;

  /* ── Constants ─────────────────────────────────────────── */
  var GM   = 4 * Math.PI * Math.PI;        /* AU³/yr² (Gaussian units)       */
  var C    = 63241.077;                    /* speed of light, AU/yr          */
  var A_M  = 0.387098;                     /* Mercury semi-major axis, AU    */
  var E_M  = 0.205630;                     /* Mercury eccentricity           */
  var T_M  = Math.pow(A_M, 1.5);           /* orbital period, yr (≈ 87.97 d) */
  var ARCSEC = 180 * 3600 / Math.PI;

  /* Cited budget (Park et al. 2017, arcsec per Julian century) */
  var PLANETS_CITED = 532.3035;
  /* 1PN Schwarzschild rate, computed from the constants above */
  var GR_RATE = 6 * Math.PI * GM / (A_M * (1 - E_M * E_M) * C * C) / T_M * 100 * ARCSEC;

  /* Planet rings: [name, a (AU), Sun/planet mass ratio] */
  var PLANETS = [
    ['Venus',   0.723332, 408523.72],
    ['Earth',   1.000000, 328900.56],
    ['Mars',    1.523679, 3098703.59],
    ['Jupiter', 5.2026,   1047.348644],
    ['Saturn',  9.5549,   3497.9018],
    ['Uranus',  19.2184,  22902.98],
    ['Neptune', 30.1104,  19412.26]
  ];
  /* Exaggeration levels. The raw ring model, run at each level, gives a
     slightly different total (≈ 557, 561, 572″/cy: the stand-in is not
     exact and strong exaggeration adds nonlinear terms), so each level is
     scaled to reproduce the cited total. */
  var EXAG = [1000, 3000, 10000];
  var RING_RAW = [557.4, 560.8, 572.1];
  var N_TERMS = 40;
  var ringCoef = (function () {
    var c = [], cn = 1;
    for (var n = 1; n <= N_TERMS; n++) {
      cn *= ((2 * n - 1) / (2 * n)) * ((2 * n - 1) / (2 * n));
      c.push(cn * 2 * n);
    }
    return c;
  }());

  var exagIdx = 1;
  var K = EXAG[exagIdx];
  var RING_SCALE = PLANETS_CITED / RING_RAW[exagIdx];

  var grOn = false;
  var planetsOn = true;
  var splitOn = false;

  var ORBITS_PER_SEC = 0.75;
  var STEPS_PER_ORBIT = 720;

  /* Two bodies: main (planets + optional GR) and ghost (planets only) */
  var bodies;
  var trail = [];
  var tYears = 0;
  var stepAcc = 0;

  var COL = {
    era:    'oklch(0.68 0.20 310)',
    eraDim: 'oklch(0.68 0.20 310 / 0.35)',
    gold:   'oklch(0.78 0.14 82)',
    text:   'oklch(0.92 0 0)',
    muted:  'oklch(0.62 0 0)',
    faint:  'oklch(1 0 0 / 0.10)',
    ghost:  'oklch(0.75 0.03 250 / 0.75)',
    teal:   'oklch(0.75 0.12 190)'
  };

  /* ── Physics ───────────────────────────────────────────── */
  function ringAccel(r) {
    /* outward radial acceleration from all planet rings */
    var f = 0;
    for (var p = 0; p < PLANETS.length; p++) {
      var R = PLANETS[p][1], q = r / R, q2 = q * q, pw = q, s = 0;
      for (var n = 0; n < N_TERMS; n++) {
        s += ringCoef[n] * pw;
        pw *= q2;
        if (pw < 1e-16) break;
      }
      f += s / (R * R * PLANETS[p][2]);
    }
    return GM * f * RING_SCALE;
  }

  function accel(b, x, y, vx, vy) {
    var r2 = x * x + y * y, r = Math.sqrt(r2);
    var k = -GM / (r2 * r);
    if (b.gr) {
      var h = x * vy - y * vx;
      k *= 1 + K * 3 * h * h / (C * C * r2);
    }
    if (planetsOn) k += K * ringAccel(r) / r;
    return [k * x, k * y];
  }

  function rk4(b, dt) {
    var x = b.x, y = b.y, vx = b.vx, vy = b.vy;
    var a1 = accel(b, x, y, vx, vy);
    var x2 = x + 0.5 * dt * vx, y2 = y + 0.5 * dt * vy;
    var vx2 = vx + 0.5 * dt * a1[0], vy2 = vy + 0.5 * dt * a1[1];
    var a2 = accel(b, x2, y2, vx2, vy2);
    var x3 = x + 0.5 * dt * vx2, y3 = y + 0.5 * dt * vy2;
    var vx3 = vx + 0.5 * dt * a2[0], vy3 = vy + 0.5 * dt * a2[1];
    var a3 = accel(b, x3, y3, vx3, vy3);
    var x4 = x + dt * vx3, y4 = y + dt * vy3;
    var vx4 = vx + dt * a3[0], vy4 = vy + dt * a3[1];
    var a4 = accel(b, x4, y4, vx4, vy4);
    b.x  += dt / 6 * (vx + 2 * vx2 + 2 * vx3 + vx4);
    b.y  += dt / 6 * (vy + 2 * vy2 + 2 * vy3 + vy4);
    b.vx += dt / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]);
    b.vy += dt / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
  }

  /* Osculating orbit from the Laplace–Runge–Lenz vector */
  function elements(b) {
    var h = b.x * b.vy - b.y * b.vx;
    var r = Math.sqrt(b.x * b.x + b.y * b.y);
    var ax = b.vy * h - GM * b.x / r;
    var ay = -b.vx * h - GM * b.y / r;
    return { w: Math.atan2(ay, ax), e: Math.sqrt(ax * ax + ay * ay) / GM, p: h * h / GM };
  }

  function makeBody(gr) {
    var rp = A_M * (1 - E_M);
    return {
      gr: gr,
      x: rp, y: 0, vx: 0, vy: Math.sqrt(GM * (1 + E_M) / rp),
      prevRv: 0, w0: null, t0: 0, wUnwrapped: 0, wLast: 0, tLast: 0,
      passes: 0, history: []
    };
  }

  function initState() {
    bodies = { main: makeBody(grOn), ghost: makeBody(false) };
    trail = [];
    tYears = 0;
    stepAcc = 0;
  }

  function trackPerihelion(b) {
    var rv = b.x * b.vx + b.y * b.vy;
    if (b.prevRv < 0 && rv >= 0) {
      var w = elements(b).w;
      if (b.w0 === null) {
        b.w0 = w; b.wUnwrapped = w; b.t0 = tYears;
      } else {
        var d = w - b.wLast;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        b.wUnwrapped += d;
      }
      b.wLast = w; b.tLast = tYears; b.passes++;
      b.history.push(w);
      if (b.history.length > 60) b.history.shift();
    }
    b.prevRv = rv;
  }

  /* measured advance in arcsec per (real) century */
  function measured(b) {
    if (b.passes < 2 || b.tLast <= b.t0) return null;
    return (b.wUnwrapped - b.w0) / (b.tLast - b.t0) * 100 * ARCSEC / K;
  }

  function modelRate(withGr) {
    return (planetsOn ? PLANETS_CITED : 0) + (withGr ? GR_RATE : 0);
  }

  function step(simDt) {
    stepAcc += simDt;
    var h = T_M / STEPS_PER_ORBIT;
    var n = 0;
    while (stepAcc >= h && n < 200) {
      rk4(bodies.main, h);
      rk4(bodies.ghost, h);
      tYears += h;
      trackPerihelion(bodies.main);
      trackPerihelion(bodies.ghost);
      if (n % 4 === 0) {
        trail.push(bodies.main.x, bodies.main.y);
        if (trail.length > 2 * 900) trail.splice(0, 2);
      }
      stepAcc -= h;
      n++;
    }
  }

  /* ── Formatting ────────────────────────────────────────── */
  function fmt(v) {
    if (v === null) return '—';
    return (Math.abs(v) < 0.05 ? 0 : v).toFixed(1) + '″';
  }

  var lastCaptionPass = -1;
  function updateReadouts(force) {
    var m = bodies.main;
    var val = document.getElementById('prec-val');
    var model = modelRate(grOn);
    if (val) val.textContent = model.toFixed(1) + '″ / century';
    if (!force && m.passes === lastCaptionPass) return;
    lastCaptionPass = m.passes;
    var st = document.getElementById('sim-status');
    if (!st) return;
    var meas = measured(m);
    var parts = [];
    if (!planetsOn && !grOn) {
      parts.push('Pure Newton, Sun only: the ellipse stays put.');
    } else {
      parts.push('Model: ' + model.toFixed(1) + '″ per century (planets ' +
        (planetsOn ? PLANETS_CITED.toFixed(1) : '0') + '″ cited + GR ' + (grOn ? GR_RATE.toFixed(1) : '0') + '″ formula).');
    }
    parts.push('From the sim’s orbit: ' + fmt(meas) + ' per century.');
    if (splitOn) {
      var g = measured(bodies.ghost);
      var left = (meas !== null && g !== null) ? meas - g : null;
      parts.push('Leftover beyond the planets: ' + fmt(left) + '.');
    }
    st.textContent = parts.join(' ');
  }

  /* ── Drawing ───────────────────────────────────────────── */
  var stars = [];
  function makeStars() {
    stars = [];
    var seed = 34;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var i = 0; i < 90; i++) stars.push([rnd(), rnd(), rnd() * 0.9 + 0.3, rnd() * 0.35 + 0.08]);
  }

  function layout() {
    var narrow = W < 520;
    var barH = narrow ? 92 : 78;
    var orbitH = H - barH;
    var top = narrow ? 92 : 0;
    var cx = narrow ? W / 2 : W * 0.56;
    var cy = top + (orbitH - top) / 2;
    var rMax = A_M * (1 + E_M);
    var scale = Math.min(narrow ? W * 0.40 : W * 0.36, (orbitH - top) * 0.44) / rMax;
    return { cx: cx, cy: cy, scale: scale, barY: orbitH, barH: barH };
  }

  /* text that never runs off the canvas edge */
  function label(txt, x, y, alignRight) {
    var w = ctx.measureText(txt).width;
    var left = alignRight ? x - w : x;
    left = Math.max(4, Math.min(W - w - 4, left));
    ctx.textAlign = 'left';
    ctx.fillText(txt, left, y);
  }

  function ellipsePath(L, el) {
    ctx.beginPath();
    for (var i = 0; i <= 160; i++) {
      var th = i / 160 * 2 * Math.PI;
      var r = el.p / (1 + el.e * Math.cos(th - el.w));
      var px = L.cx + r * Math.cos(th) * L.scale;
      var py = L.cy - r * Math.sin(th) * L.scale;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function periPoint(L, el, extra) {
    var rp = el.p / (1 + el.e) * (extra || 1);
    return [L.cx + rp * Math.cos(el.w) * L.scale, L.cy - rp * Math.sin(el.w) * L.scale];
  }

  function draw() {
    if (!ctx || !W) return;
    var L = layout();
    ctx.clearRect(0, 0, W, H);

    /* stars */
    for (var s = 0; s < stars.length; s++) {
      ctx.fillStyle = 'oklch(1 0 0 / ' + stars[s][3].toFixed(2) + ')';
      ctx.fillRect(stars[s][0] * W, stars[s][1] * L.barY, stars[s][2], stars[s][2]);
    }

    var m = bodies.main, g = bodies.ghost;
    var elM = elements(m), elG = elements(g);

    /* start direction reference */
    ctx.save();
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = COL.faint;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(L.cx, L.cy);
    ctx.lineTo(L.cx + A_M * (1 - E_M) * 1.55 * L.scale, L.cy);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = COL.muted;
    ctx.font = '11px "DM Sans", sans-serif';
    label('start', L.cx + A_M * (1 - E_M) * 1.58 * L.scale, L.cy - 6, false);

    /* past perihelion directions */
    for (var i = 0; i < m.history.length; i++) {
      var a = m.history[i];
      var al = 0.15 + 0.6 * (i + 1) / m.history.length;
      var r0 = A_M * (1 - E_M) * 1.12 * L.scale, r1 = r0 + 7;
      ctx.strokeStyle = 'oklch(0.68 0.20 310 / ' + al.toFixed(2) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(L.cx + r0 * Math.cos(a), L.cy - r0 * Math.sin(a));
      ctx.lineTo(L.cx + r1 * Math.cos(a), L.cy - r1 * Math.sin(a));
      ctx.stroke();
    }

    /* ghost (planets-only) orbit when split view is on */
    if (splitOn) {
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = COL.ghost;
      ctx.lineWidth = 1.2;
      ellipsePath(L, elG);
      ctx.stroke();
      var gp = periPoint(L, elG, 1.4);
      ctx.beginPath();
      ctx.moveTo(L.cx, L.cy);
      ctx.lineTo(gp[0], gp[1]);
      ctx.stroke();
      ctx.restore();

      /* leftover wedge between the two perihelia */
      var d = elM.w - elG.w;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      var rr = A_M * (1 - E_M) * 1.3 * L.scale;
      if (Math.abs(d) > 0.002) {
        ctx.strokeStyle = COL.teal;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(L.cx, L.cy, rr, -elG.w, -elG.w - d, d > 0);
        ctx.stroke();
      }
      var mid = elG.w + d / 2;
      ctx.fillStyle = COL.teal;
      ctx.font = '12px "DM Sans", sans-serif';
      label(grOn ? 'leftover' : 'no leftover without GR',
        L.cx + (rr - 12) * Math.cos(mid) + (Math.cos(mid) >= 0 ? 0 : 0), L.cy - (rr - 12) * Math.sin(mid) + 18, Math.cos(mid) < 0);
    }

    /* main osculating orbit */
    ctx.strokeStyle = COL.eraDim;
    ctx.lineWidth = 1.2;
    ellipsePath(L, elM);
    ctx.stroke();

    /* trail */
    if (trail.length > 4) {
      ctx.strokeStyle = 'oklch(0.68 0.20 310 / 0.55)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(L.cx + trail[0] * L.scale, L.cy - trail[1] * L.scale);
      for (var t = 2; t < trail.length; t += 2) {
        ctx.lineTo(L.cx + trail[t] * L.scale, L.cy - trail[t + 1] * L.scale);
      }
      ctx.stroke();
    }

    /* current perihelion line */
    var pp = periPoint(L, elM, 1.4);
    ctx.strokeStyle = COL.era;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(L.cx, L.cy);
    ctx.lineTo(pp[0], pp[1]);
    ctx.stroke();
    ctx.fillStyle = COL.era;
    ctx.font = '12px "DM Sans", sans-serif';
    label('perihelion', pp[0] + (Math.cos(elM.w) >= 0 ? 6 : -6), pp[1] - 6, Math.cos(elM.w) < 0);

    /* Sun */
    var grd = ctx.createRadialGradient(L.cx, L.cy, 0, L.cx, L.cy, 26);
    grd.addColorStop(0, 'oklch(0.95 0.10 90)');
    grd.addColorStop(0.35, 'oklch(0.80 0.15 75 / 0.8)');
    grd.addColorStop(1, 'oklch(0.80 0.15 75 / 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, 26, 0, 2 * Math.PI);
    ctx.fill();

    /* Mercury */
    var mx = L.cx + m.x * L.scale, my = L.cy - m.y * L.scale;
    ctx.fillStyle = 'oklch(0.85 0.05 310)';
    ctx.beginPath();
    ctx.arc(mx, my, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = COL.text;
    label('Mercury', mx + 8, my - 8, false);

    drawPanel(L);
    drawBudget(L);
  }

  function drawPanel(L) {
    var x = 14, y = 22, lh = 18;
    var narrow = W < 520;
    ctx.textAlign = 'left';
    ctx.font = (narrow ? '11px' : '12px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.muted;
    ctx.fillText('Effects shown ' + K.toLocaleString('en-US') + '× stronger; numbers are real-scale', x, y);
    var m = bodies.main;
    var orbits = Math.max(0, m.passes - 1);
    ctx.fillText('Orbits shown: ' + orbits + '  (≈ ' + (orbits * 87.97 / 365.25).toFixed(1) + ' years)', x, y + lh);
    ctx.font = (narrow ? '13px' : '14px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.text;
    ctx.fillText('Model (cited planets + 1PN): ' + modelRate(grOn).toFixed(1) + '″ per century', x, y + 2 * lh + 4);
    ctx.font = (narrow ? '11px' : '12px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.muted;
    ctx.fillText('from the sim’s orbit: ' + fmt(measured(m)), x, y + 3 * lh + 4);
  }

  function drawBudget(L) {
    var pad = 14;
    var y0 = L.barY + 10;
    var bw = W - 2 * pad;
    var full = PLANETS_CITED + GR_RATE;
    var pW = planetsOn ? bw * PLANETS_CITED / full : 0;
    var gW = grOn ? bw * GR_RATE / full : 0;
    var narrow = W < 520;

    ctx.fillStyle = COL.muted;
    ctx.textAlign = 'left';
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.fillText(splitOn ? 'Where the advance comes from (arcsec per century)' : 'Total perihelion advance in this model (arcsec per century)', pad, y0 + 6);

    var by = y0 + 16, bh = 16;
    ctx.fillStyle = COL.faint;
    ctx.fillRect(pad, by, bw, bh);
    if (splitOn) {
      ctx.fillStyle = 'oklch(0.75 0.03 250 / 0.6)';
      ctx.fillRect(pad, by, pW, bh);
      ctx.fillStyle = COL.teal;
      ctx.fillRect(pad + pW, by, gW, bh);
    } else {
      ctx.fillStyle = COL.eraDim;
      ctx.fillRect(pad, by, pW + gW, bh);
    }

    ctx.font = (narrow ? '11px' : '12px') + ' "DM Sans", sans-serif';
    var ty = by + bh + 16;
    if (splitOn) {
      ctx.fillStyle = COL.ghost;
      ctx.fillText('Newtonian pull of the planets: ' + (planetsOn ? PLANETS_CITED.toFixed(1) : '0') + '″ (cited)', pad, ty);
      ctx.fillStyle = COL.teal;
      var leftTxt = 'Leftover: ' + (grOn ? GR_RATE.toFixed(1) + '″ (GR, 1PN)' : 'off');
      if (narrow) ctx.fillText(leftTxt, pad, ty + 16);
      else { ctx.textAlign = 'right'; ctx.fillText(leftTxt, W - pad, ty); }
    } else {
      ctx.fillStyle = COL.text;
      ctx.fillText(modelRate(grOn).toFixed(1) + '″ per century', pad, ty);
    }
  }

  /* ── Loop ──────────────────────────────────────────────── */
  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    step(dt * ORBITS_PER_SEC * T_M);
    draw();
    updateReadouts(false);
    rafId = requestAnimationFrame(loop);
  }

  /* reduced motion: jump ahead without animating */
  function advanceStatic(nOrbits) {
    for (var i = 0; i < nOrbits; i++) step(T_M);
    draw();
    updateReadouts(true);
  }

  /* ── SimAPI ────────────────────────────────────────────── */
  function start() {
    if (running) return;
    running = true;
    lastTs = null;
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '⏸ Pause'; btn.dataset.state = 'playing'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.add('is-running');
    if (!reducedMotion) rafId = requestAnimationFrame(loop);
    else advanceStatic(12);
    if (reducedMotion) running = false;
  }

  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '▶ Play'; btn.dataset.state = 'paused'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.remove('is-running');
  }

  function reset() {
    pause();
    initState();
    lastCaptionPass = -1;
    draw();
    updateReadouts(true);
  }

  function destroy() {
    pause();
    window.removeEventListener('resize', onResize);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  /* ── Setup ─────────────────────────────────────────────── */
  var mountEl;
  function onResize() {
    if (!mountEl || !canvas) return;
    var rect = mountEl.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    W = Math.round(rect.width);
    H = W < 520 ? 560 : Math.max(460, Math.round(Math.min(W * 0.62, 560)));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function setToggle(btn, on, onText, offText) {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? onText : offText;
    btn.style.borderColor = on ? 'var(--era-stop-color, var(--color-gold))' : '';
    btn.style.color = on ? 'var(--color-text)' : '';
  }

  /* Changing the physics restarts the orbit so the readouts stay clean */
  function restartPhysics() {
    initState();
    lastCaptionPass = -1;
    if (reducedMotion) advanceStatic(12);
    else { draw(); updateReadouts(true); }
  }

  function setup() {
    mountEl = document.getElementById('sim-mount');
    if (!mountEl) return;
    initState();
    makeStars();
    canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Mercury orbiting the Sun; its perihelion direction slowly turns');
    mountEl.appendChild(canvas);
    ctx = canvas.getContext('2d');
    requestAnimationFrame(function () { onResize(); updateReadouts(true); });
    window.addEventListener('resize', onResize);

    var grBtn = document.getElementById('gr-toggle');
    if (grBtn) {
      setToggle(grBtn, grOn, 'GR correction: on (1PN)', 'Add GR correction (1PN)');
      grBtn.addEventListener('click', function () {
        grOn = !grOn;
        setToggle(grBtn, grOn, 'GR correction: on (1PN)', 'Add GR correction (1PN)');
        restartPhysics();
      });
    }
    var plBtn = document.getElementById('planets-toggle');
    if (plBtn) {
      setToggle(plBtn, planetsOn, 'Planets\u2019 pull: on', 'Planets\u2019 pull: off');
      plBtn.addEventListener('click', function () {
        planetsOn = !planetsOn;
        setToggle(plBtn, planetsOn, 'Planets\u2019 pull: on', 'Planets\u2019 pull: off');
        restartPhysics();
      });
    }
    var spBtn = document.getElementById('split-toggle');
    if (spBtn) {
      setToggle(spBtn, splitOn, 'Showing: planets vs leftover', 'Show planets vs leftover');
      spBtn.addEventListener('click', function () {
        splitOn = !splitOn;
        setToggle(spBtn, splitOn, 'Showing: planets vs leftover', 'Show planets vs leftover');
        draw();
        updateReadouts(true);
      });
    }
    var ex = document.getElementById('exag-slider');
    var exVal = document.getElementById('exag-val');
    if (ex) {
      ex.addEventListener('input', function () {
        exagIdx = parseInt(this.value, 10);
        K = EXAG[exagIdx];
        RING_SCALE = PLANETS_CITED / RING_RAW[exagIdx];
        if (exVal) exVal.textContent = K.toLocaleString('en-US') + '×';
        ex.setAttribute('aria-valuetext', K.toLocaleString('en-US') + ' times');
        restartPhysics();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}());
