# How Physics Works

## What This Is

A self-contained, static website that walks through the history of physics — from a brief look at ancient foundations through the Scientific Revolution, classical mechanics, electromagnetism, relativity, quantum mechanics, and up to current frontiers — via beautiful interactive simulations and visualizations. Built for the general public: no prior physics knowledge required. The experience is designed to both teach and inspire.

## Core Value

Every visitor leaves understanding something real about how the universe works — because they played with it, not just read about it.

## Milestone History

### v1.0 — First Light (shipped 2026-03-21)

**Delivered:** Static site with full CSS design system, 50 stop navigation chain, 13 interactive simulations (Eras 1–2), noise-based galaxy background, GitHub Pages deployment.

**Live:** https://faviovazquez.github.io/roadtoreality/

## Current Milestone: v2.0 (planning pending)

**Goal:** Expand to Eras 3–5, add search, polish social sharing and KaTeX equations.

## Requirements

### Validated (v1.0)

- [x] Static site, no backend, deployable to GitHub Pages
- [x] ~50 interactive stop architecture (13 fully implemented, 37 stubs)
- [x] Ancient/early physics represented (stops 001–007)
- [x] Scientific Revolution represented (stops 008–013)
- [x] Each implemented stop has a playable Canvas 2D simulation
- [x] Dark luxury aesthetic with oklch palette and Cormorant Garamond
- [x] Chronological navigation with era color coding
- [x] General public accessible (no equations-first)
- [x] Mobile-friendly layout

### Active (v2.0)

- [ ] Eras 3–5 fully implemented stops (Classical Physics → Contemporary)
- [ ] Client-side search
- [ ] KaTeX equation rendering
- [ ] Open Graph images per stop

### Out of Scope

- Backend / server-side processing — static only, keeps it simple and freely hostable
- User accounts, progress tracking, or personalization — v2 if validated
- Full academic depth or citations-first presentation — this is for inspiration, not a textbook
- Branches of applied physics (engineering, materials science) — focus on fundamental physics history

## Context

- Inspired by https://encyclopediaworld.github.io/howaiworks/ — 50 interactive AI demos on a static site
- The goal is to match that concept but for physics, with higher visual luxury
- Physics history spans 2,500+ years; the site should feel curated, not exhaustive
- Ancient physics: a handful of stops (Aristotle's ideas, Archimedes, early optics/astronomy)
- Main weight: 1500s onward — Copernicus, Galileo, Newton, Faraday/Maxwell, Boltzmann, Einstein, Bohr, Schrödinger, Dirac, Feynman, Higgs, gravitational waves, etc.
- Simulations should be intuitive enough to use without instructions

## Constraints

- **Tech stack**: Pure static HTML/CSS/JavaScript — no build pipeline required; must work without a server
- **Compatibility**: Must run in modern browsers (Chrome, Firefox, Safari, Edge) without plugins
- **Performance**: Simulations must run smoothly on mid-range devices; no WebGL required unless beneficial
- **Scope**: ~50 interactive stops is the target scale (±10); quality over quantity

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|----------|
| Static site only | Free hosting, no maintenance, matches howaiworks model | Validated ✓ |
| Weighted post-1500s | Ancient physics is foundational but the revolution of modern physics is the payoff | Validated ✓ |
| Simulations + visualizations (not text-heavy) | General public learns better through play than reading | Validated ✓ |
| Perlin fBm noise galaxy (DEC-010) | Gradients produce blobs; noise produces filamentary realism | Shipped ✓ |
| gh-pages branch for deploy | GitHub Pages only supports root or /docs; gh-pages branch solves subfolder | Shipped ✓ |

---
*Last updated: 2026-03-21 — v1.0 shipped*
