"""Fit the Newtonian model to the 58 contacts (historical and control) with an extra-perihelion parameter.

Parameters p = [a (AU), e, inc, Omega, pomega, l (rad; heliocentric osculating, ecliptic J2000, epoch
1780-01-01 TDB), D (arcsec per Julian century, extra uniform advance of Mercury's perihelion), and
three time offsets (s) for contact types II, III, IV].
Residual r_i = t_obs_i - t_model_i(p) - offset_type(i), in seconds; weights w_i (Newcomb's) unless stated.
Run: python -I scripts/fit.py  -> out/fit_results.json, out/fit_arrays.npz
"""
import csv
import json
import math
import os
import sys
import time
from concurrent.futures import ProcessPoolExecutor

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import nbody as N

OUT = N.hz.ROOT / "out"
TYPES = ["II", "III", "IV"]
NAMES = ["a", "e", "inc", "Omega", "pomega", "l", "D", "off_II", "off_III", "off_IV"]
STEPS = np.array([0.387e-9, 1e-8, 1e-8, 1e-8, 1e-8, 1e-8, 1.0])  # finite-difference steps (D in "/cy)

rows = list(csv.DictReader(open(OUT / "measure_input.csv")))
KINDS = [r["contact"] for r in rows]
W = np.array([float(r["weight"]) for r in rows])
YEAR = np.array([int(r["transit"]) for r in rows])
MONTH = np.array([r["month"] for r in rows])
T_OBS = {k: np.array([float(r[k]) for r in rows]) for k in ("jd_tt_obs_em", "jd_tt_obs_hz", "jd_tt_horizons")}
_KS = list(csv.DictReader(open(OUT / "residuals_summary.csv")))
VRAD = np.array([float(r["v_radial"]) for r in _KS])  # arcsec/min, Horizons, same row order
STATES = N.horizons_states()
EL0 = N.mercury_elements(STATES)
_CTX = {}


def _init(states, kinds, guesses, tables, c_per_d):
    _CTX.update(states=states, kinds=kinds, guesses=guesses, tables=tables, c_per_d=c_per_d)


def _model(dyn):
    el, D = dyn[:6], dyn[6]
    sim = N.build(_CTX["states"], elems=el, C=D * _CTX["c_per_d"])
    return N.contact_times(sim, _CTX["guesses"], _CTX["kinds"], _CTX["tables"])


def calibrate():
    """arcsec/century of extra perihelion advance per unit C: two-body numerical (two C values),
    analytic (pi C / h^2 per orbit), and a full N-body difference run."""
    out = {}
    h2 = N.gm_au("10") * EL0[0] * (1 - EL0[1] ** 2)  # (Sun GM; Mercury's own mass is negligible here)
    period = 2 * math.pi * math.sqrt(EL0[0] ** 3 / (N.gm_au("10") + N.gm_au("199")))
    orbits_cy = 36525.0 / period
    out["analytic_per_C"] = math.pi / h2 * orbits_cy * 180 / math.pi * 3600
    for C in (4e-12, 8e-12):
        k, r = N.calibrate_C(STATES, C=C, years=200)
        out[f"two_body_per_C_at_{C:g}"] = k
    t = np.linspace(0, 200 * 365.25, 4001)
    rates = []
    for C in (0.0, 4e-12):
        sim = N.build(STATES, C=C)
        rates.append(N.rate_arcsec_per_century(t, N.pomega_series(sim, t)))
    out["nbody_per_C"] = (rates[1] - rates[0]) / 4e-12
    out["c_per_D"] = 1.0 / out["two_body_per_C_at_4e-12"]
    return out


def offsets_matrix(kind):
    """Design columns for the per-contact-type constants.
    'time': one time offset (s) per type. 'radial': one offset of the contact separation (arcsec) per
    type, i.e. an effective change of the contact circle; it moves ingress (II) earlier and egress (III,
    IV) later by offset / |radial rate| (radial rate from Horizons at each contact, kill test)."""
    X = np.zeros((len(KINDS), 3))
    for i, k in enumerate(KINDS):
        if kind == "time":
            X[i, TYPES.index(k)] = 1.0
        else:
            s = -1.0 if k == "II" else 1.0
            X[i, TYPES.index(k)] = s * 60.0 / abs(VRAD[i])
    return X


def _project(r, X, w):
    sw = np.sqrt(w)
    sol, *_ = np.linalg.lstsq(X * sw[:, None], r * sw, rcond=None)
    res = r - X @ sol
    return float(np.sqrt(np.sum(w * res**2) / np.sum(w)))


