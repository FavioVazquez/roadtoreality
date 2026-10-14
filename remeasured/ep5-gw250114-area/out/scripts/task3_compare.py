#!/usr/bin/env python
"""Task 3 table + figure: our ringdown 1.1.0 runs (results/ringdown/T3_*) vs Isi & Farr 2023's own GW150914 220+221 samples
(Zenodo 7597043 figure2/gw150914/summary_samples.hdf5, t0M = 0; cited). M_f detector frame [M_sun]; 16/50/84% quantiles.
Writes results/task3_isifarr_ladder.csv and figures/task3_ladder.png."""
import os, json, hashlib, h5py, numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
OUT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
REF = os.path.join(OUT, "..", "data", "external", "zenodo_7597043", "figure2", "gw150914", "summary_samples.hdf5")
g = h5py.File(REF, "r")["samples"]
X = pd.DataFrame(g["block0_values"][()], columns=["M", "chi", "A0", "A1", "tau0", "tau1", "t0M"]); X["sr"] = g["block1_values"][()][:, 0]
theirs = {sr: X[(X.t0M.round(3) == 0.0) & (X.sr == sr)] for sr in (2048, 16384)}
q = lambda x: np.quantile(x, [0.16, 0.5, 0.84])
rows = []
for sr, d in theirs.items():
    rows.append(dict(label=f"IsiFarr2023_published_sr{sr}", chain="ref", change="their own posterior (cited, Zenodo 7597043)",
                     **dict(zip(["m16", "m50", "m84"], q(d.M))), **dict(zip(["chi16", "chi50", "chi84"], q(d.chi))), n=len(d)))
order = ["T3_A0_theirs_ds1", "T3_A0_theirs_ds8", "T3_A1a_acf_fd", "T3_A1b_acf_slice128", "T3_A2_amp_marg", "T3_A3_pol_generic",
         "T3_A4a_digfilt", "T3_A4b_mmax150", "T3_A4c_dataV1", "T3_B1_acf_theirs", "T3_B2_amp_theirs", "T3_B3_pol_theirs", "T3_B4_digfilt_off"]
RD = os.path.join(OUT, "results", "ringdown")
for lab in order:
    sp, pp = os.path.join(RD, lab + "_summary.json"), os.path.join(RD, lab + "_posterior.npz")
    if not os.path.exists(sp):
        rows.append(dict(label=lab, chain=lab[3], change="MISSING (fit did not finish)")); continue
    s = json.load(open(sp)); p = np.load(pp)
    rows.append(dict(label=lab, chain=lab[3], change=s["config"]["variation"], **dict(zip(["m16", "m50", "m84"], q(p["m"]))),
                     **dict(zip(["chi16", "chi50", "chi84"], q(p["chi"]))), n=len(p["m"]), rhat_m=s["rhat_m"], ess_bulk_m=s["ess_bulk_m"],
                     wall_s=s["wall_s"], posterior_sha256=hashlib.sha256(open(pp, "rb").read()).hexdigest()))
T = pd.DataFrame(rows).set_index("label")
# step deltas: chain A cumulative (A0_ds8 -> ... -> A4c); chain B vs our P 16 kHz base (= A4c)
A = ["T3_A0_theirs_ds8", "T3_A1a_acf_fd", "T3_A1b_acf_slice128", "T3_A2_amp_marg", "T3_A3_pol_generic", "T3_A4a_digfilt", "T3_A4b_mmax150", "T3_A4c_dataV1"]
T["d_m50_vs_prev_or_base"] = np.nan
for a, b in zip(A[:-1], A[1:]):
    if b in T.index and a in T.index: T.loc[b, "d_m50_vs_prev_or_base"] = T.loc[b, "m50"] - T.loc[a, "m50"]
for b in [l for l in order if l.startswith("T3_B")]:
    if b in T.index: T.loc[b, "d_m50_vs_prev_or_base"] = T.loc[b, "m50"] - T.loc["T3_A4c_dataV1", "m50"]
for lab, sr in (("T3_A0_theirs_ds8", 2048), ("T3_A0_theirs_ds1", 16384)):
    r = f"IsiFarr2023_published_sr{sr}"
    if lab in T.index:
        T.loc[lab, "d_m50_vs_published"] = T.loc[lab, "m50"] - T.loc[r, "m50"]
        T.loc[lab, "d_m16_vs_published"] = T.loc[lab, "m16"] - T.loc[r, "m16"]
        T.loc[lab, "d_m84_vs_published"] = T.loc[lab, "m84"] - T.loc[r, "m84"]
T.to_csv(os.path.join(OUT, "results", "task3_isifarr_ladder.csv"), float_format="%.4g")
print(T[["m16", "m50", "m84", "chi50", "d_m50_vs_prev_or_base", "rhat_m", "ess_bulk_m"]].round(2).to_string())
