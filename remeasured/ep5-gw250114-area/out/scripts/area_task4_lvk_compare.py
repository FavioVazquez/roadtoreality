#!/usr/bin/env python
"""Task 4 comparison with LVK (run only AFTER S6 results were written; STATUS v11 sha256 93467e6d...).
Uses the LVK GW250114 data release (Zenodo 10.5281/zenodo.16877102, arXiv:2509.08054; all inputs 'cited'):
 data/area_law_inspiral_data.hdf5 (A_i vs inspiral truncation time, units M_sun^2 G^2/c^4), data/ringdown_areas/220_*M_final_mass_spin_area.hdf5,
 data/remnant_area_pyring_reweighted.npy. Recomputes their headline statistic (release script define_area_and_ringdown_macros.py:
 Gaussian significance (mu_f - mu_i)/sqrt(s_f^2 + s_i^2) with A_f = equal mix of ringdown and pyRing at 10.5 M_f, A_i at t< = -40 t_M),
 and applies our exact P(A_f > A_i) to their samples, and both statistics to cross combinations.
Writes results/area_task4_vs_LVK.csv and results/area_task4_LVK_scan.csv."""
import os, sys, glob, re, h5py, numpy as np, pandas as pd
from scipy.stats import norm
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from combine_area import area, load_table, sha256
OUT = os.path.abspath(os.path.join(HERE, "..")); RL = os.path.join(OUT, "..", "data", "zenodo_16877102", "release", "data")
import lal
U = (lal.MSUN_SI * lal.G_SI / lal.C_SI**2) ** 2          # their area unit -> m^2
PRE = os.path.join(OUT, "..", "premerger-box", "GW250114_082203_IMRPhenomXPHM_fmax131_full_nlive1000", "GW250114_082203_IMRPhenomXPHM_fmax131_full_nlive1000_result.json")
gs = lambda f, i: float((f.mean() - i.mean()) / np.sqrt(f.std() ** 2 + i.std() ** 2))
def Pex(Ai, Af): return float((np.searchsorted(np.sort(Ai), Af) / len(Ai)).mean())
def row(name, Ai, Af, rng):
    P = Pex(Ai, Af); a = rng.choice(Ai, 10**6); f = rng.choice(Af, 10**6); fr = (f - a) / a
    return dict(combo=name, Ai_med_1e11m2=np.median(Ai) / 1e11, Af_med_1e11m2=np.median(Af) / 1e11, frac_med=np.median(fr), frac_q05=np.quantile(fr, .05),
                frac_q95=np.quantile(fr, .95), P_exact=P, sigma_exact=norm.ppf(P) if P < 1 else np.inf, gauss_sigma=gs(Af, Ai))
rng = np.random.default_rng(7)
f = h5py.File(os.path.join(RL, "area_law_inspiral_data.hdf5"), "r"); times = f["times"][:]
k40 = np.where(np.isclose(times, -40, atol=0.5))[0][0]; AiL = f[f"area_insp_{k40}"][:] * U
Af_rd = h5py.File(os.path.join(RL, "ringdown_areas", "220_10.5M_final_mass_spin_area.hdf5"), "r")["Area_f"][:]
Af_py = np.load(os.path.join(RL, "remnant_area_pyring_reweighted.npy"))
p = np.random.default_rng(seed=250114); n = min(len(Af_rd), len(Af_py))          # exactly as the release script
AfL = np.concatenate([p.choice(Af_rd, size=n, replace=False), p.choice(Af_py, size=n, replace=False)]) * U
T = load_table(PRE, "auto", None); AiO = area(T["mass_1"], T["a_1"]) + area(T["mass_2"], T["a_2"])
def ours(lab): R = np.load(os.path.join(OUT, "results", "ringdown", lab + "_posterior.npz")); return area(R["m"], R["chi"])
rows = [row("LVK A_i(t<=-40 t_M) x LVK A_f(10.5 M_f, ringdown+pyRing)  [their headline combination]", AiL, AfL, rng),
        row("ours A_i(20-131 Hz) x ours A_f(10.5 M_f, V0 baseline)  [our reference cell]", AiO, ours("GW250114_220_10p5M"), rng),
        row("LVK A_i(-40 t_M) x ours A_f(10.5 M_f, V0)  [swap 'after']", AiL, ours("GW250114_220_10p5M"), rng),
        row("ours A_i(131 Hz) x LVK A_f(10.5 M_f, ringdown+pyRing)  [swap 'before']", AiO, AfL, rng)]
pd.DataFrame(rows).to_csv(os.path.join(OUT, "results", "area_task4_vs_LVK.csv"), index=False, float_format="%.6g")
mins = min(gs(AfL, f[f"area_insp_{k}"][:] * U) for k in range(len(times)))
scan = []
for pth in glob.glob(os.path.join(RL, "ringdown_areas", "220_*M_final_mass_spin_area.hdf5")):
    t = float(re.search(r"220_([\d.]+)M_", pth)[1]); h = h5py.File(pth, "r"); Af = h["Area_f"][:] * U
    scan.append(dict(source="LVK release: their A_i(-40 t_M) x their 220 'ringdown' fit", start_Mf=t, Mf_med=float(np.median(h["M_f"][:])), chif_med=float(np.median(h["chi_f"][:])),
                     P_exact=Pex(AiL, Af), gauss_sigma=gs(Af, AiL), n_f=len(Af)))
S = pd.DataFrame(scan).sort_values("start_Mf"); S.to_csv(os.path.join(OUT, "results", "area_task4_LVK_scan.csv"), index=False, float_format="%.6g")
pd.set_option("display.width", 220); pd.set_option("display.max_colwidth", 90)
print("recomputed LVK headline Gaussian significance:", round(rows[0]["gauss_sigma"], 3), "; minimum over inspiral truncation times:", round(mins, 3))
print(pd.DataFrame(rows).round(4).to_string(index=False)); print(S.drop(columns="source").round(4).to_string(index=False))
print("inputs sha256:", {os.path.basename(x): sha256(x)[:16] for x in [os.path.join(RL, "area_law_inspiral_data.hdf5"), os.path.join(RL, "remnant_area_pyring_reweighted.npy"), os.path.join(RL, "ringdown_areas", "220_10.5M_final_mass_spin_area.hdf5")]})
