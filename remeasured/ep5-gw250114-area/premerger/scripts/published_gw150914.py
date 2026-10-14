#!/usr/bin/env python
"""Cited comparison numbers for GW150914 from the GWTC-1 PE release (LIGO-P1800370, full IMR signal,
Overall_posterior = equal mix of IMRPhenomPv2 and SEOBNRv3). Source frame via Planck15 (as GWTC-1).
Writes results/gw150914_gwtc1_cited_quantiles.csv. These are CITED inputs, not measured here."""
import os

import h5py
import numpy as np
import pandas as pd
from astropy import units as u
from astropy.cosmology import Planck15, z_at_value

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = h5py.File(os.path.join(ROOT, "data", "reference", "GW150914_GWTC-1.hdf5"), "r")["Overall_posterior"][()]
dl = p["luminosity_distance_Mpc"]
zgrid = np.linspace(1e-4, 0.5, 4000)
z = np.interp(dl, Planck15.luminosity_distance(zgrid).to(u.Mpc).value, zgrid)
m1d, m2d = p["m1_detector_frame_Msun"], p["m2_detector_frame_Msun"]
cols = {"mass_1": m1d, "mass_2": m2d, "chirp_mass": (m1d * m2d) ** 0.6 / (m1d + m2d) ** 0.2,
        "mass_1_source": m1d / (1 + z), "mass_2_source": m2d / (1 + z),
        "chirp_mass_source": (m1d * m2d) ** 0.6 / (m1d + m2d) ** 0.2 / (1 + z),
        "a_1": p["spin1"], "a_2": p["spin2"]}
rows = []
for k, v in cols.items():
    q = np.quantile(v, [0.05, 0.5, 0.95])
    rows.append(dict(event="GW150914", source="cited: GWTC-1 PE release P1800370 (full IMR)", parameter=k,
                     q05=q[0], median=q[1], q95=q[2], minus=q[1] - q[0], plus=q[2] - q[1]))
df = pd.DataFrame(rows)
os.makedirs(os.path.join(ROOT, "results"), exist_ok=True)
df.to_csv(os.path.join(ROOT, "results", "gw150914_gwtc1_cited_quantiles.csv"), index=False, float_format="%.4g")
print(df[["parameter", "median", "minus", "plus"]].to_string(index=False))
