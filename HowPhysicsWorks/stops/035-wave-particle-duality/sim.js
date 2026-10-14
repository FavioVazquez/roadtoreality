/* ============================================================
   sim.js — Stop 035: Wave-Particle Duality
   Electrons land one at a time; landing points are random draws from
   the far-field two-slit pattern
     P(y) ∝ cos²(π d y / λD) · sinc²(π a y / λD)
   with the relativistic de Broglie wavelength λ = hc / sqrt(E² + 2E mc²).
   Which-slit detection: incoherent sum of two single-slit patterns.
   One slit blocked: the single-slit pattern of the open slit.
   Geometry (a, D, screen window) is illustrative, not a real experiment.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H, mountEl;
  var running = false, rafId = null, lastTs = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var HC_EV_NM = 1239.84198;          /* hc, eV·nm (CODATA 2018) */
  var MEC2_EV = 510998.95;            /* electron rest energy, eV */
  var SLIT_W_UM = 0.2;                /* illustrative slit width   */
  var D_M = 1.0;                      /* illustrative screen distance */
  var HALF_WIN_UM = 40;               /* screen window ±40 µm     */
  var NBINS = 160, MAX_HITS = 6000;

  var E_KEV = 50, SEP_UM = 1.0;
  var whichSlit = false, showCurve = true, blocked = false;
  var hits = [], bins = new Array(NBINS).fill(0);
  var spawnAcc = 0, flying = [], elapsed = 0;

  var COL = { era: 'oklch(0.68 0.20 310)', dot: 'oklch(0.85 0.14 310)', text: 'rgba(255,255,255,0.88)', muted: 'rgba(255,255,255,0.55)', faint: 'rgba(255,255,255,0.15)', curve: 'oklch(0.85 0.15 95)' };

  function lambdaPm() {
    var E = E_KEV * 1000;
    return HC_EV_NM / Math.sqrt(E * E + 2 * E * MEC2_EV) * 1000;
  }
  function spacingUm() { return lambdaPm() * 1e-12 * D_M / (SEP_UM * 1e-6) * 1e6; }
  function sinc2(u) { if (Math.abs(u) < 1e-9) return 1; var s = Math.sin(u) / u; return s * s; }
  function prob(yUm) {
    var lD = lambdaPm() * 1e-12 * D_M, y = yUm * 1e-6;
    var env = sinc2(Math.PI * SLIT_W_UM * 1e-6 * y / lD);
    if (whichSlit || blocked) return env;
    var c = Math.cos(Math.PI * SEP_UM * 1e-6 * y / lD);
    return c * c * env;
  }
  function sampleY() {
    for (var k = 0; k < 2000; k++) {
      var y = (Math.random() * 2 - 1) * HALF_WIN_UM;
      if (Math.random() < prob(y)) return y;
    }
    return 0;
  }

  function layout() {
    var gun = { x: 14, y: 8, w: W - 28, h: 110 };
    var scr = { x: 14, y: 128, w: W - 28, h: W < 560 ? 190 : 170 };
    var his = { x: 14, y: scr.y + scr.h + 50, w: W - 28, h: H - (scr.y + scr.h + 50) - 30 };
    return { gun: gun, scr: scr, his: his };
  }
  function yToX(r, y) { return r.x + (y / HALF_WIN_UM + 1) / 2 * r.w; }

  function txt(s, x, y, col, size, align) {
    ctx.fillStyle = col || COL.text; ctx.font = (size || 12) + 'px "DM Sans", sans-serif';
    ctx.textAlign = align || 'left'; ctx.fillText(s, x, y);
  }

  function drawGun(r) {
    var cx = r.x + r.w / 2, wallY = r.y + 66;
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(cx - 16, r.y + 6, 32, 20);
    txt('electron source', cx + 24, r.y + 20, COL.muted, 11);
    var gap = Math.min(40, 14 + SEP_UM * 9);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(r.x, wallY, cx - gap / 2 - 3 - r.x, 5);
    ctx.fillRect(cx - gap / 2 + 3, wallY, gap - 6, 5);
    ctx.fillRect(cx + gap / 2 + 3, wallY, r.x + r.w - (cx + gap / 2 + 3), 5);
    if (blocked) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(cx + gap / 2 - 5, wallY - 3, 10, 11);
      txt('right slit blocked', r.x, wallY - 8, COL.curve, 11);
    } else if (whichSlit) {
      ctx.fillStyle = COL.curve;
      ctx.beginPath(); ctx.arc(cx - gap / 2, wallY + 14, 4, 0, 2 * Math.PI); ctx.arc(cx + gap / 2, wallY + 14, 4, 0, 2 * Math.PI); ctx.fill();
      txt('which-slit detectors on', r.x, wallY - 8, COL.curve, 11);
    } else {
      ctx.strokeStyle = 'oklch(0.68 0.20 310 / 0.25)'; ctx.lineWidth = 1;
      var ph = (elapsed * 30) % 12;
      for (var s = -1; s <= 1; s += 2) for (var k = 0; k < 4; k++) {
        ctx.beginPath(); ctx.arc(cx + s * gap / 2, wallY + 5, ph + k * 12, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      }
    }
    txt('two slits, ' + SEP_UM.toFixed(1) + ' µm apart', r.x, wallY + 26, COL.muted, 11);
    ctx.fillStyle = COL.dot;
    for (var i = 0; i < flying.length; i++) {
      var f = flying[i], t = f.t, px, py;
      if (t < 0.5) { px = cx; py = r.y + 26 + t * 2 * (wallY - r.y - 26); }
      else { var u = (t - 0.5) * 2; px = cx + (yToX(layout().scr, f.y) - cx) * u; py = wallY + 5 + u * (r.y + r.h + 20 - wallY - 5); }
      ctx.beginPath(); ctx.arc(px, py, 2.5, 0, 2 * Math.PI); ctx.fill();
    }
  }

  function drawScreen(r) {
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = COL.faint; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    ctx.fillStyle = COL.dot;
    var n = hits.length, rad = n > 2000 ? 1.2 : (n > 300 ? 1.8 : 2.6);
    for (var i = 0; i < n; i++) ctx.fillRect(yToX(r, hits[i].y) - rad / 2, r.y + 4 + hits[i].v * (r.h - 8), rad, rad);
    txt('Detector screen: ' + n + ' electron' + (n === 1 ? '' : 's'), r.x, r.y + r.h + 16, COL.text, 12);
    txt('−40 µm … +40 µm', r.x + r.w, r.y + r.h + 16, COL.muted, 11, 'right');
  }

  function drawHist(r) {
    var n = hits.length, maxB = 1;
    for (var i = 0; i < NBINS; i++) if (bins[i] > maxB) maxB = bins[i];
    var sum = 0, pv = [];
    for (i = 0; i < NBINS; i++) { var y = -HALF_WIN_UM + (i + 0.5) / NBINS * 2 * HALF_WIN_UM; pv.push(prob(y)); sum += pv[i]; }
    var expMax = 0;
    for (i = 0; i < NBINS; i++) expMax = Math.max(expMax, n * pv[i] / sum);
    var top = Math.max(maxB, expMax, 1), bw = r.w / NBINS, base = r.y + r.h;
    ctx.fillStyle = 'oklch(0.68 0.20 310 / 0.55)';
    for (i = 0; i < NBINS; i++) { var h = bins[i] / top * (r.h - 6); ctx.fillRect(r.x + i * bw + 0.5, base - h, bw - 1, h); }
    if (showCurve) {
      ctx.strokeStyle = COL.curve; ctx.lineWidth = 2; ctx.beginPath();
      for (var j = 0; j <= 300; j++) {
        var yy = -HALF_WIN_UM + j / 300 * 2 * HALF_WIN_UM;
        var v = n > 0 ? n * prob(yy) / sum / top : prob(yy);
        var X = yToX(r, yy), Y = base - v * (r.h - 6);
        if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = COL.faint; ctx.beginPath(); ctx.moveTo(r.x, base + 0.5); ctx.lineTo(r.x + r.w, base + 0.5); ctx.stroke();
    txt('Counts per position' + (showCurve ? ' · curve: wave prediction P(y) (formula)' : ''), r.x, r.y - 8, COL.muted, 11);
    if (!whichSlit && !blocked) {
      var sp = spacingUm(), xa = yToX(r, 0), xb = yToX(r, sp), yb = r.y + 14;
      ctx.strokeStyle = COL.text; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(xa, yb - 4); ctx.lineTo(xa, yb + 4); ctx.moveTo(xa, yb); ctx.lineTo(xb, yb); ctx.moveTo(xb, yb - 4); ctx.lineTo(xb, yb + 4); ctx.stroke();
      txt('λD/d', xb + 4, yb + 4, COL.text, 11);
    }
    txt('λ = ' + lambdaPm().toFixed(2) + ' pm · fringe spacing λD/d = ' + (whichSlit || blocked ? '— (no fringes)' : spacingUm().toFixed(1) + ' µm'), r.x, base + 18, COL.text, 12);
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    var L_ = layout();
    drawGun(L_.gun); drawScreen(L_.scr); drawHist(L_.his);
  }

  function addHit() {
    if (hits.length >= MAX_HITS) return;
    var y = sampleY();
    hits.push({ y: y, v: Math.random() });
    var b = Math.floor((y + HALF_WIN_UM) / (2 * HALF_WIN_UM) * NBINS);
    if (b >= 0 && b < NBINS) bins[b]++;
  }

  function step(dt) {
    elapsed += dt;
    for (var i = flying.length - 1; i >= 0; i--) {
      flying[i].t += dt * 2.2;
      if (flying[i].t >= 1) { var f = flying.splice(i, 1)[0]; land(f.y); }
    }
    if (hits.length + flying.length >= MAX_HITS) return;
    var rate = Math.min(600, 3 + hits.length * 0.6);   /* display choice: slow start */
    spawnAcc += rate * dt;
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      if (rate < 40) flying.push({ t: 0, y: sampleY() });
      else addHit();
    }
  }
  function land(y) {
    if (hits.length >= MAX_HITS) return;
    hits.push({ y: y, v: Math.random() });
    var b = Math.floor((y + HALF_WIN_UM) / (2 * HALF_WIN_UM) * NBINS);
    if (b >= 0 && b < NBINS) bins[b]++;
  }

  function clearHits() { hits = []; bins = new Array(NBINS).fill(0); flying = []; spawnAcc = 0; }

  function setStatus() {
    var el = document.getElementById('sim-status'); if (!el) return;
    el.textContent = blocked
      ? 'One slit blocked: the dots spread over the single-slit pattern, with no fringes. λ = ' + lambdaPm().toFixed(2) + ' pm.'
      : whichSlit
      ? 'Which-slit detectors on: no fringes, only the smooth single-slit spread. λ = ' + lambdaPm().toFixed(2) + ' pm.'
      : 'Both paths open and unrecorded: dots build fringes ' + spacingUm().toFixed(1) + ' µm apart (λ = ' + lambdaPm().toFixed(2) + ' pm at ' + E_KEV + ' keV).';
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05); lastTs = ts;
    step(dt); draw();
    rafId = requestAnimationFrame(loop);
  }
  function setBtn(p) {
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = p ? '⏸ Pause' : '▶ Play'; btn.dataset.state = p ? 'playing' : 'paused'; }
    var dot = document.querySelector('.sim-caption__dot'); if (dot) dot.classList.toggle('is-running', p);
  }
  function start() {
    if (running) return;
    if (reducedMotion) { for (var i = 0; i < 1500; i++) addHit(); draw(); return; }
    running = true; lastTs = null; setBtn(true); rafId = requestAnimationFrame(loop);
  }
  function pause() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; setBtn(false); }
  function reset() { pause(); clearHits(); elapsed = 0; draw(); setStatus(); }
  function destroy() { pause(); window.removeEventListener('resize', onResize); if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  function onResize() {
    if (!mountEl || !canvas) return;
    var dpr = window.devicePixelRatio || 1;
    W = Math.round(mountEl.getBoundingClientRect().width) || 680;
    H = W < 560 ? 540 : 500;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }

  function init() {
    mountEl = document.getElementById('sim-mount'); if (!mountEl) return;
    canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Electrons passing two slits and landing as dots on a detector screen, with a histogram of landing positions');
    canvas.style.display = 'block'; mountEl.appendChild(canvas); ctx = canvas.getContext('2d');
    var es = document.getElementById('energy-slider'), ss = document.getElementById('sep-slider');
    if (es) es.addEventListener('input', function () {
      E_KEV = parseFloat(es.value); document.getElementById('energy-val').textContent = E_KEV + ' keV';
      es.setAttribute('aria-valuetext', E_KEV + ' kiloelectronvolts'); clearHits(); setStatus(); draw();
    });
    if (ss) ss.addEventListener('input', function () {
      SEP_UM = parseFloat(ss.value); document.getElementById('sep-val').textContent = SEP_UM.toFixed(1) + ' µm';
      ss.setAttribute('aria-valuetext', SEP_UM.toFixed(1) + ' micrometres'); clearHits(); setStatus(); draw();
    });
    var wt = document.getElementById('which-toggle');
    if (wt) wt.addEventListener('click', function () {
      whichSlit = !whichSlit; wt.setAttribute('aria-pressed', String(whichSlit));
      wt.textContent = whichSlit ? 'Stop detecting which slit' : 'Detect which slit'; clearHits(); setStatus(); draw();
    });
    var bt = document.getElementById('block-toggle');
    if (bt) bt.addEventListener('click', function () {
      blocked = !blocked; bt.setAttribute('aria-pressed', String(blocked));
      bt.textContent = blocked ? 'Open both slits' : 'Block one slit'; clearHits(); setStatus(); draw();
    });
    var ct = document.getElementById('curve-toggle');
    if (ct) ct.addEventListener('click', function () {
      showCurve = !showCurve; ct.setAttribute('aria-pressed', String(showCurve));
      ct.textContent = showCurve ? 'Hide wave prediction' : 'Show wave prediction'; draw();
    });
    window.addEventListener('resize', onResize); onResize(); setStatus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
