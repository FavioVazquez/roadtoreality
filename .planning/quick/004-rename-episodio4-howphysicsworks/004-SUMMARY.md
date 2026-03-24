# Quick Task 004 Summary

**Task:** Rename Episodio4/ → HowPhysicsWorks/ across all files
**Completed:** 2026-03-24

## What was done

Renamed the site folder from `Episodio4/` to `HowPhysicsWorks/` using `git mv` to preserve history. Updated every reference across 268 files: .gitignore allowlist, root index.html episode link, root README.md, all 50 stop og:image URLs, HowPhysicsWorks/AGENTS.md, HowPhysicsWorks/README.md, and all three scripts/ files.

## Files changed

- `Episodio4/` → `HowPhysicsWorks/` (268 file renames via git mv)
- `.gitignore`: updated allowlist entries
- `index.html`: episode link updated
- `README.md`: all path references updated
- `scripts/*.mjs`: path constants updated

## After merging — manual steps required

1. **GitHub Pages**: Settings → Pages → change folder from `/Episodio4` to `/HowPhysicsWorks`
2. **Cloudflare redirect**: update redirect rule target from `roadtoreality.dev/Episodio4/` to `roadtoreality.dev/HowPhysicsWorks/`

## Commit
0a2bc6c