def gauss_newton(t_obs, w, c_per_d, guesses, tables, p_dyn0, X, iters=12, tol=1e-3, label=""):
    """Damped Gauss-Newton on the 7 dynamical parameters; the 3 constants are solved linearly at each
    step. Converges when the weighted rms changes by less than tol (s)."""
    p = np.array(p_dyn0, float)
    hist = []
    with ProcessPoolExecutor(max_workers=6, initializer=_init,
                             initargs=(STATES, KINDS, guesses, tables, c_per_d)) as ex:
        base = list(ex.map(_model, [p]))[0]
        rms = _project((t_obs - base) * 86400, X, w)
        for it in range(iters):
            cols = [p + np.eye(7)[j] * STEPS[j] for j in range(7)]
            outs = list(ex.map(_model, cols))
            if any(np.any(np.isnan(o)) for o in outs + [base]):
                raise RuntimeError(f"{label}: contact not found")
            J = np.column_stack([(o - base) * 86400 / STEPS[j] for j, o in enumerate(outs)])
            r = (t_obs - base) * 86400
            A = np.hstack([J, X])
            sw = np.sqrt(w)
            sol, *_ = np.linalg.lstsq(A * sw[:, None], r * sw, rcond=None)
            step = sol[:7]
            for damp in (1.0, 0.5, 0.25, 0.125):
                pt = p + damp * step
                bt = list(ex.map(_model, [pt]))[0]
                if np.any(np.isnan(bt)):
                    continue
                rt = _project((t_obs - bt) * 86400, X, w)
                if rt <= rms + 1e-4:
                    break
            converged = abs(rms - rt) < tol
            p, base, rms = pt, bt, rt
            hist.append(rms)
            print(f"  {label} it{it}: weighted rms {rms:.4f} s, D {p[6]:+.4f}, damping {damp}", flush=True)
            if converged:
                break
        cols = [p + np.eye(7)[j] * STEPS[j] for j in range(7)] + [p + np.eye(7)[j] * STEPS[j] / 2 for j in range(7)]
        outs = list(ex.map(_model, cols))
    J = np.column_stack([(o - base) * 86400 / STEPS[j] for j, o in enumerate(outs[:7])])
    Jh = np.column_stack([(o - base) * 86400 / (STEPS[j] / 2) for j, o in enumerate(outs[7:14])])
    jcheck = float(np.max(np.linalg.norm(J - Jh, axis=0) / np.linalg.norm(J, axis=0)))
    r = (t_obs - base) * 86400
    A = np.hstack([J, X])
    sw = np.sqrt(w)
    sol, *_ = np.linalg.lstsq(A * sw[:, None], r * sw, rcond=None)
    res = r - A @ sol
    p_full = np.concatenate([p + sol[:7], sol[7:]])  # dynamical remainder folded in linearly; constants in full
    return {"p": p_full, "J": J, "A": A, "res": res, "r_noOffsets": r, "rms_hist": hist, "jac_halving": jcheck,
            "base": base, "dyn_remainder": sol[:7].tolist()}


def solve_linear(A, y, w):
    """Weighted LSQ; returns solution, scaled covariance, residuals, chi2/dof. Columns with no weighted
    data (e.g. the contact-IV constant when only II and III are kept) are dropped (zero, zero variance)."""
    sw = np.sqrt(w)
    keep = np.where(np.sum((A * sw[:, None]) ** 2, axis=0) > 0)[0]
    Aw, yw = A[:, keep] * sw[:, None], y * sw
    s, *_ = np.linalg.lstsq(Aw, yw, rcond=None)
    sol = np.zeros(A.shape[1])
    sol[keep] = s
    res = y - A @ sol
    dof = int(np.sum(w > 0)) - len(keep)
    s2 = float(np.sum(w * res**2) / dof)
    cov = np.zeros((A.shape[1], A.shape[1]))
    cov[np.ix_(keep, keep)] = s2 * np.linalg.inv(Aw.T @ Aw)
    return sol, cov, res, s2


def summarize(fit, w, label):
    A = fit["A"]
    # linearised solve of the residuals around the solution gives the covariance
    sol, cov, res, s2 = solve_linear(A, fit["res"], w)
    sig = np.sqrt(np.diag(cov))
    corr = cov / np.outer(sig, sig)
    p = fit["p"]
    return {"label": label, "D": float(p[6]), "sigma_D": float(sig[6]), "sigma0_s": math.sqrt(s2),
            "params": {n: float(v) for n, v in zip(NAMES, p)},
            "sigmas": {n: float(v) for n, v in zip(NAMES, sig)},
            "corr_D": {n: float(v) for n, v in zip(NAMES, corr[6])},
            "corr": corr.tolist(), "wrms_s": float(np.sqrt(np.sum(w * fit["res"]**2) / np.sum(w))),
            "rms_s": float(np.sqrt(np.mean(fit["res"]**2))), "jac_halving": fit["jac_halving"],
            "rms_hist": fit["rms_hist"]}


