import sys, os, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import fit as F, nbody as N
from concurrent.futures import ProcessPoolExecutor
if __name__ == "__main__":
    cpd = 4.077502208922737e-13
    tables = N.earth_tables(F.T_OBS["jd_tt_horizons"])
    p0 = np.concatenate([F.EL0, [0.0]])
    fc = F.gauss_newton(F.T_OBS["jd_tt_horizons"], F.W, cpd, F.T_OBS["jd_tt_horizons"], tables, p0, label="ctl")
    np.save("data/p_control.npy", fc["p"])
    t_obs = F.T_OBS["jd_tt_obs_em"]
    X = np.zeros((58, 3))
    for i, k in enumerate(F.KINDS): X[i, F.TYPES.index(k)] = 1
    A = np.hstack([fc["J"], X]); sw = np.sqrt(F.W)
    r = (t_obs - fc["base"]) * 86400
    sol, *_ = np.linalg.lstsq(A * sw[:, None], r * sw, rcond=None)
    print("linear step from control solution:", np.round(sol, 9))
    res = r - A @ sol
    print("predicted wrms", np.sqrt(np.sum(F.W * res**2) / F.W.sum()))
    p1 = fc["p"][:7] + sol[:7]
    with ProcessPoolExecutor(max_workers=6, initializer=F._init, initargs=(F.STATES, F.KINDS, F.T_OBS["jd_tt_horizons"], tables, cpd)) as ex:
        b1 = list(ex.map(F._model, [p1]))[0]
    r1 = (t_obs - b1) * 86400 - X @ sol[7:]
    print("actual wrms at p1", np.sqrt(np.nansum(F.W * r1**2) / F.W.sum()))
    lin = res
    for y, k, a, b in zip(F.YEAR, F.KINDS, lin, r1):
        if not np.isfinite(b) or abs(a - b) > 1: print("  nonlinear:", y, k, round(a, 2), b)
