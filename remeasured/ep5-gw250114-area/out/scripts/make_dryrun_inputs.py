#!/usr/bin/env python
"""Dry-run inputs for combine_area.py, built from the public NRSur7dq4 IMR posterior (Part A input; NOT inspiral-only):
 results/dryrun/premerger_IMR_detector.npz  (m1, m2 detector frame; chi1, chi2)
 results/dryrun/premerger_IMR_source.npz    (m1, m2 source frame; chi1, chi2; z)
 results/dryrun/IMRremnant_posterior.npz    (m = final_mass detector frame, chi = final_spin) as a stand-in 'ringdown' run"""
import os, h5py, numpy as np, json
OUT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
f = h5py.File(os.path.join(OUT, "..", "data", "zenodo_16877102", "posterior_samples_NRSur7dq4.h5"))
ps = f["bilby-NRSur7dq4_prod-reweighted/posterior_samples"][()]
d = os.path.join(OUT, "results", "dryrun")
np.savez(os.path.join(d, "premerger_IMR_detector.npz"), m1=ps["mass_1"], m2=ps["mass_2"], chi1=ps["a_1"], chi2=ps["a_2"])
np.savez(os.path.join(d, "premerger_IMR_source.npz"), m1=ps["mass_1_source"], m2=ps["mass_2_source"], chi1=ps["a_1"], chi2=ps["a_2"], z=ps["redshift"])
np.savez(os.path.join(d, "IMRremnant_posterior.npz"), m=ps["final_mass"], chi=ps["final_spin"])
json.dump({"label": "IMRremnant", "config": {"variation": "baseline", "start_offset_Mf": 0.0}}, open(os.path.join(d, "IMRremnant_summary.json"), "w"))
