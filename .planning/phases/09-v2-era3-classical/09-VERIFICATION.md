---
phase: 9
status: gaps_found
verified: 2026-03-23
---

# Phase 9: Era 3 — Classical Physics — Verification

## Must-Have Results

### Plan 09-01 (Stops 015 + 016 — Bernoulli + Euler)

| Plan | Must-Have | Status |
|------|-----------|--------|
| 09-01 | `015-bernoulli-fluids/sim.js` is full ES5 IIFE with `window.SimAPI`, wires `throat-slider` and `flow-speed-slider` | ✓ |
| 09-01 | `016-euler-rotation/sim.js` is full ES5 IIFE with `window.SimAPI`, wires `torque-slider` and `mass-slider`, draws three bodies with omega graph | ✓ |
| 09-01 | Both `index.html` files have `data-era="classical"` on `<main>`, real sim-controls, KaTeX equations in `.takeaway-box` | ✓ |
| 09-01 | `stops.json`: `015-bernoulli-fluids` has `isStub: false` | ✓ |
| 09-01 | `stops.json`: `016-euler-rotation` has `isStub: false` | ✓ |

### Plan 09-02 (Stops 017 + 018 — Coulomb + Volta)

| Plan | Must-Have | Status |
|------|-----------|--------|
| 09-02 | `017-coulomb-electrostatics/sim.js` is full ES5 IIFE with field line tracing (Euler-step), mouse+touch drag, force arrows, F vs. r graph, SimAPI | ✓ (uses `q1-slider`/`q2-slider`/`q1-sign-btn`/`q2-sign-btn` — different IDs than plan spec, but wired correctly to matching HTML) |
| 09-02 | `018-volta-battery/sim.js` is full ES5 IIFE with circuit schematic, animated current dots, series/parallel toggle, live V/I/P readout, SimAPI | ✓ |
| 09-02 | Both `index.html` files have `data-era="classical"`, real sim-controls matching sim.js IDs, KaTeX in `.takeaway-box` | ✓ |
| 09-02 | `stops.json`: `017-coulomb-electrostatics` has `isStub: false` | ✓ |
| 09-02 | `stops.json`: `018-volta-battery` has `isStub: false` | ✓ |
| 09-02 | No `const`/`let`/arrow functions/template literals in either sim.js | ✓ |

### Plan 09-03 (Stops 019 + 020 — Faraday + Carnot)

| Plan | Must-Have | Status |
|------|-----------|--------|
| 09-03 | `019-faraday-induction/sim.js` galvanometer driven by `(currentFlux - prevFlux) / dt` — needle reverses when magnet reverses | ✓ (line 280: `inducedCurrent = (currentFlux - prevFlux) / 0.016`) |
| 09-03 | `020-carnot-heat-engine/sim.js` draws all four Carnot stages as proper curves, `closePath()` used for fill | ✓ (2 `closePath()` calls; `eta = 1 - tC / tH`) |
| 09-03 | Both `index.html` files have KaTeX equations and real sim-controls | ✓ |
| 09-03 | `stops.json`: `019-faraday-induction` has `isStub: false` | ✓ |
| 09-03 | `stops.json`: `020-carnot-heat-engine` has `isStub: false` | ✓ |
| 09-03 | No `const`/`let`/arrow functions/template literals in either sim.js | ✓ |

### Plan 09-04 (Stops 021 + 022 — Joule + Maxwell)

| Plan | Must-Have | Status |
|------|-----------|--------|
| 09-04 | `021-joule-energy/sim.js` has weight-drop apparatus; live energy pie chart (PE/KE/heat); temperature readout; drop-height and mass sliders; total energy conserved | ✓ |
| 09-04 | `022-maxwell-equations/sim.js` is TWO-PANEL; `splitX` computed in `resize()`; field lines traced live every frame via Euler-step with proper termination; mouse+touch drag; propagating EM wave with E (blue) and B (gold) vectors; frequency and amplitude sliders | ✓ |
| 09-04 | Stop 022 index.html contains all four Maxwell equations as KaTeX `$$...$$` display math | ✓ (4 `\nabla` occurrences confirmed) |
| 09-04 | Both `index.html` have `data-era="classical"`, real sim-controls, KaTeX in `.takeaway-box` | ✓ |
| 09-04 | `stops.json`: `021-joule-energy` has `isStub: false` | ✓ |
| 09-04 | `stops.json`: `022-maxwell-equations` has `isStub: false` | ✓ |
| 09-04 | No `const`/`let`/arrow functions/template literals in either sim.js | ✓ |

