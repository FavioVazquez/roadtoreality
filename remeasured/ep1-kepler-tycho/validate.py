"""Check a transcription file against the session format of TRANSCRIBE-GUIDE.md, and merge chunk files.

  data/.venv/bin/python -I validate.py transcriptions/chunk3.json        check one file (run before handing in)
  data/.venv/bin/python -I validate.py --merge transcriptions/chunk*.json  check all, write transcriptions/merged.json

It checks structure, that every printed value parses, that every star key used in a row is defined in 'stars',
confidence codes, ids, and source references. It does not judge the readings themselves.
"""
import json, pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from reduce import parse_angle, parse_time, SITES  # noqa: E402

VAL = re.compile(r"^\d{1,3}( \d{1,2}(\.\d+)?)?( \d{1,2}(\.\d+)?)?( \d/\d{1,2})?$|^\d{1,3} \d/\d{1,2}$")
TIME = re.compile(r"^\d{1,2}( \d{1,2})?( \d{1,2})?( \d/\d{1,2})?$")
ROW_TYPES = {"obs", "dec_star", "merid_alt_mars", "merid_alt_star", "star_star", "alt_star", "other"}
CONF = {"H", "M", "L"}
SESSION_KEYS = {"id", "date_julian", "heading", "session", "time_basis", "site", "source", "stars", "rows", "flags"}


def err(errs, sid, msg):
    errs.append(f"{sid}: {msg}")


def check_value(errs, sid, where, v, rx=VAL):
    if v is None:
        return
    if not isinstance(v, str) or not rx.match(v.strip()):
        err(errs, sid, f"{where}: value {v!r} is not in the printed format ('20 17 1/6', '19 53 0', '8 4 2/5')")
    elif (parse_time(v) if rx is TIME else parse_angle(v)) is None:
        err(errs, sid, f"{where}: value {v!r} does not parse")


