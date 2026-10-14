"""Fit families F0, F1, F2, F3a, F3 to positions.csv per PLAN.md. Usage: python3 fit.py"""
import json, os, sys, time
import numpy as np
from multiprocessing import Pool
from scipy.optimize import least_squares

HERE = os.path.dirname(os.path.abspath(__file__))
TCUT = 200.668654
D = np.genfromtxt(os.path.join(HERE, 'positions.csv'), delimiter=',', names=True)
T, X, Y, SX, SY = (D[k].astype(float) for k in ('t', 'x_deg', 'y_deg', 'sx_arcmin', 'sy_arcmin'))
TR = T < TCUT
TE = ~TR
T0 = 0.5 * (T[TR].min() + T[TR].max())          # epoch: middle of training span
TAU = T - T0
R2D = 180 / np.pi


def wrap(a):
    return (a + 180.0) % 360.0 - 180.0


def zres(xm, ym, idx):
    dx = wrap(X[idx] - xm) * np.cos(np.radians(Y[idx])) * 60
    dy = (Y[idx] - ym) * 60
    return dx, dy, dx / SX[idx], dy / SY[idx]


# ---------------------------------------------------------------- Kepler geometry
def kepler_E(M, e):
    E = M + e * np.sin(M)
    for _ in range(30):
        E = E - (E - e * np.sin(E) - M) / (1 - e * np.cos(E))
    return E


def orbit_pos(tau, a, n, L0, k, h, inc, Om):
    """Position on a Kepler ellipse. L0 = mean longitude at epoch, (k,h) = e(cos varpi, sin varpi)."""
    e = np.hypot(k, h)
    vp = np.arctan2(h, k)
    M = L0 + n * tau - vp
    E = kepler_E(np.mod(M + np.pi, 2 * np.pi) - np.pi, min(e, 0.95))
    p = a * (np.cos(E) - e)
    q = a * np.sqrt(max(1 - e * e, 1e-6)) * np.sin(E)
    w = vp - Om
    cu, su = np.cos(w), np.sin(w)
    xo, yo = p * cu - q * su, p * su + q * cu     # in orbit plane, from node
    ci, si = np.cos(inc), np.sin(inc)
    co, so = np.cos(Om), np.sin(Om)
    return np.array([xo * co - yo * ci * so, xo * so + yo * ci * co, yo * si])


def direction(v):
    x = np.degrees(np.arctan2(v[1], v[0])) % 360
    y = np.degrees(np.arctan2(v[2], np.hypot(v[0], v[1])))
    return x, y


# family models: params -> (x, y) at given tau
def m_F0(p, tau):  # n, L0, k, h, i, Om ; observer at focus
    n, L0, k, h, i, Om = p
    return direction(orbit_pos(tau, 1.0, n, L0, k, h, i, Om))


def m_F2(p, tau):  # n1, L1, a2, n2, L2, i, Om
    n1, L1, a2, n2, L2, i, Om = p
    ro = orbit_pos(tau, 1.0, n1, L1, 0, 0, 0, 0)
    rt = orbit_pos(tau, a2, n2, L2, 0, 0, i, Om)
    return direction(rt - ro)


def m_F3a(p, tau):  # + k2, h2
    n1, L1, a2, n2, L2, i, Om, k2, h2 = p
    ro = orbit_pos(tau, 1.0, n1, L1, 0, 0, 0, 0)
    rt = orbit_pos(tau, a2, n2, L2, k2, h2, i, Om)
    return direction(rt - ro)


def m_F3(p, tau):  # + k1, h1
    n1, L1, a2, n2, L2, i, Om, k2, h2, k1, h1 = p
    ro = orbit_pos(tau, 1.0, n1, L1, k1, h1, 0, 0)
    rt = orbit_pos(tau, a2, n2, L2, k2, h2, i, Om)
    return direction(rt - ro)


NAMES = {
    'F0': ['n', 'L0', 'ecosw', 'esinw', 'inc', 'Omega'],
    'F2': ['n_obs', 'L_obs', 'a_tgt', 'n_tgt', 'L_tgt', 'inc', 'Omega'],
    'F3a': ['n_obs', 'L_obs', 'a_tgt', 'n_tgt', 'L_tgt', 'inc', 'Omega', 'k_tgt', 'h_tgt'],
    'F3': ['n_obs', 'L_obs', 'a_tgt', 'n_tgt', 'L_tgt', 'inc', 'Omega', 'k_tgt', 'h_tgt', 'k_obs', 'h_obs'],
}
MODELS = {'F0': m_F0, 'F2': m_F2, 'F3a': m_F3a, 'F3': m_F3}


