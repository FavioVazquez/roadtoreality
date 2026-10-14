"""Locate OCR hits on page images: python -I scripts/locate.py <key> <regex> [...]
key in p1687, p1726, m1729, m1729b, ... (data/ocr/<key>_search.txt + <key>_pageidx.json + <key>_pages.json).
Prints the hOCR page index (= image n in https://archive.org/download/<id>/page/n<N>.jpg), archive's
detected printed page, and a snippet. Printed page numbers used in KILLTEST.md were read on the images."""
import json, re, sys, bisect, pathlib
D = pathlib.Path(__file__).resolve().parent.parent / "data" / "ocr"
key, pats = sys.argv[1], sys.argv[2:]
txt = (D / f"{key}_search.txt").read_text(errors="replace")
idx = json.loads((D / f"{key}_pageidx.json").read_text())
pages = json.loads((D / f"{key}_pages.json").read_text())["pages"]
starts = [p[0] for p in idx]
for pat in pats:
    for m in re.finditer(pat, txt, re.I):
        n = bisect.bisect_right(starts, m.start()) - 1
        pn = pages[n]["pageNumber"] if n < len(pages) else "?"
        print(f"{pat!r}: n={n} printed~{pn!r}: ...{txt[max(0,m.start()-60):m.end()+60]!r}")
