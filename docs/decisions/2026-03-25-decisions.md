# Decisions — 2026-03-25

*Session: discuss-phase 10 — Era 4 Modern Physics Part A (Stops 027–033)*

---

## [session] Stop 027 (Planck): spectrum comparison + *h* slider

**Context:** Designing the sim for Planck's blackbody radiation stop. The historical significance of Planck's discovery is the gap between the classical prediction and reality — the "ultraviolet catastrophe." Needed a primary visual and controls.

**Paths considered:**
- **A — Spectrum comparison (Rayleigh-Jeans vs Planck):** Two curves on the same graph; temperature + *h* sliders. Shows the gap between classical and quantum predictions directly. The *h* slider lets users watch the Planck curve collapse into the classical one as *h* → 0.
- **B — Glowing body animation:** Object changes color (red → white → blue-white) as temperature rises; spectral bars update. Visceral but hides the math that matters.
- **C — Photon emission animation:** Discrete photon packets fly off the surface. Shows quantization directly but loses the historical "desperate act" framing.

**Chosen:** A — Spectrum comparison + *h* slider

**Rationale:** The discovery *is* the gap between the two curves. Showing both on the same graph makes the problem and solution visible simultaneously. The *h* slider is the key insight: it reveals that classical physics is what you get when you pretend *h* = 0, making quantization feel like a real parameter rather than an arbitrary fix.

**Expected consequences:** More physics depth than the other options. Users who engage with the *h* slider will understand why Planck called quantization "a desperate act" — it was the only value of *h* that made the curve match reality.

**Outcome (to fill later):** _pending_

---

## [session] Stop 028 (Photoelectric): dual sliders with explicit "no effect" feedback + KE readout

**Context:** Designing the photoelectric effect sim. The core insight is that intensity doesn't matter — frequency does. This is counterintuitive and needs to be felt, not just read.

**Paths considered:**
- **A — Frequency threshold demo only:** User slides frequency; below threshold nothing happens, above it electrons eject. Clean but passive.
- **B — Photon energy vs work function graph:** Quantitative view — E = hf line vs φ. More analytical, less visceral.
- **C — Dual sliders (frequency + intensity) with explicit "no effect" feedback:** User can crank intensity at low frequency and see nothing happen. The frustration of intensity-not-working is the "aha." KE readout shows how fast ejected electrons leave.

**Chosen:** C — Dual sliders + KE readout

**Rationale:** The whole point of the photoelectric effect is that intensity is irrelevant — more light doesn't help if the frequency is wrong. You can explain that in text, but having the user *try* to make it work with intensity and fail is the experience that makes it stick. The KE readout (KE = hf − φ) connects the equation to the visual without adding a separate graph.

**Expected consequences:** The "try and fail with intensity" moment should be the most memorable interaction in the stop. The KE readout adds quantitative depth for users who want it without cluttering the primary experience.

**Outcome (to fill later):** _pending_

---

## [session] Stop 029 (Time Dilation): twin paradox scenario

**Context:** Time dilation is invisible at human speeds. Needed a scenario that makes the effect tangible and memorable, with a velocity slider from 0 to 0.99c.

**Paths considered:**
- **A — Two clocks side by side:** Stationary vs moving clock; user sets velocity; clocks diverge. Clean and direct.
- **B — Einstein's light-clock:** Photon bouncing between mirrors shows geometrically *why* time dilates. More physics depth but harder to read.
- **C — Twin paradox:** Traveling twin ages slower; age gap grows live as velocity slider moves. Narrative-rich, immediately tangible.

**Chosen:** C — Twin paradox

**Rationale:** The twin paradox is the most human framing of time dilation — it's about people, not clocks. Showing two ages diverging as velocity increases is viscerally comprehensible in a way that abstract clock faces aren't. The paradox framing ("how can this be?") also prepares users for deeper curiosity.

**Expected consequences:** Users will remember this stop through the age-gap image. The paradox framing may prompt questions about the return journey — that's a feature, not a problem; it signals genuine engagement.

**Outcome (to fill later):** _pending_

---

## [session] Stop 030 (Length Contraction): ruler squash — independent from Stop 029

**Context:** Length contraction is the spatial complement to time dilation, covered in the adjacent stop. Needed to decide both the sim format and whether the two SR stops should share a combined sim.

**Paths considered:**
- **A — Ruler/train car that visibly squashes:** Velocity slider; object narrows as v → c; live length readout. Clean and direct.
- **B — Barn and pole paradox:** Pole fits in barn only at relativistic speed; reveals simultaneity implications. More conceptually rich but complex.
- **C — Spacetime diagram:** Lorentz-transformed worldlines. Accurate but abstract.
- **D1 — Independent sims:** Each stop has its own focused sim.
- **D3 — Combined split-panel sim:** Both effects shown simultaneously.

**Chosen:** A (ruler squash) + D1 (independent sims)

