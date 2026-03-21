# Simulation Research: Era 3 — Classical Physics & Era 4 — Modern Physics
> Research for v2.0 milestone — compiled 2026-03-21

---

## ERA 3 — CLASSICAL PHYSICS (Stops 015–026)

## 015 Bernoulli's Principle
**Core demo:** Fluid speed inversely correlates with pressure. Water flowing through a narrowing tube speeds up and pressure drops.

**Approach:** Canvas 2D particle system (50–100 particles) flowing through a pipe with variable cross-section. Pressure gauge readouts at different points. Measure local density as a pressure proxy. Animate streamlines to show flow pattern.

**User controls:**
- Tube diameter slider (cross-sectional area)
- Flow rate slider (inlet velocity)
- Toggle: pressure visualization (gauge readings vs. particle density heatmap)

**Aha moment:** Narrowing the tube causes pressure to drop simultaneously with speed increase. Real-world anchor: "This is why airplane wings have curved surfaces — high speed over the wing means low pressure, creating lift."

**Pitfalls:** Cap particles at 100, pre-allocate array. Pressure calculation must use local particle count. Avoid viscosity effects. Reduce particle count on mobile for performance.

---

## 016 Euler and Rigid Body Rotation
**Core demo:** Moment of inertia is the rotational analog of mass. Same torque, different mass distributions → different angular accelerations.

**Approach:** Canvas 2D with three objects (disk, rod, ring) with identical mass but different I values. Apply same torque; show different angular accelerations. Live ω vs. τ graph.

**User controls:**
- Object selector (disk / rod / ring)
- Applied torque slider (0–10 N·m)
- Play/pause, reset

**Aha moment:** "Same force, different rotation rate — because more mass is far from the axis." Show I = Σm·r² highlighted for each object.

**Pitfalls:** Anchor each shape to a real object (wheel, propeller, dumbbell). Consistent time step to avoid instability. Show one object at a time for clarity.

---

## 017 Coulomb's Law
**Core demo:** Two charged particles repel/attract with force ∝ 1/r². One fixed, one draggable.

**Approach:** Canvas 2D. Force vectors shown. Live F vs. distance plot. Color-code charges (red = +, blue = −). Field lines emanating from charges.

**User controls:**
- Charge magnitudes Q₁ and Q₂ (±10 μC sliders)
- Separation distance (slider or direct drag)
- Toggle: field lines / force vectors / graph
- Toggle: same sign (repulsion) vs. opposite sign (attraction)

**Aha moment:** Particle accelerates dramatically at short range — inverse square is dramatic. Change charge magnitude and see F scale with Q₁·Q₂. Overlay the 1/r² curve on the live data.

**Pitfalls:** Clamp minimum distance to avoid singularity. Use logarithmic scale at small distances. Pre-compute or limit field lines to ~20 per charge. Allow tap + arrow keys as mobile alternative to drag.

---

## 018 Volta and the Electric Battery
**Core demo:** Cells in series add voltage; cells in parallel add current capacity.

**Approach:** SVG or Canvas 2D circuit schematic. Cells as labeled rectangles with polarity. Wire connections. Resistive load. Voltmeter and ammeter readouts update based on configuration.

**User controls:**
- Add/remove cells (max ~6)
- Toggle series/parallel layout
- Cell EMF slider (0.5–2 V per cell)
- Internal resistance slider
- Display: total V, total A, power dissipated

**Aha moment:** Series: 1.5V + 1.5V = 3V. Parallel: voltage stays 1.5V but current capacity doubles. Real-world anchor: battery packs in power tools mix both.

**Pitfalls:** Correct circuit symbols and clear polarity. Include internal resistance to show voltage sag. Always maintain valid topology. Avoid streaming electron animations.

---

## 019 Faraday's Electromagnetic Induction
**Core demo:** Moving magnet near a coil induces current proportional to the rate of flux change.

**Approach:** Canvas 2D. Animated magnet (disk with N/S labels) moving toward/past a coil. Field lines animate. Galvanometer shows current spiking when magnet moves fast, peaking at center, reversing on exit.

**User controls:**
- Magnet speed slider (or draggable magnet with speed control)
- Magnet strength slider
- Coil orientation (perpendicular vs. parallel to motion)
- Play/pause/reset

