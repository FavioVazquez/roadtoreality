/* sim.js — 033 Bohr: electron orbits with photon emission on transition — teaser */
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
  var COLOR = '#a05cc8';

  var cx = W * 0.45, cy = H / 2;
  var ORBITS = [55, 90, 125];
  var ORBIT_PERIOD = [3, 6, 10];
  var electronOrbit = 2; /* start on outer orbit */
  var transitionTimer = 0;
  var TRANSITION_INTERVAL = 180;
  var photon = null;

  function orbitColors() { return ['rgba(160,92,200,0.9)', 'rgba(82,133,200,0.9)', 'rgba(82,200,200,0.9)']; }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(160,92,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Nucleus */
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,80,80,0.9)';
    ctx.fill();

    /* Orbit rings */
    ORBITS.forEach(function(r, i) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(160,92,200,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    /* Electron */
    var eAngle = t / ORBIT_PERIOD[electronOrbit];
    var eR = ORBITS[electronOrbit];
    var ex = cx + Math.cos(eAngle) * eR;
    var ey = cy + Math.sin(eAngle) * eR;
    ctx.beginPath();
    ctx.arc(ex, ey, 7, 0, Math.PI * 2);
    ctx.fillStyle = orbitColors()[electronOrbit];
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('e⁻', ex, ey + 3);
    ctx.textAlign = 'left';

    /* Photon */
    if (photon) {
      photon.x += photon.vx;
      photon.y += photon.vy;
      ctx.beginPath();
      ctx.arc(photon.x, photon.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = photon.color;
      ctx.fill();
      if (photon.x > W || photon.x < 0 || photon.y > H || photon.y < 0) photon = null;
    }

    /* Transition logic */
    transitionTimer++;
    if (transitionTimer > TRANSITION_INTERVAL && !photon) {
      transitionTimer = 0;
      if (electronOrbit > 0) {
        var targetOrbit = electronOrbit - 1;
        var colors = ['rgba(255,100,100,0.9)', 'rgba(100,100,255,0.9)', 'rgba(100,255,200,0.9)'];
        photon = {
          x: ex, y: ey,
          vx: (ex - cx) / ORBITS[electronOrbit] * 4,
          vy: (ey - cy) / ORBITS[electronOrbit] * 4,
          color: colors[electronOrbit]
        };
        electronOrbit = targetOrbit;
      } else {
        electronOrbit = 2;
      }
    }

    ctx.fillStyle = 'rgba(160,92,200,0.6)';
    ctx.font = '11px monospace';
    ctx.fillText('n=' + (electronOrbit + 1), cx + ORBITS[electronOrbit] + 4, cy - 4);

    t += 0.04;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = 0; drawFrame(); }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); t = 0; electronOrbit = 2; photon = null; transitionTimer = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
