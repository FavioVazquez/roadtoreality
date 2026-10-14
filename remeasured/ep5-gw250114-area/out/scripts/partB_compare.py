#!/usr/bin/env python
"""Part B comparison (v2). Compares every ringdown run in results/ringdown/ with:
 (i)  GW250114: the public NRSur7dq4 IMR remnant (Zenodo 16877102, detector frame) and the published 220 fits in the data release
      (data/ringdown_areas/220_<t>M_final_mass_spin_area.hdf5, cited);
 (ii) GW150914: the GWTC-2.1 'C01:Mixed' IMR remnant (Zenodo 10.5281/zenodo.6513631, detector frame), and, for the 220+221 runs at
      the peak, Isi et al. 2019 (arXiv:1905.00869): M_f = 68 +/- 7 M_sun, chi_f = 0.63 +/- 0.16 (68% credibility; cited).
Outputs: results/partB_summary.csv, results/partB_issue1_gap.csv, figures/partB_ringdown.png/.pdf"""
import os, json, glob, numpy as np, h5py, pandas as pd
from scipy.stats import gaussian_kde
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
OUT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
DATA = os.path.join(OUT, "..", "data"); REL = os.path.join(DATA, "zenodo_16877102", "release", "data"); RD = os.path.join(OUT, "results", "ringdown")
q = lambda x, p=(0.05, 0.5, 0.95): np.quantile(x, p)
def hpd_level(m, chi, pt):   # posterior mass inside the KDE density contour through pt
    k = gaussian_kde(np.vstack([m, chi])); d = k(np.vstack([m, chi])); return float((d > k(np.reshape(pt, (2, 1)))[0]).mean())
A = np.load(os.path.join(OUT, "results", "partA_area_samples.npz"))["bilby-NRSur7dq4_prod-reweighted"]
imr250 = (A[:, 3], A[:, 4])
with h5py.File(os.path.join(DATA, "zenodo_6513631", "IGWN-GWTC2p1-v2-GW150914_095045_PEDataRelease_mixed_cosmo.h5")) as f:
    x = f["C01:Mixed/posterior_samples"][()]; imr150 = (x["final_mass"], x["final_spin"])
ref = {"GW250114": imr250, "GW150914": imr150}
ISI19 = (68.0, 0.63)
def pub220(t):
    pf = os.path.join(REL, "ringdown_areas", f"220_{t:g}M_final_mass_spin_area.hdf5")
    if not os.path.exists(pf): return None
    with h5py.File(pf) as f: return f["M_f"][()], f["chi_f"][()]
rows = []
for fn in sorted(glob.glob(os.path.join(RD, "*_summary.json"))):
    s = json.load(open(fn)); lab = s["label"]; P = np.load(os.path.join(RD, f"{lab}_posterior.npz")); cfg = s["config"]
    ev = lab.split("_")[0]; m, chi = P["m"], P["chi"]; rm, rc = ref[ev]; pt = (np.median(rm), np.median(rc))
    modes = "+".join(f"{md[2]}{md[3]}{md[4]}" for md in s.get("modes", [[1, -2, 2, 2, 0]]))
    r = dict(label=lab, event=ev, modes=modes, start_Mf=cfg.get("start_offset_Mf", np.nan), t0_geocenter=cfg["t0_geocenter"],
             variation=cfg.get("variation", "baseline"), acf=s.get("acf_source", "data (Fit.compute_acfs)")[:40], f_min=cfg["f_min"],
             n=len(m), m05=q(m)[0], m50=q(m)[1], m95=q(m)[2], chi05=q(chi)[0], chi50=q(chi)[1], chi95=q(chi)[2],
             m16=q(m, [0.16])[0], m84=q(m, [0.84])[0], chi16=q(chi, [0.16])[0], chi84=q(chi, [0.84])[0],
             rhat_m=s["rhat_m"], ess_m=s["ess_bulk_m"], wall_s=s["wall_s"],
             ref_IMR=("NRSur7dq4 (Zenodo 16877102)" if ev == "GW250114" else "GWTC-2.1 C01:Mixed (Zenodo 6513631)"),
             ref_M50=pt[0], ref_chi50=pt[1], ref_M_in_90=bool(q(m)[0] <= pt[0] <= q(m)[2]), ref_chi_in_90=bool(q(chi)[0] <= pt[1] <= q(chi)[2]),
             ref_point_HPD=hpd_level(m, chi, pt))
    if ev == "GW150914" and "221" in modes: r["isi19_point_HPD"] = hpd_level(m, chi, ISI19)
    pb = pub220(r["start_Mf"]) if ev == "GW250114" else None
    if pb is not None:
        r.update(pub_m50=float(np.median(pb[0])), pub_chi50=float(np.median(pb[1])), pub_ref_point_HPD=hpd_level(pb[0], pb[1], pt),
                 dM_vs_pub=float(np.median(m) - np.median(pb[0])))
    rows.append(r)
