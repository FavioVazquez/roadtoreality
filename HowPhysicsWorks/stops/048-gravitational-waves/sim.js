/* ============================================================
   sim.js — Stop 048: Gravitational Waves
   Binary black-hole inspiral at leading (quadrupole) order:
     r(t)  = [ (256/5) η (t_c − t) ]^(1/4)        (units of GM/c³)
     φ(r)  = (r0^(5/2) − r^(5/2)) / (32 η)
     f_GW  = ω/π,  ω = r^(−3/2)
     h     = 4 η (GM/c²) / (r D) · cos 2φ       (face-on)
   followed by an exponentially damped ringdown at the
   fundamental quasinormal frequency (Berti et al. 2006 fit).
   The animation is slowed down; the audio is pitch-shifted.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H;
  var running = false;
  var rafId   = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastTs  = null;

  /* ── Constants ─────────────────────────────────────────── */
  var T_SUN   = 4.925491e-6;     /* G M_sun / c³ in seconds  */
  var L_SUN   = 1.476625;        /* G M_sun / c² in km       */
  var D_KM    = 410 * 3.0857e19; /* 410 Mpc in km (GW150914 distance, cited) */
  var R0      = 13;              /* starting separation, units of GM/c²      */
  var R_MERGE = 2.8;             /* switch to ringdown here                  */
  var SPIN_F  = 0.69;            /* typical remnant spin for near-equal masses */
  var ANIM_INSPIRAL = 9;         /* seconds of animation for the inspiral    */
  var HOLD = 2.5;                /* pause on the remnant before looping      */
  var PITCH = 4;                 /* audio frequency multiplier               */
  var AUDIO_SECS = 4;            /* audio duration                           */

  var m1 = 36, m2 = 29;
  var P;           /* derived parameters for the current masses */
  var wave;        /* precomputed strain samples */
  var u = 0;       /* animation time, s */
  var ripples = [];
  var lastCrest = 0;
  var phase = '';

  var COL = {
    era:    'oklch(0.68 0.22 20)',
    eraDim: 'oklch(0.68 0.22 20 / 0.35)',
    gold:   'oklch(0.78 0.14 82)',
    text:   'oklch(0.92 0 0)',
    muted:  'oklch(0.62 0 0)',
    faint:  'oklch(1 0 0 / 0.10)',
    bh2:    'oklch(0.75 0.12 250)'
  };

  /* ── Physics ───────────────────────────────────────────── */
  function derive() {
    var M = m1 + m2;
    var eta = m1 * m2 / (M * M);
    var tM = M * T_SUN;                         /* seconds per unit of GM/c³ */
    var tc = 5 / 256 * Math.pow(R0, 4) / eta;   /* to r = 0, units of M */
    var tMerge = tc - 5 / 256 * Math.pow(R_MERGE, 4) / eta;
    var fRing = (1.5251 - 1.1568 * Math.pow(1 - SPIN_F, 0.1292)) / (2 * Math.PI * tM);
    var Q = 0.7 + 1.4187 * Math.pow(1 - SPIN_F, -0.4990);
    var tauD = Q / (Math.PI * fRing);           /* seconds */
    var tIns = tMerge * tM;                     /* seconds */
    var tTot = tIns + 6 * tauD;
    return {
      M: M, eta: eta, tM: tM, tc: tc, tIns: tIns, tTot: tTot,
      fRing: fRing, tauD: tauD,
      Mc: M * Math.pow(eta, 0.6),
      slow: ANIM_INSPIRAL / tIns,
      phiMerge: (Math.pow(R0, 2.5) - Math.pow(R_MERGE, 2.5)) / (32 * eta),
      hMerge: strainAmp(eta, M, R_MERGE)
    };
  }

  function strainAmp(eta, M, r) { return 4 * eta * L_SUN * M / (r * D_KM); }

  /* State at physical time t (s) since the start */
  function stateAt(t) {
    if (t < P.tIns) {
      var tau = P.tc - t / P.tM;
      var r = Math.pow(256 / 5 * P.eta * tau, 0.25);
      var phi = (Math.pow(R0, 2.5) - Math.pow(r, 2.5)) / (32 * P.eta);
      var f = Math.pow(r, -1.5) / (Math.PI * P.tM);
      return { r: r, phi: phi, f: f, amp: strainAmp(P.eta, P.M, r), h: strainAmp(P.eta, P.M, r) * Math.cos(2 * phi), merged: false };
    }
    var dt = t - P.tIns;
    var env = Math.exp(-dt / P.tauD);
    var ph = 2 * P.phiMerge + 2 * Math.PI * P.fRing * dt;
    return { r: 0, phi: P.phiMerge, gwPhase: ph, f: P.fRing, amp: P.hMerge * env, h: P.hMerge * env * Math.cos(ph), merged: true };
  }

  function buildWave() {
    var N = 3000;
    wave = new Float32Array(N);
    for (var i = 0; i < N; i++) wave[i] = stateAt(i / (N - 1) * P.tTot).h;
  }

  function recompute() {
    P = derive();
    buildWave();
    u = 0; ripples = []; lastCrest = 0; phase = '';
  }

  /* ── Drawing ───────────────────────────────────────────── */
  function layout() {
    var waveH = W < 520 ? 150 : 170;
    var orbitH = H - waveH;
    return { orbitH: orbitH, cx: W / 2, cy: orbitH / 2 + 6, scale: Math.min(W * 0.42, orbitH * 0.40) / (R0 / 2 + 2), waveY: orbitH, waveH: waveH };
  }

  function fmtSci(v) {
    if (v === 0) return '0';
    var e = Math.floor(Math.log(Math.abs(v)) / Math.LN10);
    var sup = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    var ex = String(e).split('').map(function (ch) { return sup[ch]; }).join('');
    return (v / Math.pow(10, e)).toFixed(1) + '×10' + ex;
  }

  function drawBH(x, y, rad, col) {
    var g = ctx.createRadialGradient(x, y, rad * 0.6, x, y, rad * 2.4);
    g.addColorStop(0, col);
    g.addColorStop(1, 'oklch(0 0 0 / 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad * 2.4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = 'oklch(0.04 0 0)';
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, 2 * Math.PI);
    ctx.fill();
  }

  function draw() {
    if (!ctx || !W) return;
    var L = layout();
    var t = Math.min(u / P.slow, P.tTot);
    var s = stateAt(t);
    ctx.clearRect(0, 0, W, H);

    /* ripples */
    for (var i = 0; i < ripples.length; i++) {
      var rp = ripples[i];
      var al = rp.a * Math.max(0, 1 - rp.rad / (Math.max(W, L.orbitH) * 0.75));
      if (al <= 0.01) continue;
      ctx.strokeStyle = 'oklch(0.68 0.22 20 / ' + al.toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(L.cx, L.cy, rp.rad, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, L.orbitH);
    ctx.clip();
    if (!s.merged) {
      var r1 = s.r * m2 / P.M, r2 = s.r * m1 / P.M;
      var c = Math.cos(s.phi), sn = Math.sin(s.phi);
      var x1 = L.cx + r1 * c * L.scale, y1 = L.cy - r1 * sn * L.scale;
      var x2 = L.cx - r2 * c * L.scale, y2 = L.cy + r2 * sn * L.scale;
      /* orbit guide */
      ctx.strokeStyle = COL.faint;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(L.cx, L.cy, r1 * L.scale, 0, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(L.cx, L.cy, r2 * L.scale, 0, 2 * Math.PI); ctx.stroke();
      drawBH(x1, y1, Math.max(4, 2 * m1 / P.M * L.scale), COL.era);
      drawBH(x2, y2, Math.max(4, 2 * m2 / P.M * L.scale), COL.bh2);
      ctx.font = '12px "DM Sans", sans-serif';
      ctx.fillStyle = COL.text;
      ctx.textAlign = 'left';
      ctx.fillText(m1 + ' M☉', x1 + 10, y1 - 10);
      ctx.fillText(m2 + ' M☉', x2 + 10, y2 - 10);
    } else {
      var pulse = 1 + 0.06 * (s.amp / P.hMerge) * Math.cos(s.gwPhase);
      drawBH(L.cx, L.cy, Math.max(6, 2 * 0.95 * L.scale * pulse), 'oklch(0.80 0.14 50)');
    }
    ctx.restore();

    drawReadout(L, s, t);
    drawWave(L, t);
  }

  function drawReadout(L, s, t) {
    var x = 14, y = 22, lh = 17;
    var narrow = W < 520;
    ctx.textAlign = 'left';
    ctx.font = (narrow ? '11px' : '12px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.muted;
    ctx.fillText('Slowed down ' + Math.round(P.slow) + '×', x, y);
    ctx.fillText('Chirp mass ' + P.Mc.toFixed(1) + ' M☉', x, y + lh);
    ctx.font = (narrow ? '13px' : '14px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.text;
    ctx.fillText('Wave frequency ' + Math.round(s.f) + ' Hz', x, y + 2 * lh + 4);
    ctx.font = (narrow ? '11px' : '12px') + ' "DM Sans", sans-serif';
    ctx.fillStyle = COL.muted;
    if (!s.merged) {
      ctx.fillText('Separation ' + Math.round(s.r * P.M * L_SUN).toLocaleString('en-US') + ' km', x, y + 3 * lh + 4);
      ctx.fillText('Time to merger ' + (P.tIns - t).toFixed(3) + ' s', x, y + 4 * lh + 4);
    } else {
      ctx.fillText('Merged: ringdown', x, y + 3 * lh + 4);
    }
  }

  function drawWave(L, t) {
    var pad = 14;
    var x0 = pad, x1 = W - pad;
    var top = L.waveY + 22, bot = H - 22;
    var mid = (top + bot) / 2, half = (bot - top) / 2;
    var hMax = P.hMerge * 1.05;

    ctx.fillStyle = 'oklch(0.09 0 0)';
    ctx.fillRect(0, L.waveY, W, L.waveH);
    ctx.strokeStyle = COL.faint;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, mid); ctx.lineTo(x1, mid); ctx.stroke();

    ctx.font = '11px "DM Sans", sans-serif';
    ctx.fillStyle = COL.muted;
    ctx.textAlign = 'left';
    ctx.fillText('Strain h, face-on at 410 Mpc (peak ' + fmtSci(P.hMerge) + ')', x0, L.waveY + 14);
    ctx.fillText('0 s', x0, H - 6);
    ctx.textAlign = 'right';
    ctx.fillText(P.tTot.toFixed(2) + ' s', x1, H - 6);

    var N = wave.length;
    var nShow = Math.floor(t / P.tTot * (N - 1));
    if (nShow < 1) return;
    ctx.strokeStyle = COL.era;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (var i = 0; i <= nShow; i++) {
      var px = x0 + (x1 - x0) * i / (N - 1);
      var py = mid - wave[i] / hMax * half;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    var cxp = x0 + (x1 - x0) * nShow / (N - 1);
    ctx.fillStyle = COL.text;
    ctx.beginPath();
    ctx.arc(cxp, mid - wave[nShow] / hMax * half, 3, 0, 2 * Math.PI);
    ctx.fill();
  }

  /* ── Update ────────────────────────────────────────────── */
  function setStatus(txt) {
    var st = document.getElementById('sim-status');
    if (st) st.textContent = txt;
  }

  function update(dt) {
    var endAnim = P.tTot * P.slow;
    u += dt;
    if (u > endAnim + HOLD) { u = 0; ripples = []; lastCrest = 0; }
    var t = Math.min(u / P.slow, P.tTot);
    var s = stateAt(t);

    var crest = s.merged ? Math.floor(s.gwPhase / (2 * Math.PI)) : Math.floor(2 * s.phi / (2 * Math.PI));
    if (crest > lastCrest && s.amp > P.hMerge * 0.05) {
      ripples.push({ rad: s.merged ? 2 * L_SUN : s.r * 0.5 * layout().scale, a: 0.15 + 0.6 * s.amp / P.hMerge });
      if (ripples.length > 50) ripples.shift();
    }
    lastCrest = crest;
    for (var i = 0; i < ripples.length; i++) ripples[i].rad += 120 * dt;

    var ph = s.merged ? (s.amp > P.hMerge * 0.02 ? 'ring' : 'done') : (s.f > 0.6 * P.fRing ? 'late' : 'early');
    if (ph !== phase) {
      phase = ph;
      if (ph === 'early') setStatus('Inspiral: the orbit shrinks as gravitational waves carry energy away.');
      else if (ph === 'late') setStatus('Last orbits: faster and closer, so the wave rises in frequency and size. That is the chirp.');
      else if (ph === 'ring') setStatus('Merger, then ringdown: the new black hole rings at about ' + Math.round(P.fRing) + ' Hz and settles.');
      else setStatus('Done. One black hole remains. Change the masses and watch again.');
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

  /* ── Audio (Web Audio, created on first click) ─────────── */
  var audioCtx = null, audioSrc = null;

  function buildChirpBuffer() {
    var sr = audioCtx.sampleRate;
    var n = Math.floor(AUDIO_SECS * sr);
    var buf = audioCtx.createBuffer(1, n, sr);
    var data = buf.getChannelData(0);
    var ph = 0;
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1) * P.tTot;
      var s = stateAt(t);
      var f = Math.min(s.f * PITCH, sr / 2.5);
      ph += 2 * Math.PI * f / sr;
      var env = 0.2 + 0.8 * s.amp / P.hMerge;
      var fade = Math.min(1, i / (0.05 * sr), (n - i) / (0.05 * sr));
      data[i] = 0.35 * env * fade * Math.sin(ph);
    }
    return buf;
  }

  function setAudioBtn(playing) {
    var b = document.getElementById('chirp-audio-btn');
    if (!b) return;
    b.textContent = playing ? '■ Stop chirp' : '♪ Play chirp (scaled audio)';
    b.setAttribute('aria-pressed', playing ? 'true' : 'false');
  }

  function stopAudio() {
    if (audioSrc) {
      try { audioSrc.stop(); } catch (e) { /* already stopped */ }
      audioSrc.disconnect();
      audioSrc = null;
    }
    setAudioBtn(false);
  }

  function playAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { setStatus('Web Audio is not available in this browser.'); return; }
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    stopAudio();
    var src = audioCtx.createBufferSource();
    src.buffer = buildChirpBuffer();
    src.connect(audioCtx.destination);
    src.onended = function () { if (audioSrc === src) { audioSrc = null; setAudioBtn(false); } };
    audioSrc = src;
    src.start();
    setAudioBtn(true);
  }

  /* ── SimAPI ────────────────────────────────────────────── */
  function start() {
    if (running) return;
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '⏸ Pause'; btn.dataset.state = 'playing'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.add('is-running');
    if (reducedMotion) {
      /* show the full waveform at once instead of animating it */
      u = P.tTot * P.slow;
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
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '▶ Play'; btn.dataset.state = 'paused'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.remove('is-running');
  }

  function reset() {
    pause();
    u = 0; ripples = []; lastCrest = 0; phase = '';
    setStatus('Press play to start the inspiral. Use the sliders to change the two masses.');
    draw();
  }

  function destroy() {
    pause();
    stopAudio();
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
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
    H = Math.max(460, Math.round(Math.min(W * 0.64, 580)));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function bindMass(id, valId, which) {
    var sl = document.getElementById(id), val = document.getElementById(valId);
    if (!sl) return;
    sl.addEventListener('input', function () {
      var v = parseInt(this.value, 10);
      if (which === 1) m1 = v; else m2 = v;
      if (val) val.textContent = v + ' M☉';
      sl.setAttribute('aria-valuetext', v + ' solar masses');
      recompute();
      if (reducedMotion) u = P.tTot * P.slow;
      if (audioSrc) playAudio();
      draw();
    });
  }

  function setup() {
    mountEl = document.getElementById('sim-mount');
    if (!mountEl) return;
    recompute();
    canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Two black holes spiral together while the gravitational-wave strain is drawn below as a rising chirp');
    mountEl.appendChild(canvas);
    ctx = canvas.getContext('2d');
    requestAnimationFrame(function () { onResize(); });
    window.addEventListener('resize', onResize);

    bindMass('mass1-slider', 'mass1-val', 1);
    bindMass('mass2-slider', 'mass2-val', 2);

    var ab = document.getElementById('chirp-audio-btn');
    if (ab) {
      ab.addEventListener('click', function () {
        if (audioSrc) stopAudio(); else playAudio();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}());
