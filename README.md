# Road to Reality

A personal journey through the history and ideas of physics — built as a series of interactive episodes. Each episode is a self-contained web application pairing narrative essays with live, playable simulations.

This repository is the workspace for all episodes. Right now only **Episodio 4** is active and under construction.

---

## Episodes

| Episode | Topic | Status |
|---------|-------|--------|
| Episodio 1 | Early explorations | Archive |
| Episodio 2 | [Agentic Learning skill](https://github.com/FavioVazquez/agentic-learn) | Archive |
| Episodio 3 | Research & writing | Archive |
| **Episodio 4** | **How Physics Works — interactive history of physics** | **Work in progress** |

---

## Episodio 4 — How Physics Works

> *"Every visitor leaves understanding something real about how the universe works — because they played with it, not just read about it."*

A static website walking through 2,500 years of physics history via 50 interactive stops — from Thales (~600 BCE) to the contemporary frontiers. Each stop combines a short narrative essay with a Canvas-based simulation you can actually play with.

**Live site:** coming soon (GitHub Pages deployment in Phase 5)

**Local preview:**
```bash
python3 -m http.server 8765 --directory Episodio4
# Open: http://localhost:8765
```

See [`Episodio4/README.md`](./Episodio4/README.md) for full technical documentation.

---

## How This Was Built

Episodio 4 is planned and developed using the **[Learnship](https://github.com/FavioVazquez/agentic-learn) agentic workflow system** — a structured, AI-assisted planning methodology where every phase goes through:

1. **Discovery** — research goals, constraints, and architecture decisions
2. **Planning** — explicit phase plans with requirements and definition of done
3. **Execution** — wave-based implementation with subagent coordination
4. **Verification** — formal UAT (user acceptance testing) with pass/fail results

All planning artifacts live in [`.planning/`](./.planning/) and are kept as first-class project documents.

### Planning structure

```
.planning/
├── PROJECT.md          ← Vision, goals, constraints, key decisions
├── REQUIREMENTS.md     ← REQ-IDs for all v1.0 requirements
├── ROADMAP.md          ← 5-phase plan with status
├── DECISIONS.md        ← 9 architectural decisions with rationale
├── STATE.md            ← Current phase, last activity
└── phases/
    ├── 01-foundation-shell/       ← Phase 1: CSS system, HTML shell, shared JS
    ├── 02-stops-data-navigation/  ← Phase 2: stops.json, 50 stubs, nav
    ├── 03-era1-simulations/       ← Phase 3: Ancient physics sims (12/12 UAT pass)
    └── 04-era2-simulations/       ← Phase 4: Scientific Revolution sims (12/12 UAT pass)
```

### What's been built so far

**Phase 1 — Foundation & Shell** ✓
The entire shared design system: dark luxury aesthetic using CSS4 `oklch()` color, self-hosted Cormorant Garamond and DM Sans fonts, the shared JS shell (`nav.js`, `stop-shell.js`, `progress.js`), and the landing page.

**Phase 2 — Stops Data & Navigation** ✓
All 50 stops defined in `stops.json` with full metadata. Stub pages generated for all 50, navigation chain verified end-to-end.

**Phase 3 — Era 1 Simulations (Ancient Physics)** ✓
Fully interactive simulations for stops 001–011 covering ancient physics:
- Thales — natural causes (particle simulation)
- Democritus — atomic theory
- Aristotle — theory of motion (free fall)
- Archimedes — buoyancy (float/sink physics)
- Eratosthenes — measuring Earth's circumference
- Ptolemy — geocentric model with epicycles
- Copernicus — heliocentric vs geocentric toggle
- Galileo — inclined plane (d ∝ t² graph)
- Galileo — pendulum (isochronism)
- Kepler — orbital laws (RK4, equal-areas, T² ∝ a³)

**Phase 4 — Era 2 Simulations (Scientific Revolution)** ✓
Simulations for the Scientific Revolution (stops 012–013):
- Newton's Laws — F=ma block with friction, velocity graph
- Newton's Cannon — RK4 orbital mechanics, orbit vs escape velocity

All 24 UAT tests passed across Phases 3 and 4. Device pixel ratio scaling applied to all simulations for crisp text on HiDPI displays.

**Phase 5 — Polish & Deployment** (in progress)
Performance audit, accessibility, mobile validation, GitHub Pages deployment.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| HTML | Plain HTML5 — no template engine |
| CSS | CSS4 (`oklch`, `clamp`, custom properties) — no preprocessor |
| JavaScript | ES5 IIFEs — no bundler, no TypeScript |
| Simulations | Vanilla Canvas 2D |
| Physics (simple) | Euler integration |
| Physics (orbital) | RK4 integration |
| Fonts | Cormorant Garamond + DM Sans — self-hosted WOFF2 |
| Hosting | GitHub Pages — zero config required |

---

## About

Built by [Favio Vázquez](https://github.com/FavioVazquez) as part of the Road to Reality project — an ongoing exploration of physics, mathematics, and the tools we use to understand them.
