/* sim.js — 033 Bohr atom: classical collapse then quantized orbits — full interactive */
(function () {
  'use strict';

  var mount = document.getElementById('sim-mount');
  if (!mount) return;

  /* ---- Canvas setup with DPR ---- */
  var dpr = window.devicePixelRatio || 1;
  var canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  mount.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var W, H, cx, cy;
  var r_max, r_min;

  function resize() {
    var cw = mount.clientWidth || 500;
    var ch = mount.clientHeight || 400;
    if (cw < 360) cw = 360;
    if (ch < 360) ch = 360;
    W = cw;
    H = ch;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2;
    cy = H * 0.40;
    r_max = Math.min(W, H) * 0.30;
    r_min = 6;
    /* Scale orbit radii to canvas so they never overlap the spectrum bar */
    BOHR_RADII = [0, r_max * 0.17, r_max * 0.40, r_max * 0.70, r_max];
  }

  /* ---- Global state ---- */
  var phase = 'classical';
  var collapseComplete = false;
  var collapseStartTime = null;
  var COLLAPSE_DURATION = 3500;
  var spiralAngle = 0;
  var flashAlpha = 0;
  var collapseBohrBtn = null;

  /* trail of recent electron positions */
  var trailPositions = [];
  var TRAIL_LEN = 30;

  /* ---- Bohr state ---- */
  var bohrLevel = 3;
  var bohrAngle = 0;
  /* BOHR_RADII index 0 unused; n=1..4 */
  var BOHR_RADII = [0, 0, 0, 0, 0]; /* populated in resize() */
  var BOHR_SPEEDS = [0, 0.08, 0.038, 0.024, 0.017];
  var spectrumLines = [];
  var flashLines = {};   /* key: rounded wavelength string, value: frame countdown */
  var photons = [];

  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Spectrum bar layout */
  var specBarW = 260;
  var specBarH = 28;

  function specLayout() {
    return {
      x: cx - specBarW / 2,
      y: H - 62,
      w: specBarW,
      h: specBarH
    };
  }

  function lambdaToX(lambda_nm) {
    var s = specLayout();
    return s.x + s.w * (lambda_nm - 380) / 320;
  }

  /* Balmer line colors lookup (closest known wavelength) */
  function balmerColor(lambda_nm) {
    if (lambda_nm > 640) return 'rgb(255,80,60)';        /* 656nm H-alpha red */
    if (lambda_nm > 470 && lambda_nm < 510) return 'rgb(80,210,200)'; /* 486nm H-beta cyan */
    if (lambda_nm > 425 && lambda_nm < 445) return 'rgb(160,80,220)'; /* 434nm H-gamma violet */
    if (lambda_nm > 400 && lambda_nm < 425) return 'rgb(110,50,180)'; /* 410nm H-delta deep violet */
    /* generic visible-spectrum approximation */
    if (lambda_nm < 440) return 'rgb(130,60,200)';
    if (lambda_nm < 490) return 'rgb(60,130,220)';
    if (lambda_nm < 560) return 'rgb(60,200,80)';
    if (lambda_nm < 600) return 'rgb(220,200,40)';
    return 'rgb(220,80,40)';
  }

  /* ---- Draw helpers ---- */
  function drawNucleus(flash) {
    var r = 10;
    var grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.5);
    grd.addColorStop(0, 'rgba(255,200,60,1)');
    grd.addColorStop(0.4, 'rgba(220,130,30,0.9)');
    grd.addColorStop(1, 'rgba(200,100,20,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,200,60,1)';
    ctx.fill();

    if (flash && flashAlpha > 0) {
      var fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r_max * 0.6);
      fg.addColorStop(0, 'rgba(255,255,255,' + flashAlpha + ')');
      fg.addColorStop(0.3, 'rgba(255,240,100,' + (flashAlpha * 0.8) + ')');
      fg.addColorStop(1, 'rgba(255,200,60,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r_max * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = fg;
      ctx.fill();
    }
  }

  function drawElectron(ex, ey, color) {
    ctx.beginPath();
    ctx.arc(ex, ey, 6, 0, Math.PI * 2);
    ctx.fillStyle = color || 'rgba(80,220,255,0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawTrail(trail) {
    for (var i = 0; i < trail.length; i++) {
      var alpha = (i / trail.length) * 0.45;
      ctx.beginPath();
      ctx.arc(trail[i].x, trail[i].y, 2 + i / trail.length * 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(80,200,255,' + alpha + ')';
      ctx.fill();
    }
  }

  function drawOrbitRings() {
    ctx.save();
    ctx.setLineDash([4, 5]);
    for (var n = 1; n <= 4; n++) {
      var r = BOHR_RADII[n];
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = n === bohrLevel ? 'rgba(180,140,255,0.5)' : 'rgba(120,80,200,0.25)';
      ctx.lineWidth = n === bohrLevel ? 1.5 : 1;
      ctx.stroke();
      /* n label */
      ctx.fillStyle = 'rgba(180,140,255,0.55)';
      ctx.font = '10px monospace';
      ctx.setLineDash([]);
      ctx.fillText('n=' + n, cx + r + 3, cy - 3);
      ctx.setLineDash([4, 5]);
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawSpectrumBar() {
    var s = specLayout();
    /* label */
    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Emission spectrum (Balmer series)', cx, s.y - 6);
    ctx.textAlign = 'left';

    /* background gradient */
    var bg = ctx.createLinearGradient(s.x, 0, s.x + s.w, 0);
    bg.addColorStop(0, 'rgba(130,60,200,0.3)');
    bg.addColorStop(0.15, 'rgba(60,100,220,0.3)');
    bg.addColorStop(0.35, 'rgba(60,200,80,0.2)');
    bg.addColorStop(0.6, 'rgba(220,210,40,0.2)');
    bg.addColorStop(1, 'rgba(220,60,40,0.3)');
    ctx.fillStyle = bg;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(200,200,200,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x, s.y, s.w, s.h);

    /* wavelength tick marks */
    var ticks = [400, 450, 500, 550, 600, 650, 700];
    ctx.fillStyle = 'rgba(180,180,180,0.35)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    for (var ti = 0; ti < ticks.length; ti++) {
      var tx = lambdaToX(ticks[ti]);
      if (tx >= s.x && tx <= s.x + s.w) {
        ctx.fillText(ticks[ti], tx, s.y - 3);
      }
    }
    ctx.textAlign = 'left';

    /* accumulated emission lines — glow pass + core line + white flash */
    for (var i = 0; i < spectrumLines.length; i++) {
      var line = spectrumLines[i];
      var key = Math.round(line.lambda_nm).toString();
      var flash = flashLines[key] || 0;
      var flashFrac = flash / 20;  /* 1.0 when just added, 0 when settled */

      /* glow pass — wide soft line behind */
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 6;
      ctx.globalAlpha = 0.25 + flashFrac * 0.3;
      ctx.beginPath();
      ctx.moveTo(line.x, s.y);
      ctx.lineTo(line.x, s.y + s.h);
      ctx.stroke();

      /* core line */
      ctx.lineWidth = 3;
      ctx.globalAlpha = flashFrac > 0 ? 0.5 + flashFrac * 0.5 : 0.9;
      ctx.strokeStyle = flashFrac > 0
        ? 'rgba(255,255,255,' + (0.4 + flashFrac * 0.6) + ')'
        : line.color;
      ctx.beginPath();
      ctx.moveTo(line.x, s.y);
      ctx.lineTo(line.x, s.y + s.h);
      ctx.stroke();

      ctx.globalAlpha = 1;
    }
  }

  function drawPhotons() {
    for (var i = photons.length - 1; i >= 0; i--) {
      var ph = photons[i];
      ph.x += ph.vx;
      ph.y += ph.vy;
      ph.life -= 1;
      ctx.beginPath();
      ctx.arc(ph.x, ph.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = ph.color;
      ctx.globalAlpha = Math.min(ph.life / 40, 1);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (ph.x > W + 20 || ph.x < -20 || ph.y > H + 20 || ph.y < -20 || ph.life <= 0) {
        photons.splice(i, 1);
      }
    }
  }

  /* ---- Classical collapse animation ---- */
  function drawClassical(now) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(8,0,18,0.95)';
    ctx.fillRect(0, 0, W, H);

    if (collapseStartTime === null) {
      collapseStartTime = now;
    }

    var elapsed = now - collapseStartTime;
    var progress = Math.min(elapsed / COLLAPSE_DURATION, 1.0);

    /* Radius decays exponentially */
    var r = r_max * Math.exp(-3.5 * progress);

    /* Angular speed increases as r shrinks */
    spiralAngle += 0.04 + 0.16 * progress;

    var ex = cx + r * Math.cos(spiralAngle);
    var ey = cy + r * Math.sin(spiralAngle);

    /* Update trail */
    trailPositions.push({ x: ex, y: ey });
    if (trailPositions.length > TRAIL_LEN) trailPositions.shift();

    drawTrail(trailPositions);

    drawNucleus(true);
    drawElectron(ex, ey, 'rgba(80,220,255,0.95)');

    /* Collapse complete check */
    if (progress >= 1.0 && !collapseComplete) {
      collapseComplete = true;
      flashAlpha = 1.0;
      if (collapseBohrBtn) {
        collapseBohrBtn.disabled = false;
        collapseBohrBtn.title = '';
      }
      var hintEl = document.getElementById('bohr-hint');
      if (hintEl) hintEl.textContent = 'Classical collapse complete — toggle to Bohr model';
    }

    /* Flash decay */
    if (flashAlpha > 0) {
      flashAlpha -= 0.025;
      if (flashAlpha < 0) flashAlpha = 0;
    }

    /* Label */
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px monospace';
    ctx.fillText('Classical model: electron loses energy and spirals in\u2026', 10, H - 14);
  }

  /* ---- Bohr mode animation ---- */
  function drawBohr() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(8,0,18,0.95)';
    ctx.fillRect(0, 0, W, H);

    drawOrbitRings();
    drawNucleus(false);

    /* Advance electron */
    bohrAngle += BOHR_SPEEDS[bohrLevel];
    var r = BOHR_RADII[bohrLevel];
    var ex = cx + r * Math.cos(bohrAngle);
    var ey = cy + r * Math.sin(bohrAngle);
    drawElectron(ex, ey, 'rgba(80,220,255,0.95)');

    drawPhotons();
    drawSpectrumBar();

    /* Decrement flash countdowns after drawing */
    var keys = Object.keys(flashLines);
    for (var ki = 0; ki < keys.length; ki++) {
      if (flashLines[keys[ki]] > 0) flashLines[keys[ki]] -= 1;
    }

    /* Energy label */
    var en = (-13.6 / (bohrLevel * bohrLevel)).toFixed(2);
    ctx.fillStyle = 'rgba(180,220,255,0.7)';
    ctx.font = '11px monospace';
    ctx.fillText('E\u2099 = ' + en + ' eV  (n=' + bohrLevel + ')', 10, 20);

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '11px monospace';
    ctx.fillText('Bohr model: quantized orbits \u2014 stable!', 10, H - 14);
    ctx.fillText('Click an orbit ring to change energy level', 10, H - 28);
  }

  /* ---- drawStatic ---- */
  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(8,0,18,0.95)';
    ctx.fillRect(0, 0, W, H);

    if (phase === 'classical') {
      drawNucleus(false);
      var ex0 = cx + r_max * Math.cos(0);
      var ey0 = cy + r_max * Math.sin(0);
      drawElectron(ex0, ey0, 'rgba(80,220,255,0.95)');

      /* dashed orbit at r_max */
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, r_max, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(80,180,255,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '11px monospace';
      ctx.fillText('Classical \u2014 electron unstable', 10, H - 14);
    } else {
      drawOrbitRings();
      drawNucleus(false);
      var r3 = BOHR_RADII[3];
      var ex3 = cx + r3;
      var ey3 = cy;
      drawElectron(ex3, ey3, 'rgba(80,220,255,0.95)');
      drawSpectrumBar();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '11px monospace';
      ctx.fillText('Bohr model: quantized orbits \u2014 stable!', 10, H - 14);
    }
  }

  /* ---- Animation loop ---- */
  function loop(now) {
    if (!running) return;
    if (phase === 'classical') {
      drawClassical(now);
    } else {
      drawBohr();
    }
    raf = requestAnimationFrame(loop);
  }

  /* ---- Electron jump ---- */
  function triggerJump(nTarget) {
    if (nTarget === bohrLevel) return;
    var nHigh = Math.max(nTarget, bohrLevel);
    var nLow = Math.min(nTarget, bohrLevel);
    var dE_abs = 13.6 * (1.0 / (nLow * nLow) - 1.0 / (nHigh * nHigh));
    var lambda_nm = 1240 / dE_abs;
    var color = balmerColor(lambda_nm);

    if (nTarget < bohrLevel) {
      /* downward jump: emit photon */
      var r = BOHR_RADII[bohrLevel];
      var ex = cx + r * Math.cos(bohrAngle);
      var ey = cy + r * Math.sin(bohrAngle);
      var speed = 3.5;
      var vx = (ex - cx) / r * speed;
      var vy = (ey - cy) / r * speed;
      photons.push({ x: ex, y: ey, vx: vx, vy: vy, color: color, life: 80 });

      /* add spectrum line if visible range — deduplicate within ±3nm */
      if (lambda_nm >= 380 && lambda_nm <= 700) {
        var lx = lambdaToX(lambda_nm);
        var s = specLayout();
        if (lx >= s.x && lx <= s.x + s.w) {
          var isDuplicate = false;
          for (var si = 0; si < spectrumLines.length; si++) {
            if (Math.abs(spectrumLines[si].lambda_nm - lambda_nm) < 3) {
              isDuplicate = true;
              flashLines[Math.round(lambda_nm).toString()] = 20;
              break;
            }
          }
          if (!isDuplicate) {
            spectrumLines.push({ lambda_nm: lambda_nm, x: lx, color: color });
            flashLines[Math.round(lambda_nm).toString()] = 20;
          }
        }
      }
    } else {
      /* upward jump: absorb photon (show inward blue dot) */
      var ro = BOHR_RADII[nTarget];
      var ex2 = cx + ro * Math.cos(bohrAngle);
      var ey2 = cy + ro * Math.sin(bohrAngle);
      var spd = 3;
      var vx2 = (cx - ex2) / ro * spd;
      var vy2 = (cy - ey2) / ro * spd;
      photons.push({ x: ex2, y: ey2, vx: vx2, vy: vy2, color: 'rgba(80,180,255,0.9)', life: 25 });
    }

    bohrLevel = nTarget;
  }

  /* ---- Click handler ---- */
  canvas.addEventListener('click', function (e) {
    if (phase !== 'bohr') return;
    var rect = canvas.getBoundingClientRect();
    var mx = (e.clientX - rect.left);
    var my = (e.clientY - rect.top);
    var dx = mx - cx;
    var dy = my - cy;
    var dist = Math.sqrt(dx * dx + dy * dy);

    var closest = -1;
    var closestDist = Infinity;
    for (var n = 1; n <= 4; n++) {
      var d = Math.abs(dist - BOHR_RADII[n]);
      if (d < closestDist) {
        closestDist = d;
        closest = n;
      }
    }
    if (closestDist < 14 && closest !== -1) {
      triggerJump(closest);
      if (phase === 'bohr') drawBohr();
    }
  });

  /* ---- Controls wiring ---- */
  function wireControls() {
    collapseBohrBtn = document.getElementById('bohr-toggle-btn');
    if (collapseBohrBtn) {
      collapseBohrBtn.disabled = !collapseComplete;
      collapseBohrBtn.addEventListener('click', function () {
        if (!collapseComplete && phase === 'classical') return;
        if (phase === 'classical') {
          /* switch to Bohr */
          phase = 'bohr';
          bohrLevel = 3;
          bohrAngle = 0;
          spectrumLines = [];
          flashLines = {};
          photons = [];
          collapseBohrBtn.textContent = 'Restart Classical';
          var hintEl = document.getElementById('bohr-hint');
          if (hintEl) hintEl.textContent = 'Click orbit rings to jump energy levels';
          if (!running) drawStatic();
        } else {
          /* restart classical */
          phase = 'classical';
          collapseComplete = false;
          collapseStartTime = null;
          spiralAngle = 0;
          flashAlpha = 0;
          trailPositions = [];
          spectrumLines = [];
          flashLines = {};
          photons = [];
          collapseBohrBtn.disabled = true;
          collapseBohrBtn.textContent = 'Switch to Bohr Model';
          var hintEl2 = document.getElementById('bohr-hint');
          if (hintEl2) hintEl2.textContent = 'Watch the classical collapse first';
          if (!running) drawStatic();
        }
      });
    }
  }

  /* ---- SimAPI ---- */
  window.SimAPI = {
    start: function () {
      if (running) return;
      running = true;
      if (reduced) {
        /* skip collapse — show both states */
        phase = 'bohr';
        collapseComplete = true;
        if (collapseBohrBtn) collapseBohrBtn.disabled = false;
        drawStatic();
        return;
      }
      raf = requestAnimationFrame(loop);
    },
    pause: function () {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    },
    reset: function () {
      window.SimAPI.pause();
      phase = 'classical';
      collapseComplete = false;
      collapseStartTime = null;
      spiralAngle = 0;
      flashAlpha = 0;
      trailPositions = [];
      spectrumLines = [];
      flashLines = {};
      photons = [];
      bohrLevel = 3;
      bohrAngle = 0;
      if (collapseBohrBtn) {
        collapseBohrBtn.disabled = true;
        collapseBohrBtn.textContent = 'Switch to Bohr Model';
      }
      var hintEl = document.getElementById('bohr-hint');
      if (hintEl) hintEl.textContent = 'Watch the classical collapse first';
      drawStatic();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };

  /* ---- Init ---- */
  resize();
  wireControls();
  drawStatic();
}());
