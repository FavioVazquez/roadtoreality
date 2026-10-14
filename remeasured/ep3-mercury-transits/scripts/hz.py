"""JPL Horizons API helper with an on-disk cache (data/horizons/, gitignored).

Uses the system curl (/usr/bin/curl) because the Python CA bundle on this Mac rejects the
TLS chain; the request is a plain GET to https://ssd.jpl.nasa.gov/api/horizons.api.
Every raw response is kept, so each number traces back to a cached Horizons text file.
"""
import hashlib
import json
import pathlib
import subprocess
import time

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / "data" / "horizons"
API = "https://ssd.jpl.nasa.gov/api/horizons.api"


def _q(v):
    return f"'{v}'"


def raw(params):
    """Return the raw text of a Horizons API call (cached)."""
    CACHE.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha256(json.dumps(params, sort_keys=True).encode()).hexdigest()[:24]
    f = CACHE / f"{key}.txt"
    if f.exists():
        return f.read_text()
    args = ["/usr/bin/curl", "-s", "--fail", "--max-time", "120", "-G", API]
    for k, v in params.items():
        args += ["--data-urlencode", f"{k}={v}"]
    for attempt in range(4):
        r = subprocess.run(args, capture_output=True, text=True)
        if r.returncode == 0 and "$$SOE" in r.stdout:
            f.write_text(r.stdout)
            (CACHE / f"{key}.params.json").write_text(json.dumps(params, indent=1, sort_keys=True))
            return r.stdout
        time.sleep(2 + 3 * attempt)
    raise RuntimeError(f"Horizons failed: {params}\n{r.stdout[-2000:]}\n{r.stderr[-500:]}")


def observer(target, jd_start, jd_stop, nsteps, center="500@399", site=None,
             time_type="TT", quantities="2,13,30"):
    """Observer table. Times are Julian dates on the TIME_TYPE scale.
    site: (east_lon_deg, lat_deg, alt_km) geodetic, used with center coord@399.
    Returns dict with jd, ra, dec (deg), angdiam (arcsec), tdb_ut (s) and the raw text."""
    p = {
        "format": "text", "COMMAND": _q(target), "OBJ_DATA": _q("NO"), "MAKE_EPHEM": _q("YES"),
        "EPHEM_TYPE": _q("OBSERVER"), "CENTER": _q(center),
        "START_TIME": _q(f"JD {jd_start:.9f}"), "STOP_TIME": _q(f"JD {jd_stop:.9f}"),
        "STEP_SIZE": _q(str(int(nsteps))), "QUANTITIES": _q(quantities),
        "ANG_FORMAT": _q("DEG"), "CAL_FORMAT": _q("JD"), "TIME_TYPE": _q(time_type),
        "EXTRA_PREC": _q("YES"), "CSV_FORMAT": _q("YES"), "APPARENT": _q("AIRLESS"),
    }
    if site is not None:
        p["CENTER"] = _q("coord@399")
        p["COORD_TYPE"] = _q("GEODETIC")
        p["SITE_COORD"] = _q(f"{site[0]:.6f},{site[1]:.6f},{site[2]:.4f}")
    txt = raw(p)
    body = txt.split("$$SOE")[1].split("$$EOE")[0].strip().splitlines()
    hdr = [h.strip() for h in txt.split("$$SOE")[0].strip().splitlines()[-2].split(",")]
    rows = [[c.strip() for c in ln.split(",")] for ln in body]
    col = {h: i for i, h in enumerate(hdr)}
    jd = np.array([float(r[0]) for r in rows])
    out = {"jd": jd, "text": txt}
    ira = [i for h, i in col.items() if h.startswith("R.A.")]
    idec = [i for h, i in col.items() if h.startswith("DEC")]
    if ira and idec:
        out["ra"] = np.array([float(r[ira[0]]) for r in rows])
        out["dec"] = np.array([float(r[idec[0]]) for r in rows])
    if "Ang-diam" in col:
        out["angdiam"] = np.array([float(r[col["Ang-diam"]]) for r in rows])
    if "TDB-UT" in col:
        out["tdb_ut"] = np.array([float(r[col["TDB-UT"]]) for r in rows])
    if "L_Ap_Hour_Ang" in col:
        out["lha"] = np.array([float(r[col["L_Ap_Hour_Ang"]]) for r in rows])
    out["source"] = [ln.strip() for ln in txt.splitlines() if ln.startswith("Target body name")][0]
    return out


def vectors(target, jd_tdb_list, center="500@0", ref_plane="ECLIPTIC"):
    """State vectors (AU, AU/day) on the TDB scale at the listed Julian dates (ICRF axes,
    ecliptic-J2000 plane by default). Returns array (n, 6) and the raw text.
    Lists longer than 50 instants are split into chunks (Horizons rejects very long TLISTs)."""
    jd_tdb_list = list(jd_tdb_list)
    if len(jd_tdb_list) > 50:
        parts = [vectors(target, jd_tdb_list[i:i + 50], center, ref_plane) for i in range(0, len(jd_tdb_list), 50)]
        return np.vstack([q[0] for q in parts]), "\n".join(q[1] for q in parts)
    p = {
        "format": "text", "COMMAND": _q(target), "OBJ_DATA": _q("YES"), "MAKE_EPHEM": _q("YES"),
        "EPHEM_TYPE": _q("VECTORS"), "CENTER": _q(center), "REF_PLANE": _q(ref_plane),
        "REF_SYSTEM": _q("ICRF"), "OUT_UNITS": _q("AU-D"), "VEC_TABLE": _q("2"), "CSV_FORMAT": _q("YES"),
        "VEC_LABELS": _q("NO"), "TIME_TYPE": _q("TDB"),
        "TLIST": " ".join(f"'{j:.9f}'" for j in jd_tdb_list), "TLIST_TYPE": _q("JD"),
    }
    txt = raw(p)
    body = txt.split("$$SOE")[1].split("$$EOE")[0].strip().splitlines()
    rows = [[c.strip() for c in ln.split(",")] for ln in body]
    arr = np.array([[float(v) for v in r[2:8]] for r in rows])
    return arr, txt
