/* sim.js — 040 Nuclear Fission: chain reaction, slowed for visibility — teaser */
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
  var COLOR = '#c87050';

  var nuclei = [];
  var neutrons = [];
  var countdown = 0; /* frames before next reset fires neutron */

  function resetScene() {
    nuclei = [{ x: W/2, y: H/2, split: false, r: 22, armed: true, gen: 0 }];
    neutrons = [];
    countdown = 60; /* 1s pause before neutron fires */
  }
  resetScene();

  function spawnNeutron() {
    neutrons = [{ x: W * 0.06, y: H / 2, vx: 1.4, vy: 0 }];
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.05)';
    ctx.fillRect(0, 0, W, H);

    /* Countdown before firing */
    if (countdown > 0) {
      countdown--;
      if (countdown === 0) spawnNeutron();
    }

    /* Arm daughters after delay */
    nuclei.forEach(function (nuc) {
      if (!nuc.armed) {
        nuc.armTimer = (nuc.armTimer || 0) + 1;
        if (nuc.armTimer >= 25) nuc.armed = true;
      }
    });

    /* Move neutrons */
    neutrons.forEach(function (n) {
      if (n.vx === 0 && n.vy === 0) return;
      n.x += n.vx;
      n.y += n.vy;

      nuclei.forEach(function (nuc) {
        if (nuc.split || !nuc.armed) return;
        var dx = n.x - nuc.x, dy = n.y - nuc.y;
        if (dx * dx + dy * dy < nuc.r * nuc.r) {
          nuc.split = true;
          n.vx = 0; n.vy = 0;
          /* Spawn daughters */
          var count = nuc.gen === 0 ? 4 : 2;
          for (var i = 0; i < count; i++) {
            var a = (Math.PI * 2 / count) * i + (nuc.gen * 0.5);
            var dist = nuc.r * 3.2;
            nuclei.push({ x: nuc.x + Math.cos(a) * dist, y: nuc.y + Math.sin(a) * dist,
              split: false, r: nuc.gen === 0 ? 14 : 9,
              armed: false, armTimer: 0, gen: nuc.gen + 1 });
            neutrons.push({ x: nuc.x, y: nuc.y,
              vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2 });
          }
        }
      });
    });

    /* Draw nuclei */
    nuclei.forEach(function (nuc) {
      ctx.beginPath();
      ctx.arc(nuc.x, nuc.y, nuc.r, 0, Math.PI * 2);
      ctx.fillStyle = nuc.split ? 'rgba(200,112,80,0.25)' : (nuc.armed ? 'rgba(200,112,80,0.80)' : 'rgba(200,112,80,0.45)');
      ctx.fill();
      ctx.strokeStyle = COLOR;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    /* Draw neutrons */
    neutrons.forEach(function (n) {
      if (n.vx === 0 && n.vy === 0) return;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,220,80,0.95)';
      ctx.fill();
    });

    /* Label */
    ctx.fillStyle = 'rgba(200,112,80,0.75)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('U-235 + n → fragments + 2–3n + energy', W / 2, H * 0.06);
    ctx.textAlign = 'left';

    /* Reset when chain is done */
    var allSplit = nuclei.length > 1 && nuclei.every(function (n) { return n.split; });
    var allGone = neutrons.length > 0 && neutrons.every(function (n) {
      return (n.vx === 0 && n.vy === 0) || n.x > W + 20 || n.x < -20 || n.y > H + 20 || n.y < -20;
    });
    if (nuclei.length > 15 || (allSplit && allGone)) {
      resetScene();
    }

    t += 0.016;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() {
    resetScene();
    spawnNeutron();
    t = 0;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,112,80,0.05)';
    ctx.fillRect(0, 0, W, H);
    /* Draw initial state: one nucleus at center, neutron at left */
    ctx.beginPath();
    ctx.arc(W/2, H/2, 22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,112,80,0.80)';
    ctx.fill();
    ctx.strokeStyle = COLOR; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath();
    ctx.arc(W * 0.06, H / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,80,0.95)';
    ctx.fill();
    ctx.fillStyle = 'rgba(200,112,80,0.75)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('U-235 + n → fragments + 2–3n + energy', W / 2, H * 0.06);
    ctx.textAlign = 'left';
  }

  window.SimAPI = {
    start:   function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause:   function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset:   function () { window.SimAPI.pause(); resetScene(); t = 0; drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
