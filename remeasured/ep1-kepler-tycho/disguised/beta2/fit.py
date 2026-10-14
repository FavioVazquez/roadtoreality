#!/usr/bin/env python3
"""Fit three model families to positions.csv following PLAN.md. Writes MODEL.json (and fit_log.txt)."""
import json, os, sys, subprocess
import numpy as np
from scipy.optimize import least_squares
from multiprocessing import Pool

HERE = os.path.dirname(os.path.abspath(__file__))
TCUT = 6009.989529
T0 = 3000.0           # time origin for phases (centre of the training span)
CLIP = 6.0            # outlier threshold, in units of the robust scale s (PLAN.md)

d = np.genfromtxt(os.path.join(HERE, 'positions.csv'), delimiter=',', names=True)
d = d[np.argsort(d['t'])]
T = d['t'] - T0
X = np.radians(d['x_deg']); Y = np.radians(d['y_deg'])
SX = np.radians(d['sx_arcmin'] / 60); SY = np.radians(d['sy_arcmin'] / 60)
TR = d['t'] < TCUT; TE = ~TR
AM = 180 * 60 / np.pi  # rad -> arcmin


def wrap(a):
    return (a + np.pi) % (2 * np.pi) - np.pi


def resid_arcmin(xm, ym):
    dx = wrap(X - xm) * np.cos(Y); dy = Y - ym
    return dx, dy


def norm_res(xm, ym):
    dx, dy = resid_arcmin(xm, ym)
    return dx / SX, dy / SY


def robust_scale(nx, ny, keep):
    r = np.r_[nx[keep], ny[keep]]
    return max(1.0, 1.4826 * np.median(np.abs(r - np.median(r))))


# ------------------------------------------------------------------ geometry (F1, F2)
def kepler_E(M, e):
    E = M + e * np.sin(M)
    for _ in range(10):
        E = E - (E - e * np.sin(E) - M) / (1 - e * np.cos(E))
    return E


def orbit_xy(t, n, lam0, h, k, a):
    """Planar Kepler orbit. n: mean motion (rad/unit, signed); lam0: mean longitude at T0;
    (h,k) = e(cos w, sin w), w = longitude of perihelion. Returns x, y in its own plane."""
    e = np.hypot(h, k); w = np.arctan2(k, h)
    s = np.sign(n) if n != 0 else 1.0
    M = (lam0 - w) * s + abs(n) * t          # mean anomaly counted along the sense of motion
    E = kepler_E(M, e)
    xp = a * (np.cos(E) - e); yp = a * np.sqrt(1 - e * e) * np.sin(E) * s
    cw, sw = np.cos(w), np.sin(w)
    return cw * xp - sw * yp, sw * xp + cw * yp


def unpack(p, kepler):
    if kepler:
        nO, lO, hO, kO, nP, lP, hP, kP, rho, inc, node = p
    else:
        nO, lO, nP, lP, rho, inc, node = p; hO = kO = hP = kP = 0.0
    return nO, lO, hO, kO, nP, lP, hP, kP, rho, inc, node


def geo_model(p, t, kepler):
    nO, lO, hO, kO, nP, lP, hP, kP, rho, inc, node = unpack(p, kepler)
    ox, oy = orbit_xy(t, nO, lO, hO, kO, 1.0)
    # target: orbit in its own plane, longitudes counted from the node in that plane
    px, py = orbit_xy(t, nP, lP - node, hP * np.cos(node) + kP * np.sin(node),
                      -hP * np.sin(node) + kP * np.cos(node), rho)
    ci, si = np.cos(inc), np.sin(inc); cn, sn = np.cos(node), np.sin(node)
    X1, Y1, Z1 = px, py * ci, py * si
    PX = cn * X1 - sn * Y1; PY = sn * X1 + cn * Y1; PZ = Z1
    rx, ry, rz = PX - ox, PY - oy, PZ
    return np.arctan2(ry, rx), np.arctan2(rz, np.hypot(rx, ry))


def geo_res(p, kepler, keep):
    xm, ym = geo_model(p, T[keep], kepler)
    dx = wrap(X[keep] - xm) * np.cos(Y[keep]); dy = Y[keep] - ym
    return np.r_[dx / SX[keep], dy / SY[keep]]


def geo_fit_one(args):
    p0, kepler, keep, lb, ub = args
    try:
        r = least_squares(geo_res, p0, args=(kepler, keep), bounds=(lb, ub), x_scale='jac',
                          max_nfev=4000, loss='soft_l1', f_scale=20.0)   # robust start ...
        r = least_squares(geo_res, r.x, args=(kepler, keep), bounds=(lb, ub), x_scale='jac',
                          max_nfev=4000)                                   # ... plain chi2 finish
        return r.x, float(np.sum(r.fun ** 2))
    except Exception as ex:
        return p0, np.inf


