#!/usr/bin/env python
"""Part A: horizon-area change from public GW250114 IMR posterior samples.
Inputs : data/zenodo_16877102/posterior_samples_*.h5 (Zenodo 10.5281/zenodo.16877102, CC BY 4.0)
Method : Kerr area A = 8 pi (G M/c^2)^2 (1 + sqrt(1 - chi^2)), source-frame masses (SI).
         A_i = A(m1,a1) + A(m2,a2) with spins at f_ref (=20 Hz, from file meta_data);
         A_f = A(M_f, chi_f) from the remnant columns (NRSur7dq4Remnant / model-specific fits).
Output : out/results/partA_area_summary.csv, out/results/partA_area_samples.npz, provenance json.
"""
import h5py, numpy as np, glob, os, json, hashlib, sys, platform, time
G = 6.67430e-11; c = 299792458.0; MSUN = 1.98840987e30   # CODATA 2018 / IAU 2015 nominal (GM_sun/G)
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.abspath(os.path.join(HERE, ".."))
DATA = os.path.abspath(os.path.join(OUT, "..", "data", "zenodo_16877102"))
os.makedirs(os.path.join(OUT, "results"), exist_ok=True)
def area(M_kg, chi):  # m^2
    rg = G * M_kg / c**2
    return 8*np.pi*rg**2*(1+np.sqrt(1-chi**2))
def sha256(p):
    h = hashlib.sha256(); h.update(open(p, "rb").read()); return h.hexdigest()
t0 = time.time(); rows = []; samples = {}; prov = {"inputs": {}, "python": sys.version, "numpy": np.__version__, "h5py": h5py.__version__,
        "constants": {"G": G, "c": c, "M_sun_kg": MSUN}}
for fn in sorted(glob.glob(os.path.join(DATA, "posterior_samples_*.h5"))):
    prov["inputs"][os.path.basename(fn)] = sha256(fn)
    f = h5py.File(fn, "r")
    for lab in [k for k in f.keys() if k not in ("history", "version")]:
        g = f[lab]; ps = g["posterior_samples"][()]
        md = g["meta_data"]
        mdi = md["meta_data"] if "meta_data" in md else md
        fits = " | ".join(x.decode() for x in mdi["final_mass_NR_fits"][()]) if "final_mass_NR_fits" in mdi else "not recorded"
        fref = float(mdi["f_ref"][()][0]) if "f_ref" in mdi else float(g["config_file"]["config"]["reference-frequency"][()][0])
        m1, m2 = ps["mass_1_source"]*MSUN, ps["mass_2_source"]*MSUN
        a1, a2 = ps["a_1"], ps["a_2"]
        Mf, chif = ps["final_mass_source"]*MSUN, ps["final_spin"]
        Ai = area(m1, a1) + area(m2, a2); Af = area(Mf, chif); r = (Af-Ai)/Ai
        # frame check: ratio must be frame-independent (detector-frame masses)
        r_det = (area(ps["final_mass"]*MSUN, chif) - area(ps["mass_1"]*MSUN, a1) - area(ps["mass_2"]*MSUN, a2)) / (area(ps["mass_1"]*MSUN, a1)+area(ps["mass_2"]*MSUN, a2))
        assert np.allclose(r, r_det, rtol=1e-6, atol=1e-9), "frame inconsistency"
        q = lambda x, p: float(np.quantile(x, p))
        n = len(r); kpos = int((r > 0).sum())
        # binomial (Jeffreys) 90% interval on P(dA>0) from finite sample count
        from scipy.stats import beta
        lo, hi = beta.ppf([0.05, 0.95], kpos+0.5, n-kpos+0.5)
        rows.append(dict(model=lab, file=os.path.basename(fn), n_samples=n, remnant_fit=fits, f_ref_Hz=fref,
            Ai_med_m2=q(Ai,.5), Ai_lo_m2=q(Ai,.05), Ai_hi_m2=q(Ai,.95),
            Af_med_m2=q(Af,.5), Af_lo_m2=q(Af,.05), Af_hi_m2=q(Af,.95),
            frac_med=q(r,.5), frac_lo5=q(r,.05), frac_hi95=q(r,.95), frac_min=float(r.min()), frac_mean=float(r.mean()), frac_std=float(r.std()),
            n_positive=kpos, P_positive=kpos/n, P_pos_90lo=float(lo), P_pos_90hi=float(hi),
            Mf_src_med=q(ps["final_mass_source"],.5), Mf_src_lo=q(ps["final_mass_source"],.05), Mf_src_hi=q(ps["final_mass_source"],.95),
            Mf_det_med=q(ps["final_mass"],.5), Mf_det_lo=q(ps["final_mass"],.05), Mf_det_hi=q(ps["final_mass"],.95),
            chif_med=q(chif,.5), chif_lo=q(chif,.05), chif_hi=q(chif,.95)))
        samples[lab] = np.vstack([Ai, Af, r, ps["final_mass"], chif]).T
        print(f"{lab:50s} n={n} dA/A med={q(r,.5):.4f} 90%=[{q(r,.05):.4f},{q(r,.95):.4f}] min={r.min():.4f} P>0={kpos}/{n}", flush=True)
import pandas as pd
pd.DataFrame(rows).to_csv(os.path.join(OUT, "results", "partA_area_summary.csv"), index=False)
np.savez_compressed(os.path.join(OUT, "results", "partA_area_samples.npz"), **{k: v for k, v in samples.items()},
                    columns=np.array(["A_i_m2", "A_f_m2", "frac_dA", "final_mass_det_Msun", "final_spin"]))
prov["runtime_s"] = time.time()-t0; prov["script_sha256"] = sha256(__file__); prov["platform"] = platform.platform()
json.dump(prov, open(os.path.join(OUT, "results", "partA_provenance.json"), "w"), indent=1)
