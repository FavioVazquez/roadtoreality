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

- id: gap-01
  truth: "KaTeX equations render in the takeaway box at the bottom of every stop page"
  status: failed
  reason: "User reported: equations not rendering on stop 015, observed on other stops too"
  severity: major
  test: 1 (cross-cutting — affects all 12 stops)
  root_cause: |
    katex-init.js scopes renderMathInElement() to only the .takeaway-box container
    (line 12: `var container = document.querySelector('.takeaway-box') || document.body`).
    Equations in .stop-body paragraphs (e.g., <p class="katex-block">$$...$$</p> and
    inline \(...\) in prose) are outside .takeaway-box and are never processed by KaTeX.
    The KaTeX CSS, katex.min.js, auto-render.min.js, and katex-init.js are all loaded
    correctly with defer (execution order preserved), so the loading chain is not the
    problem — the selector scope is too narrow.
  affected_files:
    - Episodio4/assets/js/katex-init.js
    - Episodio4/stops/015-bernoulli-fluids/index.html (representative; same pattern in all stops)

- id: gap-02
  truth: "Disk rotation is visually apparent (radius line, spoke, or mark showing rotation)"
  status: failed
  reason: "User reported: disk is just a solid blue disk — rotation not visible"
  severity: major
  test: 2
  root_cause: |
    drawDisk() in sim.js uses a color-replacement pattern to make the fill semi-transparent:
    `color.replace(')', ',0.15)').replace('rgb', 'rgba')`. However, SHAPE_COLORS are hex
    strings (e.g., '#5285c8'), not rgb() strings. The .replace() calls find no matching
    characters, so fillStyle is set to the full opaque hex color. The disk body is painted
    as a 100% opaque filled circle. The radius line marker is drawn on top in the same
    color as the circle border, making it invisible against the opaque fill. The net result
    is a solid blue disk with no visible rotation indicator.
  affected_files:
    - Episodio4/stops/016-euler-rotation/sim.js (drawDisk function, lines 78-101)

- id: gap-03
  truth: "Default rotation speed is comfortable to observe (not excessively fast)"
  status: failed
  reason: "User reported: velocity of rotation could be a little too much"
  severity: minor
  test: 2
  root_cause: |
    Default slider values are torque=5.0 N·m and mass=2.0 kg. Disk moment of inertia:
    I = 0.5 * 2.0 * (0.4)^2 = 0.16 kg·m². Angular acceleration: α = τ/I = 5.0/0.16 =
    31.25 rad/s². After 3 seconds of animation the disk reaches ω ≈ 93.75 rad/s — far
    too fast to see individual rotation. The default torque is too high relative to the
    default mass, and there is no cap or damping on angular velocity.
  affected_files:
    - Episodio4/stops/016-euler-rotation/sim.js (default torque=5.0 line 21, physicsStep lines 319-333)

- id: gap-04
  truth: "Energy readout numbers are clearly legible and not overlapping the pie chart"
  status: failed
  reason: "User reported: numbers on the right top are on top of the pie chart and are hard to read"
  severity: major
  test: 7
  root_cause: |
    In drawPieChart(), the readout text block starts at readY = pieCY - pieR - 50 and
    extends down to readY + 64 (five lines at 16px spacing). pieCY = H*0.34 and
    pieR = min(W*0.10, H*0.13, 60). At typical canvas dimensions (e.g., H=400, pieR=52),
    readY ≈ 400*0.34 - 52 - 50 = 34px. The readout bottom line lands at readY+64 = 98px,
    while the top of the pie circle is at pieCY - pieR ≈ 84px. The bottom two readout
    lines (KE and Q) at readY+32 and readY+48 fall within the vertical extent of the pie
    circle (84px to 220px), causing visual overlap with the pie chart.
  affected_files:
    - Episodio4/stops/021-joule-energy/sim.js (drawPieChart function, lines 351-374)

- id: gap-05
  truth: "Weight drop area text labels are clearly positioned with no overlapping"
  status: failed
  reason: "User reported: some text is on top of each other in the weight drop area"
  severity: major
  test: 7
  root_cause: |
    In drawApparatus(), multiple text labels cluster at the appBottom/containerY boundary:
    (1) The "All PE converted to heat!" arrived label draws at (appCX, appBottom - 2)
    with textBaseline='bottom'. (2) The "water" container label draws at (appCX, containerY + 4)
    with textBaseline='top', where containerY = appBottom. These two labels are only ~6px
    apart vertically and overlap when arrived=true. Additionally, the ΔT readout is
    positioned at (containerX + containerW + 8, containerY + 4) and may extend beyond
    the canvas width at smaller viewport sizes, and the velocity arrow drawn below the
    weight block can overlap the weight block's mass label at low y values.
  affected_files:
    - Episodio4/stops/021-joule-energy/sim.js (drawApparatus function, lines 52-248)

