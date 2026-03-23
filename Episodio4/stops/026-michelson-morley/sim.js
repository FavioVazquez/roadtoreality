/* sim.js — 026 Michelson-Morley: interferometer schematic, null result */
(function () {
  'use strict';
  var mount = document.getElementById('sim-mount');
  if (!mount) return;

  var canvas = document.createElement('canvas');
  canvas.width  = mount.clientWidth  || 600;
  canvas.height = mount.clientHeight || 360;
  canvas.style.display = 'block';
  canvas.style.width  = '100%';
  canvas.style.height = '100%';
  mount.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var W = canvas.width;
  var H = canvas.height;
  var raf = null;
  var t = 0;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLOR = '#5285c8';

  var cx = W * 0.45, cy = H * 0.52;
  var ARM = W * 0.28;

  /* --- mode state --- */
  var currentMode = 1;  /* 1=rotation-animation, 2=rotation-manual, 3=arm-ratio */
  var rotationAngle = 0;  /* degrees, for modes 1+2 */
  var armRatio = 1.0;     /* arm2 / arm1, for mode 3 */

  /* --- controls --- */
  var controls = document.getElementById('sim-controls-026');
  var rotSliderRow = controls ? controls.querySelector('.row-rotation') : null;
  var armSliderRow = controls ? controls.querySelector('.row-arm-ratio') : null;
  var rotSlider    = controls ? controls.querySelector('#rot-slider') : null;
  var armSlider    = controls ? controls.querySelector('#arm-slider') : null;
  var hintEl       = document.getElementById('mode-hint');

  function setMode(m) {
    currentMode = m;
    if (rotSliderRow) rotSliderRow.style.display = (m === 1 || m === 2) ? '' : 'none';
    if (armSliderRow) armSliderRow.style.display = (m === 3) ? '' : 'none';

    var hints = {
      1: 'The apparatus rotates continuously — watch for a fringe shift that never comes.',
      2: 'Drag the slider to rotate the interferometer by hand.',
      3: 'Change the arm ratio. At exactly 1 : 1 the null result is confirmed — no shift.'
    };
    if (hintEl) hintEl.textContent = hints[m] || '';

    /* update active button styling */
    if (controls) {
      controls.querySelectorAll('.mode-btn').forEach(function (btn) {
        btn.classList.toggle('active', parseInt(btn.dataset.mode, 10) === m);
      });
    }

    if (!running) drawStatic();
  }

  /* --- drawing helpers --- */

  function drawApparatus(rotRad, arm1, arm2) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotRad);

    /* Arm 1 (horizontal) */
    ctx.strokeStyle = 'rgba(82,133,200,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(arm1, 0);
    ctx.stroke();
    /* Mirror 1 */
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(arm1, -12); ctx.lineTo(arm1, 12);
    ctx.stroke();

    /* Arm 2 (vertical) */
    ctx.strokeStyle = 'rgba(200,82,82,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, -arm2);
    ctx.stroke();
    /* Mirror 2 */
    ctx.strokeStyle = 'rgba(200,82,82,0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-12, -arm2); ctx.lineTo(12, -arm2);
    ctx.stroke();

    /* Beam splitter */
    ctx.strokeStyle = 'rgba(255,220,80,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -12); ctx.lineTo(12, 12);
    ctx.stroke();

    /* Animated beam dots (only in animation mode) */
    if (currentMode === 1) {
      var beamPos = (t * 0.5) % arm1;
      ctx.fillStyle = 'rgba(82,133,200,0.9)';
      ctx.beginPath();
      ctx.arc(beamPos, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(200,82,82,0.9)';
      ctx.beginPath();
      ctx.arc(0, -beamPos, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawDetectorNull(detX, detY) {
    /* Uniform mid-grey fill — no fringe stripes */
    ctx.fillStyle = 'rgb(128,128,128)';
    ctx.fillRect(detX, detY - 30, 30, 60);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(detX, detY - 30, 30, 60);

    /* Bold NULL RESULT label */
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NULL', detX + 15, detY + 46);
    ctx.fillText('RESULT', detX + 15, detY + 57);
    ctx.textAlign = 'left';
  }

  function drawDetectorFringes(detX, detY, shift) {
    ctx.fillStyle = 'rgba(20,20,30,0.8)';
    ctx.fillRect(detX, detY - 30, 30, 60);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(detX, detY - 30, 30, 60);

    /* Fringe stripes — brightness modulated by shift */
    for (var i = 0; i < 5; i++) {
      var brightness = 0.5 + 0.5 * Math.sin((i + shift) * Math.PI);
      ctx.fillStyle = 'rgba(255,255,255,' + brightness.toFixed(2) + ')';
      ctx.fillRect(detX + 2, detY - 28 + i * 12, 26, 6);
    }
    ctx.fillStyle = 'rgba(82,133,200,0.7)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('\u0394 = 0', detX + 15, detY + 46);
    ctx.fillText('null result', detX + 15, detY + 58);
    ctx.textAlign = 'left';
  }

  function drawModeInterferometer() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    var arm1 = ARM;
    var arm2 = ARM * armRatio;
    var rotRad = (rotationAngle * Math.PI) / 180;

    /* In mode 1, auto-rotate */
    if (currentMode === 1) {
      rotRad = t * 0.3;
    }

    drawApparatus(rotRad, arm1, arm2);

    /* Source */
    ctx.fillStyle = 'rgba(255,220,80,0.9)';
    ctx.beginPath();
    ctx.arc(cx - ARM * 0.5, cy, 8, 0, Math.PI * 2);
    ctx.fill();

    /* Detector */
    var detX = W * 0.82, detY = cy;

    var isNullResult = Math.abs(armRatio - 1.0) < 0.005;

    if (currentMode === 3 && isNullResult) {
      /* Uniform mid-grey, no stripes, bold label */
      drawDetectorNull(detX, detY);
    } else {
      /* Fringe pattern — shifts with rotation or arm ratio */
      var fringeShift = currentMode === 3
        ? (armRatio - 1.0) * 8
        : 0;
      drawDetectorFringes(detX, detY, fringeShift);
    }

    t += 0.025;
  }

  function drawStatic() {
    t = 0;
    drawModeInterferometer();
  }

  function loop() {
    drawModeInterferometer();
    if (running && !reduced) raf = requestAnimationFrame(loop);
  }

  /* --- slider wiring --- */
  var rotValEl = document.getElementById('rot-slider-val');
  var armValEl = document.getElementById('arm-slider-val');

  if (rotSlider) {
    rotSlider.addEventListener('input', function () {
      rotationAngle = parseFloat(this.value);
      if (rotValEl) rotValEl.textContent = Math.round(rotationAngle) + '\u00b0';
      if (!running) drawStatic();
    });
  }

  if (armSlider) {
    armSlider.addEventListener('input', function () {
      armRatio = parseFloat(this.value);
      if (armValEl) armValEl.textContent = armRatio.toFixed(3);
      if (!running) drawStatic();
    });
  }

  /* --- mode button wiring --- */
  if (controls) {
    controls.querySelectorAll('.mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMode(parseInt(this.dataset.mode, 10));
      });
    });
  }

  /* --- initialise --- */
  setMode(1);

  window.SimAPI = {
    start: function () {
      if (running) return;
      running = true;
      if (reduced) { drawStatic(); return; }
      raf = requestAnimationFrame(loop);
    },
    pause: function () {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    },
    reset: function () {
      window.SimAPI.pause();
      t = 0;
      rotationAngle = 0;
      armRatio = 1.0;
      if (rotSlider) rotSlider.value = 0;
      if (armSlider) armSlider.value = 1.0;
      if (rotValEl) rotValEl.textContent = '0\u00b0';
      if (armValEl) armValEl.textContent = '1.000';
      setMode(1);
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };

  drawStatic();
}());
