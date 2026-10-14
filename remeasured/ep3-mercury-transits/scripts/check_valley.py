"""Two post-fit checks: (1) is the time-offset solution in a flat valley? Weighted rms of the time-offset
form at the time solution vs at the radial solution's dynamical parameters (offsets re-solved linearly).
(2) Jacobian step-halving change per column at the radial and time solutions. Writes out/check_valley.json."""
import json, os, sys
import numpy as np
from concurrent.futures import ProcessPoolExecutor
sys.path.insert(0, os.path.dirname(__file__))
import fit as F, nbody as N

if __name__ == "__main__":
    R = json.load(open(F.OUT / "fit_results.json"))
    cpd = R["calibration"]["c_per_D"]
    G = F.T_OBS["jd_tt_horizons"]
    tables = N.earth_tables(G)
    t_obs = F.T_OBS["jd_tt_obs_em"]
    names = F.NAMES[:7]
    P = {k: np.array([R[f"historical_{k}"]["params"][n] for n in names]) for k in ("time", "radial")}
    cols = []
    for k in ("time", "radial"):
        p = P[k]
        cols += [p] + [p + np.eye(7)[j] * F.STEPS[j] for j in range(7)] + [p + np.eye(7)[j] * F.STEPS[j] / 2 for j in range(7)]
    with ProcessPoolExecutor(max_workers=6, initializer=F._init, initargs=(F.STATES, F.KINDS, G, tables, cpd)) as ex:
        outs = list(ex.map(F._model, cols))
    out = {}
    Xt = F.offsets_matrix("time")
    for i, k in enumerate(("time", "radial")):
        o = outs[15 * i:15 * (i + 1)]
        base = o[0]
        out[f"time_form_wrms_at_{k}_solution_s"] = F._project((t_obs - base) * 86400, Xt, F.W)
        J = np.column_stack([(x - base) * 86400 / F.STEPS[j] for j, x in enumerate(o[1:8])])
        Jh = np.column_stack([(x - base) * 86400 / (F.STEPS[j] / 2) for j, x in enumerate(o[8:15])])
        out[f"jac_halving_{k}"] = {n: float(np.linalg.norm(J[:, j] - Jh[:, j]) / np.linalg.norm(J[:, j])) for j, n in enumerate(names)}
    out["l_difference_arcsec"] = float((P["time"][5] - P["radial"][5]) * 206264.8)
    json.dump(out, open(F.OUT / "check_valley.json", "w"), indent=1)
    print(json.dumps(out, indent=1))
