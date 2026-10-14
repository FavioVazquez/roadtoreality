"""Build WORKLIST.json: every Mars session found in the OCR, with page, leaf, image index, priority and chunk.

Run:  data/.venv/bin/python -I worklist.py

Uses legibility.py's session finder on the archive.org djvu text, then places each 'DIE ...' heading in the hOCR search
text (same OCR, with page offsets) by searching forward in reading order, which gives the scan leaf; the image index n
and archive.org's printed-page guess come from <id>_page_numbers.json. Printed page numbers are archive.org's
detection: workers confirm them on the image and correct them in their output.

Priority: 1 = within 20 days of an opposition (Horizons elongation maximum); 2 = elongation < 135 deg;
3 = the rest (135 deg up to the opposition window).
has_tycho_reduction: the OCR block contains a 'Longitudo' line that is not one of Tycho's table comparisons
(Calculus / Alphons. / Copern. / Prut.); OCR-detected, so a worker confirms it.
Chunks: 6 contiguous ranges in reading order (volume, leaf), balanced by number of sessions, never splitting a page.
"""
import json, re, pathlib, math, sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))  # our own legibility.py (scripts run with -I)
import legibility as L
from reduce import SITE_BY_DATE, CALENDAR_BY_SITE
OCR = HERE / "data" / "ocr"
N_CHUNKS = 6
IDS = {v: f"operaomniaedidit{v}brahuoft" for v in (10, 11, 12, 13)}
COMPARE = re.compile(r"Calcul|Alphon|Copern|Prut|Tabul", re.I)


def page_maps(vol):
    idx = json.load(open(OCR / f"v{vol}_pageidx.json"))
    pages = json.load(open(OCR / f"v{vol}_pages.json"))["pages"]
    return idx, {p["leafNum"]: i for i, p in enumerate(pages)}, {p["leafNum"]: p["pageNumber"] for p in pages}


# hOCR page index -> scan leaf. Measured by matching the printed page numbers in each hOCR page's running head
# against page_numbers.json: vol X leaf = index + 1 (its leaves start at 1); vols XI-XIII leaf = index.
LEAF_OFFSET = {10: 1, 11: 0, 12: 0, 13: 0}


def leaf_of(idx, off, vol):
    for i, (a, b, *_r) in enumerate(idx):
        if a <= off < b:
            return i + LEAF_OFFSET[vol]
    return None


