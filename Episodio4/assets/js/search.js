/* ============================================================
   search.js — Cmd/Ctrl+K fuzzy search modal
   Requires: fuse.min.js loaded before this file
   Requires: window.STOPS_DATA_PATH defined by each page
   How Physics Works — v2.0
   ============================================================ */
(function () {
  'use strict';

  var fuse = null;
  var stops = [];
  var focusedIndex = -1;

  var ERA_LABELS = {
    ancient: 'Ancient & Classical',
    revolution: 'Scientific Revolution',
    classical: 'Classical Physics',
    modern: 'Modern Revolution',
    contemporary: 'Contemporary'
  };

  /* ── DOM helpers ─────────────────────────────────────────── */
  function _el(id) { return document.getElementById(id); }

  function _isModalOpen() {
    var modal = _el('search-modal');
    return modal && modal.hasAttribute('open');
  }

  function _openModal() {
    var modal = _el('search-modal');
    var overlay = document.querySelector('.search-overlay');
    if (!modal) return;
    modal.setAttribute('open', '');
    if (overlay) overlay.classList.add('is-open');
    var input = modal.querySelector('.search-modal__input');
    if (input) {
      input.value = '';
      setTimeout(function () { input.focus(); }, 20);
    }
    focusedIndex = -1;
    _renderResults([]);
    document.body.style.overflow = 'hidden';
  }

  function _closeModal() {
    var modal = _el('search-modal');
    var overlay = document.querySelector('.search-overlay');
    if (!modal) return;
    modal.removeAttribute('open');
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    focusedIndex = -1;
  }

  /* ── Result path resolution ──────────────────────────────── */
  function _stopPath(stop) {
    /* From landing page: stops/{id}/index.html
       From a stop page: ../../stops/{id}/index.html would double-navigate.
       Instead, compute relative path from current page.
       Landing page: assets/data/stops.json is at root level.
       Stop page: ../../assets/data/stops.json is two levels up.
       We detect by checking STOPS_DATA_PATH prefix. */
    var dataPath = window.STOPS_DATA_PATH || 'assets/data/stops.json';
    var isStopPage = dataPath.indexOf('../../') === 0;
    if (isStopPage) {
      return '../../stops/' + stop.id + '/index.html';
    }
    return 'stops/' + stop.id + '/index.html';
  }

  /* ── Render results ──────────────────────────────────────── */
  function _renderResults(results) {
    var modal = _el('search-modal');
    if (!modal) return;
    var container = modal.querySelector('.search-modal__results');
    if (!container) return;

    if (results.length === 0) {
      var input = modal.querySelector('.search-modal__input');
      var query = input ? input.value.trim() : '';
      container.innerHTML = query
        ? '<div class="search-modal__empty">No results for "' + _esc(query) + '"</div>'
        : '<div class="search-modal__empty">Type to search all 50 stops\u2026</div>';
      focusedIndex = -1;
      return;
    }

    var html = results.map(function (r, i) {
      var stop = r.item || r;
      var path = _stopPath(stop);
      var eraLabel = ERA_LABELS[stop.era] || stop.era;
      var numStr = String(stop.order).padStart(3, '0');
      return '<a class="search-result" data-era="' + _esc(stop.era) + '" href="' + _esc(path) + '" data-index="' + i + '">' +
        '<span class="search-result__number">' + numStr + '</span>' +
        '<span class="search-result__body">' +
          '<span class="search-result__title">' + _esc(stop.title) + '</span>' +
          '<span class="search-result__meta">' + _esc(stop.scientist) + ' \u00b7 ' + _esc(stop.yearLabel) + '</span>' +
        '</span>' +
        '<span class="search-result__era-badge">' + _esc(eraLabel) + '</span>' +
      '</a>';
    }).join('');

    container.innerHTML = html;
    focusedIndex = -1;
  }

  function _setFocus(idx) {
    var modal = _el('search-modal');
    if (!modal) return;
    var results = modal.querySelectorAll('.search-result');
    if (!results.length) return;

    if (idx < 0) idx = results.length - 1;
    if (idx >= results.length) idx = 0;
    focusedIndex = idx;

    for (var i = 0; i < results.length; i++) {
      results[i].classList.toggle('is-focused', i === focusedIndex);
    }

    /* Scroll into view */
    results[focusedIndex].scrollIntoView({ block: 'nearest' });
  }

  function _navigateFocused() {
    var modal = _el('search-modal');
    if (!modal) return;
    var focused = modal.querySelector('.search-result.is-focused');
    if (focused && focused.href) {
      window.location.href = focused.href;
    }
  }

  /* ── Search ──────────────────────────────────────────────── */
  var _debounceTimer = null;

  function _search(query) {
    if (!fuse) return;
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(function () {
      var results = query.trim()
        ? fuse.search(query.trim()).slice(0, 12)
        : stops.slice(0, 12).map(function (s) { return { item: s }; });
      _renderResults(results);
    }, 150);
  }

  /* ── Fuse init ───────────────────────────────────────────── */
  function _initFuse(data) {
    stops = data.stops || [];
    fuse = new Fuse(stops, {
      threshold: 0.4,
      keys: [
        { name: 'title',       weight: 0.5 },
        { name: 'scientist',   weight: 0.3 },
        { name: 'subtitle',    weight: 0.2 },
        { name: 'description', weight: 0.15 },
        { name: 'era',         weight: 0.05 }
      ]
    });
  }

  /* ── Event binding ───────────────────────────────────────── */
  function _bindEvents() {
    var modal = _el('search-modal');
    if (!modal) return;

    /* Input: search on type */
    var input = modal.querySelector('.search-modal__input');
    if (input) {
      input.addEventListener('input', function () {
        _search(input.value);
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); _setFocus(focusedIndex + 1); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); _setFocus(focusedIndex - 1); }
        if (e.key === 'Enter')     { _navigateFocused(); }
        if (e.key === 'Escape')    { _closeModal(); }
      });
    }

    /* Close button */
    var closeBtn = modal.querySelector('.search-modal__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', _closeModal);
    }

    /* Click on overlay closes modal */
    var overlay = document.querySelector('.search-overlay');
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) _closeModal();
      });
    }

    /* Result click: navigation handled by <a href> natively */

    /* Global Cmd/Ctrl+K opens modal */
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (_isModalOpen()) {
          _closeModal();
        } else {
          _openModal();
        }
      }
    });

    /* Bind header search trigger button */
    var triggerBtn = document.getElementById('search-trigger-btn');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', function () {
        _openModal();
      });
    }
  }

  function _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Bootstrap ───────────────────────────────────────────── */
  function init() {
    if (typeof Fuse === 'undefined') {
      console.warn('[search.js] Fuse.js not loaded');
      return;
    }

    var dataPath = window.STOPS_DATA_PATH || 'assets/data/stops.json';

    fetch(dataPath)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _initFuse(data);
        _bindEvents();
      })
      .catch(function (err) {
        console.warn('[search.js] Could not load stops.json:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
