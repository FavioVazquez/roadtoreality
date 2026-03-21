/* ============================================================
   stop-shell.js — Per-stop page: breadcrumb, prev/next,
                   IntersectionObserver sim lifecycle
   How Physics Works — v1.0
   ============================================================ */
(function () {
  'use strict';

  var config = null;

  function _readConfig() {
    var el = document.getElementById('stop-config');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      console.warn('[stop-shell] Could not parse #stop-config:', e);
      return null;
    }
  }

  function _renderBreadcrumb(cfg) {
    var el = document.getElementById('stop-breadcrumb');
    if (!el || !cfg) return;

    var eraLabel = el.dataset.eraLabel || cfg.era || '';
    el.innerHTML =
      '<span class="breadcrumb__item">' +
        '<a class="breadcrumb__link" href="../../index.html">All Eras</a>' +
      '</span>' +
      '<span class="breadcrumb__item">' +
        '<a class="breadcrumb__link" href="../../index.html#era-' + cfg.era + '">' + eraLabel + '</a>' +
      '</span>' +
      '<span class="breadcrumb__item">' +
        '<span class="breadcrumb__current">' + (cfg.title || '') + '</span>' +
      '</span>';
  }

  function _renderStopNav(cfg) {
    var el = document.getElementById('stop-nav');
    if (!el || !cfg) return;

    var prevHtml = cfg.prev
      ? '<a class="stop-nav__btn stop-nav__btn--prev" href="../' + cfg.prev + '/index.html">' +
          '<span class="stop-nav__direction">← Previous</span>' +
          '<span class="stop-nav__title">' + (cfg.prevTitle || 'Previous Stop') + '</span>' +
        '</a>'
      : '<div></div>';

    var nextHtml = cfg.next
      ? '<a class="stop-nav__btn stop-nav__btn--next" href="../' + cfg.next + '/index.html">' +
          '<span class="stop-nav__direction">Next →</span>' +
          '<span class="stop-nav__title">' + (cfg.nextTitle || 'Next Stop') + '</span>' +
        '</a>'
      : '<div></div>';

    el.innerHTML = prevHtml + nextHtml;
  }

  function _initSimObserver() {
    var mount = document.getElementById('sim-mount');
    if (!mount) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var api = window.SimAPI;
        if (!api) return;
        if (entry.isIntersecting) {
          if (typeof api.start === 'function') api.start();
          var dot = document.querySelector('.sim-caption__dot');
          if (dot) dot.classList.add('is-running');
        } else {
          if (typeof api.pause === 'function') api.pause();
          var dot = document.querySelector('.sim-caption__dot');
          if (dot) dot.classList.remove('is-running');
        }
      });
    }, { threshold: 0.15 });

    observer.observe(mount);
  }

  function _bindPlayButton() {
    var btn = document.getElementById('sim-play-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var api = window.SimAPI;
      if (!api) return;

      if (btn.dataset.state === 'playing') {
        if (typeof api.pause === 'function') api.pause();
        btn.dataset.state = 'paused';
        btn.textContent = '▶ Play';
        var dot = document.querySelector('.sim-caption__dot');
        if (dot) dot.classList.remove('is-running');
      } else {
        if (typeof api.start === 'function') api.start();
        btn.dataset.state = 'playing';
        btn.textContent = '⏸ Pause';
        var dot = document.querySelector('.sim-caption__dot');
        if (dot) dot.classList.add('is-running');
      }
    });
  }

  function _bindResetButton() {
    var btn = document.getElementById('sim-reset-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var api = window.SimAPI;
      if (api && typeof api.reset === 'function') api.reset();
      var playBtn = document.getElementById('sim-play-btn');
      if (playBtn) {
        playBtn.dataset.state = 'paused';
        playBtn.textContent = '▶ Play';
      }
      var dot = document.querySelector('.sim-caption__dot');
      if (dot) dot.classList.remove('is-running');
    });
  }

  function _markVisited(cfg) {
    if (!cfg || !cfg.id) return;
    if (window.PhysicsProgress) {
      window.PhysicsProgress.markVisited(cfg.id);
    }
  }

  function _updateProgressDisplay(cfg) {
    var el = document.getElementById('stop-counter');
    if (!el || !cfg) return;
    el.textContent = 'Stop ' + cfg.order + ' of 50';
  }

  function init() {
    config = _readConfig();
    _renderBreadcrumb(config);
    _renderStopNav(config);
    _initSimObserver();
    _bindPlayButton();
    _bindResetButton();
    _markVisited(config);
    _updateProgressDisplay(config);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
