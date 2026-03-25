/* sim.js — 032 Rutherford: gold foil scattering — full interactive simulation */
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

  function resize() {
    var cw = mount.clientWidth || 600;
    var ch = mount.clientHeight || 360;
    if (cw < 360) cw = 360;
    if (ch < 300) ch = 300;
    W = cw;
    H = ch;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2;
    cy = H / 2;
    initParticles();
    drawStatic();
  }

  /* ---- State ---- */
  var Z = 79;
  var mode = 'stream';
  var aimB = 0;
  var POOL_SIZE = 8;
  var particles = [];
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Single aim-mode particle state */
  var aimParticle = null;
  var aimTheta = 0;
  var aimDone = false;

  /* ---- Foil x ---- */
  function foilX() { return cx; }

  /* ---- Rutherford scattering ---- */
  function chargeD() {
    /* D = closest-approach distance for head-on at current Z */
    return Z * (H * 0.004);
  }

  function rutherfordTheta(b) {
    var D = chargeD();
    if (b < 0.5) return Math.PI;
    return 2 * Math.atan2(D, b);
  }

  /* ---- Particle pool ---- */
  function randomB() {
    if (Math.random() < 0.7) {
      /* large b — mostly straight */
      return (Math.random() * 0.37 + 0.08) * H;
    } else {
      /* small b — near nucleus */
      return Math.random() * 0.08 * H;
    }
  }

  function makeParticle(index) {
    /* Stagger start positions so they don't all sync */
    var b = randomB();
    var sign = Math.random() < 0.5 ? 1 : -1;
    var theta = rutherfordTheta(b);
    var ySource = cy + sign * b;
    /* outgoing direction */
    var outAngle = sign > 0 ? theta : -theta; /* above/below axis */
    /* phase: 0=incoming, 1=outgoing */
    return {
      b: b,
      sign: sign,
      theta: theta,
      ySource: ySource,
      phase: 0,
      /* x along segment */
      x: -W * 0.05 - index * (W / POOL_SIZE) * Math.random(),
      y: ySource,
      outAngle: (sign > 0 ? -(Math.PI - theta) : (Math.PI - theta))
    };
  }

  function initParticles() {
    particles = [];
    if (mode === 'stream') {
      for (var i = 0; i < POOL_SIZE; i++) {
        particles.push(makeParticle(i));
      }
    } else {
      /* aim mode: single static particle */
      resetAimParticle();
    }
  }

  function resetAimParticle() {
    var b = aimB;
    var sign = b >= 0 ? 1 : -1;
    b = Math.abs(b);
    aimTheta = rutherfordTheta(b);
    aimDone = true;
    aimParticle = {
      b: b,
      sign: sign,
      theta: aimTheta,
      ySource: cy + sign * b
    };
  }

  /* ---- Advance stream particles ---- */
  var SPEED = 2.5;

  function stepParticle(p) {
    var fx = foilX();
    if (p.phase === 0) {
      /* incoming: move right toward foil */
      p.x += SPEED;
      p.y = p.ySource;
      if (p.x >= fx) {
        p.phase = 1;
        p.x = fx;
        p.y = p.ySource;
      }
    } else {
      /* outgoing: move in direction of scattering */
      var cos = Math.cos(p.outAngle);
      var sin = Math.sin(p.outAngle);
      p.x += SPEED * cos;
      p.y += SPEED * sin;
    }
  }

  function isOffCanvas(p) {
    return p.x > W + 20 || p.x < -20 || p.y > H + 20 || p.y < -20;
  }

  function recycleParticle(p) {
    var b = randomB();
    var sign = Math.random() < 0.5 ? 1 : -1;
    var theta = rutherfordTheta(b);
    var ySource = cy + sign * b;
    p.b = b;
    p.sign = sign;
    p.theta = theta;
    p.ySource = ySource;
    p.phase = 0;
    p.x = -15;
    p.y = ySource;
    /* outgoing angle: relative to incoming (positive x direction)
       for particle coming from left hitting nucleus:
       above center (sign>0): scatters upward if theta > pi/2, else stays below
       theta is the full scattering angle from incident direction */
    var halfPi = Math.PI / 2;
    if (sign > 0) {
      /* deflects upward */
      p.outAngle = -(Math.PI - theta);
    } else {
      /* deflects downward */
      p.outAngle = (Math.PI - theta);
    }
  }

  /* ---- Draw helpers ---- */
  function drawNucleus() {
    var r = 9;
    /* gold glow */
    var grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
    grd.addColorStop(0, 'rgba(255,210,60,1)');
    grd.addColorStop(0.5, 'rgba(220,140,30,0.8)');
    grd.addColorStop(1, 'rgba(200,100,20,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,200,60,1)';
    ctx.fill();

    /* Z label */
    ctx.fillStyle = 'rgba(255,220,80,0.85)';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Z=' + Z, cx, cy - r - 6);
    ctx.textAlign = 'left';
  }

  function drawFoil() {
    var fx = foilX();
    ctx.save();
    ctx.strokeStyle = 'rgba(255,200,60,0.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(fx, 0);
    ctx.lineTo(fx, H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,200,60,0.55)';
    ctx.font = '10px monospace';
    ctx.fillText('Au foil', fx + 5, 16);
  }

  function drawAlpha(x, y, alpha) {
    alpha = alpha !== undefined ? alpha : 1;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,80,' + alpha + ')';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,200,' + (alpha * 0.7) + ')';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawTrail(p) {
    var fx = foilX();
    ctx.strokeStyle = 'rgba(180,120,255,0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (p.phase === 0) {
      ctx.moveTo(0, p.ySource);
      ctx.lineTo(p.x, p.y);
    } else {
      ctx.moveTo(0, p.ySource);
      ctx.lineTo(fx, p.ySource);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  /* ---- Aim mode draw ---- */
  function drawAimMode() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(10,0,20,0.92)';
    ctx.fillRect(0, 0, W, H);

    drawFoil();
    drawNucleus();

    if (aimParticle) {
      var fx = foilX();
      var p = aimParticle;
      var theta = p.theta;
      var b = p.b;
      var sign = p.sign;
      var ys = cy + sign * b;
      var halfPi = Math.PI / 2;

      /* outgoing angle from horizontal */
      var outAngle;
      if (sign >= 0) {
        outAngle = -(Math.PI - theta);
      } else {
        outAngle = (Math.PI - theta);
      }

      var lineLen = Math.max(W, H);

      /* incoming segment */
      ctx.strokeStyle = 'rgba(255,200,60,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, ys);
      ctx.lineTo(fx, ys);
      ctx.stroke();

      /* outgoing segment */
      ctx.strokeStyle = 'rgba(255,120,80,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, ys);
      ctx.lineTo(fx + lineLen * Math.cos(outAngle), ys + lineLen * Math.sin(outAngle));
      ctx.stroke();

      /* alpha particle dot at foil junction */
      drawAlpha(fx, ys, 1);

      /* angle arc */
      var arcR = 30;
      ctx.strokeStyle = 'rgba(200,255,120,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      /* Arc from incoming dir (angle=pi) to outgoing dir */
      var inAngle = 0; /* coming from left = angle 0 on right side, but we flip: track right-side direction */
      /* outgoing absolute angle */
      ctx.arc(fx, ys, arcR, Math.PI, Math.PI + outAngle, outAngle > 0);
      ctx.stroke();

      /* theta label */
      var degTheta = Math.round(theta * 180 / Math.PI);
      ctx.fillStyle = 'rgba(200,255,120,0.9)';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('\u03b8 = ' + degTheta + '\u00b0', fx + arcR + 8, ys - 4);

      /* impact parameter label */
      if (b > 2) {
        ctx.strokeStyle = 'rgba(100,200,255,0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(fx - 20, cy);
        ctx.lineTo(fx - 20, ys);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(100,200,255,0.8)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('b=' + Math.round(b) + 'px', fx - 24, (cy + ys) / 2 + 4);
        ctx.textAlign = 'left';
      }
    }

    /* label */
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '11px monospace';
    ctx.fillText('Manual aim mode — adjust impact parameter b', 10, H - 12);
  }

  /* ---- Stream draw ---- */
  function drawStreamFrame() {
    /* semi-transparent clear for trail persistence */
    ctx.fillStyle = 'rgba(10,0,20,0.18)';
    ctx.fillRect(0, 0, W, H);

    drawFoil();
    drawNucleus();

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      drawTrail(p);
      drawAlpha(p.x, p.y, 0.9);
      stepParticle(p);
      if (isOffCanvas(p)) {
        recycleParticle(p);
      }
    }

    /* legend */
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px monospace';
    ctx.fillText('Stream mode — ' + POOL_SIZE + ' \u03b1 particles', 10, H - 12);
  }

  /* ---- Static frame ---- */
  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(10,0,20,0.92)';
    ctx.fillRect(0, 0, W, H);

    drawFoil();
    drawNucleus();

    /* Draw several representative static trajectories */
    var examples = [
      { b: H * 0.35, sign: 1 },
      { b: H * 0.22, sign: -1 },
      { b: H * 0.08, sign: 1 },
      { b: H * 0.04, sign: -1 },
      { b: 0, sign: 1 }
    ];

    var fx = foilX();
    for (var i = 0; i < examples.length; i++) {
      var e = examples[i];
      var b = e.b;
      var sign = e.sign;
      var theta = rutherfordTheta(b);
      var ys = cy + sign * b;
      var outAngle = sign >= 0 ? -(Math.PI - theta) : (Math.PI - theta);

      ctx.strokeStyle = 'rgba(180,120,255,0.3)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, ys);
      ctx.lineTo(fx, ys);
      var endX = fx + W * Math.cos(outAngle);
      var endY = ys + W * Math.sin(outAngle);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      drawAlpha(fx, ys, 0.6);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px monospace';
    ctx.fillText('Press Play to start stream', 10, H - 12);
  }

  /* ---- Animation loop ---- */
  function loop() {
    if (!running) return;
    if (mode === 'stream') {
      drawStreamFrame();
    } else {
      drawAimMode();
    }
    raf = requestAnimationFrame(loop);
  }

  /* ---- Controls wiring ---- */
  function wireControls() {
    /* Nucleus charge slider */
    var chargeSlider = document.getElementById('nucleus-charge-slider');
    var chargeReadout = document.getElementById('nucleus-charge-readout');
    if (chargeSlider) {
      chargeSlider.value = Z;
      chargeSlider.addEventListener('input', function () {
        Z = parseInt(chargeSlider.value, 10);
        if (chargeReadout) {
          chargeReadout.textContent = 'Z = ' + Z + (Z === 79 ? ' (Gold)' : Z === 1 ? ' (Hydrogen)' : '');
        }
        if (mode === 'aim') resetAimParticle();
        else initParticles();
        if (!running) drawStatic();
      });
    }

    /* Mode toggle */
    var modeBtn = document.getElementById('mode-toggle');
    if (modeBtn) {
      modeBtn.addEventListener('click', function () {
        if (mode === 'stream') {
          mode = 'aim';
          modeBtn.textContent = 'Switch to Stream Mode';
          /* show aim slider */
          var aimRow = document.getElementById('aim-slider-row');
          if (aimRow) aimRow.style.display = '';
          resetAimParticle();
        } else {
          mode = 'stream';
          modeBtn.textContent = 'Switch to Manual Aim';
          var aimRow2 = document.getElementById('aim-slider-row');
          if (aimRow2) aimRow2.style.display = 'none';
          initParticles();
        }
        if (!running) drawStatic();
      });
    }

    /* Aim slider */
    var aimSlider = document.getElementById('aim-slider');
    var aimReadout = document.getElementById('aim-readout');
    if (aimSlider) {
      aimSlider.addEventListener('input', function () {
        var val = parseInt(aimSlider.value, 10);
        aimB = val / 100 * H * 0.45;
        var theta = rutherfordTheta(aimB);
        var deg = Math.round(theta * 180 / Math.PI);
        if (aimReadout) {
          aimReadout.textContent = 'b = ' + Math.round(aimB) + 'px  (\u03b8 = ' + deg + '\u00b0)';
        }
        if (mode === 'aim') {
          resetAimParticle();
          if (!running) drawAimMode();
        }
      });
    }
  }

  /* ---- SimAPI ---- */
  window.SimAPI = {
    start: function () {
      if (running) return;
      running = true;
      if (reduced) { drawStatic(); return; }
      /* Full clear before starting stream */
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(10,0,20,0.92)';
      ctx.fillRect(0, 0, W, H);
      raf = requestAnimationFrame(loop);
    },
    pause: function () {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    },
    reset: function () {
      window.SimAPI.pause();
      initParticles();
      resetAimParticle();
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
  initParticles();
  drawStatic();
}());
