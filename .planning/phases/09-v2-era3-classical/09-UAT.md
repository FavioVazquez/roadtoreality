---
status: complete
phase: 09-v2-era3-classical
source:
  - 09-01-SUMMARY.md
  - 09-02-SUMMARY.md
  - 09-03-SUMMARY.md
  - 09-04-SUMMARY.md
  - 09-05-SUMMARY.md
  - 09-06-SUMMARY.md
started: 2026-03-23T00:00:00Z
updated: 2026-03-23T00:00:00Z
---

## Current Test
number: 1
name: Stop 015 — Bernoulli venturi tube
expected: |
  Venturi tube visible with particles flowing through. Narrowing throat speeds up particles.
  Pressure manometer columns above the tube: taller in wide sections, shorter at throat.
  Throat-width and flow-speed sliders both work.
awaiting: user response

## Tests

### 1. Stop 015 — Bernoulli venturi tube
expected: Particles flow through a narrowing tube. Manometer columns show high pressure in wide sections, low pressure at throat. Both sliders (throat-width, flow-speed) change the simulation.
result: pass

### 2. Stop 016 — Euler rigid body rotation
expected: Three shapes (disk, rod, ring) rotate under the same torque. They accelerate at different rates — the ring is slowest, disk fastest. Angular-velocity graph on the right shows diverging lines. Torque and mass sliders change the rates.
result: issue
reported: "pass, although the velocity of rotation could be a little too much, and the disk rotation is not visible as it is just a blue disk"
severity: major

### 3. Stop 017 — Coulomb draggable charges
expected: Two charges visible and draggable. Field lines redraw live as you drag. Force arrows switch direction (attraction vs repulsion) when you toggle a charge sign. F vs r graph updates as distance changes.
result: pass

### 4. Stop 018 — Volta battery circuit
expected: Voltaic pile schematic (stacked cells) on one side, animated circuit with moving current dots and glowing bulb on the other. V/I/P readouts update when you change sliders. Series/parallel toggle changes the values visibly.
result: pass

### 5. Stop 019 — Faraday induction (Lenz's law)
expected: Moving the magnet toward the coil deflects the galvanometer needle one direction. Moving it away deflects it the opposite direction. Auto-oscillate button makes the magnet move back and forth continuously.
result: pass

### 6. Stop 020 — Carnot heat engine
expected: PV diagram shows a closed loop with four curved stages (two isotherms, two adiabatics). A dot traces the cycle. Piston panel shows compression/expansion. Efficiency readout (%) changes when you adjust the hot/cold temperature sliders.
result: pass

### 7. Stop 021 — Joule energy conservation
expected: Weight drops from a height. Pie chart shows PE shrinking, KE growing, then heat growing as it hits. Temperature readout shows a tiny rise. Height and mass sliders change the drop.
result: issue
reported: "pass, but the numbers on the right top are on top of the pie chart and are hard to read, some other text is on top of each other in the weight drop"
severity: major

### 8. Stop 022 — Maxwell two-panel
expected: LEFT PANEL: two charges on canvas — dragging them moves the charges, field lines redraw live while dragging. RIGHT PANEL: EM wave with perpendicular E (blue arrows) and B (gold markers) propagating across. Frequency and amplitude sliders change the wave. Both panels active simultaneously.
result: issue
reported: "several things, when i put the mouse on the charges the mouse doesn't change to a hand, I can drag them but with the pointer. If the left panel is supposed to change the right panel I don't see that effect, if not we should explain what each one does. And when I reset and play again the propagating EM doesn't move anymore, is just static"
severity: major

### 9. Stop 023 — Doppler effect
expected: Source moves across the screen emitting circular wavefronts. Wavefronts bunch up ahead of the source (higher frequency) and stretch behind (lower frequency). Speed slider changes the effect. Frequency readout shows observed vs emitted values. Source-frequency slider also available.
result: pass
note: "User suggested adding Web Audio tone that shifts pitch with the Doppler shift — deferred enhancement"

### 10. Stop 024 — Boltzmann two-panel
expected: LEFT PANEL: 60 particles bouncing, temperature slider changes their speed, histogram shows Maxwell-Boltzmann speed distribution updating live. RIGHT PANEL: particles packed on one side of a wall; pressing "Remove Wall" releases them and an entropy meter climbs as they spread. Both panels active simultaneously.
result: pass

### 11. Stop 025 — Hertz radio waves
expected: Oscillating dipole at center emits expanding ring-shaped wavefronts. Rings are brighter along equator (sin²θ pattern — less intensity at poles). Colors alternate red/blue per half-cycle. Dipole-frequency and wave-speed sliders change the pattern.
result: pass

### 12. Stop 026 — Michelson-Morley three modes
expected: Three tab buttons to switch modes. MODE 1: split screen shows wavy "predicted" fringe vs flat "observed" fringe; rotation slider makes predicted fringe vary but observed stays flat. MODE 2: two light dots race along perpendicular arms and always arrive simultaneously regardless of rotation. MODE 3: interferometer fringe pattern; arm-ratio slider = 1.0 shows zero fringe shift (null result).
result: issue
reported: "controls are not clear — which one to use in which mode. Also in mode 3 at 1.0 I see black and white lines similar to other values, I'm not sure what I'm supposed to see there"
severity: major

## Summary

total: 12
passed: 8
issues: 10
pending: 0
skipped: 0

## Gaps

- truth: "Disk rotation is visually apparent (radius line, spoke, or mark showing rotation)"
  status: failed
  reason: "User reported: disk is just a solid blue disk — rotation not visible"
  severity: major
  test: 2

- truth: "Default rotation speed is comfortable to observe (not excessively fast)"
  status: failed
  reason: "User reported: velocity of rotation could be a little too much"
  severity: minor
  test: 2

- truth: "Controls show/hide or are clearly labeled per active mode so users know which control applies"
  status: failed
  reason: "User reported: controls are not clear — which one to use in which mode"
  severity: major
  test: 12

- truth: "Mode 3 at arm-ratio 1.0 shows a visually distinct null result (uniform grey or clear label) vs other values"
  status: failed
  reason: "User reported: at 1.0 sees black and white lines similar to other values — null result is not visually obvious"
  severity: major
  test: 12

- truth: "Mouse cursor changes to a pointer/hand when hovering over draggable charges"
  status: failed
  reason: "User reported: mouse doesn't change to a hand when hovering over charges"
  severity: minor
  test: 8

- truth: "Each panel has a visible label or the relationship between panels is clear to the user"
  status: failed
  reason: "User reported: unclear if left panel should affect right panel — no explanation of what each panel does independently"
  severity: major
  test: 8

- truth: "EM wave continues to animate after reset + play"
  status: failed
  reason: "User reported: after reset and play again, the EM wave stops moving and becomes static"
  severity: blocker
  test: 8

- truth: "Energy readout numbers are clearly legible and not overlapping the pie chart"
  status: failed
  reason: "User reported: numbers on the right top are on top of the pie chart and are hard to read"
  severity: major
  test: 7

- truth: "Weight drop area text labels are clearly positioned with no overlapping"
  status: failed
  reason: "User reported: some text is on top of each other in the weight drop area"
  severity: major
  test: 7

- truth: "KaTeX equations render in the takeaway box at the bottom of every stop page"
  status: failed
  reason: "User reported: equations not rendering on stop 015, observed on other stops too"
  severity: major
  test: 1 (cross-cutting — affects all 12 stops)
