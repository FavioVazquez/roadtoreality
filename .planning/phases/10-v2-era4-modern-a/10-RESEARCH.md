# Phase 10: Era 4 — Modern Physics Part A — Research

**Researched:** 2026-03-25
**Phase goal:** Implement all 7 Modern Physics Part A stops (027–033): Planck through Bohr, replacing stub teasers with full interactive sims.

---

## Don't Hand-Roll

| Problem | Recommended solution | Why |
|---------|---------------------|-----|
| Planck spectrum formula | Use the exact dimensionless form from the existing teaser: `B(f) = (x³)/(exp(x)−1)` where `x = hf/kT`, normalized to canvas height | The teaser already has a working scaled version. Extend it rather than re-derive. |
| Lorentz factor γ at v→c | Clamp `beta = Math.min(v/c, 0.9999)` before computing `1/sqrt(1−beta²)` | At v=0.99c, γ≈7.09. At v=0.9999c, γ≈70.7. Without a clamp the formula returns `Infinity` at the slider's max value, crashing the readout. |
| Rutherford scattering angle | Use the exact Coulomb hyperbolic deflection: `cot(θ/2) = b / (k·Z₁Z₂e²/mv²)` in normalized units | Computing the Rutherford formula directly avoids arbitrary "deflection" heuristics like the teaser uses. The half-angle formula degenerates gracefully at large impact parameter b. |
| Bohr energy levels | `E_n = −13.6 eV / n²` (hydrogen) — hardcode the series rather than deriving from first principles | Deriving from constants requires careful unit handling. Hard-coding `−13.6/n²` eliminates unit conversion bugs. |
| Hydrogen spectral line colors | Map Balmer series wavelengths (656nm Hα red, 486nm Hβ cyan, 434nm Hγ violet, 410nm Hδ violet) to CSS/canvas colors directly | Human-eye visible range only; wavelength-to-RGB is notoriously tricky outside 380–700nm. Use a lookup table rather than a formula. |
| Classical electron spiral (Stop 033) | Use a slowly shrinking radius driven by animation time: `r(t) = r_max * exp(-k*t)` with k chosen to collapse in ~3–4 seconds | Actual Larmor radiation decay is far too fast (< 1 ns) to animate meaningfully. An exponential decay with a tuned k constant looks physically plausible and provides the correct visual narrative. |
| Mass-energy scale references (Stop 031) | Hard-code: 1 gram → 8.99×10¹³ J ≈ 21.5 kilotons TNT; 1 kg → 21.5 megatons TNT; 1 kg → ~25 billion kWh | Derive once from `E = mc²` with c = 2.998×10⁸ m/s. Do not recompute at runtime — pre-compute lookup breakpoints to avoid floating-point display surprises. |

---

## Common Pitfalls

### Stop 027: Planck — the h slider collapses in the wrong direction
**What goes wrong:** When `h→0`, the Planck curve should collapse *onto* the Rayleigh-Jeans line (the classical limit). If the normalization of the two curves is different, they diverge instead of converge.
**Why:** The teaser normalizes both curves by `T/4000`. The full sim must keep the same normalization factor for both curves, not just for Planck.
**How to avoid:** At `h = h_slider_value`, compute `x = (h/h_0) * freq / (T/T_ref)` where `h_0` is the real Planck constant equivalent in dimensionless units. Verify at `h→0` that `x→0` and `x³/(exp(x)−1) → x²`, which matches the `freq²` Rayleigh-Jeans formula.

