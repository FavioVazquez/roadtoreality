/* ============================================================
   sim.js — Stop 015: Bernoulli's Principle
   Split canvas: left = venturi tube visual with particles,
                 right = pressure vs. position graph
   Controls: throat-width slider, flow-speed slider
   Pressure indicators (manometer columns) above tube
   ============================================================ */
(function () {
  'use strict';

  /* ── Top-level state ──────────────────────────────────────── */
  var mount, canvas, ctx, dpr, W, H;
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t = 0;

  var splitX;           /* W * 0.55 — tube panel vs graph panel */

  /* ── Parameters driven by sliders ─────────────────────────── */
  var throatRatio = 0.35;   /* 0.15–0.60: fraction of wide height for throat */
  var flowSpeed   = 1.0;    /* 0.3–2.0: base particle speed multiplier */

  /* ── Tube geometry (computed in resize) ───────────────────── */
  var tubeGeo = {};

  function computeTubeGeo() {
    var panelW = splitX;
    var cx     = panelW / 2;
    var cy     = H * 0.54;
    var x0     = panelW * 0.04;
    var x1     = panelW * 0.30;
    var x2     = panelW * 0.70;
    var x3     = panelW * 0.96;
    var wideH  = H * 0.22;
    var narrowH = wideH * throatRatio;

    tubeGeo = {
      cx: cx, cy: cy,
      x0: x0, x1: x1, x2: x2, x3: x3,
      wideH: wideH, narrowH: narrowH,
      panelW: panelW
    };
  }

  /* ── Tube boundary helpers ────────────────────────────────── */
  function tubeHalfAt(x) {
    var g = tubeGeo;
    if (x <= g.x1) return g.wideH;
    if (x <= g.x2) {
      /* smooth cosine taper */
      var frac = (x - g.x1) / (g.x2 - g.x1);
      var t_cos = (1 - Math.cos(frac * Math.PI)) / 2;
      return g.wideH + (g.narrowH - g.wideH) * t_cos;
    }
    return g.narrowH;
  }

  /* ── Speed at x (continuity equation: A1*v1 = A2*v2) ──────── */
  function speedAt(x) {
    /* Area proportional to half-height (2D cross-section) */
    var half = tubeHalfAt(x);
    var ratio = tubeGeo.wideH / half; /* speed scales inversely with area */
    return flowSpeed * ratio;
  }

  /* ── Pressure at x (Bernoulli: P + ½ρv² = const) ──────────── */
  function pressureAt(x) {
    /* Normalised: 1.0 = full static pressure at wide section */
    var v    = speedAt(x);
    var vRef = flowSpeed;          /* speed at wide section */
    /* ΔP = ½ρ(v_ref² - v²); we normalise by ½ρ*v_ref² */
    var pNorm = 1.0 - (v * v) / (vRef * vRef);
    return pNorm; /* 1 = high pressure (wide), 0 or negative = low (throat) */
  }

  /* ── Particle system ──────────────────────────────────────── */
  var PARTICLE_COUNT = 36;
  var particles = [];

  function initParticles() {
    var g = tubeGeo;
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var px = g.x0 + (i / PARTICLE_COUNT) * (g.x3 - g.x0);
      var half = tubeHalfAt(px);
      /* distribute uniformly across tube cross-section */
      var laneCount = 4;
      var lane = (i % laneCount) - (laneCount - 1) / 2;
      var py = g.cy + lane * (half * 0.5);
      particles.push({ x: px, laneOffset: lane / ((laneCount - 1) / 2) });
    }
  }

  function updateParticles() {
    var g = tubeGeo;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var spd = speedAt(p.x);
      p.x += spd * 1.4;
      if (p.x > g.x3) {
        p.x = g.x0;
      }
    }
  }

  /* ── Drawing: venturi tube outline ───────────────────────── */
  function drawTube() {
    var g = tubeGeo;
    /* Top wall */
    ctx.beginPath();
    ctx.moveTo(g.x0, g.cy - g.wideH);
    for (var x = g.x0; x <= g.x3; x += 2) {
      ctx.lineTo(x, g.cy - tubeHalfAt(x));
    }
    ctx.lineTo(g.x3, g.cy - tubeHalfAt(g.x3));
    ctx.strokeStyle = 'rgba(82,133,200,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Bottom wall */
    ctx.beginPath();
    ctx.moveTo(g.x0, g.cy + g.wideH);
    for (var x2 = g.x0; x2 <= g.x3; x2 += 2) {
      ctx.lineTo(x2, g.cy + tubeHalfAt(x2));
    }
    ctx.lineTo(g.x3, g.cy + tubeHalfAt(g.x3));
    ctx.strokeStyle = 'rgba(82,133,200,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Fill interior */
    ctx.beginPath();
    ctx.moveTo(g.x0, g.cy - g.wideH);
    for (var xa = g.x0; xa <= g.x3; xa += 2) {
      ctx.lineTo(xa, g.cy - tubeHalfAt(xa));
    }
    for (var xb = g.x3; xb >= g.x0; xb -= 2) {
      ctx.lineTo(xb, g.cy + tubeHalfAt(xb));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(82,133,200,0.07)';
    ctx.fill();

    /* Left / right openings (end caps) */
    ctx.strokeStyle = 'rgba(82,133,200,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(g.x0, g.cy - g.wideH);
    ctx.lineTo(g.x0, g.cy + g.wideH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(g.x3, g.cy - g.narrowH);
    ctx.lineTo(g.x3, g.cy + g.narrowH);
    ctx.stroke();
  }

  /* ── Drawing: manometer pressure columns ─────────────────── */
  function drawPressureColumns() {
    var g = tubeGeo;
    /* Three sample points: inlet, throat, outlet */
    var sampleX = [
      g.x0 + (g.x1 - g.x0) * 0.5,
      (g.x1 + g.x2) / 2,
      g.x2 + (g.x3 - g.x2) * 0.5
    ];

    var colW    = 14;
    var baseY   = g.cy - g.wideH - 10;
    var maxColH = H * 0.26;

    for (var i = 0; i < sampleX.length; i++) {
      var sx  = sampleX[i];
      var p   = pressureAt(sx);
      /* clamp so throat can be near 0 */
      var pClamped = Math.max(0.02, p);
      var colH = maxColH * pClamped;
      var colY = baseY - colH;

      /* Tube stem */
      ctx.strokeStyle = 'rgba(82,133,200,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, g.cy - tubeHalfAt(sx));
      ctx.lineTo(sx, baseY);
      ctx.stroke();

      /* Fluid column */
      var hue = p < 0.4 ? '180,80,80' : '82,133,200';
      ctx.fillStyle = 'rgba(' + hue + ',0.30)';
      ctx.fillRect(sx - colW / 2, colY, colW, colH);
      ctx.strokeStyle = 'rgba(' + hue + ',0.70)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - colW / 2, colY, colW, colH);

      /* Pressure label */
      ctx.save();
      ctx.font = '9px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(200,200,200,0.65)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('P' + (i + 1), sx, colY - 2);
      ctx.restore();
    }
  }

  /* ── Drawing: particles ───────────────────────────────────── */
  function drawParticles() {
    var g = tubeGeo;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var half = tubeHalfAt(p.x);
      var py = g.cy + p.laneOffset * half * 0.70;
      /* speed-dependent color: blue at wide, cyan/white at throat */
      var spd = speedAt(p.x);
      var vMax = flowSpeed * (g.wideH / g.narrowH);
      var norm = Math.min((spd - flowSpeed) / (vMax - flowSpeed + 0.001), 1);
      var r = Math.round(82  + norm * 100);
      var gv = Math.round(133 + norm * 90);
      var b  = Math.round(200 + norm * 55);
      ctx.beginPath();
      ctx.arc(p.x, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + r + ',' + gv + ',' + b + ',0.85)';
      ctx.fill();
    }
  }

  /* ── Drawing: velocity arrows (flow direction indicators) ─── */
  function drawVelocityArrows() {
    var g = tubeGeo;
    var arrowPositions = [
      g.x0 + (g.x1 - g.x0) * 0.35,
      (g.x1 + g.x2) / 2,
      g.x2 + (g.x3 - g.x2) * 0.65
    ];
    for (var i = 0; i < arrowPositions.length; i++) {
      var ax = arrowPositions[i];
      var spd = speedAt(ax);
      var vRef = flowSpeed;
      var arrowLen = Math.min(spd / vRef * 18, 36);

      ctx.save();
      ctx.strokeStyle = 'rgba(82,200,180,0.50)';
      ctx.fillStyle   = 'rgba(82,200,180,0.50)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ax - arrowLen / 2, g.cy);
      ctx.lineTo(ax + arrowLen / 2 - 5, g.cy);
      ctx.stroke();
      /* arrowhead */
      ctx.beginPath();
      ctx.moveTo(ax + arrowLen / 2, g.cy);
      ctx.lineTo(ax + arrowLen / 2 - 6, g.cy - 4);
      ctx.lineTo(ax + arrowLen / 2 - 6, g.cy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  /* ── Drawing: pressure vs. x graph ───────────────────────── */
  function drawGraph() {
    var g = tubeGeo;

    var gx0 = splitX + W * 0.04;
    var gy0 = H * 0.10;
    var gx1 = W * 0.97;
    var gy1 = H * 0.88;
    var gW  = gx1 - gx0;
    var gH  = gy1 - gy0;

    /* Graph title */
    ctx.save();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.60)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Pressure vs. Position', gx0 + gW / 2, gy0 - 14);
    ctx.restore();

    /* Axes */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,180,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gx0, gy1); ctx.lineTo(gx1, gy1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx0, gy0); ctx.lineTo(gx0, gy1); ctx.stroke();
    ctx.restore();

    /* Axis labels */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.55)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('x →', gx1, gy1 + 3);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('P', gx0 + 3, gy0);
    ctx.restore();

    /* Tube profile (scaled to graph width) — faint reference */
    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i <= 80; i++) {
      var frac = i / 80;
      var xSrc = g.x0 + frac * (g.x3 - g.x0);
      var half = tubeHalfAt(xSrc);
      var halfNorm = half / g.wideH;    /* 1 = wide, <1 = narrow */
      var gx = gx0 + frac * gW;
      var gy = gy0 + (1 - halfNorm * 0.5) * gH;  /* lower half = closer to axis */
      if (i === 0) ctx.moveTo(gx, gy); else ctx.lineTo(gx, gy);
    }
    ctx.stroke();
    ctx.restore();

    /* Pressure curve */
    ctx.save();
    ctx.strokeStyle = 'rgba(82,133,200,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var j = 0; j <= 80; j++) {
      var fr = j / 80;
      var xs = g.x0 + fr * (g.x3 - g.x0);
      var press = pressureAt(xs);
      /* normalise to [0,1]: p=1 maps to gy0, p=0 maps to gy1 */
      var pClamped2 = Math.max(0, Math.min(1, press));
      var gxp = gx0 + fr * gW;
      var gyp = gy0 + (1 - pClamped2) * gH;
      if (j === 0) ctx.moveTo(gxp, gyp); else ctx.lineTo(gxp, gyp);
    }
    ctx.stroke();
    ctx.restore();

    /* Fill under curve */
    ctx.save();
    ctx.beginPath();
    for (var k = 0; k <= 80; k++) {
      var fk = k / 80;
      var xk = g.x0 + fk * (g.x3 - g.x0);
      var pk = Math.max(0, Math.min(1, pressureAt(xk)));
      var gxk = gx0 + fk * gW;
      var gyk = gy0 + (1 - pk) * gH;
      if (k === 0) ctx.moveTo(gxk, gy1); else ctx.lineTo(gxk, gyk);
    }
    ctx.lineTo(gx1, gy1);
    ctx.closePath();
    ctx.fillStyle = 'rgba(82,133,200,0.08)';
    ctx.fill();
    ctx.restore();

    /* Dashed line at P=0 reference */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,80,80,0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(gx0, gy1);
    ctx.lineTo(gx1, gy1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* High P / Low P labels */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(82,133,200,0.65)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('High P', gx0 + 4, gy0 + 4);
    ctx.fillStyle = 'rgba(200,120,80,0.65)';
    ctx.fillText('Low P', gx0 + 4, gy1 - 14);
    ctx.restore();
  }

  /* ── Panel labels ─────────────────────────────────────────── */
  function drawLabels() {
    var g = tubeGeo;

    /* "Venturi Tube" label */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.40)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Venturi Tube', g.cx, 6);
    ctx.restore();

    /* Speed readout */
    var vThroat = speedAt((g.x1 + g.x2) / 2);
    var vWide   = flowSpeed;
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,200,200,0.65)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      'v\u2081 = ' + vWide.toFixed(2) + ' m/s  |  v\u2082 = ' + vThroat.toFixed(2) + ' m/s',
      g.cx, H * 0.96
    );
    ctx.restore();

    /* "Flow \u2192" arrow label at tube entrance */
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(82,200,180,0.50)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2192 flow', g.x0, g.cy - g.wideH - 18);
    ctx.restore();
  }

  /* ── Main draw ────────────────────────────────────────────── */
  function draw() {
    if (!W || !H) return;

    computeTubeGeo();

    ctx.clearRect(0, 0, W, H);

    /* Background */
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

    /* Left panel */
    drawTube();
    drawPressureColumns();
    drawVelocityArrows();
    if (running && !reduced) {
      updateParticles();
    }
    drawParticles();
    drawLabels();

    /* Right panel */
    drawGraph();
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
      throatRatio = 0.35;
      flowSpeed   = 1.0;
      var throatSlider = document.getElementById('throat-slider');
      if (throatSlider) { throatSlider.value = 0.35; }
      var speedSlider = document.getElementById('speed-slider');
      if (speedSlider) { speedSlider.value = 1.0; }
      updateSliderLabels();
      computeTubeGeo();
      initParticles();
      draw();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas && canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
    }
  };

  /* ── Slider label helpers ─────────────────────────────────── */
  function updateSliderLabels() {
    var tl = document.getElementById('throat-label');
    if (tl) { tl.textContent = Math.round(throatRatio * 100) + '%'; }
    var sl = document.getElementById('speed-label');
    if (sl) { sl.textContent = flowSpeed.toFixed(1) + ' m/s'; }
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
      W = Math.round(rect.width || 640);
      H = Math.max(340, Math.round(rect.height || 360));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      splitX = W * 0.55;
      computeTubeGeo();
      initParticles();
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    /* Throat-width slider */
    var throatSlider = document.getElementById('throat-slider');
    if (throatSlider) {
      throatSlider.value = throatRatio;
      throatSlider.addEventListener('input', function () {
        throatRatio = parseFloat(throatSlider.value);
        computeTubeGeo();
        initParticles();
        updateSliderLabels();
        if (!running) { draw(); }
      });
    }

    /* Flow-speed slider */
    var speedSlider = document.getElementById('speed-slider');
    if (speedSlider) {
      speedSlider.value = flowSpeed;
      speedSlider.addEventListener('input', function () {
        flowSpeed = parseFloat(speedSlider.value);
        updateSliderLabels();
        if (!running) { draw(); }
      });
    }

    /* Reset button */
    var resetBtn = document.getElementById('sim-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        window.SimAPI.reset();
      });
    }

    updateSliderLabels();
    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

}());
