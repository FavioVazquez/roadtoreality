#!/usr/bin/env python
"""S11 (POST HOC, pre-registered): P(dA>0) for every S9 decision cell, both lanes, with pre-merger A_i scaled uniformly by
k = 1 (nominal), 1/1.066 (LVK -40 t_M level), 2.944/2.992 (mass-prior reweighting); and the k at which P_min = 0.90 (bisection).
Writes results/area_task9_scale.csv and results/area_task9_scale.json."""
import os, sys, json, numpy as np, pandas as pd
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from combine_area import area, load_table, sha256
from area_task8_checks import LANES, RD
OUT = os.path.abspath(os.path.join(HERE, ".."))
D = pd.read_csv(os.path.join(OUT, "results", "area_task4.csv")); D = D[D.decision_set == True]
K = {"nominal": 1.0, "a_LVK_level": 1 / 1.066, "b_mass_prior": 2.944 / 2.992}
def sentence(pmin):   # S6 rule (delta* condition only matters for P_min >= 0.99; not reached here)
    return 1 if pmin >= 0.99 else (3 if pmin >= 0.90 else 4)
rows, summ = [], {}
for lane, path in LANES.items():
    T = load_table(path, "auto", None)
    Ai = area(np.asarray(T["mass_1"], float), np.asarray(T["a_1"], float)) + area(np.asarray(T["mass_2"], float), np.asarray(T["a_2"], float)); As = np.sort(Ai)
    Afs = {c.label: area(*(lambda R: (R["m"], R["chi"]))(np.load(os.path.join(RD, c.label + "_posterior.npz")))) for _, c in D[D.premerger == lane].iterrows()}
    P = lambda k, Af: float((np.searchsorted(As * k, Af, side="left") / len(As)).mean())
    Pmin = lambda k: min(P(k, Af) for Af in Afs.values())
    for _, c in D[D.premerger == lane].iterrows():
        r = dict(premerger=lane, start_Mf=c.start_Mf, variant=c.variant, label=c.label)
        for nm, k in K.items(): r["P_" + nm] = P(k, Afs[c.label])
        rows.append(r)
    lo, hi = 0.85, 1.0; assert Pmin(lo) > 0.90 > Pmin(hi)
    for _ in range(60):
        mid = 0.5 * (lo + hi)
        if Pmin(mid) > 0.90: lo = mid
        else: hi = mid
    kc = 0.5 * (lo + hi)
    summ[lane] = {nm: dict(k=k, P_min=Pmin(k), sentence=sentence(Pmin(k)), within_2se_of_090=bool(abs(Pmin(k) - 0.90) < 0.022)) for nm, k in K.items()}
    summ[lane]["k_cross_090"] = kc; summ[lane]["Ai_excess_at_cross_pct"] = 100 * (1 / kc - 1)
df = pd.DataFrame(rows); df.to_csv(os.path.join(OUT, "results", "area_task9_scale.csv"), index=False, float_format="%.6g")
json.dump({"summary": summ, "inputs": {k: sha256(v) for k, v in LANES.items()}, "script_sha256": sha256(__file__)}, open(os.path.join(OUT, "results", "area_task9_scale.json"), "w"), indent=1)
pd.set_option("display.width", 220)
print(df.round(4).to_string(index=False)); print(json.dumps(summ, indent=1))
for lane, g in df.groupby("premerger"):
    for nm in K: i = g["P_" + nm].idxmin(); print(lane, nm, "argmin", g.label[i])
