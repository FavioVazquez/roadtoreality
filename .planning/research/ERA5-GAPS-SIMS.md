# Simulation Research: Era 5 — Contemporary Physics + Era Gap Fills
> Research for v2.0 milestone — compiled 2026-03-21

---

## 002 Pythagoras and Mathematical Harmony

**Core demo:** Musical intervals follow integer ratios of string lengths/frequencies.

**Approach:** Canvas 2D string instrument. Horizontal string that user can pluck or shorten via virtual frets. Show frequency and the ratio relative to the fundamental. Overlay a frequency spectrum (FFT-like display) showing harmonics. Play audio simultaneously using Web Audio API.

**User controls:**
- String length slider (or virtual frets)
- Play/pause sound
- Toggle: show frequency, show waveform, show harmonic series
- Comparison: two strings at different lengths; highlight when intervals are consonant (2:1, 3:2, 4:3)

**Aha moment:** "Perfect intervals are simple ratios. 2:1 is an octave. 3:2 is a perfect fifth. The simpler the ratio, the more harmonious the sound." User can *hear* the difference and *see* the ratio match.

**Pitfalls:** Don't go into equal temperament vs. just intonation. Avoid group theory. Label slider as both "length (cm)" and "frequency (Hz)". Show harmonics as optional visualization to avoid distraction.

---

## 014 Hooke's Law and Elasticity

**Core demo:** Spring restoring force is proportional to displacement: F = -kx. Show the stress-strain curve and the point of failure.

**Approach:** Canvas 2D with two views. Left: spring hanging from ceiling; user adds weights, spring stretches, force vectors shown, F vs. x graph updates live. Right: material sample being stretched, stress-strain curve for different materials (rubber, steel, glass).

**User controls:**
- Mass slider (adds weight, stretches spring)
- Spring constant slider (stiff ↔ stretchy)
- Material selector (rubber, steel, glass)
- Toggle: show vectors, show graph, show breaking point

**Aha moment:** "The spring pulls back *proportionally* to how far you stretch it. This rule holds for most materials — until they break." Live F-x graph shows linear regime, then yield point, then rupture.

**Pitfalls:** Don't go deep into crystal structure or dislocations. Show both elastic (spring returns) and plastic (stays deformed) regimes. Skip Young's modulus jargon or relegate to tooltips.

---

## 040 Nuclear Fission

**Core demo:** Chain reaction cascade — one neutron triggers exponential growth in energy release.

**Approach:** Canvas 2D particle system. Heavy nucleus splits into daughter nuclei + neutrons; those hit nearby nuclei. Layer 1: single fission event. Layer 2: triggered cascade. Layer 3: runaway reaction with exponential energy readout.

**User controls:**
- Initial neutron count (1, 2, 3)
- Density slider (shows critical mass threshold visually)
- Play/pause/reset

**Aha moment:** The exponential growth curve — neutron count exploding from 10 → 50 → 500+ in 2 seconds. Display doubling time prominently. Density display turns red and reads "SUPERCRITICAL" at threshold.

**Pitfalls:** Show neutrons as ballistic (not "seeking"). Avoid complex nuclear terminology. Make exponential growth look *fast* — use 1.5–2× accelerated time. Show critical mass as a visual density threshold, not a number.

---

## 041 Feynman and QED

**Core demo:** Photon-electron scattering. Feynman diagrams as a visual language for particle interactions.

**Approach:** Canvas 2D + SVG overlay for Feynman diagrams. Static diagram shows electron + photon in, virtual photon exchange, electron + photon out. "Run interaction" animates the particle view. Toggle between "particle view" and "Feynman diagram view." Show three different incoming angles side by side — same diagram topology, different numbers.

**User controls:**
- Photon energy slider (0.1–10 MeV)
- Electron initial angle (0–90°)
- "Run interaction" button
- Toggle: particle view ↔ Feynman diagram view

**Aha moment:** "The *shape* of the Feynman diagram encodes the physics. It's a calculator drawn as a picture."

**Pitfalls:** Keep it to "photons carry the electromagnetic force." Don't display the full QED amplitude. Label virtual particles as "force carriers" and note they're mathematical constructs. Add a legend for Feynman diagram line types.

---

## 042 The Big Bang

**Core demo:** Universe expansion from a hot, dense point. Show Hubble's law derived live: recession velocity proportional to distance.

**Approach:** Canvas 2D expanding particle field. Particles spray outward, cooling and dimming (color temperature shift). Coordinate grid expands (Hubble flow). Live distance-vs-time and recession-velocity-vs-distance graphs derive Hubble's law in real time (v = H₀·d).

**User controls:**
- Hubble constant slider (H₀)
- Time slider (0 to 13.8 Gyr) with era markers (atom formation, CMB, first stars, now)
- Toggle grid overlay
- "Show Hubble law" checkbox

