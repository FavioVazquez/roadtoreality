#!/usr/bin/env python3
"""Fit families A1 (spline), A2 (Fourier), B (two circles), C (two Kepler ellipses) to positions.csv.
Follows PLAN.md. Writes MODEL.json (and prints the scores)."""
import json, os, sys
import numpy as np
from multiprocessing import Pool
from scipy.optimize import least_squares, minimize
from scipy.interpolate import UnivariateSpline
from scipy.signal import find_peaks

HERE = os.path.dirname(os.path.abspath(__file__))
TSPLIT = 1050.889543
THR = 5.0
D = np.genfromtxt(os.path.join(HERE, 'positions.csv'), delimiter=',', names=True)
D = np.sort(D, order='t')
T = D['t']; X = np.radians(D['x_deg']); Y = np.radians(D['y_deg'])
SX = np.radians(D['sx_arcmin'] / 60); SY = np.radians(D['sy_arcmin'] / 60)
TR = T < TSPLIT; TE = ~TR
AM = 180 / np.pi * 60  # rad -> arcmin


def wrap(a):
    return (a + np.pi) % (2 * np.pi) - np.pi


def direction(v):
    v = np.asarray(v)
    return np.arctan2(v[1], v[0]), np.arcsin(v[2] / np.linalg.norm(v, axis=0))


def resid_xy(xm, ym, idx):
    dx = wrap(X[idx] - xm) * np.cos(Y[idx]); dy = Y[idx] - ym
    return dx, dy


def norm_resid(xm, ym, idx):
    dx, dy = resid_xy(xm, ym, idx)
    return np.concatenate([dx / SX[idx], dy / SY[idx]])


def scores(xm, ym, idx, inl):
    dx, dy = resid_xy(xm, ym, idx)
    ang = np.hypot(dx, dy) * AM
    r = np.hypot(dx / SX[idx], dy / SY[idx])
    out = {}
    for name, m in (('all', np.ones_like(ang, bool)), ('inliers', inl)):
        a = ang[m]
        out[name] = {'n': int(m.sum()), 'median_arcmin': float(np.median(a)),
                     'rms_arcmin': float(np.sqrt(np.mean(a ** 2)))}
    out['n_flagged'] = int((~inl).sum()); out['chi2_inliers'] = float(np.sum(r[inl] ** 2))
    out['chi2_capped'] = float(np.sum(np.minimum(r, THR) ** 2))
    return out

# ------------------------------------------------------------ periodogram (train only)

def periodogram():
    t = T[TR]; z = np.exp(1j * X[TR])
    f = np.linspace(-0.02, 0.02, 160001)
    P = np.abs(np.exp(-2j * np.pi * np.outer(f, t)) @ z) ** 2 / len(t) ** 2
    pk, _ = find_peaks(P)
    o = pk[np.argsort(P[pk])[::-1]][:6]
    return [(float(f[i]), float(P[i])) for i in o]

# ------------------------------------------------------------ physical models


def kepler_E(M, e):
    E = M + e * np.sin(M)
    for _ in range(30):
        E = E - (E - e * np.sin(E) - M) / (1 - e * np.cos(E))
    return E


def orbit(t, P, a, lam, k, h, inc=0.0, Om=0.0):
    e = np.hypot(k, h); varpi = np.arctan2(h, k)
    M = 2 * np.pi * t / P + lam - varpi
    E = kepler_E(M, e)
    xp = a * (np.cos(E) - e); yp = a * np.sqrt(max(1 - e * e, 1e-12)) * np.sin(E)
    w = varpi - Om
    c, s = np.cos(w), np.sin(w)
    x1 = c * xp - s * yp; y1 = s * xp + c * yp
    ci, si = np.cos(inc), np.sin(inc)
    y2 = ci * y1; z2 = si * y1
    cO, sO = np.cos(Om), np.sin(Om)
    return np.array([cO * x1 - sO * y2, sO * x1 + cO * y2, z2])


def model_B(p, t):  # P1, lam1, P2, a2, inc, Om, lam2
    P1, l1, P2, a2, inc, Om, l2 = p
    return direction(orbit(t, P2, a2, l2, 0, 0, inc, Om) - orbit(t, P1, 1.0, l1, 0, 0))


def model_C(p, t):  # P1, lam1, k1, h1, P2, a2, inc, Om, lam2, k2, h2
    P1, l1, k1, h1, P2, a2, inc, Om, l2, k2, h2 = p
    return direction(orbit(t, P2, a2, l2, k2, h2, inc, Om) - orbit(t, P1, 1.0, l1, k1, h1))


