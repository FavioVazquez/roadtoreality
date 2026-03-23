/* sim.js — 021 Joule: falling weight heats water via paddle — wired sliders */
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
  var COLOR = '#5285c8';

  // Physics params (slider-driven)
  var dropHeight = 1.5; // m
  var mass       = 2.0; // kg
  var G = 9.8;

  function totalEnergy() { return mass * G * dropHeight; } // J

  function resize() {
    W = mount.clientWidth  || 600;
    H = mount.clientHeight || 360;
    canvas.width  = W;
    canvas.height = H;
  }

  // Layout constants (recomputed after resize)
  function boxLayout() {
    return {
      boxX: W * 0.44,
      boxW: W * 0.26,
      boxH: H * 0.30,
      boxY: H * 0.48
    };
  }

  var PERIOD = 5; // seconds per drop

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    var b     = boxLayout();
    var cycle = (t % PERIOD) / PERIOD;

    // Drop range scales with height slider: taller → weight starts higher
    var dropFrac  = Math.min(dropHeight / 3.0, 1.0); // 0–1 relative to max
    var weightX   = W * 0.22;
    var ropeTopY  = H * 0.06;
    var weightY0  = ropeTopY + (1.0 - dropFrac) * H * 0.25; // higher slider → higher start
    var weightYMax = b.boxY - 10;
    var weightY   = weightY0 + cycle * (weightYMax - weightY0);

    // Weight block size scales with mass
    var wHalf = Math.max(14, Math.min(26, 14 + (mass / 5.0) * 12));
    var wH    = wHalf * 1.4;
    var temp  = 20 + cycle * (totalEnergy() * 0.12); // °C rise scales with E

    // Pulley
    ctx.beginPath();
    ctx.arc(weightX, ropeTopY + 8, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(82,133,200,0.35)';
    ctx.fill();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vertical rope
    ctx.strokeStyle = 'rgba(82,133,200,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(weightX, ropeTopY + 18);
    ctx.lineTo(weightX, weightY);
    ctx.stroke();

    // Horizontal rope to paddle box
    ctx.beginPath();
    ctx.moveTo(weightX + 10, ropeTopY + 8);
    ctx.lineTo(b.boxX, ropeTopY + 8);
    ctx.lineTo(b.boxX, b.boxY + b.boxH * 0.35);
    ctx.stroke();

    // Weight block
    ctx.fillStyle = 'rgba(82,133,200,0.75)';
    ctx.fillRect(weightX - wHalf, weightY, wHalf * 2, wH);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(weightX - wHalf, weightY, wHalf * 2, wH);

    // Mass label on weight
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(mass.toFixed(1) + 'kg', weightX, weightY + wH * 0.6);

    // Drop height label — left of rope, scales with arrow length
    var arrowMidY = (weightY0 + weightYMax) / 2;
    ctx.strokeStyle = 'rgba(82,133,200,0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(weightX - wHalf - 14, weightY0);
    ctx.lineTo(weightX - wHalf - 14, weightYMax);
    ctx.stroke();
    ctx.setLineDash([]);
    // arrowheads
    ctx.fillStyle = 'rgba(82,133,200,0.6)';
    ctx.beginPath();
    ctx.moveTo(weightX - wHalf - 14, weightY0);
    ctx.lineTo(weightX - wHalf - 18, weightY0 + 8);
    ctx.lineTo(weightX - wHalf - 10, weightY0 + 8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(weightX - wHalf - 14, weightYMax);
    ctx.lineTo(weightX - wHalf - 18, weightYMax - 8);
    ctx.lineTo(weightX - wHalf - 10, weightYMax - 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(82,133,200,0.85)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('h=' + dropHeight.toFixed(1) + 'm', weightX - wHalf - 14, arrowMidY);

    // Arrived label
    if (cycle > 0.88) {
      ctx.fillStyle = 'rgba(82,200,133,0.9)';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('arrived', weightX, weightYMax + wH + 14);
    }

    // Water box — color shifts from blue to orange with heat
    var r = Math.round(82  + cycle * 120);
    var g = Math.round(133 - cycle * 50);
    var bl= Math.round(200 - cycle * 120);
    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + bl + ',0.28)';
    ctx.fillRect(b.boxX - b.boxW/2, b.boxY, b.boxW, b.boxH);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(b.boxX - b.boxW/2, b.boxY, b.boxW, b.boxH);

    ctx.fillStyle = 'rgba(82,133,200,0.65)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('water', b.boxX, b.boxY - 6);

    // Paddle
    ctx.save();
    ctx.translate(b.boxX, b.boxY + b.boxH * 0.5);
    ctx.rotate(t * 3.5);
    ctx.strokeStyle = 'rgba(82,133,200,0.9)';
    ctx.lineWidth = 3;
    for (var a = 0; a < 4; a++) {
      var ang = a * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang) * 18, Math.sin(ang) * 18);
      ctx.stroke();
    }
    ctx.restore();

    // --- Energy pie chart (right panel) ---
    var pieCX = W * 0.80;
    var pieCY = H * 0.30;
    var pieR  = Math.min(W, H) * 0.10;

    var heatFrac = cycle;
    var mechFrac = 1 - cycle;
    var sa = -Math.PI / 2;

    if (mechFrac > 0.001) {
      ctx.beginPath();
      ctx.moveTo(pieCX, pieCY);
      ctx.arc(pieCX, pieCY, pieR, sa, sa + mechFrac * Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(82,133,200,0.75)';
      ctx.fill();
    }
    if (heatFrac > 0.001) {
      ctx.beginPath();
      ctx.moveTo(pieCX, pieCY);
      ctx.arc(pieCX, pieCY, pieR, sa + mechFrac * Math.PI * 2, sa + Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(200,120,60,0.75)';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(pieCX, pieCY, pieR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(82,133,200,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(82,133,200,0.7)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('energy', pieCX, pieCY - pieR - 12);
    ctx.fillText('conversion', pieCX, pieCY - pieR - 2);

    // Legend + readouts below pie
    var readY = pieCY + pieR + 14;
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(82,133,200,0.85)';
    ctx.textAlign = 'left';
    ctx.fillRect(pieCX - 40, readY, 10, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('mech', pieCX - 26, readY + 8);

    ctx.fillStyle = 'rgba(200,120,60,0.85)';
    ctx.fillRect(pieCX + 8, readY, 10, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('heat', pieCX + 22, readY + 8);

    // Energy values
    var E = totalEnergy();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('E = mgh = ' + E.toFixed(1) + ' J', pieCX, readY + 26);
    ctx.fillText('T = ' + temp.toFixed(1) + ' \u00b0C', pieCX, readY + 42);

    ctx.textAlign = 'left';

    t += 0.025;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = 0; drawFrame(); }

  // Sliders
  var heightSlider = document.getElementById('drop-height-slider');
  var heightLabel  = document.getElementById('drop-height-label');
  var massSlider   = document.getElementById('mass-slider');
  var massLabel    = document.getElementById('mass-label');

  if (heightSlider) {
    heightSlider.addEventListener('input', function () {
      dropHeight = parseFloat(heightSlider.value);
      if (heightLabel) heightLabel.textContent = dropHeight.toFixed(1) + ' m';
      t = 0; // restart drop from top
      if (!running) drawStatic();
    });
  }
  if (massSlider) {
    massSlider.addEventListener('input', function () {
      mass = parseFloat(massSlider.value);
      if (massLabel) massLabel.textContent = mass.toFixed(1) + ' kg';
      t = 0;
      if (!running) drawStatic();
    });
  }

  resize();
  window.addEventListener('resize', function () {
    resize();
    if (!running) drawStatic();
  });

  window.SimAPI = {
    start:   function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause:   function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset:   function () { window.SimAPI.pause(); t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
