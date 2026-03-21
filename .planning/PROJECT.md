# How Physics Works

## What This Is

A self-contained, static website that walks through the history of physics — from a brief look at ancient foundations through the Scientific Revolution, classical mechanics, electromagnetism, relativity, quantum mechanics, and up to current frontiers — via beautiful interactive simulations and visualizations. Built for the general public: no prior physics knowledge required. The experience is designed to both teach and inspire.

## Core Value

Every visitor leaves understanding something real about how the universe works — because they played with it, not just read about it.

## Current Milestone: v1.0 — First Light

**Goal:** Ship a working static site with the shared shell, landing page, and ~10 fully polished interactive stops covering Eras 1–2 (Ancient + Scientific Revolution), deployable to GitHub Pages.

**Output directory:** `Episodio4/`

**Target stops:**
- Era 1 (Ancient, ~600 BCE – 150 CE): 4–7 stops
- Era 2 (Scientific Revolution, 1543–1700): 6 stops
- Remaining 33–40 stops: stub pages (full shell, placeholder sim slot)

**Target features:**
- Shared CSS design system (dark luxury, era color coding, oklch palette)
- `stops.json` manifest driving all navigation and card grids
- Shared JS shell (`nav.js`, `stop-shell.js`, `progress.js`)
- All simulations self-contained IIFEs, viewport-aware, mobile-responsive

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Static site — no backend, fully self-contained, deployable to GitHub Pages or similar
- [ ] ~50 interactive stops across physics history, weighted toward post-1500s
- [ ] Ancient/early physics represented briefly (a few stops: Greeks, medieval optics, etc.)
- [ ] Rich coverage from the Scientific Revolution onward (Newton, thermodynamics, electromagnetism, relativity, quantum mechanics, Standard Model, current frontiers)
- [ ] Each stop includes a playable simulation or interactive visualization
- [ ] Visually luxurious — more polished and aesthetic than howaiworks; dark, elegant, rich design
- [ ] Timeline/navigation structure allowing visitors to move through history chronologically
- [ ] Content accessible to general public — no equations-first approach; intuition and wonder first
- [ ] Mobile-friendly layout

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
|----------|-----------|---------|
| Static site only | Free hosting, no maintenance, matches howaiworks model | — Pending |
| Weighted post-1500s | Ancient physics is foundational but the revolution of modern physics is the payoff | — Pending |
| Simulations + visualizations (not text-heavy) | General public learns better through play than reading; matches "teach and inspire" goal | — Pending |

---
*Last updated: 2026-03-20 after initial project questioning*
