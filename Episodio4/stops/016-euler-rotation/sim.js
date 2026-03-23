/* sim.js — 016 Euler: rotating rigid bodies — τ=Iα demo with live ω graph */
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

  var W, H, splitX;
  var raf = null;
  var running = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Physics params (wired to sliders)
  var torque = 5.0;  // N·m
  var mass   = 2.0;  // kg
  var R      = 0.50; // m — radius for disk & ring  (larger → visible divergence)
  var L      = 1.00; // m — length for rod

  // Simulation time
  var simTime = 0;
  var OMEGA_MAX = 20.0; // rad/s cap
  var DT = 0.016;

  // Shapes: name, formula, moment-of-inertia function, color, angle, omega
  var COLORS = ['#5285c8', '#c87052', '#52c882'];
  var shapes = [
    { label: 'Disk',  formula: 'I = ½mr²', color: COLORS[0], angle: 0, omega: 0, history: [] },
    { label: 'Rod',   formula: 'I = ⅓mL²', color: COLORS[1], angle: 0, omega: 0, history: [] },
    { label: 'Ring',  formula: 'I = mr²',   color: COLORS[2], angle: 0, omega: 0, history: [] }
  ];

  function getI(idx) {
    if (idx === 0) return 0.5 * mass * R * R;         // disk
    if (idx === 1) return (1 / 3) * mass * L * L;     // rod (about end → use (1/12)mL² about center)
    return mass * R * R;                               // ring
  }

  function resize() {
    W = mount.clientWidth  || 680;
    H = mount.clientHeight || 360;
    canvas.width  = W;
    canvas.height = H;
    splitX = Math.floor(W * 0.52);
    // reposition shape centers
    shapes[0].cx = Math.floor(splitX * 0.22);
    shapes[1].cx = Math.floor(splitX * 0.50);
    shapes[2].cx = Math.floor(splitX * 0.78);
    shapes.forEach(function(s) { s.cy = Math.floor(H * 0.48); });
  }

  // ---- Drawing helpers ----
  var SHAPE_R = 38;

  function drawDisk(s) {
    ctx.save();
    ctx.translate(s.cx, s.cy);
    ctx.rotate(s.angle);
    ctx.beginPath();
    ctx.arc(0, 0, SHAPE_R, 0, Math.PI * 2);
    ctx.fillStyle = s.color.replace(')', ',0.18)').replace('rgb', 'rgba');
    ctx.fill();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    // bright spoke so rotation is visible
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(SHAPE_R - 2, 0);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawRod(s) {
    ctx.save();
    ctx.translate(s.cx, s.cy);
    ctx.rotate(s.angle);
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-SHAPE_R, 0);
    ctx.lineTo(SHAPE_R, 0);
    ctx.stroke();
    ctx.fillStyle = s.color;
    ctx.beginPath(); ctx.arc(-SHAPE_R, 0, 7, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( SHAPE_R, 0, 7, 0, Math.PI*2); ctx.fill();
    // pivot dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawRing(s) {
    ctx.save();
    ctx.translate(s.cx, s.cy);
    ctx.rotate(s.angle);
    ctx.beginPath();
    ctx.arc(0, 0, SHAPE_R, 0, Math.PI * 2);
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 8;
    ctx.stroke();
    // spoke
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(SHAPE_R - 4, 0);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawShapes() {
    var panelBg = 'rgba(255,255,255,0.03)';
    ctx.fillStyle = panelBg;
    ctx.fillRect(0, 0, splitX, H);

    shapes.forEach(function(s, i) {
      if (i === 0) drawDisk(s);
      else if (i === 1) drawRod(s);
      else drawRing(s);

      // label below
      ctx.fillStyle = s.color;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.label, s.cx, s.cy + SHAPE_R + 18);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '10px monospace';
      ctx.fillText(s.formula, s.cx, s.cy + SHAPE_R + 32);

      // ω readout
      ctx.fillStyle = s.color;
      ctx.font = '11px monospace';
      ctx.fillText('ω ' + s.omega.toFixed(1) + ' r/s', s.cx, s.cy + SHAPE_R + 46);
    });

    // torque label
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('τ = ' + torque.toFixed(1) + ' N·m applied equally', 8, H - 8);
  }

  // ---- Graph panel ----
  var MAX_HISTORY = 300; // samples

  function drawGraph() {
    var gx = splitX + 10;
    var gy = 28;
    var gw = W - splitX - 18;
    var gh = H - 56;

    // background
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(splitX, 0, W - splitX, H);

    // border
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gx, gy, gw, gh);

    // axes labels
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('time →', gx + gw / 2, gy + gh + 14);

    ctx.save();
    ctx.translate(gx - 12, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('ω (rad/s)', 0, 0);
    ctx.restore();

    // panel title
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Angular Velocity over Time', gx, gy - 8);

    // y-axis: OMEGA_MAX
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(OMEGA_MAX.toFixed(0), gx - 2, gy + 4);
    ctx.fillText('0', gx - 2, gy + gh);

    // grid line at half
    ctx.beginPath();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.moveTo(gx, gy + gh / 2);
    ctx.lineTo(gx + gw, gy + gh / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // draw history lines for each shape
    shapes.forEach(function(s) {
      if (s.history.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      for (var k = 0; k < s.history.length; k++) {
        var px = gx + (k / (MAX_HISTORY - 1)) * gw;
        var py = gy + gh - (s.history[k] / OMEGA_MAX) * gh;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // legend dot + label on right edge
      if (s.history.length > 0) {
        var lastY = gy + gh - (s.history[s.history.length - 1] / OMEGA_MAX) * gh;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(gx + gw, lastY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // legend box top-left of graph
    shapes.forEach(function(s, i) {
      var lx = gx + 6;
      var ly = gy + 8 + i * 16;
      ctx.fillStyle = s.color;
      ctx.fillRect(lx, ly, 14, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(s.label, lx + 18, ly + 4);
    });
  }

  // ---- Physics step ----
  function stepPhysics() {
    simTime += DT;
    shapes.forEach(function(s, i) {
      var I = getI(i);
      var alpha = torque / I;
      s.omega = Math.min(s.omega + alpha * DT, OMEGA_MAX);
      s.angle += s.omega * DT;
      s.history.push(s.omega);
      if (s.history.length > MAX_HISTORY) s.history.shift();
    });
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    drawShapes();
    drawGraph();

    // divider
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, H);
    ctx.stroke();

    if (running && !reduced) {
      stepPhysics();
      raf = requestAnimationFrame(drawFrame);
    }
  }

  function drawStatic() {
    shapes.forEach(function(s) { s.angle = 0.3; });
    ctx.clearRect(0, 0, W, H);
    drawShapes();
    drawGraph();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, H);
    ctx.stroke();
    shapes.forEach(function(s) { s.angle = 0; });
  }

  // ---- Slider wiring ----
  var torqueSlider = document.getElementById('torque-slider');
  var torqueLabel  = document.getElementById('torque-label');
  var massSlider   = document.getElementById('mass-slider');
  var massLabel    = document.getElementById('mass-label');

  function resetState() {
    simTime = 0;
    shapes.forEach(function(s) { s.omega = 0; s.angle = 0; s.history = []; });
  }

  if (torqueSlider) {
    torqueSlider.addEventListener('input', function() {
      torque = parseFloat(torqueSlider.value);
      if (torqueLabel) torqueLabel.textContent = torque.toFixed(1) + ' N·m';
      resetState();
      if (!running) drawStatic();
    });
  }
  if (massSlider) {
    massSlider.addEventListener('input', function() {
      mass = parseFloat(massSlider.value);
      if (massLabel) massLabel.textContent = mass.toFixed(1) + ' kg';
      resetState();
      if (!running) drawStatic();
    });
  }

  // ---- Resize ----
  resize();
  window.addEventListener('resize', function() {
    resize();
    if (!running) drawStatic();
  });

  // ---- SimAPI ----
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
      simTime = 0;
      shapes.forEach(function(s) { s.omega = 0; s.angle = 0; s.history = []; });
      drawStatic();
    },
    destroy: function () {
      window.SimAPI.pause();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };

  drawStatic();
}());