### Stop 027: Temperature slider shifts peak but doesn't update color context
**What goes wrong:** The spectrum peak shifts with temperature (Wien's law: `f_peak ∝ T`), but the canvas background and spectrum color remain fixed, making the change feel arbitrary.
**How to avoid:** Tint the canvas background slightly toward blue-white at high T and red-orange at low T. The teaser already shows a single temperature label; the full sim should make the color shift visible as a secondary cue.

### Stops 029/030: Velocity slider at 0 must show γ = 1 exactly
**What goes wrong:** Floating-point at v=0 gives `sqrt(1 - 0) = 1.0`, which is fine, but the readout may show `γ = 1.00000000001` due to slider precision.
**How to avoid:** When `beta < 0.001`, hard-set γ = 1 and display it as `1.000`. Prevents confusing readout at the "no effect" end of the slider.

### Stop 029: Twin paradox — age gap grows non-linearly and looks broken
**What goes wrong:** At low v (< 0.1c), γ ≈ 1 and the age gap is negligibly small. The sim appears to do nothing for the first 10% of slider travel, then suddenly "activates" near v = 0.5c. Users interpret this as a broken control.
**How to avoid:** Use a logarithmic or squared slider mapping for velocity, OR add explicit text near v = 0 that reads "age gap: essentially zero at this speed." The readout must always show a non-zero (but tiny) value like `0.001 years/year` to communicate the effect is real but tiny.

### Stops 029/030: Displaying the gamma factor — rounding at extremes
**What goes wrong:** At v = 0.99c, γ ≈ 7.089. At v = 0.999c, γ ≈ 22.37. Displaying to 2 decimal places is fine. But if the slider max is set to exactly 0.99 (integer slider mapped 0–99), `beta = 0.99` gives `γ = 7.089`, but the 0.99c label and the computed gamma can appear inconsistent if the slider step is coarse.
**How to avoid:** Use a slider of range 0–990, divide by 1000 to get beta. This gives 3-decimal precision without floating-point snap.

### Stop 031: E = mc² slider — energy numbers go into scientific notation unpredictably
**What goes wrong:** Moving the mass slider from 0.001g to 1 kg spans 6 orders of magnitude in energy. Direct `toFixed()` formatting either truncates small values to `0.00 J` or displays absurdly long numbers at high masses.
**How to avoid:** Write a `formatEnergy(joules)` helper that automatically picks the best unit (J, kJ, GJ, PJ, EJ) with 3 significant figures. Pre-compute the TNT/bomb/kWh thresholds as constants and switch the label text at those breakpoints.

### Stop 031: The full SR energy equation E² = (pc)² + (mc²)² — momentum at rest
**What goes wrong:** When v = 0, p = 0, so E = mc². At v > 0, relativistic momentum is `p = γmv`, not classical `mv`. Using classical momentum with the full energy equation gives wrong results even at moderate velocities.
**How to avoid:** Always compute `p = γ * m * v` where γ is the Lorentz factor. The narrative must explicitly state that `p = γmv`, not `mv`.

### Stop 032: Rutherford — continuous stream mode causes particle pile-up near nucleus
**What goes wrong:** If new alpha particles are spawned before old ones have cleared the nucleus region, they visually pile up and the scattering looks wrong.
**How to avoid:** Use a minimum spawn interval tied to the particle travel time across the canvas. Alternatively, maintain a fixed pool of 6–8 alpha particles and recycle them (reset position to source when they exit the far edge or scatter off-screen).

### Stop 032: Rutherford — deflection angle must depend on impact parameter, not be hardcoded
**What goes wrong:** The teaser uses hardcoded beam rows with fixed deflect values. The full sim's "manual aim" mode requires that as the user adjusts impact parameter b (the Y offset from nucleus), the deflection angle changes continuously.
**Why:** Rutherford's formula: `cot(θ/2) = 2b * E_kinetic / (k * Z₁ * Z₂ * e²)` in normalized units. A smaller b = closer approach = larger deflection. The nucleus charge slider changes Z₂.
**How to avoid:** Compute impact parameter b directly from the user's aim slider value and the nucleus y-position. Map the formula to a deflection angle θ, then compute the scattered trajectory as a two-segment path (incoming straight line + outgoing line at angle θ).

### Stop 033: Bohr — classical spiral must feel "broken" before the toggle
**What goes wrong:** If the classical spiral collapse animation is too brief (< 2 seconds), users click the toggle before they understand why the atom is unstable. The contrast — the whole pedagogical point — is lost.
**How to avoid:** The collapse animation should last at least 3 seconds and end with the electron visibly crashing into the nucleus (a small flash/burst effect). Only then should the toggle button become active. This is a deliberate design choice specified in CONTEXT.md — enforce it in the plan.

### Stop 033: Bohr — emission spectrum line positions must be accurate
**What goes wrong:** If photon colors for level transitions are picked arbitrarily rather than from the Balmer/Lyman series, the spectrum "lines" shown don't match real hydrogen lines that students may recognize.
**How to avoid:** Compute photon energy as `ΔE = 13.6 * (1/n_lower² − 1/n_upper²)` eV. Convert to wavelength via `λ = hc/ΔE`. Map wavelength to canvas x-position on the spectrum bar using a linear scale from 380nm to 700nm. Use the known Balmer wavelengths: n=3→2: 656nm (red), n=4→2: 486nm (cyan-green), n=5→2: 434nm (violet), n=6→2: 410nm (deep violet).

### General: slider wiring — controls declared in HTML must exist before sim.js runs
**What goes wrong:** Several Phase 09 sims (e.g., 023 Doppler) wire sliders by creating them dynamically inside sim.js via `document.createElement`. Others (e.g., 024 Boltzmann) declare sliders in HTML and wire via `document.getElementById`. Both patterns exist. Using the wrong approach for a given stop means the control is wired before the DOM is ready (or after, with a null reference).
**How to avoid:** For Phase 10, follow the Phase 09 majority pattern: declare slider HTML in `index.html`, wire in sim.js via `document.getElementById`. Do not create DOM controls inside sim.js unless there is a specific reason (e.g., the control count is dynamic).

### General: `dpr` (devicePixelRatio) scaling — inconsistency across Phase 09 sims
**What goes wrong:** Some Phase 09 sims (023 Doppler, 024 Boltzmann) use `dpr = window.devicePixelRatio || 1` with `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`. Others (the teaser sims 027–033) use `canvas.width = mount.clientWidth` without DPR. The mixed approach causes some sims to appear blurry on retina screens.
**How to avoid:** All Phase 10 full sims should use the DPR pattern from 023/024. Set `canvas.width = W * dpr`, `canvas.height = H * dpr`, then `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`. All logical coordinates remain in CSS pixels.

---

## Existing Patterns in This Codebase

- **IIFE + SimAPI contract:** All sims wrap in `(function () { 'use strict'; ... }())`. The last action before the closing paren is `drawStatic()`. `window.SimAPI = { start, pause, reset, destroy }` is set synchronously. This is required for stop-shell.js's skeleton-poll and IntersectionObserver to work. See `stop-shell.js` lines 69–79.

- **DPR-aware canvas resize:** Pattern established in 023/024 sims. `var dpr = window.devicePixelRatio || 1;` → `canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);`. Also register `window.addEventListener('resize', ...)` that calls resize + drawStatic when not running.

- **Two-panel layout:** 022 Maxwell and 024 Boltzmann both use `splitX = Math.floor(W * 0.46)` as panel divider, with `drawLeftPanel()` and `drawRightPanel()` functions called inside one `drawFrame()`. Stop 033 (classical vs Bohr mode) could use a toggle rather than a split panel per CONTEXT.md.

- **Slider wiring in HTML + getElementById in sim.js:** Used in 024 Boltzmann (temperature-slider → temperature-readout). The HTML control `<input type="range" id="...">` is placed in `<div class="sim-controls">` in index.html. sim.js calls `document.getElementById('...')` on page load and attaches `'input'` event listeners.

- **Collision physics for particle sims:** 024 Boltzmann has a complete elastic-collision implementation using squared-distance threshold (no `Math.sqrt` in the check loop) at lines 149–177. This can be adapted for Stop 032's alpha particle pool if needed.

- **drawArrow() helper:** 022 Maxwell has a reusable `drawArrow(x1, y1, x2, y2, color, lw)` function (lines 287–306). Useful for vector annotations in any Phase 10 sim.

- **Teaser → full sim continuity:** All 7 Phase 10 stubs have working teaser sims. Each teaser already has the axis structure, color palette, and formula labels established. The full sim should *extend* the teaser's visual language rather than starting from scratch. The existing `planck()` and `rayleigh()` functions in 027 are correct enough to reuse directly.

- **`prefers-reduced-motion` check:** Every sim checks `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and calls `drawStatic()` instead of `requestAnimationFrame(drawFrame)`. This pattern must be maintained in all Phase 10 sims.

- **stop-config JSON block:** `<script id="stop-config" type="application/json">` at top of body (see 024 index.html line 21). stop-shell.js reads this to build breadcrumbs, prev/next nav, share buttons, and arrow-key navigation. Every stop's index.html must have this block — the id, era, prev/next fields are mandatory.

- **`.stop-skeleton` element:** Placed inside `#sim-mount` in HTML (see 024 index.html line 67). stop-shell.js removes it once `window.SimAPI` is set. All Phase 10 index.html files must include it.

---

## Physics Reference Values (Verified)

These values must be used consistently across Phase 10 sims:

| Constant | Value | Used in |
|----------|-------|---------|
| c (light speed) | 2.998 × 10⁸ m/s | 029, 030, 031 |
| γ at v=0.5c | 1.1547 | 029, 030 readout calibration |
| γ at v=0.9c | 2.2942 | 029, 030 readout calibration |
| γ at v=0.99c | 7.089 | 029, 030 readout calibration |
| E_n hydrogen | −13.6 / n² eV | 033 |
| Balmer Hα (n=3→2) | 656.3 nm → red | 033 |
| Balmer Hβ (n=4→2) | 486.1 nm → cyan | 033 |
| Balmer Hγ (n=5→2) | 434.0 nm → violet | 033 |
| 1g mass → energy | 8.99 × 10¹⁰ J ≈ 21.5 kton TNT | 031 |
| 1kg mass → energy | 8.99 × 10¹³ J ≈ 21.5 Mton TNT | 031 |

---

## Recommended Approach

Implement the four plans in pairs/groups following the existing Phase 09 two-sim-per-plan pattern. Plan 10-01 (027+028) and 10-02 (029+030) are the most straightforward: both pairs share a domain (spectrum curve and Lorentz factor) so constants can be verified against each other. Plan 10-03 (031 alone) is the most complex single stop because it requires two linked sliders and a formatted scale-reference display — budget extra lines for the `formatEnergy()` helper and the relativistic momentum computation. Plan 10-04 (032+033) requires the most animation state management: 032 needs a particle pool with Coulomb-correct deflection, and 033 needs a mode toggle with deliberate pacing of the classical-collapse animation. The teaser sims for all 7 stops are safe to extend directly — their `planck()`, `rayleigh()`, clock-drawing, ruler, and orbit logic are already correct enough to build on.