**Aha moment:** Drag H₀ up → entire grid expands faster → velocity plot steepens. "Hubble found every galaxy recedes proportionally to distance. This only works if *space itself* is stretching."

**Pitfalls:** Clarify it's not an explosion *into* space but expansion *of* space. Show that any observer sees the same recession pattern (we're not at the center). Mark major eras on the time slider. Avoid "singularity" unless explained.

---

## 043 The Standard Model

**Core demo:** Interactive particle zoo — 17 fundamental particles and which forces act on each.

**Approach:** Canvas 2D. Central arrangement of 12 fermions (6 quarks inner ring, 6 leptons outer ring), surrounded by 4 force carriers (photon, W/Z, gluons, graviton). Click particles to highlight their interactions. Animate specific processes: beta decay, pair annihilation, quark-gluon interaction.

**User controls:**
- Click particles to highlight interactions
- "Show interaction" button (animates selected process)
- Filter by force (EM, weak, strong, gravity)

**Aha moment:** "There are only 17 fundamental particles. Everything in the universe is made from them." The web of connections when particles are clicked makes the Standard Model feel like a complete map.

**Pitfalls:** No Lagrangians or Feynman diagrams here — use simple arrows and labels. Acknowledge gravity's absence: "Graviton is predicted but not yet observed." Avoid "virtual particle" distinction for simplicity.

---

## 044 The Higgs Boson

**Core demo:** Particles acquire mass by interacting with the Higgs field. More interaction = more mass.

**Approach:** Canvas 2D particle-in-medium. Left: particle moving through empty space (constant speed). Right: same particle moving through a viscous medium (Higgs field, shown as color gradient) — slows down, has effective mass. Temperature slider shows symmetry breaking: hot (massless, field off) → cool (field activates, particles slow).

**User controls:**
- Temperature slider (early universe → now)
- Particle type selector (massless photon vs. massive electron vs. very massive top quark)
- Toggle field visualization (scalar, vector, none)
- "Play symmetry breaking" animation

**Aha moment:** "Mass isn't intrinsic. It's an *interaction* with the Higgs field." Watching particles slow as the field activates makes it concrete.

**Pitfalls:** Don't explain the mechanism rigorously. Use the drag analogy. Clarify: Higgs *field* fills space; Higgs *boson* is a ripple in that field. Don't mention Brout-Englert-Guralnik-Hagen-Kibble by name.

---

## 045 Black Holes

**Core demo:** Gravitational lensing and light trapping at the event horizon.

**Approach:** Canvas 2D ray-tracing visualization. Central black disk (event horizon). Geodesic field shown as concentric curves. Fire light rays from the edge: far rays bend slightly, near rays curve sharply, critical-impact rays orbit once and escape, interior rays disappear. Show gravitational redshift as color shift on escaping rays.

**User controls:**
- Black hole mass slider (affects curvature and horizon size)
- Light ray impact parameter slider
- Toggle: show event horizon, show geodesics, show redshift
- Optional: show Hawking radiation particle pairs at horizon

**Aha moment:** "Light is the fastest thing in the universe. If light can't escape, nothing can." A ray asymptotically approaching the horizon, getting redder and slower, makes this visceral.

**Pitfalls:** Avoid "infinitely dense" and "singularity" without explanation. Simplify geodesic computation using geometric optics with a curved refractive index field. Hawking radiation is optional/advanced. Clarify event horizon: "Once you cross it, even light cones tip inward."

---

## 046 Dark Matter

**Core demo:** Galaxy rotation curves — observed velocities are flat; predicted from visible matter alone would fall off. The gap is dark matter.

**Approach:** Canvas 2D top-down galaxy view. Two curves: (1) observed rotation velocity vs. radius (flat), (2) predicted from visible matter (Keplerian decline). User drags a dark matter halo slider and watches the predicted curve shift to match observations.

**User controls:**
- Galaxy visible mass slider
- Dark matter halo mass slider
- View mode: mass distribution, velocity curve, both
- Radius slider (jump to different radii, see mismatch)

**Aha moment:** "Something invisible is holding the galaxy together." When the user's dark matter slider makes the predicted curve match reality, they've *solved* the problem — the emotional payoff lands.

**Pitfalls:** Use "evidence for" not "proof." Don't speculate on what dark matter is (WIMPs, axions). Clarify it's not black holes or dead stars ("We've looked — nowhere near enough mass"). Rotation curves are the primary evidence; mention clusters and lensing only in text.

---

## 047 Dark Energy

**Core demo:** Expansion is accelerating, not decelerating as gravity predicts.