**Aha moment:** "Current spikes when the magnet is moving — standing still, nothing. The *rate of change* of flux matters." Intuition for E = −dΦ/dt.

**Pitfalls:** Use SVG paths with animated dashing or pre-computed field lines — don't animate hundreds. Show Lenz's law via arrow reversals. Make motion user-draggable or auto-animated with speed control.

---

## 020 Carnot and the Heat Engine
**Core demo:** Work extracted from temperature difference. Efficiency increases with wider temp gap.

**Approach:** Canvas 2D animated PV diagram. Closed Carnot cycle path on P-V plane. Shade enclosed area (work extracted). Show hot/cold reservoir temps, heat flows Q_H and Q_C. Display η = (Q_H − Q_C)/Q_H dynamically.

**User controls:**
- Hot reservoir temperature (K)
- Cold reservoir temperature (K)
- Cycle animation speed
- Toggle: PV diagram / T-S diagram / Sankey energy flow

**Aha moment:** "Wider gap between hot and cold = more work. But no engine can convert all heat to work." Show η = 1 − T_C/T_H calculated live.

**Pitfalls:** Anchor with a real engine. T-S diagram is equivalent but harder for general audiences. Don't show individual molecules. Label it as a theoretical maximum.

---

## 021 Joule and Conservation of Energy
**Core demo:** Mechanical work converts to thermal energy. Total energy is conserved.

**Approach:** Canvas 2D weight-drop or friction apparatus. Show mass falling, compressing spring, or block sliding. Live energy pie chart or stacked bar: gravitational PE → KE → elastic PE → heat. Track total energy (E_initial = E_spring + E_heat).

**User controls:**
- Drop height slider
- Mass slider
- Spring constant or friction coefficient
- Play/pause/reset

**Aha moment:** "Drop from higher → more PE → more compression → more heat. The energy goes somewhere — it's always conserved." Track total energy to prove it.

**Pitfalls:** Always show the energy accounting equation. Make temperature rise visible (color change or digital readout). Keep energy conservation as the primary story.

---

## 022 Maxwell's Equations
**Core demo:** Time-varying E and B fields propagate as waves. Both oscillate perpendicular to each other and to propagation direction.

**Approach:** Canvas 2D perspective rendering (or 2D projection). Plane wave propagating left-to-right. E field as vertical sinusoid, B field as horizontal sinusoid (perpendicular to E). Propagate in real time at speed c.

**User controls:**
- Frequency slider
- Amplitude slider
- Toggle: show E field / B field / both
- Toggle: 1D slice / 3D perspective

**Aha moment:** "Light is a wave of electric and magnetic fields vibrating together, perpendicular to each other. c = 1/√(ε₀μ₀). This is literally electromagnetic radiation — radio, microwaves, light, X-rays."

**Pitfalls:** 2D projection is clearer than 3D for most users. Don't show particles riding the wave. Focus on the conceptual wave, not the full equation set. Keep mobile animation smooth.

---

## 023 Doppler Effect
**Core demo:** Source motion compresses wavefronts ahead (higher frequency) and stretches them behind (lower frequency).

**Approach:** Canvas 2D. Animated source (circle) moving left-right. Concentric wavefronts emitted. Spacing compressed ahead, stretched behind. Frequency readout for observer ahead and behind. Optional audio tone playback.

**User controls:**
- Source velocity slider (Mach 0–0.3)
- Source frequency slider (Hz)
- Toggle: show wavefronts / show Doppler formula
- Optional: play tone for observer ahead/behind

**Aha moment:** "Same frequency emitted, but wavefronts bunch up in front and spread out behind. You hear it every time an ambulance drives past."

**Pitfalls:** Avoid supersonic (Mach > 1) unless explicitly teaching shock waves. Stick to sound (not light Doppler) for intuition. Visual demonstration alone is sufficient; audio is optional.

---

## 024 Boltzmann and Entropy
**Core demo:** Particles spontaneously spread to the most probable (maximum entropy) state.

**Approach:** Canvas 2D. 200–500 particles start in one half of a box. Remove the wall; particles diffuse randomly to equilibrium. Live histogram of count per chamber. Plot entropy S = k·ln(Ω) rising over time.

**User controls:**
- Initial configuration: all left / all right / random
- Temperature slider (affects particle speed)
- Particle count (10–500)
- Play/pause/reset
- Display: histogram, entropy curve, microstate count