df = pd.DataFrame(rows).sort_values(["event", "modes", "variation", "start_Mf"]); df.to_csv(os.path.join(OUT, "results", "partB_summary.csv"), index=False)
pd.set_option("display.width", 250)
print(df[["label", "m05", "m50", "m95", "chi05", "chi50", "chi95", "ref_point_HPD", "pub_m50", "dM_vs_pub"]].round(3).to_string(index=False))
# issue-1 gap table: baseline vs PE PSD at 10.5/12/13
g = []
for t, tag in [(10.5, "10p5M"), (12.0, "12M"), (13.0, "13M")]:
    b = df[df.label == f"GW250114_220_{tag}"].iloc[0]; e = df[df.label == f"GW250114_220_{tag}_pePSD"]
    if len(e): e = e.iloc[0]; g.append(dict(start_Mf=t, M50_baseline=b.m50, M50_pePSD=e.m50, M50_published=b.pub_m50,
                                         gap_baseline=b.m50 - b.pub_m50, gap_pePSD=e.m50 - b.pub_m50, fraction_closed=(b.m50 - e.m50) / (b.m50 - b.pub_m50),
                                         chi50_baseline=b.chi50, chi50_pePSD=e.chi50, chi50_published=b.pub_chi50, IMR_HPD_baseline=b.ref_point_HPD, IMR_HPD_pePSD=e.ref_point_HPD))
gdf = pd.DataFrame(g); gdf.to_csv(os.path.join(OUT, "results", "partB_issue1_gap.csv"), index=False); print(gdf.round(3).to_string(index=False))
# published scan
pub = []
for pf in glob.glob(os.path.join(REL, "ringdown_areas", "220_*M_final_mass_spin_area.hdf5")):
    t = float(os.path.basename(pf).split("_")[1][:-1])
    with h5py.File(pf) as f: pm, px = f["M_f"][()], f["chi_f"][()]
    pub.append((t, *q(pm), *q(px)))
pub = np.array(sorted(pub))
# ---- figure
plt.rcParams.update({"font.size": 7, "axes.titlesize": 8, "axes.labelsize": 7, "legend.fontsize": 6, "axes.spines.top": False, "axes.spines.right": False})
fig, axes = plt.subplots(1, 3, figsize=(7.4, 3.1), gridspec_kw=dict(width_ratios=[1, 1.25, 1.25]))
C_OURS, C_PSD, C_PUB, C_IMR = "#1b4f8a", "#5a8f3c", "#c2552b", "0.55"
ax = axes[0]
for lab_, col, nm in [("GW150914_220_dt3ms", C_OURS, "220, +3 ms"), ("GW150914_220221_peak", "#8a5a9e", "220+221, peak")]:
    p = os.path.join(RD, f"{lab_}_posterior.npz")
    if os.path.exists(p):
        P = np.load(p); ax.scatter(P["m"], P["chi"], s=1, alpha=0.06, color=col, rasterized=True); ax.scatter([], [], s=8, color=col, label=nm)
