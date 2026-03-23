/* ============================================================
   sim.js — Stop 022: Maxwell's Equations
   TWO-PANEL split-canvas:
     Left  — draggable charges with live electric field lines
     Right — propagating EM wave with E (blue) and B (gold) vectors
   splitX computed in resize() — ES5 IIFE pattern from stop-014
   ES5 only: var, named functions, no const/let/arrow/template-literals
   ============================================================ */
(function () {
  'use strict';

  /* ── Top-level state ──────────────────────────────────────── */
  var mount, canvas, ctx, dpr, W, H;
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t = 0;

  /* splitX — divides left (field lines) from right (EM wave) */
  var splitX = 300;

  /* ── Charges state ────────────────────────────────────────── */
  var charges = [
    { x: 0, y: 0, q: 1,  dragging: false },   /* positive */
    { x: 0, y: 0, q: -1, dragging: false }    /* negative */
  ];

  /* ── EM wave parameters ───────────────────────────────────── */
  var freq = 1.0;     /* Hz (cycles per rendered "second") */
  var amp  = 0.6;     /* normalized amplitude 0.2–1.0 */
  var waveSpeed = 80; /* px per second — visual speed */

  /* ── Canvas position helper ───────────────────────────────── */
  function getCanvasPos(e) {
    var pos = e.touches ? e.touches[0] : e;
    var rect = canvas.getBoundingClientRect();
    return { x: pos.clientX - rect.left, y: pos.clientY - rect.top };
  }

  /* ── Drag handlers ────────────────────────────────────────── */
  function startDrag(e) {
    var p = getCanvasPos(e);
    for (var i = 0; i < charges.length; i++) {
      var dx = p.x - charges[i].x;
      var dy = p.y - charges[i].y;
      if (Math.sqrt(dx * dx + dy * dy) < 22) {
        charges[i].dragging = true;
        break;
      }
    }
  }

  function doDrag(e) {
    var p = getCanvasPos(e);
    for (var i = 0; i < charges.length; i++) {
      if (charges[i].dragging) {
        charges[i].x = Math.max(16, Math.min(splitX - 16, p.x));
        charges[i].y = Math.max(16, Math.min(H - 16, p.y));
      }
    }
    if (!running) { draw(); }
  }

  function endDrag() {
    for (var i = 0; i < charges.length; i++) {
      charges[i].dragging = false;
    }
  }

  /* ── Field line tracer ────────────────────────────────────── */
  function traceFieldLines() {
    var nRays = 8;
    var stepSize = 3;
    var maxSteps = 500;

    for (var ci = 0; ci < charges.length; ci++) {
      var c = charges[ci];
      if (c.q <= 0) { continue; } /* only trace from positive charges */

      for (var ri = 0; ri < nRays; ri++) {
        var angle = ri * (2 * Math.PI / nRays);
        var px = c.x + 14 * Math.cos(angle);
        var py = c.y + 14 * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(px, py);

        var terminated = false;
        for (var step = 0; step < maxSteps; step++) {
          var Ex = 0, Ey = 0;
          var nearSink = false;

          for (var k = 0; k < charges.length; k++) {
            var cc = charges[k];
            var dx = px - cc.x;
            var dy = py - cc.y;
            var r2 = dx * dx + dy * dy;
            var r  = Math.sqrt(r2);

            /* Proximity termination — near sink */
            if (cc.q < 0 && r < 12) {
              nearSink = true;
              break;
            }
            if (r < 0.5) { nearSink = true; break; }

            Ex += cc.q * dx / (r2 * r);
            Ey += cc.q * dy / (r2 * r);
          }

          if (nearSink) { terminated = true; break; }

          var emag = Math.sqrt(Ex * Ex + Ey * Ey);
          if (emag < 1e-8) { terminated = true; break; }

          px += (Ex / emag) * stepSize;
          py += (Ey / emag) * stepSize;
          ctx.lineTo(px, py);

          /* Canvas-exit termination (left panel only) */
          if (px < 0 || px > splitX || py < 0 || py > H) {
            terminated = true;
            break;
          }
        }

        ctx.strokeStyle = 'rgba(82,133,200,0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();

        /* Draw arrowhead at midpoint of line */
        if (!terminated || true) {
          /* Small direction arrow ~1/3 along path */
          var midPx = c.x + 14 * Math.cos(angle) + 28 * Math.cos(angle);
          var midPy = c.y + 14 * Math.sin(angle) + 28 * Math.sin(angle);
        }
      }
    }
  }

  /* ── Draw left panel: charges + field lines ───────────────── */
  function drawChargesAndFieldLines() {
    /* Clip to left panel */
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, H);
    ctx.clip();

    /* Field lines */
    traceFieldLines();

    /* Charge circles */
    for (var i = 0; i < charges.length; i++) {
      var c = charges[i];
      var isPos = c.q > 0;
      var fillColor = isPos ? 'rgba(82,133,200,0.9)' : 'rgba(200,82,82,0.9)';
      var borderColor = isPos ? 'rgba(160,200,255,0.9)' : 'rgba(255,160,160,0.9)';
      var label = isPos ? '+' : '\u2212';

      /* Glow when dragging */
      if (c.dragging) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(c.x, c.y, 22, 0, Math.PI * 2);
        ctx.fillStyle = isPos ? 'rgba(82,133,200,0.15)' : 'rgba(200,82,82,0.15)';
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x, c.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      /* Label */
      ctx.save();
      ctx.font = 'bold 16px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, c.x, c.y);
      ctx.restore();
    }

    /* Drag hint (shown once when not running) */
    if (!running) {
      ctx.save();
      ctx.font = '9px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(200,200,200,0.3)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('drag charges', splitX * 0.5, H - 6);
      ctx.restore();
    }

    ctx.restore();
  }

  /* ── Draw arrowhead helper ────────────────────────────────── */
  function drawArrow(x1, y1, x2, y2, color) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.5) return;
    var ux = dx / len;
    var uy = dy / len;
    var headLen = Math.min(6, len * 0.4);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 1.5;

    /* Shaft */
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    /* Arrowhead */
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * ux - headLen * 0.5 * uy,
               y2 - headLen * uy + headLen * 0.5 * ux);
    ctx.lineTo(x2 - headLen * ux + headLen * 0.5 * uy,
               y2 - headLen * uy - headLen * 0.5 * ux);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /* ── Draw right panel: propagating EM wave ────────────────── */
  function drawEMWave() {
    var panelX0 = splitX + 10;
    var panelX1 = W - 10;
    var panelW  = panelX1 - panelX0;
    var axisY   = H * 0.5;
    var panelH  = H;

    /* Propagation axis */
    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX0, axisY);
    ctx.lineTo(panelX1, axisY);
    ctx.stroke();

    /* Propagation direction label */
    ctx.fillStyle = 'rgba(82,133,200,0.45)';
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('\u2192 c', panelX1, axisY - 3);
    ctx.restore();

    /* Wave parameters */
    var lambda = waveSpeed / freq;  /* pixels per wavelength (visual) */
    var k      = 2 * Math.PI / lambda;
    var omega  = 2 * Math.PI * freq;

    /* E-field continuous sine curve (blue outline) */
    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    var started = false;
    for (var xi = panelX0; xi <= panelX1; xi += 1) {
      var phase = k * (xi - panelX0) - omega * t;
      var Ey_guide = amp * Math.sin(phase) * panelH * 0.30;
      if (!started) {
        ctx.moveTo(xi, axisY - Ey_guide);
        started = true;
      } else {
        ctx.lineTo(xi, axisY - Ey_guide);
      }
    }
    ctx.stroke();
    ctx.restore();

    /* Sample spacing for vector arrows */
    var sampleSpacing = 14;

    for (var sampleX = panelX0 + sampleSpacing * 0.5; sampleX <= panelX1; sampleX += sampleSpacing) {
      var phSample = k * (sampleX - panelX0) - omega * t;
      var sinVal = Math.sin(phSample);

      /* E_y: vertical arrow (blue) */
      var Ey_val = amp * sinVal * panelH * 0.30;
      if (Math.abs(Ey_val) > 1.5) {
        drawArrow(sampleX, axisY, sampleX, axisY - Ey_val, 'rgba(82,133,200,0.85)');
      }

      /* B_z: in/out of canvas (gold markers) */
      var Bz_val = amp * 0.5 * sinVal;
      var markerR = 4;
      if (Math.abs(Bz_val) > 0.05) {
        ctx.save();
        ctx.strokeStyle = 'rgba(200,160,50,0.85)';
        ctx.fillStyle   = 'rgba(200,160,50,0.85)';
        ctx.lineWidth = 1.5;

        /* Outer circle */
        ctx.beginPath();
        ctx.arc(sampleX, axisY + 18, markerR + 1, 0, Math.PI * 2);
        ctx.stroke();

        if (Bz_val > 0) {
          /* B pointing out of screen — filled dot */
          ctx.beginPath();
          ctx.arc(sampleX, axisY + 18, markerR - 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          /* B pointing into screen — X mark */
          ctx.beginPath();
          ctx.moveTo(sampleX - 3, axisY + 18 - 3);
          ctx.lineTo(sampleX + 3, axisY + 18 + 3);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(sampleX + 3, axisY + 18 - 3);
          ctx.lineTo(sampleX - 3, axisY + 18 + 3);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    /* Legend at bottom of right panel */
    ctx.save();
    ctx.font = '9px "DM Sans", system-ui, sans-serif';
    ctx.textBaseline = 'bottom';

    /* E legend */
    ctx.fillStyle = 'rgba(82,133,200,0.7)';
    ctx.fillRect(splitX + 12, H - 26, 12, 3);
    ctx.fillStyle = 'rgba(82,133,200,0.7)';
    ctx.textAlign = 'left';
    ctx.fillText('E field (blue vectors)', splitX + 28, H - 16);

    /* B legend */
    ctx.fillStyle = 'rgba(200,160,50,0.7)';
    ctx.beginPath();
    ctx.arc(splitX + 17, H - 9, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,160,50,0.7)';
    ctx.fillText('B field (gold markers)', splitX + 28, H - 4);

    ctx.restore();
  }

  /* ── Panel labels ─────────────────────────────────────────── */
  function drawPanelLabels() {
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Electric Field', splitX * 0.5, 8);
    ctx.fillText('Electromagnetic Wave', splitX + (W - splitX) * 0.5, 8);
    ctx.restore();
  }

  /* ── Main draw ────────────────────────────────────────────── */
  function draw() {
    if (!W || !H) return;

    /* Clear */
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'oklch(0.09 0.025 285)';
    ctx.fillRect(0, 0, W, H);

    /* Dashed divider */
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

    /* Left panel */
    drawChargesAndFieldLines();

    /* Right panel */
    drawEMWave();

    /* Panel labels */
    drawPanelLabels();
  }

  /* ── Animation loop ───────────────────────────────────────── */
  function loop() {
    if (!running) return;
    t += 0.016;
    draw();
    raf = requestAnimationFrame(loop);
  }

  /* ── Sync slider labels ───────────────────────────────────── */
  function syncSliderLabels() {
    var fLabel = document.getElementById('em-frequency-label');
    if (fLabel) { fLabel.textContent = freq.toFixed(1); }
    var aLabel = document.getElementById('em-amplitude-label');
    if (aLabel) { aLabel.textContent = amp.toFixed(2); }
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
      freq = 1.0;
      amp  = 0.6;
      t    = 0;
      /* Restore default charge positions */
      charges[0].x = splitX * 0.35;
      charges[0].y = H * 0.5;
      charges[1].x = splitX * 0.65;
      charges[1].y = H * 0.5;
      /* Reset sliders */
      var fSlider = document.getElementById('em-frequency-slider');
      if (fSlider) { fSlider.value = freq; }
      var aSlider = document.getElementById('em-amplitude-slider');
      if (aSlider) { aSlider.value = amp; }
      syncSliderLabels();
      draw();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas && canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
    }
  };

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
      H = Math.max(360, Math.round(rect.height || 400));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      /* splitX computed in resize — direct pattern from stop-014 */
      splitX = W * 0.50;

      /* Reposition charges proportionally on resize */
      charges[0].x = splitX * 0.35;
      charges[0].y = H * 0.5;
      charges[1].x = splitX * 0.65;
      charges[1].y = H * 0.5;

      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    /* Mouse drag listeners */
    canvas.addEventListener('mousedown', function (e) { startDrag(e); });
    canvas.addEventListener('mousemove', function (e) { doDrag(e); });
    canvas.addEventListener('mouseup',   function (e) { endDrag(e); });
    canvas.addEventListener('mouseleave', function () { endDrag(); });

    /* Touch drag listeners */
    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); startDrag(e); }, { passive: false });
    canvas.addEventListener('touchmove',  function (e) { e.preventDefault(); doDrag(e); },   { passive: false });
    canvas.addEventListener('touchend',   function (e) { endDrag(e); });

    /* Frequency slider */
    var fSlider = document.getElementById('em-frequency-slider');
    if (fSlider) {
      fSlider.value = freq;
      fSlider.addEventListener('input', function () {
        freq = parseFloat(fSlider.value);
        syncSliderLabels();
        if (!running) { draw(); }
      });
    }

    /* Amplitude slider */
    var aSlider = document.getElementById('em-amplitude-slider');
    if (aSlider) {
      aSlider.value = amp;
      aSlider.addEventListener('input', function () {
        amp = parseFloat(aSlider.value);
        syncSliderLabels();
        if (!running) { draw(); }
      });
    }

    /* Play button */
    var playBtn = document.getElementById('sim-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (playBtn.dataset.state === 'playing') {
          window.SimAPI.pause();
        } else {
          window.SimAPI.start();
        }
      });
    }

    /* Reset button */
    var resetBtn = document.getElementById('sim-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        window.SimAPI.reset();
      });
    }

    syncSliderLabels();
    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

}());