def variants(f, label_prefix, dT_shift):
    A, y0, pH = f["A"], f["res"], f["p"]
    var = {}

    def add(name, y, w):
        sol, cov, res, s2 = solve_linear(A, y, w)
        var[name] = {"D": float(pH[6] + sol[6]), "sigma_D": float(math.sqrt(cov[6, 6])),
                     "n": int(np.sum(w > 0)), "sigma0_s": math.sqrt(s2)}

    add("Newcomb weights", y0, W)
    add("unweighted", y0, np.ones_like(W))
    add("Delta T from Horizons (SMH 2016)", y0 + dT_shift, W)
    add("without weight-0.1 contacts", y0, np.where(W <= 0.1, 0.0, W))
    add("interior contacts only (II, III)", y0, np.where(np.isin(KINDS, ["II", "III"]), W, 0.0))
    loo = {}
    for yr in sorted(set(YEAR)):
        sol, cov, res, s2 = solve_linear(A, y0, np.where(YEAR == yr, 0.0, W))
        loo[int(yr)] = float(pH[6] + sol[6])
    vals = np.array(list(loo.values()))
    n = len(vals)
    var["leave_one_transit_out"] = {"min": float(vals.min()), "max": float(vals.max()), "values": loo,
                                    "jackknife_sigma_D": float(math.sqrt((n - 1) / n * np.sum((vals - vals.mean())**2)))}
    sol, cov, res, s2 = solve_linear(A, y0, W)
    rng = np.random.default_rng(1677)
    s0 = math.sqrt(s2)
    Ds = []
    for _ in range(2000):
        y = rng.normal(0, s0 / np.sqrt(W))
        so, *_ = np.linalg.lstsq(A * np.sqrt(W)[:, None], y * np.sqrt(W), rcond=None)
        Ds.append(so[6])
    var["monte_carlo_sigma_D"] = float(np.std(Ds))
    return var


if __name__ == "__main__":
    t0 = time.time()
    results = {}
    calf = N.hz.ROOT / "data" / "calibration.json"
    if calf.exists():
        cal = json.load(open(calf))
    else:
        cal = calibrate()
        json.dump(cal, open(calf, "w"), indent=1)
    results["calibration"] = cal
    cpd = cal["c_per_D"]
    p0 = np.concatenate([EL0, [0.0]])
    # search windows (+-2000 s) and Horizons Earth/Sun tables are centred on Horizons' contact instants
    G = T_OBS["jd_tt_horizons"]
    tables = N.earth_tables(G)
    arrays = {"year": YEAR, "month": MONTH, "kind": np.array(KINDS), "w": W, "vrad": VRAD}
    XS = {"time": offsets_matrix("time"), "radial": offsets_matrix("radial")}
    dT_shift = (T_OBS["jd_tt_obs_hz"] - T_OBS["jd_tt_obs_em"]) * 86400

    # closure tests: synthetic contacts from the Newtonian model itself (Horizons IC), known D and
    # (second test) known radial offsets; fitted from a perturbed start
    _init(STATES, KINDS, G, tables, cpd)
    for name, Dtrue, offs_true, xk in (("closure_D0_time", 0.0, np.zeros(3), "time"),
                                       ("closure_D5_radial", 5.0, np.array([1.0, 0.5, -1.5]), "radial")):
        syn = _model(np.concatenate([EL0, [Dtrue]])) + XS[xk] @ offs_true / 86400
        start = np.concatenate([EL0 * (1 + np.array([2e-8, 1e-6, 0, 0, 0, 0])), [0.0]])
        f = gauss_newton(syn, W, cpd, G, tables, start, XS[xk], label=name)
        s = summarize(f, W, name)
        s.update(D_true=Dtrue, offsets_true=offs_true.tolist(), elements_minus_true=(f["p"][:6] - EL0).tolist())
        results[name] = s
        print(name, s["D"], "+-", s["sigma_D"], "offsets", f["p"][7:], flush=True)

    for xk in ("radial", "time"):
        fc = gauss_newton(G, W, cpd, G, tables, p0, XS[xk], label=f"control/{xk}")
        results[f"control_{xk}"] = summarize(fc, W, f"control, {xk} offsets")
        fh = gauss_newton(T_OBS["jd_tt_obs_em"], W, cpd, G, tables, fc["p"][:7], XS[xk],
                          label=f"historical/{xk}")
        results[f"historical_{xk}"] = summarize(fh, W, f"historical, {xk} offsets")
        results[f"historical_{xk}"]["dyn_remainder"] = fh["dyn_remainder"]
        results[f"variants_{xk}"] = variants(fh, xk, dT_shift)
        results[f"variants_control_{xk}"] = {"unweighted": variants(fc, xk, 0 * dT_shift)["unweighted"]}
        for tag, f in (("control", fc), ("historical", fh)):
            arrays[f"res_{tag}_{xk}"] = f["res"]
            arrays[f"J_{tag}_{xk}"] = f["J"]
            arrays[f"A_{tag}_{xk}"] = f["A"]
        print(xk, "control D", results[f"control_{xk}"]["D"], "historical D", results[f"historical_{xk}"]["D"],
              "+-", results[f"historical_{xk}"]["sigma_D"], flush=True)

    _init(STATES, KINDS, G, tables, cpd)
    arrays["prefit_model"] = _model(p0)
    for k, v in T_OBS.items():
        arrays[k] = v
    results["wall_s"] = time.time() - t0
    json.dump(results, open(OUT / "fit_results.json", "w"), indent=1)
    np.savez(OUT / "fit_arrays.npz", **arrays)
    print(json.dumps({k: v for k, v in results.items() if k.startswith("variants")}, indent=1))
    print("wall", results["wall_s"])