def resid_vec(p, model, idx, loss_guard=True):
    xm, ym = model(p, TAU[idx])
    _, _, zx, zy = zres(xm, ym, idx)
    r = np.concatenate([zx, zy])
    return r if np.all(np.isfinite(r)) else np.full_like(r, 1e3)


def fit_clipped(model, p0, base_idx, loss='linear'):
    """Pre-registered rule: fit, flag max(|zx|,|zy|)>5, refit, until flagged set is stable."""
    keep = base_idx.copy()
    p = np.array(p0, float)
    for _ in range(10):
        idx = np.where(keep)[0]
        r = least_squares(resid_vec, p, args=(model, idx), method='trf',
                          loss=loss, max_nfev=4000, x_scale='jac')
        p = r.x
        xm, ym = model(p, TAU[base_idx])
        _, _, zx, zy = zres(xm, ym, np.where(base_idx)[0])
        newkeep = base_idx.copy()
        newkeep[np.where(base_idx)[0]] = np.maximum(abs(zx), abs(zy)) <= 5
        if newkeep.sum() < max(0.5 * base_idx.sum(), len(p) + 2):
            keep = base_idx.copy()   # post hoc guard: model fails outright; clipping disabled, all rows kept
            break
        if np.array_equal(newkeep, keep):
            break
        keep = newkeep
    idx = np.where(keep)[0]
    r = least_squares(resid_vec, p, args=(model, idx), method='trf', max_nfev=4000, x_scale='jac')
    return r.x, keep, r


# ---------------------------------------------------------------- periodogram start values
def complex_periodogram(idx, fmax=0.05, nf=20001):
    f = np.linspace(-fmax, fmax, nf)
    w = 1 / (SX[idx] ** 2)
    ph = np.exp(1j * (np.radians(X[idx])[None, :] - 2 * np.pi * f[:, None] * TAU[idx][None, :]))
    S = (ph * w).sum(1) / w.sum()
    return f, np.abs(S), np.angle(S)


def top_peaks(f, P, k=6, sep=None):
    order = np.argsort(P)[::-1]
    sep = sep or 3 * (f[1] - f[0])
    out = []
    for j in order:
        if 0 < j < len(P) - 1 and P[j] >= P[j - 1] and P[j] >= P[j + 1]:
            if all(abs(f[j] - f[o]) > sep for o in out):
                out.append(j)
        if len(out) >= k:
            break
    return out


# ---------------------------------------------------------------- F1 no-physics
def f1_design(tau, freqs, deg):
    cols = [tau ** d for d in range(deg + 1)]
    for fr in freqs:
        cols += [np.cos(2 * np.pi * fr * tau), np.sin(2 * np.pi * fr * tau)]
    return np.array(cols).T