def clip_loop(fit_fn, predict_fn, p_init):
    """Iterative outlier rule of PLAN.md on the training rows."""
    keep = TR.copy(); p = p_init
    for it in range(10):
        p = fit_fn(p, keep)
        xm, ym = predict_fn(p)
        nx, ny = norm_res(xm, ym)
        s = robust_scale(nx, ny, keep)
        bad = np.maximum(np.abs(nx), np.abs(ny)) > CLIP * s
        new = TR & ~bad
        if np.array_equal(new, keep):
            break
        keep = new
    return p, keep, s


def scores(xm, ym, keep, s, k):
    dx, dy = resid_arcmin(xm, ym)
    ang = np.hypot(dx, dy) * AM
    nx, ny = dx / SX, dy / SY
    flag = np.maximum(np.abs(nx), np.abs(ny)) > CLIP * s
    te_ok = TE & ~flag
    chi2 = float(np.sum(nx[keep] ** 2 + ny[keep] ** 2))
    N = int(2 * keep.sum())
    out = dict(k=k, n_train_kept=int(keep.sum()), n_train_clipped=int((TR & ~keep).sum()),
               robust_scale_s=float(s), chi2_train=chi2, BIC=float(chi2 / s ** 2 + k * np.log(N)),
               train_median_arcmin=float(np.median(ang[keep])),
               train_rms_arcmin=float(np.sqrt(np.mean(ang[keep] ** 2))),
               test_median_arcmin_all=float(np.median(ang[TE])),
               test_rms_arcmin_all=float(np.sqrt(np.mean(ang[TE] ** 2))),
               test_flagged_rows=[float(v) for v in d['t'][TE & flag]],
               test_median_arcmin=float(np.median(ang[te_ok])) if te_ok.any() else None,
               test_rms_arcmin=float(np.sqrt(np.mean(ang[te_ok] ** 2))) if te_ok.any() else None,
               n_test_unflagged=int(te_ok.sum()),
               train_clipped_rows=[float(v) for v in d['t'][TR & ~keep]])
    return out


# ------------------------------------------------------------------ F0: trigonometric regression
def design(t, freqs_c, freqs_r):
    """complex in-plane part: exp(i 2pi f t) for signed f; real part: cos/sin for f>0."""
    Zc = np.exp(2j * np.pi * np.outer(t, np.r_[0.0, freqs_c]))
    Zr = [np.ones_like(t)]
    for f in freqs_r:
        Zr += [np.cos(2 * np.pi * f * t), np.sin(2 * np.pi * f * t)]
    return Zc, np.array(Zr).T


def f0_fit_lin(fc, fr, keep, w):
    Zc, Zr = design(T[keep], fc, fr)
    z = np.cos(Y[keep]) * np.exp(1j * X[keep]); zz = np.sin(Y[keep])
    wc = 1 / SX[keep]; wr = 1 / SY[keep]
    ac = np.linalg.lstsq(Zc * wc[:, None], z * wc, rcond=None)[0]
    ar = np.linalg.lstsq(Zr * wr[:, None], zz * wr, rcond=None)[0]
    return ac, ar


def f0_predict(fc, fr, ac, ar, t=None):
    t = T if t is None else t
    Zc, Zr = design(t, fc, fr)
    z = Zc @ ac; zz = Zr @ ar
    return np.angle(z), np.arctan2(zz, np.abs(z))


