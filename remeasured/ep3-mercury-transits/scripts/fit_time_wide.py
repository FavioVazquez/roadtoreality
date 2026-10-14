"""Pre-registered time-offset form, refitted with a +-5600 s contact search so the damped Gauss-Newton can
follow the near-degenerate (l, common offset) valley to its minimum. Start: the radial solution.
Run with EP3_WIDE=1. Writes out/fit_time_wide.json."""
import json, math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import fit as F, nbody as N

if __name__ == "__main__":
    assert os.environ.get("EP3_WIDE")
    R = json.load(open(F.OUT / "fit_results.json"))
    cpd = R["calibration"]["c_per_D"]
    G = F.T_OBS["jd_tt_horizons"]
    tables = N.earth_tables(G)
    p0 = np.array([R["historical_radial"]["params"][n] for n in F.NAMES[:7]])
    X = F.offsets_matrix("time")
    f = F.gauss_newton(F.T_OBS["jd_tt_obs_em"], F.W, cpd, G, tables, p0, X, iters=30, tol=1e-4, label="historical/time/wide")
    s = F.summarize(f, F.W, "historical, time offsets, wide search")
    s["dyn_remainder"] = f["dyn_remainder"]
    dT_shift = (F.T_OBS["jd_tt_obs_hz"] - F.T_OBS["jd_tt_obs_em"]) * 86400
    s["variants"] = F.variants(f, "time", dT_shift)
    s["l_minus_radial_arcsec"] = float((s["params"]["l"] - R["historical_radial"]["params"]["l"]) * 206264.8)
    json.dump(s, open(F.OUT / "fit_time_wide.json", "w"), indent=1)
    np.savez(F.OUT / "fit_time_wide.npz", res=f["res"], J=f["J"], A=f["A"])
    print(json.dumps({k: v for k, v in s.items() if k not in ("corr",)}, indent=1))