def fit_F1(idx_tr, f_drift):
    """x = poly(deg) + Fourier(K freqs from periodogram of detrended x); y = const + same Fourier. Linear LSQ with
    iterative rewrapping; K, deg by BIC; same 5-sigma clipping rule."""
    tau = TAU[idx_tr]
    best = None
    for deg in (1, 2, 3):
        for K in range(0, 5):
            keep = np.ones(len(idx_tr), bool)
            for _ in range(10):
                tk = tau[keep]
                drift = 360 * f_drift * tk
                xu = drift + wrap(X[idx_tr][keep] - drift - np.median(wrap(X[idx_tr][keep] - drift)))
                xu += np.median(wrap(X[idx_tr][keep] - drift))
                # frequencies: greedy Lomb-Scargle peaks of detrended residual of x
                freqs = []
                fgrid = np.linspace(1 / 2000, 0.05, 5000)
                for kk in range(K):
                    A = f1_design(tk, freqs, deg)
                    res = xu - A @ np.linalg.lstsq(A, xu, rcond=None)[0]
                    pw = [abs(np.sum(res * np.exp(-2j * np.pi * fr * tk))) for fr in fgrid]
                    freqs.append(fgrid[int(np.argmax(pw))])
                A = f1_design(tk, freqs, deg)
                W = 1 / (SX[idx_tr][keep] / 60)
                for _it in range(5):   # rewrap
                    cx = np.linalg.lstsq(A * W[:, None], xu * W, rcond=None)[0]
                    xu = A @ cx + wrap(X[idx_tr][keep] - A @ cx)
                Ay = f1_design(tk, freqs, 0)
                Wy = 1 / (SY[idx_tr][keep] / 60)
                cy = np.linalg.lstsq(Ay * Wy[:, None], Y[idx_tr][keep] * Wy, rcond=None)[0]
                xm = f1_design(tau, freqs, deg) @ cx
                ym = f1_design(tau, freqs, 0) @ cy
                _, _, zx, zy = zres(xm, ym, idx_tr)
                nk = np.maximum(abs(zx), abs(zy)) <= 5
                if nk.sum() < 0.5 * len(nk):
                    nk = abs(zx) + abs(zy) <= np.percentile(abs(zx) + abs(zy), 80)
                if np.array_equal(nk, keep):
                    break
                keep = nk
            chi2 = np.sum(zx[keep] ** 2 + zy[keep] ** 2)
            kpar = (deg + 1) + 2 * K + 1 + 2 * K + K
            bic = chi2 + kpar * np.log(2 * keep.sum())
            if best is None or bic < best['bic']:
                best = dict(deg=deg, K=K, freqs=list(freqs), cx=cx, cy=cy, bic=bic, chi2=chi2, k=kpar,
                            nkeep=int(keep.sum()))
    return best


def F1_predict(b, tau):
    return f1_design(tau, b['freqs'], b['deg']) @ b['cx'], f1_design(tau, b['freqs'], 0) @ b['cy']


# ---------------------------------------------------------------- scoring
def score(xm, ym, idx):
    dx, dy, zx, zy = zres(xm, ym, idx)
    r = np.hypot(dx, dy)
    flag = np.maximum(abs(zx), abs(zy)) > 5
    rr = r[~flag] if (~flag).any() else r
    return dict(median_all=float(np.median(r)), rms_all=float(np.sqrt(np.mean(r ** 2))),
                median_unflagged=float(np.median(rr)), rms_unflagged=float(np.sqrt(np.mean(rr ** 2))),
                n=int(len(r)), n_flagged=int(flag.sum()), flagged_t=[float(t) for t in T[idx][flag]])


# ---------------------------------------------------------------- multistart worker
def _worker(args):
    name, p0 = args
    model = MODELS[name]
    try:
        p = np.array(p0, float)
        for W in (60, 110, 170, 1e9):     # progressive time windows around the epoch (post hoc: avoids phase aliasing)
            idx = np.where(TR & (abs(TAU) < W))[0]
            r = least_squares(resid_vec, p, args=(model, idx), loss='soft_l1', f_scale=3.0, max_nfev=300,
                              method='trf', x_scale='jac')
            p = r.x
        return float(r.cost), r.x.tolist()
    except Exception:
        return 1e30, list(p0)


def multistart(name, starts):
    with Pool(6) as pool:
        out = pool.map(_worker, [(name, s) for s in starts])
    out.sort(key=lambda z: z[0])
    return out


def finalize(name, p0):
    model = MODELS[name]
    p, keep, r = fit_clipped(model, p0, TR.copy())
    idx = np.where(keep)[0]
    J = r.jac
    chi2 = float(np.sum(r.fun ** 2))
    dof = 2 * len(idx) - len(p)
    try:
        cov = np.linalg.inv(J.T @ J) * max(1.0, chi2 / dof)
    except np.linalg.LinAlgError:
        cov = np.linalg.pinv(J.T @ J) * max(1.0, chi2 / dof)
    bic = chi2 + len(p) * np.log(2 * len(idx))
    xm, ym = model(p, TAU)
    res = dict(family=name, params=dict(zip(NAMES[name], p.tolist())),
               sigma=dict(zip(NAMES[name], np.sqrt(np.diag(cov)).tolist())),
               k=len(p), chi2=chi2, chi2_red=chi2 / dof, bic=float(bic), n_train_kept=int(len(idx)),
               train_flagged_t=[float(t) for t in T[TR & ~keep]],
               train=score(xm[TR], ym[TR], np.where(TR)[0]), heldout=score(xm[TE], ym[TE], np.where(TE)[0]))
    return res, p, cov


