"""Day-1 data-quality test: Newcomb (1882) transit-of-Mercury contacts vs JPL Horizons (DE441).

(a) per observation, topocentric: printed local time -> UT with Newcomb's cited equation of time
    and station longitude -> TT with Espenak & Meeus (2006) Delta T -> Horizons apparent airless
    Sun and Mercury seen from the station -> O-C in seconds and arcseconds.
(b) per observation and per concluded contact, geocentric: Newcomb's GMT of geocentric contact
    (astronomical day, +12 h) -> TT -> Horizons geocentric contact -> O-C.
Inputs: out/newcomb_extract.csv, out/stations.csv, out/newcomb_geocentric_summary.csv.
Outputs: out/residuals_obs.csv, out/residuals_summary.csv, out/deltat_eot.csv, out/killtest_stats.json
"""
import csv
import json
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import transit as T

OUT = T.hz.ROOT / "out"
HALF = 20  # minutes either side of the group mean
HALFDAY = 12 * 3600


def dms(s):
    sg = -1 if s.strip().startswith("-") else 1
    p = [float(v) for v in s.replace("+", "").replace("-", "").split()]
    return sg * (p[0] + p[1] / 60 + (p[2] if len(p) > 2 else 0) / 3600)


def hms_signed(s):
    sg = -1 if s.strip().startswith("-") else 1
    p = [float(v) for v in s.replace("+", "").replace("-", "").split()]
    return sg * (p[0] * 3600 + p[1] * 60 + p[2])


def year_dec(jd):
    return 2000.0 + (jd - 2451544.5) / 365.2425


stations = {r["station"]: r for r in csv.DictReader(open(OUT / "stations.csv"))}
rows = list(csv.DictReader(open(OUT / "newcomb_extract.csv")))
summ = list(csv.DictReader(open(OUT / "newcomb_geocentric_summary.csv")))


def astro_to_jd(date, tstr):
    y, m, d = (int(v) for v in date.split("-"))
    return T.jd_gregorian(y, m, d, 12 + T.hms(tstr) / 3600)  # astronomical day starts at noon


# ---------- (a) topocentric, per observation ----------
for r in rows:
    r["jd_ut_obs"] = None
    st = stations.get(r["station"])
    if st is None or r["time_kind"] not in ("LAT", "LMT"):
        continue
    lon_s = hms_signed(st["lon_east_hms"])
    local = astro_to_jd(r["astro_local_date"], r["local_time"])
    lmt = local + float(r["eot_s"] or 0) / 86400  # mean = apparent + E (Newcomb's sign)
    r["jd_ut_obs"] = lmt - lon_s / 86400
    r["site"] = (lon_s / 240.0, dms(st["lat_dms"]), 0.0)

groups = {}
for r in rows:
    if r["jd_ut_obs"] is None:
        continue
    phase = "in" if r["contact"] in ("I", "II") else "out"
    groups.setdefault((r["transit"], r["station"], phase), []).append(r)

src = set()
for key, g in groups.items():
    jd_tt = [x["jd_ut_obs"] + T.deltat_em(year_dec(x["jd_ut_obs"])) / 86400 for x in g]
    c0 = float(np.mean(jd_tt))
    ser = T.series(c0, HALF, site=g[0]["site"])
    src.update(ser["source"])
    for x, jt in zip(g, jd_tt):
        c = T.contact(ser, x["contact"], jt)
        x["dT_em"] = T.deltat_em(year_dec(x["jd_ut_obs"]))
        x["dT_hz"] = c["tdb_ut"]
        x["oc_s"] = (jt - c["jd"]) * 86400
        x["v_path"] = c["v_path"]
        x["v_radial"] = c["v_radial"]
        x["oc_path_as"] = x["oc_s"] * c["v_path"] / 60
        x["radial_as"] = T.radial_error(ser, x["contact"], jt)
        x["pred_ut"] = c["jd"] - x["dT_em"] / 86400