**Aha moment:** "Particles spread out because there are overwhelmingly more arrangements with them spread than bunched. Entropy is counting arrangements — probability, not disorder."

**Pitfalls:** Define entropy as ln(Ω), not "disorder." Use ≥200 particles for reliable statistics. Particle-particle collisions not required — random walks suffice. Don't say "entropy always increases" — say "entropy tends toward the most probable state."

---

## 025 Hertz and Radio Waves
**Core demo:** An oscillating dipole radiates electromagnetic waves outward.

**Approach:** Canvas 2D. Vertical dipole at center (two spheres oscillating up/down). Concentric circles radiate outward, color-coded by E field direction (+/−). Animate wave propagation while dipole oscillates.

**User controls:**
- Oscillation frequency slider
- Radiation strength visualization
- Play/pause
- Toggle: dipole oscillation / radiated waves / both

**Aha moment:** "An oscillating pair of charges radiates energy as electromagnetic waves — this is literally how a radio antenna works."

**Pitfalls:** Show the effect (dipole → waves), not the derivation. Avoid high frequencies where λ gets too small to render clearly. Use requestAnimationFrame efficiently for smooth mobile animation.

---

## 026 Michelson-Morley Experiment
**Core demo:** The interferometer shows no fringe shift despite Earth's motion — the null result that killed the ether hypothesis.

**Approach:** Canvas 2D schematic. Light source, beam splitter, two perpendicular mirrors, recombining point. Animate light rays bouncing. Show interference fringe pattern on screen. Apparatus rotation slider shows no fringe shift.

**User controls:**
- Light source wavelength slider
- Mirror separation (arm length) slider
- Apparatus rotation slider (0–90°)
- Display: path length difference, phase difference, fringe visibility

**Aha moment:** "Rotating the apparatus should shift the fringes if Earth moved through ether. It doesn't. This null result was the death knell for ether — and a hint that Einstein was right." Bridge to LIGO (same principle).

**Pitfalls:** Use a clear labeled schematic. Explain that a null result *is* the discovery. Simplify to essential physics — no fine mechanical details.

---

## ERA 4 — MODERN PHYSICS (Stops 027–039)

## 027 Planck and Blackbody Radiation
**Core demo:** Classical physics predicts infinite UV radiation (UV catastrophe); Planck's quantization (E = hf) fixes it.

**Approach:** Canvas 2D spectrum plot. X-axis = wavelength, Y-axis = intensity. Two curves: classical Rayleigh-Jeans (dashed, diverging in UV) vs. Planck (solid, peaks and rolls off). Temperature slider shifts the curve and changes color (1000K = red, 6000K = yellow/white, 10000K = blue).

**User controls:**
- Temperature slider (1000–10000 K)
- Toggle: classical curve / Planck curve / both
- Display: peak wavelength, total radiated power, real-world examples (incandescent, sun, hot star)

**Aha moment:** "Classical physics says infinite UV energy — obviously wrong. Planck's fix: energy comes in chunks E = hf. That single assumption launches quantum mechanics."

**Pitfalls:** Use the word "catastrophe" (UV catastrophe) — it's dramatic and memorable. Anchor h: E = hf = (6.626×10⁻³⁴ J·s) × f. Use a physical blackbody color LUT for temperature-color mapping.

---

## 028 Einstein Photoelectric Effect
**Core demo:** Light ejects electrons based on frequency, not intensity. Below threshold frequency, no ejection regardless of brightness.

**Approach:** Canvas 2D. Metal surface with incoming photons. Electrons ejected when hf > W (work function). Live graph: KE vs. frequency with clear threshold line. Intensity slider affects ejection rate, not KE.

**User controls:**
- Light frequency slider (IR → UV)
- Light intensity slider (photon density)
- Metal choice (different work functions: copper, sodium, cesium)
- Display: threshold frequency, KE of ejected electrons, hf, work function W

**Aha moment:** "A thousand weak red photons can't do what one UV photon can. Einstein showed light is quantized — photons with energy E = hf."

**Pitfalls:** Phrase carefully: "discrete energy packets," not "little bullets." Show intensity affecting count, not KE — this is often misconceived. Different metals show different work functions.

---

