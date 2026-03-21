---
wave: 1
depends_on: []
gap_closure: true
files_modified:
  - Episodio4/assets/css/search.css
  - Episodio4/index.html
  - "(all 50 stop index.html files)"
autonomous: true
objective: "Add a visible search trigger button to the site header on all pages so users discover the Cmd/Ctrl+K search without needing to know the keyboard shortcut."
must_haves:
  - "search.css has a .search-trigger button rule"
  - "Episodio4/index.html site header contains a <button class=\"search-trigger\"> element"
  - "All 50 stop index.html files contain a <button class=\"search-trigger\"> element in the site header"
  - "Clicking the search-trigger button opens the search modal (same as Cmd/Ctrl+K)"
  - "The button shows a search icon and keyboard hint (⌘K on Mac, Ctrl+K on others)"
---

# Plan 06-06-FIX: Search Discoverability

## Objective

Users don't discover the Cmd/Ctrl+K search because there is no visible affordance. Add a small search button to the sticky site header that opens the modal on click.

## Context

The site header (`<header class="site-header">`) is present on every page — the landing page and all 50 stop pages. It currently has:
- Logo (left)
- Tagline (middle)
- Visit counter (right, landing page only)

Adding a search button at the right end of the header gives users a visible entry point. The button should show a search/magnifier icon and a `⌘K` / `Ctrl+K` hint so it doubles as a shortcut reminder.

The button must call `search.js`'s open function. Since `search.js` exposes its open function via the global `window._searchOpen` (or via a DOM click on a known element), the simplest approach is: the button has `id="search-trigger-btn"` and `search.js` adds a click listener to it in its `init()`.

## Tasks

<task id="06-06-01">
<name>Add .search-trigger CSS and update search.js to bind it</name>
<files>
- Episodio4/assets/css/search.css
- Episodio4/assets/js/search.js
</files>
<action>
**search.css — add after the existing `.search-modal__footer` rules:**

```css
/* ── Search trigger button (header) ─────────────────────── */
.search-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  background: oklch(1 0 0 / 0.06);
  border: 1px solid oklch(1 0 0 / 0.12);
  border-radius: var(--radius-md, 6px);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.04em;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.search-trigger:hover {
  background: oklch(1 0 0 / 0.10);
  color: var(--color-text-secondary);
  border-color: oklch(1 0 0 / 0.20);
}

.search-trigger__icon {
  font-size: 0.9rem;
  opacity: 0.7;
}

.search-trigger__kbd {
  opacity: 0.55;
  font-size: 0.65rem;
}

@media (max-width: 480px) {
  .search-trigger__kbd { display: none; }
}
```

**search.js — in the `init()` function, after the existing `document.addEventListener('keydown', ...)` block, add:**

```javascript
/* Bind header search trigger button */
var triggerBtn = document.getElementById('search-trigger-btn');
if (triggerBtn) {
  triggerBtn.addEventListener('click', function () {
    _openModal();
  });
}
```

This is a purely additive change to search.js — do not remove or alter any existing logic.
</action>
<verify>
- `grep "search-trigger" Episodio4/assets/css/search.css | wc -l` returns at least 5 lines
- `grep "search-trigger-btn" Episodio4/assets/js/search.js` returns the click listener line
- `grep "var triggerBtn" Episodio4/assets/js/search.js` confirms the binding
</verify>
<done>[ ]</done>
</task>

<task id="06-06-02">
<name>Add search trigger button to landing page and all 50 stop headers</name>
<files>
- Episodio4/index.html
- (all 50 stop index.html files under Episodio4/stops/)
</files>
<action>
Add the search trigger button HTML to the `<header class="site-header">` on every page.

**Landing page (`Episodio4/index.html`):**

Find the header block:
```html
<header class="site-header" role="banner">
  <div class="container landing-header__inner">
    <a href="index.html" class="site-header__logo">
      How <span>Physics</span> Works
    </a>
    <span class="site-header__tagline">An Interactive History</span>
    <span class="visit-counter" id="header-visit-counter" aria-live="polite"></span>
  </div>
</header>
```

Add the search trigger button before `</div>` (after the visit counter):
```html
    <button class="search-trigger" id="search-trigger-btn" aria-label="Search stops (Cmd+K)">
      <span class="search-trigger__icon">⌕</span>
      <span>Search</span>
      <span class="search-trigger__kbd" id="search-trigger-hint"></span>
    </button>
```

Also add a small inline script right after the header to set the correct keyboard hint:
```html
<script>
  (function () {
    var hint = document.getElementById('search-trigger-hint');
    if (hint) hint.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl+K';
  }());
</script>
```

**All 50 stop pages (`Episodio4/stops/*/index.html`):**

Each stop page has a header like:
```html
<header class="site-header" role="banner">
  <div class="container site-header__inner">
    <a href="../../index.html" class="site-header__logo">How <span>Physics</span> Works</a>
    <span id="stop-counter" class="site-header__tagline"></span>
  </div>
</header>
```

Add the button and hint script to each stop page header, before `</div>`:
```html
    <button class="search-trigger" id="search-trigger-btn" aria-label="Search stops (Cmd+K)">
      <span class="search-trigger__icon">⌕</span>
      <span>Search</span>
      <span class="search-trigger__kbd" id="search-trigger-hint"></span>
    </button>
```

And add the same inline script after the `</header>` tag:
```html
<script>
  (function () {
    var hint = document.getElementById('search-trigger-hint');
    if (hint) hint.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl+K';
  }());
</script>
```

Use a Python batch script to apply the stop page changes efficiently. The pattern to find in each stop page:
```
<span id="stop-counter" class="site-header__tagline"></span>
  </div>
</header>
```

Replace with:
```
<span id="stop-counter" class="site-header__tagline"></span>
    <button class="search-trigger" id="search-trigger-btn" aria-label="Search stops (Cmd+K)">
      <span class="search-trigger__icon">⌕</span>
      <span>Search</span>
      <span class="search-trigger__kbd" id="search-trigger-hint"></span>
    </button>
  </div>
</header>
<script>
  (function () {
    var hint = document.getElementById('search-trigger-hint');
    if (hint) hint.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl+K';
  }());
</script>
```
</action>
<verify>
- `grep "search-trigger-btn" Episodio4/index.html` confirms button is in landing page
- `grep -l "search-trigger-btn" Episodio4/stops/*/index.html | wc -l` returns 50
- `grep "search-trigger-hint" Episodio4/index.html` confirms the hint span is present
- `grep -l "Ctrl+K\|⌘K" Episodio4/stops/*/index.html | wc -l` returns 50
</verify>
<done>[ ]</done>
</task>

## Must-Haves

- [ ] `search.css` has `.search-trigger` button styles including hover state
- [ ] `search.js` binds click on `#search-trigger-btn` to `_openModal()`
- [ ] `index.html` has the search trigger button in the header
- [ ] All 50 stop pages have the search trigger button in the header
- [ ] Button shows platform-correct keyboard hint (⌘K or Ctrl+K)
- [ ] Clicking the button opens the search modal