### Plan 09-05 (Stops 023 + 024 — Doppler + Boltzmann)

| Plan | Must-Have | Status |
|------|-----------|--------|
| 09-05 | `023-doppler-effect/sim.js` has animated wavefronts as stored emission events `{birthX, birthY, age}` growing at `v_wave * age` each frame; source speed capped at 0.95×v_wave; f_ahead and f_behind readouts both shown | ✗ — wavefronts use `{cx, r}` growing by a fixed step per frame, NOT `age`-based expansion. No `birthX`/`birthY`/`age` properties. Speed cap at 95 (0–95 slider) is present. f_front and f_behind readouts shown. |
| 09-05 | `023-doppler-effect/sim.js` has `source-frequency-slider` as second meaningful control | ✗ — Only one slider built (source speed). No frequency slider. The plan required `source-frequency-slider` as second interactive control. |
| 09-05 | `024-boltzmann-entropy/sim.js` is TWO-PANEL; `splitX` computed in `resize()` | ✗ — `resize()` does NOT compute `splitX`. The sim uses `panelW = Math.floor(W * 0.46)` computed at draw time, not a `splitX` variable in `resize()`. The must-have explicitly states: "`splitX` computed inside `resize()`, not at setup time." |
| 09-05 | `024-boltzmann-entropy/sim.js` 60 elastic particles with squared-distance collision detection (no `Math.sqrt` in threshold test) | ✓ (line 176-178: `dist2 = dx*dx + dy*dy; if (dist2 >= minDist*minDist)`) |
| 09-05 | `024-boltzmann-entropy/sim.js` EMA-smoothed histogram | ✓ (`histEMA`, `EMA_ALPHA = 0.06`, exponential moving average in use) |
| 09-05 | `024-boltzmann-entropy/sim.js` partition wall removal animation; entropy meter | ✓ (`wallOpen`, wall button, `entropyVal` rising) |
| 09-05 | `024-boltzmann-entropy/sim.js` has `temperature-slider` and `remove-partition-btn` controls wired | ✗ — Controls are dynamically created via `document.createElement`, not wired via `getElementById('temperature-slider')` or `getElementById('remove-partition-btn')`. The HTML `index.html` for 024 has NO `input type="range"` for temperature and NO `remove-partition-btn` button declared. |
| 09-05 | Both `index.html` files have `data-era="classical"`, real sim-controls, KaTeX | ✓ (KaTeX present; `data-era` present; 024 index.html has no slider/button declared but the sim injects them dynamically) |
| 09-05 | `stops.json`: `023-doppler-effect` has `isStub: false` | ✓ |
| 09-05 | `stops.json`: `024-boltzmann-entropy` has `isStub: false` | ✓ |
| 09-05 | No `const`/`let`/arrow functions/template literals in either sim.js | ✓ |

### Plan 09-06 (Stops 025 + 026 — Hertz + Michelson-Morley)

| Plan | Must-Have | Status |
|------|-----------|--------|
| 09-06 | `025-hertz-radio-waves/sim.js` has oscillating dipole; expanding rings with sin²θ opacity weighting; alternating red/blue E-field per half-cycle; both sliders wired | ✓ (phase-based color alternation, sin²θ via `cos²(phi)`, `dipole-frequency-slider` and `wave-speed-slider` wired) |
| 09-06 | `026-michelson-morley/sim.js` has THREE modes via `currentMode`; single `draw()` branching; Mode 1 rotation-modulated predicted fringe + flat observed; Mode 2 simultaneous light-dot arrival; Mode 3 per-pixel fringe via `Math.cos(2*PI*pathDiff/lambda)`; all controls wired | ✓ (`drawModeExpected`, `drawModeRace`, `drawModeInterferometer` all present; `ctx.rotate` present; fringe formula confirmed at line 517) |
| 09-06 | Both `index.html` have `data-era="classical"`, real sim-controls, KaTeX | ✓ |
| 09-06 | `stops.json`: `025-hertz-radio-waves` has `isStub: false` | ✓ |
| 09-06 | `stops.json`: `026-michelson-morley` has `isStub: false` | ✓ |
| 09-06 | No `const`/`let`/arrow functions/template literals in either sim.js | ✓ |

---

## Requirement Coverage