def f0_build(keep, maxterms=14):
    grid = np.linspace(2e-5, 0.006, 6000)
    z = np.cos(Y[keep]) * np.exp(1j * X[keep]); zz = np.sin(Y[keep])
    wc = 1 / SX[keep]; wr = 1 / SY[keep]
    N = keep.sum()
    fc, fr = [], []
    # in-plane: complex prewhitening over signed frequencies
    Ep = np.exp(2j * np.pi * np.outer(grid, T[keep]))
    def rss_c(fc):
        Zc, _ = design(T[keep], fc, [])
        a = np.linalg.lstsq(Zc * wc[:, None], z * wc, rcond=None)[0]
        return np.sum(np.abs((z - Zc @ a) * wc) ** 2), z - Zc @ a
    rss, res = rss_c(fc)
    for _ in range(maxterms):
        pw = np.r_[np.abs(np.conj(Ep) @ (res * wc ** 2)), np.abs(Ep @ (np.conj(res) * wc ** 2))]
        j = np.argmax(pw); f = grid[j % len(grid)] * (1 if j < len(grid) else -1)
        new, nres = rss_c(fc + [f])
        if N * np.log(new / rss) + 2 * np.log(2 * N) >= 0:   # BIC gain must be positive
            break
        fc.append(f); rss, res = new, nres
    # latitude component: real prewhitening
    C = np.cos(2 * np.pi * np.outer(grid, T[keep])); S = np.sin(2 * np.pi * np.outer(grid, T[keep]))
    def rss_r(fr):
        _, Zr = design(T[keep], [], fr)
        a = np.linalg.lstsq(Zr * wr[:, None], zz * wr, rcond=None)[0]
        return np.sum(((zz - Zr @ a) * wr) ** 2), zz - Zr @ a
    rss, res = rss_r(fr)
    for _ in range(maxterms):
        pw = (C @ (res * wr ** 2)) ** 2 + (S @ (res * wr ** 2)) ** 2
        f = grid[np.argmax(pw)]
        new, nres = rss_r(fr + [f])
        if N * np.log(new / rss) + 2 * np.log(N) >= 0:
            break
        fr.append(f); rss, res = new, nres
    return fc, fr


def run_f0():
    keep = TR.copy()
    fc, fr = f0_build(keep)          # frequencies chosen once, on all training rows
    for it in range(10):
        ac, ar = f0_fit_lin(fc, fr, keep, None)
        xm, ym = f0_predict(fc, fr, ac, ar)
        nx, ny = norm_res(xm, ym)
        s = robust_scale(nx, ny, keep)
        new = TR & ~(np.maximum(np.abs(nx), np.abs(ny)) > CLIP * s)
        if np.array_equal(new, keep):
            break
        keep = new
    k = len(fc) * 3 + 2 + len(fr) * 3 + 1   # complex amps (2) + freq per term, + constants
    sc = scores(xm, ym, keep, s, k)
    sc['freqs_inplane'] = fc; sc['freqs_lat'] = fr
    # same frequencies and amplitudes fitted on all training rows, no clipping (for reference)
    ac, ar = f0_fit_lin(fc, fr, TR, None)
    xm, ym = f0_predict(fc, fr, ac, ar)
    sc['no_clipping'] = {kk: v for kk, v in scores(xm, ym, TR, 1.0, k).items() if 'rows' not in kk}
    return sc


# ------------------------------------------------------------------ seeds for F1 from the data
def seeds_f1():
    """Starting values from the data: retrograde (reversal) centres give the synodic period and the
    drift of the opposition direction; phases follow from the alignment at a reversal centre."""
    t = d['t'][TR]; x = np.unwrap(X[TR])
    # local direction of motion between close neighbours (gaps < 15 units)
    mid, sgn = [], []
    for i in range(len(t) - 1):
        if 0 < t[i + 1] - t[i] < 15:
            mid.append(0.5 * (t[i] + t[i + 1])); sgn.append(np.sign(x[i + 1] - x[i]))
    mid = np.array(mid); sgn = np.array(sgn)
    # usual sense of motion: time-weighted sign of the step between neighbours less than 150 units apart
    # (dense sampling around reversals biases a plain count of short steps)
    dt = np.diff(t); dxx = np.diff(x); m150 = (dt > 0) & (dt < 150)
    major = np.sign(np.sum(np.sign(dxx[m150]) * dt[m150]))
    rev = mid[sgn != major]                   # times of reversed motion
    # cluster reversed-motion times (gap > 300 units -> new episode)
    ep = np.split(rev, np.where(np.diff(rev) > 300)[0] + 1)
    centres = np.array([e.mean() for e in ep if len(e) >= 3])
    xc = np.array([np.interp(c, t, x) for c in centres]) % (2 * np.pi)
    xc = np.r_[xc[0], xc[0] + np.cumsum(wrap(np.diff(xc)))]   # unwrap along the sequence of centres
    # synodic period: smallest S such that all centre spacings are near integer multiples
    Sgrid = np.linspace(300, 3000, 27001)
    dif = np.diff(centres)
    cost = [np.sum((dif / S - np.round(dif / S)) ** 2) + 1e-9 * S for S in Sgrid]
    # prefer the largest S that fits (avoid sub-multiples): take the best S above 0.5*min spacing
    cost = np.array(cost); ok = Sgrid > 0.6 * dif.min()
    S = Sgrid[ok][np.argmin(cost[ok])]
    m = np.round((centres - centres[0]) / S)
    A = np.c_[np.ones_like(m), m]
    tfit = np.linalg.lstsq(A, centres, rcond=None)[0]; S = tfit[1]
    xfit = np.linalg.lstsq(A, xc, rcond=None)[0]   # drift of the reversal direction per synodic period
    return dict(centres=centres.tolist(), x_centres_deg=np.degrees(xc).tolist(), S=float(S),
                drift_deg=float(np.degrees(xfit[1])), major=float(major),
                t_ref=float(tfit[0]), x_ref=float(xfit[0]))