MODELS = {'B': model_B, 'C': model_C}
NAMES = {'B': ['P1', 'lam1', 'P2', 'a2', 'inc', 'Om', 'lam2'],
         'C': ['P1', 'lam1', 'k1', 'h1', 'P2', 'a2', 'inc', 'Om', 'lam2', 'k2', 'h2']}


def nl_fit(fam, p0, idx, loss='linear'):
    f = MODELS[fam]
    fun = lambda p: norm_resid(*f(p, T[idx]), idx)
    return least_squares(fun, p0, loss=loss, f_scale=3.0, x_scale='jac', max_nfev=1500)


def robust_cycle(fam, p0):
    """PLAN outlier rule: Cauchy fit, flag r>5, refit plain WLS on the rest, repeat until stable."""
    idx = np.where(TR)[0]
    res = nl_fit(fam, p0, idx, loss='cauchy')
    p = res.x; flagged = None
    for _ in range(5):
        xm, ym = MODELS[fam](p, T[idx]); dx, dy = resid_xy(xm, ym, idx)
        r = np.hypot(dx / SX[idx], dy / SY[idx]); inl = r <= THR
        if flagged is not None and np.array_equal(inl, flagged):
            break
        flagged = inl
        res = nl_fit(fam, p, idx[inl]); p = res.x
    return p, res, idx[inl]


def ms_worker(args):
    fam, p0 = args
    try:
        idx = np.where(TR)[0]
        res = least_squares(lambda p: norm_resid(*MODELS[fam](p, T[idx]), idx), p0, loss='soft_l1', f_scale=300.0,
                            x_scale='jac', max_nfev=1500)  # coarse stage: tolerant scale so far starts can move
        res = nl_fit(fam, res.x, idx, loss='cauchy')
        return float(res.cost), res.x.tolist()
    except Exception:
        return np.inf, list(p0)


def param_sigma(res, nobs, k):
    J = res.jac
    chi2 = 2 * res.cost; red = chi2 / max(nobs - k, 1)
    cov = np.linalg.pinv(J.T @ J) * max(red, 1.0)
    return np.sqrt(np.diag(cov)), red

# ------------------------------------------------------------ Fourier (A2) and spline (A1)


def unitvec():
    return np.array([np.cos(Y) * np.cos(X), np.cos(Y) * np.sin(X), np.sin(Y)])


def combos(N):
    c = [(n1, n2) for n1 in range(-N, N + 1) for n2 in range(-N, N + 1) if abs(n1) + abs(n2) <= N]
    # keep one of each +/- pair (real basis)
    keep = []
    for n1, n2 in c:
        if (n1, n2) == (0, 0):
            continue
        if (-n1, -n2) not in keep:
            keep.append((n1, n2))
    return keep


def fourier_design(t, f1, f2, N):
    cols = [np.ones_like(t)]
    for n1, n2 in combos(N):
        w = 2 * np.pi * (n1 * f1 + n2 * f2) * t
        cols += [np.cos(w), np.sin(w)]
    return np.array(cols).T


def fourier_fit(f1, f2, N, idx, w=None):
    U = unitvec(); s = 0.5 * (SX + SY)
    A = fourier_design(T[idx], f1, f2, N)
    ww = (1 / s[idx]) if w is None else w / s[idx]
    coef = np.linalg.lstsq(A * ww[:, None], (U[:, idx] * ww).T, rcond=None)[0]
    return coef


def fourier_pred(coef, f1, f2, N, t):
    return direction((fourier_design(t, f1, f2, N) @ coef).T)


def fourier_family(f1, f2, N):
    idx_all = np.where(TR)[0]

    def chi2_for(fr, idx, w=None):
        coef = fourier_fit(fr[0], fr[1], N, idx, w)
        return np.sum(norm_resid(*fourier_pred(coef, fr[0], fr[1], N, T[idx]), idx) ** 2), coef
    # Cauchy IRLS start
    w = np.ones(len(idx_all)); fr = np.array([f1, f2])
    for _ in range(10):
        coef = fourier_fit(fr[0], fr[1], N, idx_all, w)
        dx, dy = resid_xy(*fourier_pred(coef, fr[0], fr[1], N, T[idx_all]), idx_all)
        r = np.hypot(dx / SX[idx_all], dy / SY[idx_all]); w = 1 / np.sqrt(1 + (r / 3) ** 2)
    inl = r <= THR
    idx = idx_all[inl]; chi2, coef = chi2_for(fr, idx)
    k = coef.size
    return dict(coef=coef, f=fr, N=N, k=k, idx=idx, chi2=chi2)


