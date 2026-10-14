"""Fit families to positions.csv per PLAN.md. numpy + scipy only."""
import json, sys, time
import numpy as np
from multiprocessing import Pool
from scipy.optimize import least_squares

HERE = __file__.rsplit('/', 1)[0] if '/' in __file__ else '.'
TCUT = 6009.989529
THR = 6.0
T0 = 3000.0  # reference epoch (round number inside training span)

d = np.genfromtxt(f'{HERE}/positions.csv', delimiter=',', names=True)
d = np.sort(d, order='t')
t = d['t']; X = np.radians(d['x_deg']); Y = np.radians(d['y_deg'])
SX = d['sx_arcmin']; SY = d['sy_arcmin']
TR = t < TCUT; HO = ~TR
U = np.c_[np.cos(X) * np.cos(Y), np.sin(X) * np.cos(Y), np.sin(Y)]


def resid_arcmin(v, idx):
    """v: predicted vectors (n,3) for rows idx -> dx, dy in arcmin."""
    xp = np.arctan2(v[:, 1], v[:, 0])
    yp = np.arctan2(v[:, 2], np.hypot(v[:, 0], v[:, 1]))
    dx = (X[idx] - xp + np.pi) % (2 * np.pi) - np.pi
    dx = np.degrees(dx) * np.cos(Y[idx]) * 60
    dy = np.degrees(Y[idx] - yp) * 60
    return dx, dy


def wres(model, p, idx):
    dx, dy = resid_arcmin(model(p, t[idx]), idx)
    return np.r_[dx / SX[idx], dy / SY[idx]]


def normres(model, p, idx):
    dx, dy = resid_arcmin(model(p, t[idx]), idx)
    return np.hypot(dx / SX[idx], dy / SY[idx]), np.hypot(dx, dy)


# ---------------- F1: harmonic series on unit vector ----------------
def make_harm(nf):
    def model(p, tt):
        c = p[:3]
        v = np.tile(c, (len(tt), 1)).astype(float)
        for j in range(nf):
            q = p[3 + 7 * j: 3 + 7 * (j + 1)]
            w = 2 * np.pi * q[0] / 1000.0
            cs, sn = np.cos(w * (tt - T0)), np.sin(w * (tt - T0))
            v = v + np.outer(cs, q[1:4]) + np.outer(sn, q[4:7])
        return v
    return model


def periodogram_peak(r, idx, fgrid):
    best, bf = -1, None
    tt = t[idx] - T0
    for i in range(0, len(fgrid), 5000):
        ff = fgrid[i:i + 5000]
        E = np.exp(2j * np.pi * np.outer(ff, tt))
        P = sum(np.abs(E @ r[:, k]) ** 2 for k in range(r.shape[1]))
        j = np.argmax(P)
        if P[j] > best:
            best, bf = P[j], ff[j]
    return bf


# ---------------- Kepler machinery ----------------
def kepler_E(M, e):
    E = M + e * np.sin(M)
    for _ in range(30):
        E = E - (E - e * np.sin(E) - M) / (1 - e * np.cos(E))
    return E


def kep_pos(tt, P, a, h, k, lam0, inc, node):
    """Signed period P (P<0 = clockwise). h=e sin(varpi), k=e cos(varpi) measured from node in orbit plane."""
    e = np.hypot(h, k); e = np.minimum(e, 0.95)
    w = np.arctan2(h, k)
    n = 2 * np.pi / P
    M = lam0 + n * (tt - T0) - w
    E = kepler_E(np.mod(M, 2 * np.pi), e)
    xo = a * (np.cos(E) - e); yo = a * np.sqrt(1 - e * e) * np.sin(E)
    cw, sw = np.cos(w), np.sin(w)
    xp = xo * cw - yo * sw; yp = xo * sw + yo * cw   # in-plane, from node line
    ci, si, cn, sn = np.cos(inc), np.sin(inc), np.cos(node), np.sin(node)
    return np.c_[xp * cn - yp * ci * sn, xp * sn + yp * ci * cn, yp * si]


# F2: one Kepler orbit about the observer: p = P, h, k, lam0, inc, node
def mod_f2(p, tt):
    return kep_pos(tt, p[0], 1.0, p[1], p[2], p[3], p[4], p[5])


