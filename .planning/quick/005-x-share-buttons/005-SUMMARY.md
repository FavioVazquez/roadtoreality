# Quick Task 005 Summary

**Task:** Add X share buttons (standard tweet + long post) to every stop
**Completed:** 2026-03-24

## What was done

Added two X share buttons + screenshot download link to every stop page via stop-shell.js (no HTML file changes needed — injected dynamically before #stop-nav).

**Tweet button**: Builds a ≤280-char tweet from DOM (era, year, scientist, intro snippet, URL, hashtags) and opens twitter.com/intent/tweet.

**Long post button**: Extracts full structured text from all DOM sections (subtitle, intro, body, takeaway items, bridge), copies to clipboard, opens x.com/compose/tweet. Button shows "✓ Copied" feedback for 3 seconds.

**Screenshot link**: Downloads og-image.png (which exists for all 50 stops) so user can attach it to the post manually.

## Files changed

- `HowPhysicsWorks/assets/js/stop-shell.js`: added _renderShare(), _buildTweet(), _buildLongPost(), wired in init()
- `HowPhysicsWorks/assets/css/components.css`: added .stop-share, .share-btn, .share-screenshot styles

## Commit
1af3041