- id: gap-06
  truth: "Mouse cursor changes to a pointer/hand when hovering over draggable charges"
  status: failed
  reason: "User reported: mouse doesn't change to a hand when hovering over charges"
  severity: minor
  test: 8
  root_cause: |
    The mousemove event listener in sim.js only calls doDrag(e), which moves a charge
    if one is already being dragged. There is no hover-detection code anywhere in the file
    that checks whether the mouse is within 22px of a charge and sets
    canvas.style.cursor = 'pointer'. The cursor never changes from the default arrow.
  affected_files:
    - Episodio4/stops/022-maxwell-equations/sim.js (mousemove listener line 497, doDrag function lines 53-62)

- id: gap-07
  truth: "Each panel has a visible label or the relationship between panels is clear to the user"
  status: failed
  reason: "User reported: unclear if left panel should affect right panel — no explanation of what each panel does independently"
  severity: major
  test: 8
  root_cause: |
    drawPanelLabels() in sim.js does draw "Electric Field" and "Electromagnetic Wave" as
    canvas text labels (lines 357-367). However, they are rendered at rgba(200,200,200,0.4)
    — only 40% opacity — making them very faint and easy to miss. The two panels are
    completely independent (charges do not affect the wave), but there is no prominent
    visual indication of this. The sim-caption in index.html does mention the relationship,
    but users do not reliably read captions before interacting. There is no in-canvas
    explanation that the panels are independent demonstrations.
  affected_files:
    - Episodio4/stops/022-maxwell-equations/sim.js (drawPanelLabels function, lines 357-367)
    - Episodio4/stops/022-maxwell-equations/index.html (sim-caption line 89)

- id: gap-08
  truth: "EM wave continues to animate after reset + play"
  status: failed
  reason: "User reported: after reset and play again, the EM wave stops moving and becomes static"
  severity: blocker
  test: 8
  root_cause: |
    Both sim.js and stop-shell.js register independent click listeners on the same
    #sim-play-btn element. sim.js registers first (it is loaded before stop-shell.js).
    When the user clicks Play after a reset, both listeners fire in registration order:
    (1) sim.js listener reads btn.dataset.state='paused', calls SimAPI.start() (sets
    running=true, starts loop(), sets state to 'playing'). (2) stop-shell.js _bindPlayButton()
    listener then fires, reads btn.dataset.state='playing' (already changed by step 1),
    and calls SimAPI.pause() (sets running=false, cancels raf). The animation starts and
    is immediately stopped within the same click event. The wave is drawn once at t=0 and
    stays static. This double-listener conflict exists for any play/pause interaction, but
    is most visible after reset because t=0 produces a static-looking wave.
  affected_files:
    - Episodio4/stops/022-maxwell-equations/sim.js (play button listener lines 529-537)
    - Episodio4/assets/js/stop-shell.js (_bindPlayButton lines 131-153)

- id: gap-09
  truth: "Mode 3 at arm-ratio 1.0 shows a visually distinct null result (uniform grey or clear label) vs other values"
  status: failed
  reason: "User reported: at 1.0 sees black and white lines similar to other values — null result is not visually obvious"
  severity: major
  test: 12
  root_cause: |
    In drawModeInterferometer(), the fringe intensity per scanline is:
    `intensity = 0.5 * (1 + Math.cos(2 * Math.PI * pathDiff / lambda + py * 0.1))`.
    At armRatio=1.0: pathDiff = 2*(L1-L2) = 0, so the formula reduces to
    `0.5 * (1 + Math.cos(py * 0.1))`. This still produces a smoothly varying cosine
    pattern over the vertical axis — alternating dark and bright horizontal bands — because
    the `py * 0.1` term remains active regardless of pathDiff. The fringe pattern at
    armRatio=1.0 is visually indistinguishable from other values. A text label
    "Equal arms: null result" IS conditionally drawn (lines 540-547) but only when
    abs(armRatio - 1.0) < 0.05, and it is rendered on top of the striped pattern,
    which does not help because the stripes themselves contradict the "null result" claim.
  affected_files:
    - Episodio4/stops/026-michelson-morley/sim.js (drawModeInterferometer function, lines 512-557)

- id: gap-10
  truth: "Controls show/hide or are clearly labeled per active mode so users know which control applies"
  status: failed
  reason: "User reported: controls are not clear — which one to use in which mode"
  severity: major
  test: 12
  root_cause: |
    In index.html, both the rotation-slider and arm-ratio-slider are always visible in the
    controls bar regardless of which mode is active (lines 77-86). In sim.js, setMode()
    only updates the opacity of the three tab buttons — it does not show/hide or disable
    either slider, and it does not add any contextual label linking a slider to its mode.
    There is no visual connection between "rotation-slider → modes 1 & 2" and
    "arm-ratio-slider → mode 3". A user on mode 3 sees the rotation slider with no
    indication it is irrelevant, and vice versa.
  affected_files:
    - Episodio4/stops/026-michelson-morley/sim.js (setMode function, lines 43-49)
    - Episodio4/stops/026-michelson-morley/index.html (sim-controls section, lines 69-91)