def main():
    tab, _meta = L.elongation_table()
    jds = sorted(tab)
    opp = [b for a, b, c in zip(jds, jds[1:], jds[2:]) if tab[b][0] > 170 and tab[b][0] >= tab[a][0] and tab[b][0] > tab[c][0]]
    sessions = L.sessions()
    # keep the same selection as legibility.py (one entry per date; mixed-section blocks need a Mars sign)
    lines = {v: (OCR / f"v{v}.txt").read_text(encoding="utf-8", errors="replace").splitlines() for v in (10, 11, 12, 13)}
    search = {v: (OCR / f"v{v}_search.txt").read_text(encoding="utf-8") for v in (10, 11, 12, 13)}
    maps = {v: page_maps(v) for v in (10, 11, 12, 13)}
    cursor = {v: 0 for v in (10, 11, 12, 13)}
    seen = {}
    out = []
    unplaced = 0
    for k, s in enumerate(sessions):
        nxt = sessions[k + 1]["line"] if k + 1 < len(sessions) and sessions[k + 1]["vol"] == s["vol"] else s["line"] + 120
        block = lines[s["vol"]][s["line"] - 1: min(nxt - 1, s["line"] + 400)]
        key = (s["year"], s["month"], s["day"])
        head = block[0].strip()
        toks = head.split()
        rx = re.compile(r"\s*".join(re.escape(t) for t in toks[:3]))
        m = rx.search(search[s["vol"]], cursor[s["vol"]])
        leaf = None
        if m and m.start() - cursor[s["vol"]] < 400000:
            cursor[s["vol"]] = m.end()
            leaf = leaf_of(maps[s["vol"]][0], m.start(), s["vol"])
        else:
            unplaced += 1
        if s["kind"] == "mixed" and s["hits"] < 1:
            continue  # not Mars (the heading was still located, to keep the reading-order cursor in step)
        has_red = False
        for i, l in enumerate(block[1:]):
            if "Longitud" in l and not COMPARE.search(l) and not (i > 0 and COMPARE.search(block[i])):
                has_red = True
        jd = L.jd_julian(*key) + 0.5
        jd = round(jd - 0.5) + 0.5
        el = tab.get(jd, (None,))[0]
        o = min(opp, key=lambda o: abs(o - jd))
        pri = 1 if abs(o - jd) <= 20 else (2 if el is not None and el < 135 else 3)
        rec = dict(date_julian=f"{key[0]:04d}-{key[1]:02d}-{key[2]:02d}", heading_ocr=head[:60], volume=s["vol"],
                   leaf=leaf, image_n=maps[s["vol"]][1].get(leaf) if leaf is not None else None,
                   printed_page_guess=maps[s["vol"]][2].get(leaf) if leaf is not None else None,
                   ocr_line=s["line"], section="Mars section" if s["kind"] == "mars" else "mixed planets section (vol X)",
                   elongation_deg=round(el, 1) if el is not None else None, days_from_opposition=int(jd - o),
                   priority=pri, has_tycho_reduction_ocr=has_red)
        if key in seen:  # a second heading for the same date (e.g. mane and vesperi): keep as extra page ref
            seen[key].setdefault("more_headings", []).append(dict(heading_ocr=head[:60], leaf=leaf, image_n=rec["image_n"]))
            continue
        seen[key] = rec
        out.append(rec)
    for r in out:
        r["image_url"] = (f"https://archive.org/download/{IDS[r['volume']]}/page/n{r['image_n']}.jpg"
                          if r["image_n"] is not None else None)
        r["id"] = f"{r['date_julian']}"
        site = next(st for dd, st in SITE_BY_DATE if r["date_julian"] <= dd)
        r["site_default"] = site
        r["calendar_default"] = CALENDAR_BY_SITE[site]
        notes = []
        if r["date_julian"].startswith("1593"):
            notes.append("1593: printed from codex K, a copy of the lost 1593 volume of codex V; Dreyer: the copyist is not always reliable")
        if r["volume"] == 10:
            notes.append("vol X: planets mixed in one section; confirm the entry is Mars (the sign) before transcribing")
        if site != "Hven":
            notes.append(f"away from Hven: confirm the site on the page (default {site}); calendar default {CALENDAR_BY_SITE[site]}")
        r["notes"] = notes
    # fill unplaced leaves from neighbours (same volume, between placed ones) as a range
    for i, r in enumerate(out):
        if r["leaf"] is None:
            prev = next((x for x in reversed(out[:i]) if x["volume"] == r["volume"] and x["leaf"] is not None), None)
            nxt = next((x for x in out[i + 1:] if x["volume"] == r["volume"] and x["leaf"] is not None), None)
            r["leaf_range_guess"] = [prev["leaf"] if prev else None, nxt["leaf"] if nxt else None]
            r["leaf"] = prev["leaf"] if prev else (nxt["leaf"] if nxt else None)
            r["placement"] = "guessed from neighbours: check the pages in leaf_range_guess"
            if r["leaf"] is not None:
                r["image_n"] = maps[r["volume"]][1].get(r["leaf"])
                r["image_url"] = f"https://archive.org/download/{IDS[r['volume']]}/page/n{r['image_n']}.jpg"
        else:
            r["placement"] = "OCR heading located on this leaf"
    # chunks: contiguous in (volume, leaf), balanced by count, never splitting one leaf
    out.sort(key=lambda r: (r["volume"], r["leaf"] if r["leaf"] is not None else 10**6, r["ocr_line"]))
    target = len(out) / N_CHUNKS
    chunk, count, chunks = 1, 0, []
    for i, r in enumerate(out):
        if count >= target * chunk and chunk < N_CHUNKS and (i == 0 or (r["volume"], r["leaf"]) != (out[i - 1]["volume"], out[i - 1]["leaf"])):
            chunk += 1
        r["chunk"] = chunk
        count += 1
    summary = []
    for c in range(1, N_CHUNKS + 1):
        rs = [r for r in out if r["chunk"] == c]
        a, b = rs[0], rs[-1]
        summary.append(dict(chunk=c, sessions=len(rs), priority1=sum(r["priority"] == 1 for r in rs),
                            priority2=sum(r["priority"] == 2 for r in rs), with_tycho_reduction=sum(r["has_tycho_reduction_ocr"] for r in rs),
                            first=f"vol {a['volume']} leaf {a['leaf']} (p.{a['printed_page_guess']}) {a['date_julian']}",
                            last=f"vol {b['volume']} leaf {b['leaf']} (p.{b['printed_page_guess']}) {b['date_julian']}",
                            dates=f"{a['date_julian']} .. {b['date_julian']}"))
    doc = dict(
        about="Mars sessions in Dreyer, Tychonis Brahe Dani Opera Omnia vols X-XIII, found in the archive.org OCR. Dates are Julian. "
              "One entry per date; 'more_headings' lists further headings for the same date (e.g. mane and vesperi). "
              "Printed pages are archive.org's guess: confirm on the image. Read TRANSCRIBE-GUIDE.md first.",
        generated_by="worklist.py", total=len(out), unplaced_headings=sum(1 for r in out if r['placement'].startswith('guessed')),
        oppositions_julian=[L_jcal(o) for o in opp], chunks=summary, sessions=out)
    (HERE / "WORKLIST.json").write_text(json.dumps(doc, indent=1, ensure_ascii=False))
    print(json.dumps(summary, indent=1))
    print("total", len(out), "unplaced", doc["unplaced_headings"], "priority1", sum(r["priority"] == 1 for r in out),
          "priority2", sum(r["priority"] == 2 for r in out), "tycho red.", sum(r["has_tycho_reduction_ocr"] for r in out))


def L_jcal(jd):
    Z = int(jd + 0.5); B = Z + 1524; C = int((B - 122.1) / 365.25); D = int(365.25 * C); E = int((B - D) / 30.6001)
    day = B - D - int(30.6001 * E); mon = E - 1 if E < 14 else E - 13; yr = C - 4716 if mon > 2 else C - 4715
    return f"{yr}-{mon:02d}-{day:02d}"


if __name__ == "__main__":
    main()