def f1_starts(sd):
    S = sd['S']; dl = np.radians(sd['drift_deg']); maj = sd['major']
    tref = sd['t_ref'] - T0; xref = sd['x_ref']
    wS = 2 * np.pi / S
    starts = []
    for kk in range(0, 3):
        step = dl + maj * 2 * np.pi * kk          # advance of the reversal direction per synodic period
        if abs(step) < 1e-6 or np.sign(step) != maj:
            continue
        nslow = step / S                         # mean motion of the slower body
        nfast = nslow + maj * wS                 # faster body laps it once per S
        # config A: observer is the fast (inner) body, target outside; aligned on the same side at tref
        # config B: observer is the slow (outer) body, target inside; aligned, target between
        for cfg in ('outer', 'inner'):
            if cfg == 'outer':
                nO, nP = nfast, nslow; lam = xref; rhos = [1.5, 2.5, 5.0]
            else:
                nO, nP = nslow, nfast; lam = xref + np.pi; rhos = [0.4, 0.7]
            for rho in rhos:
                for node in np.radians([0, 90, 180, 270]):
                    lO = lam - nO * tref; lP = lam - nP * tref
                    starts.append(np.array([nO, lO, nP, lP, rho, np.radians(3.0), node]))
    return starts


def bounds(kepler):
    if kepler:
        lb = [-1, -np.inf, -0.5, -0.5, -1, -np.inf, -0.5, -0.5, 0.05, 0, -np.inf]
        ub = [1, np.inf, 0.5, 0.5, 1, np.inf, 0.5, 0.5, 50, np.pi / 2, np.inf]
    else:
        lb = [-1, -np.inf, -1, -np.inf, 0.05, 0, -np.inf]
        ub = [1, np.inf, 1, np.inf, 50, np.pi / 2, np.inf]
    return np.array(lb, float), np.array(ub, float)


def ncores():
    try:
        load = float(subprocess.check_output(['sysctl', '-n', 'vm.loadavg']).split()[1])
    except Exception:
        load = 0
    return int(max(1, min(6, round(6 - load))))


def run_geo(kepler, starts, pool):
    lb, ub = bounds(kepler)
    starts = [np.clip(s, lb + 1e-9, ub - 1e-9) for s in starts]
    res = pool.map(geo_fit_one, [(s, kepler, TR, lb, ub) for s in starts])
    order = np.argsort([c for _, c in res])
    best = res[order[0]][0]
    top = [(float(res[i][1])) for i in order[:5]]

    def fit_fn(p, keep):
        r = least_squares(geo_res, p, args=(kepler, keep), bounds=(lb, ub), x_scale='jac', max_nfev=4000)
        return r.x
    pred = lambda p: geo_model(p, T, kepler)
    p, keep, s = clip_loop(fit_fn, pred, best)
    r = least_squares(geo_res, p, args=(kepler, keep), bounds=(lb, ub), x_scale='jac', max_nfev=4000)
    p = r.x
    J = r.jac
    cov = np.linalg.pinv(J.T @ J) * max(1.0, np.sum(r.fun ** 2) / (len(r.fun) - len(p)))
    sig = np.sqrt(np.diag(cov))
    xm, ym = pred(p)
    sc = scores(xm, ym, keep, s, len(p))
    sc['multistart_top_chi2'] = top
    return p, cov, sc, keep


NAMES1 = ['n_obs', 'lam_obs', 'n_tgt', 'lam_tgt', 'rho', 'inc', 'node']
NAMES2 = ['n_obs', 'lam_obs', 'h_obs', 'k_obs', 'n_tgt', 'lam_tgt', 'h_tgt', 'k_tgt', 'rho', 'inc', 'node']


