/* sim.js — 018 Volta: battery circuit with animated current — teaser */
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

  /* Circuit corners */
  var batX = W * 0.2, bulbX = W * 0.75, topY = H * 0.25, botY = H * 0.75;
  var path = [
    {x: batX,  y: topY},
    {x: bulbX, y: topY},
    {x: bulbX, y: botY},
    {x: batX,  y: botY},
    {x: batX,  y: topY}
  ];

  /* Current dots */
  var dots = [];
  for (var i = 0; i < 12; i++) dots.push({ progress: i / 12 });

  function pathPos(progress) {
    var totalLen = 0;
    var segs = [];
    for (var i = 0; i < path.length - 1; i++) {
      var dx = path[i+1].x - path[i].x;
      var dy = path[i+1].y - path[i].y;
      var len = Math.sqrt(dx*dx + dy*dy);
      segs.push({ len: len }); totalLen += len;
    }
    var target = progress * totalLen;
    var acc = 0;
    for (var j = 0; j < segs.length; j++) {
      if (acc + segs[j].len >= target) {
        var frac = (target - acc) / segs[j].len;
        return { x: path[j].x + frac * (path[j+1].x - path[j].x), y: path[j].y + frac * (path[j+1].y - path[j].y) };
      }
      acc += segs[j].len;
    }
    return path[path.length-1];
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(82,133,200,0.06)';
    ctx.fillRect(0, 0, W, H);

    /* Wires */
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (var i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.strokeStyle = 'rgba(82,133,200,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Battery symbol */
    var bH = 50;
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    for (var k = 0; k < 4; k++) {
      var lineY = topY + 10 + k * 12;
      var thick = k % 2 === 0;
      ctx.lineWidth = thick ? 5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(batX - 14, lineY);
      ctx.lineTo(batX + 14, lineY);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(82,133,200,0.8)';
    ctx.font = '11px monospace';
    ctx.fillText('+', batX + 16, topY + 12);
    ctx.fillText('−', batX + 16, topY + 38);

    /* Bulb */
    ctx.beginPath();
    ctx.arc(bulbX, (topY + botY) / 2, 20, 0, Math.PI * 2);
    var bulbGlow = 0.3 + 0.4 * Math.sin(t * 3);
    ctx.fillStyle = 'rgba(255,220,80,' + bulbGlow + ')';
    ctx.fill();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Dots */
    dots.forEach(function(d) {
      d.progress = (d.progress + 0.004) % 1;
      var pos = pathPos(d.progress);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,220,80,0.9)';
      ctx.fill();
    });

    t += 0.025;
    if (running && !reduced) raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() { t = 0; drawFrame(); }

  window.SimAPI = {
    start: function () { if (running) return; running = true; if (reduced) { drawStatic(); return; } raf = requestAnimationFrame(drawFrame); },
    pause: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    reset: function () { window.SimAPI.pause(); t = 0; dots.forEach(function(d,i){ d.progress = i/12; }); drawStatic(); },
    destroy: function () { window.SimAPI.pause(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  };

  drawStatic();
}());
