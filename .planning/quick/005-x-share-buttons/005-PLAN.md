---
quick: "005"
description: "Add X share buttons (standard tweet + long post) to every stop via stop-shell.js"
date: 2026-03-24
---

# Quick Task 005 — X Share Buttons

## Task 1: Add share CSS to components.css

<files>
HowPhysicsWorks/assets/css/components.css
</files>

<action>
Append .stop-share section styles at end of file.
</action>

<verify>
grep -c "stop-share" HowPhysicsWorks/assets/css/components.css
</verify>

<done>
.stop-share, .share-btn styles present in components.css
</done>

---

## Task 2: Add _renderShare() to stop-shell.js and wire it in init()

<files>
HowPhysicsWorks/assets/js/stop-shell.js
</files>

<action>
Add _renderShare(cfg) function that:
1. Reads DOM: year, scientist, era label, subtitle, intro, body, takeaway items, bridge
2. Builds 280-char tweet: "[Era] · [Year] — [Scientist]\n[intro snippet]\n[URL]\n#Physics #HowPhysicsWorks"
   - URL counts as 23 chars (t.co), budget ~235 for rest
   - Trim intro snippet to fit
3. Builds long post: full structured text (~2000-4000 chars) with all sections
4. Injects .stop-share div before #stop-nav containing:
   - "Share on 𝕏" button → opens twitter.com/intent/tweet?text=...
   - "Long post (𝕏 Premium)" button → copies long text to clipboard + opens x.com/compose/tweet
   - Small "download screenshot" link → downloads og-image.png
5. Shows clipboard confirmation feedback on long post button
Wire: add _renderShare(config) to init()
</action>

<verify>
grep -n "_renderShare\|stop-share\|intent/tweet" HowPhysicsWorks/assets/js/stop-shell.js | head -10
</verify>

<done>
_renderShare defined, called in init(), tweet intent URL built, clipboard copy wired.
</done>
