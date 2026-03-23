/* ============================================================
   sim.js — Stop 020: Carnot Heat Engine
   PV diagram: 4 analytically-defined curve segments
     (isothermal = hyperbola, adiabatic = power law)
   closePath() used for work-area fill
   T_H / T_C sliders, live efficiency readout
   Animated tracing dot + right-panel piston
   ES5 IIFE, no const/let/arrow functions/template literals
   ============================================================ */
(function () {
  'use strict';

  /* ── Mount & canvas setup ─────────────────────────────────── */
  var mount = document.getElementById('sim-mount');
  if (!mount) return;

  var canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width  = '100%';
  canvas.style.height = '100%';
  mount.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var W, H, splitX;
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Physics constants ────────────────────────────────────── */
  var R     = 8.314;
  var n     = 1.0;
  var GAMMA = 1.4;
  var STEPS = 40;   /* points per curve segment */

  /* ── Temperature state ────────────────────────────────────── */
  var tH = 600;  /* hot reservoir K */
  var tC = 300;  /* cold reservoir K */

  /* ── Animation state ──────────────────────────────────────── */
  var cyclePhase = 0;  /* 0..1 loops */

  /* ── Controls ─────────────────────────────────────────────── */
  var hotSliderEl   = document.getElementById('hot-temp-slider');
  var coldSliderEl  = document.getElementById('cold-temp-slider');
  var hotLabelEl    = document.getElementById('hot-temp-label');
  var coldLabelEl   = document.getElementById('cold-temp-label');

  /* ── Resize ───────────────────────────────────────────────── */
  function resize() {
    var w = mount.clientWidth  || 720;
    var h = mount.clientHeight || 380;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w;
    H = h;
    splitX = W * 0.60;
  }

  /* ── Clamp helper ─────────────────────────────────────────── */
  function clamp(val, lo, hi) {
    return val < lo ? lo : val > hi ? hi : val;
  }

  /* ── Compute Carnot cycle corner volumes ──────────────────── */
  function computeCycle() {
    /* V1 = 1.0 (normalized). V2 = 2 * V1 (expansion ratio). */
    var V1 = 1.0;
    var V2 = V1 * 2.0;
    /* Adiabatic V3: T_H * V2^(γ-1) = T_C * V3^(γ-1) → V3 = V2 * (T_H/T_C)^(1/(γ-1)) */
    var ratio = tH / tC;
    var exp_ad = 1.0 / (GAMMA - 1.0);
    var V3 = V2 * Math.pow(ratio, exp_ad);
    /* Adiabatic V4: T_C * V4^(γ-1) = T_H * V1^(γ-1) → V4 = V1 * (T_H/T_C)^(1/(γ-1)) */
    var V4 = V1 * Math.pow(ratio, exp_ad);
    return { V1: V1, V2: V2, V3: V3, V4: V4 };
  }

  /* ── Pressure helpers ─────────────────────────────────────── */
  function P_iso(V, T) {
    return n * R * T / V;
  }

  function P_ad(V, K_ad) {
    /* P = K_ad / V^gamma */
    return K_ad / Math.pow(V, GAMMA);
  }

  /* ── Build screen-coordinate mapping ─────────────────────── */
  function buildMapper(cyc) {
    var V1 = cyc.V1, V2 = cyc.V2, V3 = cyc.V3, V4 = cyc.V4;
    var Vmax = V3 * 1.10;
    var Pmin = P_iso(V3, tC) * 0.70;
    var Pmax = P_iso(V1, tH) * 1.15;

    /* Graph area inside left panel */
    var gLeft  = W * 0.07;
    var gRight = splitX - W * 0.04;
    var gBot   = H * 0.86;
    var gTop   = H * 0.10;

    function toX(V) {
      return gLeft + (V / Vmax) * (gRight - gLeft);
    }
    function toY(P) {
      return gBot - ((P - Pmin) / (Pmax - Pmin)) * (gBot - gTop);
    }

    return {
      toX: toX, toY: toY,
      gLeft: gLeft, gRight: gRight, gBot: gBot, gTop: gTop,
      Vmax: Vmax, Pmin: Pmin, Pmax: Pmax,
      V1: V1, V2: V2, V3: V3, V4: V4
    };
  }

  /* ── Generate points for a segment ───────────────────────── */
  function segPoints(Vstart, Vend, mode, K_param, T_param, m) {
    var pts = [];
    for (var i = 0; i <= STEPS; i++) {
      var V = Vstart + (Vend - Vstart) * (i / STEPS);
      var P;
      if (mode === 'iso') {
        P = P_iso(V, T_param);
      } else {
        P = P_ad(V, K_param);
      }
      pts.push({ x: m.toX(V), y: m.toY(P) });
    }
    return pts;
  }

  /* ── Draw one filled+stroked segment path ─────────────────── */
  function drawSegment(pts, color) {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  /* ── Draw work-area fill (all 4 segments, one closed path) ── */
  function drawWorkFill(seg1, seg2, seg3, seg4, m) {
    ctx.beginPath();
    /* Segment 1: isothermal expansion */
    ctx.moveTo(seg1[0].x, seg1[0].y);
    for (var i = 1; i < seg1.length; i++) {
      ctx.lineTo(seg1[i].x, seg1[i].y);
    }
    /* Segment 2: adiabatic expansion */
    for (var j = 1; j < seg2.length; j++) {
      ctx.lineTo(seg2[j].x, seg2[j].y);
    }
    /* Segment 3: isothermal compression (reversed direction) */
    for (var k = 1; k < seg3.length; k++) {
      ctx.lineTo(seg3[k].x, seg3[k].y);
    }
    /* Segment 4: adiabatic compression (reversed) */
    for (var l = 1; l < seg4.length; l++) {
      ctx.lineTo(seg4[l].x, seg4[l].y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(82,133,200,0.12)';
    ctx.fill();
  }

  /* ── Interpolate position along full cycle for dot ─────────  */
  function cyclePos(phase, seg1, seg2, seg3, seg4) {
    var allSegs = [seg1, seg2, seg3, seg4];
    /* Each segment occupies 0.25 of phase */
    var totalPhase = phase % 1.0;
    var segIdx = Math.floor(totalPhase * 4);
    var segFrac = (totalPhase * 4) - segIdx;
    if (segIdx >= 4) { segIdx = 3; segFrac = 1.0; }
    var seg = allSegs[segIdx];
    var idx = Math.floor(segFrac * (seg.length - 1));
    idx = clamp(idx, 0, seg.length - 1);
    return seg[idx];
  }

  /* ── Draw PV diagram (left panel) ────────────────────────── */
  function drawPVDiagram(cyc, m, eta) {
    /* Background tint */
    ctx.fillStyle = 'rgba(10,12,20,0.3)';
    ctx.fillRect(0, 0, splitX, H);

    /* Axes */
    ctx.strokeStyle = 'rgba(82,133,200,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(m.gLeft, m.gTop - 10);
    ctx.lineTo(m.gLeft, m.gBot);
    ctx.lineTo(m.gRight + 15, m.gBot);
    ctx.stroke();

    /* Axis labels */
    ctx.fillStyle = 'rgba(82,133,200,0.75)';
    ctx.font = Math.round(H * 0.038) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('P', m.gLeft, m.gTop - 15);
    ctx.fillText('V', m.gRight + 20, m.gBot + 4);
    ctx.textAlign = 'left';

    /* Corner V labels on x-axis */
    var vLabels = [
      { V: cyc.V1, label: 'V\u2081' },
      { V: cyc.V2, label: 'V\u2082' },
      { V: cyc.V4, label: 'V\u2084' },
      { V: cyc.V3, label: 'V\u2083' }
    ];
    ctx.fillStyle = 'rgba(82,133,200,0.55)';
    ctx.font = Math.round(H * 0.030) + 'px monospace';
    for (var vi = 0; vi < vLabels.length; vi++) {
      var vx = m.toX(vLabels[vi].V);
      ctx.textAlign = 'center';
      ctx.fillText(vLabels[vi].label, vx, m.gBot + 18);
      /* dashed vertical guide */
      ctx.beginPath();
      ctx.setLineDash([3, 4]);
      ctx.moveTo(vx, m.gBot);
      ctx.lineTo(vx, m.gBot - 10);
      ctx.strokeStyle = 'rgba(82,133,200,0.20)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.textAlign = 'left';

    /* Compute adiabatic constants */
    var K12 = P_iso(cyc.V2, tH) * Math.pow(cyc.V2, GAMMA);
    var K34 = P_iso(cyc.V4, tC) * Math.pow(cyc.V4, GAMMA);

    /* Build segment point arrays */
    var seg1 = segPoints(cyc.V1, cyc.V2, 'iso', 0, tH, m);                /* isothermal expansion at T_H */
    var seg2 = segPoints(cyc.V2, cyc.V3, 'ad',  K12, 0, m);               /* adiabatic expansion */
    var seg3 = segPoints(cyc.V3, cyc.V4, 'iso', 0, tC, m);                /* isothermal compression at T_C */
    var seg4 = segPoints(cyc.V4, cyc.V1, 'ad',  K34, 0, m);               /* adiabatic compression */

    /* Work fill */
    drawWorkFill(seg1, seg2, seg3, seg4, m);

    /* Draw each segment with its color */
    drawSegment(seg1, 'rgba(220,80,80,0.90)');    /* hot isotherm — red */
    drawSegment(seg2, 'rgba(200,140,50,0.90)');   /* adiabatic exp — orange */
    drawSegment(seg3, 'rgba(82,133,200,0.90)');   /* cold isotherm — blue */
    drawSegment(seg4, 'rgba(50,180,150,0.90)');   /* adiabatic comp — teal */

    /* T_H / T_C curve labels */
    var midS1 = seg1[Math.floor(seg1.length / 2)];
    var midS3 = seg3[Math.floor(seg3.length / 2)];
    ctx.font = 'bold ' + Math.round(H * 0.032) + 'px sans-serif';
    ctx.fillStyle = 'rgba(220,80,80,0.85)';
    ctx.textAlign = 'center';
    ctx.fillText('T\u1D34 = ' + tH + ' K', midS1.x, midS1.y - 12);
    ctx.fillStyle = 'rgba(82,133,200,0.85)';
    ctx.fillText('T\u1D9C = ' + tC + ' K', midS3.x, midS3.y + 18);

    /* Efficiency readout */
    ctx.font = 'bold ' + Math.round(H * 0.040) + 'px sans-serif';
    ctx.fillStyle = 'rgba(255,220,80,0.90)';
    ctx.textAlign = 'right';
    ctx.fillText('\u03B7 = ' + (eta * 100).toFixed(1) + '%', splitX - 12, m.gTop + 4);
    ctx.textAlign = 'left';

    /* Work area label */
    ctx.fillStyle = 'rgba(82,133,200,0.60)';
    ctx.font = Math.round(H * 0.028) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('W = enclosed area', (m.gLeft + m.gRight) / 2, m.gTop + 20);
    ctx.textAlign = 'left';

    /* Animated tracing dot */
    var dotPt = cyclePos(cyclePhase, seg1, seg2, seg3, seg4);
    ctx.beginPath();
    ctx.arc(dotPt.x, dotPt.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,80,0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  /* ── Draw piston panel (right panel) ──────────────────────── */
  function drawPiston(cyc) {
    var px = splitX + W * 0.02;
    var pw = W - px - W * 0.02;
    var cylTop  = H * 0.18;
    var cylBot  = H * 0.78;
    var cylH    = cylBot - cylTop;
    var cylW    = pw * 0.55;
    var cylLeft = px + (pw - cylW) / 2;

    /* Cylinder walls */
    ctx.strokeStyle = 'rgba(82,133,200,0.50)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cylLeft, cylTop);
    ctx.lineTo(cylLeft, cylBot);
    ctx.moveTo(cylLeft + cylW, cylTop);
    ctx.lineTo(cylLeft + cylW, cylBot);
    ctx.stroke();

    /* Cylinder bottom */
    ctx.beginPath();
    ctx.moveTo(cylLeft, cylBot);
    ctx.lineTo(cylLeft + cylW, cylBot);
    ctx.stroke();

    /* Map cycle phase to volume fraction */
    var vFrac = 0;  /* 0 = compressed, 1 = expanded */
    var phNorm = (cyclePhase % 1.0) * 4.0;
    if (phNorm < 1.0) {
      /* Stage 1: isothermal expansion — piston moves down */
      vFrac = phNorm * 0.5;
    } else if (phNorm < 2.0) {
      /* Stage 2: adiabatic expansion */
      vFrac = 0.5 + (phNorm - 1.0) * 0.3;
    } else if (phNorm < 3.0) {
      /* Stage 3: isothermal compression */
      vFrac = 0.80 - (phNorm - 2.0) * 0.3;
    } else {
      /* Stage 4: adiabatic compression */
      vFrac = 0.50 - (phNorm - 3.0) * 0.5;
    }
    vFrac = clamp(vFrac, 0, 1);

    var pistonY = cylTop + vFrac * cylH * 0.85;

    /* Gas fill */
    ctx.fillStyle = 'rgba(82,133,200,0.12)';
    ctx.fillRect(cylLeft + 2, pistonY + 8, cylW - 4, cylBot - pistonY - 10);

    /* Piston head */
    ctx.fillStyle = 'rgba(82,133,200,0.55)';
    ctx.fillRect(cylLeft, pistonY, cylW, 10);
    ctx.strokeStyle = 'rgba(82,133,200,0.80)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cylLeft, pistonY, cylW, 10);

    /* Piston rod */
    ctx.beginPath();
    ctx.moveTo(cylLeft + cylW / 2, cylTop);
    ctx.lineTo(cylLeft + cylW / 2, pistonY);
    ctx.strokeStyle = 'rgba(82,133,200,0.40)';
    ctx.lineWidth = 4;
    ctx.stroke();

    /* Hot/cold indicator */
    var phStage = Math.floor((cyclePhase % 1.0) * 4);
    var isHot = (phStage === 0 || phStage === 1);

    var indicatorLabel = isHot ? 'Hot Source  T\u1D34' : 'Cold Sink  T\u1D9C';
    var indicatorColor = isHot ? 'rgba(220,80,80,0.70)' : 'rgba(82,133,200,0.70)';
    var indH = H * 0.055;
    var indY = isHot ? cylBot + H * 0.02 : cylTop - indH - H * 0.02;

    ctx.fillStyle = indicatorColor;
    ctx.fillRect(cylLeft, indY, cylW, indH);
    ctx.fillStyle = '#fff';
    ctx.font = Math.round(H * 0.030) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(indicatorLabel, cylLeft + cylW / 2, indY + indH / 2 + 5);
    ctx.textAlign = 'left';

    /* Label */
    ctx.fillStyle = 'rgba(82,133,200,0.60)';
    ctx.font = Math.round(H * 0.028) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Piston', cylLeft + cylW / 2, H * 0.92);
    ctx.textAlign = 'left';
  }

  /* ── Main frame ───────────────────────────────────────────── */
  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    /* Background */
    ctx.fillStyle = 'rgba(82,133,200,0.04)';
    ctx.fillRect(0, 0, W, H);

    /* Divider */
    ctx.beginPath();
    ctx.moveTo(splitX, H * 0.05);
    ctx.lineTo(splitX, H * 0.95);
    ctx.strokeStyle = 'rgba(82,133,200,0.20)';
    ctx.lineWidth = 1;
    ctx.stroke();

    /* Era label */
    ctx.fillStyle = 'rgba(82,133,200,0.22)';
    ctx.font = Math.round(H * 0.028) + 'px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Classical Physics \u00B7 1824', W - 10, H - 6);
    ctx.textAlign = 'left';

    var cyc = computeCycle();
    var m   = buildMapper(cyc);
    var eta = 1.0 - tC / tH;

    drawPVDiagram(cyc, m, eta);
    drawPiston(cyc);

    /* Advance cycle phase */
    cyclePhase += 0.005;
    if (cyclePhase >= 1.0) cyclePhase -= 1.0;

    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() {
    cyclePhase = 0.05;
    drawFrame();
    cyclePhase = 0.05;
  }

  /* ── Control wiring ───────────────────────────────────────── */
  function syncLabels() {
    if (hotLabelEl)  hotLabelEl.textContent  = tH + ' K';
    if (coldLabelEl) coldLabelEl.textContent = tC + ' K';
  }

  if (hotSliderEl) {
    hotSliderEl.addEventListener('input', function () {
      tH = parseInt(hotSliderEl.value, 10);
      if (tH <= tC) { tH = tC + 50; hotSliderEl.value = tH; }
      syncLabels();
      if (!running) drawStatic();
    });
  }

  if (coldSliderEl) {
    coldSliderEl.addEventListener('input', function () {
      tC = parseInt(coldSliderEl.value, 10);
      if (tC >= tH) { tC = tH - 50; coldSliderEl.value = tC; }
      syncLabels();
      if (!running) drawStatic();
    });
  }

  /* ── SimAPI ───────────────────────────────────────────────── */
  window.SimAPI = {
    start: function () {
      if (running) return;
      running = true;
      if (reduced) { drawStatic(); return; }
      raf = requestAnimationFrame(drawFrame);
    },
    pause: function () {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    },
    reset: function () {
      window.SimAPI.pause();
      tH = 600;
      tC = 300;
      cyclePhase = 0;
      if (hotSliderEl)  hotSliderEl.value  = 600;
      if (coldSliderEl) coldSliderEl.value = 300;
      syncLabels();
      drawStatic();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };

  /* ── Init ─────────────────────────────────────────────────── */
  resize();
  syncLabels();
  window.addEventListener('resize', function () {
    resize();
    if (!running) drawStatic();
  });
  drawStatic();
}());
