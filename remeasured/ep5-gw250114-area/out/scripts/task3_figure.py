#!/usr/bin/env python
"""Figure for Task 3: M_f (detector frame) median and 16-84% interval for every run in results/task3_isifarr_ladder.csv."""
import os, pandas as pd, numpy as np
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
OUT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
T = pd.read_csv(os.path.join(OUT, "results", "task3_isifarr_ladder.csv"), index_col=0)
rows = [("IsiFarr2023_published_sr16384", "Isi & Farr 2023, published, 16384 Hz (cited)", "ref"),
        ("T3_A0_theirs_ds1", "A0  their config, 16384 Hz (our rerun)", "A0"),
        ("IsiFarr2023_published_sr2048", "Isi & Farr 2023, published, 2048 Hz (cited)", "ref"),
        ("T3_A0_theirs_ds8", "A0  their config, 2048 Hz (our rerun)", "A0"),
        ("T3_A1a_acf_fd", "A1a  + ACF method td → Welch", "A"),
        ("T3_A1b_acf_slice128", "A1b  + ACF data: full file → ±128 s", "A"),
        ("T3_A2_amp_marg", "A2  + amplitude prior → marginalised", "A"),
        ("T3_A3_pol_generic", "A3  + polarization → generic", "A"),
        ("T3_A4a_digfilt", "A4a  + decimation: scipy → FFT cut", "A"),
        ("T3_A4b_mmax150", "A4b  + m_max 140 → 150", "A"),
        ("T3_A4c_dataV1", "A4c  + data R1 → V1  (= our run)", "A"),
        ("T3_B1_acf_theirs", "B1  ours + their ACF only (INVALID: NaN in L1 V1 file)", "Bx"),
        ("T3_B2_amp_theirs", "B2  ours + their amplitude prior only", "B"),
        ("T3_B3_pol_theirs", "B3  ours + their polarization only", "B"),
        ("T3_B4_digfilt_off", "B4  ours + their decimation filter only", "B")]
col = {"ref": "0.15", "A0": "#1b6ca8", "A": "#1b6ca8", "B": "#c0504d", "Bx": "0.65"}
fig, ax = plt.subplots(figsize=(7.6, 5.8))
y = np.arange(len(rows))[::-1]
for yi, (lab, txt, k) in zip(y, rows):
    r = T.loc[lab]
    mk = "s" if k == "ref" else ("x" if k == "Bx" else "o")
    ax.errorbar(r.m50, yi, xerr=[[r.m50 - r.m16], [r.m84 - r.m50]], fmt=mk, color=col[k], ms=5, capsize=2, lw=1.2,
                mfc="white" if k == "ref" else col[k])
    if lab.startswith("T3_A") and lab not in ("T3_A0_theirs_ds8", "T3_A0_theirs_ds1") or lab.startswith("T3_B2") or lab.startswith("T3_B3") or lab.startswith("T3_B4"):
        ax.text(93.5, yi, f"{r.d_m50_vs_prev_or_base:+.1f}", va="center", ha="right", fontsize=8, color=col[k])
ax.text(93.5, y[0] + 0.75, "Δ median", ha="right", va="center", fontsize=8)
ax.set_ylim(y[-1] - 0.6, y[0] + 1.2)
ax.axvline(T.loc["IsiFarr2023_published_sr2048", "m50"], color="0.5", ls=":", lw=0.8)
ax.axvline(T.loc["T3_A4c_dataV1", "m50"], color="#1b6ca8", ls=":", lw=0.8)
for yb in (y[3] - 0.5, y[10] - 0.5): ax.axhline(yb, color="0.85", lw=0.8)
ax.set_yticks(y); ax.set_yticklabels([t for _, t, _ in rows], fontsize=8)
ax.set_xlim(45, 94); ax.set_xlabel(r"remnant mass $M_f$ (detector frame) [$M_\odot$]; median, 16–84%")
ax.set_title("GW150914 220+221 at the peak: Isi & Farr 2023 settings → ours", fontsize=9, loc="right")
fig.tight_layout()
fig.savefig(os.path.join(OUT, "figures", "task3_ladder.png"), dpi=200)
print("saved")