def spline_family():
    U = unitvec(); s = 0.5 * (SX + SY); idx_all = np.where(TR)[0]
    t = T[idx_all]
    # tie-break duplicate times
    t = t + np.arange(len(t)) * 1e-9

    def fit(idx_mask, w):
        spl = [UnivariateSpline(t[idx_mask], U[c, idx_all][idx_mask], w=w[idx_mask] / s[idx_all][idx_mask],
                                k=3, s=idx_mask.sum()) for c in range(3)]
        return spl

    def pred(spl, tt):
        lo, hi = t.min(), t.max(); out = []
        for sp in spl:
            v = sp(np.clip(tt, lo, hi))
            v = v + np.where(tt > hi, sp.derivative()(hi) * (tt - hi), 0) + np.where(tt < lo, sp.derivative()(lo) * (tt - lo), 0)
            out.append(v)
        return direction(np.array(out))
    m = np.ones(len(t), bool); w = np.ones(len(t))
    for _ in range(10):
        spl = fit(m, w); dx, dy = resid_xy(*pred(spl, T[idx_all]), idx_all)
        r = np.hypot(dx / SX[idx_all], dy / SY[idx_all]); w = 1 / np.sqrt(1 + (r / 3) ** 2)
    m = r <= THR; prev = None
    for _ in range(5):
        spl = fit(m, np.ones(len(t))); dx, dy = resid_xy(*pred(spl, T[idx_all]), idx_all)
        new = np.hypot(dx / SX[idx_all], dy / SY[idx_all]) <= THR
        if prev is not None and np.array_equal(new, prev):
            break
        prev = m = new
    k = sum(len(sp.get_coeffs()) for sp in spl)
    return spl, pred, idx_all[m], k


def evaluate(name, predict, k, idx_tr_inl, extra=None):
    itr = np.where(TR)[0]; ite = np.where(TE)[0]
    xm, ym = predict(T[itr]); inl_tr = np.isin(itr, idx_tr_inl)
    s_tr = scores(xm, ym, itr, inl_tr)
    xm2, ym2 = predict(T[ite]); dx, dy = resid_xy(xm2, ym2, ite)
    inl_te = np.hypot(dx / SX[ite], dy / SY[ite]) <= THR
    s_te = scores(xm2, ym2, ite, inl_te)
    nobs = 2 * len(itr)
    bic = s_tr['chi2_capped'] + k * np.log(nobs)  # post hoc: flagged rows count THR^2 each
    out = {'k': int(k), 'BIC_train': float(bic), 'train': s_tr, 'heldout': s_te,
           'train_flagged_t': [float(v) for v in T[itr][~inl_tr]],
           'heldout_flagged_t': [float(v) for v in T[ite][~inl_te]]}
    if extra:
        out.update(extra)
    print(f"{name:4s} k={k:3d} BIC={bic:12.1f} train med/rms {s_tr['inliers']['median_arcmin']:.2f}/"
          f"{s_tr['inliers']['rms_arcmin']:.2f} (all rms {s_tr['all']['rms_arcmin']:.1f}, flagged {s_tr['n_flagged']})"
          f"  heldout med/rms {s_te['inliers']['median_arcmin']:.2f}/{s_te['inliers']['rms_arcmin']:.2f}"
          f" (all med/rms {s_te['all']['median_arcmin']:.2f}/{s_te['all']['rms_arcmin']:.1f}, flagged {s_te['n_flagged']})",
          flush=True)
    return out


