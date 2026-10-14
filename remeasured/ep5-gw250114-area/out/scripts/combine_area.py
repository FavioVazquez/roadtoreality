#!/usr/bin/env python
"""Combine an independent pre-merger (inspiral-only) posterior for the initial black holes with our ringdown
posteriors for the remnant, per ringdown start time, and report the horizon-area change.

  A(M, chi) = 8 pi (G M / c^2)^2 (1 + sqrt(1 - chi^2))     [m^2, SI]
  A_i = A(m1, chi1) + A(m2, chi2)   (pre-merger samples)     A_f = A(M_f, chi_f)   (ringdown samples)

Frames: ringdown M_f is DETECTOR frame. Pre-merger masses must be declared with --frame detector|source.
If source frame, a redshift column is required and A_i is converted to the detector frame per sample (A scales as (1+z)^2).
The two posteriors come from disjoint data and are treated as independent:
  P(A_f > A_i) = mean_j ECDF_{A_i}(A_f,j)        (exact for the empirical distributions; bootstrap s.e. reported)
  dA/A = (A_f - A_i)/A_i from N random independent pairs.
  If every A_f sample exceeds every A_i sample, P is reported as 1 with saturated=True (tail not resolved);
  gauss_sigma = (mean A_f - mean A_i)/sqrt(var A_f + var A_i) is given as a Gaussian-approximation significance.
No prior reweighting is applied: each posterior keeps its own analysis priors (state this when quoting results).

Usage:
  combine_area.py --premerger FILE [--format auto|npz|csv|hdf5|bilby]  (bilby = bilby result .json; auto picks it for .json) [--hdf5-path GROUP/DATASET] --frame detector|source
                  [--cols m1,m2,chi1,chi2[,z]] --ringdown-glob 'results/ringdown/GW250114_220_*M_posterior.npz'
                  [--variation baseline] --out-prefix results/area_combo_<tag> [--npairs 1000000] [--seed 1]
Outputs: <prefix>.csv (one row per ringdown run), <prefix>.json (provenance incl. sha256 of all inputs), <prefix>.png
"""
import argparse, glob, hashlib, json, os, sys, time, datetime
import numpy as np, pandas as pd
from scipy.stats import norm
G = 6.67430e-11; c = 299792458.0; MSUN = 1.98840987e30
def area(M_msun, chi):
    rg = G * np.asarray(M_msun) * MSUN / c**2
    return 8 * np.pi * rg**2 * (1 + np.sqrt(1 - np.asarray(chi)**2))
def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for ch in iter(lambda: f.read(1 << 20), b""): h.update(ch)
    return h.hexdigest()
def load_table(path, fmt, h5path):
    fmt = fmt if fmt != "auto" else os.path.splitext(path[:-3] if path.endswith(".gz") else path)[1].lstrip(".").lower()   # .csv.gz -> csv (pandas decompresses)
    if fmt == "npz":
        z = np.load(path); return {k: z[k] for k in z.files}
    if fmt in ("csv", "dat", "txt"):
        return {k: v.values for k, v in pd.read_csv(path, sep=None, engine="python").items()}
    if fmt in ("json", "bilby"):
        R = json.load(open(path)); post = R["posterior"]; post = post.get("content", post)   # bilby result: posterior -> content
        return {k: np.asarray(v) for k, v in post.items() if isinstance(v, list) and len(v) and isinstance(v[0], (int, float))}
    if fmt in ("h5", "hdf5"):
        import h5py
        with h5py.File(path) as f:
            d = f[h5path][()] if h5path else None
            if d is None: raise SystemExit("--hdf5-path required for hdf5 input")
            return {k: d[k] for k in d.dtype.names}
    raise SystemExit(f"unknown format {fmt}")
