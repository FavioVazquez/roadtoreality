# FEATURES.md — Interactive Physics History Website
## Research Document for a ~50-Stop Static Site Aimed at the General Public

*Comparable reference: [howaiworks](https://encyclopediaworld.github.io/howaiworks/) — a 50-model, 220-year, 8-era interactive AI history site*

---

## TABLE OF CONTENTS

1. [Table Stakes Features](#1-table-stakes-features)
2. [Differentiator Features](#2-differentiator-features)
3. [Anti-Features](#3-anti-features)
4. [Site-by-Site Analysis](#4-site-by-site-analysis)
5. [Must-Have Physics History Topics](#5-must-have-physics-history-topics)
6. [Design Philosophy Summary](#6-design-philosophy-summary)

---

## 1. TABLE STAKES FEATURES

These are the baseline expectations. A serious physics education site for the public that lacks these will feel incomplete, amateurish, or frustrating — regardless of how good the content is.

### 1.1 Navigation & Structure

- **Clear chronological or thematic structure** visible at a glance. Users must be able to orient themselves instantly: "Where am I in the story? What comes next? What did I miss?" A persistent sidebar, timeline scrubber, or era header solves this.
- **Progress indication** — users need to know how far through the experience they are (e.g., "Stop 12 of 50" or a progress bar). Without this, the experience feels bottomless and people give up.
- **Prev/Next navigation** between stops that always works, even without JavaScript for the interactive parts. Never strand a user.
- **Jump-to navigation** — a table of contents, index, or clickable timeline map so returning users can skip to what interests them. Forcing linear-only navigation is a form of user disrespect.
- **Descriptive page titles and URLs** — each stop should have a human-readable URL (e.g., `/stops/newtons-laws` not `/stop/12`) for shareability and bookmarking.

### 1.2 Readability & Typography

- **Comfortable reading width** — body text should be 60–75 characters per line (roughly 600–750px). Full-width prose causes eye fatigue and is one of the most common mistakes on science sites.
- **Sufficient contrast** — minimum WCAG AA (4.5:1 for body text). Dark-on-light or light-on-dark both work, but low-contrast "elegant" grey-on-grey text is an accessibility failure.
- **Legible font sizes** — at minimum 16px body text, 18px preferred. Never go below 14px for any sustained reading.
- **Mathematical notation rendered properly** — use MathJax or KaTeX. Raw LaTeX strings (`E = mc^2`) are unacceptable; equations must be typeset. This is non-negotiable for a physics site.
- **Consistent visual hierarchy** — H1, H2, H3 sizes and weights must be meaningfully distinct so users can scan sections.

### 1.3 Interactivity Baseline

- **Each simulation must work without a plugin** — no Java applets, no Flash, no Unity Web Player. Pure HTML5/Canvas/WebGL or D3/p5.js. This has been table stakes since ~2015.
- **Immediate feedback on interaction** — if you drag a slider, something must change within 100ms. Laggy simulations destroy the "I am in control" feeling that is the entire point.
- **Visible controls with clear labels** — sliders, buttons, and inputs must be labeled with the quantity they control and its units. "Mystery knob" UX is the norm on older physics sites (falstad.com is a prime offender) and kills comprehension.
- **Reset button on every simulation** — users will break things, mess up parameters, and need to start fresh. Always provide a reset to a working default state.
- **Works on mobile** — at minimum, simulations should be viewable on a phone screen. If a simulation genuinely requires mouse input, display a clear message: "Best experienced on desktop." Never silently break.

### 1.4 Content Quality

- **Explanatory text for every simulation** — every interactive stop needs: (a) what the simulation shows, (b) what to look for, (c) why it matters. Without narrative context, simulations are just pretty toys.
- **Historical anchoring** — each stop needs the date, the person, the place, and the consequence. "Newton published this in 1687 and it governed physics for 200 years" is load-bearing context.
- **Plain-language explanations first, math second** — general public users will bounce if the first sentence contains an equation. Lead with the concept, the story, or the wonder; introduce formalism only after the reader is hooked.
- **Accurate and reviewed content** — physics errors erode trust immediately among even partially-informed readers. Explanations should be checked against standard references (Feynman Lectures, Halliday/Resnick, or equivalent).

### 1.5 Performance

- **Fast initial load** — the landing page should load in under 3 seconds on a typical broadband connection. Heavy simulations should lazy-load, not block the page.
- **No broken interactive elements** — every simulation on every stop must be tested and working. A broken simulation is worse than no simulation: it signals abandonment and destroys trust.
- **Works without an account** — no login wall, no email capture before engaging with content. The entire experience must be freely accessible.

### 1.6 Accessibility Minimums

- **Keyboard navigability** — the site must be explorable without a mouse.
- **Alt text on images** — all illustrative diagrams must have descriptive alt text.
- **ARIA labels on interactive controls** — sliders and buttons need labels that screen readers can announce.
- **Captions on any embedded video** — if you use video, it must be captioned.

---

## 2. DIFFERENTIATOR FEATURES

These are the features that separate a site people recommend from one they merely tolerate. They require more design investment but are the reason visitors share the link.

### 2.1 Narrative Architecture (The "Story" Layer)

- **A single coherent narrative voice** — the best public physics education has a narrator. Not a textbook author, not a committee — a voice with opinions, wit, and genuine enthusiasm. Think Feynman's *Six Easy Pieces*, Sagan's *Cosmos*, or the tone of ncase.me. This is the single biggest differentiator between forgettable and memorable.
- **Era-based grouping with transition moments** — rather than a list of 50 topics, organize stops into 6–8 thematic eras (e.g., "The Clockwork Universe," "The Age of Fields," "The Quantum Revolution"). Era transitions should be marked with a brief interstitial explaining what changed and why it mattered. This gives users a sense of intellectual progress, not just a list.
- **Connective tissue between stops** — each stop should end with a sentence or two bridging forward: "Newton's mechanics dominated for 200 years — until a young patent clerk in Bern noticed a problem with light." This creates narrative momentum and reduces drop-off.
- **The "so what" is always explicit** — every stop must answer: why did this discovery change the world? What became possible that wasn't before? What did people believe before, and how did they react? Without stakes, physics history is trivia.

### 2.2 Interactive Design That Teaches (Not Just Demonstrates)

- **Guided discovery mode** — instead of presenting a simulation and saying "play with it," structure the interaction: "Drag the mass heavier. What happens to the period? Now drag it lighter. Does mass matter? You just discovered what Galileo found in 1602." This turns a toy into an experiment.
- **Before/after scenarios** — present a misconception first ("Most people think heavier objects fall faster"), let the user predict, then run the simulation, then reveal the result. Cognitive conflict followed by resolution is the most effective learning pattern known.
- **Graduated complexity within a stop** — start with the simplest case (one ball, no friction, one dimension), then progressively reveal more variables. Never dump all controls on a user at once. PhET does this well with their simulation layering.
- **Annotated "wow moments"** — mark the critical insight in each simulation with a callout. "Watch what happens when you cross this threshold." Users often miss the interesting thing without guidance.
- **Interactive parameters tied to real-world examples** — default values should match real physics. A pendulum simulation should default to ~1-meter length (period ≈ 2 seconds), not an arbitrary 500px. When a slider reaches Earth's gravity (9.8 m/s²), label it "Earth." When it reaches Mars gravity (3.7 m/s²), label it "Mars." This grounds abstraction in reality.

### 2.3 Historical Drama & Human Stories

- **Portraits and human context** — show who made each discovery. A brief (2–3 sentence) biography focused on the moment of discovery, not a Wikipedia summary. "Faraday had no formal education. He taught himself physics from library books. Then he discovered the principle that powers every electric motor on Earth."
- **Controversy and wrong turns** — physics history is full of wrong theories held for centuries (phlogiston, caloric, luminiferous ether, steady-state universe). Showing these makes the eventual discoveries more dramatic and teaches that science is a process of correction, not a march of obvious truths.
- **The experiment as drama** — describe famous experiments narratively. Eratosthenes measuring the Earth with a stick and some shadows. Young's double-slit experiment proving light is a wave. Eddington's eclipse expedition confirming Einstein. These are great stories, not just data points.
- **Contemporary impact callouts** — for each discovery, a small "This is in your ___" callout: "This principle is in your microwave oven / MRI machine / smartphone GPS." Anchoring physics in objects people own makes abstract theory concrete.

### 2.4 Visual & Aesthetic Excellence

- **Color-coded eras** — each of the 6–8 eras should have a distinct color palette used consistently in backgrounds, accents, and UI elements. This creates a strong sense of "place" and progress. The howaiworks site does this effectively.
- **Era-appropriate visual language** — the "Ancient Greeks" era should feel different from the "Quantum Age" era. This doesn't require elaborate illustration — it can be achieved through typography choices, color, and border styles.
- **Beautiful equation display** — a physics site should treat its equations as visual objects worth looking at, not obstacles. Large, well-spaced, colored typeset equations with verbal descriptions below.
- **Animated concept illustrations** — CSS or SVG animations for concepts that don't need a full simulation: an oscillating wave showing wavelength and frequency, orbiting electrons (even if simplified), the expansion of spacetime. Motion clarifies in ways static images cannot.
- **Dark mode** — a substantial portion of technical-interest users prefer dark mode. Provide it, and make it remember the preference. This is standard in 2024 and its absence is increasingly jarring.

### 2.5 Discovery & Exploration Features

- **Physics "family tree" / concept map** — a visual showing how discoveries connect and build on each other. Maxwell built on Faraday. Einstein built on Maxwell. Quantum mechanics built on Planck and Einstein. Seeing the tree of knowledge is itself educational and invites non-linear exploration.
- **"Did You Know" contextual asides** — small, collapsible sidebar facts that reward curious readers without cluttering the main narrative. "Faraday's electricity experiments were initially dismissed as 'interesting but useless.' Prime Minister Gladstone reportedly asked what use it was. Faraday replied: 'One day, sir, you may tax it.'"
- **Shareable individual stops** — each stop should have an Open Graph image and description so that sharing stop URLs on social media produces a rich, compelling preview. This is how the site spreads.
- **Search** — even on a static site, a client-side search (Fuse.js, Pagefind) allows users to find the stop relevant to what they're curious about. Without search, the only navigation is forward/backward, which is insufficient for 50 stops.
- **"Random stop" button** — a curiosity-driven entry point for users who don't want to start at the beginning. This rewards serendipitous exploration and is a lightweight feature with high delight value.

### 2.6 Learning Reinforcement

- **Key takeaway box at each stop end** — a 2–3 bullet "What you just learned" summary. This serves both as reinforcement for engaged readers and as a skim-friendly summary for busy ones.
- **Glossary of terms** — a persistent, linkable glossary. When "electromagnetic induction" appears in text for the first time, it should link to a definition. Users who don't know the term shouldn't have to leave the site.
- **"Explore further" links** — curated external links (Wikipedia, PhET simulations, YouTube videos, original papers where accessible) for users who want to go deeper. Don't try to be everything; be the best gateway.
- **Concept connections** — when a stop refers to a concept introduced at a previous stop, link back. "This builds on what you saw with Faraday's Law (Stop 28)." This rewards linear reading and helps non-linear readers orient themselves.

### 2.7 Social & Sharing

- **Quote cards** — beautiful, shareable image cards for famous physics quotes. "If you thought that science was certain — well, that is just an error on your part. — Feynman." Auto-generated from a template, shareable as images. These are low-cost and high-virality.
- **Clear attribution and citation** — every factual claim should be traceable. A "Sources" section at the bottom of each stop (collapsed by default) listing the references used. This signals intellectual seriousness and builds trust.

---

## 3. ANTI-FEATURES

These are design choices that seem reasonable but actively harm the user experience. Many appear on well-intentioned physics education sites.

### 3.1 Content Anti-Patterns

**Jargon-first writing.** Opening a stop with "Maxwell's equations are a set of coupled partial differential equations that, together with the Lorentz force law, form the foundation of classical electrodynamics" loses 90% of the target audience in the first sentence. The jargon must be earned, not assumed. Start with the phenomenon ("Light is an electromagnetic wave — and we didn't know that for most of human history"), then build toward formalism.

**Over-qualification at the expense of clarity.** "While this is a simplified model that does not account for relativistic effects and assumes a Newtonian framework in flat spacetime..." — these disclaimers belong in footnotes, not the opening paragraph. Accuracy can coexist with accessibility if caveats are placed appropriately.

**Treating the audience as students rather than curious adults.** General public learners are motivated by wonder and relevance, not grades. A "quiz" or "test yourself" framing triggers anxiety and produces the feeling of being back in school. Frame challenges as exploration ("Can you figure out what changes the frequency?") not assessment ("Question 3 of 10").

**Wall-of-text syndrome.** Long paragraphs without visual breaks, diagrams, or pull quotes are the fastest way to lose a general audience. Every ~200 words of prose should be broken by something visual — a diagram, a quote, an equation, a simulation, or just a visual divider.

**Copying textbook structure.** Organizing stops as "Chapter 1: Kinematics," "Chapter 2: Dynamics" etc. signals that this is a course, not a story. A narrative history of physics should feel like a journey through time, not homework.

### 3.2 Simulation Anti-Patterns

**Simulations without explanation.** Falstad.com is the prime example: extraordinarily powerful simulations, almost no explanatory text, no guidance on what to look for. The result is a tool that experts love and beginners find completely impenetrable. A simulation without a narrative framing is a demo, not education.

**Too many controls exposed simultaneously.** PhET simulations sometimes overwhelm beginners by showing all variables at once. If a simulation has more than 4–5 controls visible at the start, users freeze. Progressive disclosure — revealing controls as they become relevant — reduces this.

**Controls without units or context.** A slider labeled "Speed" from 0 to 100 teaches nothing. A slider labeled "Speed (m/s) — 0 to 300,000 km/s (speed of light)" teaches scale, context, and a concept in a single label.

**Non-resettable state.** If a user adjusts 8 parameters and doesn't understand what happened, they need to reset. Without a visible, prominent reset button, they will leave.

**Animations that can't be paused or slowed.** For complex dynamics (orbital mechanics, wave interference), the interesting moment often passes too fast. Pause, step-forward, and slow-motion controls are essential for comprehension, not optional.

**Simulations that require downloading software or enabling plugins.** Any friction in accessing a simulation will eliminate 50%+ of potential users. It must work in a browser tab with zero setup.

**Mobile-breaking simulations without fallback.** If a simulation truly can't work on mobile (complex mouse-drag mechanics), provide a static image with an explanation and a note to "view on desktop for the full interactive experience." Never show a broken or clipped simulation.

### 3.3 Navigation Anti-Patterns

**Forcing strictly linear navigation.** Some users will arrive at Stop 30 from a search engine or social share. They must be able to orient and engage without having seen Stops 1–29. Each stop should be self-contained enough to stand alone, even if it's richer in context when experienced linearly.

**Auto-playing animations on page load.** Users who return to a stop or scroll past it quickly shouldn't have to fight the page. Animations should start on scroll-into-view or on explicit user action, not on page load.

**Hiding the table of contents.** The era/stop structure is a key feature — seeing all 50 stops is part of the appeal ("wow, this covers everything from Archimedes to quantum computers"). Don't hide it behind a hamburger menu. Expose it as a major navigation element.

**No way to return to the overview.** Users must always be able to get back to the main map/timeline with one click. Being stranded inside a stop with no visible exit is a dark pattern.

### 3.4 Performance Anti-Patterns

**Loading all simulations on page load.** 50 simulations worth of JavaScript loaded at once will cripple page performance. Each stop's simulation should be lazy-loaded only when the user reaches that stop.

**Uncompressed assets.** Large unoptimized images, unminified JavaScript, and uncompressed JSON will make the site feel slow on mobile and in constrained network environments (schools, developing countries). Optimize everything.

**Blocking fonts.** Custom fonts should use `font-display: swap` and fall back gracefully. A blank white page while custom fonts load is a common cause of perceived slowness.

**Canvas/WebGL simulations that lock the main thread.** Heavy computation should run in Web Workers. A simulation that freezes scrolling or makes the page unresponsive will be closed immediately.

### 3.5 Aesthetic Anti-Patterns

**Overuse of particle backgrounds.** Animated particle systems (the "starfield" or "floating dots" aesthetic) are visually impressive for ~3 seconds and then become distracting visual noise during reading. Use them sparingly — perhaps only on landing/transition pages, never behind body text.

**Dark overlay text on image backgrounds.** Text over photographs or busy illustrations almost always fails contrast requirements and is hard to read. Use solid color backgrounds or heavy gradients for text areas.

**Physics aesthetic clichés.** Wireframe spheres, generic "atom" diagrams (the Bohr model used as a logo), circuit traces as backgrounds — these signal that no designer thought hard about the visual identity. Aim for more specific, era-appropriate imagery.

**Gratuitous 3D for its own sake.** Three.js 3D scenes are impressive to build and often worse for education than a clear 2D diagram. 3D adds cognitive load. Use it when the physics genuinely requires three dimensions (crystal structure, spacetime geometry); default to 2D for everything else.

**Font size ego.** Using very large display fonts on landing pages that push actual content below the fold. The first screenful should communicate purpose and invite engagement, not just be a hero image.

### 3.6 Trust & Credibility Anti-Patterns

**No attribution or sources.** A physics education site with no citations looks untrustworthy to even casually informed readers. Include a sources section per stop.

**Oversimplification that introduces errors.** "Electrons orbit the nucleus like planets orbit the sun" is wrong enough to create persistent misconceptions. When a simplification is necessary, flag it: "This is a simplified model — the reality is stranger." Respected educators earn trust by being honest about what they're leaving out.

**Broken links.** External links that 404 signal abandonment. Audit external links periodically, or link only to highly stable resources (Wikipedia, ArXiv, institutional pages).

---

## 4. SITE-BY-SITE ANALYSIS

### 4.1 howaiworks (encyclopediaworld.github.io/howaiworks) — The Direct Reference

**What it does well:**
- **Era-based structure with color coding** — 8 eras with distinct accent colors and glow effects create a strong sense of place and progress through time
- **Scope clarity up front** — "50 Models · 220 Years · 8 Eras" immediately tells users what they're getting into; this bounded-ness reduces intimidation
- **Promise of hands-on demos for every entry** — "interactive demo you can touch" for all 50 models creates consistent expectations
- **Monospace + serif typography contrast** — the typographic pairing creates a visual identity that feels technical but readable
- **Chronological narrative** — the historical ordering gives the experience an inherent story arc without needing a separate narrative layer
- **Particle background animation** — used as an atmospheric element on landing without cluttering content areas
- **Open licensing** — Apache 2.0 + CC BY 4.0 builds trust and credibility

**What to improve for a physics version:**
- The AI site's strongest feature (interactive demos per entry) is also its fragility point — physics simulations are harder to make than ML demos, and quality must not vary wildly between stops
- A physics history site needs more explicit narrative connective tissue — the discoveries build on each other in ways that need to be made explicit
- Physics has more complex mathematics than ML history — the equation display strategy needs to be deliberate from the start

---

### 4.2 PhET Interactive Simulations (phet.colorado.edu)

**What it does well:**
- **Research-backed pedagogical design** — PhET simulations are developed with learning science research, not just intuition. They progressively disclose complexity, guide discovery, and are tested on actual students.
- **HTML5 everywhere** — the full migration from Java to HTML5 means zero-plugin access across devices
- **Multilingual support (40+ languages)** — the global audience reach is extraordinary and demonstrates commitment to access
- **Mobile/tablet versions** — many simulations work on touch devices
- **Customizable via "Studio"** — educators can lock certain parameters to focus student attention
- **Free and open** — no paywall, no account required for core use
- **Visual polish** — simulations are well-illustrated, with cartoon aesthetics that lower intimidation without sacrificing accuracy

**What it does poorly:**
- **Simulation-first, context-last** — PhET provides simulations without narrative. There is no story, no history, no "why does this matter." It assumes the teacher provides context.
- **No historical framing** — a PhET simulation of a pendulum doesn't mention Galileo, the development of clocks, or the history of simple harmonic motion. It's physics without a story.
- **Overwhelming controls on some simulations** — some PhET sims (e.g., "My Solar System") expose a large control panel at launch that can freeze beginners
- **No coherent journey** — simulations are a menu, not a narrative. There is no sense of progression from one discovery to the next.
- **Search/filter UX is functional but not inspiring** — the grid of simulation cards is efficient but doesn't invite exploration

**Key lessons for our site:**
- Borrow PhET's progressive disclosure of simulation controls
- Borrow PhET's clean, cartoon-adjacent visual style for simulations
- Do NOT borrow the simulation-menu structure — our site needs the story layer PhET lacks

---

### 4.3 The Feynman Lectures Online (feynmanlectures.caltech.edu)

**What it does well:**
- **The content is the gold standard** — Feynman's explanations remain the clearest, most insightful introductions to physics ever written for a broad educated audience
- **Faithful typesetting** — equations are beautifully rendered in MathJax, figures are clean
- **Authoritative and complete** — three volumes covering essentially all of undergraduate physics
- **Free and open access** — after years of restrictions, the lectures are now freely available online
- **Simple, clean layout** — no distractions; text and equations, that's it

**What it does poorly:**
- **No interactivity whatsoever** — it is a book on a screen. There are no simulations, no interactive diagrams, no animations. This is the biggest missed opportunity in physics education online.
- **Assumes university-level math** — the "general public" will be lost by the end of the first chapter. Feynman's genius is in the conceptual clarity, but the mathematical machinery is advanced.
- **No navigation aids for non-linear readers** — no search, no concept map, no "if you liked this, explore this"
- **Static images** — diagrams that could be animated (wave interference, field lines, orbital mechanics) are static black-and-white figures
- **No historical narrative** — even though Feynman was a masterful storyteller, the lecture format presents physics topics, not physics history

**Key lessons for our site:**
- Emulate Feynman's conceptual clarity and narrative voice — lead with the idea, not the formula
- Build the interactivity the Feynman Lectures are missing — our simulations should illustrate the moments Feynman describes
- Don't assume math background — use formulas as decoration and confirmation, not as primary explanation

---

### 4.4 Falstad Physics Applets (falstad.com)

**What it does well:**
- **Extraordinary depth and breadth** — 40+ simulations covering waves, acoustics, electromagnetism, quantum mechanics, orbital mechanics, and more. This is one person's lifework.
- **Real-time, accurate physics** — the simulations are computationally honest. Field visualizations, quantum wavefunction evolution, and wave propagation are genuinely accurate.
- **Converted from Java to JavaScript** — the accessibility migration means no plugins required
- **Thumbnail previews** — animated GIF previews on the index page show what each simulation does before clicking
- **Free with no barriers** — no account, no paywall, instant access

**What it does poorly:**
- **Catastrophically poor onboarding** — every simulation opens with zero context: no explanation of what it shows, no guided exploration, no learning objective. "Right-click to change setup. Drag to move charges." That's it.
- **No explanatory text** — there is essentially no prose on the site. A quantum wavefunction simulation is presented to a general public user with no explanation of what a wavefunction is.
- **Assumes prior expertise** — controls assume the user knows what they're looking at. Labels are technical (e.g., "TE mode," "TM mode," "Slit width in wavelengths") without any glossary.
- **No difficulty levels** — the same interface is presented to a high school student and a physics PhD.
- **Visual design frozen in ~2005** — the applet interface aesthetics are dated and create an immediate impression of an abandoned project
- **No narrative** — these are tools, not experiences. There is no story, no history, no human connection.

**Key lessons for our site:**
- Falstad is the "raw material" we want to wrap in a story and an explanation. The simulation quality target is Falstad; the experience target is ncase.me.
- Every simulation needs guided exploration: "Try this. Notice that. Now try this."
- Never show a simulation without at least a paragraph of context.

---

### 4.5 Brilliant.org (Physics Courses)

**What it does well:**
- **Polished, modern interface** — visually the most sophisticated physics education platform. Clean typography, beautiful illustrations, dark mode, responsive design.
- **Interactive problems embedded in lessons** — rather than separating "reading" from "problems," Brilliant integrates interactive questions directly into the lesson narrative
- **Graduated difficulty paths** — "Foundational," "Intermediate," and "Advanced" tracks with clear guidance
- **Beautiful diagrams** — hand-crafted illustrations are consistent and high-quality throughout
- **Mobile-first** — works excellently on phones, arguably better than desktop

**What it does poorly:**
- **Paywalled after a few lessons** — most content requires a subscription (~$15–25/month). This is incompatible with our goal of free, open access.
- **Course structure, not history** — Brilliant teaches physics as a curriculum (forces, energy, waves, etc.) not as a historical narrative. The human stories, the controversies, and the timeline are absent.
- **Assessment-heavy** — the learning model is heavily quiz-based. This is effective for motivated students but creates an anxiety-laden experience for casual adult learners.
- **No free exploration** — you must follow the prescribed learning path. There is no "wander through physics history" mode.

**Key lessons for our site:**
- Match Brilliant's visual polish target — sloppy design signals low-quality content
- Borrow the "interactive question embedded in narrative" technique — instead of separating simulation from text, weave them together
- Do NOT adopt the quiz/assessment model for a general-public site
- Provide everything free — this is non-negotiable for general public reach

---

### 4.6 ncase.me Interactive Essays

**What it does well:**
- **The gold standard for interactive narrative** — Nicky Case's essays (e.g., "To Build a Better Ballot," "The Evolution of Trust," "Parable of the Polygons") prove that interactive content can be both deeply educational and genuinely delightful for a general audience
- **Graduated interaction** — interactions start simple (one voter, one choice) and build complexity as understanding is established. The reader is never thrown into the deep end.
- **Playful but not condescending** — the tone is warm, witty, and curious. It assumes the reader is intelligent but not expert. This is the hardest tone to achieve and the most important.
- **Before/after prediction model** — many essays ask users to predict outcomes before revealing them. This creates cognitive engagement and makes discoveries land emotionally.
- **Geometric characters with personality** — abstract concepts (voters, agents, cells) become characters. The personification makes abstract mathematics feel consequential.
- **Self-contained** — each essay works completely without reading others. A user can share one essay and the recipient gets the full experience.
- **Open source and public domain** — maximum trust and reuse
- **No account, no paywall** — immediate friction-free access

**What it does poorly:**
- **Not a physics site** — the techniques must be adapted for physics, which has more quantitative demands than social science or game theory
- **Individual essays, not a coherent series** — ncase.me is a portfolio, not a journey. There is no narrative arc connecting essays. Our site needs both the individual quality AND the coherent arc.
- **No historical framing** — essays are about ideas, not about the discovery of those ideas

**Key lessons for our site:**
- The ncase.me tone and interaction model is the primary UX target. Every stop should feel like a ncase.me essay in both quality and playfulness.
- The prediction-before-answer technique is essential for engagement.
- Personification and metaphor are powerful — make physics concepts feel like characters in a story.
- Write in first/second person ("You," "Let's," "Notice how") — not third-person academic prose.

---

## 5. MUST-HAVE PHYSICS HISTORY TOPICS

The following represents approximately 50 "stops" organized into 8 eras. These are the milestones that any serious physics history site must address to be considered comprehensive by a general educated audience.

---

### ERA 1: THE ANCIENT FOUNDATION (~600 BCE – 1500 CE)
*"When Philosophy Became Physics"*

| Stop | Discovery / Figure | Date | Core Concept | Why It Matters |
|------|-------------------|------|--------------|----------------|
| 1 | Thales / Pre-Socratic cosmology | ~600 BCE | Nature has natural (not supernatural) causes | The founding assumption of all science |
| 2 | Pythagoras & the music of spheres | ~500 BCE | Mathematics describes physical reality | First claim that nature is mathematical |
| 3 | Democritus & atoms | ~400 BCE | Matter is made of indivisible particles | The atom hypothesis — 2,300 years before proof |
| 4 | Aristotle's physics | ~350 BCE | Elements, natural places, circular motion | The dominant framework for 1,800 years — and why overthrowing it was so hard |
| 5 | Archimedes — buoyancy, levers, machines | ~250 BCE | Quantitative mechanics, hydrostatics | The first mathematical engineer; the "eureka" moment |
| 6 | Eratosthenes measures the Earth | ~240 BCE | Geometry applied to geophysics | The Earth's size calculated with a stick and shadows — mind-expanding precision |
| 7 | Ptolemy's geocentric model | ~150 CE | Epicycles, predictive astronomy | The power and limitation of a wrong model that predicted well |

---

### ERA 2: THE SCIENTIFIC REVOLUTION (1500 – 1700)
*"Tearing Down the Cathedral"*

| Stop | Discovery / Figure | Date | Core Concept | Why It Matters |
|------|-------------------|------|--------------|----------------|
| 8 | Copernicus — heliocentric model | 1543 | Sun-centered solar system | The first major demolition of Aristotelian cosmology |
| 9 | Tycho Brahe — precision astronomy | 1570s | Careful observation over theorizing | Data beats intuition; Tycho's measurements enabled Kepler |
| 10 | Galileo — falling bodies & projectiles | 1600s | Uniform acceleration, trajectory | First quantitative experiments; experiment as the arbiter of truth |
| 11 | Galileo & the telescope | 1609 | Moons of Jupiter, phases of Venus | Evidence against geocentrism; science confronts authority |
| 12 | Kepler's laws of planetary motion | 1609–1619 | Elliptical orbits, equal areas, period law | Mathematical laws governing planetary motion — but why? |
| 13 | Descartes — mechanical philosophy | 1637 | The universe as a machine | Mechanistic worldview that enables Newtonian physics |

---

### ERA 3: THE NEWTONIAN UNIVERSE (1665 – 1820)
*"The Clockwork Cosmos"*

| Stop | Discovery / Figure | Date | Core Concept | Why It Matters |
|------|-------------------|------|--------------|----------------|
| 14 | Newton — laws of motion | 1687 | Inertia, F=ma, action-reaction | The three laws that governed physics for 200 years |
| 15 | Newton — universal gravitation | 1687 | Inverse square law, orbital mechanics | The same force that drops an apple holds the Moon in orbit |
| 16 | Newton — calculus and optics | 1670s–1700s | Calculus as a tool; light and prisms | Mathematics as the language of physics; white light as spectrum |
| 17 | Hooke, Boyle — springs and gases | 1660s–1680s | Elasticity, gas laws | Quantitative laws governing everyday matter |
| 18 | Huygens — wave theory of light | 1678 | Light as a wave | The wave vs. particle debate begins |
| 19 | Conservation of energy emerges | 1680s–1840s | Leibniz, Joule, Mayer, Helmholtz | The most powerful conservation law — took 150 years to fully understand |

---

### ERA 4: ELECTRICITY, MAGNETISM & THERMODYNAMICS (1780 – 1870)
*"Invisible Forces"*

| Stop | Discovery / Figure | Date | Core Concept | Why It Matters |
|------|-------------------|------|--------------|----------------|
| 20 | Franklin — electricity and lightning | 1752 | Electrical charge; lightning rod | First taming of electrical force; unified natural and artificial electricity |
| 21 | Volta — the first battery | 1800 | Chemical electricity, voltage | The battery enables all subsequent electrical experiments |
| 22 | Ørsted — electricity creates magnetism | 1820 | Electromagnetism linked | A compass needle deflects when current flows — electricity and magnetism are connected |
| 23 | Faraday — electromagnetic induction | 1831 | Changing magnetic field creates current | The principle behind every electric generator and transformer |
| 24 | Faraday — field theory | 1840s | Electric and magnetic fields as physical entities | Replaces action-at-a-distance with field concept — fundamental to all modern physics |
| 25 | Carnot, Joule, Clausius — thermodynamics | 1820s–1860s | Laws of thermodynamics, entropy | Why heat engines have limits; why time has a direction |
| 26 | Maxwell's equations | 1865 | Unified theory of electromagnetism | Four equations that describe all electrical, magnetic, and optical phenomena |
| 27 | Maxwell — light as electromagnetic waves | 1865 | Light speed predicted from EM constants | The first unification in physics; electromagnetic waves predicted |

---

### ERA 5: THE CRISIS & THE QUANTUM REVOLUTION (1870 – 1930)
*"Everything We Knew Was Wrong"*

| Stop | Discovery / Figure | Date | Core Concept | Why It Matters |
|------|-------------------|------|--------------|----------------|
| 28 | Michelson-Morley experiment | 1887 | No ether; speed of light is constant | The experiment that killed the luminiferous ether — and created the crisis Einstein solved |
| 29 | Discovery of the electron (Thomson) | 1897 | Atoms have internal structure | Atoms are not indivisible — there are smaller things |
| 30 | Planck — blackbody radiation, quanta | 1900 | Energy comes in discrete packets | The "desperate" solution that launched quantum mechanics |
| 31 | Einstein — photoelectric effect | 1905 | Light behaves as particles (photons) | Proved quantum nature of light; won Einstein the Nobel Prize |
| 32 | Einstein — special relativity | 1905 | E=mc², time dilation, length contraction | Space and time are not fixed; mass and energy are equivalent |
| 33 | Rutherford — the nuclear atom | 1911 | Most of the atom is empty space | The planetary model of the atom; nucleus discovered |
| 34 | Bohr model of hydrogen | 1913 | Quantized electron orbits | Explains hydrogen spectrum — but is only a stepping stone |
| 35 | de Broglie — wave-particle duality | 1924 | Matter has wavelength | Electrons (and everything) are both waves and particles |
| 36 | Heisenberg, Schrödinger — quantum mechanics | 1925–1926 | Uncertainty principle, wave function | The full quantum theory; probability replaces certainty |

---

### ERA 6: GENERAL RELATIVITY & THE LARGE-SCALE UNIVERSE (1905 – 1950)
*"Bending Space and Time"*

| Stop | Discovery / Figure | Date | Core Concept | Why It Matters |
|------|-------------------|------|--------------|----------------|
| 37 | Einstein — general relativity | 1915 | Gravity is curved spacetime | The replacement for Newton's gravity; GPS wouldn't work without it |
| 38 | Eddington's eclipse — GR confirmed | 1919 | Light bends around the Sun | The most dramatic experimental confirmation in physics history |
| 39 | Hubble — the expanding universe | 1929 | Galaxies recede; universe is expanding | The Big Bang theory becomes inevitable |
| 40 | Big Bang cosmology | 1940s–1960s | Universe began ~13.8 billion years ago | Our best model for the origin and evolution of everything |

---

### ERA 7: PARTICLE PHYSICS & THE STANDARD MODEL (1930 – 2000)
*"Smashing Atoms"*

| Stop | Discovery / Figure | Date | Core Concept | Why It Matters |
|------|-------------------|------|--------------|----------------|
| 41 | Dirac — antimatter predicted | 1928 | Every particle has an antiparticle | Antimatter predicted mathematically before discovered |
| 42 | Nuclear fission & fusion | 1938–1950s | Strong nuclear force; E=mc² in action | The atomic bomb; stars' energy source explained |
| 43 | Feynman — quantum electrodynamics (QED) | 1948 | Quantum field theory of electromagnetism | The most precisely tested theory in physics |
| 44 | Quarks and the strong force | 1960s–1970s | Protons and neutrons are made of quarks | The substructure of nuclear matter |
| 45 | The Standard Model complete | 1970s–1980s | All known fundamental particles and forces (except gravity) | The periodic table of particle physics |
| 46 | Higgs boson discovery | 2012 | The origin of particle mass | The last missing piece of the Standard Model confirmed at the LHC |

---

### ERA 8: FRONTIERS & OPEN QUESTIONS (1980 – Present)
*"The Edge of the Known"*

| Stop | Discovery / Figure | Date | Core Concept | Why It Matters |
|------|-------------------|------|--------------|----------------|
| 47 | Dark matter & dark energy | 1970s–1998 | 95% of the universe is unknown stuff | The universe is mostly something we cannot see, touch, or explain |
| 48 | Gravitational waves discovered (LIGO) | 2015 | Ripples in spacetime directly detected | Einstein's 1915 prediction confirmed 100 years later — a new sense to observe the universe |
| 49 | Quantum computing & quantum information | 1980s–present | Quantum superposition used for computation | Physics enabling a new kind of computer |
| 50 | The open frontier: quantum gravity, unification | ongoing | Merging general relativity and quantum mechanics | The biggest unsolved problem in physics — the story continues |

---

### Notable Omissions Worth Considering

The 50-stop structure above prioritizes narrative flow and general-public accessibility. The following topics are significant and could replace or augment stops if the site skews toward particular audiences:

- **Chaos theory and nonlinear dynamics** (Poincaré, Lorenz, Mandelbrot) — visually spectacular and deeply relevant to everyday unpredictability
- **Superconductivity and superfluidity** — counterintuitive quantum phenomena with enormous technological implications
- **Condensed matter physics** — semiconductors and the transistor (the physics behind all computing)
- **Optics and the laser** — a history stop on stimulated emission and the invention of the laser
- **Climate physics** — the Greenhouse Effect, radiative forcing (Arrhenius 1896 — this is a science communication opportunity)
- **Biophysics** — DNA structure (X-ray crystallography), protein folding, the physics of life

---

## 6. DESIGN PHILOSOPHY SUMMARY

### The Overarching Goal

Build the site that Feynman would have built if he had JavaScript.

That means: the conceptual clarity and narrative voice of the Feynman Lectures, the interactivity and guided discovery of ncase.me, the simulation quality of PhET, the aesthetic polish of Brilliant, and the chronological structure of howaiworks — all free, all open, all without an account.

### The Four Principles That Must Never Be Compromised

**1. Story before simulation.** Every stop is a story about a human being making a discovery that changed how everyone understood reality. The simulation illustrates the story; the story does not exist to justify the simulation.

**2. General public means wonder, not rigor.** The goal is not to produce physics students. The goal is to produce people who feel the universe is astonishing and science is one of the most exciting things humans have ever done. Inspire first. Inform second. Test never.

**3. Every interaction must teach something.** If touching the simulation doesn't produce an "aha" moment, the interaction is decoration. Every draggable slider, every clickable parameter, every animation must be explicitly connected to a conceptual insight in the surrounding text.

**4. Accessibility is not a feature, it's the baseline.** The general public includes people with disabilities, people on old phones, people with slow internet, people who don't read English natively (consider future i18n). Design for the constrained case first.

### The Tone Guide in One Sentence

Write like a brilliant, enthusiastic physicist friend who is genuinely excited to show you something — not like a textbook, not like a professor, and definitely not like a Wikipedia article.

---

*Document compiled from research on: howaiworks (encyclopediaworld.github.io), PhET Interactive Simulations (phet.colorado.edu), The Feynman Lectures (feynmanlectures.caltech.edu), Falstad Physics Applets (falstad.com), ncase.me interactive essays, Brilliant.org physics courses, Physics Classroom (physicsclassroom.com), Bret Victor's Learnable Programming / Explorable Explanations principles, neal.fun interaction design, and general physics history canonical sources.*

*Generated: 2026-03-20*