lo, hi = q(imr150[0], [0.05, 0.95]); clo, chi_ = q(imr150[1], [0.05, 0.95])
ax.add_patch(plt.Rectangle((lo, clo), hi - lo, chi_ - clo, fill=False, ec="k", lw=1)); ax.plot([], [], color="k", lw=1, label="GWTC-2.1 IMR 90%")
ax.errorbar(*ISI19, xerr=7, yerr=0.16, fmt="^", ms=3.5, color="k", mfc="w", lw=0.8, label="Isi+2019 220+221 (68%)")
ax.set_xlabel(r"$M_f$ [$M_\odot$, detector frame]"); ax.set_ylabel(r"$\chi_f$"); ax.set_xlim(40, 120); ax.set_ylim(0, 1)
ax.set_title("a  GW150914 calibration", loc="left"); ax.legend(frameon=False, loc="lower right")
base = df[(df.event == "GW250114") & (df.variation == "baseline")].sort_values("start_Mf")
psd = df[(df.event == "GW250114") & (df.variation == "pePSD")].sort_values("start_Mf")
NOHP = "no high-pass (f_min=None)"
nohp = df[(df.event == "GW250114") & (df.variation == NOHP) & (df.modes == "220")].sort_values("start_Mf")
var = df[(df.event == "GW250114") & ~df.variation.isin(["baseline", "pePSD", NOHP])]
for ax, key, lab_, imr in [(axes[1], "m", r"$M_f$ [$M_\odot$, detector frame]", imr250[0]), (axes[2], "chi", r"$\chi_f$", imr250[1])]:
    lo, hi = q(imr, [0.05, 0.95]); ax.axhspan(lo, hi, color=C_IMR, alpha=0.35, lw=0)
    ax.errorbar(base.start_Mf - 0.2, base[f"{key}50"], yerr=[base[f"{key}50"] - base[f"{key}05"], base[f"{key}95"] - base[f"{key}50"]], fmt="o", ms=3.2, color=C_OURS, lw=1, label="this work, data ACF")
    ax.errorbar(psd.start_Mf - 0.4, psd[f"{key}50"], yerr=[psd[f"{key}50"] - psd[f"{key}05"], psd[f"{key}95"] - psd[f"{key}50"]], fmt="s", ms=3.0, color=C_PSD, lw=1, label="this work, PE PSD")
    psd = psd  # PE-PSD points are drawn offset by -0.4 below
    ax.errorbar(nohp.start_Mf + 0.0, nohp[f"{key}50"], yerr=[nohp[f"{key}50"] - nohp[f"{key}05"], nohp[f"{key}95"] - nohp[f"{key}50"]], fmt="v", ms=3.0, color="#8a5a9e", lw=1, label="this work, no 20 Hz high-pass")
    j = 1 if key == "m" else 4
    ax.errorbar(pub[:, 0] + 0.25, pub[:, j + 1], yerr=[pub[:, j + 1] - pub[:, j], pub[:, j + 2] - pub[:, j + 1]], fmt="D", ms=2.6, color=C_PUB, lw=0.8, label="published 220 fits")
    ax.scatter(np.full(len(var), 10.5) - 0.6, var[f"{key}50"], marker="_", s=40, color=C_OURS, lw=1, label="this work, other variations")
    ax.axvline(10.5, color="0.7", lw=0.6, ls=":"); ax.set_xlabel(r"ringdown start after peak [$M_f$]"); ax.set_ylabel(lab_)
axes[1].set_title("b  GW250114 remnant mass vs start", loc="left"); axes[2].set_title("c  GW250114 remnant spin vs start", loc="left")
from matplotlib.patches import Patch
h, l = axes[1].get_legend_handles_labels(); h.append(Patch(color=C_IMR, alpha=0.35)); l.append("IMR 90% (NRSur7dq4)")
axes[1].legend(h, l, frameon=False, loc="lower left")
fig.tight_layout(); fig.savefig(os.path.join(OUT, "figures", "partB_ringdown.png"), dpi=300); fig.savefig(os.path.join(OUT, "figures", "partB_ringdown.pdf"))