def main():
    t_start = time.time()
    idx_tr = np.where(TR)[0]
    f, P, ph = complex_periodogram(idx_tr)
    pk = top_peaks(f, P, k=6)
    peaks = [(float(f[j]), float(P[j]), float(ph[j])) for j in pk]
    print('complex periodogram peaks (f, power, phase):', [(round(a, 6), round(b, 3), round(c, 3)) for a, b, c in peaks])
    results, fits = {}, {}

    # F0
    starts = []
    for fr, _, phs in peaks[:4]:
        for Om in np.radians(np.arange(0, 360, 45)):
            for i0 in (0.05, -0.05):
                for k0, h0 in ((0, 0), (0.2, 0), (0, 0.2), (-0.2, 0), (0, -0.2)):
                    starts.append([2 * np.pi * fr, phs, k0, h0, i0, Om])
    ms = multistart('F0', starts)
    res, p, cov = finalize('F0', ms[0][1]); results['F0'] = res; fits['F0'] = (p, cov)
    print('F0', res['heldout'], res['chi2_red'], round(time.time() - t_start, 1))

    # F1
    b = fit_F1(idx_tr, peaks[0][0])
    xm, ym = F1_predict(b, TAU)
    results['F1'] = dict(family='F1', deg=b['deg'], K=b['K'], freqs=b['freqs'], k=b['k'], chi2=float(b['chi2']),
                         bic=float(b['bic']), n_train_kept=b['nkeep'],
                         train=score(xm[TR], ym[TR], idx_tr), heldout=score(xm[TE], ym[TE], np.where(TE)[0]))
    print('F1', b['deg'], b['K'], results['F1']['heldout'], round(time.time() - t_start, 1))

    # F2 starts: the two strongest peaks of the complex periodogram are taken as the two circular motions
    # (either can be the observer); radius ratio and node on a coarse grid; phases from peak phases +/- jitter.
    max_lat = np.radians(np.percentile(abs(Y[TR]), 95))
    starts = []
    cand = peaks[:2]
    for ia in range(len(cand)):
        for ib in range(len(cand)):
            if ia == ib:
                continue
            fo, _, pho = cand[ia]; ft, _, pht = cand[ib]
            for a2 in (0.4, 0.7, 1.3, 1.7, 2.5, 3.5):
                for Om in np.radians(np.arange(0, 360, 60)):
                    for dj in np.linspace(0, 2 * np.pi, 6, endpoint=False):
                        for djt in np.linspace(0, 2 * np.pi, 6, endpoint=False):
                            starts.append([2 * np.pi * fo, pho + dj, a2, 2 * np.pi * ft, pht + djt, max_lat / 2, Om])
    idx_w = np.where(TR & (abs(TAU) < 60))[0]
    med = [np.median(abs(resid_vec(np.array(st), m_F2, idx_w))) for st in starts]
    starts = [starts[j] for j in np.argsort(med)[:36]]
    ms = multistart('F2', starts)
    res, p, cov = finalize('F2', ms[0][1]); results['F2'] = res; fits['F2'] = (p, cov)
    print('F2', res['params'], res['heldout'], res['chi2_red'], round(time.time() - t_start, 1))

    # F3a, F3: start from best few F2 solutions with eccentricity jitter
    seeds = [s[1] for s in ms[:6]] + starts[:6]
    st = []
    for s in seeds:
        for k0, h0 in ((0, 0), (0.1, 0), (0, 0.1), (-0.1, 0), (0, -0.1)):
            st.append(list(s) + [k0, h0])
    ms3a = multistart('F3a', st)
    res, p3a, cov = finalize('F3a', ms3a[0][1]); results['F3a'] = res; fits['F3a'] = (p3a, cov)
    print('F3a', res['heldout'], res['chi2_red'], round(time.time() - t_start, 1))
    st = []
    for s in [z[1] for z in ms3a[:4]] + [p3a.tolist()]:
        for k0, h0 in ((0, 0), (0.03, 0), (0, 0.03), (-0.03, 0), (0, -0.03)):
            st.append(list(s) + [k0, h0])
    ms3 = multistart('F3', st)
    res, p3, cov = finalize('F3', ms3[0][1]); results['F3'] = res; fits['F3'] = (p3, cov)
    print('F3', res['params'], res['heldout'], res['chi2_red'], round(time.time() - t_start, 1))

    json.dump(dict(results=results, peaks=peaks, T0=T0,
                   cov={k: v[1].tolist() for k, v in fits.items()}),
              open(os.path.join(HERE, 'fit_results.json'), 'w'), indent=1)
    print('total', round(time.time() - t_start, 1), 's')


