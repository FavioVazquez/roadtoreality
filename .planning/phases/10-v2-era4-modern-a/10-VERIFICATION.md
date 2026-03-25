---
phase: 10
status: human_needed
verified: 2026-03-25
---

# Phase 10: Era 4 — Modern Physics Part A — Verification

## Must-Have Results

### Plan 10-01 (Stops 027 + 028)

| Plan | Must-Have | Status |
|------|-----------|--------|
| 10-01 | 027 sim.js exposes window.SimAPI with start/pause/reset/destroy set synchronously | ✓ |
| 10-01 | Stop 027 renders Planck (solid) and Rayleigh-Jeans (dashed) curves | ✓ |
| 10-01 | Stop 027 h slider collapses Planck curve onto Rayleigh-Jeans | ✓ |
| 10-01 | Stop 027 index.html has id="temperature-slider" and id="h-slider" | ✓ |
| 10-01 | Stop 027 takeaway-box contains KaTeX E=hf and Planck spectral formula | ✓ |
| 10-01 | 028 sim.js exposes window.SimAPI synchronously | ✓ |
| 10-01 | Stop 028 shows "HIGH INTENSITY — NO EJECTION" when intensity>0.7 and freq<threshold | ✓ |
| 10-01 | Stop 028 KE readout shows 0 when below threshold, updates with freq only | ✓ |
| 10-01 | Stop 028 index.html has id="frequency-slider" and id="intensity-slider" | ✓ |
| 10-01 | Stop 028 takeaway-box contains KaTeX KE=hf-phi | ✓ |
| 10-01 | stops.json isStub: false for orders 27 and 28 | ✓ |
| 10-01 | sim.js files use ES5 IIFEs only — no arrow functions, no const/let | ✓ |
| 10-01 | Both sims use DPR pattern: canvas.width=W*dpr, ctx.setTransform | ✓ |
| 10-01 | Both sims check prefers-reduced-motion and call drawStatic() when true | ✓ |

### Plan 10-02 (Stops 029 + 030)

| Plan | Must-Have | Status |
|------|-----------|--------|
| 10-02 | 029 sim.js exposes window.SimAPI synchronously | ✓ |
| 10-02 | Stop 029 shows two figures with age readouts that diverge as velocity increases | ✓ |
| 10-02 | Stop 029 at v=0: gamma=1.000 (hard-set when beta<0.001); at v=0.99c: gamma≈7.089 | ✓ |
| 10-02 | Stop 029 index.html has velocity-slider (id=velocity-slider, range 0-990) | ✓ |
| 10-02 | Stop 029 takeaway-box contains KaTeX delta-t = gamma * delta-t0 | ✓ |
| 10-02 | 030 sim.js exposes window.SimAPI synchronously | ✓ |
| 10-02 | Stop 030 renders a ruler/train-car that contracts horizontally as velocity increases | ✓ |
| 10-02 | Stop 030 ghost outline (rest length) remains fixed for comparison | ✓ |
| 10-02 | Stop 030 at v=0.99c (slider=990): L readout shows ~14.1 m | ✓ |
| 10-02 | Stop 030 index.html has velocity-slider (id=velocity-slider, range 0-990) | ✓ |
| 10-02 | Stop 030 takeaway-box contains KaTeX L=L0/gamma formula | ✓ |
| 10-02 | stops.json isStub: false for orders 29 and 30 | ✓ |
| 10-02 | Both sim.js use ES5 IIFEs, DPR pattern, prefers-reduced-motion | ✓ |
| 10-02 | Velocity slider range 0-990 / 1000 gives beta; at beta<0.001 gamma hard-set 1.000 | ✓ |

Note on DPR for 029/030: these use `ctx.scale(dpr, dpr)` after setting `canvas.width = W * dpr`. Setting canvas.width resets the context transform automatically per the Canvas spec, so ctx.scale after the reset is functionally equivalent to ctx.setTransform. This is acceptable.

### Plan 10-03 (Stop 031)

