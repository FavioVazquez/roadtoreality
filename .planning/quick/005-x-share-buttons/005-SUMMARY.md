# Quick Task 005 Summary

**Task:** Add X share buttons (standard tweet + long post) to every stop
**Completed:** 2026-03-24

## What was done

Added two X share buttons + screenshot download link to every stop page via stop-shell.js (no HTML file changes needed — injected dynamically after .stop-header).

**Tweet button**: Builds a ≤280-char tweet from DOM (era, year, scientist, intro snippet, URL, hashtags) and opens twitter.com/intent/tweet.

**Long post button**: Extracts full structured text from all DOM sections (subtitle, intro, body, takeaway items, bridge), copies to clipboard, opens twitter.com/intent/tweet pre-populated with full text. Button shows "✓ Copied!" feedback for 3 seconds.

**Screenshot link**: Downloads og-image.png (which exists for all 50 stops) so user can attach it to the post manually.

**Position**: Share row appears right after the stop header (title / year / scientist), above the intro — visible without scrolling.

## Post-merge fixes (UAT)

- **Long post blank composer** (7df2838): was opening `x.com/compose/tweet` (blank). Fixed to use `twitter.com/intent/tweet?text=<encoded>` so the composer opens pre-populated.
- **Screenshot 404** (7df2838): `replace()` order was wrong — `/` was appended before `index.html` was stripped, producing `index.html/og-image.png`. Fixed by swapping order.
- **Share position** (68b00e1): share row was at page bottom (before #stop-nav). Moved to after `.stop-header` so it's visible without scrolling.

## Files changed

- `HowPhysicsWorks/assets/js/stop-shell.js`: added _renderShare(), _buildTweet(), _buildLongPost(), wired in init(); post-merge fixes applied
- `HowPhysicsWorks/assets/css/components.css`: added .stop-share, .share-btn, .share-screenshot styles

## Commits
- 1af3041 — initial implementation
- 7df2838 — fix long post intent URL and screenshot 404
- 68b00e1 — move share buttons to top of stop