## 029 Special Relativity: Time Dilation
**Core demo:** A moving clock runs slow. γ = 1/√(1 − v²/c²) grows dramatically near c.

**Approach:** Canvas 2D. Two clocks: one at rest, one moving. Both animate simultaneously — moving clock ticks slower. Live γ readout. Graph of γ vs. v/c showing divergence as v → c.

**User controls:**
- Velocity slider (0–0.99c)
- Display: velocity, v/c, γ factor, moving-clock proper time, lab-frame time, dilation ratio

**Aha moment:** "At 0.99c, γ ≈ 7 — a spaceship ages only 7 years while 50 years pass on Earth. Time is relative." Real-world: muon decay — muons reach Earth instead of decaying mid-atmosphere because their clocks run slow.

**Pitfalls:** Don't combine with length contraction or mass increase; focus only on time dilation. The γ vs. v/c graph is essential. Avoid deriving the Lorentz transformation.

---

## 030 Special Relativity: Length Contraction
**Core demo:** A moving ruler appears foreshortened along its direction of motion. L = L₀/γ. Perpendicular dimensions unchanged.

**Approach:** Canvas 2D. Two rulers: one at rest, one moving horizontally. Animate contraction along motion direction only. Display proper length and contracted length.

**User controls:**
- Velocity slider (0–0.99c)
- Display: L₀, L, L/L₀ ratio, v/c, γ
- Toggle: 1D ruler vs. 2D rectangle to show direction specificity

**Aha moment:** "A meter stick at 0.99c appears only 0.14 meters long — but only along its direction of motion. This is spacetime geometry, not physical squashing."

**Pitfalls:** Clarify it's real (measurements yield this result) but not "compression." Only the motion dimension is affected. Don't conflate with time dilation.

---

## 031 E = mc²
**Core demo:** Mass and energy are equivalent. A tiny mass converts to enormous energy.

**Approach:** Canvas 2D. (a) Mass slider → E in joules, megaton TNT, kilowatt-hours. (b) Animated electron-positron annihilation → two photons. Real-world scale references.

**User controls:**
- Mass slider (grams to kilograms)
- Display: E in joules, TNT equivalents, kWh
- Object selector (grain of sand, apple, person, car) for scale

**Aha moment:** "1 gram of matter → 20 kilotons of TNT (Hiroshima). This is why nuclear reactions release such enormous energy."

**Pitfalls:** E = mc² is rest energy, not kinetic energy — clarify this. Nuclear energy comes from binding energy, not "direct mass conversion." Use scale references to make the number meaningful.

---

## 032 Rutherford and the Atomic Nucleus
**Core demo:** Alpha particles scatter at large angles off gold foil — revealing a tiny, dense nucleus. Most pass straight through.

**Approach:** Canvas 2D. Alpha particles (red dots) approach gold foil. Coulomb repulsion curves trajectories near nuclei. Live histogram of scattering angles showing most go forward, few scatter wide.

**User controls:**
- Alpha particle energy slider
- Foil thickness slider
- Toggle: single trajectory / ensemble
- Display: scattering angle histogram, interpretation

**Aha moment:** "Rutherford expected particles to barely deflect (plum pudding model). A few bounced straight back. He realized atoms are mostly empty space with a tiny, dense nucleus."

**Pitfalls:** Stay classical — no quantum mechanics needed here. The angle histogram is essential. Show the "plum pudding" prediction vs. actual result for contrast.

---

## 033 Bohr's Model of the Atom
**Core demo:** Electrons occupy discrete energy levels. Transitions between levels emit/absorb photons at specific frequencies.

**Approach:** Canvas 2D. Nucleus with electron orbit rings. Select electron transitions; electron jumps and emits a colored photon (wavelength matches transition energy ΔE = hν).

**User controls:**
- Electron shell selector (n = 1–4)
- Initial and final shell for transition
- Display: energy levels, ΔE, ν, λ, photon color
- Toggle: electron positions / energy level diagram

**Aha moment:** "Electrons can only be at specific energies. Each jump emits a photon with exactly that energy — that's why each element has a unique spectral fingerprint."

**Pitfalls:** Label Bohr's model as a useful approximation (not accurate for multi-electron atoms). Say "energy levels" more than "orbits." Show hydrogen-specific spectral lines.

---