**Approach:** Canvas 2D side-by-side timelines. Left: "Without dark energy" — expansion decelerates (curve flattens). Right: "With dark energy" — expansion accelerates (curve steepens). Overlay observed Type Ia supernova data points; show the data favors acceleration.

**User controls:**
- Dark energy density slider (Λ, cosmological constant)
- Matter density slider
- Time range slider
- Toggle: scenario comparison vs. observed data overlay
- Optional: future scenarios (infinite expansion, heat death)

**Aha moment:** "We expected gravity to slow the expansion. Instead, measurements show it's *speeding up*. Something is pushing space apart — and we have no idea what."

**Pitfalls:** Don't pretend to explain dark energy's nature. Clarify: acceleration began ~5 billion years ago (mark on timeline). "Cosmological constant" is a placeholder. Type Ia supernovae as standard candles: briefly note they measure expansion rate without explaining supernova physics.

---

## 048 Gravitational Waves

**Core demo:** Binary merger radiates spacetime ripples — the chirp signal detected by LIGO.

**Approach:** Canvas 2D showing two spiraling black holes. Animated ripples radiate outward. Simultaneously display the strain signal (LIGO-style readout). As binary spirals in, ripples tighten and signal gets faster and louder. At merger: powerful burst. Then ringdown.

**User controls:**
- Binary mass ratio slider (equal ↔ extreme mass ratio)
- Initial separation slider
- Play/pause
- Toggle: show spacetime grid distortion, show LIGO strain signal, play audio chirp

**Aha moment:** "Space itself is shaking. We can *hear* the collision of two black holes billions of light-years away." The audio chirp (modeled on GW150914) is the emotional hook.

**Pitfalls:** Use a Cartesian grid stretching/compressing perpendicular to wave direction. Use logarithmic time or accelerate the final merger phase. Don't require tensor math: "Gravity travels at light speed in ripples." Mention LIGO's sensitivity (Δx ~ 10⁻¹⁸ m) in text only.

---

## 049 Quantum Computing

**Core demo:** Qubits are different from bits — superposition and entanglement shown on a Bloch sphere.

**Approach:** Canvas 2D. Left: classical bits (0 or 1 shown as lights). Right: qubit as a Bloch sphere with state vector. User rotates the sphere (theta/phi sliders) to set any quantum state. "Measure" button collapses the state to 0 or 1, showing probabilities. Multi-qubit mode: entangle two qubits, measure one, observe the other collapse instantly.

**User controls:**
- Theta/phi sliders (rotate Bloch sphere to set qubit state)
- "Measure" button (collapses, shows |0⟩/|1⟩ probabilities)
- Multi-qubit mode: entangle, measure, observe
- Optional: quantum gate buttons (Pauli-X, Hadamard, CNOT as sphere rotations)

**Aha moment:** "A qubit is both 0 *and* 1 until you look. Entanglement means two qubits are perfectly correlated, even across space." Bloch sphere rotation makes superposition concrete; measurement snapping to a pole is the magic.

**Pitfalls:** Use Copenhagen interpretation for simplicity. Explain the Bloch sphere: "Every point on this sphere is a valid quantum state." Clarify entanglement ≠ faster-than-light communication. Don't mention quantum algorithms (Shor, Grover) in the sim.

---

## 050 The Open Questions

**Core demo:** Interactive map of unsolved problems in physics — each node is a mystery with a mini-visualization.

**Approach:** Canvas 2D web/map of open questions. 6–8 central nodes: "Quantum Gravity," "Dark Matter," "Matter-Antimatter Asymmetry," "Neutrino Masses," "Grand Unification," "Measurement Problem," "Arrow of Time." User clicks a node to see a description and simplified visualization of the unsolved aspect.

**User controls:**
- Click to expand a question
- "Related questions" links between nodes
- Optional: toggle "How to help" showing research pathways

**Aha moment:** "Physics is not finished. The deepest questions remain unanswered — and you could help solve them."

**Pitfalls:** Limit to 6–8 major questions (not 50). Stick to observationally grounded mysteries (no wormholes or time travel speculation). Balance hope with honesty: some may be unsolvable in principle.

---

## General Patterns from Existing Simulations

1. **Canvas 2D** is the sweet spot — no build pipeline, fast, expressive for particles and fields.
2. **RK4 integration** (used in stop 010) worth reusing for differential equations.
3. **p5.js instance mode** works well for algorithmic/generative visuals.
4. **Matter.js** is overkill for most contemporary physics topics — use it only for rigid-body dynamics.
5. **≤5 controls at startup** — reveal complexity progressively.
6. **Live readouts** (numerical labels, real-time graphs) ground abstract concepts.
7. **Visual metaphors** (color=temperature, size=magnitude, speed=time scale) encode physics intuitively.
8. **Web Audio API** is useful for 002 (Pythagoras) and 048 (gravitational wave chirp).