if __name__ == '__main__' and len(sys.argv) == 1:
    main()


# ---------------------------------------------------------------- summary -> MODEL.json  (python3 fit.py --summarize WINNER)
def derived(name, p):
    d = {}
    P = dict(zip(NAMES[name], p))
    if 'n_obs' in P:
        d['P_obs'] = 2 * np.pi / abs(P['n_obs'])
        d['P_tgt'] = 2 * np.pi / abs(P['n_tgt'])
        d['P_synodic'] = 2 * np.pi / abs(P['n_obs'] - P['n_tgt'])
        d['a_tgt_over_a_obs'] = P['a_tgt']
        d['kepler_exponent_lnP_over_lna'] = np.log(abs(P['n_obs'] / P['n_tgt'])) / np.log(abs(P['a_tgt']))
        d['inc_deg'] = np.degrees(P['inc'])
        d['node_deg'] = np.degrees(P['Omega']) % 360
        d['same_sense'] = float(np.sign(P['n_obs']) == np.sign(P['n_tgt']))
        if 'k_tgt' in P:
            d['e_tgt'] = np.hypot(P['k_tgt'], P['h_tgt'])
            d['varpi_tgt_deg'] = np.degrees(np.arctan2(P['h_tgt'], P['k_tgt'])) % 360
        if 'k_obs' in P:
            d['e_obs'] = np.hypot(P['k_obs'], P['h_obs'])
            d['varpi_obs_deg'] = np.degrees(np.arctan2(P['h_obs'], P['k_obs'])) % 360
    return d


def derived_sigma(name, p, cov):
    base = derived(name, p)
    keys = list(base)
    J = np.zeros((len(keys), len(p)))
    for j in range(len(p)):
        h = 1e-6 * max(1e-3, abs(p[j]))
        pp = np.array(p, float); pp[j] += h
        dd = derived(name, pp)
        for i, k in enumerate(keys):
            diff = dd[k] - base[k]
            if k.endswith('_deg'):
                diff = wrap(diff)
            J[i, j] = diff / h
    s = np.sqrt(np.einsum('ij,jk,ik->i', J, np.array(cov), J))
    return {k: [float(base[k]), float(s[i])] for i, k in enumerate(keys)}


def summarize(winner):
    R = json.load(open(os.path.join(HERE, 'fit_results.json')))
    res = R['results']
    out = {'winner': winner, 'epoch_T0': R['T0'], 'train_cut': TCUT,
           'note': 'angles in radians unless *_deg; n in rad per time unit; a in units of the observer orbit size; '
                   'sigma scaled by sqrt(chi2_red) when chi2_red > 1',
           'scores': {k: {kk: v[kk] for kk in ('k', 'chi2', 'bic', 'n_train_kept', 'train', 'heldout') if kk in v}
                      for k, v in res.items()}}
    for k in res:
        if k in MODELS:
            p = np.array(list(res[k]['params'].values()))
            out['scores'][k]['derived'] = derived_sigma(k, p, R['cov'][k])
    w = res[winner]
    out['model'] = {'family': winner, 'params': {n: [w['params'][n], w['sigma'][n]] for n in w['params']},
                    'chi2_red': w['chi2_red'], 'train_flagged_t': w['train_flagged_t'],
                    'derived': out['scores'][winner].get('derived')}
    json.dump(out, open(os.path.join(HERE, 'MODEL.json'), 'w'), indent=1)
    print(json.dumps(out['model'], indent=1))


if __name__ == '__main__' and len(sys.argv) > 2 and sys.argv[1] == '--summarize':
    summarize(sys.argv[2])
