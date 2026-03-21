# UX Polish Research: How Physics Works
> Research for v2.0 milestone — compiled 2026-03-21
> Based on codebase analysis of Episodio4/ and educational physics UX best practices.

---

## 1. Landing Page — Hero & First-Time Visitor Orientation

**Current state:** Hero has strong visual hierarchy. Eyebrow text establishes scope ("~2,600 years · 50 stops · 5 eras"). Sticky era tabs with blur backdrop. Timeline bar with era colors. Progress bar shows visited count numerically. 38 stub cards have `opacity: 0.5; pointer-events: none` with `::after` content "Coming soon."

**Problems:**
1. First-time visitors hit a 50-item grid with 38 disabled cards — immediate friction.
2. `.stop-card--stub::after` dead ends provide zero context or next step.
3. Progress bar is a completion metric, not a learning arc invitation.
4. Hero stats ("50 Interactive Stops") don't communicate why to visit.

**Fixes:**
1. **"Start Here" pathway:** For first-time visitors (no localStorage visits), show a hero CTA — "Start with Ancient Physics" → highlights first 3–4 implemented stops. Mark stubs with "Unlocking soon" label.
2. **Stub cards → clickable with context:** Remove `pointer-events: none`. Navigate to a stub landing page showing title, subtitle, scientist, era color, 1–2 sentence concept preview, and link to GitHub repo.
3. **Visual era progress timeline:** Replace numeric "5 of 50" with a visual timeline across 5 eras, user's completed stops highlighted.
4. **Reframe hero stats:** "Hands-On Simulations" not "Interactive Stops." "Centuries of Discovery" not "Eras of Physics."

**CSS/HTML touchpoints:**
- `.stop-card--stub` — remove `pointer-events: none`, change `opacity: 0.5` to a "coming soon" badge overlay
- `.hero__stats` — redesign as era-based progress visual
- `.stop-card--stub::after` — replace with release date/context badge
- New: `.hero__timeline-progress` — visual era progress bar

---

## 2. Stop Page Layout — Simulation Viewport & Content Hierarchy

**Current state:** `.stop-page` with `.content-column` (max-width: 680px). `.sim-wrapper` houses canvas. `.sim-container` min-height: 360px. `.sim-controls` below sim with flex-wrap. Content hierarchy: breadcrumb → header → intro → sim → body → takeaway → bridge → nav.

**Problems:**
1. `min-height: 360px` on a 375px phone leaves ~20px margins — cramped.
2. `.sim-controls` stack on mobile — with 2+ sliders, they push below the fold.
3. Intro text above sim: lost above the fold by the time user reaches the simulation.
4. No affordance for interaction — `.sim-caption` is below controls, out of sight.

**Fixes:**
1. **Responsive viewport:** Desktop (>1024px): 500–600px height. Tablet (768–1024px): side-by-side layout, intro on left, sim on right. Mobile (<768px): `min-height: 60vh`, full-width canvas.
2. **Sticky controls on mobile:** Float `.sim-controls` to a sticky bar on small screens (below header, above sim). Hamburger toggle if space is truly constrained.
3. **Interaction hint badge:** `.sim-hint` appears on first visit (sessionStorage), shows "Drag to interact" — fades after 3s or on first interaction.
4. **`data-aspect` attribute:** Let sim scripts set aspect ratio via `data-aspect="4/3"` or `data-aspect="1/1"` on `.sim-container`.

**CSS/HTML touchpoints:**
- `.sim-container` — `@media (max-width: 768px) { min-height: 60vh; }`
- `.sim-controls` — sticky positioning on mobile with backdrop blur
- New: `.sim-hint` — contextual affordance overlay
- `data-aspect` attribute on `.sim-container`

---

## 3. Navigation — Prev/Next UX & Keyboard Shortcuts

**Current state:** `.breadcrumb` at top. `.stop-nav` at bottom (2-column grid). Prev/next buttons with direction label and title. `.stop-counter` shows "Stop N of 50". No keyboard navigation.

**Problems:**
1. No keyboard shortcuts — must scroll to bottom to advance.
2. Breadcrumb doesn't jump to era section on landing page.
3. No visible progress indicator in the sticky header.
4. At stop 50, next button disappears silently — no sense of journey completion.
5. Mobile: prev/next buttons are below all content — most users stop before reaching them.

