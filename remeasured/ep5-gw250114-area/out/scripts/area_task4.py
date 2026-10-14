#!/usr/bin/env python
"""Task 4 (STATUS S6, pre-registered): GW250114 horizon-area change, pre-merger bilby posterior ("before") x our
ringdown 220-only posteriors ("after"), over the pre-registered start times and conditioning variants.
Uses area()/load_table()/sha256() from combine_area.py. Detector frame on both sides.
Usage: area_task4.py --premerger LABEL=PATH [--premerger LABEL2=PATH2 ...]   (a second lane's run plugs in here)
Writes results/area_task4.csv, results/area_task4.json (provenance), figures/area_task4.png"""
import os, sys, json, glob, argparse, datetime, time
import numpy as np, pandas as pd
from scipy.stats import norm
from scipy.optimize import brentq
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from combine_area import area, load_table, sha256, G, c, MSUN
OUT = os.path.abspath(os.path.join(HERE, ".."))
RD = os.path.join(OUT, "results", "ringdown")
STARTS = [8.0, 10.5, 12.0, 13.0, 15.0, 18.0, 20.0]
DECISION_STARTS = [10.5, 12.0, 13.0, 15.0, 18.0, 20.0]
def tag(t): return (f"{t:g}".replace(".", "p")) + "M"
VARIANTS = {"V0_baseline": "", "V1_nohp": "_nohp", "V2_pePSD": "_pePSD"}
ROBUST_10p5 = {"R_acf64s": "_acf64s", "R_4096Hz": "_ds1_4096Hz", "R_dur0p1s": "_dur0p1s", "R_seed99": "_seed99"}
EXTRA_MODES = {"V4_220221": "220221", "X_220330": "220330"}   # S9 pre-registered
S5_FILTER_SHIFT = 3.2 / 78.5     # S5 GW150914 decimation-filter shift of the M_f median (indicative scale only)

def P_gt(Ai_sorted, Af):
    return float((np.searchsorted(Ai_sorted, Af, side="left") / len(Ai_sorted)).mean())
