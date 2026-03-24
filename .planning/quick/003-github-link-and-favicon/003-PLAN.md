---
quick: "003"
description: "Add GitHub repo link to How Physics Works landing page and add favicon"
date: 2026-03-24
---

# Quick Task 003 — GitHub Link + Favicon

## Task 1: Add GitHub link to hero subtitle

<files>
Episodio4/index.html
</files>

<action>
In the hero subtitle paragraph (lines 156-159), append a sentence with a GitHub link after the existing text:

From:
  Every stop has a simulation you can play with — no physics background required.

To:
  Every stop has a simulation you can play with — no physics background required.
  See <a href="https://github.com/FavioVazquez/roadtoreality" target="_blank" rel="noopener" style="color:var(--color-accent);border-bottom:1px dashed var(--color-accent);">GitHub Repository</a>.
</action>

<verify>
grep -n "GitHub Repository" Episodio4/index.html
</verify>

<done>
Hero subtitle contains a styled inline GitHub link opening in a new tab.
</done>

---

## Task 2: Add SVG favicon

<files>
Episodio4/favicon.svg
Episodio4/index.html
Episodio4/stops/*/index.html (all stop pages)
</files>

<action>
1. Create Episodio4/favicon.svg — use the atom symbol ⚛ as an SVG favicon with the classical era blue color (#5b8fd4):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <text y="26" font-size="28">⚛️</text>
</svg>
```

2. Add to Episodio4/index.html <head>:
  <link rel="icon" href="favicon.svg" type="image/svg+xml">

3. Add to all stop pages <head> (path is ../../favicon.svg relative to stops):
  <link rel="icon" href="../../favicon.svg" type="image/svg+xml">
</action>

<verify>
grep -l "favicon" Episodio4/index.html Episodio4/stops/001-thales-natural-causes/index.html
</verify>

<done>
favicon.svg exists in Episodio4/. index.html and all 50 stop pages have a favicon link tag.
</done>
