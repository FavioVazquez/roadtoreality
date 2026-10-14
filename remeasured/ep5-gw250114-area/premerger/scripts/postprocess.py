#!/usr/bin/env python
"""Summarise pre-merger runs: Kerr horizon areas, quantile CSV, corner plots, downsampled samples.

Only progenitor quantities are kept; no remnant quantity is computed or written.
"""
import argparse
import glob
import json
import os

import numpy as np
import pandas as pd
import corner
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

G = 6.67430e-11
C = 299792458.0
MSUN = 1.988409870698051e30  # IAU 2015 nominal G*Msun / G (CODATA 2018 G)
RG_KM = G * MSUN / C**2 / 1e3  # G Msun / c^2 in km

KEEP = ["mass_1_source", "mass_2_source", "a_1", "a_2", "area_1_km2", "area_2_km2", "area_initial_km2",
        "area_1_det_km2", "area_2_det_km2", "area_initial_det_km2",
        "mass_1", "mass_2", "chirp_mass", "chirp_mass_source", "mass_ratio", "total_mass_source",
        "tilt_1", "tilt_2", "chi_eff", "chi_p", "luminosity_distance", "redshift",
        "theta_jn", "ra", "dec", "psi", "phase", "geocent_time", "log_likelihood"]
QCOLS = ["mass_1_source", "mass_2_source", "a_1", "a_2", "area_1_km2", "area_2_km2", "area_initial_km2",
         "area_1_det_km2", "area_2_det_km2", "area_initial_det_km2",
         "mass_1", "mass_2", "chirp_mass", "chirp_mass_source", "mass_ratio", "chi_eff",
         "luminosity_distance", "redshift"]


def kerr_area_km2(m_msun, chi):
    """A = 8 pi (G M / c^2)^2 (1 + sqrt(1 - chi^2)), in km^2."""
    return 8 * np.pi * (m_msun * RG_KM) ** 2 * (1 + np.sqrt(1 - chi**2))


def summarise(result_file, event, max_samples, seed=0):
    import bilby
    res = bilby.gw.result.CBCResult.from_json(result_file) if result_file.endswith(".json") \
        else bilby.gw.result.CBCResult.from_hdf5(result_file)
    post = res.posterior.copy()
    post["area_1_km2"] = kerr_area_km2(post["mass_1_source"], post["a_1"])
    post["area_2_km2"] = kerr_area_km2(post["mass_2_source"], post["a_2"])
    post["area_initial_km2"] = post["area_1_km2"] + post["area_2_km2"]
    # detector-frame (redshifted) masses give the area as measured at the detector, (1+z)^2 larger
    post["area_1_det_km2"] = kerr_area_km2(post["mass_1"], post["a_1"])
    post["area_2_det_km2"] = kerr_area_km2(post["mass_2"], post["a_2"])
    post["area_initial_det_km2"] = post["area_1_det_km2"] + post["area_2_det_km2"]
    rows = []
    for c in QCOLS:
        q = np.quantile(post[c], [0.05, 0.5, 0.95])
        rows.append(dict(event=event, parameter=c, q05=q[0], median=q[1], q95=q[2],
                         minus=q[1] - q[0], plus=q[2] - q[1]))
    post = post[[c for c in KEEP if c in post]]
    n_full = len(post)
    if n_full > max_samples:
        post = post.sample(max_samples, random_state=seed)
    return res, post, pd.DataFrame(rows), n_full


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--run", action="append", required=True, help="EVENT=path/to/result.json")
    p.add_argument("--max-samples", type=int, default=50000)
    a = p.parse_args()
    tables = []
    os.makedirs(os.path.join(ROOT, "figures"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "samples"), exist_ok=True)
    for item in a.run:
        event, path = item.split("=", 1)
        res, post, tab, n_full = summarise(path, event, a.max_samples)
        tab["n_posterior_samples"] = n_full
        tables.append(tab)
        out = os.path.join(ROOT, "samples", f"{event}_premerger_posterior.csv.gz")
        post.to_csv(out, index=False, float_format="%.8g", compression="gzip")
        print(event, "samples", len(post), "of", n_full, "->", out, os.path.getsize(out) / 1e6, "MB")
        labels = [r"$m_1^{\rm src}\,[M_\odot]$", r"$m_2^{\rm src}\,[M_\odot]$", r"$\chi_1$", r"$\chi_2$",
                  r"$A_i\,[10^4\,{\rm km}^2]$"]
        data = np.column_stack([post["mass_1_source"], post["mass_2_source"], post["a_1"], post["a_2"],
                                post["area_initial_km2"] / 1e4])
        fig = corner.corner(data, labels=labels, quantiles=[0.05, 0.5, 0.95], show_titles=True,
                            title_fmt=".2f", bins=40, smooth=0.9, levels=(0.5, 0.9),
                            plot_datapoints=False, fill_contours=True)
        fig.suptitle(f"{event}: pre-merger (inspiral-only) posterior", y=1.02)
        for ext in ("png", "pdf"):
            fig.savefig(os.path.join(ROOT, "figures", f"{event}_premerger_corner.{ext}"),
                        bbox_inches="tight", dpi=130)
        plt.close(fig)
        extra = ["chirp_mass", "mass_ratio", "chi_eff", "luminosity_distance", "theta_jn"]
        fig = corner.corner(post[extra].values, labels=[r"$\mathcal{M}^{\rm det}$", "q", r"$\chi_{\rm eff}$",
                            r"$d_L$ [Mpc]", r"$\theta_{JN}$"], quantiles=[0.05, 0.5, 0.95], show_titles=True,
                            bins=40, smooth=0.9, levels=(0.5, 0.9), plot_datapoints=False, fill_contours=True)
        fig.savefig(os.path.join(ROOT, "figures", f"{event}_premerger_corner_extrinsic.png"),
                    bbox_inches="tight", dpi=110)
        plt.close(fig)
    table = pd.concat(tables)
    table.to_csv(os.path.join(ROOT, "premerger_posterior_quantiles.csv"), index=False, float_format="%.6g")
    print(table.to_string())


if __name__ == "__main__":
    main()