**Fixes:**
1. **Arrow key navigation:** In `stop-shell.js`, add keydown listener: Left arrow → prev, Right arrow → next, Home → landing page.
2. **Header progress bar:** In `.site-header`, add a slender `.header-progress` bar (2–3px) showing current stop position. Gradient from era color start → next era color. Hoverable to show "Stop N of 50."
3. **Breadcrumb era link:** `.breadcrumb__link` for era links to `#era-[eraname]` on landing, so users jump back to their era context.
4. **Mobile sticky footer nav:** `@media (max-width: 768px)` render `.stop-nav` as a sticky footer bar with large touch targets.
5. **End-of-journey message:** At stop 50, change next to: "You've reached the frontier. Explore other eras →"

**CSS/HTML touchpoints:**
- `.site-header` — add `.header-progress` bar
- `.stop-nav` — `@media (max-width: 768px)` sticky footer positioning
- `stop-shell.js` — keydown listener for arrow keys
- `.breadcrumb__link[href*="#era-"]` — correct anchor links

---

## 4. Mobile Experience — Touch Controls & Responsive Layout

**Current state:** Meta viewport correct. `touch-action: none` on canvas. `.sim-controls` responsive at 640px breakpoint. No touch-specific gesture hints.

**Problems:**
1. No touch affordances — users don't know if they can drag, pinch, or rotate.
2. `.sim-control input[type="range"]` thumb at 18px is borderline for 44px touch target minimum.
3. No visual feedback when canvas is touched.
4. 3+ sliders may overflow horizontally on mobile.

**Fixes:**
1. **Touch hint overlay:** On first stop visit (sessionStorage), show `.sim-touch-hint` with gesture icons. Fade out after 2s or on first touch.
2. **Enlarge slider touch targets:** Add padding and `min-height` to `.sim-control input[type="range"]` to ensure 44px touch zone.
3. **Mobile slider layout:** `@media (max-width: 480px)` stack sliders full-width vertically; buttons 50/50 side-by-side at bottom.
4. **Font sizes:** Ensure no body text shrinks below 16px on 375px phone. `line-height: 1.85` on mobile.

**CSS/HTML touchpoints:**
- `.sim-control input[type="range"]` — increase padding and `min-height` on mobile
- New: `.sim-touch-hint` — gesture instruction overlay
- `.sim-controls` — refine mobile layout

---

## 5. Typography & Readability

**Current state:** Display: Cormorant Garamond. Body: DM Sans. Fluid type scale. `line-height: 1.7` body. Max-width 68ch. `--color-text-muted: oklch(0.50 0.02 90)`.

**Problems:**
1. `line-height: 1.7` is tight for long-form science content (12+ line stops).
2. Muted text at `oklch(0.50 0.02 90)` may be borderline WCAG AA against dark background.
3. `.era-tab` uses `--text-xs` + mono — becomes ~10–11px on mobile, cramped.

**Fixes:**
1. **Increase body line-height:** `body { line-height: 1.9; }`. Specifically `.stop-body p, .stop-intro p { line-height: 1.9; }`.
2. **Boost muted text contrast:** `--color-text-muted: oklch(0.55 0.02 90)` or higher. Test with Lighthouse for 5:1+ ratio. Affects `.breadcrumb`, `.sim-control__label`, metadata.
3. **Era tab mobile legibility:** `@media (max-width: 640px)` increase `.era-tab` font-size by 0.1rem, reduce letter-spacing to `0.04em`.
4. **List item max-width:** `.takeaway-box__list li { max-width: 70ch; }` to prevent runaway bullet points.

---

## 6. Simulation UX — Controls Affordances & Default States

**Current state:** Labeled sliders with value display. Play/reset buttons. `.sim-caption` with pulsing dot. Play starts paused.

**Problems:**
1. Sliders don't explain what they do or why the default value is interesting.
2. Inert default state — no affordance clarifying whether to click play or leave it.
3. Minimal visual feedback when play is clicked (only button text changes).
4. `.sim-btn-reset` blends into page background.
5. No real-time feedback between slider adjustment and visual outcome.
6. Slider ranges feel arbitrary (no scale anchors like "0.0 = Earth, 0.4 = Mercury").