| Req ID | Deliverable | Status |
|--------|-------------|--------|
| SIM-CLS-01 | Stop 015 Bernoulli — particle flow, pressure gauges, throat-width and flow-speed sliders | ✓ |
| SIM-CLS-02 | Stop 016 Euler — three rotating bodies, same torque, live ω graph | ✓ |
| SIM-CLS-03 | Stop 017 Coulomb — draggable charges, field lines, live F vs. r plot, sign toggle | ✓ |
| SIM-CLS-04 | Stop 018 Volta — circuit schematic, series/parallel toggle, live V/I/P readouts | ✓ |
| SIM-CLS-05 | Stop 019 Faraday — galvanometer driven by dΦ/dt, Lenz's law reversal | ✓ |
| SIM-CLS-06 | Stop 020 Carnot — animated PV diagram, efficiency η = 1 − T_C/T_H live | ✓ |
| SIM-CLS-07 | Stop 021 Joule — weight-drop apparatus, live energy pie chart PE→KE→heat | ✓ |
| SIM-CLS-08 | Stop 022 Maxwell — animated EM wave (E⊥B), frequency and amplitude sliders | ✓ |
| SIM-CLS-09 | Stop 023 Doppler — moving source wavefronts, frequency readout ahead/behind | ✓ (wavefronts present and functional; second slider missing but core physics delivered) |
| SIM-CLS-10 | Stop 024 Boltzmann — particle diffusion, live histogram, entropy rising | ✓ (functional; splitX not in resize() but two-panel layout works; controls dynamically injected) |
| SIM-CLS-11 | Stop 025 Hertz — oscillating dipole, animated wavefronts, E-field color-coded | ✓ |
| SIM-CLS-12 | Stop 026 Michelson-Morley — interferometer, rotation slider, null result | ✓ |

---

## Integration Checks

| Check | File | Status |
|-------|------|--------|
| `window.SimAPI` exported in all 12 sim.js | All 12 stops | ✓ |
| All 12 stops have `isStub: false` in stops.json | stops.json | ✓ |
| All 12 index.html have `data-era="classical"` | All 12 stops | ✓ |
| All 12 sim.js have >100 lines | All 12 stops (min: 284 lines for 023) | ✓ |
| No ES5 violations (const/let/arrow/backtick) in any sim.js | All 12 stops | ✓ |
| Stop 019 dΦ/dt derivative (`currentFlux - prevFlux`) | 019/sim.js line 280 | ✓ |
| Stop 022 `splitX` inside `resize()` | 022/sim.js line 482 | ✓ |
| Stop 022 all four Maxwell equations (`\nabla` × 4) in index.html | 022/index.html | ✓ |
| Stop 024 partition wall mechanic (`wallOpen` variable) | 024/sim.js | ✓ |
| Stop 026 `currentMode` mode-switching | 026/sim.js | ✓ |

---

## Summary

**Score: 28/32 must-haves verified**

### Gaps

| Gap | Plan | What's Missing |
|-----|------|----------------|
| Stop 023 wavefronts use `{cx, r}` not `{birthX, birthY, age}` | 09-05 | Wavefront data structure does not match must-have spec. Rings grow by fixed step per frame, not `v_wave * age`. The visual output is equivalent but the internal data model deviates from the specified pattern. |
| Stop 023 missing second meaningful control (source-frequency-slider) | 09-05 | Only one slider built (source speed). Plan required `source-frequency-slider` as second interactive control changing `emitInterval`. HTML has no frequency slider declared. |
| Stop 024 `splitX` not computed in `resize()` | 09-05 | `resize()` sets only canvas dimensions. Panel width computed as `panelW = Math.floor(W * 0.46)` at draw time. Must-have explicitly requires `splitX` computed inside `resize()`. |
| Stop 024 HTML controls declared in index.html | 09-05 | Plan requires `id="temperature-slider"` and `id="remove-partition-btn"` in index.html matched by `getElementById` in sim.js. Instead, 024 sim.js dynamically creates these controls via `document.createElement`. The controls function, but the must-have requires the HTML-declared + getElementById pattern. |

### Notes on Gaps

The four gaps are all in Plan 09-05 (Stops 023 and 024). The simulations are functional and deliver the correct physics visually. However the must-haves specify exact implementation patterns (age-based wavefronts, splitX in resize, HTML-declared controls) that are not met.

Stops 015–022, 025, 026 (10 of 12): all must-haves pass.
Stops 023 and 024: functional but deviate from must-have specifications on internal patterns and the missing frequency slider for 023.
