# Road to Reality

A newsletter and research series by [Favio Vázquez](https://github.com/FavioVazquez) exploring the intersection of AI, learning, and the nature of reality. Each episode is a deep investigation that produces both long-form writing and working software.

This repository is the workspace behind the series: essays, research notes, data, and the code built along the way.

---

## The Series

### Episodio 1 — The Real State of AI Adoption

Most conversations about AI assume everyone is using it deeply. The numbers say otherwise. This episode investigated who actually uses AI, how, and what that distribution reveals about the gap between public narrative and ground-level reality.

Key finding: 87.8% of humanity has never used AI in any meaningful way. Of those who have, the vast majority use it passively — one prompt, one answer, move on. The population using AI as a genuine cognitive tool is a fraction of a percent.

The episode produced a long-form essay (in Spanish and English), data visualizations reconstructed from ITU and OpenAI figures, and a LinkedIn/X thread.

---

### Episodio 2 — Learning in the Age of Instant Output

When AI can produce output almost instantly, the bottleneck shifts. The question is no longer "how do I produce more?" It's "how do I actually learn anything when the machine can just do it for me?"

This episode investigated that question and produced a practical answer: `agentic-learn`, an open-source Windsurf skill that turns an AI agent into an active learning partner instead of an answer machine. It implements spaced repetition, productive struggle, Socratic dialogue, and metacognitive reflection — all inside your IDE.

The skill is live at [github.com/FavioVazquez/agentic-learn](https://github.com/FavioVazquez/agentic-learn).

---

### Episodio 3 — Agentic Engineering: The Era of the Creative Generalist

Building on the learning framework from Episodio 2, this episode tackled a larger question: how do you *build* with AI at scale without losing coherence, quality, or understanding?

The investigation covered Martec's Law (technology changes exponentially, organizations logarithmically), the collapse of the specialist/generalist divide, and what it means to be a "creative generalist" — someone who can move across domains because AI handles the depth while the human handles the direction.

The episode produced a four-part long-form essay, research on agentic engineering patterns, and a methodology for sustained AI-assisted construction that became the foundation for Episodio 4.

---

### Episodio 4 — How Physics Works

The culmination of the methodology developed across episodes 2 and 3: a full software project planned and built using the Learnship agentic workflow system.

The project is a static interactive website walking through 2,500 years of physics history via 50 stops — from Thales (~600 BCE) to the contemporary frontiers. Each stop pairs a narrative essay with a playable Canvas simulation.

**Live site:** [howphysicsworks.roadtoreality.dev](https://howphysicsworks.roadtoreality.dev)

Inspired by [How AI Works](https://encyclopediaworld.github.io/howaiworks/) — 50 interactive AI demos on a static site. The goal is the same concept applied to physics, with higher visual ambition.

See [`Episodio4/`](./Episodio4/) for all site code and [`Episodio4/README.md`](./Episodio4/README.md) for technical documentation.

The planning process is documented in [`.planning/`](./.planning/) — every phase, decision, requirement, and UAT result kept as first-class artifacts. Milestone v2.0 (Full Spectrum) is in progress: phases 1–9 complete, 25 of 50 interactive simulations built and UAT-verified. Eras covered: Ancient, Scientific Revolution, and Classical Physics.

---

## What Learnship Is

Learnship is the agentic workflow system developed through this series. It structures AI-assisted work into explicit phases: discovery, planning, execution, and verification. Every decision has a record. Every phase has a definition of done. Nothing ships without a UAT report.

It's what makes long-horizon AI-assisted projects stay coherent across many sessions and many moving parts. The `.planning/` directory in this repo is a live example of it in action.

---

## About

Built by [Favio Vázquez](https://github.com/FavioVazquez) — data scientist, researcher, and writer. The Road to Reality is an ongoing investigation into how intelligence (human and artificial) actually works, and what it means to build things that matter with it.