**Fixes:**
1. **Slider tooltips:** `<title>` attribute or `.sim-control__tooltip` on hover — explains effect and range meaning. e.g., "Eccentricity: 0 = circle, 0.4 = Mercury, 0.9 = comet."
2. **`data-autoplay` attribute:** Let each stop set whether sim auto-plays. Exploratory sims → auto-play. Parameter-heavy sims → start paused.
3. **Play/pause visual feedback:** On click, brief canvas glow animation + button scale 1.1.
4. **Emphasize reset button:** Add era-accent color as a border or subtle background-opacity to `.sim-btn-reset`.
5. **Real-time slider update:** Update sim live on slider drag (if performance allows), or show a preview outline of the new state.
6. **Slider range anchors:** New `.sim-control__hint` below slider showing landmark values with context.

**CSS/HTML touchpoints:**
- `.sim-control input[type="range"]` — add tooltips
- `.sim-btn-play` — add glow animation on click
- `.sim-btn-reset` — increase visual prominence
- `.sim-container` — canvas pulse animation when running
- New: `.sim-control__hint` — range context labels
- `data-autoplay` attribute on `.sim-wrapper`

---

## 7. Performance Perception — Loading States & Transitions

**Current state:** No loading state or skeleton screen. Simulations load synchronously. Stub stops: `pointer-events: none`, no stub page exists.

**Problems:**
1. Blank canvas for 1–2 seconds on first load — no indication of what's happening.
2. Page-to-page transitions are full reloads — no visual continuity.
3. 38 stubs are dead ends (clicking does nothing).
4. Progress bar on landing waits for nav.js + stops.json fetch.

**Fixes:**
1. **Skeleton screen:** `.stop-skeleton` component mimicking stop page layout. CSS shimmer animation. Replace with real content when sim.js is ready.
2. **Page transitions:** CSS `view-transition-name` + `startViewTransition()` for cross-fade/slide between stops.
3. **Stub stop pages:** Static HTML template per stub stop (or generated by nav.js). Shows: era-colored header, title, subtitle, 1–2 sentence concept preview, placeholder illustration, "Coming [timeframe]" label, prev/next to adjacent implemented stops.
4. **Defer heavy JS:** `<script defer>` for matter.min.js and p5.min.js. Show `.sim-loading` indicator until sim is ready.
5. **Header load progress:** Subtle `.header-progress` bar filling as page assets load.

---

## 8. Stub Page Experience

**Current state:** 38 stubs with `opacity: 0.5; pointer-events: none` on landing. No stub stop pages exist.

**Problems:**
1. Curious users get a dead end — no page, no context, no next step.
2. "Coming soon" is vague with no timeline or invitation to engage.
3. No contribution path for developers or educators.
4. Grid looks incomplete/abandoned to first-time visitors.

**Fixes:**
1. **Stub stop page template** (highest priority): Navigate to a custom page that shows:
   - Era-colored hero with stop title, subtitle, scientist name
   - 1–2 sentence concept preview (from stops.json `description` field)
   - Abstract/placeholder illustration or physics teaser visual
   - "This stop is coming soon" + GitHub contribution link
   - Prev/next navigation to adjacent implemented stops
2. **Stub card styling:** Change from opacity: 0.5 to a "coming soon" badge overlay. Keep card clickable. Show era color and concept at a glance.
3. **Extend stops.json:** Add optional `releaseDate` field per stub. Render on stub cards as tooltip and on stub stop pages.
4. **Contribution section on landing:** Below era grid, add a section: "Help build the next simulation — open an issue or submit a PR."

---

## Priority Ranking

| Priority | Change | Effort | Impact |
|----------|--------|--------|--------|
| P1 | Stub stop pages with context + navigation | Medium | Very High — turns 38 dead ends into continuations |
| P1 | Keyboard arrow navigation (stop-shell.js) | Low | High — power users + accessibility |
| P1 | Mobile sim viewport (60vh) | Low | High — 40%+ of traffic |
| P1 | Increase line-height to 1.9 | Low | Medium — readability on long stops |
| P2 | Sticky mobile prev/next footer | Medium | High — navigation completion |
| P2 | Slider tooltips + range anchors | Medium | Medium — reduces control confusion |
| P2 | Skeleton screen loader | Medium | Medium — perceived performance |
| P2 | Muted text contrast boost | Low | Medium — WCAG AA compliance |
| P3 | Page view transitions | Medium | Medium — immersion |
| P3 | Real-time slider preview | High | Medium — engagement |
| P3 | Touch gesture hints | Low | Medium — mobile UX |
| P3 | `data-autoplay` per stop | Low | Low-Medium — sim discoverability |
