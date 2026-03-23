/* sim.js — 021 Joule: PE→KE→Heat conversion with 3-bar energy display */
(function () {
  'use strict';
  var mount = document.getElementById('sim-mount');
  if (!mount) return;

  var canvas = document.createElement('canvas');
  mount.appendChild(canvas);
  canvas.style.display = 'block';
  canvas.style.width  = '100%';
  canvas.style.height = '100%';
  var ctx = canvas.getContext('2d');

  var W, H;
  var raf = null;
  var t = 0;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var dropHeight = 1.5;
  var mass       = 2.0;
  var G = 9.8;

  function E_total() { return mass * G * dropHeight; }

  // Cycle is split into two equal phases:
  //   Phase A (0–0.5): weight falls   → PE converts to KE
  //   Phase B (0.5–1): paddle spins   → KE converts to Heat
  // State machine: hold-start → fall → hold-mid → paddle → hold-end → repeat
  // Each stage has a duration in seconds; only fall/paddle advance physics
  var STAGES = [
    { id: 'hold-start', dur: 1.2 },  // show full PE at top
    { id: 'fall',       dur: 3.5 },  // PE → KE
    { id: 'hold-mid',   dur: 0.8 },  // show full KE at bottom
    { id: 'paddle',     dur: 3.5 },  // KE → Heat
    { id: 'hold-end',   dur: 2.0 }   // show full Heat — read the result
  ];
  var TOTAL_DUR = STAGES.reduce(function(s, st) { return s + st.dur; }, 0);
  var stageTime = 0; // time within current stage
  var stageIdx  = 0;

  function currentStage() { return STAGES[stageIdx]; }

  // physics cycle 0–1 for energies()
  function getCycle() {
    var id = currentStage().id;
    if (id === 'hold-start') return 0;
    if (id === 'hold-mid')   return 0.5;
    if (id === 'hold-end')   return 1.0;
    var frac = stageTime / currentStage().dur;
    if (id === 'fall')   return frac * 0.5;
    if (id === 'paddle') return 0.5 + frac * 0.5;
    return 0;
  }

  function advanceTime(dt) {
    stageTime += dt;
    while (stageTime >= STAGES[stageIdx].dur) {
      stageTime -= STAGES[stageIdx].dur;
      stageIdx = (stageIdx + 1) % STAGES.length;
    }
  }

  function energies(cycle) {
    var E = E_total();
    var pe, ke, heat;
    if (cycle < 0.5) {
      var f = cycle / 0.5; // 0→1 during fall
      pe   = E * (1 - f);
      ke   = E * f;
      heat = 0;
    } else {
      var f2 = (cycle - 0.5) / 0.5; // 0→1 during paddle
      pe   = 0;
      ke   = E * (1 - f2);
      heat = E * f2;
    }
    return { pe: pe, ke: ke, heat: heat, total: E };
  }

  function resize() {
    W = mount.clientWidth  || 640;
    H = mount.clientHeight || 360;
    canvas.width  = W;
    canvas.height = H;
  }

  // Colors
  var C_PE   = '#5285c8'; // blue
  var C_KE   = '#52c882'; // green
  var C_HEAT = '#c87040'; // orange

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(10,10,20,0.0)';
    ctx.fillRect(0, 0, W, H);

    var cycle = getCycle();
    var en    = energies(cycle);

    var splitX = Math.floor(W * 0.50);

    // ── LEFT: apparatus ──────────────────────────────────────────
    var weightX   = splitX * 0.30;
    var ropeTopY  = H * 0.07;
    var dropFrac  = Math.min(dropHeight / 3.0, 1.0);
    var weightY0  = ropeTopY + (1 - dropFrac) * H * 0.20;
    var weightYMax = H * 0.54;

    // weight falls during fall stage; rests at bottom in paddle+hold-end
    var fallPhase = Math.min(cycle / 0.5, 1.0);
    var weightY   = weightY0 + fallPhase * (weightYMax - weightY0);
    var wHalf = Math.max(14, Math.min(26, 14 + (mass / 5.0) * 12));
    var wH    = wHalf * 1.4;

    // water box
    var bX = splitX * 0.65;
    var bW = splitX * 0.55;
    var bH = H * 0.28;
    var bY = H * 0.52;

    // Pulley
    ctx.beginPath();
    ctx.arc(weightX, ropeTopY + 8, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(82,133,200,0.3)';
    ctx.fill();
    ctx.strokeStyle = C_PE;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rope vertical
    ctx.strokeStyle = 'rgba(82,133,200,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(weightX, ropeTopY + 18);
    ctx.lineTo(weightX, weightY);
    ctx.stroke();

    // Rope horizontal to paddle
    ctx.beginPath();
    ctx.moveTo(weightX + 10, ropeTopY + 8);
    ctx.lineTo(bX, ropeTopY + 8);
    ctx.lineTo(bX, bY + bH * 0.35);
    ctx.stroke();

    // Weight block — color reflects current energy state
    var wColor = cycle < 0.5 ? C_KE : C_HEAT;
    ctx.fillStyle = wColor.replace('#', 'rgba(').replace(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/, function(m, r, g, b) {
      return parseInt(r,16)+','+parseInt(g,16)+','+parseInt(b,16);
    }) + ',0.75)';
    // simpler: just use static colors
    ctx.fillStyle = cycle < 0.5 ? 'rgba(82,200,130,0.75)' : 'rgba(200,112,64,0.75)';
    ctx.fillRect(weightX - wHalf, weightY, wHalf * 2, wH);
    ctx.strokeStyle = cycle < 0.5 ? C_KE : C_HEAT;
    ctx.lineWidth = 2;
    ctx.strokeRect(weightX - wHalf, weightY, wHalf * 2, wH);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(mass.toFixed(1) + 'kg', weightX, weightY + wH * 0.62);

    // height arrow (dashed)
    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(weightX - wHalf - 12, weightY0);
    ctx.lineTo(weightX - wHalf - 12, weightYMax);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    ctx.fillStyle = 'rgba(82,133,200,0.75)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('h=' + dropHeight.toFixed(1) + 'm', weightX - wHalf - 12, (weightY0 + weightYMax) / 2);

    // PE label above weight when at top
    if (cycle < 0.08 || cycle > 0.96) {
      ctx.fillStyle = C_PE;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PE = ' + en.pe.toFixed(1) + ' J', weightX, weightY0 - 8);
    }
    // KE label beside weight while falling
    if (cycle >= 0.08 && cycle < 0.48) {
      ctx.fillStyle = C_KE;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('KE = ' + en.ke.toFixed(1) + ' J', weightX + wHalf + 6, weightY + wH / 2);
    }

    // Water box — heats up in phase B
    var heatProgress = cycle < 0.5 ? 0 : (cycle - 0.5) / 0.5;
    var rr = Math.round(82  + heatProgress * 120);
    var rg = Math.round(133 - heatProgress * 50);
    var rb = Math.round(200 - heatProgress * 130);
    ctx.fillStyle = 'rgba(' + rr + ',' + rg + ',' + rb + ',0.28)';
    ctx.fillRect(bX - bW/2, bY, bW, bH);
    ctx.strokeStyle = heatProgress > 0.1 ? C_HEAT : C_PE;
    ctx.lineWidth = 2;
    ctx.strokeRect(bX - bW/2, bY, bW, bH);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('water', bX, bY - 6);

    // Heat label on water box when warming
    if (heatProgress > 0.05) {
      ctx.fillStyle = C_HEAT;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Heat = ' + en.heat.toFixed(1) + ' J', bX, bY + bH + 16);
    }

    // Paddle — use cycle for rotation angle so it only spins during paddle phase
    ctx.save();
    ctx.translate(bX, bY + bH * 0.5);
    ctx.rotate(cycle * 18);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    for (var a = 0; a < 4; a++) {
      var ang = a * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang) * 16, Math.sin(ang) * 16);
      ctx.stroke();
    }
    ctx.restore();

    // Phase label
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    var stId = currentStage().id;
    if (stId === 'hold-start')  ctx.fillText('Ready to fall — all energy stored as PE', 6, H - 8);
    else if (stId === 'fall')   ctx.fillText('↓ Falling — PE converting to KE', 6, H - 8);
    else if (stId === 'hold-mid') ctx.fillText('At bottom — all PE is now KE', 6, H - 8);
    else if (stId === 'paddle') ctx.fillText('↺ Paddle spinning — KE converting to Heat', 6, H - 8);
    else                        ctx.fillText('All mechanical energy converted to Heat', 6, H - 8);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, H);
    ctx.stroke();

    // ── RIGHT: energy bar chart ───────────────────────────────────
    var gx = splitX + 16;
    var gw = W - splitX - 24;

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Energy (Joules)', gx, 20);

    var E = en.total;
    var bars = [
      { label: 'Potential (PE)',  val: en.pe,   color: C_PE   },
      { label: 'Kinetic (KE)',    val: en.ke,   color: C_KE   },
      { label: 'Heat (Q)',        val: en.heat, color: C_HEAT }
    ];
    var barH    = Math.floor((H - 60) / 4);
    var barGap  = Math.floor(barH * 0.55);
    var labelW  = 88;
    var maxBarW = gw - labelW - 52;

    bars.forEach(function (b, i) {
      var by = 34 + i * (barH + barGap);
      var bw = E > 0 ? (b.val / E) * maxBarW : 0;

      // label
      ctx.fillStyle = b.color;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(b.label, gx, by + barH * 0.75);

      // bar background
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(gx + labelW, by, maxBarW, barH);

      // bar fill
      if (bw > 1) {
        ctx.fillStyle = b.color;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(gx + labelW, by, bw, barH);
        ctx.globalAlpha = 1.0;
      }

      // value text
      ctx.fillStyle = b.color;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(b.val.toFixed(1) + ' J', gx + labelW + maxBarW + 6, by + barH * 0.75);
    });

    // Total line
    var totY = 34 + 3 * (barH + barGap);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, totY);
    ctx.lineTo(gx + gw, totY);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Total: ' + E.toFixed(1) + ' J  (conserved)', gx, totY + 16);

    // Equation
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('E = mgh = ' + mass.toFixed(1) + ' × 9.8 × ' + dropHeight.toFixed(1) + ' = ' + E.toFixed(1) + ' J', gx, H - 8);

    if (running && !reduced) {
      advanceTime(1 / 60);
      raf = requestAnimationFrame(drawFrame);
    }
  }

  function resetCycle() { stageIdx = 0; stageTime = 0; }
  function drawStatic() { resetCycle(); drawFrame(); }

  // Sliders
  var heightSlider = document.getElementById('drop-height-slider');
  var heightLabel  = document.getElementById('drop-height-label');
  var massSlider   = document.getElementById('mass-slider');
  var massLabel    = document.getElementById('mass-label');

  if (heightSlider) {
    heightSlider.addEventListener('input', function () {
      dropHeight = parseFloat(heightSlider.value);
      if (heightLabel) heightLabel.textContent = dropHeight.toFixed(1) + ' m';
      resetCycle();
      if (!running) drawStatic();
    });
  }
  if (massSlider) {
    massSlider.addEventListener('input', function () {
      mass = parseFloat(massSlider.value);
      if (massLabel) massLabel.textContent = mass.toFixed(1) + ' kg';
      resetCycle();
      if (!running) drawStatic();
    });
  }

  resize();
  window.addEventListener('resize', function () { resize(); if (!running) drawStatic(); });

  window.SimAPI = {
    start:   function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause:   function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset:   function () { window.SimAPI.pause(); drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