def main():
    log = {}
    sd = seeds_f1(); log['seeds'] = sd
    print('seeds', json.dumps(sd))
    f0 = run_f0(); print('F0', json.dumps({k: v for k, v in f0.items() if 'rows' not in k}))
    nc = ncores(); print('pool', nc)
    with Pool(nc) as pool:
        st = f1_starts(sd); print('F1 starts', len(st))
        p1, s1, sc1, keep1 = run_geo(False, st, pool)
        print('F1', json.dumps({k: v for k, v in sc1.items() if 'rows' not in k}))
        print(dict(zip(NAMES1, p1)))
        # F2 starts: the F1 solution with small eccentricities in several directions
        st2 = []
        for (e1, e2) in [(0, 0), (0.05, 0), (0, 0.05)]:
            for (e3, e4) in [(0, 0), (0.08, 0), (0, 0.08), (-0.08, 0), (0, -0.08)]:
                nO, lO, nP, lP, rho, inc, node = p1
                st2.append(np.array([nO, lO, e1, e2, nP, lP, e3, e4, rho, inc, node]))
        p2, s2, sc2, keep2 = run_geo(True, st2, pool)
        print('F2', json.dumps({k: v for k, v in sc2.items() if 'rows' not in k}))
        print(dict(zip(NAMES2, p2)))
    fams = {'F0_trig_regression': f0, 'F1_two_circles': sc1, 'F2_two_kepler_ellipses': sc2}
    return fams, (p1, s1), (p2, s2), sd


def derived(p):
    nO, lO, hO, kO, nP, lP, hP, kP, rho, inc, node = unpack(p, True)
    PO = 2 * np.pi / abs(nO); PP = 2 * np.pi / abs(nP)
    return dict(P_obs=PO, P_tgt=PP, P_synodic=2 * np.pi / abs(nO - nP),
                e_obs=np.hypot(hO, kO), varpi_obs_deg=np.degrees(np.arctan2(kO, hO)) % 360,
                e_tgt=np.hypot(hP, kP), varpi_tgt_deg=np.degrees(np.arctan2(kP, hP)) % 360,
                a_ratio_rho=rho, inc_deg=np.degrees(inc), node_deg=np.degrees(node) % 360,
                period_ratio=PP / PO, rho_cubed=rho ** 3, period_ratio_squared=(PP / PO) ** 2,
                kepler3_exponent=np.log(PP / PO) / np.log(rho),
                kepler3_residual=(PP / PO) ** 2 / rho ** 3 - 1)


def with_sigma(p, cov):
    f0 = derived(p); keys = list(f0)
    J = np.zeros((len(keys), len(p)))
    for j in range(len(p)):
        h = 1e-6 * max(1e-3, abs(p[j])); q = p.copy(); q[j] += h
        fj = derived(q)
        for i, kk in enumerate(keys):
            dv = fj[kk] - f0[kk]
            if kk.endswith('_deg'):
                dv = (dv + 180) % 360 - 180
            J[i, j] = dv / h
    sg = np.sqrt(np.diag(J @ cov @ J.T))
    return {kk: dict(value=float(f0[kk]), sigma=float(sg[i])) for i, kk in enumerate(keys)}


if __name__ == '__main__':
    fams, (p1, c1), (p2, c2), sd = main()
    # BIC with a common reference scale s_ref = smallest s over families (PLAN.md)
    s_ref = min(v['robust_scale_s'] for v in fams.values())
    for v in fams.values():
        N = 2 * v['n_train_kept']
        v['BIC_sref'] = float(v['chi2_train'] / s_ref ** 2 + v['k'] * np.log(N))
        tr_rms, te_rms = v['train_rms_arcmin'], v['test_rms_arcmin']
        v['failed_to_predict'] = bool(te_rms is None or te_rms > 3 * tr_rms)
    ok = {k: v for k, v in fams.items() if not v['failed_to_predict']}
    best_te = min(v['test_rms_arcmin'] for v in ok.values())
    cand = {k: v for k, v in ok.items() if v['test_rms_arcmin'] <= 1.25 * best_te}
    winner = min(cand, key=lambda k: cand[k]['BIC_sref'])
    s1 = np.sqrt(np.diag(c1)); s2 = np.sqrt(np.diag(c2))
    model = dict(
        winner=winner, s_ref=s_ref,
        decision='held-out RMS (unflagged rows) primary; failed if > 3x in-sample RMS; '
                 'lowest BIC_sref among families within 25% of the best held-out RMS',
        time_origin_T0=T0, train_cut=TCUT,
        units='angles in rad unless *_deg; rates in rad per time unit; lam = mean longitude at T0; '
              '(h,k)=e(cos varpi, sin varpi); rho = target semi-major axis / observer semi-major axis',
        winner_parameters={n: dict(value=float(v), sigma=float(e)) for n, v, e in zip(NAMES2, p2, s2)},
        winner_derived=with_sigma(p2, c2),
        F1_parameters={n: dict(value=float(v), sigma=float(e)) for n, v, e in zip(NAMES1, p1, s1)},
        families=fams, seeds_from_data=sd)
    with open(os.path.join(HERE, 'MODEL.json'), 'w') as fh:
        json.dump(model, fh, indent=1)
    print(json.dumps(model['winner_derived'], indent=1))
    print('winner', winner)