## 034 General Relativity: Curved Spacetime
**Core demo:** Massive objects curve spacetime. Objects follow geodesics (shortest paths on the curved surface) — that's "gravity."

**Approach:** Canvas 2D grid. Central mass warps the grid into a "well." Test particle orbits by following geodesics on the curved surface — no invisible force needed.

**User controls:**
- Central mass slider (affects curvature depth)
- Test particle velocity slider (orbit shape)
- Toggle: grid deformation / geodesics / particle trajectory
- Display: curvature at various distances, orbit shape

**Aha moment:** "Gravity isn't a force — spacetime curves, and you follow the shortest path through that curvature."

**Pitfalls:** Acknowledge the 2D grid analogy is incomplete (spacetime is 4D). Animate the particle following the path explicitly. Real-world: GPS must account for spacetime curvature.

---

## 035 Wave-Particle Duality (Double Slit)
**Core demo:** Single photons/electrons build an interference pattern when both slits are open. "Observing" which slit destroys the pattern.

**Approach:** Canvas 2D double-slit setup. Particles arrive one-by-one and build the detector pattern. Toggle: both slits open → interference fringes; one slit blocked → two simple maxima; measurement at slit → no interference.

**User controls:**
- Wavelength slider (affects fringe spacing)
- Toggle: both slits / one slit / both + measurement
- Display: live histogram of particle hits
- Reset button

**Aha moment:** "Photons act like waves and interfere with themselves. Measure which slit they go through — and suddenly they act like particles. Quantum weirdness!"

**Pitfalls:** Don't say "the photon knows it's being observed" — say "measurement introduces momentum exchange." Show buildup over many particles (single particle doesn't show interference). Use Copenhagen interpretation.

---

## 036 Schrödinger Wave Equation
**Core demo:** A particle in a box has discrete energy levels. ψ(x) describes probability; higher energies have more nodes.

**Approach:** Canvas 2D. 1D infinite square well. Draw ψ(x) and |ψ(x)|² for energy levels n = 1, 2, 3, ... A dropdown selects n; wave function and energy update.

**User controls:**
- Well width slider
- Energy level selector (n = 1–10)
- Toggle: show ψ(x) / show |ψ|²
- Display: energy Eₙ, node count, wavelength

**Aha moment:** "The particle can't have arbitrary energy — it's quantized. Standing waves inside the box correspond to allowed energies. More nodes = higher energy."

**Pitfalls:** ψ is not directly observable; |ψ|² is probability density — explain this carefully. Pre-compute eigenfunctions; don't solve live. Start with infinite well.

---

## 037 Heisenberg Uncertainty Principle
**Core demo:** Δx · Δp ≥ ℏ/2. Smaller position uncertainty → larger momentum uncertainty, and vice versa.

**Approach:** Canvas 2D. Two sliders: Δx and Δp. Live product displayed. Wave packet visualization: narrow packet (small Δx) → broad frequency spectrum (large Δp).

**User controls:**
- Position uncertainty slider (Δx)
- Momentum uncertainty slider (Δp)
- Display: Δx, Δp, product Δx·Δp, minimum (ℏ/2), wave packet

**Aha moment:** "Measure position exactly — momentum becomes uncertain. This isn't measurement error; it's a fundamental property of quantum states."

**Pitfalls:** Emphasize it's not experimental error but a fundamental quantum property. ℏ is tiny — uncertainty only matters at atomic scales. Real-world: electron microscope resolution vs. diffraction tradeoff.

---

## 038 Pauli Exclusion Principle
**Core demo:** No two electrons can have the same quantum state. Electron shells fill in order, creating the periodic table.

**Approach:** Canvas 2D. Visual electron shell/subshell diagram. "Add electron" button places each new electron in the lowest available state with spin indicator. Shows electron configuration live.

**User controls:**
- Atomic number slider (1–36, first ~4 shells)
- Display: electron configuration (e.g., 1s² 2s² 2p⁶), element name
- Toggle: shell structure / subshell structure / spin

**Aha moment:** "No two electrons can be identical — this strict rule is why the periodic table has its structure. Chemistry follows from electron configurations."

**Pitfalls:** Use "state" or "orbital," not "orbit." Aufbau filling order is empirical here. Show spin as up/down arrows without spinor math. Keep to first 36 elements for clarity.

---