| Plan | Must-Have | Status |
|------|-----------|--------|
| 10-03 | 031 sim.js exposes window.SimAPI synchronously | ✓ |
| 10-03 | Mass slider id="mass-slider", range 0-600, logarithmic mapping (slider=300 → 1g) | ✓ |
| 10-03 | Scale reference labels update live: TNT, bombs, city power | ✓ |
| 10-03 | 1g mass correctly displays ~21.48 kilotons TNT | ✓ (verified: 21.48 kt) |
| 10-03 | 1kg mass correctly displays ~21.48 megatons TNT | ✓ (verified: 21.48 mt) |
| 10-03 | Velocity slider id="velocity-slider", range 0-990; canvas shows rest energy bar and KE bar | ✓ |
| 10-03 | formatEnergy() switches units correctly (J, kJ, MJ, GJ, TJ, PJ, EJ) | ✓ |
| 10-03 | Relativistic momentum uses p = gamma * m * v | ✓ |
| 10-03 | index.html takeaway-box contains both $$E=mc^2$$ and $$E^2=(pc)^2+(mc^2)^2$$ | ✓ |
| 10-03 | Narrative explicitly states E=mc^2 is the p=0 special case | ✓ |
| 10-03 | stops.json isStub: false for order 31 | ✓ |
| 10-03 | sim.js is an ES5 IIFE with DPR canvas pattern and prefers-reduced-motion | ✓ |

Note: The mass slider uses range 0-600 (not 0-300 as in one version of the plan). At slider=300: `10^(300/100-6) = 10^(-3) kg = 1 g`. At slider=600: `10^(600/100-6) = 10^0 kg = 1 kg`. The mapping is correct and the default initial value is 300 (1g). The slider range 0-600 provides a wider span (10^-6 kg to 1 kg) than the 0-300 range in the plan spec. The physics is correct.

### Plan 10-04 (Stops 032 + 033)

| Plan | Must-Have | Status |
|------|-----------|--------|
| 10-04 | 032 sim.js exposes window.SimAPI synchronously | ✓ |
| 10-04 | Stop 032 stream mode fires POOL_SIZE=8 alpha particles recycled when off-canvas | ✓ |
| 10-04 | Stop 032 manual aim mode computes theta = 2*atan(D/b) via Rutherford formula | ✓ |
| 10-04 | Stop 032 nucleus charge slider Z changes D and scattering distribution | ✓ |
| 10-04 | Stop 032 index.html has id="nucleus-charge-slider", id="mode-toggle", id="aim-slider" | ✓ |
| 10-04 | 033 sim.js exposes window.SimAPI synchronously | ✓ |
| 10-04 | Stop 033 classical spiral lasts COLLAPSE_DURATION=3500ms (3.5 seconds) | ✓ |
| 10-04 | Stop 033 flash at nucleus when collapse completes (flashAlpha=1.0) | ✓ |
| 10-04 | Stop 033 Bohr toggle button disabled during collapse; enabled after crash | ✓ |
| 10-04 | Stop 033 Bohr mode renders 4 stable orbit rings (n=1 through n=4) | ✓ |
| 10-04 | Stop 033 emission spectrum bar with Balmer line colors: 656nm red, 486nm cyan, 434nm violet | ✓ |
| 10-04 | Stop 033 index.html takeaway-box contains KaTeX E_n=-13.6/n^2 eV | ✓ |
| 10-04 | stops.json isStub: false for orders 32 and 33 | ✓ |
| 10-04 | Both sim.js files are ES5 IIFEs with DPR canvas pattern and prefers-reduced-motion | ✓ |

## Requirement Coverage