# ---------- (b) geocentric, per observation (Newcomb's GMT column) ----------
ggroups = {}
for r in rows:
    if not r["gmt_geo_astro"]:
        continue
    y, m, d = (int(v) for v in r["astro_local_date"].split("-"))
    # GMT is on the Greenwich astronomical day; pick the day that puts it nearest the local instant
    base = r["jd_ut_obs"]
    cands = [astro_to_jd(f"{y}-{m:02d}-{dd:02d}", r["gmt_geo_astro"]) for dd in (d - 1, d, d + 1)]
    if base is None:
        base = astro_to_jd(r["astro_local_date"], r["gmt_geo_astro"])
    r["jd_ut_geo"] = min(cands, key=lambda j: abs(j - base))
    phase = "in" if r["contact"] in ("I", "II") else "out"
    ggroups.setdefault((r["transit"], phase), []).append(r)

geo_ser = {}
for key, g in ggroups.items():
    jd_tt = [x["jd_ut_geo"] + T.deltat_em(year_dec(x["jd_ut_geo"])) / 86400 for x in g]
    ser = T.series(float(np.median(jd_tt)), HALF)
    geo_ser[key] = ser
    for x, jt in zip(g, jd_tt):
        c = T.contact(ser, x["contact"], jt)
        x["oc_geo_s"] = (jt - c["jd"]) * 86400
        x["oc_geo_path_as"] = x["oc_geo_s"] * c["v_path"] / 60

# ---------- (b') Newcomb's concluded geocentric contacts, all transits ----------
for s in summ:
    jd_ut = astro_to_jd(s["astro_date"], s["gmt_geo_astro"])
    dT = T.deltat_em(year_dec(jd_ut))
    jt = jd_ut + dT / 86400
    ser = T.series(jt, HALF)
    c = T.contact(ser, s["contact"], jt)
    s["dT_em"] = dT
    s["dT_hz"] = c["tdb_ut"]
    s["oc_s"] = (jt - c["jd"]) * 86400
    s["v_path"] = c["v_path"]
    s["v_radial"] = c["v_radial"]
    s["oc_path_as"] = s["oc_s"] * c["v_path"] / 60
    s["radial_as"] = T.radial_error(ser, s["contact"], jt)
    tab = astro_to_jd(s["astro_date"], s["tabular_astro"])
    s["newcomb_oc_s"] = (jd_ut - tab) * 86400  # Newcomb's own observed - Le Verrier tabular
    s["pred_ut"] = T.fmt_hms(((c["jd"] - dT / 86400 + 0.5) % 1) * 86400)

# ---------- equation of time check (modern, from Horizons) ----------
eot = []
for tr, date, tstr, printed in [("1677", "1677-11-06", "21:27:30", -956), ("1677", "1677-11-07", "2:40:08", -954),
                                ("1753", "1753-05-05", "22:18:00", -223)]:
    # Sun's local apparent hour angle at Greenwich, Horizons UT scale
    jd = astro_to_jd(date, tstr) - printed / 86400  # rough UT at Greenwich
    s = T.hz.observer("10", jd, jd + 1 / 1440, 1, site=(0.0, 51.4769, 0.0), time_type="UT", quantities="42")
    lha = s.get("lha")
    if lha is None:
        print(s["text"][:3000])
        raise SystemExit("no hour-angle column")
    ut_sec = ((s["jd"][0] + 0.5) % 1) * 86400
    lat_sec = (lha[0] * 3600 + 12 * 3600) % 86400
    e = ((ut_sec - lat_sec + HALFDAY) % 86400) - HALFDAY  # mean = apparent + E
    eot.append({"transit": tr, "instant_ut": T.fmt_hms(ut_sec), "E_newcomb_s": printed, "E_horizons_s": round(e, 1),
                "diff_s": round(e - printed, 1)})

# ---------- write ----------
fields = ["transit", "page", "station", "observer", "contact", "description", "time_kind", "local_time",
          "newcomb_use", "conf", "ut_obs", "pred_ut", "dT_em", "dT_hz", "oc_s", "v_path", "v_radial",
          "oc_path_as", "radial_as", "gmt_geo_astro", "oc_geo_s", "oc_geo_path_as", "topo_minus_geo_s"]