# F3: observer (Po, ho, ko, lamo) in plane z=0; object (Pb, ab, hb, kb, lamb, inc, node)
def mod_f3(p, tt):
    ro = kep_pos(tt, p[0], 1.0, p[1], p[2], p[3], 0.0, 0.0)
    rb = kep_pos(tt, p[4], p[5], p[6], p[7], p[8], p[9], p[10])
    return rb - ro


# F3c: circular orbits: Po, lamo, Pb, ab, lamb, inc, node
def mod_f3c(p, tt):
    return mod_f3(np.r_[p[0], 0, 0, p[1], p[2], p[3], 0, 0, p[4], p[5], p[6]], tt)


# ---------------- fitting with outlier rule ----------------
def robust_then_clean(model, p0, bounds=(-np.inf, np.inf)):
    idx = np.where(TR)[0]
    s = least_squares(lambda p: wres(model, p, idx), p0, loss='soft_l1', f_scale=3, bounds=bounds,
                      max_nfev=1500, x_scale='jac')
    p = s.x
    keep = TR.copy()
    for _ in range(3):
        nr, _ = normres(model, p, np.arange(len(t)))
        newkeep = TR & (nr <= THR)
        if newkeep.sum() < 0.8 * TR.sum():  # post hoc guard: model too poor for flags to mean slips
            newkeep = TR.copy()
        idx = np.where(newkeep)[0]
        s = least_squares(lambda q: wres(model, q, idx), p, bounds=bounds, max_nfev=1500, x_scale='jac')
        p = s.x
        if np.array_equal(newkeep, keep):
            break
        keep = newkeep
    return p, s, keep


def score(name, model, p, s, keep):
    k = len(p)
    idx = np.where(keep)[0]
    nr, ang = normres(model, p, np.arange(len(t)))
    chi2 = float(np.sum(wres(model, p, idx) ** 2))
    n = len(idx)
    hok = HO & (nr <= THR)
    out = dict(family=name, k=k, n_train_clean=int(n), n_train_flagged=int(TR.sum() - n),
               chi2=chi2, red_chi2=chi2 / (2 * n - k), BIC=chi2 + k * np.log(2 * n),
               in_median=float(np.median(ang[keep])), in_rms=float(np.sqrt(np.mean(ang[keep] ** 2))),
               ho_median_all=float(np.median(ang[HO])), ho_rms_all=float(np.sqrt(np.mean(ang[HO] ** 2))),
               ho_median_clean=float(np.median(ang[hok])) if hok.any() else None,
               ho_rms_clean=float(np.sqrt(np.mean(ang[hok] ** 2))) if hok.any() else None,
               n_ho=int(HO.sum()), n_ho_flagged=int(HO.sum() - hok.sum()),
               flagged_t=[float(v) for v in t[(nr > THR)]])
    out['fails_prediction'] = bool(out['ho_median_all'] > 3 * out['in_median'])
    return out


def cov_sigma(s, red):
    J = s.jac
    C = np.linalg.pinv(J.T @ J)
    return np.sqrt(np.diag(C)) * np.sqrt(max(red, 1.0))


# ---------------- F1 driver ----------------
def fit_f1():
    fgrid = np.linspace(0.02, 5.0, 60000)  # cycles per 1000 t units
    idx = np.where(TR)[0]
    p = U[TR].mean(0)
    best = None
    nf = 0
    while nf < 6:
        model = make_harm(nf)
        r = U[idx] - model(p, t[idx])
        f = periodogram_peak(r, idx, fgrid / 1000.0) * 1000.0
        p_try = np.r_[p, f, np.zeros(6)]
        m2 = make_harm(nf + 1)
        # linear amplitudes start: quick linear lsq on the vector residual
        w = 2 * np.pi * f / 1000.0
        A = np.c_[np.cos(w * (t[idx] - T0)), np.sin(w * (t[idx] - T0))]
        coef, *_ = np.linalg.lstsq(A, r, rcond=None)
        p_try[-6:-3] = coef[0]; p_try[-3:] = coef[1]
        pf, s, keep = robust_then_clean(m2, p_try)
        sc = score(f'F1_harm{nf + 1}', m2, pf, s, keep)
        print(f"  F1 nf={nf + 1} f={f:.4f}/1000 BIC={sc['BIC']:.1f} in_med={sc['in_median']:.2f} "
              f"ho_med={sc['ho_median_all']:.2f}", flush=True)
        if best is not None and sc['BIC'] >= best[0]['BIC']:
            break
        best = (sc, pf, s, keep, m2)
        p = pf; nf += 1
    return best


