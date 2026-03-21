/* ============================================================
   nav.js — Landing page: fetch stops.json, render era sections
            and stop card grids, apply visited badges
   How Physics Works — v1.0
   ============================================================ */
(function () {
  'use strict';

  var ERA_ORDER = ['ancient', 'revolution', 'classical', 'modern', 'contemporary'];

  var ERA_META = {
    ancient: {
      label: 'Ancient & Classical',
      tagline: 'When Philosophy Became Physics',
      dates: '600 BCE – 1500 CE',
      description: 'The first attempts to explain nature through reason, geometry, and observation — before the Scientific Method existed.'
    },
    revolution: {
      label: 'Scientific Revolution',
      tagline: 'Tearing Down the Cathedral',
      dates: '1543 – 1700',
      description: 'Galileo, Kepler, Newton: the universe becomes a machine, and mathematics becomes its language.'
    },
    classical: {
      label: 'Classical Physics',
      tagline: 'The Clockwork Cosmos',
      dates: '1700 – 1880',
      description: 'Thermodynamics, electricity, magnetism. Physicists thought they were almost done. They were wrong.'
    },
    modern: {
      label: 'The Modern Revolution',
      tagline: 'Everything Breaks',
      dates: '1880 – 1945',
      description: 'Relativity, quantum mechanics, and the demolition of every classical certainty.'
    },
    contemporary: {
      label: 'Contemporary Physics',
      tagline: 'The Frontier',
      dates: '1945 – Present',
      description: 'Particle physics, cosmology, quantum computing. The story is still being written.'
    }
  };

  function _groupByEra(stops) {
    var groups = {};
    ERA_ORDER.forEach(function (era) { groups[era] = []; });
    stops.forEach(function (stop) {
      if (groups[stop.era]) {
        groups[stop.era].push(stop);
      }
    });
    return groups;
  }

  function _cardHtml(stop) {
    var visited = window.PhysicsProgress && window.PhysicsProgress.isVisited(stop.id);
    var isStub = stop.isStub;
    var href = isStub ? '#' : 'stops/' + stop.id + '/index.html';
    var tag = isStub ? 'div' : 'a';
    var attrs = isStub
      ? 'class="stop-card stop-card--stub" data-era="' + stop.era + '" aria-hidden="true"'
      : 'class="stop-card' + (visited ? ' is-visited' : '') + '" data-era="' + stop.era + '" href="' + href + '"';

    return '<' + tag + ' ' + attrs + '>' +
      '<div class="stop-card__visited-badge" aria-label="Visited"></div>' +
      '<div class="stop-card__number">' + String(stop.order).padStart(3, '0') + '</div>' +
      '<div class="stop-card__title">' + _esc(stop.title) + '</div>' +
      '<div class="stop-card__subtitle">' + _esc(stop.subtitle) + '</div>' +
      '<div class="stop-card__meta">' +
        '<span class="stop-card__year">' + _esc(stop.yearLabel) + '</span>' +
        '<span class="stop-card__scientist">' + _esc(stop.scientist) + '</span>' +
      '</div>' +
    '</' + tag + '>';
  }

  function _eraSectionHtml(era, stops) {
    var meta = ERA_META[era] || {};
    var cards = stops.map(_cardHtml).join('');
    return '<section class="era-section" data-era="' + era + '" id="era-' + era + '">' +
      '<div class="era-section__header">' +
        '<h2 class="era-section__name">' + _esc(meta.label) + '</h2>' +
        '<span class="era-section__tagline">"' + _esc(meta.tagline) + '"</span>' +
      '</div>' +
      '<p class="era-section__description">' + _esc(meta.description) + '</p>' +
      '<div class="stop-grid">' + cards + '</div>' +
    '</section>';
  }

  function _timelineHtml() {
    return '<nav class="era-timeline" aria-label="Physics eras">' +
      ERA_ORDER.map(function (era) {
        var meta = ERA_META[era] || {};
        return '<a class="era-timeline__item" data-era="' + era + '" href="#era-' + era + '">' +
          '<span class="era-timeline__label">' + _esc(meta.label) + '</span>' +
          '<span class="era-timeline__dates">' + _esc(meta.dates) + '</span>' +
        '</a>';
      }).join('') +
    '</nav>';
  }

  function _renderProgressBar(totalVisited, totalStops) {
    var el = document.getElementById('progress-bar');
    if (!el) return;
    var pct = totalStops > 0 ? Math.round(totalVisited / totalStops * 100) : 0;
    el.innerHTML =
      '<div class="progress-bar">' +
        '<span>' + totalVisited + ' of ' + totalStops + ' stops visited</span>' +
        '<div class="progress-bar__track">' +
          '<div class="progress-bar__fill" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<span>' + pct + '%</span>' +
      '</div>';
  }

  function _render(data) {
    var stops = data.stops || [];
    var groups = _groupByEra(stops);

    var timelineEl = document.getElementById('era-timeline');
    if (timelineEl) {
      timelineEl.innerHTML = _timelineHtml();
    }

    var sectionsEl = document.getElementById('era-sections');
    if (sectionsEl) {
      sectionsEl.innerHTML = ERA_ORDER.map(function (era) {
        return _eraSectionHtml(era, groups[era] || []);
      }).join('');
    }

    var visited = window.PhysicsProgress ? window.PhysicsProgress.getVisitedCount() : 0;
    _renderProgressBar(visited, stops.length);
  }

  function _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function init() {
    fetch('assets/data/stops.json')
      .then(function (r) { return r.json(); })
      .then(_render)
      .catch(function (err) {
        console.error('[nav.js] Failed to load stops.json:', err);
        var el = document.getElementById('era-sections');
        if (el) {
          el.innerHTML = '<p style="color:var(--color-text-muted);text-align:center;padding:2rem">Could not load stops data. If opening from the filesystem, use a local server: <code>python3 -m http.server</code></p>';
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
