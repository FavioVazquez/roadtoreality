# PITFALLS.md
# Common Failures in Interactive Physics Education Websites

A research-backed catalogue of pitfalls, failure modes, and prevention strategies
for static sites delivering many physics simulations to general public audiences.

---

## Table of Contents

1. [Technical Pitfalls](#1-technical-pitfalls)
2. [Content and UX Pitfalls](#2-content-and-ux-pitfalls)
3. [Project Failure Modes](#3-project-failure-modes)
4. [Lessons From PhET, Falstad, and Similar Projects](#4-lessons-from-phet-falstad-and-similar-projects)
5. [Risks of 50 Simulations in Vanilla JS](#5-risks-of-50-simulations-in-vanilla-js)
6. [Accessibility Pitfalls](#6-accessibility-pitfalls)
7. [The "Impressive Demo, Confusing Experience" Trap](#7-the-impressive-demo-confusing-experience-trap)

---

## 1. Technical Pitfalls

### 1.1 Main Thread Blocking

**What goes wrong:** Physics simulations compute forces, integrate equations of motion, and redraw every frame. When all of that work runs on the browser's single main thread, any calculation taking longer than ~10ms per frame causes visible jank. The browser cannot respond to clicks, touches, or keyboard input while the main thread is busy.

**Warning signs:**
- Simulations freeze briefly when parameters change.
- Page scrolling stutters while a simulation is running.
- Input fields feel laggy on mid-range or mobile devices.
- Chrome DevTools shows long "Long Tasks" (>50ms) in the Performance panel.

**Prevention:**
- Target 16.67ms per frame (60fps). Budget only ~10ms for actual JS work; the rest goes to style, layout, and composite.
- Use `requestAnimationFrame` exclusively for visual updates. Never use `setTimeout` or `setInterval` for animation loops.
- Move heavy number-crunching (particle systems, fluid simulations, N-body gravity) to Web Workers, posting results back to the main thread for rendering only.
- Profile every simulation with Chrome DevTools before shipping. Frame budget violations that are invisible on a developer's fast machine become crashes on budget Android hardware.

---

### 1.2 Canvas Performance Pitfalls

**What goes wrong:** HTML Canvas is a pixel-drawing surface with no retained scene graph. Every mistake in how you draw compounds across every frame.

**Warning signs:**
- Clearing the entire canvas every frame even when only 10% of it changed.
- Changing fill/stroke color between every individual shape draw call.
- Using `shadowBlur` or other expensive effect properties in the animation loop.
- Drawing floating-point coordinates instead of integers (causes anti-aliasing on every pixel).
- Not using off-screen canvases for complex background elements.

**Prevention:**
- Pre-render static or slow-changing elements to off-screen canvases. Composite them once per frame with a single `drawImage`.
- Batch draw calls by color/state: draw all red elements, then all blue elements, not alternating.
- Dirty-region tracking: only clear and redraw the portion of the canvas that actually changed.
- Use layered canvases (multiple `<canvas>` stacked with CSS) to separate elements that change at different rates.
- Use `Math.round()` or bitwise `~~` on coordinates before drawing.
- Disable `shadowBlur` in the hot path; bake shadows into pre-rendered images.

---

### 1.3 Mobile and Touch Support

**What goes wrong:** Simulations designed on a 27-inch 4K monitor are completely unusable on a phone. Touch targets too small to hit, canvases that overflow the viewport, drag interactions that scroll the page instead, and physics that runs at 15fps on a mid-range Android device.

**Warning signs:**
- Touch drag on a slider also scrolls the page.
- Buttons and sliders are smaller than 44x44px touch targets.
- The simulation canvas width is hardcoded in pixels.
- No testing was done on a real device or browser dev tools mobile emulation.
- The simulation looks fine on desktop but the controls fall off-screen on phones.

**Prevention:**
- Add `touch-action: none` on canvas elements that capture drag. Otherwise browser scroll overrides simulation drag.
- Register both mouse and touch event handlers (or use Pointer Events API which unifies both).
- Make every simulation responsive: define dimensions as a fraction of the container, not fixed pixels. Recalculate on `resize`.
- Test on real mobile hardware or a real device emulator at least once per simulation. Budget Android (~2018-era) is the meaningful worst case.
- Accept that some simulations genuinely require mouse precision. For those, show a clear mobile warning rather than a broken experience.
- Use CSS `clamp()` and viewport units for UI layout so controls reflow at small screen widths.

---

### 1.4 Browser Compatibility

**What goes wrong:** Features that work in the latest Chrome may silently fail or degrade in Safari, Firefox, or older iOS WebKit.

**Specific danger zones:**
- `OffscreenCanvas` is not supported in all Safari versions.
- Web Workers with SharedArrayBuffer require specific CORS headers (`Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy`).
- CSS features like `container-queries` have uneven adoption.
- `requestAnimationFrame` timing differs subtly across browsers.
- Safari has a long history of lagging GPU canvas acceleration compared to Chrome.

**Prevention:**
- Define a browser support matrix before writing code, not after. Decide the minimum Safari version supported and stick to it.
- Use `caniuse.com` to check every non-trivial API before adopting it.
- Avoid `OffscreenCanvas` and `SharedArrayBuffer` unless you are prepared to handle the header requirements and fallback paths.
- Run automated cross-browser tests (even manual checks in Firefox and Safari) before shipping each simulation.
- Do not rely on CSS features with less than ~90% global adoption for layout-critical elements.

---

### 1.5 Simulation Accuracy and Numerical Stability

**What goes wrong:** A simulation that looks right at normal speed breaks down at high speeds, large masses, or extreme parameter values. Users notice. Bad physics teaches bad intuition — worse than no simulation at all.

**Specific failure modes:**
- Euler integration (velocity += acceleration * dt) introduces energy drift. A pendulum that gains energy over time teaches the wrong physics.
- Fixed timesteps at a slow frame rate make collisions tunnel (objects pass through each other).
- Division by zero or `NaN` propagation when sliders reach edge values causes the simulation to freeze or display nonsense.
- Units are inconsistent between the display values and internal simulation values, producing incorrect readouts.

**Prevention:**
- Use Runge-Kutta 4 (RK4) or at minimum Verlet integration for anything involving energy conservation.
- Implement a maximum `dt` cap. If a frame takes longer than expected, clamp `dt` to prevent explosions.
- Validate all inputs at the boundary. Clamp sliders. Guard against zero denominators. Test at minimum and maximum slider values.
- Separate simulation units (SI) from display units. Do not mix. Document the unit conventions in code.
- Add a simple automated sanity check for each simulation: e.g., "does a pendulum conserve energy within 0.1% over 10 seconds?"

---

## 2. Content and UX Pitfalls

### 2.1 Too Much Text

**What goes wrong:** Developers write explanatory text the way a textbook does. Paragraphs above the simulation, equations below it, a glossary sidebar. The general public does not read this. They click the simulation, get confused by the controls, and leave.

**Warning signs:**
- The explanation-to-simulation ratio is more than 2:1 by screen height.
- The user must scroll past paragraphs before they can interact.
- Text uses passive academic voice ("it can be observed that...").
- Equations appear without any plain-language interpretation.

**Prevention:**
- Lead with the simulation, not the explanation. Get users interacting within seconds.
- Keep introductory text to 2-3 sentences maximum before the simulation appears.
- Use contextual labels inside the simulation (axis labels, unit readouts) rather than external text walls.
- Offer deeper explanation as opt-in expansion (a "Learn More" toggle or separate section), not as a wall users must climb before playing.
- Apply NNG's progressive disclosure principle: show one layer of information at a time, make deeper layers obviously accessible.

---

### 2.2 Wrong Audience Calibration

**What goes wrong:** Simulations that work for physics undergraduates completely fail for a curious 15-year-old or an adult with no science background. Jargon, unexplained variables (what is "ω"?), and assumed mathematical fluency are the most common killers.

**Warning signs:**
- Variable names use Greek letters without pronunciation or plain-language name.
- The simulation asks the user to interpret a phase-space diagram without explanation.
- "This simulation demonstrates Hamiltonian dynamics" is the opening sentence.
- Controls include raw numerical parameters ("drag coefficient: 0.47") with no intuitive framing.

**Prevention:**
- Define the target audience concretely before building each simulation. "Curious adult with high school background" requires completely different framing than "physics undergraduate."
- Name controls in plain language: "Air resistance" not "drag coefficient b."
- Use real-world metaphors: "heavier ball" not "mass = 5 kg."
- Avoid naked equations in the main UI. If you must show an equation, pair it with a sentence: "The ball goes faster as you increase mass — this equation shows why: F = ma."
- Test each simulation with a person who matches your actual target audience before publishing. Developer intuition about what is "obvious" is unreliable.

---

### 2.3 Control Overload

**What goes wrong:** Every interesting variable gets a slider. The simulation ships with 12 sliders, 4 checkboxes, and 3 dropdown menus. The user has no idea where to start or what the most important thing to change is.

**Warning signs:**
- First-time users stare at the controls without clicking anything for more than 10 seconds.
- There are more than 4-5 controls visible by default.
- No control is labeled as "start here" or pre-configured to demonstrate the key phenomenon.
- All controls have equal visual weight — nothing says "this is the main thing."

**Prevention:**
- Limit default-visible controls to 2-3 primary parameters. Hide advanced controls behind an "Advanced" disclosure.
- Pre-set a default state that immediately demonstrates the most interesting behavior. Do not start with a blank, static scene.
- Use visual hierarchy: make the most important slider largest or most prominent.
- Add a "Try this:" suggestion that gives users a specific starting action. ("Drag the mass to the left and release it.")
- Refer to NNG's progressive disclosure research: more than two levels of disclosure causes users to get lost.

---

### 2.4 No Observable "Aha Moment"

**What goes wrong:** The simulation runs correctly but nothing visually surprising or interesting happens at default settings. The user does not know what they are supposed to notice or learn. The simulation is technically accurate but pedagogically inert.

**Warning signs:**
- The simulation defaults to a static equilibrium with nothing moving.
- A user who interacts for 30 seconds cannot describe what they just learned.
- The interesting emergent behavior only appears at a non-obvious slider combination.

**Prevention:**
- Design each simulation around one specific "aha moment" — a counterintuitive result, a visible pattern, a surprise. That moment should be reachable in under 30 seconds at default settings.
- Write the learning outcome first, then design the simulation to make that outcome observable.
- Use annotation overlays or brief tooltips that appear after a user interaction to say "Notice how X changed when you did Y."

---

### 2.5 Inaccessible Physics Concepts

**What goes wrong:** The physics is correct but the concept is never connected to anything the user already knows. Abstract concepts that float free of experience do not stick.

**Warning signs:**
- No real-world analogy or example is given.
- The simulation is about a phenomenon users have never encountered directly (e.g., quantum tunneling shown with no connection to everyday experience).
- The only framing is formal: "demonstrates the second law of thermodynamics."

**Prevention:**
- Every simulation should open with a one-sentence real-world hook. "Why does a spinning top not fall over? Let's find out."
- Connect to things users have seen or felt. Use familiar objects (pendulums, balls, springs, waves on a rope) before abstract variables.
- For genuinely abstract physics (quantum, relativity), use carefully chosen analogies and be explicit that they are analogies with limits.

---

## 3. Project Failure Modes

### 3.1 Scope Creep

**What goes wrong:** The project starts as "10 simulations for mechanics" and grows to "50 simulations covering all of classical and modern physics" before any simulation is fully polished. The site ships with 50 incomplete, barely-working simulations instead of 10 excellent ones.

**Warning signs:**
- The simulation list keeps growing during development.
- No simulation has been tested with a real user.
- "We'll polish it later" is a common phrase.
- The project has been in development for over 6 months with no public release.

**Prevention:**
- Define a frozen scope for Version 1.0 before writing any code. Write it down. Treat additions as Version 2.0 features.
- Ship an MVP of 5-10 simulations to real users before building more.
- Treat each simulation as a feature with a definition of done: "tested on mobile, accessibility checked, reviewed by one non-technical person."

---

### 3.2 Simulation Complexity Underestimation

**What goes wrong:** "I'll just build a simple pendulum" turns into a week of debugging numerical integration stability, then another week adding damping, then realizing the large-angle approximation gives wrong results, then fixing the period formula. Each simulation takes 3-5x longer than estimated.

**Warning signs:**
- The first simulation took three times as long as planned.
- Fixing one physical edge case reveals two more.
- The simulation works in simple cases but breaks at parameter extremes.

**Prevention:**
- Build a complete prototype of one simulation end-to-end (physics, UI, mobile, accessibility, content) before starting any others. Use it to calibrate actual build time.
- Define the physical scope of each simulation upfront: what parameter ranges are supported, what edge cases will be explicitly excluded.
- Accept that some physically "correct" behaviors can be deliberately simplified if they are confusing rather than illuminating for the target audience.

---

### 3.3 Content Writing Bottleneck

**What goes wrong:** The simulations are built but each one needs explanatory text, labels, tooltips, and a title. This turns out to be harder than writing code. The developer, who understands the physics deeply, cannot write for a general audience. The site stalls because every simulation needs content work.

**Warning signs:**
- Explanatory text is copied verbatim from a physics textbook.
- Text uses the same passive, academic register regardless of simulation topic.
- Content writing is deferred until "the simulations are all done."

**Prevention:**
- Write the content for the first three simulations before building any others. This establishes voice and reveals how hard it is.
- Treat content as a first-class deliverable, not an afterthought. Schedule it explicitly.
- Follow the rule: plain-language hook first, simulation second, explanation third. Draft all three for each simulation before considering it started.

---

### 3.4 Perfectionism / Never Shipping

**What goes wrong:** Each simulation can always be improved. More edge cases. Better visuals. More accurate physics. The perfect becomes the enemy of the shipped. The project stays private indefinitely.

**Prevention:**
- Define "good enough to ship" criteria at the start. Apply them mechanically.
- Ship to a small group (friends, colleagues) well before a public launch.
- Accept that real user feedback on a mediocre live site is worth more than private development of a perfect one.

---

### 3.5 No Maintenance Plan

**What goes wrong:** The site launches. Browser APIs change. A simulation that used an undocumented canvas behavior breaks in Safari 18. The 50-simulation vanilla JS codebase has no shared infrastructure, so fixing a bug in the slider component requires touching 50 files.

**Prevention:**
- Plan for maintenance before shipping. Which simulations are critical? What is the browser support policy?
- Build shared infrastructure (a common slider component, a common canvas wrapper) from the start, not by retrofitting.
- Write a one-page maintenance guide while the code is fresh.

---

## 4. Lessons From PhET, Falstad, and Similar Projects

### 4.1 PhET's Research-Validated Findings

PhET Interactive Simulations (University of Colorado Boulder) has been building physics education simulations since 2002 and publishes their design research. Key validated lessons:

**Implicit guidance beats explicit instruction.** PhET deliberately limits controls to guide users toward productive exploration without telling them what to do. A simulation with fewer well-chosen controls teaches more effectively than one with every possible parameter exposed.

**Motivation is not automatic.** PhET research found that "most students do not have the necessary drive to spend time playing with a science simulation" without external motivation. For a general public audience (no grades, no teacher), this problem is even more acute. The simulation must be intrinsically interesting at first contact.

**Immediate feedback is essential.** Every user action must produce an observable effect. If a user adjusts a parameter and nothing visibly changes, they assume the simulation is broken. Every slider, button, and input must have an immediate, visible response.

**Test with actual users, not developers.** PhET conducts student interviews and classroom observation for every simulation. They consistently find that interfaces that seem obvious to physicists are opaque to learners. Observing one non-physicist use a simulation for 5 minutes reveals more problems than a week of internal review.

**Minimal text in the simulation itself.** PhET simulations use visual representations, not text explanations. Labels are short. Equations appear rarely, and only after a user has experienced the phenomenon they describe.

**Simulations do not replace hands-on labs.** PhET explicitly acknowledges that simulations excel at conceptual understanding but cannot develop equipment skills or replace physical intuition from handling real objects. Do not oversell what a simulation teaches.

### 4.2 Falstad's Lessons

Paul Falstad's physics and electronics simulations (falstad.com) represent a different model: a single developer maintaining hundreds of simulations over decades.

**Java to JavaScript migration shows the fragility of platform assumptions.** Falstad originally built simulations in Java (as browser applets). Java applets were killed by browser vendors. The entire library required migration to JavaScript — an enormous investment. The lesson: do not build on browser features that may disappear. Vanilla JS and the Canvas API are safer long-term bets than WebGL (though powerful), WebAssembly (not universally supported), or proprietary runtimes.

**Longevity requires simplicity.** Falstad's simulations have survived for decades partly because they are direct, single-file implementations without complex build pipelines. When the platform changed, the migration was painful but feasible because the code was simple. Complex build systems and framework dependencies add fragility.

**Expert-made simulations can be hard to approach.** Falstad's simulations are technically excellent but often assume significant prior knowledge. Many controls have no explanation. This is acceptable for a technically sophisticated audience, but not for general public education.

### 4.3 General Patterns From Physics Education Research

- Simulations that show multiple simultaneous representations (position, velocity, acceleration graph, and numerical readout together) outperform single-representation simulations.
- Simulations where users control parameters actively learn more than simulations where users passively watch preset scenarios.
- Simulations with no goal state can be confusing. "Explore freely" works only if the phenomenon itself is immediately fascinating. Consider guided scenarios ("Can you make the pendulum swing exactly twice per second?").
- Seductive details — cool animations unrelated to the core concept — can distract from learning. Every visual element should earn its presence.

---

## 5. Risks of 50 Simulations in Vanilla JS

### 5.1 Consistency Degradation

**The problem:** With 50 simulations built one at a time, each will drift in behavior, visual style, and code structure. Simulation 1 uses mousedown/mousemove. Simulation 23 uses Pointer Events. Simulation 47 uses a canvas wrapper you wrote but never applied retroactively. Users experience 50 different interaction models.

**Warning signs:**
- Sliders work differently in different simulations.
- Colors, typography, and layout vary across simulations.
- Bug fixes require different approaches in each file.

**Prevention:**
- Build shared components before building any simulation: a standard slider component, a standard canvas wrapper, a standard layout template, a standard color palette.
- Write a "Simulation Development Guide" that every new simulation must follow.
- Conduct a consistency audit after every 5 simulations. Fix drift early.

---

### 5.2 No Shared Bug Fixes

**The problem:** You discover that your touch drag handler has a bug on iOS. With 50 separate simulation files each implementing their own version of touch handling, you must make the fix 50 times. You will miss some. The site will have inconsistent behavior.

**Prevention:**
- Factor all shared behavior into shared modules from day one. `shared/touch-drag.js`, `shared/slider.js`, `shared/canvas-utils.js`.
- A fix to a shared module fixes all 50 simulations at once.
- If you cannot import shared modules (no build step, strict static site), use a shared script tag in a base template — but this requires consistent HTML structure.

---

### 5.3 Performance Budget Drift

**The problem:** You optimize simulation 1 carefully. By simulation 30, performance habits have slipped. You are allocating new arrays every frame in some simulations, which triggers garbage collection pauses.

**Warning signs:**
- Some simulations feel noticeably smoother than others.
- `new Array()` or object literal `{}` inside the animation loop.
- DevTools shows GC events correlating with jank spikes.

**Prevention:**
- Define a performance budget document: no heap allocations in the hot path, no layout-triggering reads in the hot path (offsetWidth, getBoundingClientRect during animation).
- Use object pooling for frequently created objects (particles, vectors).
- Profile performance before shipping each simulation, not just at the end.

---

### 5.4 Testing Overhead

**The problem:** 50 simulations with no automated tests means every browser or CSS change requires manually checking all 50 simulations. It will not happen. Regressions will ship.

**Prevention:**
- Write at least a smoke test for each simulation: does it initialize without errors, does it render something on the canvas, does the primary control produce a visible change?
- Use a shared test harness so adding tests for a new simulation is low effort.
- A visual regression screenshot tool (even a simple one) can catch layout breakage automatically.

---

### 5.5 Maintenance Cliff

**The problem:** After 18 months, the original developer's familiarity with simulation 7 has faded. It uses a non-obvious coordinate system convention. Modifying it causes subtle bugs. The project effectively becomes unmaintainable past a certain scale.

**Prevention:**
- Document the physics model for each simulation in a comment block at the top of the file: units, coordinate conventions, integration method, known limitations.
- Use self-documenting variable names throughout. `positionMeters` not `p`. `angularVelocityRadPerSec` not `w`.
- Keep each simulation file under 500 lines. If it grows beyond that, refactor.

---

## 6. Accessibility Pitfalls

### 6.1 Canvas Is Invisible to Screen Readers

**The core problem:** HTML Canvas is a pixel-drawing surface. Screen readers see only what is in the DOM. A canvas element with no accessible subtree is, from a screen reader's perspective, a black box with no content.

**Warning signs:**
- The simulation's canvas element has no `aria-label` or `role`.
- There are no DOM-based alternative representations of the simulation state.
- A screen reader user encounters the simulation and hears nothing, or hears only "canvas."

**Minimum viable accessibility:**
- Give every canvas element an `aria-label` describing what the simulation represents.
- Provide a text readout of key simulation state values in visible DOM elements (not just drawn on canvas). Example: a live-updating `<p>` that says "Pendulum period: 2.1 seconds."
- For simulations with user-controllable parameters, ensure all controls are keyboard-accessible DOM elements (sliders, buttons), not canvas-drawn controls.

**Full accessibility (PhET's approach):**
- Add a parallel DOM subtree ("PDOM") that describes the simulation state in plain language, updated as the simulation runs.
- Support keyboard navigation of simulation elements independently from mouse.
- Provide sonification (audio feedback) as an alternative representation.

Note: Full WCAG 2.1 AA compliance for canvas-based interactive simulations requires substantial engineering investment. Decide the accessibility target explicitly before building.

---

### 6.2 Color Contrast Failures

**What goes wrong:** Simulations use light gray lines on white backgrounds, or colored labels that look fine on a developer's calibrated monitor but fail contrast requirements for users with low vision or color deficiency.

**WCAG requirements:**
- Text: 4.5:1 contrast ratio (AA), 7:1 (AAA).
- Non-text UI components (borders, focus indicators, control boundaries): 3:1 contrast ratio.
- Anti-aliasing on thin canvas-drawn lines can make nominal compliance actually fail in practice.

**Common failures:**
- A red-green encoding of two simulation states fails for red-green color blindness (~8% of males).
- Velocity arrows drawn in orange on a yellow background fail contrast.
- Focus indicators that are barely visible (e.g., `#AAA` outline on white, which is only 2.3:1 contrast).

**Prevention:**
- Use a contrast checker on every color combination in simulations.
- Never encode information with color alone. Use color plus shape, color plus pattern, or color plus label.
- Test with a color blindness simulator (e.g., Coblis, or Chrome DevTools vision deficiency emulation) for every simulation.
- Set a base contrast standard before building any simulation and apply it to your shared color palette.

---

### 6.3 Keyboard Navigation

**What goes wrong:** The simulation is entirely mouse-dependent. Users who cannot use a mouse — including users with motor disabilities and many power keyboard users — cannot interact.

**Warning signs:**
- Pressing Tab does not move focus into or through simulation controls.
- Pressing Enter or Space on a button does nothing.
- Draggable canvas elements have no keyboard equivalent.
- There is no visible focus indicator on focused controls.

**Prevention:**
- All simulation controls must be standard interactive DOM elements: `<input type="range">` for sliders, `<button>` for actions, `<select>` for options. These receive keyboard focus natively.
- If you implement custom canvas-drawn controls, you must manually implement keyboard interaction from scratch (arrow key navigation, focus management, ARIA roles). This is very hard to do correctly. Prefer native DOM controls.
- Ensure focus indicators are clearly visible. Do not apply `outline: none` without providing an alternative.
- Test by unplugging your mouse and trying to fully operate every simulation using only a keyboard.

---

### 6.4 Motion and Vestibular Disorders

**What goes wrong:** Some users experience dizziness, nausea, or seizures from certain types of animation: rapid flashing, parallax effects, large areas of motion. Physics simulations often involve exactly these patterns.

**WCAG 2.3.1:** No content should flash more than 3 times per second at high contrast.

**Prevention:**
- Respect `prefers-reduced-motion` CSS/JS media query. Slow down or pause animations for users who have indicated this preference in their OS settings.
- Provide a Pause button on every simulation that runs continuously.
- Avoid high-contrast flashing. If a simulation has a collision or explosion effect, ensure it is not a full-screen bright flash.

```css
@media (prefers-reduced-motion: reduce) {
  /* Pause or slow animations */
}
```

---

### 6.5 Touch Target Size

**WCAG 2.5.5 (AAA):** Touch targets should be at least 44x44px. Many simulation controls drawn on canvas or using small HTML sliders fail this requirement on mobile.

**Prevention:**
- Apply `min-height: 44px; min-width: 44px` to all interactive controls.
- Canvas-drawn interactive regions (e.g., a draggable ball) must be large enough to reliably hit on a phone screen.

---

## 7. The "Impressive Demo, Confusing Experience" Trap

This is the single most common failure mode for physics simulation sites built by technically skilled developers. The simulations are correct, visually sophisticated, and impressive to other physicists — and completely opaque to the general public.

### 7.1 Why It Happens

- Developers are domain experts. They cannot remember what it was like to not understand the concept. They build for their own level of comprehension.
- The interesting part (to the developer) is the simulation physics. The interesting part (to the user) is the story — "what does this teach me about the world?"
- The first 30 seconds of a user's encounter with a simulation determines whether they stay or leave. Developers optimize for the 30th minute, not the first 30 seconds.
- "Impressive" and "clear" are in direct tension. More visual elements, more controls, more information on screen makes a demo look more powerful. It makes the experience harder to understand.

### 7.2 Specific Manifestations

**The parameter dump.** The simulation opens with a grid of sliders all at arbitrary default values. There is no suggestion of what to do first. The user tries moving a slider, sees something change slightly, does not know what to make of it, and leaves.

**The terminology wall.** The first thing the user reads is a definition: "This simulation demonstrates the relationship between angular momentum (L = Iω) and torque (τ = dL/dt)..." The user who does not already know what angular momentum is reads this and leaves.

**The broken default state.** The simulation opens with a static scene. A ball sitting still. Nothing happening. The user does not know to press "Play" because the Play button is small and in an unexpected location. First impression: "this is broken."

**The unexplained graph.** A beautifully rendered phase-space diagram appears alongside the simulation. To a physicist, it is elegant. To a general user, it is a blob of moving dots with axis labels they have never seen. They ignore it or are confused by it.

**The expert interface.** Every professional feature is exposed because it might be useful to someone. Advanced users appreciate this. General audiences see an overwhelming, unintuitive panel and disengage.

### 7.3 Prevention Strategies

**Design the first 30 seconds deliberately.** For each simulation, write down exactly what happens in the user's first 30 seconds. What do they see? What do they click first? What do they notice? What do they understand? Optimize for this, not for the full feature set.

**The "grandmother test."** Before shipping a simulation, have someone who has no physics background use it for 5 minutes while you watch silently. Do not explain anything. Watch where they get stuck. Fix those things.

**Show the phenomenon before explaining it.** Start with motion, color change, pattern, or surprise — something visible and engaging — before any text or controls. Give the user something to notice and wonder about before you explain what they are seeing.

**Name things in terms of experience, not physics.** "What happens to the period when you add a heavier ball?" not "Demonstrate mass independence of the simple pendulum."

**One concept per simulation.** Resist adding related concepts to a working simulation. "While I have this pendulum working, I should add normal modes, coupled oscillators, and Fourier analysis." No. Each simulation teaches one thing. Related concepts get their own simulation.

**Write the takeaway before building the simulation.** For each simulation, write one sentence: "After using this simulation, the user should understand that X." If you cannot write that sentence, you do not have a simulation — you have a toy. Toys are fine, but they need different design goals.

**Guided scenario alongside free exploration.** Provide 2-3 specific challenges ("Try to make the pendulum stop swinging by adjusting only air resistance") alongside the free-play mode. Scenarios give users a goal, which makes the experience legible even without prior knowledge.

**Visual hierarchy tells the story.** The most important element — the simulation itself — should be the largest visual element. The primary control should be the most prominent. Secondary controls should be visually subordinate. Explanatory text should be clearly secondary to interaction.

---

## Summary: Top 10 Highest-Risk Pitfalls

These are the pitfalls most likely to cause a physics simulation site to fail or be abandoned. Address each explicitly before it occurs:

| # | Pitfall | Severity | Most Common Cause |
|---|---------|----------|-------------------|
| 1 | Impressive demo, confusing user experience | Critical | Building for expert audience |
| 2 | Scope creep: 50 half-finished simulations | Critical | No frozen v1.0 scope |
| 3 | No shared simulation infrastructure | High | Building simulations before architecture |
| 4 | Mobile unusable (drag/scroll conflict, tiny targets) | High | Desktop-only development |
| 5 | Simulation physics breaks at extreme parameters | High | No edge-case testing |
| 6 | Content writing bottleneck stalls project | High | Treating text as afterthought |
| 7 | Canvas inaccessible to screen readers | Medium-High | No accessibility planning |
| 8 | Color contrast failures in simulation graphics | Medium | No contrast audit |
| 9 | Main thread blocking causes jank on mobile | Medium | No mobile performance testing |
| 10 | Perfectionism prevents shipping | Medium | No definition of "done" |

---

*Research sources: PhET Interactive Simulations (CU Boulder), Falstad.com, Nielsen Norman Group, web.dev (Google Chrome team), W3C WAI accessibility guidelines, WCAG 2.1, MDN Web Docs, Interaction Design Foundation, Smashing Magazine frontend performance research.*
