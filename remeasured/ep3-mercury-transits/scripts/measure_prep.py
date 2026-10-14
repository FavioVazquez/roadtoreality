"""Prepare the 58 contacts for the fit: observed TT (two Delta T models), the Horizons contact instant
(control data set), and the Moon's geocentric vector at each instant (for the geocentre offset).
Writes out/measure_input.csv. Horizons calls are cached (data/horizons/)."""
import csv
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import hz
import transit as T

OUT = T.hz.ROOT / "out"
S = list(csv.DictReader(open(OUT / "newcomb_geocentric_summary.csv")))


def astro_to_jd(date, tstr):
    y, m, d = (int(v) for v in date.split("-"))
    return T.jd_gregorian(y, m, d, 12 + T.hms(tstr) / 3600)


def year_dec(jd):
    return 2000.0 + (jd - 2451544.5) / 365.2425


rows = []
for s in S:
    ut = astro_to_jd(s["astro_date"], s["gmt_geo_astro"])
    dT = T.deltat_em(year_dec(ut))
    tt_em = ut + dT / 86400
    ser = T.series(tt_em, 20)  # cached from the kill test
    c = T.contact(ser, s["contact"], tt_em)
    tt_hz = ut + c["tdb_ut"] / 86400
    rows.append({"transit": s["transit"], "contact": s["contact"], "weight": s["weight"],
                 "month": "Nov" if s["astro_date"][5:7] in ("10", "11") else "May",
                 "jd_ut_obs": f"{ut:.8f}", "jd_tt_obs_em": f"{tt_em:.8f}", "jd_tt_obs_hz": f"{tt_hz:.8f}",
                 "jd_tt_horizons": f"{c['jd']:.8f}", "v_path": f"{c['v_path']:.4f}"})

# Moon vectors (no longer used by the model, which takes the geocentre from Horizons):
moon, _ = hz.vectors("301", [float(r["jd_tt_horizons"]) for r in rows], center="500@399")
for r, m in zip(rows, moon):
    for k, v in zip(("mx", "my", "mz"), m[:3]):
        r[k] = f"{v:.10f}"
with open(OUT / "measure_input.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader()
    w.writerows(rows)
print(len(rows), "rows written")
