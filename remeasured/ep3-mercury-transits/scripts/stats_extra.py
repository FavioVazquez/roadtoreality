"""Extra statistics on out/residuals_summary.csv (Newcomb's concluded geocentric contacts vs Horizons).
- per contact type means (systematic phase offsets), with Espenak-Meeus and with Horizons' own Delta T
- detection floor: formal 1-sigma of a linear trend through the along-path residuals
  (no trend is fitted; only its achievable precision from the epochs and the scatter)
- rough mapping of an unexplained secular motion of Mercury's perihelion into along-path sky position
  at the two nodes (first-order Keplerian derivative, stated as an order-of-magnitude factor)
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
S = list(csv.DictReader(open(OUT / "residuals_summary.csv")))
for s in S:
    for k in ("oc_s", "v_path", "oc_path_as", "dT_em", "dT_hz", "weight"):
        s[k] = float(s[k])
    s["oc_hz_s"] = s["oc_s"] + (s["dT_hz"] - s["dT_em"])  # O-C if Horizons' Delta T were used
    s["oc_hz_as"] = s["oc_hz_s"] * s["v_path"] / 60
    s["year"] = int(s["transit"])
    s["month"] = "Nov" if s["astro_date"][5:7] in ("10", "11") else "May"

res = {}
for c in ("II", "III", "IV"):
    sel = [s for s in S if s["contact"] == c]
    a = np.array([s["oc_path_as"] for s in sel])
    b = np.array([s["oc_hz_as"] for s in sel])
    res[f"type_{c}"] = {"n": len(sel), "mean_as_EM": round(a.mean(), 2), "sd_as_EM": round(a.std(ddof=1), 2),
                        "mean_as_HZdT": round(b.mean(), 2), "sd_as_HZdT": round(b.std(ddof=1), 2)}

# after removing one constant per contact type (phase definition differs between II/III/IV)
resid = []
for s in S:
    resid.append(s["oc_path_as"] - res[f"type_{s['contact']}"]["mean_as_EM"])
resid = np.array(resid)
res["after_type_offsets"] = {"rms_as": round(float(np.sqrt(np.mean(resid**2))), 2),
                             "robust_sd_as": round(float(1.4826 * np.median(np.abs(resid - np.median(resid)))), 2),
                             "max_abs_as": round(float(np.abs(resid).max()), 2)}

# Delta T model difference across the span, as an along-path shift
d = np.array([(s["dT_hz"] - s["dT_em"]) * s["v_path"] / 60 for s in S])
res["deltaT_model_difference_as"] = {"min": round(d.min(), 2), "max": round(d.max(), 2)}

# detection floor for a linear trend (arcsec per century) through along-path residuals
t = np.array([s["year"] for s in S]) / 100.0
w = np.array([s["weight"] for s in S])
sig = float(np.sqrt(np.mean(resid**2)))
floor_unw = sig / math.sqrt(np.sum((t - t.mean())**2))
# Newcomb-weighted: weight w means variance sig0^2 / w with sig0 set by the weighted scatter
sig0 = float(np.sqrt(np.sum(w * resid**2) / (len(resid) - 1)))
tw = np.sum(w * t) / np.sum(w)
floor_w = sig0 / math.sqrt(np.sum(w * (t - tw)**2))
res["trend_floor_as_per_century"] = {"unweighted": round(floor_unw, 2), "newcomb_weights": round(floor_w, 2),
                                     "sigma_per_contact_as": round(sig, 2), "span_years": int(round(np.ptp(t) * 100))}

# first-order factor: along-path sky shift per unit change of the longitude of perihelion
# (mean longitude held fixed), at the ascending (November) and descending (May) node
e, a_m = 0.2056, 0.3871
om, varpi = 48.3, 77.5  # node and perihelion longitudes (deg), J2000-ish, adequate for a factor
fac = {}
for name, lam, r_e in (("Nov", om, 0.990), ("May", om + 180, 1.009)):
    nu = math.radians(lam - varpi)
    dnu_dM = (1 + e * math.cos(nu))**2 / (1 - e * e)**1.5
    r = a_m * (1 - e * e) / (1 + e * math.cos(nu))
    fac[name] = round((1 - dnu_dM) * r / (r_e - r), 3)
res["sky_per_perihelion_factor"] = fac
res["note"] = ("trend floors are the 1-sigma precision of a straight line through the residuals; dividing by the"
               " |factor| converts them to perihelion-longitude units. Element correlations are not included.")
st = json.load(open(OUT / "killtest_stats.json"))
st["extra"] = res
json.dump(st, open(OUT / "killtest_stats.json", "w"), indent=1)
print(json.dumps(res, indent=1))