def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--premerger", required=True); ap.add_argument("--format", default="auto"); ap.add_argument("--hdf5-path", default=None)
    ap.add_argument("--frame", required=True, choices=["detector", "source"])
    ap.add_argument("--cols", default="m1,m2,chi1,chi2,z", help="column names for m1,m2,chi1,chi2[,z]")
    ap.add_argument("--ringdown-glob", required=True); ap.add_argument("--variation", default="baseline")
    ap.add_argument("--out-prefix", required=True); ap.add_argument("--npairs", type=int, default=1_000_000); ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--label", default="")
    a = ap.parse_args(argv); t0 = time.time(); rng = np.random.default_rng(a.seed)
    T = load_table(a.premerger, a.format, a.hdf5_path); cols = a.cols.split(",")
    m1, m2, x1, x2 = (np.asarray(T[k], float) for k in cols[:4])
    assert np.all((x1 >= 0) & (x1 < 1) & (x2 >= 0) & (x2 < 1)), "spins must be dimensionless magnitudes in [0,1)"
    Ai = area(m1, x1) + area(m2, x2)
    if a.frame == "source":
        if len(cols) < 5 or cols[4] not in T: raise SystemExit("source-frame masses need a redshift column (5th entry of --cols)")
        Ai = Ai * (1 + np.asarray(T[cols[4]], float))**2      # to detector frame, per sample
    Ai_sorted = np.sort(Ai)
    rows = []; prov = {"premerger": {"file": os.path.abspath(a.premerger), "sha256": sha256(a.premerger), "frame": a.frame, "cols": cols, "n": int(len(Ai))},
                       "ringdown": {}, "args": vars(a), "constants": {"G": G, "c": c, "M_sun_kg": MSUN},
                       "script_sha256": sha256(__file__), "run_utc": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    for p in sorted(glob.glob(a.ringdown_glob)):
        lab = os.path.basename(p).replace("_posterior.npz", ""); sp = p.replace("_posterior.npz", "_summary.json")
        S = json.load(open(sp)) if os.path.exists(sp) else {"config": {}}
        var = S["config"].get("variation", "baseline")
        if a.variation != "all" and var != a.variation: continue
        R = np.load(p); Af = area(R["m"], R["chi"])
        cdf = np.searchsorted(Ai_sorted, Af, side="left") / len(Ai_sorted)    # P(A_i < A_f,j)
        P = float(cdf.mean())
        boot = [float(cdf[rng.integers(0, len(cdf), len(cdf))].mean()) for _ in range(200)]
        i = rng.integers(0, len(Ai), a.npairs); j = rng.integers(0, len(Af), a.npairs)
        frac = (Af[j] - Ai[i]) / Ai[i]
        qf = np.quantile(frac, [0.05, 0.5, 0.95])
        rows.append(dict(label=lab, start_Mf=S["config"].get("start_offset_Mf", np.nan), variation=var, n_ringdown=len(Af), n_premerger=len(Ai),
                         Ai_med_m2=float(np.median(Ai)), Af_med_m2=float(np.median(Af)),
                         frac_med=qf[1], frac_q05=qf[0], frac_q95=qf[2], P_Af_gt_Ai=P, P_se_boot=float(np.std(boot)),
                         sigma_equiv_one_sided=float(norm.ppf(P)) if 0 < P < 1 else (np.inf if P == 1 else -np.inf),
                         saturated=bool(Af.min() > Ai.max()),   # every A_f sample exceeds every A_i sample: tail unresolved by sampling
                         gauss_sigma=float((Af.mean() - Ai.mean()) / np.sqrt(Af.var() + Ai.var()))))   # (mean A_f - mean A_i)/sqrt(var sum), cf. arXiv:2509.08099
        prov["ringdown"][lab] = {"file": os.path.abspath(p), "sha256": sha256(p)}
    if not rows: raise SystemExit("no ringdown posteriors matched")
    df = pd.DataFrame(rows).sort_values("start_Mf"); df.to_csv(a.out_prefix + ".csv", index=False)
    prov["runtime_s"] = time.time() - t0; json.dump(prov, open(a.out_prefix + ".json", "w"), indent=1)
    pd.set_option("display.width", 200)
    print(df[["label", "start_Mf", "frac_med", "frac_q05", "frac_q95", "P_Af_gt_Ai", "P_se_boot", "sigma_equiv_one_sided", "saturated", "gauss_sigma"]].round(4).to_string(index=False))
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    plt.rcParams.update({"font.size": 7, "axes.titlesize": 8, "axes.spines.top": False, "axes.spines.right": False})
    fig, ax = plt.subplots(1, 2, figsize=(6.4, 2.4))
    ax[0].errorbar(df.start_Mf, df.frac_med, yerr=[df.frac_med - df.frac_q05, df.frac_q95 - df.frac_med], fmt="o", ms=3.5, color="#1b4f8a", lw=1)
    ax[0].axhline(0, color="0.4", lw=0.8); ax[0].set_xlabel(r"ringdown start after peak [$M_f$]"); ax[0].set_ylabel(r"$(A_f-A_i)/A_i$  (median, 90%)")
    ax[0].set_title(a.label or "area change per start time", loc="left")
    ax[1].plot(df.start_Mf, df.P_Af_gt_Ai, "o-", ms=3.5, color="#1b4f8a", lw=1); ax[1].set_ylim(min(0.5, df.P_Af_gt_Ai.min() - 0.02), 1.005)
    ax[1].set_xlabel(r"ringdown start after peak [$M_f$]"); ax[1].set_ylabel(r"$P(A_f > A_i)$"); ax[1].set_title("probability of area increase", loc="left")
    fig.tight_layout(); fig.savefig(a.out_prefix + ".png", dpi=300)
    return df
if __name__ == "__main__":
    main()
