/* ============================================================
   journey.js — Landing page journey map: the 50 stops on one
   road through time, lit by the visitor's progress
   How Physics Works
   ------------------------------------------------------------
   Data rules
   - position: stop.year on a piecewise time axis. Each era band
     gets road length in proportion to its number of stops, and
     the empty stretch between 200 CE and 1500 CE is compressed
     into a short dashed section with break marks.
   - colour: stop.era (so a stop can sit in a neighbouring band
     when its year falls there).
   - stops that would overlap are lifted off the road into lanes
     above and below it; a thin stem marks their exact year.
   ============================================================ */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var root = document.getElementById('journey-map');
  if (!root || !window.fetch) return;

  var ERA_NAMES = {
    ancient: 'Antiquity',
    revolution: 'Scientific Revolution',
    classical: 'Classical Physics',
    modern: 'Modern Revolution',
    contemporary: 'Contemporary'
  };
  var ERA_LONG = {
    ancient: 'Antiquity & the Middle Ages',
    revolution: 'Scientific Revolution',
    classical: 'Classical Physics',
    modern: 'The Modern Revolution',
    contemporary: 'Contemporary Physics'
  };

  /* Bands of the road, by year. `gap` = compressed stretch. */
  var SEGMENTS = [
    { from: -640, to: 200,  era: 'ancient',      ticks: [-600, -300, 1] },
    { from: 200,  to: 1500, gap: true },
    { from: 1500, to: 1700, era: 'revolution',   ticks: [1550, 1600, 1650] },
    { from: 1700, to: 1895, era: 'classical',    ticks: [1750, 1800, 1850] },
    { from: 1895, to: 1941, era: 'modern',       ticks: [1900, 1920] },
    { from: 1941, to: 2031, era: 'contemporary', ticks: [1950, 1975, 2000, 2025] }
  ];

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var stops = [];
  var nodes = [];          /* laid-out nodes, in stop order */
  var geo = null;          /* current geometry */
  var els = {};
  var pinned = null;       /* node pinned by a touch tap */
  var activeNode = null;
  var lastWidth = 0;

  /* ── Helpers ─────────────────────────────────────────── */
  function el(name, attrs, parent) {
    var e = document.createElementNS(SVGNS, name);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, cls, parent, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function pad3(n) { return String(n).padStart(3, '0'); }
  function yearText(y) {
    if (y < 0) return -y + ' BCE';
    if (y < 1000) return y + ' CE';
    return String(y);
  }
  function stopHref(s) { return 'stops/' + s.id + '/index.html'; }

  function visitedSet() {
    var set = {};
    try {
      if (window.PhysicsProgress) {
        window.PhysicsProgress.getAllVisited().forEach(function (id) { set[id] = true; });
      }
    } catch (e) { /* storage unavailable */ }
    return set;
  }

  /* ── Time axis ───────────────────────────────────────── */
  function segmentWeights() {
    return SEGMENTS.map(function (seg) {
      if (seg.gap) return 2.6;
      var n = stops.filter(function (s) { return s.year >= seg.from && s.year < seg.to; }).length;
      return n + 1.5;
    });
  }

  function makeScale(x0, x1) {
    var w = segmentWeights();
    var total = w.reduce(function (a, b) { return a + b; }, 0);
    var acc = x0, bounds = [];
    SEGMENTS.forEach(function (seg, i) {
      var len = (x1 - x0) * w[i] / total;
      bounds.push({ seg: seg, a: acc, b: acc + len });
      acc += len;
    });
    function x(year) {
      for (var i = 0; i < bounds.length; i++) {
        var B = bounds[i];
        if (year < B.seg.to || i === bounds.length - 1) {
          var t = (year - B.seg.from) / (B.seg.to - B.seg.from);
          return B.a + Math.max(0, Math.min(1, t)) * (B.b - B.a);
        }
      }
      return x1;
    }
    return { x: x, bounds: bounds };
  }

  /* Place nodes on lanes: 0 on the road, then -1, +1, -2, +2 … */
  function swarm(scale, gap, maxLanes) {
    var order = stops.map(function (s) { return { s: s, x: scale.x(s.year) }; });
    order.sort(function (a, b) { return a.x - b.x || a.s.order - b.s.order; });
    var lanes = {};
    var worst = 0, ok = true;
    order.forEach(function (n) {
      var cand = [0];
      for (var k = 1; k <= maxLanes; k++) cand.push(-k, k);
      var chosen = null;
      for (var i = 0; i < cand.length; i++) {
        var L = lanes[cand[i]] || [];
        var free = L.every(function (px) { return Math.abs(px - n.x) >= gap; });
        if (free) { chosen = cand[i]; break; }
      }
      if (chosen === null) { ok = false; chosen = 0; }
      (lanes[chosen] = lanes[chosen] || []).push(n.x);
      n.lane = chosen;
      worst = Math.max(worst, Math.abs(chosen));
    });
    return { ok: ok, nodes: order, worst: worst };
  }

  /* ── Geometry for the current width ──────────────────── */
  function computeGeometry(width, compact) {
    var g = compact
      ? { compact: true, r: 7, maxLanes: 2, padX: 30, amp: 11 }
      : { compact: false, r: 6.5, maxLanes: 2, padX: 24, amp: 13 };
    var L = width, result = null;
    if (compact) {
      /* phone: generous spacing, the road scrolls sideways */
      g.gap = 42; g.laneGap = 40;
      L = Math.max(width, 1400);
      for (var i = 0; i < 40; i++) {
        result = swarm(makeScale(g.padX, L - g.padX), g.gap, g.maxLanes);
        if (result.ok) break;
        L = Math.round(L * 1.06);
      }
    } else {
      /* wide screens: shrink the spacing a little before ever scrolling */
      var gaps = [28, 26, 24, 22, 20];
      for (var j = 0; j < gaps.length && !(result && result.ok); j++) {
        g.gap = gaps[j];
        result = swarm(makeScale(g.padX, L - g.padX), g.gap, g.maxLanes);
      }
      for (var k = 0; k < 40 && !result.ok; k++) {
        L = Math.round(L * 1.06);
        result = swarm(makeScale(g.padX, L - g.padX), g.gap, g.maxLanes);
      }
      g.laneGap = Math.round(g.gap * 0.86);
      g.r = g.gap >= 26 ? 6.5 : 5.5;
    }
    g.width = L;
    g.scale = makeScale(g.padX, L - g.padX);
    g.labelH = 46;
    g.roadY = g.labelH + g.maxLanes * g.laneGap + 12;
    g.axisY = g.roadY + g.maxLanes * g.laneGap + 24;
    g.height = g.axisY + 30;
    g.period = compact ? 560 : Math.max(460, L / 2.3);
    g.layout = result.nodes;
    return g;
  }

  function roadY(g, x) {
    return g.roadY + g.amp * Math.sin((x / g.period) * Math.PI * 2 - 0.6);
  }
  function roadSlope(g, x) {
    return g.amp * Math.cos((x / g.period) * Math.PI * 2 - 0.6) * (Math.PI * 2 / g.period);
  }
  function roadPath(g, a, b) {
    var d = '', step = 6;
    for (var x = a; x < b + step; x += step) {
      var xx = Math.min(x, b);
      d += (d ? ' L' : 'M') + xx.toFixed(1) + ',' + roadY(g, xx).toFixed(1);
      if (xx === b) break;
    }
    return d;
  }

  /* ── Build the static frame (once) ───────────────────── */
  function buildFrame() {
    root.innerHTML = '';
    root.classList.add('journey');

    var head = h('div', 'journey__head', root);
    var titleWrap = h('div', 'journey__titles', head);
    h('p', 'journey__eyebrow', titleWrap, 'The road through time');
    var title = h('h2', 'journey__title', titleWrap);
    title.id = 'journey-title';
    els.count = title;

    var side = h('div', 'journey__side', head);
    els.cta = h('a', 'journey__cta', side);

    var skip = h('a', 'journey__skip', root, 'Skip the 50 stops on the map');
    skip.href = '#era-sections';

    var stage = h('div', 'journey__stage', root);
    els.stage = stage;
    var scroller = h('div', 'journey__scroller', stage);
    els.scroller = scroller;

    var svg = el('svg', {
      class: 'journey__svg',
      role: 'group',
      tabindex: '-1',
      'aria-label': 'Journey map: the 50 stops placed on a road from 600 BCE to today'
    }, scroller);
    els.svg = svg;

    els.card = h('div', 'journey__card', stage);
    els.card.setAttribute('aria-hidden', 'true');

    var foot = h('div', 'journey__foot', root);
    var note = h('p', 'journey__note', foot);
    h('span', 'journey__hint', note, 'Swipe along the road. ');
    note.appendChild(document.createTextNode(
      'Years are to scale within each era, not across eras: each era gets room for its stops, ' +
      'and the dashed stretch compresses about 1,300 years. Stems mark a stop’s exact year ' +
      'when several share it.'));
    var legend = h('ul', 'journey__legend', foot);
    legend.setAttribute('aria-hidden', 'true');
    [['is-visited', 'Visited'], ['', 'Not yet'], ['is-next', 'Next']].forEach(function (it) {
      var li = h('li', 'journey__legend-item ' + it[0], legend);
      h('span', 'journey__legend-dot', li);
      h('span', null, li, it[1]);
    });

    root.setAttribute('aria-labelledby', 'journey-title');
  }

  /* ── Draw the map for the current geometry ───────────── */
  function draw() {
    if (!root.clientWidth) return;
    lastWidth = root.clientWidth;
    var cs = window.getComputedStyle(root);
    var contentW = root.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var compact = contentW < 760;
    var width = compact ? root.clientWidth : contentW;
    root.classList.toggle('is-compact', compact);
    var g = geo = computeGeometry(width, compact);
    var svg = els.svg;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', '0 0 ' + g.width + ' ' + g.height);
    svg.setAttribute('width', g.width);
    svg.setAttribute('height', g.height);
    root.classList.toggle('is-scroll', g.width > width + 1);

    var defs = el('defs', null, svg);
    var glow = el('filter', { id: 'jm-glow', x: '-150%', y: '-150%', width: '400%', height: '400%' }, defs);
    el('feGaussianBlur', { stdDeviation: g.compact ? 4 : 3.4, result: 'b' }, glow);
    var merge = el('feMerge', null, glow);
    el('feMergeNode', { in: 'b' }, merge);
    el('feMergeNode', { in: 'SourceGraphic' }, merge);


    var gBands = el('g', { class: 'jm-bands', 'aria-hidden': 'true' }, svg);
    var gRoad = el('g', { class: 'jm-road', 'aria-hidden': 'true' }, svg);
    var gAxis = el('g', { class: 'jm-axis', 'aria-hidden': 'true' }, svg);
    var gStems = el('g', { class: 'jm-stems', 'aria-hidden': 'true' }, svg);
    var gNodes = el('g', { class: 'jm-nodes' }, svg);

    /* axis labels must not collide: keep a list of occupied spans */
    var taken = [];
    var charW = g.compact ? 7.6 : 7.0;
    function placeLabel(x, text, cls) {
      var w = text.length * charW;
      /* keep labels inside the map: nudge the text, never the tick */
      var edge = g.compact ? 16 : 2;
      var lx = Math.max(w / 2 + edge, Math.min(g.width - w / 2 - edge, x));
      var a = lx - w / 2 - 6, b = lx + w / 2 + 6;
      for (var i = 0; i < taken.length; i++) {
        if (a < taken[i][1] && b > taken[i][0]) return false;
      }
      taken.push([a, b]);
      var t = el('text', { class: cls, x: lx, y: g.axisY + 19, 'text-anchor': 'middle' }, gAxis);
      t.textContent = text;
      return true;
    }

    /* gap first, so the year ticks give way to its label */
    g.scale.bounds.forEach(function (B) {
      if (!B.seg.gap) return;
      el('path', { class: 'jm-road__gap', d: roadPath(g, B.a + 9, B.b - 9) }, gRoad);
      [B.a + 4, B.b - 4].forEach(function (bx) {
        var by = roadY(g, bx);
        el('path', { class: 'jm-break', d: 'M' + (bx - 3.5) + ',' + (by + 8) + ' L' + (bx + 1.5) + ',' + (by - 8) +
          ' M' + (bx + 1.5) + ',' + (by + 8) + ' L' + (bx + 6.5) + ',' + (by - 8) }, gRoad);
      });
      placeLabel((B.a + B.b) / 2, '≈ 1,300 yr', 'jm-gap__label');
    });

    g.scale.bounds.forEach(function (B, i) {
      var seg = B.seg;
      if (seg.gap) return;
      var color = 'var(--era-' + seg.era + '-color)';
      var cx = (B.a + B.b) / 2, w = B.b - B.a;

      /* a soft nebula glow behind each era */
      var grad = el('radialGradient', { id: 'jm-glow-' + seg.era, cx: 0.5, cy: 0.5, r: 0.5 }, defs);
      [[0, 0.55], [0.55, 0.2], [1, 0]].forEach(function (st) {
        var stop = el('stop', { offset: st[0] }, grad);
        stop.style.stopColor = color;
        stop.style.stopOpacity = st[1];
      });
      el('ellipse', {
        class: 'jm-nebula', cx: cx, cy: g.roadY,
        rx: w / 2 + 26, ry: g.maxLanes * g.laneGap + 30,
        fill: 'url(#jm-glow-' + seg.era + ')'
      }, gBands);

      /* era label */
      var lab = el('text', { class: 'jm-era__label', x: cx, y: g.labelH - 18, 'text-anchor': 'middle' }, gBands);
      lab.style.fill = color;
      lab.textContent = ERA_NAMES[seg.era];
      if (lab.getComputedTextLength && lab.getComputedTextLength() > w - 6) {
        lab.textContent = ERA_NAMES[seg.era].replace('Scientific ', '').replace(' Physics', '');
      }

      /* road: soft glow + core */
      var d = roadPath(g, B.a, B.b);
      var glowP = el('path', { class: 'jm-road__glow', d: d }, gRoad);
      glowP.style.stroke = color;
      var core = el('path', { class: 'jm-road__core', d: d }, gRoad);
      core.style.stroke = color;

      /* axis: one line per era, so the gap stays open */
      var axl = el('line', { class: 'jm-axis__line', x1: B.a + 1.5, x2: B.b - 1.5, y1: g.axisY, y2: g.axisY }, gAxis);
      axl.style.stroke = color;
      if (i > 0 && !SEGMENTS[i - 1].gap) {
        el('line', { class: 'jm-axis__sep', x1: B.a, x2: B.a, y1: g.axisY - 5, y2: g.axisY + 5 }, gAxis);
      }

      /* year ticks */
      (seg.ticks || []).forEach(function (yr) {
        var tx = g.scale.x(yr);
        if (placeLabel(tx, yearText(yr), 'jm-axis__label')) {
          el('line', { class: 'jm-axis__tick', x1: tx, x2: tx, y1: g.axisY - 3, y2: g.axisY + 3 }, gAxis);
        }
      });
    });

    /* nodes */
    var visited = visitedSet();
    var byId = {};
    g.layout.forEach(function (n) {
      var slope = roadSlope(g, n.x);
      var len = Math.sqrt(1 + slope * slope);
      var nx = -slope / len, ny = 1 / len;   /* unit normal (pointing down) */
      var ry = roadY(g, n.x);
      n.rx = n.x; n.ry = ry;
      n.cx = n.x + nx * n.lane * g.laneGap;
      n.cy = ry + ny * n.lane * g.laneGap;
      byId[n.s.id] = n;
    });

    nodes = stops.map(function (s) { return byId[s.id]; });
    var nextNode = null;
    nodes.forEach(function (n) {
      if (!nextNode && !visited[n.s.id]) nextNode = n;
    });

    nodes.forEach(function (n) {
      var s = n.s;
      var isVisited = !!visited[s.id];
      var isNext = n === nextNode;
      var color = 'var(--era-' + s.era + '-color)';
      if (n.lane !== 0) {
        var stem = el('line', { class: 'jm-stem', x1: n.rx, y1: n.ry, x2: n.cx, y2: n.cy }, gStems);
        stem.style.stroke = color;
        var foot = el('circle', { class: 'jm-stem__foot', cx: n.rx, cy: n.ry, r: 1.6 }, gStems);
        foot.style.fill = color;
      }
      var a = el('a', {
        href: stopHref(s),
        tabindex: '0',
        class: 'jm-node' + (isVisited ? ' is-visited' : '') + (isNext ? ' is-next' : ''),
        'data-id': s.id,
        'aria-label': 'Stop ' + s.order + ': ' + s.title + ', ' + s.yearLabel + ', ' + s.scientist +
          (isVisited ? ', visited' : '') + (isNext ? ', next stop' : '')
      }, gNodes);
      a.style.setProperty('--c', color);
      n.a = a;
      n.visited = isVisited;
      n.next = isNext;
      el('circle', { class: 'jm-node__hit', cx: n.cx, cy: n.cy, r: Math.min(g.gap, g.laneGap) * 0.62 }, a);
      if (isNext) {
        el('circle', { class: 'jm-node__pulse', cx: n.cx, cy: n.cy, r: g.r + 5 }, a);
        el('circle', { class: 'jm-node__ring', cx: n.cx, cy: n.cy, r: g.r + 4 }, a);
      }
      var dot = el('circle', { class: 'jm-node__dot', cx: n.cx, cy: n.cy, r: g.r }, a);
      if (isVisited) dot.setAttribute('filter', 'url(#jm-glow)');
      el('circle', { class: 'jm-node__core', cx: n.cx, cy: n.cy, r: isVisited ? g.r * 0.36 : 0 }, a);
      el('circle', { class: 'jm-node__focus', cx: n.cx, cy: n.cy, r: g.r + 5 }, a);
    });

    /* snap points at the start of each era on the scrolling road */
    Array.prototype.slice.call(els.scroller.querySelectorAll('.journey__snap')).forEach(function (n) { n.remove(); });
    if (g.width > width + 1) {
      g.scale.bounds.forEach(function (B) {
        if (B.seg.gap) return;
        var sp = h('span', 'journey__snap', els.scroller);
        sp.style.left = Math.max(0, B.a - 18) + 'px';
        sp.setAttribute('aria-hidden', 'true');
      });
    }

    updateHead(visited, nextNode);
    hideCard(true);

    /* phone: bring the next stop into view */
    if (root.classList.contains('is-scroll') && nextNode) {
      var target = nextNode.cx - els.scroller.clientWidth * 0.35;
      els.scroller.scrollLeft = target < 80 ? 0 : target;
    }
  }

  function updateHead(visited, nextNode) {
    var count = Object.keys(visited).filter(function (id) {
      return stops.some(function (s) { return s.id === id; });
    }).length;
    els.count.innerHTML = '';
    if (count === 0) {
      els.count.textContent = '50 stops, 2,600 years';
    } else {
      var strong = h('span', 'journey__count', els.count, String(count));
      els.count.appendChild(document.createTextNode(' of ' + stops.length + ' stops visited'));
    }
    var cta = els.cta;
    cta.innerHTML = '';
    if (nextNode) {
      var s = nextNode.s;
      cta.href = stopHref(s);
      cta.style.setProperty('--c', 'var(--era-' + s.era + '-color)');
      h('span', 'journey__cta-label', cta, count === 0 ? 'Start' : 'Continue');
      h('span', 'journey__cta-num', cta, pad3(s.order));
      h('span', 'journey__cta-title', cta, s.title);
      var arrow = h('span', 'journey__cta-arrow', cta, '→');
      arrow.setAttribute('aria-hidden', 'true');
      cta.setAttribute('aria-label', (count === 0 ? 'Start with stop ' : 'Continue with stop ') + s.order + ': ' + s.title);
      cta.hidden = false;
    } else {
      cta.removeAttribute('href');
      h('span', 'journey__cta-label', cta, 'All 50 stops visited');
      cta.removeAttribute('aria-label');
    }
  }

  /* ── Hover / focus card ──────────────────────────────── */
  function showCard(n, withLink) {
    if (!n) return;
    if (activeNode && activeNode !== n) activeNode.a.classList.remove('is-active');
    activeNode = n;
    n.a.classList.add('is-active');
    var s = n.s, c = els.card;
    c.innerHTML = '';
    c.style.setProperty('--c', 'var(--era-' + s.era + '-color)');
    var meta = h('div', 'journey__card-meta', c);
    h('span', 'journey__card-num', meta, pad3(s.order));
    h('span', 'journey__card-year', meta, s.yearLabel);
    h('div', 'journey__card-title', c, s.title);
    h('div', 'journey__card-sci', c, s.scientist);
    var foot = h('div', 'journey__card-foot', c);
    h('span', 'journey__card-era', foot, ERA_LONG[s.era] || '');
    h('span', 'journey__card-status' + (n.visited ? ' is-visited' : ''), foot,
      n.visited ? 'Visited' : (n.next ? 'Next stop' : 'Not yet visited'));
    if (withLink) {
      var link = h('a', 'journey__card-open', c, 'Open stop →');
      link.href = stopHref(s);
      c.setAttribute('aria-hidden', 'false');
    } else {
      c.setAttribute('aria-hidden', 'true');
    }
    c.classList.toggle('is-pinned', !!withLink);
    positionCard();
    c.classList.add('is-shown');
  }

  function positionCard() {
    var n = activeNode;
    if (!n) return;
    var c = els.card;
    var stageW = els.stage.clientWidth;
    var sl = els.scroller.scrollLeft;
    var cw = c.offsetWidth, ch = c.offsetHeight;
    var x = n.cx - sl;
    var left = Math.max(4, Math.min(stageW - cw - 4, x - cw / 2));
    /* prefer above the node; the card may rise over the map's heading */
    var above = n.cy - ch - 16;
    var top = above >= 4 - els.stage.offsetTop ? above : n.cy + 18;
    c.style.left = left + 'px';
    c.style.top = top + 'px';
    c.style.setProperty('--arrow-x', Math.max(14, Math.min(cw - 14, x - left)) + 'px');
    c.classList.toggle('is-below', top > n.cy);
  }

  function hideCard(force) {
    if (pinned && !force) return;
    pinned = null;
    if (activeNode) activeNode.a.classList.remove('is-active');
    activeNode = null;
    els.card.classList.remove('is-shown', 'is-pinned');
    els.card.setAttribute('aria-hidden', 'true');
  }

  function nodeFromEvent(e) {
    var t = e.target && e.target.closest ? e.target.closest('.jm-node') : null;
    if (t) {
      for (var i = 0; i < nodes.length; i++) if (nodes[i].a === t) return nodes[i];
    }
    /* nearest node within reach of the pointer */
    var pt = els.svg.getBoundingClientRect();
    var sx = geo.width / pt.width;
    var px = (e.clientX - pt.left) * sx, py = (e.clientY - pt.top) * sx;
    var best = null, bd = 1e9;
    nodes.forEach(function (n) {
      var d = (n.cx - px) * (n.cx - px) + (n.cy - py) * (n.cy - py);
      if (d < bd) { bd = d; best = n; }
    });
    var reach = geo.compact ? 30 : 24;
    return bd <= reach * reach ? best : null;
  }

  function bindEvents() {
    var svg = els.svg;
    var lastPointer = 'mouse';

    svg.addEventListener('pointermove', function (e) {
      lastPointer = e.pointerType;
      if (e.pointerType !== 'mouse' || pinned) return;
      var n = nodeFromEvent(e);
      if (n) { svg.style.cursor = 'pointer'; if (n !== activeNode) showCard(n, false); }
      else { svg.style.cursor = ''; hideCard(); }
    });
    svg.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse') hideCard();
    });
    svg.addEventListener('pointerdown', function (e) { lastPointer = e.pointerType; });

    svg.addEventListener('click', function (e) {
      var n = nodeFromEvent(e);
      if (!n) { if (pinned) hideCard(true); return; }
      if (lastPointer === 'touch' || lastPointer === 'pen') {
        /* first tap shows the card, a second tap on the same stop opens it */
        if (pinned !== n) {
          e.preventDefault();
          pinned = null;
          showCard(n, true);
          pinned = n;
          return;
        }
      }
      if (!e.target.closest || !e.target.closest('.jm-node')) {
        e.preventDefault();
        window.location.href = n.a.getAttribute('href');
      }
    });

    svg.addEventListener('focusin', function (e) {
      var t = e.target.closest && e.target.closest('.jm-node');
      if (!t) return;
      var n = null;
      for (var i = 0; i < nodes.length; i++) if (nodes[i].a === t) n = nodes[i];
      if (!n) return;
      pinned = null;
      ensureVisible(n);
      showCard(n, false);
    });
    svg.addEventListener('focusout', function () {
      setTimeout(function () {
        if (!svg.contains(document.activeElement) && !pinned) hideCard();
      }, 0);
    });

    svg.addEventListener('keydown', function (e) {
      var t = e.target.closest && e.target.closest('.jm-node');
      if (!t) return;
      var idx = -1;
      for (var i = 0; i < nodes.length; i++) if (nodes[i].a === t) idx = i;
      var to = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = Math.min(nodes.length - 1, idx + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = Math.max(0, idx - 1);
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = nodes.length - 1;
      else if (e.key === 'Escape') { hideCard(true); return; }
      else if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); window.location.href = t.getAttribute('href'); return; }
      if (to !== null) { e.preventDefault(); nodes[to].a.focus(); }
    });

    els.scroller.addEventListener('scroll', function () {
      if (!activeNode) return;
      var x = activeNode.cx - els.scroller.scrollLeft;
      if (x < 0 || x > els.scroller.clientWidth) { hideCard(true); return; }
      positionCard();
    }, { passive: true });

    document.addEventListener('click', function (e) {
      if (pinned && !root.contains(e.target)) hideCard(true);
    });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (Math.abs(root.clientWidth - lastWidth) > 1) draw();
      }, 150);
    });

    /* back/forward cache and other tabs: refresh the lit stops */
    window.addEventListener('pageshow', function (e) { if (e.persisted) draw(); });
    window.addEventListener('storage', function (e) {
      if (!e.key || e.key === 'physics-history-progress') draw();
    });
  }

  function ensureVisible(n) {
    var sc = els.scroller;
    if (sc.scrollWidth <= sc.clientWidth + 1) return;
    var margin = 60;
    var left = sc.scrollLeft, right = left + sc.clientWidth;
    var target = null;
    if (n.cx < left + margin) target = n.cx - margin;
    else if (n.cx > right - margin) target = n.cx - sc.clientWidth + margin;
    if (target !== null) {
      sc.scrollTo({ left: Math.max(0, target), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  /* ── Init ────────────────────────────────────────────── */
  function init() {
    fetch('assets/data/stops.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        stops = (data.stops || []).slice().sort(function (a, b) { return a.order - b.order; });
        if (!stops.length) return;
        buildFrame();
        draw();
        bindEvents();
        /* labels are measured: redraw once the display font is in */
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(function () { if (!activeNode) draw(); });
        }
      })
      .catch(function (err) {
        console.warn('[journey.js] Could not load stops.json:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