| Req ID | Deliverable | Status |
|--------|-------------|--------|
| SIM-MOD-01 (027) | sim.js + index.html with Planck/Rayleigh-Jeans curves, h slider | ✓ |
| SIM-MOD-02 (028) | sim.js + index.html with photoelectric effect, frequency/intensity sliders | ✓ |
| SIM-MOD-03 (029) | sim.js + index.html with twin paradox time dilation, velocity slider | ✓ |
| SIM-MOD-04 (030) | sim.js + index.html with length contraction ruler, velocity slider | ✓ |
| SIM-MOD-05 (031) | sim.js + index.html with E=mc2 + SR energy, mass/velocity sliders | ✓ |
| SIM-MOD-06 (032) | sim.js + index.html with Rutherford scattering, stream+aim modes | ✓ |
| SIM-MOD-07 (033) | sim.js + index.html with Bohr atom, classical collapse + Balmer spectrum | ✓ |
| stops.json | isStub: false for all orders 27-33 | ✓ (verified by node) |

## Integration Checks

| Import | Export exists | Status |
|--------|--------------|--------|
| 027 sim.js → window.SimAPI | start/pause/reset/destroy defined synchronously | ✓ |
| 028 sim.js → window.SimAPI | start/pause/reset/destroy defined synchronously | ✓ |
| 029 sim.js → window.SimAPI | start/pause/reset/destroy defined synchronously | ✓ |
| 030 sim.js → window.SimAPI | start/pause/reset/destroy defined synchronously | ✓ |
| 031 sim.js → window.SimAPI | start/pause/reset/destroy defined synchronously | ✓ |
| 032 sim.js → window.SimAPI | start/pause/reset/destroy defined synchronously | ✓ |
| 033 sim.js → window.SimAPI | start/pause/reset/destroy defined synchronously | ✓ |
| stop-shell.js calls SimAPI.start() | All 7 sims export SimAPI before IIFE closes | ✓ |
| KaTeX scripts (katex.min.js, auto-render.min.js) | Included via defer in all 7 index.html files | ✓ |
| stops.json consumed by search/progress JS | Orders 27-33 isStub=false confirmed by node | ✓ |

## Summary

**Score:** 46/46 automated must-haves verified

All automated checks passed. The following items require human visual testing in a browser:

### Items Requiring Human Testing

1. **Stop 027 — Planck curves render correctly**: Verify the dashed Rayleigh-Jeans (amber) and solid Planck curves are visually distinct on screen. Dragging h-slider to minimum should visually collapse the Planck curve onto the Rayleigh-Jeans line. Background tint should shift from red-brown at 1000K to blue-grey at 10000K.

2. **Stop 028 — Photoelectric effect animation**: Verify photon particles appear and travel toward the metal plate. Below threshold: red "×" flashes appear on impact, "HIGH INTENSITY — NO EJECTION" banner appears at intensity>70%. Above threshold: electron particles fly off the plate. KE readout shows green above threshold, red below.

3. **Stop 029 — Twin paradox animation**: Verify age counters tick visibly with Earth twin advancing faster than traveling twin. Gamma graph in the corner should show a curve with a live dot. Rocket icon should move faster as velocity increases.

4. **Stop 030 — Length contraction animation**: Verify that the contracted train car (solid) is visibly narrower than the ghost outline (dashed) at high velocities. At slider=990, the car should appear ~1/7 the width of the ghost. Car height must not change.

5. **Stop 031 — Energy bars and scale references**: Verify that the logarithmic energy bar, the three scale reference labels (TNT/bombs/city), and the stacked velocity panel bars render correctly. At slider=0 (velocity), only rest energy bar visible; at slider=990, KE bar grows substantially.

6. **Stop 032 — Rutherford scattering**: Verify stream mode shows particles mostly passing straight through with occasional large-angle deflections. Mode toggle should switch between stream and manual aim views. Aim slider should visually change the trajectory angle in real time.

7. **Stop 033 — Bohr atom collapse + spectrum**: Verify the spiral collapse animation runs for ~3.5 seconds before the nucleus flash. The Bohr toggle must be grayed out/disabled until after the crash. In Bohr mode, clicking orbit rings should trigger electron jumps and add colored lines to the spectrum bar.

8. **KaTeX rendering in all 7 stops**: Confirm that no raw `$$...$$` or `\(...\)` markup is visible — all equations must render as formatted math in the browser.

9. **Browser console errors**: Open each stop's index.html in a browser and verify the JavaScript console shows zero errors.
