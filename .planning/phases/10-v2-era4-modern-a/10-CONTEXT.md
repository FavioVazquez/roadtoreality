# Phase 10: Era 4 — Modern Physics Part A — Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement all 7 Modern Physics Part A stub stops (027–033): Planck through Bohr.

Deliverables per stop:
- Full `sim.js` with real interactivity (not just play/pause)
- Updated `index.html` with narrative content and KaTeX equations
- `isStub: false` in `stops.json`

Does NOT touch stops 034–050 — those are Phases 11–13.

Stops in scope:
- 027 Planck and Blackbody Radiation
- 028 Einstein and the Photoelectric Effect
- 029 Special Relativity — Time Dilation
- 030 Special Relativity — Length Contraction
- 031 Einstein and E = mc²
- 032 Rutherford and the Nucleus
- 033 Bohr and the Atom

</domain>

<decisions>
## Implementation Decisions

### Interactivity (all stops)
Carried forward from Phase 09 — minimum 2 meaningful interactive controls per stop. Play/pause-only is not acceptable. The interaction must make the physics clearer.

### Stop 027 — Planck and Blackbody Radiation
- **Primary visual:** Spectrum comparison — two curves on the same graph: the classical Rayleigh-Jeans prediction (diverges in the UV, "ultraviolet catastrophe") vs. Planck's correct curve. The gap between them *is* the discovery.
- **Controls:** Temperature slider + Planck constant *h* slider. User can lower *h* toward zero and watch the Planck curve collapse into the classical prediction — reveals why quantization matters.

### Stop 028 — Einstein and the Photoelectric Effect
- **Primary interaction:** Dual sliders (frequency + intensity) with explicit "no effect" feedback. User cranks intensity at low frequency — nothing happens. Raises frequency past threshold — electrons eject. The frustration of intensity-not-working is the "aha."
- **KE readout:** Show live kinetic energy of ejected electrons (KE = hf − φ). Connects the equation to the visual.

### Stop 029 — Special Relativity: Time Dilation
- **Velocity control:** Slider from 0 to 0.99c — continuous sweep, all effects update live.
- **Scenario:** Twin paradox. Traveling twin ages slower; user sets velocity and watches the age gap grow. Narrative-rich, immediately tangible.
- **Independent sim:** Fully separate from Stop 030 — no shared code or split-panel.

### Stop 030 — Special Relativity: Length Contraction
- **Velocity control:** Same slider approach (0–0.99c) as Stop 029.
- **Visual:** Ruler / train car that visibly squashes along the direction of motion as *v* → *c*. Live length readout (L = L₀√(1 − v²/c²)).
- **Independent sim:** Fully separate from Stop 029.

### Stop 031 — Einstein and E = mc²
- **Primary interaction:** Mass → energy conversion slider (from grams to kilograms). Live display of equivalent energy.
- **Scale references:** Labels update as user moves the slider — "= X tons of TNT", "= Y hours of city power", "= Z atomic bombs." Makes the abstraction concrete.
- **SR connection:** Velocity slider that shows rest energy + relativistic kinetic energy together. User sees how total energy grows as v → c, illustrating that E = mc² is the rest-energy special case.
- **KaTeX equations:** Both E = mc² and the full relativistic energy E² = (pc)² + (mc²)². The narrative explicitly explains that E = mc² is the special case where p = 0 (object at rest), and that the full equation is what Special Relativity actually gives you.

### Stop 032 — Rutherford and the Nucleus
- **Primary visual:** Gold foil scattering experiment — alpha particles fired at gold foil. Most pass through; a few deflect at large angles; rare ones bounce back.
- **Controls:** Both modes — continuous stream fire (to see statistical distribution) + manual aim mode toggle (user adjusts impact parameter to see deflection angle depend on proximity).
- **Nucleus charge slider:** More protons = stronger Coulomb repulsion = more large-angle deflections. Connects back to Stop 017 (Coulomb's Law).

### Stop 033 — Bohr and the Atom
- **Opening:** Sim starts with the *classical* failure — electron spiraling inward as it loses energy by radiation. This is the problem Bohr solved.
- **Toggle to Bohr model:** User switches to quantized orbits; the spiral stops, stable orbits appear. The contrast is interactive, not just text.
- **SR/Rutherford contrast:** index.html narrative notes that Rutherford's nucleus + classical orbits = unstable atom. The sim reinforces this by showing the collapse before the fix.
- **Emission spectrum:** Electron energy level jumps emit photons of the correct color; spectrum builds on the side.

### Claude's Discretion
- Specific animation timing, color choices, and canvas layout for all stops
- Exact mass/energy reference values for Stop 031 scale labels
- Exact Balmer series shown in Stop 033 emission spectrum

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `stop-shell.js`: wires SimAPI, handles play/pause/reset buttons, IntersectionObserver autoplay — all sims get this for free
- `assets/css/simulation.css`: `.sim-container`, `.sim-controls`, `.sim-btn`, slider styles — use as-is
- KaTeX: already self-hosted under `assets/katex/`, auto-renders `$...$` and `$$...$$`
- Share buttons: already injected by stop-shell.js — no sim.js work needed

### Established Patterns
- `window.SimAPI = { start, pause, reset, destroy }` — set synchronously during script execution
- ES5 IIFEs — no arrow functions, no const/let, no template literals in complex expressions
- Canvas sized to `mount.clientWidth / clientHeight` on init; redraw on resize
- `prefers-reduced-motion` check before starting animation loops
- Phase 09 sims (500–800 lines) are the complexity baseline — some Phase 10 sims (031, 033) may run longer

### Integration Points
- `stops.json`: set `isStub: false` per stop when sim is complete
- `index.html` per stop: update narrative content, add KaTeX equations to `.takeaway` section
- No changes needed to nav.js, progress.js, search.js, or stop-shell.js

### Stop 027 existing teaser
- Already has a Planck spectrum teaser animation (temperature sweep, color-coded curves) — the full sim extends this with the Rayleigh-Jeans comparison curve and the *h* slider

</code_context>

<specifics>
## Specific Ideas

### Stop 031 — E = mc²
Real-world scale references are required, not optional. The number must land. Examples: 1 gram = ~21.5 kilotons TNT equivalent; 1 kg = ~21.5 megatons.

### Stop 033 — Bohr
The classical collapse animation is the *setup* — it must play first and feel genuinely broken before the user toggles to Bohr. If the collapse is too brief or too pretty, the contrast is lost.

### Stop 029 — Twin Paradox
The age gap readout is the key number. Show both twins' ages (or elapsed times) side by side, updating live as the velocity slider moves.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 10-v2-era4-modern-a*
*Context gathered: 2026-03-25*
