# Phase 08: Era Gap Fills — Research

**Researched:** 2026-03-22
**Phase goal:** Replace the two remaining stub simulations in Eras 1–2: Stop 002 (Pythagoras / Web Audio harmonics) and Stop 014 (Hooke's Law / elastic–plastic–rupture spring).

---

## Don't Hand-Roll

| Problem | Recommended solution | Why |
|---------|---------------------|-----|
| Web Audio oscillator management | Native `AudioContext` + `OscillatorNode` + `GainNode` — no library needed | The API is well-supported everywhere; wrappers like Tone.js add 100 KB for what is 20 lines of native code |
| Canvas 2D spring coil drawing | Hand-draw with zigzag path (match the pattern in the teaser stub) | Spring drawing is ~15 lines; Matter.js adds nothing for a purely visual static spring |
| F-vs-x curve beyond elastic region | Manually segment the curve into three zones (linear / cubic / flat) | No physics library knows "rupture" for a pedagogical spring — roll the curve from documented k values |
| OG PNG regeneration | Rerun `node scripts/generate-og-svgs.mjs` then convert SVG→PNG — the script already exists | Do not hand-edit the SVGs |

---

## Common Pitfalls

### Stop 002 — AudioContext autoplay policy

**What goes wrong:** Calling `new AudioContext()` at script load time (or inside `SimAPI.start()` called by IntersectionObserver) fails silently in Chrome and Safari. The context is created in `suspended` state, the oscillator plays nothing, and there is no error thrown.

**Why:** Browsers require a user gesture (click, keydown, etc.) before audio can run. The IntersectionObserver intersection event is NOT a user gesture. Because stop 002 has `data-autoplay="false"`, `stop-shell.js` will NOT call `SimAPI.start()` automatically — the user must click a ratio button first. That button click IS a valid user gesture.

**How to avoid:**
- Create the `AudioContext` lazily — only on first ratio button click, not at IIFE startup.
- After creating it, always call `audioCtx.resume()` before scheduling nodes, because even a gesture-triggered context can be suspended on iOS Safari if the app has been backgrounded.
- Guard pattern: `if (audioCtx.state === 'suspended') audioCtx.resume();` before each tone playback.
- Do NOT create a persistent oscillator that you start/stop. Create a new `OscillatorNode` + `GainNode` for each button press, connect them, call `osc.start()` + `osc.stop(audioCtx.currentTime + decay)`, then discard. Persistent oscillators that are `stop()`ped cannot be restarted.

### Stop 002 — data-autoplay is false but the sim-wrapper HTML still says `data-autoplay="true"`

**What goes wrong:** The existing `index.html` for stop 002 has `data-autoplay="true"` on `.sim-wrapper` (line 64). The CONTEXT.md decision overrides this to `false`. If the planner forgets to change this attribute, `stop-shell.js` will call `SimAPI.start()` on viewport entry, which for the new sim means... nothing audible (IntersectionObserver is not a gesture), but the canvas wave animation will start automatically, which may confuse users expecting a silent-until-interaction experience.

**How to avoid:** The `index.html` update task must explicitly flip `data-autoplay="true"` to `data-autoplay="false"` on the `.sim-wrapper` div. This is a one-word change but easy to forget because the current stub HTML says `true`.

### Stop 002 — Standing wave formula

**What goes wrong:** The teaser stub draws the wave as `y + amplitude * sin(freq * PI * progress) * cos(phase)`. This is not a true standing wave — it is a travelling wave modulated by cos(phase). A standing wave is the product of a spatial sine and a temporal cosine: `A * sin(n * PI * x / L) * cos(omega * t)`.

**How to avoid:** Use the correct formula. For harmonic number n on a string of length L (in canvas pixels):
```
y_offset = A * sin(n * PI * (x - x0) / L) * cos(omega * t)
```
where `omega` is an aesthetic animation speed (not the actual audio frequency). The amplitude A should scale down slightly for higher n to keep visuals clean. The nodes (zero crossings) are at `x = x0 + i * L / n` for i = 0..n — these are the fixed endpoints and intermediate fixed points; drawing small dots at each node is a recognized pedagogical enhancement.

### Stop 002 — Ratio-to-harmonic-number mapping

**What goes wrong:** The six ratios map to harmonic numbers, but the mapping is not simply "ratio numerator = n". The harmonic number n is the number of half-wavelengths in the string. The string ratios Pythagoras used are based on string LENGTH ratios, not frequency ratios. A string half as long (2:1 length ratio) vibrates at 2× frequency — that is n=2 (octave). 3:2 is the perfect fifth only when taken as the frequency ratio of the SECOND note relative to the FIRST; in terms of harmonic number the base string is n=1 and the string at 2/3 length plays the fifth (n=2 of the shorter string, but relative to the original it is the 3rd harmonic... this gets confusing).

**How to avoid:** The CONTEXT.md decision is clear: show the harmonic number n of the INTERVAL, not the string. Map the six ratio buttons directly to n values for the canvas:
- 1:1 (unison) → n=1
- 2:1 (octave) → n=2
- 3:2 (perfect fifth) → n=3
- 4:3 (perfect fourth) → n=4
- 5:4 (major third) → n=5
- 9:8 (whole tone) → n=9

For audio, multiply base frequency (220 Hz) by the ratio numerator/denominator to get the played frequency. These are independent: n governs the canvas wave shape; the audio frequency governs what the user hears.

### Stop 002 — GainNode envelope clipping (clicking sound)

**What goes wrong:** If the gain jumps from 0 to 1 instantly at the moment the oscillator starts, the waveform is discontinuous and produces an audible click artifact on all browsers.

**How to avoid:** Use `AudioParam.linearRampToValueAtTime` for attack and `exponentialRampToValueAtTime` for decay. The CONTEXT.md specifies 10ms attack / 800ms decay. A minimal envelope:
```
var now = audioCtx.currentTime;
gain.gain.setValueAtTime(0, now);
gain.gain.linearRampToValueAtTime(0.5, now + 0.01);   // 10ms attack
gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.81); // 800ms decay to near-zero
osc.stop(now + 0.85);
```
The `exponentialRampToValueAtTime` target must never be exactly 0 — use 0.0001. Otherwise the browser throws a `RangeError`.

### Stop 014 — Two-canvas layout vs. single canvas

**What goes wrong:** Trying to put the spring visual AND the F-vs-x graph on a single canvas with complex coordinate transforms is error-prone and makes the rupture/tracking dot logic interleaved and hard to maintain.

**How to avoid:** Use two separate `<canvas>` elements side by side (flex layout in the sim-controls area), OR divide a single canvas into two clearly defined regions (left = spring, right = graph) using a vertical split at `W * 0.5`. The single-canvas split approach matches what stop-010 and stop-012 already do (info panel in one corner, main sim in the rest). It is simpler and requires no extra DOM elements.

### Stop 014 — autoplay starts animation before material/weight state is set

**What goes wrong:** `data-autoplay="true"` means `stop-shell.js` calls `SimAPI.start()` on intersection. If the sim starts the oscillation rAF loop before the slider elements are wired, slider events may not yet be bound. This is fine if setup() runs synchronously — but if `SimAPI.start()` is called before `setup()` completes (e.g., if `stop-shell.js` loads before `sim.js` completes its setup), the canvas may be uninitialized.

**How to avoid:** The load order in the HTML is `sim.js` first, then `stop-shell.js` (lines 125–126 in index.html). The pattern established by stops 010 and 012 wraps all initialization in `setup()` called via `DOMContentLoaded` (or immediately if the document is already loaded). `window.SimAPI` is set at the END of `setup()` — but actually both reference sims set `window.SimAPI` at the IIFE body level, not inside `setup()`. Check: the skeleton poll in `stop-shell.js` (line 69) looks for `window.SimAPI` every 50ms and removes the skeleton once found. Because `sim.js` sets `window.SimAPI` synchronously at parse time (before `setup()` runs), the SimAPI is available immediately. The `IntersectionObserver` fires asynchronously, so setup() will have completed by then. This order is safe.

### Stop 014 — Rupture state needs an explicit reset path

**What goes wrong:** Once the spring snaps (rupture), the weight drops and the spring is visually broken. If the user then moves the slider back to 0, the sim must return to elastic state. Without an explicit `ruptured` flag reset in the slider's `input` handler, the broken spring state persists even after the user tries to recover.

**How to avoid:** Maintain a `ruptured` boolean. On slider `input`, if the slider value is set to 0 (or material is changed), call reset() which sets `ruptured = false`, restores spring geometry, and re-enables slider input. Material selector change must always call reset().

### Stop 014 — Plastic deformation visual without physics complexity

**What goes wrong:** Simulating real plastic deformation requires tracking residual strain, hysteresis, and permanent set — a full constitutive model. That's overkill here.

**How to avoid:** Use a simple piecewise model controlled entirely by slider position:
- Elastic zone (slider 0% to `yieldFraction`): spring extension = `F / k`, coils uniform.
- Plastic zone (slider `yieldFraction` to `ruptureFraction`): extension grows faster (e.g., `yieldExt + (F - yieldF)^0.4 / k`), coils drawn with non-uniform spacing (outer coils wider).
- Rupture (slider crosses `ruptureFraction`): trigger snap animation once; set `ruptured = true`; disable further slider movement until reset.

Realistic k, yield, and rupture values for the three materials:
- **Steel**: k = 500 N/m, yield at x = 0.04 m (F = 20 N), rupture at x = 0.06 m — abrupt, brittle feel.
- **Rubber**: k = 50 N/m, yield at x = 0.40 m (F = 20 N), rupture at x = 1.20 m — very stretchy, gradual.
- **Glass**: k = 800 N/m, yield at x = 0.01 m (F = 8 N), rupture at x = 0.015 m — nearly no plastic zone, instant snap.

These values are scaled for a ~30 cm virtual spring displayed in ~200px height. The actual display extension in pixels should be capped at a visual maximum (~80% of the spring canvas region height) to prevent overflow.

### Both stops — ES5 IIFE with DPR-aware canvas

**What goes wrong:** The teaser stubs set `canvas.width = mount.clientWidth` directly, ignoring device pixel ratio. On Retina/HiDPI screens this makes text and lines blurry.

**How to avoid:** Follow the pattern established by stops 010 and 012: use `window.devicePixelRatio || 1`, multiply canvas `.width`/`.height` by DPR, set `.style.width`/`.style.height` in CSS pixels, and call `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` after resize. This pattern is already proven in the codebase and must be carried forward.

### Both stops — isStub update in stops.json

**What goes wrong:** `stops.json` is a plain JSON file. The `isStub: true` values for stops 002 and 014 control the "Coming Soon" badge on the landing page. They must be changed to `false` as part of this phase.

**How to avoid:** Edit `stops.json` directly — it is a plain string replace from `"isStub": true` to `"isStub": false` within each stop's object. There is no build script to re-run. The `generate-og-svgs.mjs` script reads `stops.json` for SVG generation but does not read `isStub`; it generates SVGs for all stops regardless. The OG SVGs for stops 002 and 014 were already generated in Phase 07 — they do not need to be regenerated unless the content changes. The PNG equivalents were also generated in Phase 07. No regeneration is needed for OG images unless stop title/year/scientist metadata changes (it does not).

---

## Existing Patterns in This Codebase

- **IIFE + SimAPI contract:** All sims are `(function () { 'use strict'; ... window.SimAPI = { start, pause, reset, destroy }; }());`. `var` only — no `const`/`let`. See `/Episodio4/stops/010-galileo-pendulum/sim.js` and `/Episodio4/stops/012-newton-laws/sim.js` for the canonical pattern.

- **DPR-aware canvas resize:** Stops 010 and 012 both use a `resize()` inner function that reads `mount.getBoundingClientRect()`, multiplies by `window.devicePixelRatio`, and calls `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`. This is the pattern to reuse — do not use the simpler `canvas.width = mount.clientWidth` approach from the teaser stubs.

- **`setup()` + DOMContentLoaded guard:** Both reference sims wrap all DOM wiring in a `setup()` function called via `document.addEventListener('DOMContentLoaded', setup)` or directly if `document.readyState !== 'loading'`. This is the correct entry point.

- **Button state management via `dataset.state`:** The play button's text and `data-state` attribute are toggled inside `start()` and `pause()` within sim.js, not just in stop-shell.js. Stop-shell.js also toggles them on click. Both must agree. See stop-010 lines 206–218 for the canonical pattern.

- **oklch era colors in canvas:** Revolution era color is `oklch(0.72 0.15 145)` (green, used for stop 010 pendulum) and `#61bd67` in the CONTEXT.md for stop 014's elastic zone. Ancient era color approximation from stops.json OG metadata: `#c4922a`. Both colors are safe in Canvas 2D `ctx.fillStyle`/`ctx.strokeStyle` — oklch strings work in Chrome 111+ and Firefox 113+; use the hex fallback for broader Safari support since Safari 16.4 added oklch but older versions (still in use) do not support it.

- **data-autoplay parsing in stop-shell.js:** Line 90: `var autoplay = wrapper ? wrapper.dataset.autoplay !== 'false' : true;`. The check is `!== 'false'` (string). Setting the attribute to `"false"` (string) disables autoplay. Setting it to `"true"` or omitting it enables autoplay. Stop 002 needs `"false"`; stop 014 needs `"true"` (already set in current HTML).

- **sim-caption teaser text:** Both index.html files still contain `<span>Teaser — full interactive simulation coming in Phase 8</span>`. This text must be updated to describe the actual interactive controls when the full sim is delivered.

- **Skeleton removal:** `stop-shell.js` removes `.stop-skeleton` once `window.SimAPI` is detected (polling every 50ms). The sim only needs to set `window.SimAPI` at parse time — no special action required.

- **Slider elements expected by sim.js must exist in index.html:** Stops 010 and 012 read slider elements by ID inside `setup()`. If the IDs don't exist the code silently skips binding (`if (lenSlider) { ... }`). Both index.html files need new `<div class="sim-controls">` content with the actual interactive controls (ratio buttons for 002, weight slider + material selector for 014) that the new sim.js will look for by ID.

---

## Recommended Approach

Implement each stop as a self-contained task: first write the full `sim.js` (replacing the stub entirely), then update `index.html` (flip `data-autoplay`, replace teaser caption, add real control HTML, add KaTeX equation to takeaway box), then update `stops.json` (`isStub: false` for both). For stop 002, create the AudioContext lazily inside the first ratio button click handler, not at startup, and use a new OscillatorNode per tone trigger with a proper attack/decay envelope. For stop 014, split the single canvas into a left spring panel and a right F-vs-x graph panel, implement a piecewise elastic/plastic/rupture model driven entirely by the weight slider value, and ensure the `ruptured` flag is reset on material change or slider reset. Both sims must use DPR-aware canvas sizing and follow the `setup()` + `DOMContentLoaded` pattern from stops 010 and 012.

---

*Phase: 08-v2-era-gap-fills*
*Research written: 2026-03-22*
