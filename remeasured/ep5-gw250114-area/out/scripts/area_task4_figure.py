#!/usr/bin/env python
"""Figure for Task 4 (S6): (a) A_i vs A_f distributions; (b) fractional area change per start time and variant;
(c) P(dA>0) per start time on a Gaussian-sigma axis. Reads results/area_task4.csv and the input posteriors."""
import os, sys, json, numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from scipy.stats import norm, gaussian_kde
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from combine_area import area, load_table
OUT = os.path.abspath(os.path.join(HERE, ".."))
D = pd.read_csv(os.path.join(OUT, "results", "area_task4.csv")); prov = json.load(open(os.path.join(OUT, "results", "area_task4.json")))
pl = list(prov["premerger"])[0]; D = D[D.premerger == pl]
T = load_table(prov["premerger"][pl]["file"], "auto", None)
Ai = (area(T["mass_1"], T["a_1"]) + area(T["mass_2"], T["a_2"])) / 1e11
U = 1e11
fig, ax = plt.subplots(1, 3, figsize=(7.6, 3.0), gridspec_kw={"width_ratios": [1, 1.25, 1.25]})
x = np.linspace(1.5, 7.0, 400)
ax[0].plot(x, gaussian_kde(Ai)(x), color="0.15", lw=1.4, label=r"$A_i$ (pre-merger)")
cols = {10.5: "#1b6ca8", 15.0: "#d08a1f", 20.0: "#b23a48"}
for t, cl in cols.items():
    lab = f"GW250114_220_{t:g}".replace(".", "p") + "M"
    R = np.load(os.path.join(OUT, "results", "ringdown", lab + "_posterior.npz")); Af = area(R["m"], R["chi"]) / U
    ax[0].plot(x, gaussian_kde(Af)(x), color=cl, lw=1.1, label=rf"$A_f$, start {t:g} $M_f$")
ax[0].set_xlabel(r"area [$10^{11}$ m$^2$] (detector frame)"); ax[0].set_ylabel("density"); ax[0].legend(fontsize=6, frameon=False)
ax[0].set_title("a", loc="left", fontweight="bold")
V = {"V0_baseline": ("o", "#1b6ca8", "baseline", -0.25), "V1_nohp": ("s", "#5a9e4b", "no high-pass", 0.0), "V2_pePSD": ("^", "#7d4ea3", "PE PSD", 0.25), "V4_220221": ("D", "#d08a1f", "220+221 (S9)", 0.45)}
for v, (mk, cl, name, dx) in V.items():
    g = D[D.variant == v].sort_values("start_Mf")
    ax[1].errorbar(g.start_Mf + dx, g.frac_med, yerr=[g.frac_med - g.frac_q05, g.frac_q95 - g.frac_med], fmt=mk, ms=3.5, color=cl, lw=1, capsize=1.5, label=name)
    ax[2].plot(g.start_Mf + dx, norm.ppf(g.P), mk + "-", ms=3.5, color=cl, lw=0.9, label="ours: " + name)
for a_ in ax[1:]:
    a_.axvspan(7, 9.25, color="0.92", lw=0); a_.set_xlim(7, 21); a_.set_xlabel(r"ringdown start after peak [$M_f$]")
    a_.text(8.1, 0.03, "not in decision set", transform=a_.get_xaxis_transform(), rotation=90, fontsize=5.5, ha="center", va="bottom", color="0.4")
ax[1].axhline(0, color="0.4", lw=0.8); ax[1].set_ylabel(r"$\Delta A/A_i$ (median, 90%)"); ax[1].legend(fontsize=5.5, frameon=False, loc="upper right", ncol=2); ax[1].set_ylim(-0.2, 1.45)
ax[1].set_title("b", loc="left", fontweight="bold")
LS = os.path.join(OUT, "results", "area_task4_LVK_scan.csv")
if os.path.exists(LS):   # comparison overlay, added after the S6 numbers were written
    L = pd.read_csv(LS); L = L[(L.start_Mf >= 8) & (L.P_exact < 1)]
    ax[2].plot(L.start_Mf, norm.ppf(L.P_exact), "D--", ms=2.6, color="0.45", mfc="white", lw=0.8, label="LVK release samples")
    pass
for p, ls in ((0.90, ":"), (0.99, "--")):
    ax[2].axhline(norm.ppf(p), color="0.45", lw=0.8, ls=ls); ax[2].text(20.8, norm.ppf(p) + 0.05, f"P = {p}", fontsize=6, ha="right", color="0.35")
ax[2].set_ylabel(r"$P(\Delta A>0)$ as one-sided $\sigma$"); ax[2].set_ylim(0.8, 4.0)
ax[2].set_title("c", loc="left", fontweight="bold")
fig.tight_layout(w_pad=1.2, rect=(0, 0.07, 1, 1))
h_, l_ = ax[2].get_legend_handles_labels(); fig.legend(h_, l_, loc="lower right", ncol=5, fontsize=6, frameon=False, title="panel c:", title_fontsize=6, bbox_to_anchor=(0.99, 0.0)); fig.savefig(os.path.join(OUT, "figures", "area_task4.png"), dpi=300); print("saved")
