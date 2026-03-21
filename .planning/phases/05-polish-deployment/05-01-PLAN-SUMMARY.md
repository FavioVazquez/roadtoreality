# Plan 05-01 Summary

**Completed:** 2026-03-21

## What was built

Production readiness pass covering accessibility, performance, prefers-reduced-motion,
and visual polish. All tasks executed, verified, and user-approved.

## Key files modified

- `Episodio4/README.md` — 215 lines: overview, local dev, add-a-stop guide, deployment, tech stack
- `Episodio4/index.html` — Complete galaxy background rewrite (inline JS):
  - Perlin fBm noise engine (permutation table + gradient noise + fractal octaves)
  - Offscreen canvas at 1/4 resolution, pixel-by-pixel noise rendering, scaled up via drawImage
  - Three domain-warped nebulae: purple/blue (upper-left), teal/cyan (right), magenta/pink (lower-center)
  - Filamentary structure: noise threshold 0.30 creates dark voids; domain warping gives organic shape
  - Milky Way: dual-noise diagonal band (density scale/180 + dust lanes scale/55), golden core
  - Twinkling stars (~W*H/2200 count), 8% bright with diffraction spikes
  - Shooting stars every 5–14s with gradient tail + radial glow head
  - Dark radial vignette (CSS ::before) protects hero text legibility
  - prefers-reduced-motion: buildBackground() + drawStars() once, no RAF
- `Episodio4/assets/css/base.css` — All oklch hue 285 (blue) → hue 0 (neutral black)
- `Episodio4/assets/css/simulation.css` — Hardcoded blue oklch values neutralised
- `Episodio4/stops/*/sim.js` (12 files) — prefers-reduced-motion guard in start()
- `Episodio4/stops/*/index.html` (12 files) — aria-live="polite" on .sim-caption

## Decisions made

- DEC: Noise-based rendering chosen over stacked radial gradients — gradients produce smooth
  blobs, noise produces filamentary structure matching real nebula appearance.
- DEC: Offscreen canvas at SCALE=4 (1/4 res) for performance — renders ~120ms on load,
  imperceptible on page open. Full-res pixel loop would be ~2s.
- DEC: Background canvas opaque (alpha=255 everywhere) — RGB encodes brightness directly.
  Avoids compositing artefacts with transparent alpha blending.
- DEC: CSS color tokens neutralised (hue 285 → 0) — the blue-tinted dark backgrounds were
  the root cause of the "blueish black" complaint. All surfaces now neutral.
- DEC: Dark vignette via CSS ::before rather than canvas — keeps canvas logic clean,
  vignette is a CSS concern.
- prefers-reduced-motion: sims draw one static frame. Landing page also draws once.
- Vendor libs (p5, matter): not loaded on any stop page (already clean from Phase 4).

## Verification results

- T1: README 214 lines ✓, all sections present ✓
- T2: aria-label on all controls ✓, aria-live on 12 stops ✓
- T3: 0 vendor lib loads on stop pages ✓
- T4: Galaxy user-approved ✓ — nebula filaments visible, Milky Way band with dust lanes,
  stars twinkling, pitch-black background, text readable

## Notes for downstream

- GitHub Pages deploy pending — t8: repo Settings → Pages → folder: /Episodio4
- Next ceremony: commit + push, then configure Pages, then run Phase 5 UAT