def stats(Ai, Af, rng, npairs=1_000_000, nboot=200):
    As = np.sort(Ai); P = P_gt(As, Af)
    boot = []
    for _ in range(nboot):
        a = np.sort(Ai[rng.integers(0, len(Ai), len(Ai))]); f = Af[rng.integers(0, len(Af), len(Af))]
        boot.append(P_gt(a, f))
    i = rng.integers(0, len(Ai), npairs); j = rng.integers(0, len(Af), npairs)
    fr = (Af[j] - Ai[i]) / Ai[i]; q = np.quantile(fr, [0.05, 0.5, 0.95])
    sat = bool(Af.min() > Ai.max())
    def delta_for(target):
        f = lambda d: P_gt(As, Af * (1 - d) ** 2) - target
        lo, hi = -0.5, 0.6
        return float(brentq(f, lo, hi, xtol=1e-5)) if f(lo) > 0 > f(hi) else np.nan
    return dict(frac_med=q[1], frac_q05=q[0], frac_q95=q[2], P=P, P_se=float(np.std(boot)),
                sigma_1sided=float(norm.ppf(P)) if 0 < P < 1 else np.inf, saturated=sat,
                P_floor=1 - 1 / (len(Ai) * len(Af)),
                gauss_sigma=float((Af.mean() - Ai.mean()) / np.sqrt(Af.var() + Ai.var())),
                delta_star_090=delta_for(0.90), delta_star_050=delta_for(0.50),
                Af_med_m2=float(np.median(Af)))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--premerger", action="append", required=True); ap.add_argument("--seed", type=int, default=20250114)
    a = ap.parse_args(); t0 = time.time(); rng = np.random.default_rng(a.seed)
    rows, prov = [], {"premerger": {}, "ringdown": {}, "script_sha256": sha256(__file__), "combine_area_sha256": sha256(os.path.join(HERE, "combine_area.py")),
                      "constants": {"G": G, "c": c, "M_sun_kg": MSUN}, "seed": a.seed, "run_utc": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    for spec in a.premerger:
        plab, path = spec.split("=", 1)
        T = load_table(path, "auto", None)
        m1, m2, x1, x2, z = (np.asarray(T[k], float) for k in ("mass_1", "mass_2", "a_1", "a_2", "redshift"))
        m1s, m2s = np.asarray(T["mass_1_source"], float), np.asarray(T["mass_2_source"], float)
        fchk = float(max(np.max(np.abs(m1 / m1s - 1 - z)), np.max(np.abs(m2 / m2s - 1 - z))))
        assert fchk < 1e-6, f"frame check failed: {fchk}"
        assert np.all((x1 >= 0) & (x1 < 1) & (x2 >= 0) & (x2 < 1))
        Ai = area(m1, x1) + area(m2, x2); Ai_src = area(m1s, x1) + area(m2s, x2)
        prov["premerger"][plab] = {"file": os.path.abspath(path), "sha256": sha256(path), "n": int(len(Ai)), "frame_check_max_abs": fchk,
                                   "Ai_det_m2_q05_q50_q95": np.quantile(Ai, [0.05, .5, .95]).tolist(),
                                   "Ai_src_m2_q05_q50_q95": np.quantile(Ai_src, [0.05, .5, .95]).tolist(),
                                   "m1_det_q50": float(np.median(m1)), "m2_det_q50": float(np.median(m2)), "a1_q50": float(np.median(x1)), "a2_q50": float(np.median(x2))}
        cells = [(t, v, f"GW250114_220_{tag(t)}{sfx}") for t in STARTS for v, sfx in VARIANTS.items()] + \
                [(10.5, v, f"GW250114_220_10p5M{sfx}") for v, sfx in ROBUST_10p5.items()] + \
                [(t, v, f"GW250114_{modes}_{tag(t)}") for t in STARTS for v, modes in EXTRA_MODES.items()]   # S9: V4 (220+221, decision set); X (220+330, report only)
        mix = {}
        for t, v, lab in cells:
            p = os.path.join(RD, lab + "_posterior.npz")
            if not os.path.exists(p):
                continue
            R = np.load(p); Af = area(R["m"], R["chi"]); prov["ringdown"][lab] = {"file": p, "sha256": sha256(p)}
            dec = (t in DECISION_STARTS) and (v in VARIANTS or v == "V4_220221")
            if v in VARIANTS: mix.setdefault(t, []).append(Af)
            S = json.load(open(p.replace("_posterior.npz", "_summary.json")))
            rows.append(dict(premerger=plab, start_Mf=t, variant=v, label=lab, decision_set=dec, n_ringdown=len(Af), n_premerger=len(Ai),
                             Mf_med=float(np.median(R["m"])), chif_med=float(np.median(R["chi"])), Ai_med_m2=float(np.median(Ai)),
                             rhat_m=S.get("rhat_m"), ess_bulk_m=S.get("ess_bulk_m"), **stats(Ai, Af, rng)))
        for t, L in mix.items():
            Af = np.concatenate(L)
            rows.append(dict(premerger=plab, start_Mf=t, variant=f"MIX_equal({len(L)})", label="mixture", decision_set=False, n_ringdown=len(Af), n_premerger=len(Ai),
                             Mf_med=np.nan, chif_med=np.nan, Ai_med_m2=float(np.median(Ai)), **stats(Ai, Af, rng)))
        # V3 decimation-filter slot: pre-registered, no GW250114 fit exists
        for t in STARTS:
            rows.append(dict(premerger=plab, start_Mf=t, variant="V3_scipy_decimate", label="NOT RUN (S6: carried as unassessed; see delta_star)", decision_set=False))
    df = pd.DataFrame(rows).sort_values(["premerger", "start_Mf", "variant"])
    df.to_csv(os.path.join(OUT, "results", "area_task4.csv"), index=False, float_format="%.6g")
    prov["runtime_s"] = time.time() - t0
    json.dump(prov, open(os.path.join(OUT, "results", "area_task4.json"), "w"), indent=1)
    d = df[df.decision_set == True]
    for plab, g in d.groupby("premerger"):
        print(plab, "decision cells", len(g), "P_min", g.P.min(), "at", g.loc[g.P.idxmin(), "label"], "P_max", g.P.max(),
              "frac_med range", round(g.frac_med.min(), 4), round(g.frac_med.max(), 4), "delta*_090 min", round(g.delta_star_090.min(), 4),
              "max P_se", round(g.P_se.max(), 5), "any saturated", bool(g.saturated.any()))
    return df
if __name__ == "__main__":
    main()
