# Plan 08-01 Summary

**Completed:** 2026-03-22
**Phase:** 08 — Era Gap Fills

## What was built

Stop 002 (Pythagoras and Mathematical Harmony) was upgraded from a stub/teaser to a
fully interactive simulation. A complete ES5 IIFE sim.js was written with Web Audio API
sine-tone playback (AudioContext created lazily on first button click), a DPR-aware Canvas
2D standing wave visualization using the formula `A * sin(n * PI * (x - x0) / L) * cos(omega * t)`,
and six ratio buttons (1:1 through 9:8) wired to both audio and visual harmonic update.
The stop page index.html was updated with real controls, KaTeX equation, and corrected
data-autoplay attribute. stops.json marks stop 002 as no longer a stub.

## Key files

- `Episodio4/stops/002-pythagoras-harmony/sim.js`: Full simulation — Web Audio API tones, standing wave canvas, SimAPI contract, lazy AudioContext
- `Episodio4/stops/002-pythagoras-harmony/index.html`: Six ratio buttons, data-autoplay="false", KaTeX equation in takeaway box, updated stop-body
- `Episodio4/assets/data/stops.json`: isStub changed from true to false for stop 002

## Decisions made

- `harmonicIndexFromN()` helper function added to look up RATIOS array by harmonic n value (needed for frequency label display in draw())
- Amplitude scaling formula `H * 0.18 / Math.max(1, currentN * 0.35)` keeps high harmonics (n=9) visible without overflow
- Node dots drawn at `x0 + i * L / currentN` for i=0..n inclusive (endpoints plus internal nodes)
- `reset()` calls `pause()` rather than `window.SimAPI.pause()` internally for clarity — final version uses `window.SimAPI.pause()` to match plan spec

## Deviations from plan

- None. All constraints followed exactly: ES5-only, no const/let, no arrow functions, exponentialRampToValueAtTime target 0.0001, AudioContext lazy on click, standing wave formula as specified

## Notes for downstream

- Stop 002 is now fully live; Eras 1-2 (Ancient) has all its stops implemented
- Plan 08-02 covers Stop 014 (Alchemy to Chemistry) — different era, similar pattern
- OG image for stop 002 was already generated in Phase 07 — no regeneration needed
- The `data-autoplay="false"` means IntersectionObserver will call SimAPI.start() (canvas animation starts) but audio stays silent until user clicks a ratio button
