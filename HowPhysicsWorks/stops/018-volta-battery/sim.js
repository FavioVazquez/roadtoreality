/* ============================================================
   sim.js — Stop 018: Volta and the Electric Battery
   Split canvas: left = voltaic pile schematic (stacked cells)
                 right = circuit diagram with animated current dots
   Controls: cell count, EMF per cell, internal resistance, series/parallel toggle
   Live readouts: V, I, P
   ============================================================ */
(function () {
  'use strict';

  /* ── Top-level state ──────────────────────────────────────── */
  var mount, canvas, ctx, dpr, W, H;
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t = 0;

  var splitX; /* W * 0.5 — divides pile panel from circuit panel */

  /* Circuit parameters */
  var cellCount  = 3;      /* 1–6 cells */
  var emfPerCell = 1.5;    /* volts per cell */
  var rInternal  = 0.5;    /* ohms per cell (internal resistance) */
  var rLoad      = 10.0;   /* ohms — fixed resistive load */
  var isSeries   = true;   /* series vs parallel */

  /* Current dots for animation */
  var NUM_DOTS = 14;
  var dots = [];
  for (var i = 0; i < NUM_DOTS; i++) {
    dots.push({ progress: i / NUM_DOTS });
  }

  /* ── Circuit physics ──────────────────────────────────────── */
  function calcCircuit() {
    var V, I, P, Vterm;
    if (isSeries) {
      /* Series: voltages add, internal resistances add */
      V = cellCount * emfPerCell;
      var rTot = rLoad + cellCount * rInternal;
      I = V / rTot;
      Vterm = V - I * cellCount * rInternal;
    } else {
      /* Parallel: voltage = single cell EMF, internal resistance divides by n */
      V = emfPerCell;
      var rTot = rLoad + rInternal / cellCount;
      I = V / rTot;
      Vterm = V - I * rInternal / cellCount;
    }
    P = Vterm * I;
    return { V: V, I: I, P: P, Vterm: Vterm };
  }

  /* ── Circuit path geometry ────────────────────────────────── */
  function getCircuitPath() {
    /* Rectangle: battery (left) → top wire → bulb (right) → bottom wire → back */
    var batX  = splitX + (W - splitX) * 0.18;
    var bulbX = W - (W - splitX) * 0.18;
    var topY  = H * 0.28;
    var botY  = H * 0.72;
    return [
      { x: batX,  y: topY  },
      { x: bulbX, y: topY  },
      { x: bulbX, y: botY  },
      { x: batX,  y: botY  },
      { x: batX,  y: topY  }
    ];
  }

  function pathPos(path, progress) {
    var totalLen = 0;
    var segs = [];
    for (var i = 0; i < path.length - 1; i++) {
      var dx = path[i + 1].x - path[i].x;
      var dy = path[i + 1].y - path[i].y;
      var len = Math.sqrt(dx * dx + dy * dy);
      segs.push({ len: len });
      totalLen += len;
    }
    var target = progress * totalLen;
    var acc = 0;
    for (var j = 0; j < segs.length; j++) {
      if (acc + segs[j].len >= target) {
        var frac = (target - acc) / segs[j].len;
        return {
          x: path[j].x + frac * (path[j + 1].x - path[j].x),
          y: path[j].y + frac * (path[j + 1].y - path[j].y)
        };
      }
      acc += segs[j].len;
    }
    return path[path.length - 1];
  }

  /* ── Draw voltaic pile (left panel) ──────────────────────────── */
  function drawPile() {
    var panelCx = splitX * 0.5;
    var cellH   = Math.min(30, (H * 0.6) / Math.max(cellCount, 1));
    var cellW   = Math.min(70, splitX * 0.55);
    var pileH   = cellCount * cellH;
    var pileTop = H * 0.5 - pileH * 0.5;

    /* Panel label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Voltaic pile  (' + cellCount + ' cell' + (cellCount !== 1 ? 's' : '') + ')', panelCx, 8);
    ctx.restore();

    /* Draw cells from bottom to top — bottom is negative terminal */
    for (var i = 0; i < cellCount; i++) {
      var cellTop = pileTop + (cellCount - 1 - i) * cellH;
      var cellBot = cellTop + cellH;
      var cx0 = panelCx - cellW * 0.5;
      var cx1 = panelCx + cellW * 0.5;

      /* Zinc disc (dark gray) — top half of cell */
      var zincH = cellH * 0.38;
      ctx.save();
      ctx.fillStyle = 'rgba(110,115,120,0.85)';
      ctx.strokeStyle = 'rgba(160,165,170,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(cx0, cellTop, cellW, zincH);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      /* Electrolyte cloth (dark warm) */
      var clothH = cellH * 0.24;
      ctx.save();
      ctx.fillStyle = 'rgba(80,60,30,0.6)';
      ctx.strokeStyle = 'rgba(120,90,40,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(cx0, cellTop + zincH, cellW, clothH);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      /* Copper disc (warm orange) — bottom half */
      var copperH = cellH - zincH - clothH;
      ctx.save();
      ctx.fillStyle = 'rgba(185,100,40,0.85)';
      ctx.strokeStyle = 'rgba(220,140,60,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(cx0, cellTop + zincH + clothH, cellW, copperH);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      /* Cell index label on first cell */
      if (i === 0 || i === cellCount - 1) {
        ctx.save();
        ctx.font = '8px "DM Sans", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(200,200,200,0.5)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(i === 0 ? '− ' : '+ ', cx0 - 3, cellTop + cellH * 0.5);
        ctx.restore();
      }
    }

    /* Top (+) and bottom (−) terminal dots */
    ctx.save();
    ctx.fillStyle = '#e05252';
    ctx.beginPath();
    ctx.arc(panelCx, pileTop - 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(220,220,220,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('+', panelCx, pileTop - 14);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#5285c8';
    ctx.beginPath();
    ctx.arc(panelCx, pileTop + pileH + 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(220,220,220,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('−', panelCx, pileTop + pileH + 15);
    ctx.restore();

    /* EMF and mode labels */
    var circ = calcCircuit();
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.65)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText((isSeries ? 'Series' : 'Parallel') + '  —  ' + circ.V.toFixed(2) + ' V total', panelCx, pileTop + pileH + 28);
    ctx.restore();

    /* Legend */
    var legY = H * 0.88;
    ctx.save();
    ctx.font = '9px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = 'rgba(110,115,120,0.8)';
    ctx.fillRect(panelCx - cellW * 0.5, legY, 10, 8);
    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    ctx.fillText('Zinc', panelCx - cellW * 0.5 + 13, legY);

    ctx.fillStyle = 'rgba(185,100,40,0.8)';
    ctx.fillRect(panelCx - cellW * 0.5, legY + 12, 10, 8);
    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    ctx.fillText('Copper', panelCx - cellW * 0.5 + 13, legY + 12);

    ctx.fillStyle = 'rgba(80,60,30,0.7)';
    ctx.fillRect(panelCx - cellW * 0.5, legY + 24, 10, 8);
    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    ctx.fillText('Electrolyte', panelCx - cellW * 0.5 + 13, legY + 24);
    ctx.restore();
  }

  /* ── Draw circuit (right panel) ───────────────────────────── */
  function drawCircuit() {
    var path = getCircuitPath();
    var circ = calcCircuit();

    /* Panel label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Circuit', (splitX + W) * 0.5, 8);
    ctx.restore();

    /* Wires */
    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (var i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    ctx.restore();

    /* Battery symbol on left side of circuit */
    var batX = path[0].x;
    var batCY = (path[0].y + path[3].y) / 2;
    var numBatLines = Math.min(cellCount, 6);
    var lineSpacing = 11;
    var totalBatH = numBatLines * lineSpacing;
    var batTop = batCY - totalBatH * 0.5;

    /* Connecting lines to wires */
    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(batX, path[0].y);
    ctx.lineTo(batX, batTop);
    ctx.moveTo(batX, batTop + totalBatH);
    ctx.lineTo(batX, path[3].y);
    ctx.stroke();
    ctx.restore();

    for (var k = 0; k < numBatLines; k++) {
      var lineY = batTop + k * lineSpacing + lineSpacing * 0.5;
      var thick = k % 2 === 0;
      ctx.save();
      ctx.strokeStyle = '#5b8fd4';
      ctx.lineWidth = thick ? 4 : 1.5;
      ctx.beginPath();
      ctx.moveTo(batX - (thick ? 14 : 10), lineY);
      ctx.lineTo(batX + (thick ? 14 : 10), lineY);
      ctx.stroke();
      ctx.restore();
    }

    /* + / − labels */
    ctx.save();
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(82,133,200,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText('+', batX + 17, batTop + 10);
    ctx.fillText('−', batX + 17, batTop + totalBatH - 3);
    ctx.restore();

    /* Resistor/bulb on right side */
    var bulbX = path[1].x;
    var bulbCY = (path[1].y + path[2].y) / 2;
    var bulbR = Math.min(20, (path[2].y - path[1].y) * 0.15);

    /* Vertical wire break for bulb */
    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bulbX, path[1].y);
    ctx.lineTo(bulbX, bulbCY - bulbR);
    ctx.moveTo(bulbX, bulbCY + bulbR);
    ctx.lineTo(bulbX, path[2].y);
    ctx.stroke();
    ctx.restore();

    /* Bulb glow */
    var glow = circ.P / (rLoad * 0.05 + circ.P); /* normalized glow 0–1 */
    var glowAlpha = 0.15 + glow * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bulbX, bulbCY, bulbR * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,80,' + (glowAlpha * 0.4) + ')';
    ctx.fill();
    ctx.restore();

    ctx.save();
    var bulbFill = 'rgba(255,220,80,' + glowAlpha + ')';
    ctx.beginPath();
    ctx.arc(bulbX, bulbCY, bulbR, 0, Math.PI * 2);
    ctx.fillStyle = bulbFill;
    ctx.fill();
    ctx.strokeStyle = '#5b8fd4';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    /* Resistor label */
    ctx.save();
    ctx.font = '9px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(rLoad + ' Ω', bulbX + bulbR + 5, bulbCY);
    ctx.restore();

    /* Animated current dots */
    var dotSpeed = Math.min(0.012, Math.max(0.002, circ.I * 0.004));
    for (var d = 0; d < dots.length; d++) {
      if (running && !reduced) {
        dots[d].progress = (dots[d].progress + dotSpeed) % 1;
      }
      var pos = pathPos(path, dots[d].progress);
      ctx.save();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,220,80,0.88)';
      ctx.fill();
      ctx.restore();
    }

    /* V / I / P readout box */
    var boxX = splitX + 10;
    var boxY = H - 72;
    var boxW = (W - splitX) - 20;
    var boxH = 60;

    ctx.save();
    ctx.fillStyle = 'rgba(20,20,30,0.7)';
    ctx.strokeStyle = 'rgba(91,143,212,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    var col1 = boxX + boxW * 0.16;
    var col2 = boxX + boxW * 0.5;
    var col3 = boxX + boxW * 0.82;
    var rowY1 = boxY + 14;
    var rowY2 = boxY + 40;

    ctx.save();
    ctx.font = '9px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180,180,180,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Voltage', col1, rowY1);
    ctx.fillText('Current', col2, rowY1);
    ctx.fillText('Power', col3, rowY1);
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 13px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#5b8fd4';
    ctx.fillText(circ.Vterm.toFixed(2) + ' V', col1, rowY2);
    ctx.fillStyle = 'rgba(255,220,80,0.9)';
    ctx.fillText(circ.I.toFixed(3) + ' A', col2, rowY2);
    ctx.fillStyle = 'rgba(100,220,120,0.9)';
    ctx.fillText(circ.P.toFixed(2) + ' W', col3, rowY2);
    ctx.restore();
  }

  /* ── Main draw ────────────────────────────────────────────── */
  function draw() {
    if (!W || !H) return;

    /* Clear */
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'oklch(0.09 0.025 285)';
    ctx.fillRect(0, 0, W, H);

    /* Vertical divider */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,180,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    drawPile();
    drawCircuit();
  }

  /* ── Animation loop ───────────────────────────────────────── */
  function loop() {
    if (!running) return;
    t += 0.016;
    draw();
    raf = requestAnimationFrame(loop);
  }

  /* ── SimAPI ───────────────────────────────────────────────── */
  window.SimAPI = {
    start: function () {
      if (running) return;
      running = true;
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.dataset.state = 'playing'; btn.innerHTML = '&#9646;&#9646; Pause'; }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) { dot.classList.add('is-running'); }
      if (!reduced) { loop(); } else { draw(); }
    },
    pause: function () {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      var btn = document.getElementById('sim-play-btn');
      if (btn) { btn.dataset.state = 'paused'; btn.innerHTML = '&#9654; Play'; }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) { dot.classList.remove('is-running'); }
    },
    reset: function () {
      window.SimAPI.pause();
      t = 0;
      cellCount  = 3;
      emfPerCell = 1.5;
      rInternal  = 0.5;
      isSeries   = true;
      for (var i = 0; i < dots.length; i++) { dots[i].progress = i / dots.length; }
      syncControls();
      draw();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas && canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
    }
  };

  /* ── Sync controls to state ───────────────────────────────── */
  function syncControls() {
    var cSlider = document.getElementById('cell-count-slider');
    if (cSlider) { cSlider.value = cellCount; }
    var cVal = document.getElementById('cell-count-value');
    if (cVal) { cVal.textContent = cellCount; }

    var eSlider = document.getElementById('emf-slider');
    if (eSlider) { eSlider.value = emfPerCell; }
    var eVal = document.getElementById('emf-value');
    if (eVal) { eVal.textContent = emfPerCell.toFixed(1) + ' V'; }

    var rSlider = document.getElementById('rint-slider');
    if (rSlider) { rSlider.value = rInternal; }
    var rVal = document.getElementById('rint-value');
    if (rVal) { rVal.textContent = rInternal.toFixed(1) + ' Ω'; }

    var modeBtn = document.getElementById('series-parallel-btn');
    if (modeBtn) { modeBtn.textContent = isSeries ? 'Series' : 'Parallel'; }
  }

  /* ── Setup ────────────────────────────────────────────────── */
  function setup() {
    mount = document.getElementById('sim-mount');
    if (!mount) return;

    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    mount.appendChild(canvas);
    ctx = canvas.getContext('2d');

    function resize() {
      var rect = mount.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      W = Math.round(rect.width || 600);
      H = Math.max(360, Math.round(rect.height || 380));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      splitX = W * 0.5;
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    /* Cell count slider */
    var cSlider = document.getElementById('cell-count-slider');
    if (cSlider) {
      cSlider.addEventListener('input', function () {
        cellCount = parseInt(cSlider.value, 10);
        var v = document.getElementById('cell-count-value');
        if (v) { v.textContent = cellCount; }
        if (!running) { draw(); }
      });
    }

    /* EMF per cell slider */
    var eSlider = document.getElementById('emf-slider');
    if (eSlider) {
      eSlider.addEventListener('input', function () {
        emfPerCell = parseFloat(eSlider.value);
        var v = document.getElementById('emf-value');
        if (v) { v.textContent = emfPerCell.toFixed(1) + ' V'; }
        if (!running) { draw(); }
      });
    }

    /* Internal resistance slider */
    var rSlider = document.getElementById('rint-slider');
    if (rSlider) {
      rSlider.addEventListener('input', function () {
        rInternal = parseFloat(rSlider.value);
        var v = document.getElementById('rint-value');
        if (v) { v.textContent = rInternal.toFixed(1) + ' Ω'; }
        if (!running) { draw(); }
      });
    }

    /* Series/parallel toggle */
    var modeBtn = document.getElementById('series-parallel-btn');
    if (modeBtn) {
      modeBtn.addEventListener('click', function () {
        isSeries = !isSeries;
        modeBtn.textContent = isSeries ? 'Series' : 'Parallel';
        if (!running) { draw(); }
      });
    }

    /* Reset button */
    var resetBtn = document.getElementById('sim-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () { window.SimAPI.reset(); });
    }

    syncControls();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

}());