# ---------------- multistart workers ----------------
def _ms_f3c(p0):
    try:
        idx = np.where(TR)[0]
        s = least_squares(lambda p: wres(mod_f3c, p, idx), p0, loss='soft_l1', f_scale=3, max_nfev=3000,
                          x_scale='jac')
        return float(np.sum(np.minimum(s.fun ** 2, 36))), s.x
    except Exception:
        return np.inf, p0


def _ms_f2(p0):
    try:
        idx = np.where(TR)[0]
        s = least_squares(lambda p: wres(mod_f2, p, idx), p0, loss='soft_l1', f_scale=3, max_nfev=3000,
                          x_scale='jac')
        return float(np.sum(np.minimum(s.fun ** 2, 36))), s.x
    except Exception:
        return np.inf, p0


def _ms_f3(p0):
    try:
        idx = np.where(TR)[0]
        s = least_squares(lambda p: wres(mod_f3, p, idx), p0, loss='soft_l1', f_scale=3, max_nfev=4000,
                          x_scale='jac')
        return float(np.sum(np.minimum(s.fun ** 2, 36))), s.x
    except Exception:
        return np.inf, p0


def top_periods(nmax=6):
    """Peaks of the weighted periodogram of the in-plane unit vector (training rows)."""
    idx = np.where(TR)[0]
    f = np.linspace(1 / 20000, 1 / 50, 200000)
    r = U[idx, :2] - U[idx, :2].mean(0)
    tt = t[idx] - T0
    P = np.zeros_like(f)
    for i in range(0, len(f), 20000):
        E = np.exp(2j * np.pi * np.outer(f[i:i + 20000], tt))
        P[i:i + 20000] = np.abs(E @ r[:, 0]) ** 2 + np.abs(E @ r[:, 1]) ** 2
    pk = []
    for i in np.argsort(P)[::-1]:
        if all(abs(f[i] - f[j]) > 3e-5 for j in pk):
            pk.append(i)
        if len(pk) >= nmax:
            break
    return [1 / f[i] for i in pk]


if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] == 'f1':
    sc, pf, s, keep, m = fit_f1()
    np.save(f'{HERE}/_f1.npy', {'F1_harmonic': (pf, cov_sigma(s, sc['red_chi2']), sc)}, allow_pickle=True)
    print('F1', {k: sc[k] for k in ('k', 'BIC', 'in_median', 'ho_median_all', 'ho_rms_clean')}, flush=True)
    sys.exit(0)
