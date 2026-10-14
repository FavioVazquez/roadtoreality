#!/usr/bin/env python
"""Task 8 (STATUS S10, pre-registered): fragility of P(dA>0) and autocorrelation-aware standard errors, for every S9
decision cell (both lanes). Ringdown samples: 4 NUTS chains x 2000 draws, stored chain-major in *_posterior.npz.
Pre-merger samples: nested-sampling posterior draws, treated as independent. Writes results/area_task8_checks.csv."""
import os, sys, json, numpy as np, pandas as pd
from scipy.stats import norm
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from combine_area import area, load_table, sha256
OUT = os.path.abspath(os.path.join(HERE, "..")); ROOT = os.path.join(OUT, ".."); RD = os.path.join(OUT, "results", "ringdown")
LANES = {"lane1_XPHM_fmax131": os.path.join(ROOT, "premerger-box", "GW250114_082203_IMRPhenomXPHM_fmax131_full_nlive1000_posterior.csv.gz"),
         "lane2_XPHM_fmax131": os.path.join(ROOT, "premerger", "samples", "GW250114_082203_premerger_posterior.csv.gz")}
NCH, NDR, BLOCK, NBOOT = 4, 2000, 100, 400
def ess_ips(x):
    """multi-chain ESS (Geyer initial positive sequence on the chain-averaged autocorrelation); x shape (chains, draws)"""
    m, n = x.shape; xc = x - x.mean(axis=1, keepdims=True)
    f = np.fft.rfft(xc, 2 * n, axis=1); ac = np.fft.irfft(f * np.conj(f), axis=1)[:, :n] / n
    var_w = ac[:, 0].mean(); var_b = n * x.mean(axis=1).var(ddof=1) if m > 1 else 0.0
    vhat = (n - 1) / n * var_w + var_b / n
    rho = 1 - (var_w - ac.mean(axis=0)) / vhat; rho[0] = 1.0
    s, k = 0.0, 0
    while k + 1 < n:
        pair = rho[k] + rho[k + 1]
        if pair < 0: break
        s += pair; k += 2
    tau = -1 + 2 * s
    return m * n / max(tau, 1e-12)
def main():
    rng = np.random.default_rng(20261014); rows = []
    D = pd.read_csv(os.path.join(OUT, "results", "area_task4.csv")); D = D[D.decision_set == True]
    for lane, path in LANES.items():
        T = load_table(path, "auto", None); Ai = area(np.asarray(T["mass_1"], float), np.asarray(T["a_1"], float)) + area(np.asarray(T["mass_2"], float), np.asarray(T["a_2"], float))
        As = np.sort(Ai); Ni = len(Ai)
        for _, c in D[D.premerger == lane].iterrows():
            R = np.load(os.path.join(RD, c.label + "_posterior.npz")); Af = area(R["m"], R["chi"]); Nf = len(Af); assert Nf == NCH * NDR
            Afs = np.sort(Af)
            g = np.searchsorted(As, Af, side="left") / Ni                 # P(A_i < A_f,j)
            P = float(g.mean())
            nfail_i = np.searchsorted(Afs, Ai, side="right")            # #(A_f <= A_i) per A_i sample
            tot = int(nfail_i.sum()); top = np.argsort(nfail_i)[::-1][:5]; top5 = int(nfail_i[top].sum())
            keep = np.ones(Ni, bool); keep[top] = False
            P_drop = float((np.searchsorted(np.sort(Ai[keep]), Af, side="left") / keep.sum()).mean())
            # (a) chain-block bootstrap on ringdown x iid bootstrap on A_i
            blocks = Af.reshape(NCH, NDR // BLOCK, BLOCK).reshape(-1, BLOCK); nb = blocks.shape[0]
            bs = []
            for _ in range(NBOOT):
                f = blocks[rng.integers(0, nb, nb)].ravel(); a = np.sort(Ai[rng.integers(0, Ni, Ni)])
                bs.append((np.searchsorted(a, f, side="left") / Ni).mean())
            se_block = float(np.std(bs))
            # (b) ESS-based: ringdown term var(g)/ESS(g) + A_i term var(h)/N_i
            ess_g = ess_ips(g.reshape(NCH, NDR)); h = 1 - np.searchsorted(Afs, Ai, side="right") / Nf
            se_ess = float(np.sqrt(g.var() / ess_g + h.var() / Ni))
            # naive iid reference (as in S6)
            se_iid = float(np.sqrt(g.var() / Nf + h.var() / Ni))
            se = max(se_block, se_ess)
            rows.append(dict(premerger=lane, start_Mf=c.start_Mf, variant=c.variant, label=c.label, P=P, P_check_vs_S9=float(P - c.P),
                             sigma=float(norm.ppf(P)), n_pairs=Ni * Nf, n_fail_pairs=tot, frac_fail_from_top5_Ai=top5 / tot if tot else np.nan,
                             top5_Ai_1e11=";".join(f"{x/1e11:.3f}" for x in Ai[top]), P_drop_top5=P_drop, sigma_drop_top5=float(norm.ppf(P_drop)),
                             se_iid=se_iid, se_block100=se_block, ess_g=float(ess_g), se_ess=se_ess, se_reported=se,
                             sigma_lo_2se=float(norm.ppf(max(P - 2 * se, 1e-12))), sigma_hi_2se=float(norm.ppf(min(P + 2 * se, 1 - 1e-12)))))
    df = pd.DataFrame(rows); df.to_csv(os.path.join(OUT, "results", "area_task8_checks.csv"), index=False, float_format="%.6g")
    pd.set_option("display.width", 260)
    print(df[["premerger", "start_Mf", "variant", "P", "P_check_vs_S9", "sigma", "n_fail_pairs", "frac_fail_from_top5_Ai", "sigma_drop_top5", "se_iid", "se_block100", "ess_g", "se_ess", "se_reported"]].round(4).to_string(index=False))
    for lane, g in df.groupby("premerger"):
        i = g.P.idxmin(); print(lane, "P_min", round(g.P[i], 4), g.label[i], "se", round(g.se_reported[i], 4), "P_min+2se", round(g.P[i] + 2 * g.se_reported[i], 4))
    json.dump({"inputs": {k: sha256(v) for k, v in LANES.items()}, "script_sha256": sha256(__file__), "block": BLOCK, "nboot": NBOOT}, open(os.path.join(OUT, "results", "area_task8_checks.json"), "w"), indent=1)
if __name__ == "__main__":
    main()
