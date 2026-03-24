/* ============================================================
   progress.js — localStorage visited-stop tracking
   How Physics Works — v1.0
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'physics-history-progress';

  function _load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function _save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      /* storage unavailable — degrade silently */
    }
  }

  function markVisited(stopId) {
    var data = _load();
    data[stopId] = Date.now();
    _save(data);
  }

  function isVisited(stopId) {
    return Boolean(_load()[stopId]);
  }

  function getVisitedCount() {
    return Object.keys(_load()).length;
  }

  function getAllVisited() {
    return Object.keys(_load());
  }

  window.PhysicsProgress = {
    markVisited: markVisited,
    isVisited: isVisited,
    getVisitedCount: getVisitedCount,
    getAllVisited: getAllVisited
  };
}());
