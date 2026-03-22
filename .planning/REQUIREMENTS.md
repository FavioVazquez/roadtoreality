# Requirements — How Physics Works
## Milestone v2.0 — Full Spectrum

*Last updated: 2026-03-21*

---

## v2.0 Requirements (In Scope)

### SIM-GAP — Era Gap Fill Simulations

| REQ-ID | Requirement |
|--------|-------------|
| SIM-GAP-01 | Stop 002 (Pythagoras): interactive string simulation using Web Audio API; user controls string length and hears/sees frequency ratios; visualizes harmonics |
| SIM-GAP-02 | Stop 014 (Hooke's Law): spring + weights Canvas 2D; live F vs. x graph; shows elastic and plastic regimes; stress-strain curve for multiple materials |

### SIM-CLS — Era 3: Classical Physics Simulations (015–026)

| REQ-ID | Requirement |
|--------|-------------|
| SIM-CLS-01 | Stop 015 (Bernoulli): particle flow through variable-width tube; pressure gauge readouts; shows pressure drops as velocity increases |
| SIM-CLS-02 | Stop 016 (Euler): three rotating bodies (disk, rod, ring) with same mass; same torque applied; different angular accelerations shown; live ω graph |
| SIM-CLS-03 | Stop 017 (Coulomb): two-particle force field; force vectors; live F vs. r plot; toggle same/opposite sign charges; field lines |
| SIM-CLS-04 | Stop 018 (Volta): circuit schematic with cells; series/parallel toggle; voltage and current readouts update live |
| SIM-CLS-05 | Stop 019 (Faraday): animated magnet moving past coil; galvanometer shows induced current; demonstrates Lenz's law via arrow reversal |
| SIM-CLS-06 | Stop 020 (Carnot): animated PV diagram of Carnot cycle; enclosed area = work; efficiency η = 1 − T_C/T_H displayed live |
| SIM-CLS-07 | Stop 021 (Joule): weight-drop/friction apparatus; live energy pie chart showing PE → KE → heat; total energy conserved |
| SIM-CLS-08 | Stop 022 (Maxwell): animated plane EM wave showing E ⊥ B ⊥ propagation direction; frequency and amplitude sliders |
| SIM-CLS-09 | Stop 023 (Doppler): moving source with wavefront concentric circles; compressed ahead, stretched behind; frequency readout for ahead/behind observers |
| SIM-CLS-10 | Stop 024 (Boltzmann): particle diffusion in box; live histogram of distribution; entropy S = k·ln(Ω) curve rising to equilibrium |
| SIM-CLS-11 | Stop 025 (Hertz): oscillating dipole at center; animated wavefronts radiating outward; E field direction color-coded |
| SIM-CLS-12 | Stop 026 (Michelson-Morley): interferometer schematic; rotation slider shows no fringe shift; explains null result and its significance |

### SIM-MOD — Era 4: Modern Physics Simulations (027–039)

| REQ-ID | Requirement |
|--------|-------------|
| SIM-MOD-01 | Stop 027 (Planck): spectrum plot with classical Rayleigh-Jeans (dashed, diverging) vs. Planck curve (solid); temperature slider shifts peak and color |
| SIM-MOD-02 | Stop 028 (Photoelectric): photon hits metal surface; electrons ejected above threshold; live KE vs. frequency graph; intensity changes count not KE |
| SIM-MOD-03 | Stop 029 (Time Dilation): two animated clocks (one moving, one stationary); moving clock ticks slower; live γ readout and γ vs. v/c graph |
| SIM-MOD-04 | Stop 030 (Length Contraction): moving ruler visually contracts along motion direction only; live L and L/L₀ readout |
| SIM-MOD-05 | Stop 031 (E=mc²): mass slider → energy converted to joules, TNT equivalents, kWh; scale reference objects shown |
| SIM-MOD-06 | Stop 032 (Rutherford): alpha particles scattering off gold foil; live angle histogram; shows most pass through, few scatter wide |
| SIM-MOD-07 | Stop 033 (Bohr): electron orbit rings; transition selector; animated photon emitted; photon color matches transition energy; spectral lines shown |
| SIM-MOD-08 | Stop 034 (General Relativity): 2D grid deformed by central mass; test particle follows geodesic; mass slider affects curvature depth |
| SIM-MOD-09 | Stop 035 (Double Slit): single particles build interference pattern; toggle shows collapse of pattern when one slit blocked or "measured" |
| SIM-MOD-10 | Stop 036 (Schrödinger): ψ(x) and |ψ(x)|² for infinite square well; energy level selector (n=1–10); node count and energy displayed |
| SIM-MOD-11 | Stop 037 (Uncertainty): Δx and Δp sliders; product Δx·Δp ≥ ℏ/2 enforced; wave packet visualization shows tradeoff |
| SIM-MOD-12 | Stop 038 (Pauli): electron shell filling animation; atomic number slider (1–36); electron configuration label updates live |
| SIM-MOD-13 | Stop 039 (Dirac): animated pair production (photon → e⁺e⁻) and annihilation (e⁺e⁻ → photons); energy balance displayed |

### SIM-CON — Era 5: Contemporary Physics Simulations (040–050)

| REQ-ID | Requirement |
|--------|-------------|
| SIM-CON-01 | Stop 040 (Nuclear Fission): chain reaction particle system; neutron count slider; density slider shows critical mass threshold; exponential growth is visible |
| SIM-CON-02 | Stop 041 (Feynman/QED): toggle between particle-view and Feynman diagram view; shows same interaction topology for different parameters |
| SIM-CON-03 | Stop 042 (Big Bang): expanding particle field with Hubble flow grid; time slider (0–13.8 Gyr) with era markers; live v = H₀·d graph |
| SIM-CON-04 | Stop 043 (Standard Model): interactive particle map (12 fermions + 5 bosons); click to highlight interactions by force; animate sample processes |
| SIM-CON-05 | Stop 044 (Higgs Boson): particle-in-medium simulation; temperature slider triggers symmetry breaking; massless → massive transition visible |
| SIM-CON-06 | Stop 045 (Black Holes): light ray paths curving around central mass; event horizon shown; gravitational redshift on escaping rays |
| SIM-CON-07 | Stop 046 (Dark Matter): galaxy rotation curve; observed (flat) vs. predicted-from-visible (Keplerian decline); dark matter halo slider shifts predicted to match observed |
| SIM-CON-08 | Stop 047 (Dark Energy): side-by-side expansion timelines (without/with Λ); matter density and Λ sliders; shows observed acceleration |
| SIM-CON-09 | Stop 048 (Gravitational Waves): two spiraling bodies; animated spacetime ripples; LIGO-style strain signal readout; optional audio chirp |
| SIM-CON-10 | Stop 049 (Quantum Computing): Bloch sphere qubit visualization; theta/phi sliders; measure button collapses to 0/1 with probability; multi-qubit entanglement mode |
| SIM-CON-11 | Stop 050 (Open Questions): interactive map of 6–8 unsolved problems; click to expand each with description and mini-visualization |

### FEAT-SEARCH — Client-Side Search

| REQ-ID | Requirement |
|--------|-------------|
| FEAT-SEARCH-01 | Fuse.js self-hosted; index built from stops.json (title, subtitle, scientist, description, era fields) |
| FEAT-SEARCH-02 | Search modal opens on Cmd/Ctrl+K from any page (landing or stop page) |
| FEAT-SEARCH-03 | Real-time results as user types; result cards show title, scientist, era; keyboard navigation (↑↓ Enter) |
| FEAT-SEARCH-04 | Modal closes on Escape or click-outside; navigates to selected stop on Enter |

### FEAT-KATEX — KaTeX Equation Rendering

| REQ-ID | Requirement |
|--------|-------------|
| FEAT-KATEX-01 | KaTeX fonts, CSS, and auto-render.min.js self-hosted under `assets/katex/` |
| FEAT-KATEX-02 | Auto-render scans stop pages for `$...$` (inline) and `$$...$$` (display) delimiters |
| FEAT-KATEX-03 | KaTeX CSS loaded in `<head>`; JS deferred so it does not block rendering |
| FEAT-KATEX-04 | All key physics equations in implemented stops rendered with KaTeX |

### FEAT-OG — Open Graph Images

| REQ-ID | Requirement |
|--------|-------------|
| FEAT-OG-01 | Each implemented stop has an `og-image.svg` (1200×630) with era-colored background, title, scientist, year badge, site branding | ✓ Phase 07 |
| FEAT-OG-02 | Each stop page includes `og:title`, `og:description`, `og:image`, `og:type`, and `twitter:card` meta tags | ✓ Phase 07 |
| FEAT-OG-03 | A generation script (`scripts/generate-og-svgs.mjs`) reads stops.json and produces all SVG files | ✓ Phase 07 |

### UX — Polish & Usability

| REQ-ID | Requirement |
|--------|-------------|
| UX-01 | Each stub stop (not yet implemented) has a dedicated landing page with: era header, concept preview, prev/next nav to adjacent implemented stops, GitHub contribution link |
| UX-02 | Stub cards on landing page are clickable (not `pointer-events: none`); navigate to stub landing page |
| UX-03 | Keyboard arrow navigation on stop pages: ← prev stop, → next stop |
| UX-04 | Simulation viewport: `min-height: 60vh` on screens ≤768px |
| UX-05 | Body line-height increased to 1.9 (from 1.7) across the site |
| UX-06 | Muted text contrast increased: `--color-text-muted: oklch(0.55 0.02 90)` or higher (target ≥5:1 WCAG AA) |
| UX-07 | Slider controls have tooltip/hint labels showing landmark values (e.g., "0.0 = Earth, 0.9 = Comet") |
| UX-08 | `data-autoplay` attribute on `.sim-wrapper` allows each stop to control whether sim auto-plays on load |
| UX-09 | Mobile sticky prev/next footer nav on screens ≤768px |
| UX-10 | Skeleton screen loader shown while stop page's sim.js initializes |

---

## v2.0 Out of Scope

| Item | Reason |
|------|--------|
| Backend / server-side processing | Static only — confirmed in v1.0 |
| User accounts, progress tracking | Requires backend |
| Full academic citations / equations-first | This is for inspiration, not a textbook |
| WebGL rendering | Canvas 2D sufficient for all planned simulations |
| Build pipeline (webpack, vite, etc.) | Contradicts static-site, no-build constraint |
| Cloudflare Workers for OG images | Overkill for static GitHub Pages site |
| MathJax instead of KaTeX | KaTeX is faster and sufficient for 95% LaTeX subset needed |

---

## v3.0 Candidates (Next Milestone)

- User progress tracking (localStorage-based, no backend)
- Improved accessibility: full keyboard-navigable simulations, screen reader support for canvas
- Multilingual content (at least Spanish)
- Stop-level difficulty ratings / learning path suggestions
- Community contributions flow (PR template, contribution guide)
- Playwright PNG generation for OG images if SVG proves inconsistent
