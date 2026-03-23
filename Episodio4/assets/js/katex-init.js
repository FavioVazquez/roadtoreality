/* ============================================================
   katex-init.js — Deferred KaTeX auto-render initializer
   Must be loaded AFTER katex.min.js and auto-render.min.js
   (all three deferred — execution order is preserved by defer)
   How Physics Works — v2.0
   ============================================================ */
(function () {
  'use strict';

  if (typeof renderMathInElement !== 'function') return;

  renderMathInElement(document.body, {
    delimiters: [
      { left: '$$', right: '$$', display: true  },
      { left: '$',  right: '$',  display: false }
    ],
    throwOnError: false,
    errorColor: 'var(--color-text-muted)'
  });
}());