## 039 Dirac and Antimatter
**Core demo:** Dirac's equation predicts antiparticles. Pair production (photon → e⁺e⁻) and annihilation (e⁺e⁻ → photons) conserve energy.

**Approach:** Canvas 2D. Two scenarios: (a) pair production — gamma ray converts into electron-positron pair; (b) annihilation — electron + positron → photons. Show energy balance: E_photon = 2m_e·c² + KE.

**User controls:**
- Photon energy slider (pair production)
- Particle momentum slider (annihilation, affects photon directions)
- Toggle: pair production / annihilation / both
- Display: energy balance, particle energies, momentum conservation

**Aha moment:** "Dirac predicted a mirror image of the electron — the positron. We detect them in PET scans and particle accelerators. This is real."

**Pitfalls:** Keep it physics-based, not sci-fi. Pair production requires a nucleus nearby (momentum conservation). Connect back to E = mc². Real-world: PET imaging uses positron-electron annihilation.

---

## Cross-Cutting Technical Guidelines (All Eras)

### Performance
- `requestAnimationFrame` exclusively — never `setInterval` for animation
- Batch draw calls by state (particles → vectors → text)
- Pre-render static backgrounds to off-screen canvases
- Target 60fps; ~10ms physics budget, ~6ms rendering budget
- Canvas dimensions: `container.clientWidth`, not hardcoded pixels
- Recalculate on `window.resize`, redraw immediately

### Mobile
- `touch-action: none` on drag-sensitive canvases
- Register both mouse and touch events
- Respect `prefers-reduced-motion`

### Every simulation must have:
- `aria-label` on canvas, `aria-label` on all sliders
- A reset button
- A description below the canvas

### Pedagogical arc for every stop
1. **Hook:** What was the puzzle? Why does this matter?
2. **Simulation:** Explore with clear controls and immediate feedback
3. **Principle:** Plain language first, then formula
4. **Real-world anchor:** Where does this appear in daily life?
5. **Bridge:** How does this enable the next discovery?

---

## Summary Table

| Stop | Primary Approach | Key Metric |
|------|-----------------|------------|
| 015 Bernoulli | Particle flow + pressure gauge | Pressure vs. velocity |
| 016 Euler | Rotating bodies + angular accel graph | I vs. τ |
| 017 Coulomb | Two-particle force field + F vs. r plot | F ∝ 1/r² |
| 018 Volta | Circuit schematic + V/I readouts | Series vs. parallel |
| 019 Faraday | Animated magnet + coil + galvanometer | Current vs. dΦ/dt |
| 020 Carnot | PV diagram + Sankey energy flow | η = 1 − T_C/T_H |
| 021 Joule | Drop/compress + energy pie chart | Energy conservation |
| 022 Maxwell | Animated EM wave (E ⊥ B ⊥ propagation) | c = 1/√(ε₀μ₀) |
| 023 Doppler | Moving source + wavefront spacing | Frequency shift |
| 024 Boltzmann | Particle diffusion + entropy curve | S = k·ln(Ω) |
| 025 Hertz | Oscillating dipole + radiating waves | Antenna radiation |
| 026 Michelson-Morley | Interferometer schematic + null fringe | Null result |
| 027 Planck | Spectrum: classical vs. Planck curves | E = hf, peak λ |
| 028 Photoelectric | Photon hits + KE vs. frequency graph | hf = W + KE |
| 029 Time Dilation | Two clocks + γ vs. v/c graph | t' = γ·t |
| 030 Length Contraction | Moving ruler + contraction ratio | L = L₀/γ |
| 031 E=mc² | Mass → energy converter with scale refs | E in joules/TNT |
| 032 Rutherford | Alpha scattering + angle histogram | Scattering distribution |
| 033 Bohr | Electron orbits + transitions + spectrum | ΔE = hν |
| 034 Curved Spacetime | Grid deformation + geodesic path | Curvature visualization |
| 035 Double Slit | Photon buildup + interference toggle | Interference vs. measurement |
| 036 Schrödinger | ψ(x) + |ψ|² display | Quantized energy levels |
| 037 Uncertainty | Δx, Δp sliders → product constraint | Δx·Δp ≥ ℏ/2 |
| 038 Pauli | Electron shell filling + aufbau | Electron configuration |
| 039 Dirac | Pair production + annihilation | Energy conservation |
