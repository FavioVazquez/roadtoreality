"""Kill test, episode 1: estimate how many Mars nights the Dreyer volumes hold, 1580-1601, and how many fall near an
opposition (Sun-Earth-Mars elongation from JPL Horizons, body 4, DE441) versus away from it.

Run:  data/.venv/bin/python -I legibility.py    (writes out/legibility.json and out/legibility_log.txt)

Method (from the archive.org OCR text, data/ocr/v{10..13}.txt):
  * vols 11-13 (1586-1601): each year has a section headed OBSERUATIONES MARTIS; every 'DIE <day> <MONTH>' heading
    inside it is one Mars observing session (a mane and a vesperi on the same date count once).
  * vol 10 (1580-1585): the planets are mixed in one section per year (OBSERUATIONES [LUNAE ET] RELIQUORUM ...
    PLANETARUM); a 'DIE' block counts as a Mars session when the OCR's renderings of the Mars sign or the word
    Mars/Martis occur in it. The OCR renders the sign as cf, cT, c?, (^, (f, d' and similar, so this count is rough;
    it is reported separately, with a lower bound that needs two hits in the block.
  * appendices to each year (other observers such as David Fabricius, other codices, later reductions) are excluded.
  * Tycho's dates are Julian; they are converted to JD on the Julian calendar before looking up the elongation.
OCR finds headings, not legibility: legibility is judged on page images (see out/KILLTEST.md for the sample).
"""
import json, math, pathlib, re, subprocess
from collections import defaultdict

HERE = pathlib.Path(__file__).resolve().parent
OCR = HERE / "data" / "ocr"
HZ = HERE / "data" / "horizons" / "mars_elongation_1580_1602.txt"
OUT = HERE / "out"
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a); print(s); LOG.append(s)


MONTHS = [("JAN", 1), ("FEB", 2), ("MART", 3), ("APR", 4), ("MAI", 5), ("MAJ", 5), ("JUN", 6), ("JUL", 7),
          ("AUG", 8), ("SEP", 9), ("OCT", 10), ("ODL", 10), ("OCL", 10), ("NOU", 11), ("NOV", 11), ("DEC", 12)]


def month_of(word):
    w = word.upper().replace("0", "O")
    for p, m in MONTHS:
        if w.startswith(p):
            return m
    return None


def jd_julian(y, m, d):
    """JD at 0h of a Julian-calendar date."""
    if m <= 2:
        y -= 1; m += 12
    return math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1)) + d - 1524.5


DIE = re.compile(r"^\s*DIEM?\s*(\d{1,2})\s*,?\s*([A-Z]{3,})")
YEAR = re.compile(r"OBSER[UV]ATIONES\s+(?:ASTRONOMIC\S*\s+)?ANNI\s+(1[56]\d\d)")
SECTION = re.compile(r"^\s*(OBSER\s*[UV]\s*A\s*TIONES|APPENDI)")
MARS_SEC = re.compile(r"OBSER[UV]ATIONES\s+MARTIS")
MIXED_SEC = re.compile(r"RELIQUORUM|PLANETAR")
MARS_SIGN = re.compile(r"(?<![A-Za-z])(cf|cT|c\?|\(\^|\(f|d'|\(j\"|Martis|Mars|MARTIS)(?![a-z])")


def sessions():
    out = []  # (vol, year, month, day, kind, line)
    for vol in (10, 11, 12, 13):
        lines = (OCR / f"v{vol}.txt").read_text(encoding="utf-8", errors="replace").splitlines()
        year = None; mode = None; appendix = False
        block = None
        for n, line in enumerate(lines):
            m = YEAR.search(line)
            if m and line.strip().startswith(("OBSER", "[OBSER")):
                year = int(m.group(1)); mode = None; appendix = False
            if line.strip().startswith("APPENDI"):
                appendix = True  # appendices hold other observers (e.g. Fabricius) and later reductions: excluded
            if SECTION.match(line):
                if appendix:
                    mode = None
                elif MARS_SEC.search(line):
                    mode = "mars"
                elif MIXED_SEC.search(line) and vol == 10:
                    mode = "mixed"
                elif "ANNI" not in line:
                    mode = None
            if year is None or year < 1580 or year > 1601:
                continue
            d = DIE.match(line)
            if d and mode:
                if block:
                    out.append(block)
                mo = month_of(d.group(2)); day = int(d.group(1))
                block = None
                if mo and 1 <= day <= 31:
                    block = dict(vol=vol, year=year, month=mo, day=day, kind=mode, line=n + 1, hits=0)
                continue
            if block and mode == "mixed":
                block["hits"] += len(MARS_SIGN.findall(line))
            if block and not mode:
                out.append(block); block = None
        if block:
            out.append(block)
    return out