with open(OUT / "residuals_obs.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(fields)
    for r in rows:
        ut = T.fmt_hms(((r["jd_ut_obs"] + 0.5) % 1) * 86400) if r["jd_ut_obs"] else ""
        pu = T.fmt_hms(((r["pred_ut"] + 0.5) % 1) * 86400) if r.get("pred_ut") else ""
        tg = r["oc_s"] - r["oc_geo_s"] if ("oc_s" in r and "oc_geo_s" in r) else None
        vals = {**r, "ut_obs": ut, "pred_ut": pu, "topo_minus_geo_s": tg}
        out = []
        for k in fields:
            v = vals.get(k, "")
            out.append(f"{v:.1f}" if isinstance(v, float) else ("" if v is None else v))
        w.writerow(out)

sf = ["transit", "contact", "astro_date", "gmt_geo_astro", "weight", "pred_ut", "dT_em", "dT_hz", "oc_s",
      "v_path", "v_radial", "oc_path_as", "radial_as", "newcomb_oc_s", "note"]
with open(OUT / "residuals_summary.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(sf)
    for s in summ:
        w.writerow([f"{s[k]:.1f}" if isinstance(s[k], float) else s[k] for k in sf])

with open(OUT / "deltat_eot.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(eot[0]))
    w.writeheader()
    w.writerows(eot)


# ---------- statistics ----------
def stats(vals, w=None):
    v = np.array(vals, float)
    if len(v) == 0:
        return None
    w = np.ones_like(v) if w is None else np.array(w, float)
    mean = float(np.sum(w * v) / np.sum(w))
    med = float(np.median(v))
    return {"n": int(len(v)), "mean": round(mean, 2), "median": round(med, 2),
            "rms": round(float(np.sqrt(np.mean(v**2))), 2), "sd": round(float(np.std(v, ddof=1)) if len(v) > 1 else 0.0, 2),
            "robust_sd": round(float(1.4826 * np.median(np.abs(v - med))), 2),
            "max_abs": round(float(np.max(np.abs(v))), 2)}


def used(r):
    return r["newcomb_use"].startswith(("used", "double", "half", "combined"))


st = {"sources": sorted(src), "per_transit_obs": {}, "summary": {}}
for tr in ("1677", "1753", "1881"):
    for c in ("I", "II", "III", "IV"):
        sel = [r for r in rows if r["transit"] == tr and r["contact"] == c and "oc_s" in r]
        if not sel:
            continue
        acc = [r for r in sel if used(r) and r["conf"] != "low"]
        st["per_transit_obs"][f"{tr} {c}"] = {
            "all_s": stats([r["oc_s"] for r in sel]), "all_as": stats([r["oc_path_as"] for r in sel]),
            "accepted_s": stats([r["oc_s"] for r in acc]), "accepted_as": stats([r["oc_path_as"] for r in acc]),
            "accepted_radial_as": stats([r["radial_as"] for r in acc]),
            "geo_minus_topo_s": stats([r["oc_s"] - r["oc_geo_s"] for r in sel if "oc_geo_s" in r]),
        }
for name, sel in [("interior", [s for s in summ if s["contact"] in ("II", "III")]),
                  ("exterior", [s for s in summ if s["contact"] == "IV"]),
                  ("all", summ)]:
    st["summary"][name] = {"oc_s": stats([s["oc_s"] for s in sel]),
                           "oc_path_as": stats([s["oc_path_as"] for s in sel]),
                           "oc_path_as_weighted": stats([s["oc_path_as"] for s in sel], [float(s["weight"]) for s in sel]),
                           "radial_as": stats([s["radial_as"] for s in sel])}
    hi = [s for s in sel if float(s["weight"]) >= 1.0]
    st["summary"][name + "_weight_ge_1"] = {"oc_path_as": stats([s["oc_path_as"] for s in hi])}
    st["summary"][name + "_by_century"] = {
        cen: stats([s["oc_path_as"] for s in sel if s["transit"].startswith(cen)]) for cen in ("16", "17", "18")}
st["eot"] = eot
json.dump(st, open(OUT / "killtest_stats.json", "w"), indent=1)
print(json.dumps(st["summary"], indent=1))
for k, v in st["per_transit_obs"].items():
    print(k, "accepted:", v["accepted_s"], v["accepted_as"], "geo-topo:", v["geo_minus_topo_s"])
print(eot)
