#!/usr/bin/env python
"""Task 5 (STATUS S7, pre-registered): GW150914 area-law calibration. Lane-2 pre-merger posterior (20-132 Hz, XPHM) x our
GW150914 ringdown posteriors (N=1: 220+221 at the peak; N=0: 220 at +3 ms), detector frame. Reuses stats() from area_task4.py.
Writes results/area_task5.csv, results/area_task5.json, figures/area_task5.png"""
import os, sys, json, time, datetime, numpy as np, pandas as pd
from scipy.stats import norm
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from combine_area import area, sha256, G, c, MSUN
from area_task4 import stats
OUT = os.path.abspath(os.path.join(HERE, "..")); RD = os.path.join(OUT, "results", "ringdown")
PRE = os.path.join(OUT, "..", "premerger-lane2", "GW150914_premerger_posterior.csv.gz")
N1 = [("T3_A0_theirs_ds1", "N1-primary: Isi & Farr 2023 config, 16384 Hz"), ("T3_A0_theirs_ds8", "Isi & Farr 2023 config, 2048 Hz"),
      ("T3_A1a_acf_fd", "S5 A1a"), ("T3_A1b_acf_slice128", "S5 A1b"), ("T3_A2_amp_marg", "S5 A2"), ("T3_A3_pol_generic", "S5 A3"),
      ("T3_A4a_digfilt", "S5 A4a"), ("T3_A4b_mmax150", "S5 A4b"), ("T3_A4c_dataV1", "S5 A4c (= our P, 16 kHz)"),
      ("T3_B2_amp_theirs", "S5 B2"), ("T3_B3_pol_theirs", "S5 B3"), ("T3_B4_digfilt_off", "S5 B4"),
      ("GW150914_220221_peak", "our P base, 4 kHz"), ("GW150914_220221_peak_16k", "our P base, 16 kHz"), ("GW150914_220221_peak_dur0p05", "our P base, 0.05 s"),
      ("GW150914_220221_peak_docs", "docs base"), ("GW150914_220221_peak_docs_nohp", "docs base, no high-pass"),
      ("GW150914_220221_peak_docs_nohp_16k", "docs base, no high-pass, 16 kHz"), ("GW150914_220221_peak_docs_nohp_dur0p05", "docs base, no high-pass, 0.05 s")]
N0 = [("GW150914_220_dt3ms", "N0-primary: project settings"), ("GW150914_220_dt3ms_nohp", "project settings, no high-pass")]
def main():
    t0 = time.time(); rng = np.random.default_rng(20150914)
    T = pd.read_csv(PRE)
    m1, m2, x1, x2, z = (T[k].to_numpy(float) for k in ("mass_1", "mass_2", "a_1", "a_2", "redshift"))
    fchk = float(max(np.max(np.abs(m1 / T.mass_1_source - 1 - z)), np.max(np.abs(m2 / T.mass_2_source - 1 - z))))
    assert fchk < 1e-6, fchk
    Ai = area(m1, x1) + area(m2, x2); Ai_src = area(T.mass_1_source.to_numpy(), x1) + area(T.mass_2_source.to_numpy(), x2)
    lane_chk = {"lane_area_initial_km2_vs_ours_src_maxrel": float(np.max(np.abs(T.area_initial_km2 * 1e6 / Ai_src - 1))),
                "lane_area_initial_km2_vs_ours_det_maxrel": float(np.max(np.abs(T.area_initial_km2 * 1e6 / Ai - 1)))}
    prov = {"premerger": {"file": os.path.abspath(PRE), "sha256": sha256(PRE), "n": len(Ai), "frame_check_max_abs": fchk, **lane_chk,
                          "Ai_det_m2_q05_q50_q95": np.quantile(Ai, [.05, .5, .95]).tolist(), "Ai_src_m2_q05_q50_q95": np.quantile(Ai_src, [.05, .5, .95]).tolist(),
                          "m1_det_q50": float(np.median(m1)), "m2_det_q50": float(np.median(m2)), "a1_q50": float(np.median(x1)), "a2_q50": float(np.median(x2)),
                          "note": "bilby ignored --seed (dynesty rstate took precedence): not bit-reproducible"},
            "ringdown": {}, "script_sha256": sha256(__file__), "constants": {"G": G, "c": c, "M_sun_kg": MSUN},
            "run_utc": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    rows = []
    for grp, L in (("N1_220+221_peak", N1), ("N0_220_3ms", N0)):
        for lab, desc in L:
            p = os.path.join(RD, lab + "_posterior.npz"); R = np.load(p); Af = area(R["m"], R["chi"])
            prov["ringdown"][lab] = {"file": p, "sha256": sha256(p)}
            rows.append(dict(group=grp, label=lab, description=desc, primary=desc.startswith(("N1-primary", "N0-primary")),
                             Mf_med=float(np.median(R["m"])), chif_med=float(np.median(R["chi"])), n_ringdown=len(Af), n_premerger=len(Ai),
                             Ai_med_m2=float(np.median(Ai)), **stats(Ai, Af, rng)))
    df = pd.DataFrame(rows); df.to_csv(os.path.join(OUT, "results", "area_task5.csv"), index=False, float_format="%.6g")
    prov["runtime_s"] = time.time() - t0; json.dump(prov, open(os.path.join(OUT, "results", "area_task5.json"), "w"), indent=1)
    pd.set_option("display.width", 230)
    print({k: v for k, v in prov["premerger"].items() if k not in ("file",)})
    print(df[["group", "label", "Mf_med", "chif_med", "frac_med", "frac_q05", "frac_q95", "P", "P_se", "sigma_1sided", "gauss_sigma"]].round(4).to_string(index=False))
    # figure
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(1, 2, figsize=(7.4, 4.2), gridspec_kw={"width_ratios": [1.5, 1]}, sharey=True)
    y = np.arange(len(df))[::-1]
    col = np.where(df.group.str.startswith("N1"), "#1b6ca8", "#d08a1f")
    for k, (yi, r) in enumerate(zip(y, df.itertuples())):
        mk = "D" if r.primary else "o"
        ax[0].errorbar(r.frac_med, yi, xerr=[[r.frac_med - r.frac_q05], [r.frac_q95 - r.frac_med]], fmt=mk, ms=4 if r.primary else 3, color=col[k], lw=1, capsize=1.5)
        ax[1].plot(r.P, yi, mk, ms=4 if r.primary else 3, color=col[k])
        ax[1].errorbar(r.P, yi, xerr=2 * r.P_se, fmt="none", color=col[k], lw=0.8)
    ax[0].axvline(0, color="0.4", lw=0.8); ax[0].set_xlabel(r"$\Delta A/A_0$ (median, 90%)")
    ax[0].set_yticks(y); ax[0].set_yticklabels([f"{d}" for d in df.description], fontsize=6.5)
    for pth in (0.90,): ax[1].axvline(pth, color="0.5", lw=0.8, ls=":")
    ax[1].set_xlabel(r"$P(\Delta A>0)$  ($\pm 2$ s.e.)"); ax[1].set_xlim(min(0.85, df.P.min() - 0.02), 1.0)
    ax[0].set_title("GW150914: lane-2 pre-merger (20–132 Hz) × our ringdown fits", fontsize=8, loc="left")
    fig.tight_layout(rect=(0, 0.04, 1, 1))
    fig.text(0.01, 0.01, "blue: 220+221 at the peak (N = 1);  orange: 220 only at +3 ms (N = 0);  diamonds: pre-registered primary runs", fontsize=6.5)
    fig.savefig(os.path.join(OUT, "figures", "area_task5.png"), dpi=300)
    return df
if __name__ == "__main__":
    main()