**Rationale:** Each SR stop should have one clear concept and one clear visual. Splitting them across two focused sims lets each effect land on its own terms. The ruler squash is the most direct, unmistakable demonstration of length contraction — no additional narrative required. A combined sim would dilute both effects.

**Expected consequences:** Users who visit both stops will build SR understanding incrementally. The separation may feel slight since the stops are adjacent, but the focused treatment makes each concept cleaner.

**Outcome (to fill later):** _pending_

---

## [session] Stop 031 (E = mc²): mass→energy slider + scale references + relativistic energy connection

**Context:** E = mc² is significant enough to have its own dedicated stop (all others in Phase 10 share a plan with a neighbor). Needed to decide what the sim *does* with a single famous equation.

**Paths considered:**
- **A — Mass→energy conversion slider with real-world scale labels:** User inputs mass; sim shows equivalent energy + live comparisons (TNT tons, atomic bombs, city power hours).
- **B — Relativistic KE vs Newtonian KE comparison:** Two curves on a graph as v → c; shows why the equation matters for fast-moving objects.
- **C — Nuclear binding energy diagram:** Shows where mass "disappears" in fusion/fission. More accurate to real-world use but requires explaining nuclear physics first.
- **D — Annihilation animation:** Electron + positron → two photons. Dramatic but a one-trick animation.

**Chosen:** A + velocity slider showing rest energy + relativistic KE together (connects to SR), with both E = mc² and E² = (pc)² + (mc²)² in KaTeX, and an explicit narrative explanation that E = mc² is the p = 0 special case.

**Rationale:** The mass→energy slider with scale references makes the number land — without it, "a lot of energy" is abstract. The scale labels (TNT, atomic bombs) are the moment of genuine awe. The velocity slider and full relativistic energy equation were added to close the loop with Stops 029/030 — E = mc² doesn't come from nowhere, it's the third leg of Special Relativity. Showing E² = (pc)² + (mc²)² with the narrative explanation turns a famous equation into a comprehensible derivation.

**Expected consequences:** This will be one of the most content-rich stops in Phase 10. The scale references risk feeling gimmicky if overused — keep them as a secondary readout, not the headline. The SR connection via the full equation rewards users who came through Stops 029/030 sequentially.

**Outcome (to fill later):** _pending_

---

## [session] Stop 032 (Rutherford): gold foil scattering with stream + manual aim toggle

**Context:** Rutherford's discovery was statistical — most particles pass through, a few deflect. Needed to decide how to make the scattering experiment interactive.

**Paths considered:**
- **A — Gold foil scattering (stream only):** Continuous fire; statistical distribution emerges. Passive observation.
- **B — Manual aim (impact parameter only):** User aims one particle at a time; sees deflection angle depend on proximity. Tactile but loses the statistical picture.
- **C — Both modes:** Fire stream for statistics + manual aim toggle for single-particle exploration. Full picture.

**Chosen:** C — Both modes + nucleus charge slider

**Rationale:** The discovery is both statistical (most pass through) and individual (some bounce back at large angles). Stream mode makes the distribution visible; manual aim makes the Coulomb repulsion feel physical. Having both lets users explore at the level they want. The nucleus charge slider connects to Coulomb's law from Stop 017.

**Expected consequences:** More UI than other stops. The toggle between modes needs to be obvious — if users miss manual aim mode, they get half the experience. Worth calling out in the narrative.

**Outcome (to fill later):** _pending_

---

## [session] Stop 033 (Bohr): classical collapse first, then quantum fix

**Context:** Bohr's model was a response to a crisis — classical physics predicted electrons should spiral into the nucleus in milliseconds. Needed to decide whether to show that crisis or jump straight to the quantum solution.

**Paths considered:**
- **A — Electron orbit with energy level jumps (quantum only):** Start directly with Bohr's quantized orbits. Clean but loses the "why Bohr was needed" framing.
- **B — Classical collapse first, then Bohr fix:** Sim opens with an electron spiraling inward. User toggles to Bohr's model; the spiral stops, stable orbits appear. The contrast is interactive.
- **C — Hydrogen spectrum builder:** User selects transitions; spectral lines light up. More analytical, less narrative.

**Chosen:** B — Classical collapse first, then Bohr fix

**Rationale:** If you don't see the classical failure, the quantum solution is just "here's how atoms work." If you see the spiral first and then watch it stop when Bohr's quantization kicks in, the model feels like a rescue. The contrast is the entire pedagogical point — and making it interactive rather than just narrated is consistent with the project's "play with it, don't read about it" core value.

**Expected consequences:** The classical collapse animation needs to feel genuinely broken — a pretty spiral would undercut the drama. The toggle moment (collapse → stable orbits) should be the most satisfying interaction in the stop. Risk: users may not realize they need to toggle; the UI cue needs to be clear.

**Outcome (to fill later):** _pending_

---