def elongation_table():
    if not HZ.exists():
        params = {"format": "text", "COMMAND": "'4'", "OBJ_DATA": "'NO'", "MAKE_EPHEM": "'YES'", "EPHEM_TYPE": "'OBSERVER'",
                  "CENTER": "'500@399'", "START_TIME": "'JD2298150.5'", "STOP_TIME": "'JD2306200.5'", "STEP_SIZE": "'1 d'",
                  "QUANTITIES": "'23'", "CAL_FORMAT": "'JD'", "CSV_FORMAT": "'YES'"}
        q = "&".join(f"{k}={v}" for k, v in params.items()).replace("'", "%27").replace("@", "%40").replace(" ", "%20")
        txt = subprocess.run(["/usr/bin/curl", "-sf", "-m", "300", "https://ssd.jpl.nasa.gov/api/horizons.api?" + q],
                             capture_output=True, text=True, check=True).stdout
        HZ.parent.mkdir(parents=True, exist_ok=True)
        HZ.write_text(txt)
    txt = HZ.read_text()
    body = txt.split("$$SOE")[1].split("$$EOE")[0].strip().splitlines()
    tab = {}
    for l in body:
        p = [x.strip() for x in l.split(",")]
        tab[round(float(p[0]) - 0.5) + 0.5] = (float(p[-3]) if p[-3] else float(p[-2]), p[-2])
    return tab, [l for l in txt.splitlines() if "Target body name" in l or "Center body name" in l]


def main():
    tab, meta = elongation_table()
    jds = sorted(tab)
    # oppositions: local maxima of elongation above 170 deg
    opp = []
    for a, b, c in zip(jds, jds[1:], jds[2:]):
        if tab[b][0] > 170 and tab[b][0] >= tab[a][0] and tab[b][0] > tab[c][0]:
            opp.append(b)

    def jcal(jd):
        # Julian calendar date of a JD (Meeus), for labelling
        Z = int(jd + 0.5); A = Z; B = A + 1524; C = int((B - 122.1) / 365.25); D = int(365.25 * C); E = int((B - D) / 30.6001)
        day = B - D - int(30.6001 * E); mon = E - 1 if E < 14 else E - 13; yr = C - 4716 if mon > 2 else C - 4715
        return f"{yr}-{mon:02d}-{day:02d} (Julian)"

    log("Mars oppositions 1580-1601 from Horizons (elongation maximum > 170 deg):")
    for o in opp:
        log(f"  JD {o}  {jcal(o)}  elongation {tab[o][0]:.1f}")
    for m in meta:
        log("  | " + m.strip())

    S = sessions()
    nights = {}
    for s in S:
        if s["kind"] == "mixed" and s["hits"] < 1:
            continue
        key = (s["year"], s["month"], s["day"])
        nights.setdefault(key, s)
    log(f"\nMars sessions found in the OCR: {len(nights)} distinct dates "
        f"(vol 10 mixed sections: {sum(1 for s in nights.values() if s['kind']=='mixed')}, "
        f"of which {sum(1 for s in nights.values() if s['kind']=='mixed' and s['hits']>=2)} with >=2 sign hits)")
    per_year = defaultdict(int)
    near = defaultdict(list); off = []; mid = []
    for (y, m, d), s in sorted(nights.items()):
        jd = jd_julian(y, m, d) + 0.5  # noon of that civil date, lookup key
        jd = round(jd - 0.5) + 0.5
        if jd not in tab:
            continue
        el = tab[jd][0]
        s["elong"] = el
        per_year[y] += 1
        o = min(opp, key=lambda o: abs(o - jd))
        if abs(o - jd) <= 20:
            near[o].append((y, m, d, el, s["vol"], s["kind"]))
        elif el < 135:
            off.append((y, m, d, el, s["vol"], s["kind"]))
        else:
            mid.append((y, m, d, el, s["vol"], s["kind"]))
    log("\nMars sessions per year (OCR headings):")
    log("  " + ", ".join(f"{y}: {n}" for y, n in sorted(per_year.items())))
    log("\nOpposition windows (+-20 days of the elongation maximum), sessions found:")
    covered = 0
    for o in opp:
        k = near.get(o, [])
        if k:
            covered += 1
        log(f"  {jcal(o)}: {len(k)} sessions" + (f"  e.g. {', '.join(f'{y}-{m:02d}-{d:02d} v{v}' for y, m, d, el, v, kd in k[:6])}" if k else ""))
    log(f"\nOppositions with at least one session within +-20 days: {covered} of {len(opp)}")
    log(f"Off-opposition sessions (elongation < 135 deg): {len(off)}; intermediate (135 deg to the window): {len(mid)}")
    q = [x for x in off if x[3] < 110]
    log(f"  of which elongation < 110 deg (quadrature side): {len(q)}")
    res = dict(oppositions=[jcal(o) for o in opp], sessions_total=len(nights), per_year=dict(per_year),
               opposition_windows={jcal(o): len(near.get(o, [])) for o in opp}, oppositions_covered=covered,
               off_opposition_sessions=len(off), intermediate_sessions=len(mid), quadrature_side_sessions=len(q))
    OUT.mkdir(exist_ok=True)
    (OUT / "legibility.json").write_text(json.dumps(res, indent=2))
    (OUT / "legibility_log.txt").write_text("\n".join(LOG) + "\n")


if __name__ == "__main__":
    main()
