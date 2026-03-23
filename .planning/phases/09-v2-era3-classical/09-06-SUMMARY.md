# Plan 09-06 Summary

**Completed:** 2026-03-23
**Phase:** 09 — Era 3: Classical Physics

## What was built

Stop 025 (Hertz Radio Waves): oscillating dipole with expanding wavefront rings using 72-segment sin²θ radiation pattern, alternating red/blue E-field colors per half-cycle, dipole-frequency and wave-speed sliders.

Stop 026 (Michelson-Morley): three-mode interactive sim — Mode 1 shows rotation-modulated predicted fringe vs. flat observed fringe (split-screen with rotation slider); Mode 2 shows both light beams always arriving simultaneously (the null result); Mode 3 renders per-pixel cosine fringe pattern from path length difference (null at armRatio=1.0). Tab controls switch between modes.

## Key files

- `Episodio4/stops/025-hertz-radio-waves/sim.js`: 326-line ES5 IIFE, oscillating dipole, sin²θ wavefront rings
- `Episodio4/stops/025-hertz-radio-waves/index.html`: dipole-frequency + wave-speed sliders, KaTeX equations
- `Episodio4/stops/026-michelson-morley/sim.js`: 718-line ES5 IIFE, three-mode interactive sim
- `Episodio4/stops/026-michelson-morley/index.html`: mode-tab buttons, rotation + arm-ratio sliders, KaTeX

## Decisions made

- Stop 026 three modes as `currentMode` variable, `draw()` branches to `drawModeExpected()`, `drawModeRace()`, `drawModeInterferometer()`
- Mode 3 fringe uses `Math.cos(2*PI*pathDiff/lambda)` per-pixel
- `ctx.rotate()` for apparatus rotation in Mode 2

## Notes for downstream

- Stop 026 is the most complex sim in the phase (718 lines) — verify all three modes in the browser
