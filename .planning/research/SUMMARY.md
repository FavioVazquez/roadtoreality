# Research Summary: v2.0 — Full Spectrum
> Compiled 2026-03-21 from ERA3-4-SIMS.md, ERA5-GAPS-SIMS.md, CROSSCUTTING.md, UX-POLISH.md

---

## What We're Building

38 new interactive simulations (stops 002, 014–050) + 3 cross-cutting features (search, KaTeX, OG images) + UX polish across the whole site.

---

## Simulation Approach by Era

### Era gaps (002, 014)
- **002 Pythagoras:** Web Audio API string simulation, frequency ratios, harmonics. Users hear and see the integer ratios that define musical consonance.
- **014 Hooke's Law:** Spring + weights Canvas 2D, live F vs. x graph, stress-strain curve with elastic and plastic regimes.

### Era 3 — Classical Physics (015–026)
All achievable with Canvas 2D + simple math. No heavy engines needed.
- Particle systems: Bernoulli (015), Boltzmann (024)
- Force fields: Coulomb (017), Faraday (019)
- PV/energy diagrams: Carnot (020), Joule (021)
- Wave visualizations: Maxwell (022), Doppler (023), Hertz (025)
- Circuit schematics: Volta (018)
- Interferometer schematic: Michelson-Morley (026)
- Rigid body: Euler (016)

### Era 4 — Modern Physics (027–039)
More abstract — lean on visual metaphors over equations.
- Spectrum plots: Planck (027), Photoelectric (028)
- Clock animations: Time Dilation (029), Length Contraction (030)
- Mass → energy readouts: E=mc² (031)
- Particle scattering: Rutherford (032)
- Orbit + spectral: Bohr (033)
- Grid deformation: General Relativity (034)
- Pattern buildup: Double Slit (035)
- Wave function display: Schrödinger (036), Uncertainty (037)
- Shell filling: Pauli (038)
- Annihilation/pair production: Dirac (039)

### Era 5 — Contemporary Physics (040–050)
Most abstract era — require strong visual metaphors and careful framing.
- Chain reaction particle system: Nuclear Fission (040)
- Feynman diagram + particle view toggle: QED (041)
- Expanding particle field + Hubble law graph: Big Bang (042)
- Interactive particle zoo: Standard Model (043)
- Higgs field viscosity analogy: Higgs Boson (044)
- Ray-tracing: Black Holes (045)
- Galaxy rotation curve: Dark Matter (046)
- Side-by-side expansion timelines: Dark Energy (047)
- Binary merger + LIGO strain signal + audio chirp: Gravitational Waves (048)
- Bloch sphere: Quantum Computing (049)
- Interactive question map: Open Questions (050)

---

## Cross-Cutting Features

### Search → Fuse.js
- Self-host `fuse.min.js` (~10 KB) from jsDelivr download
- Index: `stops.json` fields (title, subtitle, scientist, description, era)
- UI: Cmd/Ctrl+K modal, real-time results, arrow-key navigation
- No build step required

### Equations → KaTeX self-hosted
- Self-host fonts + CSS + auto-render.min.js (~155 KB total)
- Delimiters: `$...$` inline, `$$...$$` display
- Load JS deferred; CSS in `<head>`
- Covers all physics equations needed (95% LaTeX subset is sufficient)

### Open Graph Images → SVG per stop + optional Playwright PNG
- Static SVG per stop (`stops/{slug}/og-image.svg`)
- Template: era-colored background, stop title, scientist name, year badge, branding
- Generate via one-off Node.js script reading stops.json
- If social platforms render SVG inconsistently → convert to PNG via Playwright

---

## UX Polish Priorities

### P1 (ship with v2.0)
- **Stub stop pages:** 38 dead ends → dedicated pages with concept preview, prev/next nav, GitHub link
- **Keyboard arrow navigation** in `stop-shell.js`
- **Mobile sim viewport:** `min-height: 60vh` on screens <768px
- **Line-height:** body 1.9 (from 1.7)
- **Muted text contrast:** `oklch(0.55 0.02 90)` (from 0.50)

### P2
- Sticky mobile prev/next footer
- Slider tooltips + range anchor labels (e.g., "0.0 = Earth, 0.4 = Mercury, 0.9 = Comet")
- Skeleton screen loader for stop pages
- `data-autoplay` attribute per stop

### P3
- CSS View Transitions between stops
- Real-time slider preview feedback
- Header progress bar

---

## Technical Constraints Confirmed

All simulations: Canvas 2D with `requestAnimationFrame`. Use p5.js instance mode for algorithmic/generative visuals. Use RK4 integration for differential equations (already established in stops 010/011). Matter.js only if rigid-body physics is essential (minimal for these topics). No new vendor libraries beyond Fuse.js and KaTeX.

**Performance budget per simulation:**
- Physics: ~10ms per frame
- Rendering: ~6ms per frame
- Target: 60fps on mid-range device
- Mobile: reduce particle counts, respect `prefers-reduced-motion`

---

## Risks

1. **Volume:** 38 simulations is a large body of work. Quality over speed — each simulation needs the "aha moment" to land. Plan to batch by era and validate each era's quality before moving to next.
2. **Era 5 abstraction:** Contemporary physics (dark matter, dark energy, quantum computing, Higgs) is intrinsically abstract. Visual metaphors must be strong or stops will feel empty. Research gives specific guidance per stop.
3. **KaTeX font loading:** First-time visitors incur a ~60 KB font download. Load fonts async and consider a `font-display: swap` strategy.
4. **OG image SVG compatibility:** Twitter and some social platforms may not render SVG in previews. The Playwright PNG fallback handles this but requires running a script manually.
