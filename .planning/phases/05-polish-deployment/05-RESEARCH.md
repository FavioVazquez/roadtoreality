# Phase 5: Polish & Deployment — Research

**Phase:** 05-polish-deployment
**Status:** Planned

---

## Don't Hand-Roll

### Accessibility: keyboard navigation on range inputs
HTML `<input type="range">` elements are keyboard-accessible by default (arrow keys change value). No custom JS needed. Verify that each slider has an `aria-label` attribute (or associated `<label>`) so screen readers announce what it controls. The `aria-valuemin`, `aria-valuemax`, `aria-valuenow` attributes are automatically set by the browser on range inputs — do not duplicate them manually.

### Color contrast checking
Use the browser DevTools accessibility panel or a tool like `axe-core` to check contrast ratios. The oklch palette was designed with 4.5:1 contrast in mind: `oklch(0.85 0.01 90)` text on `oklch(0.09 0.025 285)` background gives approximately 11:1 ratio. The main risk is era accent colors used as text on mid-tone backgrounds — verify era tab labels and card metadata text.

### GitHub Pages custom subdirectory
GitHub Pages supports serving from a subdirectory via the "Source" setting in repository Settings → Pages. Select "Branch: main / folder: /Episodio4". The `.nojekyll` file already present ensures Jekyll doesn't process the HTML files. No `_config.yml` needed.

### README for a static site project
Keep the README in `Episodio4/` (not the project root) so it's the first thing a visitor to the GitHub Pages repo sees. The README should answer: what is this, how do I run it locally, how do I add a stop, how do I deploy.

---

## Common Pitfalls

### `prefers-reduced-motion` in JavaScript RAF loops
The CSS `prefers-reduced-motion` check in `base.css` disables CSS animations and transitions. But the JavaScript RAF loops in each sim.js run independently of CSS. Add a check in each sim's `setup()` function:

```js
var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  draw(); // render static frame only
  return; // don't start the loop
}
```

This is a Phase 5 polish item — the sims currently start their loops regardless of the OS setting.

### Matter.js and p5.js loaded on pages that don't use them
If any stop `index.html` contains `<script src="../../assets/js/vendor/p5.min.js">`, that adds ~1MB of JS parse overhead on every stop page load, even though no v1.0 simulation uses p5.js. Audit all stop pages and remove vendor script tags unless the sim.js for that stop actually imports from the library.

### `aria-live` on dynamic status text
The `#sim-status` span is updated dynamically by sim.js (e.g., "Ball released!"). Without `aria-live="polite"`, screen readers won't announce these changes. Add `aria-live="polite"` to all `#sim-status` elements.

### Missing `lang` attribute on sub-pages
The `index.html` has `<html lang="en">`. Verify all 50 stop `index.html` files also have `lang="en"` on the `<html>` element. The stub generator should have included it — but confirm with a spot-check.

### Relative path depth for stop pages
Stop pages are at depth `stops/{id}/index.html` — two levels deep from `Episodio4/`. All asset paths use `../../assets/...`. If GitHub Pages serves from a subdirectory (e.g., `username.github.io/repo/Episodio4/`), these relative paths still resolve correctly because they are relative to the page's URL, not the domain root.

### Canvas element `role` and `aria-label`
Canvas elements are not inherently accessible. Each simulation canvas should have:
```html
<div id="sim-mount" role="img" aria-label="[descriptive label]">
```
The `#sim-mount` div (which contains the canvas) already has `aria-label` on the implemented stop pages. Verify stub pages also have it.

### Font loading flash
With `font-display: swap`, there will be a brief FOUT (flash of unstyled text) as Cormorant Garamond loads. This is intentional and unavoidable without `font-display: block` (which causes FOIT). The swap is acceptable — headings shift to the display font after ~100ms on a fast connection.