def check_session(S, errs):
    sid = S.get("id", "?")
    for k in SESSION_KEYS - set(S):
        err(errs, sid, f"missing key '{k}'")
    if not re.match(r"^1[56]\d\d-\d\d-\d\d[MVND][0-9]?$", sid):
        err(errs, sid, "id must be YYYY-MM-DD + M/V/N/D (+ digit if repeated), e.g. 1595-10-25V")
    if not re.match(r"^1[56]\d\d-\d\d-\d\d$", S.get("date_julian", "")):
        err(errs, sid, "date_julian must be YYYY-MM-DD as printed")
    else:
        y, m, d = (int(x) for x in S["date_julian"].split("-"))
        if not (1574 <= y <= 1601 and 1 <= m <= 12 and 1 <= d <= (29 if m == 2 and y % 4 == 0 else [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1])):
            err(errs, sid, f"date_julian {S['date_julian']} is not a real date in 1574-1601")
    if S.get("time_basis") not in ("from_noon", "from_midnight", "unknown"):
        err(errs, sid, "time_basis must be from_noon | from_midnight | unknown")
    if S.get("site") not in SITES and not str(S.get("site", "")).startswith("other:"):
        err(errs, sid, f"site must be one of {sorted(SITES)} or 'other:<text>'")
    if S.get("calendar") not in (None, "julian", "gregorian"):
        err(errs, sid, "calendar must be julian | gregorian (or omitted)")
    src = S.get("source", {})
    for k in ("volume", "pages", "leaves", "image_n"):
        if k not in src:
            err(errs, sid, f"source.{k} missing")
    if src and not (len(src.get("pages", [])) == len(src.get("leaves", [])) == len(src.get("image_n", []))):
        err(errs, sid, "source.pages, leaves and image_n must have the same length (one entry per page)")
    stars = S.get("stars", {})
    for k, v in stars.items():
        if "hip" not in v or "id_confidence" not in v or "name_on_page" not in v:
            err(errs, sid, f"star '{k}' needs name_on_page, hip (int or null), id_confidence")
        if "hip" in v and v["hip"] is not None and (not isinstance(v["hip"], int) or isinstance(v["hip"], bool)):
            err(errs, sid, f"star '{k}': hip must be an integer (e.g. 9884) or null, not {v['hip']!r}")
        if v.get("id_confidence") not in CONF:
            err(errs, sid, f"star '{k}' id_confidence must be H/M/L")
    if "no_mars_data" in S.get("flags", []):
        return
    if not S.get("rows"):
        err(errs, sid, "no rows (flag 'no_mars_data' if the session holds no Mars measurement)")
    for i, r in enumerate(S.get("rows", [])):
        w = f"row {i}"
        t = r.get("type")
        if t not in ROW_TYPES:
            err(errs, sid, f"{w}: type must be one of {sorted(ROW_TYPES)}")
        if "verbatim" not in r:
            err(errs, sid, f"{w}: 'verbatim' (the printed line) is required")
        for k in ("t", "t_corr", "t_assumed"):
            check_value(errs, sid, f"{w}.{k}", r.get(k), TIME)
        for k in ("dist", "alt_mars", "az_mars", "ha_mars", "body_dist", "alt_star"):
            v = r.get(k)
            if t == "star_star" and k == "dist":
                continue
            if isinstance(v, dict):
                check_value(errs, sid, f"{w}.{k}", v.get("alt"))
            else:
                check_value(errs, sid, f"{w}.{k}", v)
        for k in ("dec_mars", "dec"):
            for j, v in enumerate(r.get(k, []) or []):
                check_value(errs, sid, f"{w}.{k}[{j}]", v)
        if (r.get("dec_mars") or r.get("dec")) and r.get("dec_dir") not in ("B", "A", "M"):
            err(errs, sid, f"{w}: dec_dir must be B (north) or A/M (south)")
        if t in ("merid_alt_mars", "merid_alt_star"):
            for j, a in enumerate(r.get("alt", [])):
                check_value(errs, sid, f"{w}.alt[{j}]", a.get("alt"))
        if t == "star_star":
            for j, v in enumerate(r.get("dist", [])):
                check_value(errs, sid, f"{w}.dist[{j}]", v)
        for key in ("star", "star_a", "star_b"):
            if r.get(key) and r[key] not in stars:
                err(errs, sid, f"{w}: star '{r[key]}' is not defined in 'stars'")
        if r.get("clock"):
            c = r["clock"]
            if c.get("star") not in stars:
                err(errs, sid, f"{w}: clock star '{c.get('star')}' is not defined in 'stars'")
            check_value(errs, sid, f"{w}.clock.ha", c.get("ha"))
            if c.get("side") not in ("or", "occ"):
                err(errs, sid, f"{w}: clock.side must be 'or' (east) or 'occ' (west)")
        if r.get("az_mars") and r.get("az_ref") not in ("mer_ort", "mer_occ", "sept_ort", "sept_occ"):
            err(errs, sid, f"{w}: az_ref must be mer_ort | mer_occ | sept_ort | sept_occ")
        for k, v in (r.get("conf") or {}).items():
            if v not in CONF:
                err(errs, sid, f"{w}: conf[{k}] must be H/M/L")
        if not r.get("conf") and t != "other":
            err(errs, sid, f"{w}: per-cell 'conf' is required")
    for j, tr in enumerate(S.get("tycho_reduction", []) or []):
        for k in ("lon", "lat", "ra", "dec"):
            check_value(errs, sid, f"tycho_reduction[{j}].{k}", tr.get(k))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    merge = "--merge" in sys.argv
    errs, allS, ids = [], [], {}
    for f in args:
        d = json.loads(pathlib.Path(f).read_text())
        if d.get("schema") != "tycho-mars-session/2":
            errs.append(f"{f}: schema must be 'tycho-mars-session/2'")
        for S in d.get("sessions", []):
            check_session(S, errs)
            if S.get("id") in ids:
                errs.append(f"{S.get('id')}: duplicate id (also in {ids[S['id']]})")
            ids[S.get("id")] = f
            allS.append(S)
    for e in errs:
        print("ERROR", e)
    print(f"{len(allS)} sessions, {len(errs)} errors")
    if merge and not errs:
        out = HERE / "transcriptions" / "merged.json"
        out.write_text(json.dumps({"schema": "tycho-mars-session/2", "merged_from": args,
                                   "sessions": sorted(allS, key=lambda s: s["id"])}, indent=1, ensure_ascii=False))
        print("wrote", out)
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
