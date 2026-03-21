/* ============================================================
   sim.js — Stop 013: Newton's Universal Gravitation
   Newton's cannon: projectile → orbit as launch speed increases.
   RK4 integration. Units: km for position, km/s for velocity.
   GM = 398600 km³/s²  (exact standard gravitational parameter)
   ============================================================ */
(function () {
  'use strict';

  var canvas, ctx, W, H;
  var running = false;
  var rafId   = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastTs  = null;

  /* Earth parameters (exact) */
  var R   = 6371;          /* km */
  var GM  = 398600;        /* km³/s² */
  var V_ORBITAL = Math.sqrt(GM / R);          /* ~7.905 km/s */
  var V_ESCAPE  = Math.sqrt(2 * GM / R);      /* ~11.18 km/s */

  var launchSpeedKms = 5.0;
  var simSpeedMult   = 1;  /* wall-time multiplier */

  /* Simulation state */
  var x, y, vx, vy, simT;
  var trail   = [];
  var fired   = false;
  var done    = false;
  var outcome = '';   /* 'orbit' | 'escape' | 'landed' */

  /* Cannon is at upper-right, mountain 300 km high */
  var CANNON_ANGLE = -Math.PI * 0.28;
  var MOUNTAIN_H   = 300; /* km */

  /* ── Geometry helpers ─────────────────────────────────── */
  function ep()  { return Math.min(W, H) * 0.30; }
  function cx()  { return W / 2; }
  function cy()  { return H / 2; }
  function k2p(km) { return (km / R) * ep(); }
  function toC(kx, ky) { return { x: cx() + k2p(kx), y: cy() - k2p(ky) }; }

  function cannonKm() {
    var r = R + MOUNTAIN_H;
    return { x: Math.cos(CANNON_ANGLE) * r, y: Math.sin(CANNON_ANGLE) * r };
  }

  /* ── Physics ──────────────────────────────────────────── */
  function accel(px, py) {
    var r2 = px*px + py*py;
    var r  = Math.sqrt(r2);
    var a  = -GM / r2;
    return { ax: a * px / r, ay: a * py / r };
  }

  function initFire() {
    var cp = cannonKm();
    x = cp.x; y = cp.y;
    var angle = Math.atan2(y, x);
    var perp  = angle - Math.PI / 2; /* prograde direction */
    vx = Math.cos(perp) * launchSpeedKms;
    vy = Math.sin(perp) * launchSpeedKms;
    trail   = [];
    simT    = 0;
    fired   = true;
    done    = false;
    outcome = '';
  }

  /* ── Draw ─────────────────────────────────────────────── */
  function drawCannon() {
    var cp = cannonKm();
    var cc = toC(cp.x, cp.y);
    var angle = Math.atan2(cp.y, cp.x); /* outward angle */
    var perp  = angle - Math.PI / 2;    /* prograde / barrel direction */

    ctx.save();
    ctx.translate(cc.x, cc.y);

    /* Mountain mound */
    ctx.fillStyle = 'oklch(0.40 0.05 60)';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    /* Cannon barrel pointing in launch direction */
    ctx.rotate(-perp);  /* canvas y is inverted */
    ctx.fillStyle = 'oklch(0.25 0.03 285)';
    ctx.strokeStyle = 'oklch(0.50 0.05 285)';
    ctx.lineWidth = 1;
    /* Barrel rectangle */
    ctx.beginPath();
    ctx.roundRect(-4, -18, 8, 18, 2);
    ctx.fill();
    ctx.stroke();
    /* Wheel */
    ctx.fillStyle = 'oklch(0.35 0.04 50)';
    ctx.beginPath();
    ctx.arc(0, 3, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'oklch(0.55 0.05 50)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    /* Label */
    var lc = toC(cp.x * 1.08, cp.y * 1.08);
    ctx.save();
    ctx.font = '10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.72 0.12 60)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏔 Cannon', lc.x, lc.y);
    ctx.restore();
  }

  function trailColor() {
    if (outcome === 'orbit')  return 'oklch(0.72 0.15 145)';
    if (outcome === 'escape') return 'oklch(0.80 0.17 82)';
    if (outcome === 'landed') return 'oklch(0.68 0.22 20)';
    /* In-flight: color by speed vs orbital */
    return launchSpeedKms >= V_ESCAPE  ? 'oklch(0.80 0.17 82)'
         : launchSpeedKms >= V_ORBITAL ? 'oklch(0.72 0.15 145)'
         : 'oklch(0.68 0.22 20)';
  }

  function draw() {
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);

    /* Space */
    ctx.fillStyle = 'oklch(0.05 0.02 260)';
    ctx.fillRect(0, 0, W, H);

    /* Stars (deterministic) */
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (var s = 0; s < 120; s++) {
      var sx = ((s * 137.508 + 0.5) % 1) * W;
      var sy = ((s * 0.6180339 + 0.3) % 1) * H;
      ctx.beginPath();
      ctx.arc(sx, sy, s % 3 === 0 ? 1.2 : 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Earth */
    var r = ep();
    var g = ctx.createRadialGradient(cx()-r*0.3, cy()-r*0.3, r*0.05, cx(), cy(), r);
    g.addColorStop(0, 'oklch(0.50 0.20 145)');
    g.addColorStop(0.6,'oklch(0.35 0.15 230)');
    g.addColorStop(1,  'oklch(0.18 0.08 240)');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx(), cy(), r, 0, Math.PI*2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'oklch(0.55 0.18 210 / 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    /* "Earth" label */
    ctx.save();
    ctx.font = '700 12px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'oklch(0.65 0.15 220)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Earth', cx(), cy());
    ctx.restore();

    /* Orbit guide ring */
    ctx.save();
    ctx.strokeStyle = 'oklch(0.72 0.15 145 / 0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 10]);
    ctx.beginPath();
    ctx.arc(cx(), cy(), r + k2p(MOUNTAIN_H), 0, Math.PI*2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* Trail */
    if (trail.length > 1) {
      ctx.save();
      ctx.strokeStyle = trailColor();
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      for (var i = 0; i < trail.length; i++) {
        var tc = toC(trail[i].x, trail[i].y);
        if (i === 0) ctx.moveTo(tc.x, tc.y); else ctx.lineTo(tc.x, tc.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    /* Cannon — always visible */
    drawCannon();

    /* Ball in flight */
    if (fired && !done) {
      var bc = toC(x, y);
      ctx.save();
      ctx.shadowColor = 'oklch(0.85 0.12 60)';
      ctx.shadowBlur  = 10;
      ctx.fillStyle   = 'oklch(0.85 0.12 60)';
      ctx.beginPath();
      ctx.arc(Math.round(bc.x), Math.round(bc.y), 5, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    /* Outcome banner */
    if (outcome) {
      var bannerColors = { orbit: 'oklch(0.72 0.15 145)', escape: 'oklch(0.80 0.17 82)', landed: 'oklch(0.68 0.22 20)' };
      var bannerMsgs   = {
        orbit:  '↻ Orbiting Earth!  v ≈ ' + V_ORBITAL.toFixed(1) + ' km/s needed',
        escape: '↗ Escaped Earth gravity!  v > ' + V_ESCAPE.toFixed(1) + ' km/s',
        landed: '↓ Landed back on Earth.  Increase speed to orbit.'
      };
      ctx.save();
      ctx.font = '700 13px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = bannerColors[outcome];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(bannerMsgs[outcome], W/2, 94);
      ctx.restore();
    }

    /* Info panel */
    ctx.save();
    ctx.fillStyle = 'oklch(0.12 0.03 285 / 0.88)';
    ctx.beginPath();
    ctx.roundRect(10, 12, 210, 72, 8);
    ctx.fill();
    ctx.font = '12px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    var col = launchSpeedKms >= V_ESCAPE  ? 'oklch(0.80 0.17 82)'
            : launchSpeedKms >= V_ORBITAL ? 'oklch(0.72 0.15 145)'
            : 'oklch(0.68 0.22 20)';
    ctx.fillStyle = col;
    ctx.fillText('Launch: ' + launchSpeedKms.toFixed(1) + ' km/s', 18, 18);

    ctx.fillStyle = launchSpeedKms >= V_ORBITAL ? 'oklch(0.72 0.15 145)' : 'oklch(0.45 0.04 285)';
    ctx.fillText('Orbital: ~' + V_ORBITAL.toFixed(1) + ' km/s', 18, 36);
    ctx.fillStyle = launchSpeedKms >= V_ESCAPE ? 'oklch(0.80 0.17 82)' : 'oklch(0.45 0.04 285)';
    ctx.fillText('Escape: ~' + V_ESCAPE.toFixed(1) + ' km/s', 18, 54);
    ctx.restore();
  }

  /* ── SimAPI ─────────────────────────────────────────────── */
  function start() {
    if (running) { pause(); return; }
    initFire();
    running = true;
    lastTs  = null;
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '⏸ Pause'; btn.dataset.state = 'playing'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.add('is-running');
    if (!reducedMotion) rafId = requestAnimationFrame(loop);
    else draw();
  }

  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    var btn = document.getElementById('sim-play-btn');
    if (btn) { btn.textContent = '▶ Fire!'; btn.dataset.state = 'paused'; }
    var dot = document.querySelector('.sim-caption__dot');
    if (dot) dot.classList.remove('is-running');
  }

  function reset() {
    pause();
    fired = false; done = false; trail = []; outcome = '';
    draw();
  }

  function destroy() {
    pause();
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  window.SimAPI = { start: start, pause: pause, reset: reset, destroy: destroy };

  /* ── Loop ───────────────────────────────────────────────── */
  var STEPS_PER_FRAME = 40;   /* RK4 sub-steps — keep energy stable */
  var SIM_SECS_PER_WALL_SEC = 200; /* at 1× speed, 200 sim-seconds per real second */

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var wallDt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    var simDt      = wallDt * SIM_SECS_PER_WALL_SEC * simSpeedMult;
    var stepDt     = simDt / STEPS_PER_FRAME;

    for (var i = 0; i < STEPS_PER_FRAME; i++) {
      if (done) break;

      /* Proper RK4 step */
      var a1 = accel(x, y);
      var k1vx=a1.ax, k1vy=a1.ay, k1x=vx, k1y=vy;
      var a2 = accel(x+0.5*stepDt*k1x, y+0.5*stepDt*k1y);
      var k2vx=a2.ax, k2vy=a2.ay, k2x=vx+0.5*stepDt*k1vx, k2y=vy+0.5*stepDt*k1vy;
      var a3 = accel(x+0.5*stepDt*k2x, y+0.5*stepDt*k2y);
      var k3vx=a3.ax, k3vy=a3.ay, k3x=vx+0.5*stepDt*k2vx, k3y=vy+0.5*stepDt*k2vy;
      var a4 = accel(x+stepDt*k3x, y+stepDt*k3y);
      var k4vx=a4.ax, k4vy=a4.ay, k4x=vx+stepDt*k3vx, k4y=vy+stepDt*k3vy;

      x  += (stepDt/6)*(k1x  + 2*k2x  + 2*k3x  + k4x);
      y  += (stepDt/6)*(k1y  + 2*k2y  + 2*k3y  + k4y);
      vx += (stepDt/6)*(k1vx + 2*k2vx + 2*k3vx + k4vx);
      vy += (stepDt/6)*(k1vy + 2*k2vy + 2*k3vy + k4vy);
      simT += stepDt;

      /* Record trail — limit to 1200 pts */
      if (i % 2 === 0) {
        trail.push({ x: x, y: y });
        if (trail.length > 1200) trail.shift();
      }

      var rr = Math.sqrt(x*x + y*y);

      if (rr <= R + 5) {
        done = true; outcome = 'landed'; running = false;
        var dot = document.querySelector('.sim-caption__dot');
        if (dot) dot.classList.remove('is-running');
        break;
      }
      if (rr > R * 20) {
        done = true; outcome = 'escape'; running = false;
        var dot = document.querySelector('.sim-caption__dot');
        if (dot) dot.classList.remove('is-running');
        break;
      }
      /* Orbit detected: completed ~1 orbit period (T ≈ 2π√(r³/GM)) */
      var T_orbit = 2 * Math.PI * Math.sqrt(rr*rr*rr / GM);
      if (simT > T_orbit * 0.9 && !outcome) {
        outcome = 'orbit';
      }
      /* Hard stop after 3 orbits to keep it tidy */
      if (simT > T_orbit * 3 && outcome === 'orbit') {
        done = true; running = false;
        var dot = document.querySelector('.sim-caption__dot');
        if (dot) dot.classList.remove('is-running');
        break;
      }
    }

    draw();
    if (running) rafId = requestAnimationFrame(loop);
  }

  /* ── Setup ──────────────────────────────────────────────── */
  function setup() {
    var mount = document.getElementById('sim-mount');
    if (!mount) return;
    canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    mount.appendChild(canvas);
    ctx = canvas.getContext('2d');

    function resize() {
      var rect = mount.getBoundingClientRect();
      var dpr  = window.devicePixelRatio || 1;
      W = Math.round(rect.width);
      H = Math.max(420, Math.round(rect.height || 420));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    requestAnimationFrame(function () { resize(); });
    window.addEventListener('resize', resize);

    var sSlider = document.getElementById('speed-slider-cannon');
    var sVal    = document.getElementById('speed-val-cannon');
    if (sSlider) {
      sSlider.addEventListener('input', function () {
        launchSpeedKms = parseFloat(this.value);
        if (sVal) sVal.textContent = launchSpeedKms.toFixed(1) + ' km/s';
        if (!running) { fired = false; trail = []; outcome = ''; done = false; draw(); }
      });
    }

    var dSlider = document.getElementById('sim-speed-dial');
    var dVal    = document.getElementById('sim-speed-val');
    if (dSlider) {
      dSlider.addEventListener('input', function () {
        simSpeedMult = parseInt(this.value, 10);
        if (dVal) dVal.textContent = simSpeedMult + '×';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}());
