"""Referee check: historical fits started from Horizons' 1780 elements with D = 0 (not from the control
solution, which already sits at D = 43.007 as fit.py line 244 does). Radial form first, then time form."""
import json, math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import fit as F, nbody as N

if __name__ == "__main__":
    cal = json.load(open(N.hz.ROOT / "data" / "calibration.json"))
    cpd = cal["c_per_D"]
    G = F.T_OBS["jd_tt_horizons"]
    tables = N.earth_tables(G)
    p0 = np.concatenate([F.EL0, [0.0]])
    out = {}
    for xk, iters in (("radial", 10), ("time", 8)):
        f = F.gauss_newton(F.T_OBS["jd_tt_obs_em"], F.W, cpd, G, tables, p0, F.offsets_matrix(xk), iters=iters, label=f"from-zero/{xk}")
        s = F.summarize(f, F.W, f"historical from D=0, {xk}")
        out[xk] = {k: s[k] for k in ("D", "sigma_D", "wrms_s", "rms_hist")}
        out[xk]["offsets"] = f["p"][7:].tolist()
        out[xk]["dyn_remainder_D"] = f["dyn_remainder"][6]
        print(xk, json.dumps(out[xk]), flush=True)
    json.dump(out, open(N.hz.ROOT / "out" / "refit_from_zero.json", "w"), indent=1)
