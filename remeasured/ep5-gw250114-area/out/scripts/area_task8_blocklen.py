#!/usr/bin/env python
"""S10 sensitivity of the block-bootstrap s.e. of P(dA>0) to block length, for the cells that set P_min (20 M_f) and the V4 cells.
Writes results/area_task8_blocklen.csv"""
import os, sys, numpy as np, pandas as pd
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from combine_area import area, load_table
from area_task8_checks import LANES, RD
OUT = os.path.abspath(os.path.join(HERE, ".."))
rng = np.random.default_rng(99); rows = []
for lane, path in LANES.items():
    T = load_table(path, "auto", None); Ai = area(np.asarray(T["mass_1"], float), np.asarray(T["a_1"], float)) + area(np.asarray(T["mass_2"], float), np.asarray(T["a_2"], float))
    for lab in ["GW250114_220_20M", "GW250114_220_20M_nohp", "GW250114_220221_13M", "GW250114_220221_18M"]:
        R = np.load(os.path.join(RD, lab + "_posterior.npz")); Af = area(R["m"], R["chi"])
        for B in (100, 250, 500, 1000, 2000):
            blocks = Af.reshape(4, 2000 // B, B).reshape(-1, B); nb = blocks.shape[0]; bs = []
            for _ in range(400):
                f = blocks[rng.integers(0, nb, nb)].ravel(); a = np.sort(Ai[rng.integers(0, len(Ai), len(Ai))])
                bs.append((np.searchsorted(a, f, side="left") / len(Ai)).mean())
            rows.append(dict(premerger=lane, label=lab, block=B, n_blocks=nb, se=float(np.std(bs))))
D = pd.DataFrame(rows); D.to_csv(os.path.join(OUT, "results", "area_task8_blocklen.csv"), index=False, float_format="%.5g")
print(D.pivot_table(index=["premerger", "label"], columns="block", values="se").round(4).to_string())