def main():
    rng = np.random.default_rng(1)
    peaks = periodogram()
    print('periodogram peaks (f, power):', peaks)
    f1, f2 = sorted([peaks[0][0], peaks[1][0]], key=abs, reverse=True)  # f1 fast, f2 slow
    fam = {}

    # A1 spline
    spl, spred, inl, k = spline_family()
    fam['A1_spline'] = evaluate('A1', lambda t: spred(spl, t), k, inl)

    # A2 Fourier, order chosen by BIC on train
    best = None; a2scores = {}
    for N in range(1, 6):
        r = fourier_family(f1, f2, N)
        ev = evaluate(f'A2N{N}', lambda t, r=r: fourier_pred(r['coef'], r['f'][0], r['f'][1], N, t), r['k'], r['idx'],
                      {'N': N, 'f1': float(r['f'][0]), 'f2': float(r['f'][1])})
        a2scores[N] = ev
        if best is None or ev['BIC_train'] < best[1]['BIC_train']:
            best = (N, ev)
    fam['A2_fourier'] = dict(best[1], all_orders={str(n): {'BIC_train': v['BIC_train'], 'k': v['k'],
                             'heldout_rms_inl': v['heldout']['inliers']['rms_arcmin'],
                             'heldout_median_inl': v['heldout']['inliers']['median_arcmin']} for n, v in a2scores.items()})

    # B two circles: multistart from periodogram periods, both observer/object assignments
    import itertools
    starts = []  # post hoc: all ordered pairs of the 6 strongest periodogram peaks (observer, object)
    for fa, fb in itertools.permutations([p[0] for p in peaks], 2):
        for a2 in (0.6, 1.3, 2.5):
            starts.append(('B', [1 / fa, rng.uniform(0, 2 * np.pi), 1 / fb, a2, 0.05,
                                 rng.uniform(0, 2 * np.pi), rng.uniform(0, 2 * np.pi)]))
    with Pool(6) as pool:
        out = pool.map(ms_worker, starts)
    out.sort(key=lambda o: o[0])
    pB, resB, inlB = robust_cycle('B', np.array(out[0][1]))
    sB, redB = param_sigma(resB, 2 * len(inlB), 7)
    fam['B_circles'] = evaluate('B', lambda t: model_B(pB, t), 7, inlB,
                                {'params': dict(zip(NAMES['B'], pB.tolist())), 'sigma': dict(zip(NAMES['B'], sB.tolist())),
                                 'reduced_chi2': float(redB), 'multistart_best_costs': [o[0] for o in out[:5]]})

    # C Kepler ellipses: start from B with small random eccentricity vectors
    startsC = []
    for _ in range(18):
        startsC.append(('C', [pB[0], pB[1], *rng.normal(0, 0.05, 2), pB[2], pB[3], pB[4], pB[5], pB[6],
                              *rng.normal(0, 0.05, 2)]))
    with Pool(6) as pool:
        outC = pool.map(ms_worker, startsC)
    outC.sort(key=lambda o: o[0])
    pC, resC, inlC = robust_cycle('C', np.array(outC[0][1]))
    sC, redC = param_sigma(resC, 2 * len(inlC), 11)
    fam['C_kepler'] = evaluate('C', lambda t: model_C(pC, t), 11, inlC,
                               {'params': dict(zip(NAMES['C'], pC.tolist())), 'sigma': dict(zip(NAMES['C'], sC.tolist())),
                                'reduced_chi2': float(redC), 'multistart_best_costs': [o[0] for o in outC[:5]]})

    best_te = min(v['heldout']['inliers']['rms_arcmin'] for v in fam.values() if np.isfinite(v['heldout']['inliers']['rms_arcmin']))
    ok = {k: v for k, v in fam.items() if v['heldout']['inliers']['rms_arcmin'] <= 1.5 * best_te}
    win = min(ok, key=lambda k: fam[k]['BIC_train'])
    p = fam['C_kepler']['params']; sg = fam['C_kepler']['sigma']
    e1 = float(np.hypot(p['k1'], p['h1'])); e2 = float(np.hypot(p['k2'], p['h2']))
    reg = {'period_ratio_P2_over_P1': abs(p['P2'] / p['P1']), 'axis_ratio_a2_over_a1': p['a2'],
           'exponent_log_a_over_log_P': float(np.log(p['a2']) / np.log(abs(p['P2'] / p['P1']))),
           'a2^3/P2^2 over a1^3/P1^2': float(p['a2'] ** 3 / p['P2'] ** 2 * p['P1'] ** 2),
           'e1': e1, 'e2': e2, 'inc_deg': float(np.degrees(p['inc'])),
           'synodic_period': float(1 / abs(1 / abs(p['P1']) - 1 / abs(p['P2'])))}
    json.dump({'winner': win, 'decision_rule': 'lowest train BIC among families with held-out inlier RMS <= 1.5x best',
               'periodogram_peaks': peaks, 'derived': reg, 'families': fam},
              open(os.path.join(HERE, 'MODEL.json'), 'w'), indent=1)
    print('WINNER', win, json.dumps(reg, indent=1))


if __name__ == '__main__':
    main()