if __name__ == '__main__':
    t_start = time.time()
    results = {}
    winners = {}

    print('periodogram peaks:', top_periods(), flush=True)
    peaks = top_periods(8)
    slow = [p for p in peaks if p > 2000][:2]
    fast = [p for p in peaks if p < 2000][:2]
    print('slow', slow, 'fast', fast, flush=True)


    rng = np.random.default_rng(1)
    pool = Pool(6)

    # F2: single Kepler orbit around observer; period starts from periodogram peaks (both senses)
    starts = []
    for P in slow + fast:
        for sg in (1, -1):
            for lam in np.linspace(0, 2 * np.pi, 6, endpoint=False):
                starts.append(np.r_[sg * P, 0.05 * rng.standard_normal(2), lam, 0.03, rng.uniform(0, 2 * np.pi)])
    out = pool.map(_ms_f2, starts)
    p0 = min(out, key=lambda z: z[0])[1]
    pf, s, keep = robust_then_clean(mod_f2, p0)
    sc = score('F2_kepler_geocentric', mod_f2, pf, s, keep)
    results['F2_kepler_geocentric'] = sc; winners['F2_kepler_geocentric'] = (pf, s, sc, mod_f2)
    print('F2', {k: sc[k] for k in ('BIC', 'in_median', 'ho_median_all', 'ho_rms_clean')}, flush=True)

    # F3c: circular two-orbit. Seeds from a vectorised phase/size grid on longitude only (post hoc: the
    # random-phase multistart of the first run never converged).
    idx = np.where(TR)[0]; tt = t[idx] - T0
    syn = [p for p in peaks if p < 2000][:3]
    starts = []
    agrid = np.exp(np.linspace(np.log(0.1), np.log(10), 16))
    ph = np.linspace(0, 2 * np.pi, 24, endpoint=False)
    for Ps in slow:
        for Psyn in syn:
            other = 1 / (1 / Psyn + 1 / Ps)
            other2 = 1 / abs(1 / Psyn - 1 / Ps)
            for Po, Pb in ((other, Ps), (Ps, other), (other2, Ps), (Ps, other2)):
                for sg in (1, -1):
                    no, nb = sg * 2 * np.pi / Po, sg * 2 * np.pi / Pb
                    A, LO, LB = np.meshgrid(agrid, ph, ph, indexing='ij')
                    A = A.ravel()[:, None]; LO = LO.ravel()[:, None]; LB = LB.ravel()[:, None]
                    vx = A * np.cos(LB + nb * tt) - np.cos(LO + no * tt)
                    vy = A * np.sin(LB + nb * tt) - np.sin(LO + no * tt)
                    dl = (X[idx] - np.arctan2(vy, vx) + np.pi) % (2 * np.pi) - np.pi
                    cost = np.median(np.abs(dl), axis=1)
                    for j in np.argsort(cost)[:3]:
                        for node in (0.0, np.pi / 2, np.pi, 1.5 * np.pi):
                            starts.append((cost[j], np.r_[sg * Po, LO[j, 0], sg * Pb, A[j, 0], LB[j, 0], 0.03, node]))
    starts.sort(key=lambda z: z[0])
    print('grid seed costs (deg)', [round(np.degrees(c), 2) for c, _ in starts[:8]], flush=True)
    starts = [p for _, p in starts[:96]]
    print('F3c starts', len(starts), flush=True)
    out = pool.map(_ms_f3c, starts, chunksize=8)
    out.sort(key=lambda z: z[0])
    print('F3c best costs', [round(o[0], 1) for o in out[:5]], flush=True)
    p0 = out[0][1]
    pf, s, keep = robust_then_clean(mod_f3c, p0)
    sc = score('F3c_two_circular', mod_f3c, pf, s, keep)
    results['F3c_two_circular'] = sc; winners['F3c_two_circular'] = (pf, s, sc, mod_f3c)
    print('F3c', pf, {k: sc[k] for k in ('BIC', 'in_median', 'ho_median_all', 'ho_rms_clean')}, flush=True)

    # F3: eccentric, starts from F3c with small random e-vectors
    c = pf
    starts = []
    for o in out[:3]:
        c = o[1]
        for _ in range(8):
            starts.append(np.r_[c[0], 0.05 * rng.standard_normal(2), c[1], c[2], c[3],
                                0.05 * rng.standard_normal(2), c[4], c[5], c[6]])
    out3 = pool.map(_ms_f3, starts, chunksize=4)
    p0 = min(out3, key=lambda z: z[0])[1]
    pf, s, keep = robust_then_clean(mod_f3, p0)
    sc = score('F3_two_kepler', mod_f3, pf, s, keep)
    results['F3_two_kepler'] = sc; winners['F3_two_kepler'] = (pf, s, sc, mod_f3)
    print('F3', pf, {k: sc[k] for k in ('BIC', 'in_median', 'ho_median_all', 'ho_rms_clean')}, flush=True)
    pool.close()
    np.save(f'{HERE}/_params.npy', {k: (v[0], cov_sigma(v[1], v[2]['red_chi2'])) for k, v in winners.items()},
            allow_pickle=True)
    json.dump(results, open(f'{HERE}/_scores.json', 'w'), indent=1)
    print(json.dumps(results, indent=1))
    print('elapsed', time.time() - t_start)
