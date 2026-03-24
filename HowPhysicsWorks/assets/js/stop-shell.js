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

    /* Remove skeleton loader once SimAPI is set */
    var skeleton = document.querySelector('.stop-skeleton');
    if (skeleton && window.SimAPI) {
      skeleton.remove();
    } else if (skeleton) {
      /* Poll briefly until SimAPI is available, then remove */
      var _skPoll = setInterval(function () {
        if (window.SimAPI) {
          skeleton.remove();
          clearInterval(_skPoll);
        }
      }, 50);
      /* Safety: remove after 3s regardless */
      setTimeout(function () {
        if (skeleton.parentNode) skeleton.remove();
        clearInterval(_skPoll);
      }, 3000);
    }

    if (!mount) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var api = window.SimAPI;
        if (!api) return;

        var wrapper = mount.closest('.sim-wrapper');
        var autoplay = wrapper ? wrapper.dataset.autoplay !== 'false' : true;

        if (entry.isIntersecting) {
          if (autoplay && typeof api.start === 'function') api.start();
          var dot = document.querySelector('.sim-caption__dot');
          if (dot && autoplay) dot.classList.add('is-running');
        } else {
          if (typeof api.pause === 'function') api.pause();
          var dot = document.querySelector('.sim-caption__dot');
          if (dot) dot.classList.remove('is-running');
        }
      });
    }, { threshold: 0.15 });

    observer.observe(mount);
  }

  function _bindArrowNav(cfg) {
    if (!cfg) return;
    document.addEventListener('keydown', function (e) {
      /* Guard 1: ignore when an input/select/textarea is focused */
      var active = document.activeElement;
      if (active && (
        active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.tagName === 'SELECT'
      )) return;

      /* Guard 2: ignore when search modal is open */
      var modal = document.getElementById('search-modal');
      if (modal && modal.hasAttribute('open')) return;

      if (e.key === 'ArrowLeft' && cfg.prev) {
        window.location.href = '../' + cfg.prev + '/index.html';
      }
      if (e.key === 'ArrowRight' && cfg.next) {
        window.location.href = '../' + cfg.next + '/index.html';
      }
    });
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

  /* ── Share helpers ── */
  var _ERA_LABELS = {
    ancient: 'Ancient Physics', revolution: 'Scientific Revolution',
    classical: 'Classical Physics', modern: 'Modern Physics',
    contemporary: 'Contemporary Physics'
  };

  function _getText(selector) {
    var el = document.querySelector(selector);
    return el ? el.textContent.trim() : '';
  }

  function _truncate(str, max) {
    if (str.length <= max) return str;
    return str.slice(0, max - 1).trimEnd() + '…';
  }

  function _buildTweet(cfg) {
    var era      = _ERA_LABELS[cfg.era] || cfg.era || '';
    var year     = _getText('.stop-header__year');
    var sci      = _getText('.stop-header__scientist');
    var intro    = _getText('.stop-intro p');
    var url      = window.location.href;

    /* X counts any URL as 23 chars; reserve 23 + 2 newlines + hashtags */
    var hashtags = '\n#Physics #HowPhysicsWorks';
    var fixed    = era + ' · ' + year + ' — ' + sci + '\n';
    var budget   = 280 - fixed.length - 23 - hashtags.length - 1; /* 1 for newline before url */
    var snippet  = _truncate(intro, Math.max(budget, 40));

    return fixed + snippet + '\n' + url + hashtags;
  }

  function _buildLongPost(cfg) {
    var era      = _ERA_LABELS[cfg.era] || cfg.era || '';
    var year     = _getText('.stop-header__year');
    var sci      = _getText('.stop-header__scientist');
    var subtitle = _getText('.stop-header__subtitle');
    var intro    = _getText('.stop-intro p');
    var bodyText = _getText('.stop-body');
    var takeaway = '';
    var items    = document.querySelectorAll('.takeaway-box__list li');
    items.forEach(function (li) {
      var t = li.textContent.trim();
      if (t) takeaway += '• ' + t + '\n';
    });
    var bridge   = _getText('.stop-bridge span:last-child');
    var url      = window.location.href;

    var parts = [
      '📡 ' + cfg.title + ' — ' + era,
      year + ' · ' + sci,
      '',
      subtitle,
      '',
      intro,
    ];
    if (bodyText) parts.push('', bodyText.replace(/\s+/g, ' ').trim());
    if (takeaway) parts.push('', 'Key concepts:', takeaway.trim());
    if (bridge)   parts.push('', '→ ' + bridge);
    parts.push('', '🔗 ' + url, '', '#Physics #HowPhysicsWorks #' + (cfg.era || '') + 'Physics');

    return parts.join('\n');
  }

  function _renderShare(cfg) {
    if (!cfg) return;
    var nav = document.getElementById('stop-nav');
    if (!nav) return;

    var tweet    = _buildTweet(cfg);
    var longPost = _buildLongPost(cfg);

    /* og-image download URL — same dir as the current page */
    var ogUrl = window.location.href.replace(/index\.html$/, '').replace(/\/?$/, '/') + 'og-image.png';

    var div = document.createElement('div');
    div.className = 'stop-share content-column';
    div.innerHTML =
      '<span class="stop-share__label">Share</span>' +
      '<button class="share-btn share-btn--tweet" title="Share on X (max 280 chars)">' +
        '<span class="share-btn__icon">𝕏</span> Tweet this stop' +
      '</button>' +
      '<button class="share-btn share-btn--long" title="Copy long post for X Premium (opens composer)">' +
        '<span class="share-btn__icon">𝕏</span> Long post' +
      '</button>' +
      '<a class="share-screenshot" href="' + ogUrl + '" download title="Download simulation image to attach">' +
        '↓ screenshot' +
      '</a>';

    nav.parentNode.insertBefore(div, nav);

    div.querySelector('.share-btn--tweet').addEventListener('click', function () {
      var intent = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(tweet);
      window.open(intent, '_blank', 'noopener,width=600,height=400');
    });

    var longBtn = div.querySelector('.share-btn--long');
    longBtn.addEventListener('click', function () {
      var btn = this;
      var intent = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(longPost);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(longPost).then(function () {
          btn.textContent = '✓ Copied!';
          btn.classList.add('share-btn--feedback');
          setTimeout(function () {
            btn.innerHTML = '<span class="share-btn__icon">𝕏</span> Long post';
            btn.classList.remove('share-btn--feedback');
          }, 3000);
          window.open(intent, '_blank', 'noopener,width=600,height=600');
        });
      } else {
        window.open(intent, '_blank', 'noopener,width=600,height=600');
      }
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
    _bindArrowNav(config);
    _initSimObserver();
    _bindPlayButton();
    _bindResetButton();
    _markVisited(config);
    _updateProgressDisplay(config);
    _renderShare(config);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
