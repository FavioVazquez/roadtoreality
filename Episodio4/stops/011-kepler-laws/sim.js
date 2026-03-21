/* ============================================================
   sim.js — Stop 011: Kepler's Laws
   RK4 orbital mechanics. Elliptical orbit with adjustable
   eccentricity. Highlights equal-areas (2nd law) with
   shaded triangular swept area segments.
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H;
  var running = false;
  var rafId = null;
  var lastTs = null;

  /* Orbital parameters */
  var ecc = 0.4;          /* eccentricity 0..0.9 */
  var highlightLaw = 2;   /* 1, 2, or 3 */

  /* Canonical semi-major axis in "simulation units" */
  var A = 1.0; /* semi-major axis */
  var GM = 4 * Math.PI * Math.PI * A * A * A; /* gives period T=1 for A=1 */

  /* State: position & velocity in 2D (x,y relative to Sun at focus) */
  var x, y, vx, vy;
  var t = 0;

  /* Equal-area triangles */
  var areas = [];         /* [{pts:[{x,y}]}] each is a swept segment */
  var currentSeg = [];    /* accumulating points for current segment */
  var segDuration = 0;
  var SEG_DURATION = 0.08; /* fraction of orbital period per segment */
  var NUM_SEGS = 5;
  var AREA_COLORS = [
    'oklch(0.72 0.15 145 / 0.25)',
    'oklch(0.80 0.17 82  / 0.25)',
    'oklch(0.68 0.20 310 / 0.25)',
    'oklch(0.72 0.12 60  / 0.25)',
    'oklch(0.65 0.18 240 / 0.25)'
  ];

  function initOrbit() {
    /* Start at perihelion: x = a(1-e), y = 0 */
    var b = A * Math.sqrt(1 - ecc * ecc);
    x  = A * (1 - ecc);
    y  = 0;
    /* Vis-viva velocity at perihelion: v = sqrt(GM(2/r - 1/a)) */
    var r = Math.sqrt(x * x + y * y);
    var v = Math.sqrt(GM * (2 / r - 1 / A));
    vx = 0;
    vy = v; /* perpendicular to radius at perihelion */
    t = 0;
    areas = [];
    currentSeg = [{ x: x, y: y }];
    segDuration = 0;
  }

  /* RK4 step for two-body gravity */
  function rk4Step(dt) {
    function accel(px, py) {
      var r3 = Math.pow(px * px + py * py, 1.5);
      return { ax: -GM * px / r3, ay: -GM * py / r3 };
    }

    var a1 = accel(x, y);
    var k1x = vx, k1y = vy, k1vx = a1.ax, k1vy = a1.ay;

    var a2 = accel(x + 0.5*dt*k1x, y + 0.5*dt*k1y);
    var k2x = vx+0.5*dt*k1vx, k2y = vy+0.5*dt*k1vy, k2vx = a2.ax, k2vy = a2.ay;

    var a3 = accel(x + 0.5*dt*k2x, y + 0.5*dt*k2y);
    var k3x = vx+0.5*dt*k2vx, k3y = vy+0.5*dt*k2vy, k3vx = a3.ax, k3vy = a3.ay;

    var a4 = accel(x + dt*k3x, y + dt*k3y);
    var k4x = vx+dt*k3vx, k4y = vy+dt*k3vy, k4vx = a4.ax, k4vy = a4.ay;

    x  += (dt/6)*(k1x  + 2*k2x  + 2*k3x  + k4x);
    y  += (dt/6)*(k1y  + 2*k2y  + 2*k3y  + k4y);
    vx += (dt/6)*(k1vx + 2*k2vx + 2*k3vx + k4vx);
    vy += (dt/6)*(k1vy + 2*k2vy + 2*k3vy + k4vy);
    t  += dt;
  }

  /* Convert sim coords to canvas coords */
  function scale() {
    return Math.min(W, H) * 0.36;
  }
  function cx() { return W / 2; }
  function cy() { return H / 2 + H * 0.02; }

  function toCanvas(sx, sy) {
    /* Sun is at focus: shift center so Sun appears at focus */
    var focusDx = A * ecc * scale(); /* distance from center to focus in px */
    return {
      x: cx() - focusDx + sx * scale(),
      y: cy() - sy * scale()
    };
  }

  function drawOrbitEllipse() {
    var S  = scale();
    var a  = A * S;
    var b  = A * Math.sqrt(1 - ecc*ecc) * S;
    var focusDx = A * ecc * S;
    var ox = cx() - focusDx; /* ellipse center x */
    var oy = cy();

    ctx.save();
    ctx.strokeStyle = 'oklch(0.30 0.04 285)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.ellipse(ox, oy, a, b, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /* ── 3rd Law: T² ∝ a³ — real planet data ─────────────── */
  var PLANETS = [
    { name: 'Mercury', a: 0.387, T: 0.241 },
    { name: 'Venus',   a: 0.723, T: 0.615 },
    { name: 'Earth',   a: 1.000, T: 1.000 },
    { name: 'Mars',    a: 1.524, T: 1.881 },
    { name: 'Jupiter', a: 5.203, T: 11.86 },
    { name: 'Saturn',  a: 9.537, T: 29.46 },
    { name: 'Uranus',  a: 19.19, T: 84.01 },
    { name: 'Neptune', a: 30.07, T: 164.8 }
  ];

  function drawThirdLaw() {
    if (highlightLaw !== 3) return;

    /* Panel dims — right side, tall enough to breathe */
    var pw = Math.min(W * 0.52, 340);
    var ph = Math.min(H * 0.72, 320);
    var px = W - pw - 12;
    var py = (H - ph) / 2;
    var pad = 44;
    var gx = px + pad, gy = py + 16;
    var gw = pw - pad - 16, gh = ph - 40;

    /* Panel bg */
    ctx.save();
    ctx.fillStyle = 'oklch(0.10 0.025 285 / 0.92)';
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 10);
    ctx.fill();

    /* Title */
    ctx.font = '700 12px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.80 0.17 82)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('3rd Law: T² ∝ a³', px + pw / 2, py + 6);

    /* Axes */
    ctx.strokeStyle = 'oklch(0.35 0.04 285)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh);        /* y */
    ctx.moveTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); /* x */
    ctx.stroke();

    /* Axis labels */
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.50 0.04 285)';
    ctx.textAlign = 'center';
    ctx.fillText('a³  (AU³)', gx + gw / 2, gy + gh + 14);
    ctx.save();
    ctx.translate(gx - 28, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('T²  (yr²)', 0, 0);
    ctx.restore();

    /* Data range: use a³ and T² for each planet */
    var maxA3 = 0, maxT2 = 0;
    for (var i = 0; i < PLANETS.length; i++) {
      var a3 = Math.pow(PLANETS[i].a, 3);
      var t2 = Math.pow(PLANETS[i].T, 2);
      if (a3 > maxA3) maxA3 = a3;
      if (t2 > maxT2) maxT2 = t2;
    }
    maxA3 *= 1.1; maxT2 *= 1.1;

    function mapX(a3) { return gx + (a3 / maxA3) * gw; }
    function mapY(t2) { return gy + gh - (t2 / maxT2) * gh; }

    /* Best-fit line: T² = a³ exactly (Kepler), so draw y=x line scaled */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.80 0.17 82 / 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(mapX(0), mapY(0));
    ctx.lineTo(mapX(maxA3), mapY(maxA3));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* Planet dots + labels */
    var DOT_COLORS = [
      'oklch(0.70 0.10 60)',
      'oklch(0.70 0.12 50)',
      'oklch(0.65 0.18 240)',
      'oklch(0.60 0.15 20)',
      'oklch(0.72 0.15 82)',
      'oklch(0.72 0.10 60)',
      'oklch(0.65 0.12 200)',
      'oklch(0.55 0.15 240)'
    ];
    for (var i = 0; i < PLANETS.length; i++) {
      var p = PLANETS[i];
      var a3 = Math.pow(p.a, 3);
      var t2 = Math.pow(p.T, 2);
      var dx = mapX(a3);
      var dy = mapY(t2);

      ctx.save();
      ctx.fillStyle = DOT_COLORS[i];
      ctx.shadowColor = DOT_COLORS[i];
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(dx, dy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      /* Label: skip crowded inner planets for far-out ones */
      ctx.font = '9px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = DOT_COLORS[i];
      ctx.textAlign = i < 4 ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.name, dx + (i < 4 ? -7 : 7), dy);
      ctx.restore();
    }

    /* Annotation */
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.45 0.04 285)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('All planets fall on T² = a³', gx, gy + gh + 26);

    ctx.restore();
  }

  function drawAreas() {
    if (highlightLaw !== 2) return;

    /* Draw stored area segments */
    for (var i = 0; i < areas.length; i++) {
      var seg = areas[i];
      if (seg.pts.length < 2) continue;
      ctx.save();
      ctx.fillStyle = AREA_COLORS[i % AREA_COLORS.length];
      ctx.beginPath();
      /* Start from Sun */
      var sunC = toCanvas(0, 0);
      ctx.moveTo(sunC.x, sunC.y);
      for (var k = 0; k < seg.pts.length; k++) {
        var pt = toCanvas(seg.pts[k].x, seg.pts[k].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /* Draw current accumulating segment */
    if (currentSeg.length > 1) {
      ctx.save();
      ctx.fillStyle = 'oklch(0.72 0.15 145 / 0.15)';
      ctx.beginPath();
      var sunC = toCanvas(0, 0);
      ctx.moveTo(sunC.x, sunC.y);
      for (var k = 0; k < currentSeg.length; k++) {
        var pt = toCanvas(currentSeg[k].x, currentSeg[k].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'oklch(0.06 0.02 260)';
    ctx.fillRect(0, 0, W, H);

    /* Stars */
    ctx.save();
    ctx.fillStyle = 'oklch(0.65 0 0 / 0.5)';
    for (var s = 0; s < 80; s++) {
      ctx.beginPath();
      ctx.arc(
        ((s * 137.5 * W) % W + W) % W,
        ((s * 83.7  * H) % H + H) % H,
        0.8, 0, Math.PI*2
      );
      ctx.fill();
    }
    ctx.restore();

    drawOrbitEllipse();
    drawAreas();
    drawThirdLaw();

    /* Sun */
    var sunC = toCanvas(0, 0);
    ctx.save();
    ctx.shadowColor = 'oklch(0.90 0.20 82)';
    ctx.shadowBlur  = 28;
    ctx.fillStyle   = 'oklch(0.90 0.20 82)';
    ctx.beginPath();
    ctx.arc(sunC.x, sunC.y, 14, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '700 10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.90 0.20 82)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Sun (focus)', sunC.x, sunC.y + 17);
    ctx.restore();

    /* Perihelion / aphelion labels */
    var perC = toCanvas(A*(1-ecc), 0);
    var aphC = toCanvas(-A*(1+ecc), 0);
    ctx.save();
    ctx.font = '9px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.45 0.04 285)';
    ctx.textAlign = 'center';
    ctx.fillText('Perihelion\n(fastest)', perC.x, perC.y - 14);
    ctx.fillText('Aphelion\n(slowest)', aphC.x, aphC.y - 14);
    ctx.restore();

    /* Planet */
    var pC = toCanvas(x, y);
    var speed = Math.sqrt(vx*vx + vy*vy);
    ctx.save();
    ctx.shadowColor = 'oklch(0.65 0.18 240)';
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = 'oklch(0.65 0.18 240)';
    ctx.beginPath();
    ctx.arc(Math.round(pC.x), Math.round(pC.y), 7, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.65 0.18 240)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Planet', pC.x, pC.y - 10);
    ctx.restore();

    /* Info panel */
    var r = Math.sqrt(x*x + y*y);
    ctx.save();
    ctx.fillStyle = 'oklch(0.12 0.03 285 / 0.85)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 200, 70, 8);
    ctx.fill();
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.60 0.04 285)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Eccentricity: ' + ecc.toFixed(2), 14, 14);
    ctx.fillText('Distance from Sun: ' + r.toFixed(3) + ' AU', 14, 32);
    ctx.fillText('Speed: ' + speed.toFixed(3) + ' AU/yr', 14, 50);
    ctx.restore();
  }

  function update(dt) {
    var substeps = 8;
    var subDt = dt / substeps;
    for (var i = 0; i < substeps; i++) rk4Step(subDt);

    /* Accumulate area segment */
    segDuration += dt;
    currentSeg.push({ x: x, y: y });

    if (segDuration >= SEG_DURATION) {
      areas.push({ pts: currentSeg.slice() });
      if (areas.length > NUM_SEGS) areas.shift();
      currentSeg = [{ x: x, y: y }];
      segDuration = 0;
    }
  }

  /* ── SimAPI ─────────────────────────────────────────────── */
  function start() {
    if (running) return;
    running = true;
    lastTs = null;
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '⏸ Pause'; btn.dataset.state = 'playing'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.add('is-running');
    rafId = requestAnimationFrame(loop);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '▶ Play'; btn.dataset.state = 'paused'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.remove('is-running');
  }

  function reset() {
    pause();
    initOrbit();
    draw();
  }

  function destroy() {
    pause();
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05) * 0.4; /* time scale factor */
    lastTs = ts;
    update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function setup() {
    var mount = document.getElementById('sim-mount');
    if (!mount) return;
    canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    mount.appendChild(canvas);
    ctx = canvas.getContext('2d');

    function resize() {
      var rect = mount.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      W = Math.round(rect.width);
      H = Math.max(420, Math.round(rect.height || 420));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initOrbit();
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    var eccSlider = document.getElementById('ecc-slider');
    var eccVal    = document.getElementById('ecc-val');
    var eccLabels = { 0.0:'0.0 (circular)', 0.2:'0.2 (Earth-like)', 0.4:'0.4 (like Mercury)', 0.6:'0.6 (like comet)', 0.9:'0.9 (extreme)' };
    if (eccSlider) {
      eccSlider.addEventListener('input', function () {
        ecc = parseFloat(this.value);
        if (eccVal) eccVal.textContent = eccLabels[ecc] || ecc.toFixed(2);
        pause();
        initOrbit();
        draw();
      });
    }

    var lawSlider = document.getElementById('law-select');
    var lawVal    = document.getElementById('law-val');
    if (lawSlider) {
      lawSlider.addEventListener('input', function () {
        highlightLaw = parseInt(this.value, 10);
        if (lawVal) lawVal.textContent =
          highlightLaw === 1 ? '1st Law (ellipse)'
        : highlightLaw === 2 ? '2nd Law (equal areas)'
        : '3rd Law (T² ∝ a³)';
        draw();
      });
    }

    initOrbit();
    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}());
